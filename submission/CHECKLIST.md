# Einreichungsstatus: Vorbereitung, nicht eingereicht

Stand: 2026-10-08. Private Contabo-Demo erfolgreich installiert und geprüft; noch keine öffentliche ChatGPT-Veröffentlichung und kein autorisiertes Entwicklerkonto. Die Metadaten sind Entwürfe, keine nachgewiesen vollständige Portal-Einreichung. Es gibt kein altes `ai-plugin.json`.

## Bereits vorbereitet

- [x] Deutsche Demo mit MCP, aktueller MCP Apps UI, Quellenbelegen und Bestätigungsschritten.
- [x] Eingabe-/Ergebnis-Schemata, passende readOnly/destructive/openWorld-Annotationen, keine Versandfähigkeit.
- [x] Lokale Tests und getrennte Demositzungen, reproduzierbarer Start, Datenexport/-löschung.
- [x] root `plugin.json`-Metadatenentwurf und `mcp.json`-Vorlage nach aktuellem Agent-Plugins-Format.
- [x] Fünf positive und drei negative Prüfszenarien, ohne erfundene ChatGPT-Testergebnisse.
- [x] Vorbereitungspaket ohne Datenbank, Secrets oder private Originaltexte.

## Vor echtem ChatGPT-Test

- [ ] Autorisiertes ChatGPT-Konto/Workspace mit Berechtigung für benutzerdefinierte MCP-Server.
- [ ] ChatGPT-Testverbindung zum bereits installierten privaten Dienst: Secure MCP Tunnel (`tunnel_id`, Runtime-API-Key, Tunnels Read/Use, bei Einrichtung Read/Manage, zugeordneter Workspace), oder ausdrücklich freigegebener HTTPS-Testendpunkt.
- [ ] Keine Demo mit persönlichen Produktivdaten öffentlich zugänglich machen. Host-Prüfung bleibt absichtlich auf Loopback beschränkt; ein Forwarder müsste Host/Origin korrekt erhalten. Keine allgemeine Freigabe durch Weglassen dieser Prüfung.
- [ ] Den Umgang des Hosts mit stateful MCP-Demositzungen prüfen: Verlust bei Neuverbindung ist erwartet. Für den Release-Kandidaten stabile OAuth-Kontenpersistenz testen; anonyme Demo bleibt getrennt.
- [ ] Verbindung: ChatGPT Plugins → + → Add custom MCP server → HTTPS-URL einschließlich /mcp oder vorhandenen Tunnel auswählen → tatsächliche Authentifizierung konfigurieren → Risikohinweis selbst prüfen → installieren → neuen Chat mit @Dranbleib starten. Gegebenenfalls nennt ein Konto diese Funktion noch Entwicklermodus; Konto-/Workspace-Richtlinien gelten.
- [ ] Alle 5 positiven / 3 negativen Szenarien im Konto ausführen; Toolwahl, Argumente, Bestätigungen, Resultate und UI dokumentieren. Nach Metadatenänderungen Refresh und neuer Chat.

## Vor öffentlicher Einreichung

- [ ] Verifizierte natürliche Person oder Unternehmen; OpenAI-Organisation/Projekt und Apps Management Write bzw. Owner-Zugriff. Keine Anbieteridentität bekannt.
- [ ] Echte Anbieter-/Impressumsangaben, Datenschutzerklärung, Nutzungsbedingungen, Support-Kontakt und öffentlich erreichbare URLs; alle benennen denselben tatsächlichen Anbieter. Keine erfundenen Adressen oder Beispielidentitäten hochladen.
- [ ] Stabile öffentliche HTTPS-MCP-URL und finanzierte Hostingentscheidung, TLS, Verfügbarkeit, Domainverifikation. Private Tunnel erfüllen die öffentliche Einreichung nicht.
- [ ] OAuth 2.1 + PKCE S256, korrekte Protected-Resource-/Authorization-Server-Discovery, CIMD oder DCR, verifizierte Tokens inkl. issuer/audience/expiry/scopes und stabile nutzerbezogene Besitzer-ID. Demo-Cookies/MCP-Sessions reichen nicht.
- [ ] Authentifizierte Datentrennung, Scopefehler, Tokenrotation/-widerruf, Ratenlimits, Backup-/Lösch- und Aufbewahrungskonzept prüfen.
- [ ] Nutzeraccount-Export/-löschung und Privatsphäre nach Produktionsarchitektur erneut testen und dokumentieren.
- [ ] Dediziertes Reviewer-Testkonto mit synthetischen Daten, nötigen Berechtigungen und funktionsfähigem Login ohne MFA-/SMS-/E-Mail-Freigabehürde; Zugangsdaten nur im privaten Portal hinterlegen, niemals im ZIP.
- [ ] Tatsächlich passende Icons/Logo, Screenshots, Aufnahme der Hauptabläufe und öffentlich zugängliche Video-URL ergänzen. Demo-Screenshots sind lokal vorhanden; noch kein Video.
- [ ] `plugin.template.json` nach `plugin.json` übernehmen und fehlende echte Anbieter-/URL-Felder ergänzen; `mcp.template.json` nach `mcp.json` mit echtem Endpunkt übernehmen. `<PUBLIC_HTTPS_MCP_URL>` niemals hochladen.
- [ ] Finale ZIP mit genau einem registrierten MCP-Server erstellen und gegen aktuelle Agent-Plugins-Schemas sowie OpenAI-Portal prüfen. Keine app-Verweise/.app.json oder Lifecycle-Hooks für das öffentliche Verzeichnis.
- [ ] Im Portal Upload → verifizierte Entwickleridentität → MCP verbinden → Domainprüfung: exakten Portal-Token als Klartext auf `/.well-known/openai-apps-challenge` → Scan Tools → Pflichtbefunde beheben.
- [ ] Reviewmaterialien, fünf positive und drei negative getestete Fälle, Video, Konto und tatsächliche Länder-/Sprachauswahl ergänzen. Kein automatisches Bestätigen von Policy-Attestierungen.
- [ ] **Submit for review** durch autorisierte Person, Entscheidung abwarten; **Publish** getrennt nach Freigabe. Beides ausstehend.

## GitHub und Contabo

Öffentliches Repository https://github.com/Erste-Hilfe-Hero/Dranbleib vorhanden, Source-Pushes verifiziert. Zusätzliche separate Workflows im privaten LifeKit-Repository vom Nutzer freigegeben. Erfolgreiche private Contabo-Installation und reale Servertests: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37733456055. Kein GitHub-/Contabo-Zugang mehr als pauschaler Blocker zu behandeln.

Selbst gehosteter OAuth-Kandidat implementiert und automatisiert geprüft. Offen sind öffentliche HTTPS-Einrichtung und Produktionsfreigabe, echter ChatGPT-Test, verifiziertes Entwicklerkonto, reale rechtliche Angaben und Einreichung. Der private Dienst ersetzt diese Prüfungen nicht. Keine vorhandenen Spiel-Deployments verändert.

Kandidatenprüfung: Discovery, S256-PKCE, Resource-/Redirect-/CSRF-Bindung, Scopes, Kontentrennung nach Neustart, Refresh-Replay und Kontolöschung bestanden. Das ersetzt die Prüfung im tatsächlichen ChatGPT-Konto oder die OpenAI-Einreichung nicht.

## Ergänzung 0.2.0-rc.2 – 8. Oktober 2026

- [x] Öffentlicher HTTPS-Testendpunkt https://161.97.102.171:8443/mcp, extern TLS/OAuth/CRUD geprüft, geschlossene Registrierung.
- [x] Reviewer-Testkonto mit synthetischen Beispielen, Zugangsdaten nur privat auf dem VPS.
- [x] Vier Icons/Logos, Screenshot und Video des tatsächlichen lokalen Browserablaufs; kein ChatGPT-Kontotest.
- [x] Paketbuilder mit offiziellen Schemas; verweigert unbekannte Anbieterangaben.
- [ ] Tatsächliche Anbieter-/Rechtsangaben vervollständigen. Statusseiten sind keine fertigen Rechtstexte.
- [ ] Verifiziertes OpenAI-Konto verbinden, IP-Origin/Port im Portal prüfen, echten Challenge-Token bereitstellen, Hosttests durchführen.
- [ ] Review einreichen und Freigabe/Veröffentlichung verifizieren.
