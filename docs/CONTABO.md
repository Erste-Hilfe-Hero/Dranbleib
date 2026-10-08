# Contabo als vorgesehenes Hosting

Der Nutzer hat Contabo als Anbieter erlaubt. Noch kein Deployment: Die Laufzeit meldet keine verbundenen Secrets, Identitäten oder Serverangaben. Server-IP/Hostname, SSH-Benutzer, sicher konfigurierter SSH-Zugang und gewünschte Domain fehlen. Ein neuer kostenpflichtiger VPS wurde nicht bestellt. Die Anbieterfreigabe benennt noch keinen Tarif und kein Budget.

## Nächster ausführbarer Schritt

Nach Bereitstellung des Zugangs zuerst nur Bestandsaufnahme des ausdrücklich zugewiesenen VPS: Betriebssystem, Ressourcen, bestehende Dienste/Ports, Domains/TLS und verfügbare Zugriffsrechte. Bestehende Anwendungen nicht verändern. Dranbleib in einem separaten Verzeichnis und unter eigenem Dienstbenutzer installieren; keine pauschalen Firewall- oder Systemänderungen.

Für einen privaten Demotest kann der jetzige Loopback-Server auf dem VPS laufen und über SSH-Portweiterleitung bedient werden. Das ist keine öffentlich erreichbare ChatGPT-App. Beispiel nach Bekanntgabe des tatsächlichen Zielservers: lokaler Port 8787 wird auf den Loopback-Port 8787 des zugewiesenen VPS weitergeleitet. Keine Zugangsdaten in Befehlsbeispiele oder Repository eintragen.

Für eine öffentliche ChatGPT-Verbindung zuerst den Produktionspfad implementieren und prüfen: OAuth/PKCE und Discovery, verifizierte Token, stabile nutzerbezogene Persistenz, TLS-Domain und beschränkter Reverse Proxy. Die aktuelle Loopback-/Hostprüfung darf nicht einfach entfernt werden, um die anonyme Demositzung ins Internet zu stellen. Private Entwicklungsverbindung alternativ über autorisierten Secure MCP Tunnel; dafür fehlen weiterhin Tunnelidentität und Berechtigungen.

## Noch benötigte Angaben

- Bereits vorhandener, für dieses Projekt freigegebener VPS: IP/Hostname und SSH-Benutzer.
- SSH-Zugang über sichere Zugangskonfiguration; keine Schlüssel oder Passwörter im Chat, Quellcode oder ZIP.
- Gewünschte Domain/Subdomain und autorisierter DNS-Zugang, falls HTTPS-Veröffentlichung gewünscht ist.
- Bei Neubestellung zuerst konkrete Tarif-/Budgetfreigabe; bislang keine Bestellung autorisiert oder ausgelöst.
- OAuth-Anbieter bzw. verbundene Identitätskonfiguration vor dauerhafter öffentlicher Nutzerdatenspeicherung.

GitHub-Connector ist inzwischen für Erste-Hilfe-Hero verifiziert. Neues Ziel Erste-Hilfe-Hero/dranbleib vom Nutzer autorisiert, aber Erstellung durch die GitHub-Integration abgelehnt (createRepository). Contabo-Zugang und verifiziertes OpenAI-Entwicklerkonto sind weiterhin nicht vorhanden.

## Vorbereitet am 2026-10-08

Privater systemd-Betrieb ist unter deployment/ dokumentiert: eigener Dienstbenutzer, private Datenhaltung, Loopback-Listener und SSH-Portweiterleitung. Die Servicevorlage wurde nicht auf einem Zielserver installiert. Zielserver und Zugänge fehlen weiterhin.
