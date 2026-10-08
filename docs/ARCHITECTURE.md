# Architekturplan – 2026-10-07

Bestandsaufnahme: /workspace enthält nur library-files, scratch und shared; kein Git-Repository, AGENTS.md, README, Build-Skript oder bestehende Integration. Neues unabhängiges Projekt /workspace/dranbleib, Branch main. Keine bestehenden Anwendungen verändert. Keine verbundenen Zugangsdaten oder Git-Remote vorhanden.

- src/domain.js: validierte Vorgänge, regelbasierte Vorschläge, SQLite-Repository und bestätigungspflichtige Änderungen. Besitzer immer vom Server, niemals aus Tool-Argumenten.
- src/server.js: lokale Browser-API mit zufälligem HttpOnly-Sitzungscookie; MCP Streamable HTTP mit separater serverseitig erzeugter Demositzung. Ausschließlich 127.0.0.1. Lokale Daten persistent, MCP-Daten nur im Speicher, Ablauf nach 30 Minuten.
- public/index.html, style.css, app.js: mobile deutsche Oberfläche; dieselbe gebündelte Oberfläche als MCP-Apps-Resource. Host-Bridge nach offiziellem Quickstart. Nur render_dranbleib verknüpft die Resource; Datentools liefern strukturierte Ergebnisse.
- test/: Domain-, echte HTTP/MCP-Integration und Browser-Test.
- docs/: Quellenstand, Datenschutz, Setup, Einreichungscheckliste; submission/: vorbereitete Metadaten und Prüfszenarien ohne erfundene Anbieterangaben.

Keine Inferenzkosten: lokale Regeln liefern einen einzigen vorsichtigen Vorschlag, keine vollständige semantische Extraktion. Status/Rollen sind Vermutungen; relative Fristen bleiben ohne Datum. Nutzer prüft und korrigiert. Dateien zunächst UTF-8 TXT/MD; kein PDF/OCR. Originaltext wird nur während der Anfrage verarbeitet. Vorschläge halten nur einen kurzen Beleg im RAM, verfallen nach 15 Minuten und werden beim Speichern verbraucht. SQLite hält nur bestätigte Felder und den Beleg. Entwürfe werden nicht gespeichert.

Demositzungen sind Zugriffsfähigkeiten, keine verifizierten Nutzerkonten. MCP-Sitzungen ersetzen OAuth nicht; öffentliche Nutzung ist nicht freigegeben. Produktion benötigt OAuth 2.1/PKCE, validierte Signatur/issuer/audience/expiry/scopes, stabile Besitzer-IDs, TLS, Backups/Löschkonzept und Zugriffstests. Keine automatische Überwachung, Pushs, Kalender-, Mail- oder Versandintegration.

## Getrennter authentifizierter Kandidat

`oauth.js` implementiert den OAuthServerProvider für die offiziellen MCP-SDK-Handler; `release-server.js` trennt Anmeldung/Discovery/geschützten MCP-Zugriff vollständig von der anonymen Loopback-Demo. Benutzer, Clientmetadaten und Tokenhashes liegen mit bestätigten Vorgängen in privater SQLite. Besitzer-ID ist ein serverseitiger Hash aus Origin und interner Konto-ID. Toolaufrufe prüfen AuthInfo/Scopes; Transport-Sitzungen sind zusätzlich an dieses Konto gebunden. `install-private.py --mode authenticated` installiert ausschließlich den eigenen Dienst `dranbleib-release` auf Port 8791 mit separatem Benutzer, Verzeichnis und Datenbank. [Release-Grenzen](RELEASE.md).
