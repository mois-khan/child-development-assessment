/**
 * lib/storage/r2.ts
 *
 * Cloudflare R2 storage integration for immutable report PDF snapshots.
 *
 * Architecture decision:
 *   Reports are frozen at the moment of assessment completion. Once
 *   `report_pdf_url` is written to the `assessments` table it MUST NOT
 *   change — even if scoring logic, design, or CMS content changes later.
 *
 * This module exposes:
 *   - Pure helper functions (buildR2Key, getReportUrl, validateR2Config)
 *     — fully unit-testable, zero network I/O.
 *   - uploadReportPdf()
 *     — the single side-effectful function; reads env vars at call time so
 *       it is safe to import at module level in Next.js edge/server routes.
 *
 * Dependencies:
 *   @aws-sdk/client-s3  (Cloudflare R2 is S3-compatible)
 *
 * Required env vars (server-side only, never expose to client):
 *   R2_ACCOUNT_ID          — Cloudflare account ID
 *   R2_ACCESS_KEY_ID       — R2 API token "Access Key ID"
 *   R2_SECRET_ACCESS_KEY   — R2 API token "Secret Access Key"
 *   R2_BUCKET_REPORTS      — Bucket name (e.g. "kgkp-reports")
 *   R2_ENDPOINT            — Full S3 endpoint URL (e.g. "https://<id>.r2.cloudflarestorage.com")
 *   R2_PUBLIC_DOMAIN       — (Optional) Public custom domain for the bucket.
 *                            If not set, falls back to R2_ENDPOINT + "/" + key
 *                            (objects must still be public via R2 bucket settings).
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  /** Direct S3-compatible endpoint URL, e.g. "https://<accountId>.r2.cloudflarestorage.com" */
  endpoint: string;
  /**
   * Optional public-facing domain for the bucket.
   * If not set, the endpoint URL is used to construct the object URL.
   * Example: "https://reports.kaushalya.in"
   */
  publicDomain?: string;
}

export interface UploadResult {
  /** Publicly accessible URL of the stored PDF */
  url: string;
  /** The R2 object key, e.g. "reports/<uuid>.pdf" */
  key: string;
}

// ─── Pure helpers (unit-testable, no I/O) ─────────────────────────────────────

/**
 * Build the R2 object key for a given assessment ID.
 *
 * Format: `reports/<assessmentId>.pdf`
 *
 * The assessmentId is URL-encoded to eliminate any chars that are
 * technically allowed in S3 keys but cause trouble in HTTP URLs (spaces,
 * %, etc.). In practice assessment IDs are UUIDs, so encoding is a no-op —
 * but defensive programming protects against future changes.
 */
export function buildR2Key(assessmentId: string): string {
  const safe = encodeURIComponent(assessmentId).replace(/%20/g, "-");
  return `reports/${safe}.pdf`;
}

/**
 * Assemble the public URL for a stored R2 object.
 *
 * If publicDomain is set, uses that. Otherwise falls back to:
 *   endpoint + "/" + bucketName + "/" + key
 *
 * Trims any trailing slash to avoid double-slashes.
 */
export function getReportUrl(config: R2Config, key: string): string {
  if (config.publicDomain) {
    const domain = config.publicDomain.replace(/\/$/, "");
    return `${domain}/${key}`;
  }
  // Fall back: endpoint-style URL (e.g. for private dev/staging access)
  const endpoint = config.endpoint.replace(/\/$/, "");
  return `${endpoint}/${config.bucketName}/${key}`;
}

/**
 * Validate the R2 config, returning null on success or an error message.
 *
 * This is a pure function — useful both at runtime and in tests.
 */
export function validateR2Config(config: R2Config): string | null {
  const required: (keyof R2Config)[] = [
    "accountId",
    "accessKeyId",
    "secretAccessKey",
    "bucketName",
    "endpoint",
  ];

  for (const field of required) {
    if (!config[field]) {
      return `R2 config missing required field: ${field}`;
    }
  }

  try {
    new URL(config.endpoint);
  } catch {
    return `R2 config 'endpoint' is not a valid URL: "${config.endpoint}"`;
  }

  if (config.publicDomain) {
    try {
      new URL(config.publicDomain);
    } catch {
      return `R2 config 'publicDomain' is not a valid URL: "${config.publicDomain}"`;
    }
  }

  return null;
}

// ─── R2 config from environment ───────────────────────────────────────────────

/**
 * Read R2 config from environment variables.
 * Matches the actual keys in .env.local:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_REPORTS, R2_ENDPOINT, R2_PUBLIC_DOMAIN (optional)
 */
export function getR2ConfigFromEnv(): R2Config {
  return {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucketName: process.env.R2_BUCKET_REPORTS ?? "",
    endpoint:
      process.env.R2_ENDPOINT ??
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : ""),
    publicDomain: process.env.R2_PUBLIC_DOMAIN || undefined,
  };
}

// ─── S3 client factory ────────────────────────────────────────────────────────

function makeS3Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a PDF buffer to Cloudflare R2 and return its public URL.
 *
 * @param assessmentId  Used to derive the R2 object key
 * @param pdfBuffer     The raw PDF bytes
 * @param config        Optional — defaults to env vars (for testability)
 *
 * @throws if env vars are missing or the S3 PutObject command fails.
 */
export async function uploadReportPdf(
  assessmentId: string,
  pdfBuffer: Buffer,
  config?: R2Config
): Promise<UploadResult> {
  const cfg = config ?? getR2ConfigFromEnv();

  const validationError = validateR2Config(cfg);
  if (validationError) {
    throw new Error(`[R2] ${validationError}`);
  }

  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("[R2] PDF buffer is empty — refusing to upload.");
  }

  const key = buildR2Key(assessmentId);
  const client = makeS3Client(cfg);

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      // Make object publicly readable via the custom domain
      // (Bucket must have "Allow Public Access" enabled via R2 dashboard)
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: `inline; filename="report-${assessmentId}.pdf"`,
    })
  );

  const url = getReportUrl(cfg, key);
  return { url, key };
}
