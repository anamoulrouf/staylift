/**
 * Phase A–C building blocks: encryption, contact rules, consent wording, roles, QR.
 * Run: node --experimental-strip-types --test src/lib/staylift/privacy.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isRelayEmail, maskEmail, maskPhone, normalizeEmail, normalizePhone, initials } from "./contact.ts";
import { consentWording, marketFor, otaRetention } from "./markets.ts";
import { encodeQr, qrSvg } from "./qr.ts";
import { atLeast, can } from "./roles.ts";
import { blindIndex, decrypt, encrypt, keyStatus, randomCode, randomToken, resetVaultForTests } from "./vault.ts";

test("encrypt/decrypt round trip; ciphertext is randomised and tamper-evident", async () => {
  delete process.env.DATABASE_URL;
  delete process.env.STAYLIFT_DATA_KEY;
  resetVaultForTests();
  assert.equal((await keyStatus()).mode, "dev");
  const a = await encrypt("maya@example.com");
  const b = await encrypt("maya@example.com");
  assert.notEqual(a, b, "random IV");
  assert.ok(a.startsWith("v1.") && !a.includes("maya"));
  assert.equal(await decrypt(a), "maya@example.com");
  const parts = a.split(".");
  const flipped = parts[3]!.slice(0, -2) + (parts[3]!.endsWith("A") ? "B" : "A") + parts[3]!.slice(-1);
  await assert.rejects(decrypt([...parts.slice(0, 3), flipped].join(".")));
});

test("blind index is stable per key and differs across keys", async () => {
  delete process.env.STAYLIFT_DATA_KEY;
  resetVaultForTests();
  const dev = await blindIndex("maya@example.com");
  assert.equal(dev, await blindIndex("maya@example.com"));
  assert.notEqual(dev, await blindIndex("maya@example.org"));
  process.env.STAYLIFT_DATA_KEY = Buffer.alloc(32, 7).toString("base64");
  resetVaultForTests();
  assert.equal((await keyStatus()).mode, "configured");
  assert.notEqual(await blindIndex("maya@example.com"), dev);
});

test("key rotation: values sealed under the previous key still open", async () => {
  process.env.STAYLIFT_DATA_KEY = Buffer.alloc(32, 1).toString("base64");
  resetVaultForTests();
  const old = await encrypt("+15125550199");
  process.env.STAYLIFT_DATA_KEY_PREVIOUS = process.env.STAYLIFT_DATA_KEY;
  process.env.STAYLIFT_DATA_KEY = Buffer.alloc(32, 2).toString("base64");
  resetVaultForTests();
  assert.equal(await decrypt(old), "+15125550199");
  assert.equal((await keyStatus()).rotating, true);
  delete process.env.STAYLIFT_DATA_KEY_PREVIOUS;
  resetVaultForTests();
  await assert.rejects(decrypt(old), /no longer configured/);
});

test("a real database without a key refuses to store contacts", async () => {
  delete process.env.STAYLIFT_DATA_KEY;
  process.env.DATABASE_URL = "postgres://example";
  resetVaultForTests();
  await assert.rejects(encrypt("x"), /STAYLIFT_DATA_KEY/);
  assert.equal((await keyStatus()).mode, "missing");
  delete process.env.DATABASE_URL;
  resetVaultForTests();
});

test("codes and tokens", () => {
  for (let i = 0; i < 200; i += 1) assert.match(randomCode(), /^\d{6}$/);
  const t = randomToken(18);
  assert.equal(t.length, 24);
  assert.match(t, /^[A-Za-z0-9_-]+$/);
});

test("contact rules", () => {
  assert.equal(normalizeEmail("  Maya.K@Example.COM "), "maya.k@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
  assert.equal(isRelayEmail("abc123@guest.booking.com"), true);
  assert.equal(isRelayEmail("maya@gmail.com"), false);
  assert.equal(normalizePhone("(512) 555-0199", "US"), "+15125550199");
  assert.equal(normalizePhone("07700 900123", "UK"), "+447700900123");
  assert.equal(normalizePhone("050 123 4567", "AE"), "+971501234567");
  assert.equal(normalizePhone("0151 2345678", "EU"), null, "EU needs a country code");
  assert.equal(normalizePhone("+49 151 2345678", "EU"), "+491512345678");
  assert.equal(normalizePhone("+1 000 000 0000", "US"), null, "placeholder");
  assert.equal(normalizePhone("+1 512 345 6789", "US"), null, "sequential placeholder");
  assert.equal(maskEmail("maya.kapoor@example.com"), "m•••••@example.com");
  assert.equal(maskPhone("+15125550199"), "+•• •••• ••99");
  assert.equal(initials("Maya Kapoor"), "M. K.");
});

test("consent wording names the hotel and flags special-category data where the law needs it", () => {
  const us = consentWording("profile_memory", "The Marlowe", marketFor("US"));
  const eu = consentWording("profile_memory", "The Marlowe", marketFor("EU"));
  assert.ok(us.includes("The Marlowe") && !us.includes("religion"));
  assert.ok(eu.includes("religion or culture"));
  assert.equal(otaRetention("Booking.com")?.verified, true);
  assert.equal(otaRetention("Agoda")?.verified, false);
  assert.equal(otaRetention("Direct"), null);
});

test("roles", () => {
  assert.ok(atLeast("owner", "manager"));
  assert.ok(!atLeast("front_desk", "manager"));
  assert.ok(can("front_desk", "runDeskTablet"));
  assert.ok(!can("front_desk", "revealContacts"));
  assert.ok(can("manager", "revealContacts"));
  assert.ok(!can("manager", "viewAudit"));
  assert.ok(can("owner", "manageTeam"));
});

test("QR structure: version size, finder patterns, quiet zone", () => {
  const short = encodeQr("https://staylift.app/c/marlowe");
  assert.equal(short.size, 29, "version 3");
  const m = short.modules;
  // Finder pattern: dark outer ring, light ring, dark 3x3 centre (top-left).
  assert.ok(m[0]![0] && m[0]![6] && m[6]![0] && m[6]![6]);
  assert.ok(!m[1]![1] && !m[5]![5]);
  assert.ok(m[3]![3] && m[2]![4]);
  assert.equal(encodeQr("x".repeat(200)).size, 57, "version 10");
  assert.throws(() => encodeQr("x".repeat(400)), /too long/);
  assert.match(qrSvg("hi"), /^<svg[^>]+viewBox="0 0 29 29"/);
});
