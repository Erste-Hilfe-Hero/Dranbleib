# Dranbleib · 0.2.0-rc.2

Deutschsprachige ChatGPT-App-Testversion mit MCP und MCP Apps UI: offene Zusagen erfassen, Vorschläge mit Quellenbeleg prüfen, speichern, finden, ändern, abschließen und löschen. Entwürfe bleiben editierbar und werden nicht versendet.

**HTTPS-Testendpunkt:** https://161.97.102.171:8443/ · **MCP:** https://161.97.102.171:8443/mcp. Geschlossene Registrierung; Betreiber-/Reviewer-Testkonto erforderlich. Keine sensiblen Produktivdaten verwenden. Einreichung und Veröffentlichung im ChatGPT-Verzeichnis stehen aus.

## Lokal sofort ausprobieren

Node.js **24+**, npm, keine API-Schlüssel nötig:

```bash
npm ci
npm start
```

Im Browser http://127.0.0.1:8787 öffnen. Server bindet ausschließlich an Loopback; in einer entfernten Umgebung eigenes Port-Forwarding verwenden. `PORT` und `DATA_PATH` optional; `.env.example` wird nicht automatisch geladen.

1. Text einfügen oder eine UTF-8-TXT/MD-Datei ausdrücklich auswählen (max. 20.000 Zeichen).
2. Vorschlag, Beleg, Fakten, Vermutungen und fehlende Angaben prüfen. Felder korrigieren und vor dem Speichern bestätigen.
3. Offene, wartende, überfällige und erledigte Vorgänge filtern; Details, Frist/Status ändern, abschließen oder bestätigt löschen.
4. Antwort-/Nachfassentwurf bearbeiten und kopieren; bestätigte Daten als JSON exportieren.

Die Erkennung ist regelbasiert und verarbeitet einen kurzen Auszug, keine semantische KI-Analyse. Rollen werden nicht geraten; Wochentage, mehrere/ungültige Datumsangaben und relative Fristen bleiben unbestätigt. Behördenfristen sind vorläufige Textfunde mit Originalbeleg, keine Rechtsberatung. PDF/DOCX/OCR, Gmail/Outlook/Kalender, Hintergrundüberwachung, Push und Versand sind nicht implementiert.

## Daten und Anmeldung

Die lokale Browserdemo speichert bestätigte Vorgänge in privater SQLite, Besitzer aus einem zufälligen HttpOnly-/SameSite-Cookie (nur sein Hash gespeichert). Keine Kontoanmeldung/Wiederherstellung; Browserprofil und Rechner bilden die Vertrauensgrenze. Die anonyme lokale MCP-Demo hält getrennte Sitzungsdaten im RAM, Verlust beim Trennen/Neustart bzw. nach 30 Minuten.

Der **getrennte HTTPS-Kandidat** verwendet echte serverseitige Kontenpersistenz mit selbst gehostetem OAuth: S256-PKCE, DCR, Discovery, Redirect-/Resource-Bindung, CSRF, Scopeprüfung, kurzlebige gehashte Tokens, Rotation/Widerruf, stabile Besitzer-ID und bestätigte Kontolöschung. Kein anonymer Zugriff auf Vorgänge. Nur vom Betreiber angelegte Testkonten; keine E-Mail, MFA oder Passwortwiederherstellung.

Keine dauerhafte Speicherung vollständiger Quellen; nur bestätigte Felder und maximal 800 Zeichen Beleg. Vorschläge verfallen nach 15 Minuten. Keine Inhalts-/Tokenlogs oder Telemetrie. Export über `export_open_loops`; `/account/delete` verlangt Passwort und Löschbestätigung. Datenbank/extern angelegte Backups sind nicht verschlüsselt; Hostzugang bleibt Vertrauensgrenze. [Datenschutzgrenzen](docs/PRIVACY.md).

## ChatGPT und Contabo

Auf dem vorhandenen Contabo-VPS laufen getrennte Dienste: private Browserdemo 127.0.0.1:8790, früherer privater OAuth-Kandidat 127.0.0.1:8791, neuer Backenddienst `dranbleib-preview` 127.0.0.1:8792 und unprivilegierter TLS-Proxy `dranbleib-https` auf Port 8443. Bestehende Spielports 80/443 und andere Dienste bleiben erhalten; kein neuer VPS/Domainkauf.

Öffentliches IP-Zertifikat und echte OAuth-/CRUD-/Kontentrennung wurden im externen Runner geprüft. Die eigene TLS-Importaufgabe übernimmt validierte Verlängerungen des vorhandenen Zertifikats; Quellenverlängerung und Ablauf weiterhin kontrollieren. [HTTPS-Aufbau, Testzugang und Nachweise](docs/HTTPS-PREVIEW.md).

Reviewer-Konto mit ausschließlich synthetischen Beispielen vorhanden. Zugangsdaten nur root-only unter `/var/lib/dranbleib-ops/reviewer.json` auf Contabo; nicht in GitHub, Logs, Chat oder ZIP. Über den eigenen autorisierten SSH-Zugang für die Testanmeldung bzw. das private Reviewerfeld nutzen. Weitere Testkonten per `scripts/account-admin.js` mit Passwort über stdin/private Ausgabedatei außerhalb des Projekts anlegen.

Im autorisierten ChatGPT-Konto nach aktueller Dokumentation: Plugins → Add custom MCP server → HTTPS-MCP-URL → OAuth-Anmeldung und Rechte bestätigen → neuen Chat öffnen. **Ein echter ChatGPT-Kontotest ist noch nicht durchgeführt.** Akzeptanz der IP-Origin/Port und Portal-Domainprüfung dort überprüfen.

## Tools und SDK

`preview_open_loop`, `capture_open_loop`, `list_open_loops`, `get_open_loop`, `update_open_loop`, `draft_followup`, `delete_open_loop`, `export_open_loops`, `render_dranbleib`. Alle mit Eingabe-/Ergebnis-Schemata und Annotationen; Änderungen erfordern ausdrücklich bestätigte Werte. Ein `confirmed`-Boolean allein beweist keine echte Zustimmung eines beliebigen Clients.

MCP SDK **1.32.1**, MCP Apps Helpers **2.0.3**, Zod **4.6.5**, Node **24.19.0**. Offizielle OpenAI-Dokumentation am 7. Oktober geprüft, OAuth am 8. Oktober 2026 erneut abgerufen. Die aktuelle Dokumentation nennt Agent Plugins/MCP Apps; keine alten `ai-plugin.json`-/OpenAPI-Plugins. [Quellen und Versionen](docs/PLATFORM.md).

## Prüfen und Paket erstellen

```bash
npm run check
npm test
python -m unittest discover -s test -p '*_test.py'
# Falls kein System-Chromium vorhanden:
npx playwright install chromium
npm run test:ui
npm run test:oauth-ui
npm audit --omit=dev
npm run package:review
```

19 Node-Tests und sechs Archivtests bestanden, mobile Browser-/MCP-Hostsimulation sowie OAuth-Browserprüfung bestanden. Zusätzlich echte TLS-Prüfung mit lokaler vertrauenswürdiger Test-CA und externem öffentlichem Zertifikat. Keine TLS-Prüfung deaktiviert. [Validierung](docs/VALIDATION.md).

Vier PNG-Icons/Logos, Screenshot und reale Aufnahme des lokalen Browserablaufs unter `assets/`. Reproduzieren mit System-FFmpeg, `npx playwright install ffmpeg`, dann `npm run package:media`. Das Video ist kein Nachweis eines tatsächlichen ChatGPT-Kontotests.

`package:review` erzeugt ein **Vorbereitungspaket** mit Quellcode, Docs, Schemas und Medien. Für das eigentliche Portal-ZIP:

```bash
npm run package:submission -- /absoluter/pfad/provider.json
```

`submission/provider.example.json` zeigt die erforderlichen tatsächlichen Angaben. Unbekannte/ungefüllte Anbieterfelder werden abgewiesen. Mit vervollständigter Konfiguration erzeugt der Builder genau `plugin.json`, `mcp.json` und Bilddateien, geprüft gegen offizielle Agent-Plugins-1.0.0-Schemas. Keine Zugangsdaten im Paket. Schemaprüfung bestätigt weder Identität noch Rechtsgültigkeit, Domainprüfung, ChatGPT-Verhalten oder OpenAI-Freigabe.

## Freigabestand

Quellcode und Git-Checkpoints sind auf https://github.com/Erste-Hilfe-Hero/Dranbleib gepusht; separate Runner-Workflows installiert. [Vorabversion 0.2.0-rc.2 mit Paket und Prüfsumme](https://github.com/Erste-Hilfe-Hero/Dranbleib/releases/tag/v0.2.0-rc.2) veröffentlicht und verifiziert. GitHub-Vorabversionen sind technische Kandidaten, keine OpenAI-Veröffentlichung.

Für die finale ChatGPT-Einreichung fehlen **tatsächlicher Anbietername/Anschrift/Kontakt, vervollständigte Rechtstexte und autorisierter Zugriff auf das verifizierte OpenAI-Entwicklerkonto**. Domain-Challenge und echte Hosttests müssen im Konto erfolgen. `/privacy` und `/terms` zeigen den unfertigen Stand wahrheitsgemäß und ersetzen keine finalen Rechtstexte. Keine Angaben oder Portalzustimmungen erfunden. [Checkliste](submission/CHECKLIST.md), [Rechtstextentwürfe](submission/LEGAL-DRAFTS.md), [Status](submission/CANDIDATE-STATUS.json).
