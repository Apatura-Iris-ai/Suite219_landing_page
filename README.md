# Suite 219 – Angebots-Landingpage 2027

Statische, passwortgeschützte Landingpage für Kunden von **www.suite219.de** mit der Preisliste 2027.

Das Repo ist **öffentlich** (nötig für kostenloses GitHub Pages), enthält aber **keine Preise im Klartext**:
der Inhalt liegt verschlüsselt vor, die Klartext-Quelle wird lokal gehalten und ist via `.gitignore` aus dem Repo ausgeschlossen.

## Funktionsweise

- `index.html` ist die öffentlich erreichbare Seite. Sie enthält **keine** Preise im Klartext.
- Der eigentliche Inhalt liegt **AES-256-GCM-verschlüsselt** in `assets/content.enc.js`
  (Schlüssel per PBKDF2-SHA-256 mit 250.000 Iterationen aus dem Passwort abgeleitet).
- Erst nach Eingabe des korrekten Passworts wird der Inhalt im Browser entschlüsselt und angezeigt
  (`assets/app.js`, Web Crypto API). Ein falsches Passwort schlägt durch die GCM-Authentifizierung fehl.
- Die Seite trägt `<meta name="robots" content="noindex, nofollow">`.
- Buchungsformular (im verschlüsselten Inhalt): sendet die Anfrage als fertige E-Mail an `info@suite219.de`
  (`mailto:` im E-Mail-Programm des Kunden – keine Dritt-Server, Daten bleiben in der Firma; DSGVO-Hinweis mit Pflicht-Checkbox im Formular).
- Design: festlich-glanzvoll (dunkler Hintergrund, Gold-Akzente, animierte Lichtpunkte/Bokeh,
  Konfetti-Effekt beim Entsperren) mit dem Suite-219-Logo.

## Dateien

| Pfad | Zweck |
|---|---|
| `index.html` | Öffentliche Seite mit Passwort-Gate |
| `assets/content.enc.js` | Verschlüsselter Inhalt (generiert) |
| `assets/app.js` | Entschlüsselung + Animationen |
| `assets/style.css` | Gestaltung |
| `assets/logo.png` | Suite-219-Logo (weiß, transparent) |
| `tools/encrypt-content.mjs` | Inhalt neu verschlüsseln |
| `tools/verify-decrypt.mjs` | Entschlüsselung testen |
| `tools/ci-check.mjs` | CI-Check (Payload-Struktur, keine Klartext-Preise) |
| `.github/workflows/validate.yml` | CI bei PR/Push |
| `src/protected.html` | **Klartext-Quelle – nur lokal, nie committen** (per `.gitignore` ausgeschlossen) |

## Passwort oder Inhalt ändern

Voraussetzung: Node.js (>= 18), keine Abhängigkeiten.

1. `src/protected.html` **lokal** bearbeiten (die Datei ist git-ignored und darf nie ins Repo gelangen).
2. Neu verschlüsseln und testen:

```bash
node tools/encrypt-content.mjs --password "NEUES-PASSWORT"
node tools/verify-decrypt.mjs --password "NEUES-PASSWORT"
```

3. Nur `assets/content.enc.js` committen und pushen (`src/protected.html` ist ignoriert).

Das Passwort wird nirgends im Klartext gespeichert; zum Ändern einfach neu verschlüsseln.

## Deployment (GitHub Pages, kostenlos – Repo ist public)

1. Repository → *Settings → Pages → Source: Deploy from a branch* → Branch `main`, Folder `/ (root)` → Save.
2. Nach 1–2 Minuten ist die Seite unter `https://<owner>.github.io/<repo>/` live.
3. Für `www.suite219.de`: Pages → *Custom domain* → `www.suite219.de` eintragen, *Enforce HTTPS* aktivieren.
   Beim Domain-Anbieter einen CNAME-Eintrag `www` → `<owner>.github.io` (klein) setzen.

## Sicherheitshinweis

Bei statischem Hosting (GitHub Pages) erfolgt der Schutz clientseitig: der verschlüsselte
Inhalt ist öffentlich abrufbar, aber ohne Passwort nicht lesbar. Das Passwort nur an berechtigte
Kunden weitergeben. Für serverseitigen Schutz (z. B. HTTP-Basic-Auth) kann zusätzlich der Hosting-
Anbieter konfiguriert werden.
