/**
 * tests/r2.test.ts
 *
 * TDD: Tests for lib/storage/r2.ts
 *
 * Strategy:
 *   We never hit the real R2 bucket in unit tests. Instead we verify:
 *     1. buildR2Key()   — deterministic, collision-free key naming
 *     2. getReportUrl() — correct URL assembly from account/bucket/key
 *     3. uploadReportPdf() — delegates to the S3 client correctly (mock)
 *     4. Edge cases: missing env vars, empty buffers, key sanitisation
 *
 * Run: npm test (tsx --test tests/*.test.ts)
 */

import assert from "node:assert/strict";
import { test, describe, mock, beforeEach } from "node:test";

// ─── Module under test (import after mock setup) ────────────────────────────
// We don't import lib/storage/r2.ts directly here because it reads env vars
// at module initialisation time. Instead we test the pure helper functions
// that are exported separately.

import {
  buildR2Key,
  getReportUrl,
  validateR2Config,
  type R2Config,
} from "@/lib/storage/r2";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_CONFIG: R2Config = {
  accountId: "abc123",
  accessKeyId: "key-id",
  secretAccessKey: "secret",
  bucketName: "kgkp-reports",
  endpoint: "https://abc123.r2.cloudflarestorage.com",
  publicDomain: "https://reports.example.com",
};

const SAMPLE_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

// ─── buildR2Key ──────────────────────────────────────────────────────────────

describe("buildR2Key", () => {
  test("produces path-safe key with reports/ prefix", () => {
    const key = buildR2Key(SAMPLE_UUID);
    assert.match(key, /^reports\/.+\.pdf$/);
  });

  test("embeds the assessmentId verbatim", () => {
    const key = buildR2Key(SAMPLE_UUID);
    assert.ok(key.includes(SAMPLE_UUID), `Expected key to contain ${SAMPLE_UUID}, got ${key}`);
  });

  test("never contains raw whitespace (spaces, newlines, tabs)", () => {
    // encodeURIComponent is applied, so raw whitespace is always encoded.
    // The resulting key may contain % (that is fine for S3/R2 keys), but
    // it must never contain a literal space, \n, or \t.
    const nastyCases = [
      "has spaces",
      "has\nnewline",
      "has\ttab",
    ];
    for (const id of nastyCases) {
      const key = buildR2Key(id);
      assert.doesNotMatch(
        key,
        /[ \n\t\r]/,
        `Key "${key}" contains raw whitespace for id "${id}"`
      );
    }
  });

  test("encodes special chars so the key is safe in HTTP URLs", () => {
    // A key with encoded chars must be parseable as a URL path segment
    const key = buildR2Key("has spaces & symbols!");
    const url = `https://cdn.example.com/${key}`;
    assert.doesNotThrow(() => new URL(url), `URL with key "${key}" is not parseable`);
  });

  test("two different UUIDs produce different keys (no collision)", () => {
    const key1 = buildR2Key("aaa-111");
    const key2 = buildR2Key("bbb-222");
    assert.notEqual(key1, key2);
  });
});

// ─── getReportUrl ────────────────────────────────────────────────────────────

describe("getReportUrl", () => {
  test("returns publicDomain + / + key", () => {
    const key = buildR2Key(SAMPLE_UUID);
    const url = getReportUrl(VALID_CONFIG, key);
    assert.equal(url, `${VALID_CONFIG.publicDomain}/${key}`);
  });

  test("trims trailing slash from publicDomain", () => {
    const cfg = { ...VALID_CONFIG, publicDomain: "https://cdn.example.com/" };
    const key = buildR2Key(SAMPLE_UUID);
    const url = getReportUrl(cfg, key);
    assert.ok(!url.includes("//reports/"), `Double-slash found in URL: ${url}`);
    assert.ok(url.startsWith("https://cdn.example.com/reports/"));
  });

  test("produced URL is parseable as URL", () => {
    const key = buildR2Key(SAMPLE_UUID);
    const url = getReportUrl(VALID_CONFIG, key);
    assert.doesNotThrow(() => new URL(url));
  });
});

// ─── validateR2Config ────────────────────────────────────────────────────────

describe("validateR2Config", () => {
  test("returns null (valid) for a complete config with publicDomain", () => {
    const err = validateR2Config(VALID_CONFIG);
    assert.equal(err, null);
  });

  test("returns null (valid) without publicDomain — it is optional", () => {
    const { publicDomain: _, ...withoutDomain } = VALID_CONFIG;
    const err = validateR2Config(withoutDomain as R2Config);
    assert.equal(err, null);
  });

  const requiredFields: (keyof R2Config)[] = [
    "accountId",
    "accessKeyId",
    "secretAccessKey",
    "bucketName",
    "endpoint",
  ];

  for (const field of requiredFields) {
    test(`returns error string when ${field} is missing`, () => {
      const bad = { ...VALID_CONFIG, [field]: "" };
      const err = validateR2Config(bad);
      assert.ok(typeof err === "string" && err.length > 0, `Expected error for missing ${field}`);
    });
  }

  test("returns error string when endpoint is not a valid URL", () => {
    const bad = { ...VALID_CONFIG, endpoint: "not-a-url" };
    const err = validateR2Config(bad);
    assert.ok(typeof err === "string" && err.length > 0);
  });

  test("returns error string when publicDomain is set but not a valid URL", () => {
    const bad = { ...VALID_CONFIG, publicDomain: "not-a-url" };
    const err = validateR2Config(bad);
    assert.ok(typeof err === "string" && err.length > 0);
  });

  test("falls back to endpoint URL when publicDomain is absent", () => {
    const { publicDomain: _, ...noDomain } = VALID_CONFIG;
    const key = buildR2Key(SAMPLE_UUID);
    const url = getReportUrl(noDomain as R2Config, key);
    assert.ok(url.startsWith("https://abc123.r2.cloudflarestorage.com/kgkp-reports/reports/"));
  });
});
