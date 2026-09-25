# Aktuelle regionale Termine – Abschlussbeleg

Stand: 25. September 2026. Auditstatus: **GREEN für den exakt geprüften
Terminstand**. Dieser Status ist keine Gesamtfreigabe für Hosting, Android,
Signierung oder Google Play.

## Ergebnis

Revision 3 enthält fünf zukünftige, kuratierte Termine in fünf Regionen, vier
Ländern und drei Kontinenten. Die Auswahl bleibt ausschließlich lokal im
Browser-/App-Speicher. Es wird weder ein Standort abgefragt noch ein
Nutzungsprofil übertragen. Der Snapshot ist als `metadata-references-only`
gebunden und kopiert keine fremden Texte, Bilder, Audio- oder Videodateien.

Die exakt geprüften Rohbytes haben SHA-256
`4ccb0da681444a8970e16113c7160c840f4cc9d777aafaba82923478ad9672a3`,
wurden am 25. September erzeugt und sind bis 2. Oktober 2026 gültig.

## Quellen und aufgenommene Metadaten

- New York: [Interference Archive – EWOC Workers’ Circle](https://interferencearchive.org/event/ewoc-workers-circle/), 6. Oktober 2026, 18:30–20:30 Ortszeit.
- London: [ISRF – Constitutionalising Anarchy: Book Launch](https://mailinglist.isrf.org/p/isrf-book-launch-announcement-constitutionalisin), 23. Oktober 2026. Da die Quelle keine belastbare Endzeit nennt, zeigt WRN bewusst nur das Datum und „Uhrzeit nicht angegeben“.
- Greater Manchester: [Manchester & Salford Anarchist Bookfair](https://bookfair.org.uk/), 31. Oktober 2026, 10:00–16:00 Ortszeit.
- Santiago: [La Zarzamora – 8vo Encuentro del Libro y la Propaganda Anarquista](https://lazarzamora.cl/invitacion-al-8vo-encuentro-del-libro-y-la-propaganda-anarquista-de-santiago-2026/), 7.–8. November 2026. Ein nicht belegter Veranstaltungsort wurde nicht ergänzt.
- São Paulo: [Agência de Notícias Anarquistas – XVI Feira Anarquista de São Paulo](https://noticiasanarquistas.noblogs.org/post/2026/06/19/iniciamos-os-trabalhos-de-divulgacao-da-xvi-feira-anarquista-de-sao-paulo/), 12. Dezember 2026, 10:00–19:00 Ortszeit.

Die Angaben wurden am 25. September gegen diese öffentlichen Primär- oder
zugeordneten Ankündigungsseiten geprüft. Politische Selbstbeschreibungen,
Rechte oder Aktualität über die konkret sichtbaren Angaben hinaus werden nicht
behauptet.

## Laufender Betrieb

Der sechsstündliche, weiterhin nicht veröffentlichende GitHub-Dry-run prüft
jetzt zusätzlich:

- die vollständige bestehende V1-Vertragsvalidierung;
- den kompilierten SHA-256-Pin gegen die exakten JSON-Rohbytes;
- Erzeugungs- und Ablaufzeit;
- fünf Quellen und fünf Termine;
- mindestens 48 Stunden redaktionellen Vorlauf vor Ablauf.

Ab 48 Stunden Restlaufzeit schlägt der Prüflauf geschlossen fehl und hinterlegt
den Status im kurzlebigen Review-Artefakt. Er nimmt keine ungeprüften Termine
automatisch auf und verändert keine Clientdaten.

## Prüfung

- Mobile: 939/939 Unit-/Komponententests.
- Website: 154/154 UI-/Komponententests plus 68/68 Produktions-, Offline- und Hostingtests.
- Regionaler Browserabschluss: 16/16 mit beiden Clients, Violet/Rot und Rot/Cyan, 320–1920 px, 200%-Reflow, Tastatur, Axe, Speichern/Neustart/Löschen sowie beschädigten und zukünftigen IDB-Zuständen.
- Freshness-Guard: 3/3 Offline-Grenztests; veränderte Bytes, 48-Stunden-Grenze und exakter Ablauf werden abgewiesen.
- Beide TypeScript-Prüfungen und Produktionsbuilds bestanden.

Der Browserlauf fand zusätzlich einen realen Website-Überlauf der Wortmarke bei
390 px und 200% Textgröße. Die Marke bleibt nun in ihrer Gridspalte und bricht
lesbar um; die vollständige 16-Fälle-Suite ist danach grün.

## Grenzen

Die Quellen können Termine ändern oder absagen. Deshalb ersetzt der Hash- und
Freshness-Guard keine redaktionelle Wiedervorlage. Ohne frische, belegte
Revision zeigt der Client nach Ablauf keine angeblich aktuellen Termine. Es
erfolgten keine Veröffentlichung, kein Hostingtransfer und kein Play-Upload.