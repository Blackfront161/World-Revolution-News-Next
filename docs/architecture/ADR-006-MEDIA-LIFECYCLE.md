# ADR-006 – Medien-, Rechte- und Lifecyclevertrag

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Medienumfang, Rechte und bezahlte
  Provider
- Technische Owner nach Freigabe: Backend/Data plus Frontend/Brand
- Betroffene Risiken: R-05, R-09, R-12, R-18, R-25, R-26

## Kontext

Die Baseline umfasst Bilder, externe Radios, Audio, Video, Podcasts und
generierte Podcasts. Mehrere Remote-Feeds fehlen; Rechte und Lizenzen sind
unklar. Anonyme Podcastgenerierung kann Azurekosten, R2-Zustand und
oeffentliche Inhalte erzeugen. Ein Moderations-/Takedownvertrag fehlt.

## Entscheidung

Medien werden nach Herkunft und Lifecycle getrennt. Standard ist Referenz statt
Kopie. Hosting oder Generierung ist nur mit Rechte-, Privacy-, Kosten- und
Takedownbeleg erlaubt.

| Klasse | Zielvertrag | Default |
|---|---|---|
| Artikelbilder | Originalquelle, Rechte-/Alt-Text-Metadaten, kontrollierter Proxy nur wenn erlaubt | externe Referenz oder freigegebene Kopie |
| Freie Radios/Audio | kuratierte Stream-URL, Quelle, Lizenz, Health und bewusster Start | kein Autoplay, kein stilles Drittanbieterladen |
| Video | Quelle, Plattform, Thumbnail, Rechte, Consent/Fallback | Player erst nach Nutzeraktion |
| Originalpodcasts | Feed-/Episode-ID, Publisher, Lizenz, Audio-URL, Dauer, Health | Referenz; Offline nur nach Erlaubnis |
| generierte Podcasts | kanonische Content-ID, Stimme/Modus, Generierungsprovenienz, Status, Ablauf, Takedown | deaktiviert bis Product-Owner- und SEC-002-Freigabe |
| Markenassets | Hash, Ursprung, Rechteinhaber, Lizenz, erlaubte Nutzung, Varianten | kein Import ohne Assetregister |

### Lifecycle

1. **Admission:** Quelle/ID/Medientyp validieren; Generierung zusaetzlich
   zweckgebunden autorisieren.
2. **Verarbeitung:** minimale Payloads, kein Contentlogging, dokumentierter
   Provider und Datenregion/Retention vor Freigabe.
3. **Publikation:** immutable ID/Revision, Provenienz, Rechte- und
   Moderationsstatus; keine freie Clientmetadatenuebernahme.
4. **Auslieferung:** sichere MIME-/Range-/Cacheheader, keine Scriptausfuehrung,
   bewusster Drittanbieterabruf.
5. **Ablauf/Pruning:** feste Policy pro Klasse; Legal Hold oder historische
   Referenz blockiert automatische Loeschung.
6. **Takedown:** sichtbarer Meldeweg, authentisierte Bearbeitung, Sperre im
   vorrangigen Revocation-/Tombstone-Manifest vor physischer Loeschung,
   Cache-Purge und Auditbeleg ohne sensiblen Inhalt.
7. **Loeschung:** Objekt, Derivate, Caches und Katalogeintrag nachweisbar
   behandeln; tote IDs liefern definierten Gone-/Fallbackzustand.

## Alternativen

1. **Alle Medien selbst hosten:** bessere Kontrolle, aber hohe Rechte-,
   Storage-, Egress- und Moderationslast.
2. **Alles direkt extern laden:** wenig Storage, aber Tracking-,
   Verfuegbarkeits-, CSP- und Privacyprobleme.
3. **Generierte Podcasts ganz streichen:** kleinste Kosten-/Abuseflaeche; echte
   Product-Owner-Entscheidung.
4. **Generierung nur redaktionell:** weniger Self-Service, deutlich kleinere
   Admission-/Moderationsflaeche und deshalb bevorzugte Alternative, falls
   Generierung erhalten bleibt.

## Kosten

- Getrennte Messung fuer Storage, Requests, Egress, Transcoding/Speech,
  Moderation und Backups.
- Kein Provider oder Tarif wird ohne Liveinventar als guenstig bezeichnet.
- Harte Monats-/Storagecaps, Warnschwellen und Kill-Switch vor jeder
  kostenpflichtigen Generierung.

## Risiken und Gegenmassnahmen

- Takedown kann historische Links brechen: stabile ID bleibt mit sicherem
  Status und Grundkategorie erhalten, Inhalt/Datei wird gesperrt; das
  monotone Revocation-Overlay aus ADR-004 ueberstimmt auch alte Revisionen.
- Externe Hosts koennen Tracking laden: Consent/Click-to-load und dokumentierte
  Origins.
- Offlinekopien koennen Rechte/Loeschung verletzen: Medienklasse bestimmt
  Downloadrecht, TTL und Remote-Takedownsignal.
- Generierte Stimme/Inhalt kann missbraucht werden: kanonische Eingaben,
  redaktionelle oder starke Admission, Moderation und globale Caps.

## Konsequenzen

Medienqualitaet und -rechte werden Vertragsbestandteil statt Adapterdetail.
Fehlende Feeds erscheinen als deklarierter Zustand. Generierte Podcasts sind
kein Release-1-Zwang und bleiben bis zur Entscheidung technisch deaktiviert.

## Migration

1. Rechte-/Lizenz-/Providerinventar pro Medienklasse.
2. Required/Optional-Medienfeeds und stabile IDs in ADR-004 aufnehmen.
3. Playeradapter mit deterministischen Fixtures, Fehler- und Consentzustaenden.
4. Erst danach freigegebene Hosting-/Offlinepfade.
5. Podcastgenerierung als letzter eigener Slice nach SEC-002 und Takedown-Gate.

## Verifikationsgate

Schema-, MIME-, Range-, CSP-, Consent-, Offline-, Rechte-, Ablauf-, Takedown-,
No-Content-Logging- und Kosten-Cap-Tests bestehen. Ein nicht autorisierter oder
unbekannter Inhalt erzeugt weder Provideraufruf noch Storageobjekt. Jede
ausgelieferte Datei ist ueber ID, Revision, Hash und Rechtebeleg rueckverfolgbar.
Ein gesperrtes Objekt bleibt ueber alte Contentrevisionen, CDN-/Gatewaycaches
und den naechsten Onlineabgleich eines Offlineclients unzugreifbar.
