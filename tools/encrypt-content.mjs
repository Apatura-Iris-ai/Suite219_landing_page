#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const password = arg("--password", process.env.SUITE219_PASSWORD || "");
if (!password) {
  console.error("Fehler: --password <passwort> oder Umgebungsvariable SUITE219_PASSWORD fehlt.");
  process.exit(1);
}

const inPath = resolve(arg("--in", "src/protected.html"));
const outPath = resolve(arg("--out", "assets/content.enc.js"));

const html = readFileSync(inPath, "utf8");

const salt = webcrypto.getRandomValues(new Uint8Array(16));
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const iter = 250000;

const b64 = (buf) => Buffer.from(buf).toString("base64");

const keyMaterial = await subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveKey"]
);
const key = await subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const ciphertext = new Uint8Array(
  await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(html))
);

const payload = {
  v: 1,
  alg: "AES-256-GCM",
  kdf: "PBKDF2-SHA-256",
  iter,
  salt: b64(salt),
  iv: b64(iv),
  data: b64(ciphertext)
};

writeFileSync(outPath, "window.SUITE219_ENC = " + JSON.stringify(payload, null, 2) + ";\n");
console.log("Verschlüsselt: " + inPath + " -> " + outPath + " (" + html.length + " Zeichen Klartext)");
