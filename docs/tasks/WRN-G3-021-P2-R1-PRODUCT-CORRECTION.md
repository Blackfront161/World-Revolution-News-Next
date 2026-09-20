# WRN-G3-021 P2-R1 – Produkt-, Sicherheits- und Testkorrektur

Status: **R1 PRAEZISIERT – PRODUKTWRITE BIS FRISCHEM SOL-RECHECK-GREEN GESPERRT**

## 1. Anlass und feste Basis

Der providerfreie P2-Kandidat
`296119e25b5c5a078748d6a6d51cc5eef0b8899e` ist scope-, Hash-, EOL- und
Happy-Path-seitig reproduzierbar. Die unabhaengige Terra-QA und der
versiegelte Sol-Security-/Privacy-Review wurden getrennt im Evidencecommit
`eec64d1` gesichert und melden zusammen:

- `P2-QA-M-001` / `P2-S-M-002`: Safety kann bei Aktivierung sinken;
- `P2-QA-M-002`: der Loader besitzt keinen eigenen 5000-ms-Timeout;
- `P2-QA-M-003`: die verpflichtende Negativ-/Browser-IDB-Matrix fehlt;
- `P2-S-M-001`: Current-time-, TTL-, Admission- und Rights-Freshness fehlen;
- `P2-S-D-001`: strukturierter Candidate und gepinnte Rawbytes koennen
  auseinanderlaufen.

P3, UI und Player bleiben gesperrt. Dieser Vertrag erlaubt noch keinen
Produktwrite. Zuerst muss ein frischer unabhaengiger
`independent_architecture_reviewer` Sol/high diesen Vertrag gegen die
urspruenglichen P2-/R1-/R2-/R3-Vertraege und die beiden Ergebnisberichte mit
null offenen Findings GREEN bestaetigen.

Der erste Precheck ist im Belegcommit `4c841ce` RED mit
`P2-R1-PRE-M-001` und `P2-R1-PRE-M-002`. Die folgenden R1-Praezisierungen
schliessen ausschliesslich diese beiden Vertragsfindings. Ein frischer
unabhaengiger Sol-Recheck bleibt vor jedem Produkt- oder Testwrite Pflicht.

## 2. Verbindliche Korrekturregeln

### R1-01 – eine injizierbare Uhr mit frischer Probe je Entscheidungsgrenze

- Loader, Validator, Persistenz und Aktivierung verwenden denselben explizit
  injizierbaren `clock: () => number`-Vertrag. Produktdefault darf
  `Date.now` sein; Tests muessen eine kontrollierbare Clock injizieren.
- Jede oeffentliche Entscheidungsgrenze nimmt die Clock frisch: genau eine
  Probe fuer den atomaren Loader-/Validatorlauf, eine neue Probe unmittelbar
  vor der Candidate-Persistenztransaktion und eine weitere neue Probe
  innerhalb von Aktivierung beziehungsweise Rollback unmittelbar vor dem
  ersten Write. Ein alter Zeitwert darf nie zwischen diesen Operationen
  weitergereicht oder wiederverwendet werden.
- Jede Zeit muss ein endlicher sicherer Integer sein und als gueltige
  kanonische ISO-8601-Zeit geparst werden. Ungueltig, NaN, Infinity oder
  Mehrdeutigkeit endet fail-closed mit null Writes.
- Es gilt wortwoertlich `generatedAt <= now < validUntil`.
- `validUntil - generatedAt <= 604800000` ms; Equal ist gueltig, `+1` ist
  ungueltig.
- Diese Regeln werden mit der jeweils frischen Probe beim Laden, unmittelbar
  vor dem Candidatewrite und erneut innerhalb derselben Aktivierungs- oder
  Rollbacktransaktion vor dem ersten Write geprueft. Ein zwischenzeitlich
  abgelaufener Candidate wird nicht rotiert. Der letzte gueltige Zustand,
  Safety, Slots und Control bleiben dabei bytegleich unveraendert.

### R1-02 – Admission-, Health- und Rights-Freshness

- Jede Admission ist nur gueltig, wenn `validFrom <= now < validUntil`.
- Der letzte gebundene Healthzeitpunkt darf nicht in der Zukunft liegen und
  hoechstens `86400000` ms vor `now` liegen; Equal ist gueltig, `+1` ist
  ungueltig.
- Ein vorhandenes Rights-`expiresAt` verlangt `now < expiresAt`; Equal ist
  bereits abgelaufen. Fehlende, unklare oder widerspruechliche Rechte bleiben
  fail-closed.
- Release-, Admission-, Health- und Rightszeit werden gemeinsam geprueft;
  keine Teilgueltigkeit und kein stiller Fallback auf einen neueren, aber
  ungeprueften Zustand.

### R1-03 – eigener Transporttimeout

- Jeder der sieben JSON-Requests besitzt einen internen Timeout von exakt
  `5000` ms, unabhaengig davon, ob der Aufrufer je abbricht.
- Interner Timeout und Aufrufer-Abort werden in einem lokalen Abortpfad
  zusammengefuehrt. Listener und Timer werden auf Erfolg, Fehler und Abort
  immer entfernt.
- Timeout, Abort, spaete Resolve-/Reject-Callbacks und Fetchfehler liefern
  eine endliche sichere Fehlerkategorie, werfen keinen unhandled Promise-
  Fehler und erzeugen null Persistenzwrites.
- Der interne Timeout wird testbar injizierbar gemacht, ohne den
  Produktdefault von 5000 ms oder die Produktsemantik zu lockern.

### R1-04 – Rawbytes sind die einzige Persistenzwahrheit

- `saveCandidate` darf keinen frei konstruierten strukturierten Candidate
  neben beliebigen Rawbytes akzeptieren.
- Die Persistenzgrenze erhaelt das vollstaendige rohe Loaderbundle inklusive
  `releaseRaw`, prueft alle Bytecaps, SHA-256-Pins und Descriptorhashes erneut,
  parst alle Dokumente erneut und leitet den zu speichernden Candidate nur aus
  diesen geprueften Bytes ab.
- Alternativ ist ein zur Laufzeit opakes Loaderergebnis zulaessig, wenn sein
  Echtheitsmerkmal ausserhalb des Exportvertrags liegt, nicht serialisierbar
  oder frei konstruierbar ist und Persistenz trotzdem Zeit/Hash/Parse erneut
  prueft. Eine reine TypeScript-Marke reicht nicht.
- Strukturierte In-memory-Mutation bei unveraenderten Rawbytes, fehlendes
  Rawdokument, Zusatzdokument, anderer Key, anderer Hash, anderer Parsebaum
  oder anderes `releaseRaw` wird vor jedem Write abgewiesen.

### R1-05 – monotone Safety- und Revocationsemantik

- Vor Candidatewrite und erneut innerhalb der Aktivierungstransaktion wird der
  aktuelle Safetyrecord gelesen.
- Candidate-Safety kleiner als gespeichert: Reject, null Writes.
- Gleiche Revision und gleicher kanonischer Raw-/Transporthash: No-op; keine
  Generationserhoehung und keine Slotrotation.
- Gleiche Revision und anderer Hash/Inhalt: Conflict, null Writes.
- Hoehere Revision: ausschließlich additive Obermenge. Jeder bestehende Entry
  bleibt byteidentisch erhalten; kein Entfernen, Abschwaechen oder Umschreiben.
- Vor Persistenz gelten weiterhin alle Entry-/Bytecaps, eindeutige IDs,
  Sortierung, Referenz- und Replacementdeckung sowie Azyklizitaet.
- Safety wird zuerst geschrieben und in derselben Transaktion bytegleich
  zurueckgelesen. Erst danach darf die Candidate-/Active-/Previous-Rotation
  erfolgen. Jeder Readback-, Quota-, Abort- oder Transaktionsfehler rollt
  alles zurueck.
- Die Safetygeneration steigt nur bei einer echten hoeheren additiven
  Mutation exakt um eins.

### R1-06 – Blockpruefung vor Slotrotation

Vor jeder Aktivierung werden alle aktuell zu aktivierenden Source-, Series-,
Episode- und Asset-IDs gegen den final gemergten Safetyrecord geprueft.
Source, Series und Episode werden exakt ueber
`(targetKind, targetId, targetHash=null)` gebunden; fuer diese drei Klassen
darf kein Hash erfunden werden. Assets werden ueber ihre ID und den exakt im
Manifest gebundenen aktuellen SHA-256 geprueft. `blocked`, `gone` und
`replaced` blockieren die Aktivierung, solange der Candidate nicht
vollstaendig auf eine gueltige, rechtmaessige und referenzgedeckte Ersetzung
zeigt. Die Pruefung erfolgt vor dem ersten Slotwrite und wird nicht durch
Rollback oder A/B/A umgangen.

## 3. Verbindliche Testmatrix

Die Korrektur ist nur GREEN, wenn mindestens folgende disjunkte Faelle direkt
am echten Produktpfad automatisiert sind:

1. exakte Keys, Typen, Reihenfolge, unbekannte/fehlende Keys, Dubletten und
   Cross-cover fuer alle sieben Dokumente;
2. `generatedAt`: Future, Equal; `validUntil`: minus eins, Equal und plus eins;
   TTL: unter Cap, Equal und `+1`; zusaetzlich Clock-Advance nach gueltigem
   Load/Save auf exakt `validUntil`, danach Aktivierung mit null Safety-,
   Slot- oder Controlwrite und bytegleichem letzten gueltigen Zustand;
3. Admission `validFrom`/`validUntil`, Health `86400000` Equal/`+1`, Rights
   `expiresAt` minus eins/Equal;
4. einzelner und aggregierter JSON-Cap, Rawbyte-Cap, Entry-Caps, Safety-
   Entry-/Bytecap und Assetgroessen/-dimensionen an Equal/`+1`;
5. interner 5000-ms-Timeout, externer Abort vor und waehrend Fetch, spaete
   Resolve-/Reject-Antwort sowie Listener-/Timercleanup;
6. fehlendes/zusätzliches/vertauschtes Rawdokument, falscher Hash,
   Raw-/Structured-Divergenz und manipuliertes `releaseRaw`;
7. Safety lower, equal/same, equal/different, higher/additive,
   nichtadditives higher, fehlende Referenz, Replacementzyklus und Caps;
8. blocked/gone/replaced aktuelle ID getrennt fuer Source, Series, Episode und
   Asset; bei Source/Series/Episode jeweils `targetHash=null`, bei Asset
   zusaetzlich Equal-/Different-/Missing-Hash gegen den exakten Manifest-SHA;
9. echte Chrome-/IndexedDB-Pfade fuer candidate/active/previous, A/B/A,
   Neustart, Rollback, Future-/Corrupt-Raw, persist-before, Quota, Abort,
   Readbackfehler und Transaktionsrollback;
10. null Writes fuer jeden Fehlerfall und unveraenderter letzter gueltiger
    aktiver Zustand.

Mocks duerfen Grenzwerte erzeugen; die IDB-, Timeout-, Abort-, A/B/A- und
Rollbackkernfaelle muessen den realen Browserpfad verwenden. Tests duerfen
nicht nur private Hilfsfunktionen bestaetigen.

## 4. Wortwoertliche Writer-Allowlist nach Precheck-GREEN

Genau ein frischer `backend_data_reliability_engineer` Terra/high darf ohne
Kinder ausschließlich folgende zehn Pfade bearbeiten:

1. `packages/content-contracts/src/mobile-media-v1.ts`
2. `packages/content-contracts/tests/mobile-media-v1.test.ts`
3. `apps/mobile/src/mobile-media-release.ts`
4. `apps/mobile/src/mobile-media-release.test.ts`
5. `apps/mobile/src/mobile-media-catalog-store.ts`
6. `apps/mobile/src/mobile-media-catalog-store.test.ts`
7. `tests/e2e/g3-021-media-catalog-store-harness.ts`
8. `tests/e2e/g3-021-media-catalog-store.spec.ts`
9. `docs/evidence/WRN-G3-021/P2-R1-PRODUCT-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r1-product-correction.md`

Alle sieben JSONs, drei Assets, `.gitattributes`, Packageexport,
Dependencies, Shared-/Website-/UI-/Playerpfade und alle bisherigen Evidence-
Dateien bleiben bytegleich/read-only. Ein notwendiger weiterer Pfad ist ein
Stop beim Chief, keine Selbsterweiterung.

## 5. Pflichtlaeufe und Abschlussgates

Der Writer liefert beide Typechecks, scoped ESLint/Prettier, alle fokussierten
Contract-/Loader-/Storeunits, die komplette echte Browser-IDB-Matrix,
19 Boundaries, Diffcheck sowie Hashbeleg fuer alle unveraenderten JSON-/Asset-/
EOL-/Package- und zehn Boundarypfade. Kommandos, CWD, Nodeversion, Exitcodes,
Fallzahlen, Basis-/Ergebnis-SHA und exakte Dateiliste stehen im Evidence.

Danach folgen ohne Produktwrite:

1. Chief-Reproduktion;
2. frische unabhaengige Terra-QA;
3. frischer versiegelter Sol-Security-/Privacy-Deltacheck;
4. finaler frischer Sol-Architekturabschluss.

Nur vier GREEN-Ergebnisse mit null offenen reportable/deferred Findings
erlauben den Chief, P2 technisch zu schliessen und einen getrennten P3-
Frontendvertrag zu erstellen. Dieser Vertrag erteilt kein P3-, Live-,
Provider-, Content-, Website-, Android-, Play- oder Releasegate.

## 6. WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R1-PRODUCT-CORRECTION`
- Status: R1 praezisiert; Write wartet auf frischen Sol-Recheck
- Produktbasis: `296119e25b5c5a078748d6a6d51cc5eef0b8899e`
- Findingbasis: `eec64d1`; erster Precheck `4c841ce`
- Produkt-/Testrechte: gesperrt
- Naechster Schritt: ein unabhaengiger Sol/high-Vertragsreview
- END-CHECK: :)
