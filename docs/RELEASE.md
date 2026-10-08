# Release-Kandidat 0.2.0-rc.2

Geschlossene HTTPS-Testversion, Stand 8. Oktober 2026. Aktueller Aufbau, Testzugang und externe Nachweise: [HTTPS-PREVIEW.md](HTTPS-PREVIEW.md). Öffentlicher Testendpunkt ist vorhanden; öffentliche ChatGPT-Einreichung/Verzeichnisfreigabe nicht erfolgt.

## Historischer privater Kandidat 0.2.0-rc.1

# Release-Kandidat 0.2.0-rc.1

Stand 2026-10-08. Technischer Kandidat mit selbst gehosteter Anmeldung; keine Freigabe oder Einreichung im ChatGPT-Verzeichnis.

## Authentifizierter Modus

```bash
npm ci
PUBLIC_ORIGIN=https://dranbleib.localhost PORT=8791 npm run start:release
```

Diese Beispieladresse ist ausdrücklich nur eine lokale Entwicklungsadresse. Der Server bindet an `127.0.0.1:8791`, liefert selbst kein TLS und ist darüber nicht öffentlich in ChatGPT verbindbar. Für die echte Verbindung benötigt `PUBLIC_ORIGIN` eine kontrollierte HTTPS-Origin und einen TLS-Reverse-Proxy, der den öffentlichen Host erhält. Keine Unterpfade; separate Origin verwenden. SQLite standardmäßig `data/release.sqlite`, optional `DATA_PATH` absolut setzen. Der Dienst benötigt keine Mail-, OpenAI- oder externen OAuth-Schlüssel.

MCP: `/mcp`. RFC-konforme Discovery: `/.well-known/oauth-protected-resource/mcp` und `/.well-known/oauth-authorization-server`. Eigener OAuth-Authorization-Code-Fluss über die offiziellen SDK-Handler mit S256-PKCE, exakter Redirect-/Resource-Bindung und DCR für öffentliche Clients. Konten werden erst im Zustimmungsformular angelegt: frei gewählter Benutzername und Passwort mit mindestens zwölf Zeichen, gespeicherter Scrypt-Hash mit zufälligem Salt. Keine E-Mail, keine Wiederherstellung, keine MFA. Dies ist bewusst eine Kandidatenanmeldung; externe Sicherheitsprüfung bleibt offen.

Access-Tokens gelten zehn Minuten, Refresh-Tokens sieben Tage; nur SHA256-Hashes werden gespeichert. Refresh rotiert die Tokenfamilie. Wiederverwendung eines verbrauchten Refresh-Tokens widerruft die Familie. `/revoke` widerruft einen Grant des authentifizierten Clients. Kontobesitzer sind serverseitig aus interner Nutzer-ID und Origin abgeleitet, unabhängig von Sitzungs-/Tokenwechsel. Leserechte: `loops:read`; Speicherung, Änderung und Löschung zusätzlich `loops:write`. Kein anonymer MCP-Zugriff und keine Browser-Daten-API im Kandidatenmodus.

Bestätigte Vorgänge bleiben nach Trennen/Neustart erhalten. Nur notwendige Felder und kurze Belege speichern; Export über `export_open_loops`. `/account/delete` verlangt Passwort, CSRF-Nachweis und ausdrückliche Löschbestätigung, entfernt Konto, Vorgänge, Vorschläge und Zugriffe. Datenbank und Backups sind nicht verschlüsselt; Hostzugang bleibt Vertrauensgrenze. Keine automatische Sicherung oder zugesicherte vollständige physische Löschung von externen Sicherungen. Ratenlimits und Kapazitätsgrenzen sind vorhanden; hinter Loopback-Proxy gelten Limits aggregiert, kein ungeprüftes Vertrauen in Forwarded-Header.

## Getestet

15 automatisierte Node-Tests: Extraktion, Unsicherheiten, Bestätigung, Filter, Status, Entwurf, Export, Löschung, lokale HTTP-/MCP-Abläufe sowie OAuth-Discovery, PKCE, Resource-/Redirect-Bindung, Consent-CSRF, Code-Replay, Scope-Durchsetzung, getrennte Konten, Persistenz nach Neustart, Refresh-Replay und Kontolöschung. Sechs Archive-Sicherheitstests. Browser-/Hostsimulation mit echten MCP-Tools; kein Test in einem tatsächlichen ChatGPT-Konto.

`deployment/smoke-release.mjs` prüft OAuth und echte CRUD-Abläufe gegen einen laufenden Kandidatendienst und räumt seine synthetischen Konten wieder auf. Kein Passwort oder Token wird ausgegeben.

## Öffentliche Freigabe

Für den historischen privaten Stand noch notwendig gewesen; HTTPS ist inzwischen implementiert. Tatsächliche Anbieter-/OpenAI-Kontovoraussetzungen bleiben offen:

- Kontrollierte HTTPS-Adresse mit gültigem Zertifikat, TLS-Proxy, Betrieb/Backup und verifiziertem SSH-Hostschlüssel. Die reine IP und lokale Beispiel-Origin reichen nicht.
- Tatsächlicher Anbieter mit Anschrift, Datenschutz-/Nutzungsbedingungen und Support. Repository-Kontoname ist keine bestätigte Anbieteridentität.
- Zugriff auf das verifizierte OpenAI-Entwicklerkonto, Domain-Challenge aus dem Portal, Reviewer-Konto und Prüfung in ChatGPT.
- Reviewmaterialien und finale Plattformprüfung; Einreichung und Veröffentlichung sind getrennte ausstehende Schritte.

Der Nutzer hat technische Einrichtung und GitHub-/Runner-/Contabo-Arbeiten autorisiert. Diese Autorisierung liefert weder eine unbekannte rechtliche Identität noch Zugriff auf ein nicht verbundenes OpenAI-Konto.

## Abschließender Kandidatennachweis

Korrigierte Version `55104624ce00511414aec6e93afa69c0e9e57cfe` am 2026-10-08 über den vorhandenen Runner installiert: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37737261844. 15 Node-Tests, sechs Archivtests, beide Browserprüfungen und Audit bestanden. Realer OAuth-/CRUD-/Kontentrennungstest am installierten Dienst bestanden; synthetische Konten danach gelöscht. Service `dranbleib-release`, Listener `127.0.0.1:8791`; vorherige Dienste aktiv. Keine öffentliche HTTPS-Verbindung oder ChatGPT-Verzeichnisveröffentlichung.
