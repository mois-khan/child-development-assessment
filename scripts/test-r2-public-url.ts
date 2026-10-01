/**
 * scripts/test-r2-public-url.ts
 *
 * Uploads a tiny file, then fetches it via the R2_PUBLIC_DOMAIN URL
 * to confirm the bucket has public access enabled and the domain resolves.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-r2-public-url.ts
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  const endpoint     = process.env.R2_ENDPOINT          ?? "";
  const accessKeyId  = process.env.R2_ACCESS_KEY_ID     ?? "";
  const secretKey    = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucket       = process.env.R2_BUCKET_REPORTS    ?? "";
  const publicDomain = (process.env.R2_PUBLIC_DOMAIN    ?? "").replace(/\/$/, "");

  if (!publicDomain) {
    console.error("✖ R2_PUBLIC_DOMAIN is not set.");
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });

  const key     = `_test/public-access-check-${Date.now()}.txt`;
  const content = "public-access-ok";
  const url     = `${publicDomain}/${key}`;

  // 1. Upload
  console.log(`\nUploading test object: ${key}`);
  await client.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        content,
    ContentType: "text/plain",
  }));
  console.log("  ✔ PutObject succeeded");

  // 2. Fetch via public URL
  console.log(`\nFetching via public URL:\n  ${url}`);
  let fetchOk = false;
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await res.text();
    if (res.ok && body.trim() === content) {
      console.log(`  ✔ HTTP ${res.status} — body matches ("${body.trim()}")`);
      fetchOk = true;
    } else if (res.status === 403 || res.status === 401) {
      console.error(`  ✖ HTTP ${res.status} — bucket public access is NOT enabled.`);
      console.error("    → Go to Cloudflare R2 dashboard → kgkp-reports → Settings → Public Access → Enable");
    } else {
      console.error(`  ✖ HTTP ${res.status} — unexpected response: ${body.slice(0, 200)}`);
    }
  } catch (err: any) {
    console.error(`  ✖ Fetch failed: ${err.message}`);
  }

  // 3. Cleanup
  console.log(`\nCleaning up test object…`);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log("  ✔ Deleted");

  // 4. Summary
  console.log("\n═══════════════════════════════════════════════════");
  if (fetchOk) {
    console.log("  ✔  PUBLIC ACCESS WORKING");
    console.log(`     PDFs stored at this domain will be accessible to parents:`);
    console.log(`     ${publicDomain}/reports/<assessmentId>.pdf`);
    console.log("     Full R2 integration is ready to use!\n");
    process.exit(0);
  } else {
    console.error("  ✖  PUBLIC ACCESS NOT WORKING — see error above\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
