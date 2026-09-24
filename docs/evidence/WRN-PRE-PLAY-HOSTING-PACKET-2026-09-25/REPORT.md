# Vorab-Release-Hostingpaket

Stand: 25. September 2026. Dieses Paket verbindet den aktuellen Webauftritt,
die neun lokal aufgenommenen Artikel und das im öffentlichen GitHub-Lauf
erzeugte Metadatenverzeichnis zu einem einzigen prüfbaren Transferstand. Es
führt noch keine Veröffentlichung durch.

## Konkreter Kandidat

- Website-Revision: `wrn-production-news-2026-09-20-v6`
- Website: 33 Dateien und 9.906.055 Bytes
- Verzeichnis: Sequenz `202609241636`, 958 Nachrichtenverweise, 532 Quellen
  und drei Sportnotizen
- Verzeichnis-Snapshot: 1.928.624 Bytes, SHA-256
  `42e5fc54bd80b9241787e21494954f66584aaca6cbd74d5c89f116a6a45024ac`
- Kombiniertes Hostingpaket: 36 Dateien und 11.836.005 Bytes
- Paketmanifest: SHA-256
  `629a17ee3346ad3be06dcd1bf232af21243b6a4ae3f78b12cfca6718097c4edd`

Der Paketprüfer rekonstruiert die erwarteten Dateien aus dem bereits
verifizierten Websitepaket und dem validierten Verzeichnis-Refresh. Er lehnt
abweichende, fehlende, zusätzliche oder verlinkte Dateien ab und prüft die
vollständige Datei- und Aktivierungsreihenfolge.

## Sichere Aktivierung und Rücknahme

Unveränderliche Dateien werden zuerst übertragen. Die beiden veränderlichen
Zeiger stehen bewusst am Ende:

1. `wrn-production-content/current.json`
2. `wrn-content-directory/current.json`

Vor Aktivierung müssen die bisherige Serverwurzel und beide bisherigen
Zeigerantworten aufbewahrt werden. Bei einem Fehler werden exakt diese Bytes
wiederhergestellt. Der neue Verzeichniszeiger erhält `no-store`; der
unveränderliche Snapshot erhält ein einjähriges Immutable-Caching. Beide
Verzeichnisantworten erlauben credentiallose CORS-Abrufe und setzen eine
passende Cross-Origin-Resource-Policy.

## Prüfung

- 12 gezielte Pakettests bestanden, darunter deterministische Wiederholung,
  reale Closure, Header, CLI sowie Ablehnung veränderter, fehlender und
  zusätzlicher Bytes.
- ESLint und Prettier bestanden.
- Das reale 36-Dateien-Paket wurde anschließend nochmals vollständig durch
  `verifyProductionHostingPacket` geprüft.
- `publicationPerformed` blieb `false`; Produktion, Cloudflare und Google Play
  wurden nicht verändert und verursachten keine Kosten.

## Noch vor einer Play-internen Freigabe

Der Hostingtransfer muss authentisiert auf den Produktionshost ausgeführt und
danach per HTTPS, Header-, Hash- und Client-Refresh-Probe bestätigt werden. Das
AAB benötigt anschließend die vorhandene Produktionssignatur. Ein echtes
Play-internes Upgrade und der Play-Pre-Launch-Bericht sind erst nach dem bewusst
ausgelösten Upload möglich. Übersetzungs- und Azure-Podcast-Provider bleiben bis
zu einer nachweislich kostenfreien Ressourcen- und Kontingentbindung deaktiviert;
die App fällt dafür auf Originaltext beziehungsweise lokales Artikelvorlesen
zurück.
