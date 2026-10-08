# Geschlossene HTTPS-Testversion

Verifiziert am 8. Oktober 2026 über den bestehenden GitHub-Runner. Öffentlicher Testendpunkt mit geprüftem Zertifikat:

- Oberfläche/Informationen: https://161.97.102.171:8443/
- MCP: https://161.97.102.171:8443/mcp
- Resource-Discovery: https://161.97.102.171:8443/.well-known/oauth-protected-resource/mcp
- OAuth-Discovery: https://161.97.102.171:8443/.well-known/oauth-authorization-server
- Video der lokal geprüften Browserdemo nach Medien-Deployment: https://161.97.102.171:8443/review/walkthrough.mp4

Kein eigener Domainkauf oder zusätzlicher VPS. Eine separate unprivilegierte Node-TLS-Einheit `dranbleib-https` verwendet Port 8443; bestehende Spiel-Proxyports 80/443 und private Demos 8790/8791 bleiben bestehen. Der neue Backenddienst `dranbleib-preview` läuft nur auf 127.0.0.1:8792 mit eigener Datenbank/Benutzer unter `/var/lib/dranbleib-preview`.

Das vorhandene öffentliche Let's-Encrypt-Zertifikat deckt die tatsächliche Contabo-IP ab. Beim ersten Nachweis gültig bis 13. Oktober 2026, 09:42 Uhr Europe/Berlin. Der bestehende `nyrathen-certbot-renew.timer` erneuert das Quellzertifikat; sein Betrieb wurde nicht verändert. Unser eigener Timer prüft Vertrauenskette, IP, Gültigkeit und Schlüsselpassung, importiert das Zertifikat alle fünf Minuten serverintern und schützt den kopierten Schlüssel mit Dateirechten 0600 und eigener UID. Die TLS-Einheit lädt veränderte Zertifikate jede Minute neu. Eine laufende Timerkonfiguration ist kein Nachweis einer künftigen erfolgreichen Verlängerung; Ablauf und Erneuerung weiterhin kontrollieren.

Externe Prüfung: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37811955735 – echtes TLS, Discovery, DCR, PKCE, zwei getrennte Konten, Vorgänge/Entwürfe/Abschluss/Löschung bestanden. Synthetische Testkonten und ihre temporären Passwortdateien anschließend entfernt. Aus diesem Codex-Arbeitsbereich kann die IP nicht direkt geprüft werden: der Sitzungsproxy liefert ein unpassendes Zertifikat für diese IP. TLS-Prüfung wurde nicht abgeschaltet; der externe Runner prüft die tatsächliche Zertifikatskette.

## Testzugang

Öffentliche Selbstregistrierung ist geschlossen. Unautorisierte MCP-Anfragen erhalten 401. Ein Reviewer-Konto mit zwei ausdrücklich synthetischen Beispielen ist erstellt. Seine zufälligen Zugangsdaten liegen **nur auf dem VPS** in `/var/lib/dranbleib-ops/reviewer.json`, root-only 0600. Der vorhandene autorisierte SSH-Zugang kann diese Datei lesen; Passwort nur direkt in die Anmeldeoberfläche bzw. das private OpenAI-Reviewerfeld übernehmen. Nicht im Chat, GitHub, Logs, Support-Issues oder ZIP veröffentlichen.

Ein zusätzliches eigenes Testkonto kann der Betreiber per `scripts/account-admin.js` anlegen. Eingabepasswort über stdin zuführen, keine Passwortargumente und keine Shell-History verwenden. `--credentials-out` legt eine private Datei außerhalb des Projektverzeichnisses an; die CLI gibt keine Zugangsdaten aus. Kein E-Mail-Versand, keine Passwortwiederherstellung.

## ChatGPT-Verbindung

Im autorisierten Konto nach aktueller Dokumentation: ChatGPT Plugins → Add custom MCP server → obige HTTPS-MCP-URL → OAuth-Verbindung → Testkonto anmelden → konkrete Rechte prüfen/bestätigen → neuen Chat mit Dranbleib öffnen. Der echte Kontotest ist mangels verbundenem ChatGPT-/Entwicklerkonto weiterhin nicht ausgeführt. Die Akzeptanz einer IP-Origin mit Port und die Portal-Domainprüfung müssen dort überprüft werden; nicht allein aus unserem erfolgreichen HTTPS-Test ableiten.

## Einreichung

`npm run package:submission -- /absoluter/pfad/provider.json` erzeugt erst mit vervollständigten tatsächlichen Anbieter-/Rechtstextangaben ein ZIP aus `plugin.json`, `mcp.json` und den benötigten Bilddateien. Die Struktur wird gegen die live abgerufenen offiziellen Agent-Plugins-1.0.0-Schemas geprüft. Muster-/fehlende Angaben werden abgewiesen. Eine lokale Schemaprüfung prüft weder Identität noch rechtliche Gültigkeit, Domainbesitz, ChatGPT-Verhalten oder OpenAI-Freigabe.

Die Statusseiten `/privacy` und `/terms` benennen wahrheitsgemäß den unfertigen Stand und ersetzen keine finale Datenschutzerklärung/Nutzungsbedingungen. Anbietername, Anschrift, Kontakt und verifizierter OpenAI-Zugang sind weiter nötig. Eine Portal-Challenge wird erst mit dem dort tatsächlich gelieferten Token als `OPENAI_DOMAIN_CHALLENGE` in der privaten Serverkonfiguration gesetzt; ohne Token antwortet die Challenge-Route 404. Kein Token wurde erfunden und keine Domainverifikation behauptet.

## Abschließende Nachweise

Medien-/Kandidatencode `b5fba1cd6e0f29a3bc936068fa5af4b9045342cc` über Runner 37813599586 installiert. Read-only-Audit 37814175441 bestätigt öffentliches TLS/Discovery, exakt gleiche Video-Prüfsumme, private Reviewerdatei mit 0600 und letzten Quellzertifikat-Erneuerungslauf `Result=success`, `ExecMainStatus=0`. GitHub-Vorabversion [0.2.0-rc.2](https://github.com/Erste-Hilfe-Hero/Dranbleib/releases/tag/v0.2.0-rc.2) mit Vorbereitungspaket und SHA256-Datei veröffentlicht; Runner 37814184718 bestanden. Keine OpenAI-Einreichung oder Verzeichnisveröffentlichung.

Letzter installierter App-Code: `6760616daa325129c76b5af515de8b7fa97ab832`, Runner https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37815046527 bestanden. Der öffentliche Datenschutzstand erläutert zusätzlich die private Klartext-Datei für erzeugte Betreiber-Testzugänge; normale Kontopasswörter bleiben gehasht. Sonstige Test-/Zertifikats-/Datentrennungsnachweise unverändert.
