# WRN-G3-021 P2-R4-R1 – abschliessende Control-, Safety- und Validatorbindung

Status: **REIN DOKUMENTARISCH – PRODUKT-/TESTWRITE BIS FRISCHEM SOL-R1-GREEN GESPERRT**

Dieser Nachtrag schliesst ausschliesslich `P2-R4-PRE-M-001` bis
`P2-R4-PRE-M-005` und `P2-R4-PRE-L-001` aus dem unabhaengigen R4-Precheck.
Er hat bei Widerspruch Vorrang vor
`WRN-G3-021-P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`; alle strengeren
Regeln aus P2-R1, P2-R2, P2-R3 und P2-R4 bleiben bestehen.

## 1. Feste Basis und Gate

- Produktkandidat:
  `d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`.
- Chief-Reproduktion:
  `4bd6f001550f6520f959797cd41eca784d086995`.
- QA-/Integrity-Findingbasis:
  `873ba96ba1a7ac219458b7af58c4e490754e2c3f`.
- erster R4-Vertrag:
  `884b5403fe6ff6677acd01bdffe71d1a23379a0a`.
- unabhaengiger R4-Precheck-Beleg:
  `0bf4140d5fa686b81ef459257b9e882a257e3710`.
- Branch: `codex/g3-015-website-offline-shell`.
- Checkout: `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne`.

Dieser Nachtrag ist noch keine Writerfreigabe. Nach seinem separaten
Chief-Commit prueft genau ein frischer unabhaengiger
`independent_architecture_reviewer` Sol/high ohne Kinder den festen vollen
Commit. Nur null offene High-/Medium-/Low-, Privacy-, Coverage- und deferred
Findings ergeben GREEN. Erst ein danach separat gebundener Chief-Writergate-
Commit darf genau einen frischen Writer zulassen. Bis dahin bleiben Produkt,
Tests, Fixtures, Browser-Evidence und Assets read-only.

Die bekannten unversionierten Verzeichnisse `.codex-remote-attachments/` und
`.codex/environments/` sind OUT und nie Teil einer Basis oder eines Commits.

## 2. R4-R1-01 – exakt erreichbare Control-Metadaten

Die sechs und nur die sechs erreichbaren Slotformen sind:

| Slotform | minimale `generation` |
| --- | ---: |
| leer | exakt `0` |
| `candidate` | `1` |
| `active` | `2` |
| `active+candidate` | `3` |
| `active+previous` | `4` |
| `active+candidate+previous` | `5` |

Fuer die leere Form gilt weiterhin der vollstaendig kanonische leere
Controlrecord aus P4-02. Fuer jede nichtleere Form gilt wortwoertlich:

- `generation` ist ein positiver Safe-Integer und mindestens der Tabellenwert;
- `highestAcceptedRevision` ist exakt das Maximum der Revisionen aller
  gespeicherten `active`-, `candidate`- und `previous`-Bundles;
- besteht `candidate`, ist dessen Revision exakt
  `highestAcceptedRevision`;
- Pointer und Slots decken einander exakt und bidirektional;
- hoehere Generationen bleiben erlaubt, weil wiederholte erfolgreiche
  Save-/Activate-/Rollbackoperationen die Generation monoton um exakt eins
  erhoehen koennen;
- kein Validator normalisiert, migriert, loescht oder repariert einen nicht
  erreichbaren Zustand.

Die echte IndexedDB-Negativmatrix enthaelt jede nichtleere Slotform mit
`generation = Mindestwert - 1`, mindestens einen zulaessigen hoeheren
Generationswert je Operationsklasse sowie `highestAcceptedRevision` kleiner
und groesser als das exakte Slotmaximum. Jeder negative Fall ergibt
`protected`, null Writes und ein bytegleiches Last-known-good aller Stores.

## 3. R4-R1-02 – Safety muss Active und Previous monoton decken

Ein gespeicherter `active`- oder `previous`-Slot ist nur zusammen mit einem
tief gueltigen, positiven Safetyrecord zulaessig. Fuer jedes dieser Bundles
gelten gleichzeitig:

- `storedSafety.revision >= bundle.release.revocationFloor`;
- jeder Revocation-Entry des Bundles besteht im gespeicherten Safetyrecord
  unter demselben Entrykey mit byte-/strukturidentischem Inhalt;
- jede Revocation-Reference des Bundles besteht im gespeicherten Safetyrecord
  unter demselben Referencekey mit byte-/strukturidentischem Inhalt;
- zusaetzliche Safety-Entries und -References sind nur als bereits gebundene
  monotone additive Higher-Safety zulaessig; bestehende Inhalte duerfen nie
  umgeschrieben, entfernt oder abgesenkt werden.

Ein legitimer initialer `candidate`-only-Zustand darf den kanonischen leeren
Safetyrecord besitzen. Sobald `active` oder `previous` besteht, ist Safety
Revision 0 oder ein fehlender Safetyrecord ungueltig. Candidate muss vor
seiner Aktivierung weiterhin separat gegen gespeicherten Safety und Incoming-
Safety geprueft werden; diese Regel erweitert nicht still die persistierte
Safetydeckung auf einen noch nicht aktivierten Candidate.

Echte IDB-Faelle injizieren fuer Active und Previous jeweils fehlende Safety,
zu niedrige Safetyrevision sowie tief gueltige, aber fehlende/abweichende
Entry- oder Reference-Deckung. `snapshot()`, Save, Activate und Rollback
muessen am gemeinsamen Enforcementpunkt `protected`, null Writes und
bytegleiches LKG liefern. Positive A/B/A-, Previous-Rollback- und additive-
Higher-Faelle belegen, dass legitime monotone Safety erhalten bleibt.

## 4. R4-R1-03 – Manifestassets sind exakt die Episodenreferenzunion

Im vollstaendigen Candidate gilt als Mengenidentitaet:

`manifest.assets[*].id === union(episodes[*].audioAssetId,
episodes[*].thumbnailAssetId, episodes[*].transcriptAssetId ohne null)`.

Die Gleichheit gilt in beide Richtungen. Jede Episodenreferenz benoetigt genau
einen passenden Assetrecord; jeder Assetrecord muss von mindestens einer
Episode referenziert sein. Die bereits gebundene ID-, Kind-, Rechte-, Hash-,
Recordcount-, Raw- und Revocation-Reference-Validierung bleibt zusaetzlich
Pflicht und darf Extra-Assets nicht verdecken.

Die Produktpfadmatrix bindet mindestens Equal, ein fehlendes referenziertes
Asset und ein formal vollstaendiges unreferenziertes Extra-Asset samt
passendem Rightsrecord, Reference und korrigierten Counts. Loader meldet
`invalid`, Store `invalid-candidate`; beide negativen Faelle schreiben nichts
und erhalten das LKG bytegleich.

## 5. R4-R1-04 – Admission-Identitylinks sind je Art und Source eindeutig

Fuer `admission.identityLinks` darf jede Kombination aus
`(kind, sourceId)` hoechstens einmal vorkommen, unabhaengig vom `targetId`.
Das gilt getrennt fuer `kind="alias"` und `kind="successor"`. Ein Alias- und
ein Successor-Link derselben Source bleiben als zwei verschiedene
Kombinationen zulaessig, sofern alle bestehenden Existenz-, Sortier-,
Azyklizitaets- und Exact-key-Regeln erfuellt sind.

Positive und negative Validator-, Loader- und Storefaelle enthalten:

- genau einen Alias beziehungsweise Successor;
- Alias und Successor fuer dieselbe Source als getrennte zulaessige Arten;
- zwei sortierte, azyklische Aliasziele fuer dieselbe Source;
- zwei sortierte, azyklische Successorziele fuer dieselbe Source.

Die letzten beiden Faelle liefern Loader `invalid`, Store
`invalid-candidate`, null Writes und bytegleiches LKG.

## 6. R4-R1-05 – Source-Freshness ist am Releasezeitpunkt verankert

Die gemeinsamen Candidate- und Dokumentvalidatoren pruefen die drei Source-
Relationen ausschliesslich gegen `release.generatedAt`:

- `source.healthAt <= release.generatedAt`;
- `release.generatedAt - source.healthAt <= 86400000` Millisekunden;
- `source.validFrom <= release.generatedAt`.

Der frisch je Load-/Save-/Activate-/Rollbackgrenze gezogene `now`-Wert bleibt
ausschliesslich fuer die bereits gebundenen Current-time-Regeln massgeblich:
`release.generatedAt <= now < release.validUntil` sowie die zeitliche
Gueltigkeit von Release, Admission und Rights. Er ersetzt nie den
`generatedAt`-Anker der drei Source-Relationen. Ein beim Erzeugen hoechstens
24 Stunden alter Sourcezustand wird deshalb nicht allein dadurch ungueltig,
dass das weiterhin gueltige Release spaeter als 24 Stunden nach
`generatedAt` geladen oder gespeichert wird.

Die Matrix bindet fuer `healthAt <= generatedAt` Equal und
`generatedAt + 1 ms`; fuer das maximale Sourcealter exakt 86400000 ms und
`86400001 ms`; fuer `validFrom <= generatedAt` Equal und
`generatedAt + 1 ms`. Ein eigener positiver Current-time-Produktfall laedt
und speichert ein noch gueltiges Release mehr als 24 Stunden nach
`generatedAt`. Loader und Store muessen fuer dieselben Rawbytes dieselbe
Freshnessentscheidung treffen; negative Faelle liefern `invalid` bzw.
`invalid-candidate`, null Writes und bytegleiches LKG.

## 7. R4-R1-06 – erlaubte JSON-MIME-OWS bleibt kompatibel

Der JSON-MIME-Parser akzeptiert ASCII-case-insensitiv genau:

- `application/json` ohne Parameter; oder
- `application/json` mit genau einem unquoted Parameter
  `charset=utf-8`.

Optionales HTTP-OWS (`SP` oder `HTAB`) ist um das Semikolon und um das
Gleichheitszeichen zulaessig. Damit sind unter anderem
`application/json ; charset = utf-8` und case-variierte Entsprechungen
gueltig. Kein weiterer oder doppelter Parameter, kein anderes Charset, kein
quoted Charset und kein anderer Medientyp wird akzeptiert.

Positive Loader-/Parserfaelle binden ohne OWS, OWS an allen erlaubten Stellen,
HTAB und ASCII-Gross-/Kleinschreibung. Negative Faelle binden fehlende MIME,
falschen Medientyp, falsches/quoted Charset, doppelte und zusaetzliche
Parameter. Loaderfehler sind `invalid`, erfolgen vor Candidateannahme und
erzeugen keine Storewrites.

## 8. Unveraenderte Writer-Allowlist und Traceability

Nach gesichertem Sol-R1-GREEN und separatem Chief-Writergate darf genau ein
frischer `backend_data_reliability_engineer` Terra/high ohne Kinder nur die
bereits in P4 gebundenen zehn Pfade bearbeiten. Es kommt kein elfter Pfad
hinzu. Insbesondere bleiben JSON-Fixtures, Assets, `.gitattributes`,
Packageexporte, Dependencies, UI/Player, Website, Shared Reader und zentrale
Governance read-only.

Die Writer-Evidence muss zusaetzlich zur P4-Traceability jede der sechs IDs
`P2-R4-PRE-M-001..005` und `P2-R4-PRE-L-001` auf Produktbedingung, konkreten
Testnamen/Parameter, erwartete Fehlerkategorie, Nullwrite-/LKG-Orakel und
tatsaechliches Ergebnis abbilden. Helper-only-Belege ersetzen keinen
geforderten Loader-, Store- oder echten IDB-Produktpfad.

Writer und Chief reproduzieren unter exakt Node 24.19 beide Typechecks,
scoped Format/Lint, die vollstaendige fokussierte Matrix, echte Chrome-/IDB-
Faelle, alle 19 Boundaries, Fixture-/Releasechecks, Schutz-Hashes, Diffcheck
und Allowlist. Der nicht autorisierte pnpm-Dependency-Repairpfad bleibt
gesperrt; vorhandene direkte Binaries duerfen dieselben Configs und
Entry-Points nichtmutierend pruefen.

Danach folgen weiterhin getrennt Chief-Reproduktion, frische unabhaengige
Terra-QA, ein frischer defensiver Sol-Bypass-/Integrity-/Privacy-Deltarecheck
und zuletzt ein frischer Sol-Architekturabschluss. P2 ist erst nach allen
GREEN-Ergebnissen und null offenen Findings geschlossen.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R4-R1-CONTRACT-COMPLETION`
- Status: dokumentarisch gebunden; wartet auf frischen Sol-R1-Precheck
- Produktbasis: `d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`
- R4-Precheck: `0bf4140d5fa686b81ef459257b9e882a257e3710`, RED
- Findings gebunden: `5 Medium / 1 Low`
- Privacy/deferred: `0/0`
- Produkt-/Testwrite: gesperrt
- P3/extern: gesperrt
- END-CHECK: :)
