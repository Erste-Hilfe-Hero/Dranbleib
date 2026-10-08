# Offizieller Quellenstand

Prüfung: 2026-10-07 ca. 15:56–16:11 UTC. Systemdatum und Live-Abruf; vollständige öffentlich zugängliche Markdown-Quellen als `*.source.md` in diesem Ordner gespeichert. Keine Konto- oder Sitzungsschlüssel darin. Versionen live mit `npm view` geprüft, exakt im Lockfile fixiert: MCP SDK 1.32.1, MCP Apps Helpers 2.0.3, Zod 4.6.5; Testwerkzeug Playwright 1.63.0, Node-Laufzeit 24.19.0. „Apps SDK“ ist hier der Plattform-/MCP-Apps-Vertrag, kein erfundenes npm-Paket.

| Thema | Offizielle Quelle | Entscheidung |
|---|---|---|
| Apps SDK Quickstart | https://developers.openai.com/apps-sdk/quickstart.md (Weiterleitung auf `/plugins/build/app-quickstart.md`) | MCP SDK + ext-apps, Streamable HTTP, aktuelle MCP Apps Bridge |
| Server/Annotationen | https://developers.openai.com/plugins/build/mcp-server.md | Benannte Tools, Eingabe-/Ergebnis-Schemata, explizite Annotationen; keine offenen externen Aktionen |
| UI und CSP | https://developers.openai.com/plugins/build/chatgpt-ui.md | Nur Render-Tool mit `_meta.ui.resourceUri`; Resource `text/html;profile=mcp-app`, keine externen Connect-/Resource-Domains |
| OAuth und Identität | https://developers.openai.com/plugins/build/auth.md | Produktion OAuth 2.1, PKCE S256, Discovery/CIMD oder DCR, Tokenprüfung issuer/audience/expiry/scopes; selbst gehosteter Kandidat implementiert und getestet |
| Verbindung/Tests | https://developers.openai.com/plugins/deploy/connect-chatgpt.md | Streamable HTTP, HTTPS oder Secure MCP Tunnel, erlaubtes ChatGPT-Konto nötig |
| Private Entwicklungstunnel | https://developers.openai.com/api/docs/guides/secure-mcp-tunnels.md | tunnel_id, Laufzeit-API-Key, Plattform- und Workspace-Berechtigungen fehlen; kein Tunnel gestartet |
| Paketformat | https://developers.openai.com/plugins/build/plugins.md | Aktuelles root plugin.json + mcp.json (Agent Plugins), keine alte ai-plugin.json |
| Einreichung | https://developers.openai.com/plugins/deploy/submission.md | Verifizierter Entwickler / Apps Management Write, HTTPS-Domainprüfung, 5 positive + 3 negative Szenarien, Video, Demoaccount, aktuelle ZIP-Metadaten |
| Review | https://developers.openai.com/plugins/deploy/app-review.md | Authentifizierung, Toolannotationen, Datenminimierung, UI und Datenschutz vor öffentlicher Einreichung prüfen |
| Richtlinien | https://developers.openai.com/plugins/plugin-guidelines.md | Anbieteridentität/Datenschutz, Zweckbindung, Zustimmung und präzise Fähigkeiten |

Die zunächst ausprobierten Pfade `/plugins/deploy/testing.md` und `/plugins/mcp-review-requirements.md` antworteten 404; ersetzt durch die tatsächlich verlinkten Quellen oben. Kein Inhalt aus diesen fehlenden Seiten angenommen.

Die Dokumentation wurde inzwischen unter „Plugins“ zusammengeführt. Diese neue Terminologie ist kein Rückgriff auf das alte ChatGPT-Plugins-System. Das implementierte Protokoll entspricht den Live-MCP-/MCP-Apps-Quellen. Einzelne Quickstart-Beispiele nennen ältere Mindestversionen; das Projekt verwendet nachweislich verfügbare neuere Pakete und testet deren Laufzeitverhalten.

SDK-Kompatibilitätsdetail: Die installierte MCP SDK serialisiert im Toolverzeichnis `securitySchemes` nicht als Top-Level-Feld. Demo-Noauth ist daher auch im tatsächlich zurückgegebenen `_meta.securitySchemes` deklariert. Dies implementiert keine Authentifizierung. Der authentifizierte Kandidat prüft Discovery, Durchsetzung und die tatsächlich sichtbaren OAuth-Toolmetadaten in echten SDK-Clienttests.

OAuth-Dokumentation am 2026-10-08 erneut live abgerufen (`auth.source.md`). Authentifizierter Kandidat nutzt die offiziellen SDK-Authrouter/PKCE-Handler, DCR, opaque lokal ausgestellte Tokens und resource-/client-/expiry-/scopegebundene Prüfung. Hinzugefügt: express 5.2.1, express-rate-limit 8.7.1; Audit ohne bekannte Schwachstellen. Dies ist keine unabhängige Sicherheitszertifizierung.
