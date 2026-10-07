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
