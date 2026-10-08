# Datenschutz und Vertrauensgrenzen der Demo

Dies ist technische Entwicklungsdokumentation, **keine fertige Datenschutzerklärung**. Verantwortlicher, Anschrift, Support, Rechtsgrundlagen, Hosting/Unterauftragsverarbeiter und Kontakt für Betroffenenrechte sind unbekannt und dürfen nicht erfunden werden. Vor öffentlichem Betrieb ergänzen und fachlich prüfen.

## Was verarbeitet wird

- Vom Nutzer ausgewählter Text wird für einen regelbasierten Vorschlag an den lokalen Server übermittelt. UTF-8-TXT/MD-Dateien werden im Browser gelesen; kein Upload des Originaldokuments als Datei.
- Vorschläge halten nur einen kurzen Auszug (maximal 800 Zeichen), Felder, Begründung, Fakten/Vermutungen und Unsicherheiten im RAM, logisch 15 Minuten; periodische Bereinigung alle 30 Sekunden. Noch keine persistente Speicherung.
- Nach ausdrücklicher Bestätigung werden genau Vorgangsfelder, Beleg, Analysenotizen, Vorgangs-ID und Erstellungs-/Änderungszeit gespeichert. Das Änderungsdatum dient der Nachvollziehbarkeit; keine komplette Quelle oder Änderungshistorie.
- Zufälliges Browsercookie (HttpOnly, SameSite Strict, 30 Tage) wird im Browser gehalten. Nur dessen SHA-256-Hash ist der lokale Dateneigentümer. Keine Namen/Mailadressen als technische Identität, keine Nutzer-ID aus Eingaben.
- MCP-Sitzungen haben eigene zufällige serverseitige Besitzer. Sitzungs-ID darf nicht weitergegeben werden; sie ermöglicht Zugriff auf die Demositzung. RAM-Daten verfallen nach Trennen oder maximal 30 Minuten. Sie sind kein dauerhafter Nutzeraccount.
- Entwürfe werden aus bestätigten Feldern regelbasiert erzeugt, nicht serverseitig gespeichert und nicht versendet. Clipboard/Download werden nur auf Nutzeraktion angesprochen. Export enthält bestätigte Vorgänge und persönliche Inhalte.
- Keine Telemetrie, Inhaltslogs, externen LLM-Aufrufe, Kontenanbindung, Hintergrundüberwachung oder Drittanbieter-Versand. Bei echter Nutzung in ChatGPT würden ausgewählte Inhalte und Toolergebnisse auch vom ChatGPT-Host verarbeitet; diese Demo wurde dort noch nicht verbunden.

## Trennung und Schutz

Jede Repository-Abfrage enthält den serverseitigen Besitzer. IDs fremder Vorgänge ergeben „nicht gefunden“, auch bei Entwurf, Änderungen oder Löschung. Vorschläge sind besitzerbezogen und nur einmal verwendbar. Strikte Eingabe- und Ergebnisschemata; Längenlimits, Datumvalidierung, Host-/Originprüfung für HTTP, JSON statt HTML-Dateneinbettung. Die Oberfläche verwendet textContent für untrusted Daten. Quelltexte werden nie als ausführbare Anweisungen verarbeitet.

Nur Loopback-Listener, keine CORS-Freigabe ins Internet. Bestätigungsfelder allein sind keine kryptografische Nutzerzustimmung: Der vertrauenswürdige Host muss die konkrete Aktion vorher bestätigen lassen. Die Browseroberfläche zeigt Bestätigungshaken bzw. Dialoge. Kein Versand-Tool existiert.

SQLite-Datei und Begleitdateien erhalten Dateirechte 0600, neues Datenverzeichnis 0700. Keine Verschlüsselung, produktive Anmeldung oder abgesicherte gemeinsame Rechnernutzung. Betriebssystemadministratoren und Personen mit Browserprofil-/Datenbankzugriff befinden sich innerhalb der Vertrauensgrenze. Cookies nicht exportieren; `.env`, `data/`, SQLite, node_modules und Artefakte sind gitignoriert.

## Löschen und Export

Einzelne Vorgänge werden über den benannten Löschdialog einschließlich Beleg gelöscht; der Server prüft Besitzer und Bestätigung. SQLite `secure_delete=ON` ist gesetzt. SQLite-Journal/WAL, Betriebssystemabbilder, externe Sicherungen, bereits exportierte Dateien und der Chatverlauf eines Hosts können trotzdem Kopien enthalten. Keine forensisch sichere Löschung versprechen.

**Meine Vorgänge als JSON exportieren** liefert die bestätigten Daten des lokalen Browsers. MCP `export_open_loops` liefert entsprechende Sitzungsdaten im Chat; automatische iframe-Dateidownloads sind nicht garantiert. Verlorenes/gelöschtes Browsercookie bedeutet keinen Löschauftrag und keine Wiederherstellung; Daten bleiben lokal, bis sie gelöscht werden. Für einen vollständigen lokalen Reset: Server beenden, bewusst die private `data/`-Datenbank einschließlich `-wal`/`-shm` löschen und das Cookie entfernen. Vorher bei Bedarf exportieren. Kein automatischer Löschbefehl wird während des Setups ausgeführt.

## Rechtliche Fristen

„Brief / Behördenbrief“ erzeugt immer die Warnung, dass ein Textfund vorläufig ist. Rechtsbegriffe im ausgewählten Beleg lösen ebenfalls die Warnung aus. Nicht erkannte Rechtsbegriffe oder fehlender Kontext können übersehen werden. Zustellung, Wochenenden, Feiertage, Rechtsgebiete und Fristverlängerungen werden nicht berechnet. Mehrdeutige/relative Fristen bleiben ohne verbindliches Datum. Nutzer muss das Original prüfen; Dranbleib ist keine Rechtsberatung.

## Vor Produktion offen

OAuth mit stabiler Nutzer-ID und verifizierten Tokens, echte Account-/Scope-Tests, TLS/Hosting, sichere Sitzungsrotation, Rate Limits, Betriebsüberwachung ohne Inhalte, Verschlüsselung/Backup-/Aufbewahrungskonzept, Nutzerlöschung/Account-Export, juristische Texte und Sicherheitsprüfung. Kein produktiver Mehrnutzerbetrieb freigegeben.

## Authentifizierter Kandidat

Der getrennte Modus speichert zusätzlich Benutzername, interne Konto-ID, Scrypt-Passworthash mit Salt, OAuth-Clientmetadaten sowie kurzlebige Code-/Tokenhashes. Ganze Quellen und Klartextpasswörter/-tokens werden nicht gespeichert. Konten überleben einen Neustart; Export und passwort-/CSRF-geschützte Kontolöschung sind implementiert. Nutzer sehen die dauerhafte Speicherung vor Zustimmung. Keine externe Identitätsplattform, E-Mail-Verifikation oder Wiederherstellung. Produktionsfreigabe und tatsächliche Anbieterangaben fehlen. Details: [RELEASE.md](RELEASE.md).

Bei der geschlossenen HTTPS-Testversion werden zufällige Betreiber-/Reviewer-Testzugänge zusätzlich in einer root-only 0600-Datei außerhalb des Projekts abgelegt. Diese Klartext-Testzugangsdatei ist für die private Reviewer-Einrichtung nötig, niemals öffentlich, in Logs oder im ZIP; sie wird nicht mit normaler Kontopasswortspeicherung verwechselt. Synthetische Smoke-Zugangsdateien werden nach Tests entfernt.
