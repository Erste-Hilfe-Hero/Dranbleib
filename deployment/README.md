# Separater Dranbleib-Dienst auf dem vorhandenen Contabo-VPS

Dranbleib verwendet den bereits vorhandenen Contabo-Zugang aus dem privaten LifeKit-Repository. Es wird kein neuer VPS bestellt. GitHub-Actions nutzt denselben GitHub-hosted Ubuntu-Runner wie die verifizierte LifeKit-Veröffentlichung. Die Nutzerfreigabe erlaubt den eigenen Dranbleib-Workflow; LifeKit-Spielcode und bestehende Spiel-Deployments bleiben unverändert.

## Aufbau

- Zugriffshilfe aus LifeKit auf geprüftem Commit 5a1f0cdd60e06b4f41ad5545030bcaaa0ed8c147; nur innerhalb des Runners ausgeführt. Vier vorhandene CONTABO-Secrets, keine Werte in Dranbleib-Quellcode, ZIP oder Logs.
- Eigener unprivilegierter Dienstbenutzer `dranbleib`, Service `dranbleib`, SQLite unter `/var/lib/dranbleib` mit privaten Dateirechten.
- Versionierte Releases `/opt/dranbleib/releases/<commit>`, atomarer Verweis `/opt/dranbleib/current`.
- Private Node.js-24-Laufzeit im Release. Die Systemlaufzeit und Spielecontainer werden nicht verändert.
- Listener ausschließlich `127.0.0.1:8790`; kein öffentlicher Reverse Proxy und keine Firewalländerung.

## Runner-Aufträge

Die Dateien `lifekit-preflight.workflow.yml` und `lifekit-deploy.workflow.yml` sind die nachvollziehbaren Quellen für die getrennten Workflows im privaten LifeKit-Repository. Die dort tatsächlich installierten Versionen ersetzen Platzhalter durch exakt überprüfte Dranbleib-Commits; keine frei wählbaren Remote-Befehle oder Quelleninputs.

1. **Preflight** führt `contabo-preflight.py` über SSH-stdin aus: OS, Architektur, glibc, Node, systemd, separater Port, freie Kapazität und Projektpfade. Keine Installation oder Änderungen an Anwendungsdaten. Erfolgreicher Lauf: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37732812264
2. **Deploy** führt die zehn Produkt-/MCP-Tests und sechs Archive-Sicherheitstests vor Zugriff auf den Server aus. Anschließend `npm ci --omit=dev`, explizites Paket nur aus src/public/node_modules/runtime/package-Dateien. Keine Datenbank, .git oder .env.
3. `install-private.py` prüft SHA256, festen Commit, Plattform, freigegebenen Pfad und Archiveinträge. Fremde Services und unverwaltete Verzeichnisse werden nicht überschrieben. Eigener Dienststart mit Health-Check; bei Fehlern wird der vorherige Dranbleib-Dienst wiederhergestellt oder die neue Einheit deaktiviert. Keine Spieldienste werden gestartet/gestoppt.
4. `smoke-private.py` prüft synthetische Erfassung/Prüfung/Speicherung, Rollen-/Fristunklarheit, Liste/Filter, Entwurf, Statuswechsel/Abschluss, Fremdzugriffssperre und Löschung gegen den tatsächlich installierten Dienst. Synthetischer Datensatz wird anschließend gelöscht.
5. Nur Installations-/Testbelege werden als Artefakte gespeichert. Temporärer SSH-Schlüssel wird aus dem Runner entfernt. Kein geheimer Schlüssel wird in das öffentliche Repository übernommen.

Der SSH-Trust-Bootstrap übernimmt die bestehende Methode von LifeKit (ssh-keyscan). Dies ist keine unabhängige Prüfung des Hostschlüssels. Für öffentliche Produktionsfreigabe den Fingerprint zusätzlich über einen vertrauenswürdigen Kanal verifizieren. Diese private Entwicklungsinstallation ist keine produktive Mehrnutzerplattform.

## Bedienen

Mit einem eigenen, bereits autorisierten SSH-Zugang zum vorhandenen VPS:

```bash
ssh -N -L 8787:127.0.0.1:8790 root@161.97.102.171
```

Danach im eigenen Browser http://127.0.0.1:8787 öffnen. Private MCP-Adresse auf dem VPS: http://127.0.0.1:8790/mcp. Die Verbindung setzt den tatsächlichen SSH-Zugang voraus; ein Schlüssel wird nicht öffentlich bereitgestellt. Alternativ die Demo lokal mit `npm ci` / `npm start` verwenden.

Auf dem Server: `systemctl status dranbleib`, `curl --fail http://127.0.0.1:8790/health`. Stoppen: `systemctl stop dranbleib`; dies löscht keine Daten. Release und Node stammen aus dem installierten Commit. Eine Wiederholung desselben Releases wird bewusst abgewiesen, bis der vorhandene Stand geprüft wurde. Sicherungen/Exporte bewusst verwalten; keine automatische Datenlöschung.

## Öffentliche ChatGPT-App

Öffentliche HTTPS-Adresse, produktive Freigabe und OpenAI-Einreichung stehen aus. Ein selbst gehosteter OAuth-Kandidat ist implementiert und getrennt installiert; dies ersetzt keine Produktionsprüfung.

## Authentifizierter Kandidat

`lifekit-release.workflow.yml` ist der eigenständige Runner-Auftrag. Er qualifiziert Node-/Archiv-/Browser-/OAuth-Tests und Audit vor Zugriff auf Contabo und installiert mit `--mode authenticated --public-origin https://dranbleib.localhost`. Diese lokale Origin ist keine öffentliche Domain. Eigener Dienst/Benutzer `dranbleib-release`, `/opt/dranbleib-release`, Daten `/var/lib/dranbleib-release`, Loopback 8791. Bestehende Demo auf 8790 und alle vorherigen Dienste bleiben aktiv.

Der Runner öffnet nur eine temporäre SSH-Weiterleitung zu 8791; `smoke-release.mjs` prüft gegen den tatsächlich installierten Dienst DCR, PKCE, explizite Zustimmung, zwei Konten, Datentrennung, Beleg/Unklarheit und CRUD. Synthetische Konten werden danach gelöscht, keine Token/Passwörter ausgegeben. Für öffentliche Freigabe später eine kontrollierte HTTPS-Origin konfigurieren und TLS-Proxy separat prüfen; siehe [Release](../docs/RELEASE.md).
