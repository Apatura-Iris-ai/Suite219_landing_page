# Suite 219 – Angebots-Landingpage 2027

Statische, passwortgeschützte Landingpage für Kunden von **www.suite219.de** mit der Preisliste 2027.

## Funktionsweise

- `index.html` ist die öffentlich erreichbare Seite. Sie enthält **keine** Preise im Klartext.
- Der eigentliche Inhalt (`src/protected.html`) liegt verschlüsselt in `assets/content.enc.js`
  (AES-256-GCM, Schlüssel per PBKDF2-SHA-256 mit 250.000 Iterationen aus dem Passwort abgeleitet).
- Erst nach Eingabe des korrekten Passworts wird der Inhalt im Browser entschlüsselt und angezeigt
  (`assets/app.js`, Web Crypto API). Ein falsches Passwort schlägt durch die GCM-Authentifizierung fehl.
- Die Seite trägt `<meta name="robots" content="noindex, nofollow">`.
- Design: festlich-glanzvoll (dunkler Hintergrund, Gold-Akzente, animierte Lichtpunkte/Bokeh,
  Konfetti-Effekt beim Entsperren) mit dem Suite-219-Logo.

## Dateien

| Pfad | Zweck |
|---|---|
| `index.html` | Öffentliche Seite mit Passwort-Gate |
| `src/protected.html` | Inhalt (Preise 2027) – hier bearbeiten |
| `assets/content.enc.js` | Verschlüsselter Inhalt (generiert) |
| `assets/app.js` | Entschlüsselung + Animationen |
| `assets/style.css` | Gestaltung |
| `assets/logo.png` | Suite-219-Logo (weiß, transparent) |
| `tools/encrypt-content.mjs` | Inhalt neu verschlüsseln |
| `tools/verify-decrypt.mjs` | Entschlüsselung testen |

## Passwort oder Inhalt ändern

Voraussetzung: Node.js (>= 18), keine Abhängigkeiten.

```bash
node tools/encrypt-content.mjs --password "NEUES-PASSWORT"
node tools/verify-decrypt.mjs --password "NEUES-PASSWORT"
```

Danach `src/protected.html` editieren und erneut `encrypt-content.mjs` ausführen.
Das Passwort wird nirgends im Klartext gespeichert; zum Ändern einfach neu verschlüsseln.

## Deployment (GitHub Pages)

1. Repository auf GitHub anlegen und dieses Verzeichnis pushen.
2. GitHub → *Settings → Pages → Source: Deploy from a branch* → Branch `main`, Folder `/ (root)`.
3. Seite ist danach unter der Pages-URL erreichbar; für `www.suite219.de` im DNS einen
   CNAME-Eintrag auf die Pages-Adresse setzen.

## Sicherheitshinweis

Bei rein statischem Hosting (GitHub Pages) erfolgt der Schutz clientseitig: der verschlüsselte
Inhalt ist öffentlich abrufbar, aber ohne Passwort nicht lesbar. Das Passwort nur an berechtigte
Kunden weitergeben. Für serverseitigen Schutz (z. B. HTTP-Basic-Auth) kann zusätzlich der Hosting-
Anbieter konfiguriert werden.
