/**
 * scripts/test-r2-connection.ts
 *
 * Live end-to-end connectivity test for Cloudflare R2.
 * Reads credentials from .env.local, then:
 *   1. Uploads a tiny test object  → PutObject
 *   2. Verifies it exists          → HeadObject
 *   3. Constructs the access URL
 *   4. Deletes it                  → DeleteObject
 *   5. Confirms deletion           → HeadObject (expect 404)
 *
 * Run:  npx tsx --env-file=.env.local scripts/test-r2-connection.ts
 *
 * Exit code 0 = all good | Exit code 1 = something failed
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function pass(msg: string) { console.log(`  ✔ ${msg}`); }
function fail(msg: string) { console.error(`  ✖ ${msg}`); }

async function main() {
  // ─── Read env ────────────────────────────────────────────────────────────────

  const accountId    = process.env.R2_ACCOUNT_ID        ?? "";
  const accessKeyId  = process.env.R2_ACCESS_KEY_ID     ?? "";
  const secretKey    = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const endpoint     = process.env.R2_ENDPOINT          ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket       = process.env.R2_BUCKET_REPORTS    ?? "";
  const publicDomain = process.env.R2_PUBLIC_DOMAIN     ?? null;

  // ─── Pre-flight checks ──────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  R2 Credential Pre-flight Check");
  console.log("═══════════════════════════════════════════════════");

  let preflight = true;
  function check(label: string, value: string) {
    if (!value) {
      console.error(`  ✖ MISSING  ${label}`);
      preflight = false;
    } else {
      console.log(`  ✔ PRESENT  ${label} = ${value.slice(0, 8)}…`);
    }
  }

  check("R2_ACCOUNT_ID",        accountId);
  check("R2_ACCESS_KEY_ID",     accessKeyId);
  check("R2_SECRET_ACCESS_KEY", secretKey);
  check("R2_ENDPOINT",          endpoint);
  check("R2_BUCKET_REPORTS",    bucket);

  if (publicDomain) {
    console.log(`  ✔ OPTIONAL  R2_PUBLIC_DOMAIN = ${publicDomain}`);
  } else {
    console.log(`  ℹ OPTIONAL  R2_PUBLIC_DOMAIN = (not set — URL will use endpoint)`);
  }

  if (!preflight) {
    console.error("\n✖ One or more required credentials are missing. Aborting.\n");
    process.exit(1);
  }

  // ─── S3 Client ───────────────────────────────────────────────────────────────

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });

  const TEST_KEY     = `_test/r2-connection-probe-${Date.now()}.txt`;
  const TEST_CONTENT = `R2 connectivity test — ${new Date().toISOString()}`;

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Live R2 Connectivity Test");
  console.log(`  Bucket   : ${bucket}`);
  console.log(`  Endpoint : ${endpoint}`);
  console.log(`  Test key : ${TEST_KEY}`);
  console.log("═══════════════════════════════════════════════════\n");

  let allPassed = true;

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  console.log("Step 1: PutObject (upload test file)…");
  try {
    await client.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         TEST_KEY,
      Body:        TEST_CONTENT,
      ContentType: "text/plain",
    }));
    pass("PutObject succeeded");
  } catch (err: any) {
    fail(`PutObject FAILED: ${err.message}`);
    console.error("\n  ➜ Common causes:");
    console.error("    - Wrong access key or secret key");
    console.error("    - API token missing 'Object Write' permission");
    console.error("    - Bucket name wrong or bucket doesn't exist");
    console.error(`\n  Full error:\n${err.stack ?? err}\n`);
    process.exit(1);
  }

  // ── Step 2: Verify exists ───────────────────────────────────────────────────
  console.log("\nStep 2: HeadObject (verify file was stored)…");
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: TEST_KEY }));
    pass(`HeadObject succeeded — size: ${head.ContentLength}B, ETag: ${head.ETag}`);
  } catch (err: any) {
    fail(`HeadObject FAILED: ${err.message}`);
    allPassed = false;
  }

  // ── Step 3: URL ─────────────────────────────────────────────────────────────
  console.log("\nStep 3: URL construction…");
  const objectUrl = publicDomain
    ? `${publicDomain.replace(/\/$/, "")}/${TEST_KEY}`
    : `${endpoint.replace(/\/$/, "")}/${bucket}/${TEST_KEY}`;
  pass(`Object URL would be: ${objectUrl}`);
  if (!publicDomain) {
    console.log("         ℹ  Set R2_PUBLIC_DOMAIN to use a custom domain instead.");
  }

  // ── Step 4: Delete ──────────────────────────────────────────────────────────
  console.log("\nStep 4: DeleteObject (cleanup test file)…");
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: TEST_KEY }));
    pass("DeleteObject succeeded");
  } catch (err: any) {
    fail(`DeleteObject FAILED: ${err.message}`);
    allPassed = false;
  }

  // ── Step 5: Confirm deletion ────────────────────────────────────────────────
  console.log("\nStep 5: HeadObject post-delete (expect 404)…");
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: TEST_KEY }));
    fail("HeadObject should have thrown NotFound — object was NOT deleted");
    allPassed = false;
  } catch (err: any) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === "NotFound" || err?.name === "NoSuchKey") {
      pass("Object confirmed deleted (404 as expected)");
    } else {
      fail(`Unexpected error after deletion: ${err.message}`);
      allPassed = false;
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════");
  if (allPassed) {
    console.log("  ✔  ALL CHECKS PASSED");
    console.log("     R2 credentials are correct and bucket is accessible.");
    if (!publicDomain) {
      console.log("\n  ⚠  ACTION NEEDED: R2_PUBLIC_DOMAIN is not set.");
      console.log("     Reports will be stored, but parents cannot access them");
      console.log("     via a public URL until you either:");
      console.log("     a) Enable public access on the R2 bucket dashboard, OR");
      console.log("     b) Add a custom domain and set R2_PUBLIC_DOMAIN in .env.local");
    }
    console.log("");
    process.exit(0);
  } else {
    console.error("  ✖  SOME CHECKS FAILED — see errors above\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nUnhandled error:", err);
  process.exit(1);
});
