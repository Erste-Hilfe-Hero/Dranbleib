# Privater Betrieb auf einem vorhandenen Contabo-VPS

Diese Dateien wurden lokal vorbereitet, **nicht auf Contabo installiert**. Der Dienst ist eine private Entwicklungsdemo, unabhängig vom Wert NODE_ENV. Er bleibt an 127.0.0.1 gebunden. Kein öffentliches Hosting, keine OAuth-Anmeldung, keine Kontoüberwachung.

## Voraussetzungen und Bestandsaufnahme

Linux-VPS mit systemd, Node.js 24 oder neuer unter /usr/bin/node, npm, separater Dienstbenutzer dranbleib und Projektverzeichnis /opt/dranbleib. Diese konkreten Pfade vor Installation prüfen. Zuerst bestehende Dienste und Belegung von Port 8787 prüfen; keine fremden Anwendungen überschreiben. Die Vorlage ist für einen dedizierten Benutzer gedacht, nicht root. Bestellung, Systeminstallation, Benutzeranlage und Deployment wurden hier nicht ausgeführt.

## Installation nach verbundenem und autorisiertem Zugang

1. Auf dem tatsächlichen Zielserver OS, Node-/npm-Version, freie Ressourcen und `ss -ltn` prüfen. Falls Node nicht an /usr/bin/node liegt, ExecStart in der Servicevorlage an den verifizierten Pfad anpassen.
2. Quellcode aus dem geprüften ZIP in ein neues Projektverzeichnis übertragen. Keine lokalen Datenbanken, Cookies oder .env-Dateien kopieren. Projektcode gehört einem administrativen Deployment-Benutzer und muss für den Dienst lesbar sein; der Dienst benötigt keinen Schreibzugriff auf den Code.
3. Im Projektverzeichnis `npm ci --omit=dev` ausführen. Keine API-Schlüssel erforderlich. Für Tests vorher vollständig `npm ci`, `npm run check` und `npm test` ausführen.
4. Den separaten Dienstbenutzer bereitstellen, Vorlage prüfen und als /etc/systemd/system/dranbleib.service installieren. Erst danach `systemctl daemon-reload` und `systemctl enable --now dranbleib` ausführen. StateDirectory wird von systemd privat unter /var/lib/dranbleib angelegt.
5. Auf dem VPS `curl --fail http://127.0.0.1:8787/health` prüfen: status ok, mode local-demo. `systemctl status dranbleib` prüfen; keine Quelleninhalte loggen.
6. Vom eigenen Rechner per SSH-Portweiterleitung auf den ausdrücklich zugewiesenen VPS zugreifen: `ssh -N -L 8787:127.0.0.1:8787 SSH_BENUTZER@VPS_HOST`. SSH_BENUTZER/VPS_HOST sind Platzhalter, keine bekannten Zugangsdaten. Dann http://127.0.0.1:8787 öffnen. Falls Port 8787 lokal belegt ist, einen freien lokalen Port verwenden.

Der systemd-Dienst ist auf Start/Stop/Neustart ausgelegt. Zum Stoppen `systemctl stop dranbleib`; dies löscht die Datenbank nicht. Backups, Exportdateien und Löschung müssen bewusst verwaltet werden. Die Browseridentität bleibt cookiegebunden; vor Cookieverlust exportieren.

## Öffentliche ChatGPT-App

Diese Vorlage allein stellt keine öffentliche ChatGPT-App bereit. Vor einem öffentlichen Reverse Proxy sind OAuth/Discovery/Tokenprüfung, stabile Nutzerpersistenz, Domain/TLS und reale Plattformtests nötig. Host-/Originprüfung nicht einfach entfernen. Öffentliches Hosting und Einreichung bleiben blockiert; siehe ../submission/CHECKLIST.md und ../docs/CONTABO.md.

## Bestehender LifeKit-Runner

`lifekit-preflight.workflow.yml` ist eine **nur lokal gespeicherte Vorlage** für einen getrennten manuellen Actions-Auftrag im LifeKit-Repository. Sie verwendet dessen bestehende CONTABO-Secrets und denselben GitHub-hosted Ubuntu-Runner wie der verifizierte erfolgreiche Lauf. Die Zugriffshilfe bleibt im privaten LifeKit-Repository; keine Secretwerte oder SSH-Schlüssel werden in das öffentliche Dranbleib-Repository kopiert.

Die erste Stufe führt `contabo-preflight.py` über SSH-stdin aus: Linux-/Architektur-/Node-/systemd-Prüfung, freier separater Port 8790 und Dranbleib-Pfade. Keine Installation, kein Neustart, kein Zugriff auf Anwendungsdaten. Vor tatsächlicher Nutzung muss die Quelle auf den dann überprüften Dranbleib-Commit gepinnt werden. Der bisherige SSH-Trust-Bootstrap des vorhandenen Workflows verwendet ssh-keyscan; dies ist keine unabhängige Hostschlüsselverifikation. Für einen produktiven Deploymentauftrag vorher den Hostschlüssel über einen vertrauenswürdigen Kanal prüfen.

Der Nutzer hatte GitHub-Speicherungen gestoppt. Deshalb wurde diese Vorlage nicht auf GitHub gespeichert oder ausgeführt. Eine erneute konkrete Freigabe für Workflow-Speicherung und Deployment wurde angefragt. Erst nach positiver Antwort kann diese Stufe auf dem tatsächlichen Host ausgeführt und ein passender isolierter Installationsauftrag erstellt werden. Die vorhandenen Spieleworkflows werden nicht ausgelöst.
