# Dranbleib

Deutschsprachige, lokal startbare ChatGPT-App-Entwicklungsdemo mit MCP und MCP Apps UI. Offene Zusagen erfassen, Vorschläge prüfen, speichern, finden, ändern, abschließen und löschen. Jeder Vorgang hat einen Quellenbeleg; Entwürfe sind editierbar und werden niemals versendet.

## Start

Node.js **24+**, npm, keine API-Schlüssel und keine externen Konten nötig:

```bash
cd /workspace/dranbleib
npm ci
npm start
```

Im Browser **http://127.0.0.1:8787** öffnen. MCP: **http://127.0.0.1:8787/mcp** (Streamable HTTP). Der Server bindet ausschließlich an 127.0.0.1. In einer entfernten Arbeitsumgebung ist ein lokales Port-Forwarding nötig; die Adresse ist nicht automatisch vom eigenen Rechner erreichbar. Keine Veröffentlichung vorgenommen.

Optional `PORT=8790 npm start` oder `DATA_PATH=/absoluter/privater/pfad/demo.sqlite npm start`. Beispielkonfiguration: `.env.example`; Node lädt sie nicht automatisch. `npm run dev` startet mit Dateibeobachtung. Keine OpenAI-/Mail-API-Schlüssel erforderlich.

## Benutzen

1. Text einfügen oder ausdrücklich eine UTF-8-TXT/MD-Datei auswählen (maximal 20.000 Zeichen). Quelle wählen, bei Behördenbriefen **Brief / Behördenbrief**.
2. **Vorgang vorschlagen**: Beleg, Fakten, Vermutungen und fehlende Angaben lesen. Titel, Rolle, Status, nächsten Schritt und Datum korrigieren. Erst nach gesetztem Bestätigungshaken speichern.
3. Unter **Offenes im Blick** nach offen, wartend, überfällig oder erledigt filtern; Details öffnen, Änderungen bestätigen, als erledigt markieren oder nach zusätzlicher Bestätigung löschen.
4. Antwort-/Nachfassentwurf erstellen, direkt bearbeiten und kopieren. Es existiert kein Versandweg.
5. **Meine Vorgänge als JSON exportieren** exportiert bestätigte Daten in eine lokale Datei.

Die lokale Erkennung ist regelbasiert, verarbeitet einen einzigen kurzen Auszug und ersetzt keine semantische KI-Analyse. Rollen werden nicht geraten: Bei „Könnten Sie uns das Angebot schicken?“ muss der Nutzer klären, ob er selbst senden soll oder auf den Empfänger wartet. Wochentage, relative Fristen, mehrere Datumsangaben und ungültige Daten bleiben unbestätigt. Auch ein explizites Datum ist ein vorläufiger Textfund. PDF, DOCX, OCR, Gmail, Outlook, Kalender, Hintergrundjobs und Push sind nicht implementiert.

## Datenhaltung und Grenzen

Browser-Demo: bestätigte Vorgänge in `data/dranbleib.sqlite`, Besitzer aus einem zufälligen HttpOnly-/SameSite-Cookie. Nur Hash des Cookies dient als Besitzer, niemals ein übergebenes `userId`-Feld. Derselbe Browser kann nach einem Neustart seine Daten wiederfinden. Ein anderer Browser erhält einen getrennten Datenbereich. Cookie läuft nach 30 Tagen ab; kein Konto, keine Wiederherstellung oder Anmeldung. Wer Browserprofil/Cookie oder Datenbank besitzt, kann auf diese lokalen Daten zugreifen. Der Rechner ist die Vertrauensgrenze, keine produktive Mehrnutzerplattform.

MCP-Demo: serverseitig erzeugte, getrennte Sitzung; Daten ausschließlich im RAM, Verlust nach Trennen/Neustart oder 30 Minuten. MCP-Sitzungs-ID ist eine Zugriffsfähigkeit, **kein OAuth und kein verifiziertes Nutzerkonto**. Keine geteilte anonyme Produktionsdatenbank. Browser-Daten und MCP-Daten sind absichtlich getrennte Demobereiche.

Quelltext wird nur für die Anfrage verarbeitet; serverseitige Vorschläge halten nur Felder und maximal 800 Zeichen Beleg im RAM für 15 Minuten (Bereinigung spätestens im nächsten 30-Sekunden-Intervall). Nach Speichern wird der Vorschlag verbraucht. Originaldokumente, Dateinamen und ganze Threads werden nicht gespeichert. Unverarbeitete Texte/Entwürfe können bis zum Schließen im Browser verbleiben. Keine Inhalts-/Token-Logs. Weiteres: [Datenschutz und Sicherheitsgrenzen](docs/PRIVACY.md).

## Tools und Oberfläche

`preview_open_loop` erzeugt den überprüfbaren Vorschlag. Die sechs Produkttools sind `capture_open_loop`, `list_open_loops`, `get_open_loop`, `update_open_loop`, `draft_followup`, `delete_open_loop`; zusätzlich `export_open_loops` und `render_dranbleib`. Nur das Render-Tool verknüpft die UI-Resource. Alle Tools haben Zod-Eingabe-/Ergebnis-Schemata sowie passende readOnly/destructive/openWorld-Annotationen. Datenänderungen benötigen `confirmed: true`; dies muss vom Host nur nach echter Nutzerbestätigung übergeben werden. Ein Boolean beweist keine Nutzerzustimmung eines beliebigen direkten MCP-Clients.

Die gleiche deutsche Oberfläche läuft eigenständig und über die aktuelle MCP Apps Bridge (`ui/initialize`, `ui/notifications/initialized`, `tools/call`, `ui/notifications/tool-result`). Keine externen UI-Ressourcen oder Telemetrie. JSON-Export und Clipboard sind im iframe vom Host abhängig; über MCP stehen Daten/Entwürfe auch im Chat zur Verfügung.

## Tests

```bash
npm run check
npm test
# Einmalig, falls kein System-Chromium vorhanden:
npx playwright install chromium
npm run test:ui
npm audit --omit=dev
npm run package:review
```

Optional `CHROMIUM_PATH=/pfad/zu/chromium npm run test:ui`. Stand 2026-10-07: neun Domain-/HTTP-/MCP-Tests bestanden, Browserablauf und simulierte MCP-Apps-Host-Bridge mit echten Tools/Resource bestanden. Die Tests verwenden temporäre Datenbanken und zwei getrennte Nutzer-/MCP-Sitzungen. Screenshots in `artifacts/`. Vollständiges Protokoll und fehlende ChatGPT-Prüfung: [VALIDATION.md](docs/VALIDATION.md).

## ChatGPT verbinden und einreichen

Offizielle Apps-SDK-URLs führen am Prüfdatum zur **neuen Plugins-Dokumentation**. Gemeint ist MCP + MCP Apps, nicht das alte `ai-plugin.json`-/OpenAPI-Plugins-Format. Verwendete Versionen: `@modelcontextprotocol/sdk 1.32.1`, `@modelcontextprotocol/ext-apps 2.0.3`, `zod 4.6.5`; UI ohne zusätzliches Framework. Prüfung der offiziellen Dokumentation und npm-Versionen am **2026-10-07, ca. 15:56–16:15 UTC**. [Quellenstand](docs/PLATFORM.md), [Architektur](docs/ARCHITECTURE.md).

Ein echter ChatGPT-/Entwicklermodus-Test wurde **nicht durchgeführt**: kein verbundenes ChatGPT-Testkonto, keine Tunnelidentität, kein HTTPS-Endpunkt. Die offizielle aktuelle Oberfläche beschreibt „ChatGPT Plugins → Add custom MCP server“. Ein Secure MCP Tunnel ist für private Entwicklung möglich, benötigt jedoch `tunnel_id`, Laufzeit-API-Key und Workspace-/Tunnel-Berechtigungen. Keine Schlüssel hier einfügen. Produktive Nutzung braucht zuerst OAuth und stabile Nutzeridentitäten. Öffentliche Einreichung benötigt zusätzlich einen stabilen öffentlichen HTTPS-Endpunkt; ein privater Tunnel genügt nicht. [Einreichungscheckliste](submission/CHECKLIST.md).

`npm run package:review` erstellt `artifacts/dranbleib-review-preparation.zip`: Quellcode, Lockfile, Dokumentation, Entwurfsmetadaten, Prüfszenarien und verfügbare Demo-Screenshots; keine Datenbank, Cookies, Schlüssel, node_modules oder .git. Das ist ein **Vorbereitungspaket**, kein hochladbarer oder bereits genehmigter Produktionsplugin. Fehlende Anbieterangaben und URLs sind offen dokumentiert.

## Git- und Veröffentlichungsstatus

Neues lokales Repository, Branch `main`, Checkpoint-Commits vorhanden. Kein Git-Remote konfiguriert; **nicht gepusht**. GitHub-Zugriff/Remote muss vom Nutzer für dieses Projekt verbunden und autorisiert werden. Kein Hosting eingerichtet, keine Kosten ausgelöst, nicht eingereicht und nicht veröffentlicht. OpenAI-Entwicklerverifizierung, Produktions-OAuth, rechtliche Angaben, Testkonto und endgültige Freigabe stehen aus.
