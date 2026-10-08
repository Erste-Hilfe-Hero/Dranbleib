# Contabo-Status – 2026-10-08

**Private Dranbleib-Demo erfolgreich installiert und getestet.** Installierter Anwendungscommit: `b144fe3ed348d14ea19c1becf0f3965794c20bf2`.

Die Nutzerfreigabe „Mach wie du denkst“ erlaubt den getrennten GitHub-Workflow und das Deployment. Frühere Sperre weiterer GitHub-Speicherungen ist für diese Arbeit aufgehoben. Keine neue Contabo-Instanz bestellt und keine bestehende Spielanwendung verändert.

## Nachweise

- Read-only-Serverinventar: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37732812264 – erfolgreich. Linux x86_64, glibc 2.39, systemd vorhanden, eigener Port frei, keine frühere Dranbleib-Installation. Keine System-Node-Laufzeit vorhanden.
- Erster Installationsversuch: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37733146979 – Dienststart/Health-Check fehlgeschlagen, neue Dranbleib-Einheit zurückgenommen. Ursache im Start über den Release-Symlink lokal korrigiert und mit echtem Prozess-/Health-Test abgesichert.
- Erfolgreiche Installation: https://github.com/Erste-Hilfe-Hero/lifekit-ki-site/actions/runs/37733456055 – zehn Node-Tests, sechs Python-Archive-Sicherheitstests und tatsächlicher Server-Smoke-Test bestanden. Health ok/local-demo, separate Cookieidentitäten isoliert, Testvorgang gelöscht. Vorher laufende Dienste weiterhin aktiv.

## Betrieb

Eigener unprivilegierter Benutzer und systemd-Dienst `dranbleib`, Listener **127.0.0.1:8790**, Daten unter /var/lib/dranbleib, Code unter /opt/dranbleib/current. Node.js 24.19.0 liegt ausschließlich im Dranbleib-Release; System-Node und LifeKit bleiben unverändert. Keine Firewall- oder öffentlichen Proxyänderungen.

Zugriff mit eigenem autorisiertem SSH-Zugang:

```bash
ssh -N -L 8787:127.0.0.1:8790 root@161.97.102.171
```

Danach http://127.0.0.1:8787 öffnen. Auf dem VPS ist MCP unter http://127.0.0.1:8790/mcp verfügbar. Kein SSH-Schlüssel oder Passwort wurde ins öffentliche Dranbleib-Repository kopiert. Zugang wird innerhalb des Runners aus der bereits vorhandenen LifeKit-Contabo-Konfiguration genutzt. Die LifeKit-Workflows zur Spielveröffentlichung wurden nicht gestartet.

Weiteres zu Releases, Rollback und Bedienung: [deployment/README.md](../deployment/README.md).

## Verbleibende externe Schritte

Die private MVP-Demo ist umgesetzt. Eine öffentlich erreichbare ChatGPT-App ist noch nicht veröffentlicht: produktive OAuth-Identität/stabile Nutzerdatenhaltung, eigene HTTPS-Domain, verifiziertes OpenAI-Entwicklerkonto, echte ChatGPT-Kontotests und juristische Anbieter-/Datenschutz-/Supportangaben sind nicht verfügbar. Kein Portal-Upload, keine Einreichung, keine Veröffentlichung. Der gegenwärtige Dienst darf nicht als produktive Mehrnutzerplattform dargestellt werden.
