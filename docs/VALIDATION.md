# Validierung – 2026-10-07

Geprüfte Umgebung: Node 24.19.0, npm 11.9.0, Linux, System-Chromium über Playwright 1.63.0. Keine verbundenen Konten/Secrets. Alle Testquellen sind synthetisch. Kein Testsatz verwendet private E-Mails oder echte Behördenbescheide.

| Tatsächlich ausgeführt | Ergebnis |
|---|---|
| `npm ci` / exakte installierte Paketversionen | Reproduzierbarer Lockfile-Stand, MCP SDK 1.32.1, ext-apps 2.0.3, Zod 4.6.5 |
| `npm run check` | JavaScript-Syntax der Server-, Domain- und UI-Dateien gültig |
| `npm test` | 9 Tests bestanden, 0 fehlgeschlagen |
| `npm run test:ui` | Browser-Hauptablauf und MCP-Apps-Host-Simulation bestanden; keine pageerror-Ereignisse |
| `npm audit --omit=dev --audit-level=moderate` | 0 gemeldete Schwachstellen der Produktionsabhängigkeiten zum Prüfzeitpunkt |
| `npm start`, `GET /health` | Loopback-Server gestartet, HTTP 200, `status: ok`, `mode: local-demo` |
| `npm run package:review` und ZIP-Inhaltsprüfung | Vorbereitungspaket erstellt; keine .git, node_modules, Datenbank oder .env enthalten |

## Getestete Eigenschaften

- Erfassung erzeugt nur einen Vorschlag; Speichern erst mit Bestätigung. Benutzerkorrekturen bleiben erhalten, Proposal-ID nur einmal nutzbar.
- Freitag, fehlende Frist, ungültiges Kalenderdatum, mehrere Datumstreffer und Zustellungsfrist bleiben unklar; gültige explizite Datumsangabe ist nur vorläufig. Briefwarnung und Originalprüfung sichtbar.
- Voller unnötiger Mailthread wird nicht gespeichert; kurzer wörtlicher Beleg bleibt erhalten. Eingaben über 20.000 Zeichen werden abgewiesen; Quelltext-Anweisungen werden nicht ausgeführt.
- Filter offen/wartend/überfällig/erledigt, Frist-/Statusänderung, Abschluss, get/details, Kopierentwurf und JSON-Export.
- Löschen ohne Bestätigung scheitert. Browser-Löschdialog abbrechen behält den Vorgang; bestätigtes Löschen entfernt ihn.
- Fremde Vorgangs- und Vorschlags-IDs können weder gelesen noch verändert, gelöscht oder für Entwürfe verwendet werden. Ein übergebenes Besitzerfeld ist ungültig.
- Zweiter Browsercookie und zweite echte MCP-Verbindung sehen keine Daten der ersten. Persistenz bleibt nach lokalem Serverneustart mit demselben Cookie erhalten. MCP-Daten werden bei `terminateSession` entfernt.
- Origin-/Hostschutz und fehlendes Cookie wurden mit echten HTTP-Anfragen geprüft. Der manipulierte Host-Test verwendet node:http, da fetch einen gesetzten Host-Header nicht zuverlässig übernimmt.
- Echte MCP-SDK-Clients initialisieren Streamable HTTP, listen neun Tools, lesen die gebündelte UI-Resource, prüfen Annotationen und Output-Schemata und führen den Hauptablauf aus. SDK-Ergebnisvalidierung hat einen überflüssigen `fields`-Schlüssel gefunden; entfernt und gesamte betroffene Prüfung erneut bestanden.
- Mobiler Chromium-Browser (390 × 844, de-DE) prüft TXT-Auswahl, Verwerfen, Korrektur/Speichern, Details/Entwurf, Filter/Änderung, Reload/Persistenz, zweite Identität, Download, Abschluss, Löschbestätigung und fehlenden horizontalen Overflow.
- Simulierter MCP-Apps-Host stellt die echte serverseitige Resource als iframe bereit und leitet `ui/initialize` / `tools/call` über die Bridge weiter. Dahinter stehen echte MCP-Clientaufrufe, kein vorgetäuschtes Toolergebnis. Capture/Review/Save/Details/Entwurf bestanden.
- Mobile Screenshots und iframe-Screenshot erzeugt; mobile Ansicht visuell geprüft.

## Nicht ausgeführt / verbleibende Grenzen

- **Echter ChatGPT-/Entwicklermodus-Test**, natürliche Toolauswahl, tatsächliche Plattformbestätigungen und iframe-Verhalten im ChatGPT-Konto: fehlendes Konto/Workspace, HTTPS-Endpunkt oder Secure MCP Tunnel. Hostsimulation ist kein Ersatz dafür.
- **OAuth / Produktions-Nutzertrennung**: nicht implementiert. Geprüft wurde lokale/sitzungsbezogene Trennung, keine Sicherheit einer verifizierten Mehrnutzerplattform.
- Kein Portal-Upload, keine Entwicklerverifizierung, Domainprüfung, automatisierte OpenAI-Review, Einreichung oder Veröffentlichung.
- Kein GitHub-Push: neues lokales Repository besitzt kein Remote.
- Kein Inferenzmodell, PDF/OCR, Datei-Upload-Extension des ChatGPT-Hosts, Gmail-/Outlook-/Kalenderzugriff, Versand, Push oder Rechtsfristberechnung.
- Keine Screenreader-Sitzung oder vollständige WCAG-Zertifizierung. Semantische Formulare, Labels, Tastaturbedienung, Status-Liveregion, Fokusmarkierungen und mobiles Layout sind vorhanden.
- Keine forensisch sichere Löschung von WAL/Backups/Exporten; keine verschlüsselte Produktionsdatenbank. Betrieb nur als lokale Demo.

## Checkpoints

- `934a4ad`: Inventar, Architektur und offizielle Quellen.
- `eb8d50d`: implementierte Demo, Tests, Setup, Metadatenvorlagen und Einreichungscheckliste.
- Abschließender Dokumentationscheckpoint: im lokalen `git log` sichtbar. Kein Remote und kein Push.

## Erneute Prüfung am 2026-10-08

`npm run check`, alle neun Tests sowie Browserablauf und MCP-Apps-Hostsimulation erneut bestanden. Der GitHub-Connector meldet den authentifizierten Nutzer Erste-Hilfe-Hero und sechs zugängliche Repositories mit Schreibberechtigung. Kein eindeutig zugeordnetes Dranbleib-Ziel gefunden; kein Push ausgeführt. Die Contabo-systemd-Vorlage ist vorbereitet, aber ohne verbundenen VPS nicht getestet oder installiert.

Der Nutzer hat anschließend ein neues Repository autorisiert. GitHub-CLI-Login funktioniert; der tatsächliche private Erstellungsversuch für Erste-Hilfe-Hero/dranbleib wurde mit `Resource not accessible by integration (createRepository)` abgelehnt. Kein Push.

## Abschluss nach Runner-/Contabo-Deployment am 2026-10-08

GitHub-Push und neue separate LifeKit-Runneraufträge vom Nutzer freigegeben. Read-only-Inventar erfolgreich (37732812264). Erster Dienststart fehlgeschlagen und zurückgenommen (37733146979); Symlink-Entrypoint korrigiert, echter Prozessstart als zusätzlicher Regressionstest. Aktueller Satz: **10 Node-Tests + 6 Python-Sicherheitstests bestanden**, Browser und MCP-Apps-Hostsimulation erneut fehlerfrei.

**Lauf 37733456055 erfolgreich:** installierter Commit b144fe3ed348d14ea19c1becf0f3965794c20bf2; Service dranbleib, private Adresse 127.0.0.1:8790, Health ok/local-demo. Echte synthetische CRUD-/Entwurfs-/Cookieisolationsprüfung am VPS bestanden, Testdatensatz gelöscht, zuvor laufende Dienste weiterhin aktiv. Keine öffentliche Proxy-/Firewallfreigabe. Kontobasierte OAuth-Trennung und echter ChatGPT-Kontotest bleiben ausdrücklich ungeprüft.

Ein lokaler CLI-Artefaktdownload wurde vom Netzwerkziel abgelehnt; Runnerstatus und inhaltliche Belege wurden über die verbundenen GitHub-Joblog-Tools verifiziert. Keine temporären Download-URLs oder Secretwerte in dieser Dokumentation. Vorbereitungspaket erneut erstellt und auf Laufzeitdaten/Caches geprüft.

## Kandidatenprüfung 2026-10-08

15 Node-Tests bestanden, sechs Archive-Sicherheitstests bestanden, Browser-/MCP-Hostsimulation bestanden. Zusätzlicher OAuth-Browsertest bestanden: Secure-Cookie, sichtbare Zustimmung, Registrierung, State-Rückkehr und bestätigte Kontolöschung, mobil ohne Überlauf. HTTPS und Callback wurden in diesem Test lokal geroutet; kein öffentliches Zertifikat oder tatsächlicher ChatGPT-Login geprüft. Der Test fand einen Formular-Originfehler durch `Referrer-Policy: no-referrer`; Kandidat verwendet `same-origin`, schützt dadurch externe Referrer und erhält den Ursprung beim eigenen Formular-POST. Audit: 0 bekannte Schwachstellen.

Erste authentifizierte Contabo-Installation: Runner 37736768157, Commit 8b023e8, Dienst `dranbleib-release`, 127.0.0.1:8791. Remote OAuth-/CRUD-/Kontentrennung bestanden, synthetische Konten gelöscht, vorherige Dienste erhalten. Diese erste Installation wird durch den nachfolgend dokumentierten korrigierten Kandidaten ersetzt.

## Abschließender Kandidatennachweis

Korrigierte Version `55104624ce00511414aec6e93afa69c0e9e57cfe` am 2026-10-08 über den vorhandenen Runner installiert: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37737261844. 15 Node-Tests, sechs Archivtests, beide Browserprüfungen und Audit bestanden. Realer OAuth-/CRUD-/Kontentrennungstest am installierten Dienst bestanden; synthetische Konten danach gelöscht. Service `dranbleib-release`, Listener `127.0.0.1:8791`; vorherige Dienste aktiv. Keine öffentliche HTTPS-Verbindung oder ChatGPT-Verzeichnisveröffentlichung.
