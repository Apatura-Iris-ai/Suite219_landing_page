#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const password = arg("--password", process.env.SUITE219_PASSWORD || "");
if (!password) {
  console.error("Fehler: --password <passwort> oder SUITE219_PASSWORD fehlt.");
  process.exit(1);
}

const encPath = resolve(arg("--enc", "assets/content.enc.js"));
const plainPath = resolve(arg("--plain", "src/protected.html"));

globalThis.window = {};
await import(pathToFileURL(encPath).href);
const enc = globalThis.window.SUITE219_ENC;

const b64ToBytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));

const km = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey(
  { name: "PBKDF2", salt: b64ToBytes(enc.salt), iterations: enc.iter, hash: "SHA-256" },
  km,
  { name: "AES-GCM", length: 256 },
  false,
  ["decrypt"]
);

let plain;
try {
  const buf = await subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(enc.iv) }, key, b64ToBytes(enc.data));
  plain = new TextDecoder().decode(buf);
} catch {
  console.error("FEHLER: Entschlüsselung fehlgeschlagen (falsches Passwort oder beschädigte Daten).");
  process.exit(1);
}

const expected = readFileSync(plainPath, "utf8");
if (plain === expected) {
  console.log("OK: Entschlüsselung erfolgreich, Inhalt stimmt mit " + plainPath + " überein (" + plain.length + " Zeichen).");
} else {
  console.error("FEHLER: Inhalt weicht von " + plainPath + " ab. Bitte neu verschlüsseln.");
  process.exit(1);
}
