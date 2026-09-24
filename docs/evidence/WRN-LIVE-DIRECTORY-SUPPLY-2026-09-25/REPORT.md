# WRN live directory supply

Stand: 25. September 2026. Dieses Paket schliesst die sichere, aktuelle
Vorbereitung des Metadatenverzeichnisses. Es nimmt keine Volltexte oder Bilder
auf und veroeffentlicht noch keine Dateien am Produktionshost.

## Verhalten

- Der sechsstuendliche GitHub-Lauf bindet `feed-status.json`, `news-feed.json`
  und `sources-registry.json` an denselben exakten 40-stelligen Commit.
- Der Status- und Nachrichtenabruf behaelt die vorhandenen Freshness-,
  Publikations-, Groessen- und Identitaetspruefungen. Der Quellenabruf ist auf
  vier MiB begrenzt. Alle drei Abrufe teilen eine 30-Sekunden-Grenze, erlauben
  keine Weiterleitung und senden keine Zugangsdaten.
- Nur die bereits validierten historischen `app`-Beobachtungen bleiben aus dem
  gebuendelten Verzeichnis erhalten. Alle bisherigen `github`-Beobachtungen
  werden durch den aktuellen gebundenen Commit ersetzt.
- Das Ergebnis enthaelt ausschliesslich Metadaten und Links. Artikeltexte,
  Bilder sowie behauptete Rechte aus dem Alt-Feed werden nicht uebernommen.
- IDs, Beobachtungszeilen, SHA-256-Werte, Zaehler, Quellenbeziehungen,
  Ruecknahmen, Groessengrenze und das vollstaendige V1-Vertragsformat werden vor
  dem Schreiben geprueft. Snapshot zuerst und `current.json` zuletzt bleiben
  erhalten.
- Der GitHub-Lauf besitzt nur `contents: read`, erzeugt ein drei Tage
  aufbewahrtes Pruefartefakt und kann weder Repository noch Produktionshost
  veraendern.

## Reale lokale Probe

Gebundener Alt-Backend-Commit:
`936b3bae95465fb4e683b1391e112e74ee7ce727`.

- Feed-SHA-256:
  `61fbcd23ab935df89fce1642cd0c949d6aacd0510c89c528de16b5385b2f88f1`
- Quellen-SHA-256:
  `61c55ed1372ffe17be99077b5abe1edfd2edc3e1086387a072757ff7140fe376`
- Ergebnis: 958 Nachrichtenverweise, 532 Quellen, drei Sportnotizen.
- Abgewiesen: 16 HTTP-Nachrichten, neun HTTP-Quellen und fuenf
  Nachrichtenzeilen mit unzureichenden beziehungsweise konfliktbehafteten
  Metadaten.
- Snapshot-SHA-256:
  `32b26c8ff9e2aba0d67838f537eb52f03f1ffd7930309a884ab736ac5f3059e8`.
- `publicationPerformed` blieb `false`.

Die lokale Probe liegt als ignoriertes Arbeitsartefakt unter
`work/live-directory-20260925-a`; sie wird nicht als Produktionsinhalt
versioniert.

## Noch offene Produktionsgrenze

Der erzeugte Review-Paketpfad muss nach finaler Hostingwahl ueber einen
kostenneutralen, authentisierten und rollbackfaehigen Publisher zu
`/wrn-content-directory/` uebertragen werden. Vor dieser getrennt gebundenen
Operation bleiben die Clients beim geprueften lokalen Verzeichnis. Volltext-
und Bildaufnahme bleibt weiterhin ein eigener redaktioneller Rechtepass.
