import { readFileSync } from "node:fs";

const fail = (msg) => {
  console.error("FAIL: " + msg);
  process.exit(1);
};

globalThis.window = {};
await import(new URL("../assets/content.enc.js", import.meta.url).href);
const enc = globalThis.window.SUITE219_ENC;

if (!enc) fail("assets/content.enc.js setzt window.SUITE219_ENC nicht");
if (enc.alg !== "AES-256-GCM") fail("alg muss AES-256-GCM sein, ist: " + enc.alg);
if (enc.kdf !== "PBKDF2-SHA-256") fail("kdf muss PBKDF2-SHA-256 sein, ist: " + enc.kdf);
if (!Number.isInteger(enc.iter) || enc.iter < 100000) fail("iter zu niedrig: " + enc.iter);

for (const k of ["salt", "iv", "data"]) {
  if (!enc[k] || !/^[A-Za-z0-9+/]+={0,2}$/.test(enc[k])) fail(k + " ist kein gueltiges Base64");
}
if (Buffer.from(enc.iv, "base64").length !== 12) fail("iv muss 12 Bytes sein");
if (Buffer.from(enc.salt, "base64").length < 16) fail("salt muss mindestens 16 Bytes sein");

const publicFiles = ["index.html", "assets/app.js", "assets/style.css"];
const pricePattern = /\d{1,3}(\.\d{3})*,\d{2}\s*€/;
for (const f of publicFiles) {
  const txt = readFileSync(f, "utf8");
  const m = txt.match(pricePattern);
  if (m) fail(f + " enthaelt einen Klartext-Preis: " + m[0]);
}

const plain = readFileSync("src/protected.html", "utf8");
if (!plain.includes("2027")) fail("src/protected.html enthaelt kein 2027");

console.log("OK: Payload valide (AES-256-GCM, PBKDF2-SHA-256, iter=" + enc.iter + "), keine Klartext-Preise in oeffentlichen Dateien");
