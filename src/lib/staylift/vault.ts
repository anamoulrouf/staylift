/**
 * Field-level encryption for guest contact data (server-only use).
 *
 *   encrypt(plain)  -> "v1.<keyId>.<iv>.<ciphertext>"  AES-256-GCM, random 96-bit IV
 *   blindIndex(v)   -> HMAC-SHA256 under a separate derived key, for exact-match
 *                      lookups ("is this email already a profile?") without decrypting.
 *
 * Keys
 *   STAYLIFT_DATA_KEY           base64 of 32 random bytes (openssl rand -base64 32)
 *   STAYLIFT_DATA_KEY_PREVIOUS  optional; the old key during rotation. New writes use
 *                               the current key, reads try the key named in the value.
 *   Both subkeys come from the master key via HKDF, so one secret covers both jobs.
 *
 * Without a key, local development uses a fixed development key and says so
 * (keyStatus().mode === "dev"). With DATABASE_URL set (a real database) and no
 * key, every call throws: real guest data is never written under a known key.
 *
 * Uses Web Crypto only (no node: imports), so it runs on Node 20+ and Vercel.
 */

const DEV_MASTER = "staylift-development-key-not-for-real-guest-data";

type KeySet = { id: string; enc: CryptoKey; mac: CryptoKey };

const enc = new TextEncoder();
const dec = new TextDecoder();

function env(name: string): string | undefined {
  const v = typeof process !== "undefined" ? process.env[name] : undefined;
  return v && v.trim() ? v.trim() : undefined;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(text: string): Uint8Array {
  const s = text.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function b64Decode(text: string): Uint8Array {
  return b64urlDecode(text.replace(/\+/g, "-").replace(/\//g, "_"));
}

async function deriveKeySet(master: Uint8Array): Promise<KeySet> {
  const subtle = globalThis.crypto.subtle;
  const ikm = await subtle.importKey("raw", master as BufferSource, "HKDF", false, ["deriveKey", "deriveBits"]);
  const salt = enc.encode("staylift/vault/v1");
  const encKey = await subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("encrypt") },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const macKey = await subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("blind-index") },
    ikm,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
  const idBits = await subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("key-id") },
    ikm,
    48,
  );
  return { id: b64urlEncode(new Uint8Array(idBits)), enc: encKey, mac: macKey };
}

export type KeyStatus = { mode: "configured" | "dev" | "missing"; keyId: string | null; rotating: boolean };

type Loaded = { current: KeySet; previous: KeySet | null; mode: "configured" | "dev" };

const cache = globalThis as typeof globalThis & { __staylift_vault__?: Promise<Loaded | null> };

function realDatabase() {
  return Boolean(env("DATABASE_URL"));
}

function parseMaster(raw: string, name: string): Uint8Array {
  const bytes = b64Decode(raw);
  if (bytes.length < 32) throw new Error(`${name} must be base64 of at least 32 bytes (openssl rand -base64 32).`);
  return bytes;
}

async function load(): Promise<Loaded | null> {
  const raw = env("STAYLIFT_DATA_KEY");
  if (!raw) {
    if (realDatabase()) return null;
    return { current: await deriveKeySet(enc.encode(DEV_MASTER)), previous: null, mode: "dev" };
  }
  const prevRaw = env("STAYLIFT_DATA_KEY_PREVIOUS");
  return {
    current: await deriveKeySet(parseMaster(raw, "STAYLIFT_DATA_KEY")),
    previous: prevRaw ? await deriveKeySet(parseMaster(prevRaw, "STAYLIFT_DATA_KEY_PREVIOUS")) : null,
    mode: "configured",
  };
}

async function keys(): Promise<Loaded> {
  cache.__staylift_vault__ ??= load().catch((err) => {
    cache.__staylift_vault__ = undefined;
    throw err;
  });
  const loaded = await cache.__staylift_vault__;
  if (!loaded) {
    throw new Error(
      "Guest data encryption key is missing: set STAYLIFT_DATA_KEY (openssl rand -base64 32) before storing guest contacts.",
    );
  }
  return loaded;
}

/** For tests: forget cached keys so a changed environment takes effect. */
export function resetVaultForTests() {
  cache.__staylift_vault__ = undefined;
}

export async function keyStatus(): Promise<KeyStatus> {
  try {
    const k = await keys();
    return { mode: k.mode, keyId: k.current.id, rotating: Boolean(k.previous) };
  } catch {
    return { mode: "missing", keyId: null, rotating: false };
  }
}

export async function encrypt(plain: string): Promise<string> {
  const { current } = await keys();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, current.enc, enc.encode(plain)),
  );
  return `v1.${current.id}.${b64urlEncode(iv)}.${b64urlEncode(ct)}`;
}

export async function decrypt(sealed: string): Promise<string> {
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unrecognised encrypted value.");
  const [, keyId, ivText, ctText] = parts as [string, string, string, string];
  const k = await keys();
  const set = keyId === k.current.id ? k.current : keyId === k.previous?.id ? k.previous : null;
  if (!set) throw new Error("This value was encrypted with a key that is no longer configured.");
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64urlDecode(ivText) as BufferSource },
    set.enc,
    b64urlDecode(ctText) as BufferSource,
  );
  return dec.decode(plain);
}

export async function decryptOrNull(sealed: string | null | undefined): Promise<string | null> {
  if (!sealed) return null;
  try {
    return await decrypt(sealed);
  } catch {
    return null;
  }
}

/**
 * Keyed hash for exact-match lookups. Normalise first (see contact.ts) so
 * "Maya@Example.com " and "maya@example.com" index the same. Hashes are always
 * made with the current key; after a rotation, re-index with reindexValue().
 */
export async function blindIndex(normalized: string): Promise<string> {
  const { current } = await keys();
  const sig = await globalThis.crypto.subtle.sign("HMAC", current.mac, enc.encode(normalized));
  return b64urlEncode(new Uint8Array(sig));
}

/** SHA-256 for one-time secrets (verification codes, invite and preference tokens). */
export async function sha256(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", enc.encode(text));
  return b64urlEncode(new Uint8Array(digest));
}

/** URL-safe random token with `bytes` of entropy (default 18 bytes = 144 bits). */
export function randomToken(bytes = 18): string {
  return b64urlEncode(globalThis.crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Six-digit numeric code, uniform (rejection sampling avoids modulo bias). */
export function randomCode(): string {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / 1_000_000) * 1_000_000;
  for (;;) {
    globalThis.crypto.getRandomValues(buf);
    const n = buf[0]!;
    if (n < limit) return String(n % 1_000_000).padStart(6, "0");
  }
}
