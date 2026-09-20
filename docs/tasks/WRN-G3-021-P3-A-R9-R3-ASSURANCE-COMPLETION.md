# WRN-G3-021 P3-A-R9-R3 – vollständige Ausführung der bestehenden Testverträge

Chief-Disposition vom 8. September 2026. PO-Auftrag: lokale Fehlerkorrektur
und Fortsetzung durch den neuen Head Chief. Delegation: erlaubt, keine Kinder.
Dies ergänzt keine Produktsemantik und ersetzt kein unabhängiges Endgate.

## Feste Grundlage

- Medienprodukt/-testkandidat: `fe528fd5062cb515c03359ed612fee46d0579735`.
- Terra-QA: GREEN; Sol-Deltarecheck: RED mit ausschließlich
  `P3-A-R9-R2-DIP-A-M-001`, `-002`, `-003`.
- Maßgebliche Normen bleiben die bereits GREEN vorgeprüften R9/R1-Verträge
  sowie R6s exakte Timergrenzen. Findings beschreiben deren unvollständige
  Ausführung, keine neuen Anforderungen.
- Separater Clearfix `a489f83` und test-only Clock-/Lintfix `9b6cc34` liegen
  außerhalb des Medienkandidaten. Die volle Mobilebaseline ist jetzt
  **342/342 PASS**; die drei früheren Clockfehler sind behoben.

## Exakter Writerbesitz nach diesem separaten Dokumentcommit

Genau derselbe `frontend_brand_engineer` Terra/high setzt fort, ohne Kinder,
Index oder Commit. Chief und andere Rollen schreiben keinen Produktcode.
Allein erlaubt sind diese vier bereits früher erlaubten Pfade:

1. `apps/mobile/src/mobile-media-hub.test.ts`
2. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
3. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
4. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Produktcode, andere Tests, Harness, Fixtures, Assets, Config, Dependencies,
Runtimekeys und Datenverträge sind read-only. Keine Testhooks im Produkt.

## Verbindliche Restarbeit

1. **Unitmatrix wirklich ausführen.** Jede der 42 Zellen erhält den eigenen
   R9-/R1-Ablauf: pending Save plus richtige saved/no-op-Zuordnung, gültigen
   Record vor Seek, letzte Asyncgrenze vor null Delete bei Epochverlust,
   echtes erfolgreiches Delete, Missing-/Generation-/Recordrace ohne Erfolg,
   pending Save/Delete mit exakt zugeordnetem Run B/Unmount vor Resolve/Reject.
   Keine gemeinsame Else-Happy-Path-Simulation. Pro Zelle vollständiger
   Request-/Decoder-/Seek-/Save-/Delete-, Store-, Player-, Resume-, Element-
   und URL-/Revoke-Sollzustand.
2. **Browserorakel schließen.** Decoder/Audio-Factory getrennt von `load`
   zählen. Pre-delete vollständig am Playerzustand prüfen. Erfolgsfälle
   müssen die gebundene Ursache tatsächlich an der Senke aktivieren und
   `stale` für Expiry beziehungsweise `blocked` für Blockfälle beweisen.
   Alle IDB-Records einschließlich Generation und Fremdsentinel vollständig
   vergleichen, auch bei allen sieben Provenienzregressionen; kein
   `objectContaining` als Ersatz für exakte persistente Nachzustände.
3. **Timerliterale erhalten.** Deterministische Uhr/Timersteuerung muss
   tatsächlich bis 4999, dann 5000, dann 5001 ms fortschreiten und jeden
   Zustand separat prüfen. Ein manuell sofort ausgelöster Callback mit zwei
   unmittelbar gelesenen Nachzuständen ist kein Ersatz. Vorhandene
   test-only Zeitkontrolle nutzen; keine realen langen Sleeps oder Retries
   bis zufällig grün und keine Abschwächung der 5000-ms-Produktdeadline.
4. **Evidence wahr halten.** Aktuellen Kopf auf diesen Stand setzen,
   frühere GREEN-Behauptung hinsichtlich Testcoverage explizit durch den
   Sol-Befund einschränken. Historie erhalten; drei Findings einzeln auf
   konkrete Tests/Orakel abbilden. Bei echter Unerreichbarkeit oder neuer
   Produktlücke sofort den genauen Widerspruch an Chief melden.

## Abschluss und Schutzgrenzen

Node exakt 24.19. Fokussierte 3-Dateien-Suite, ganze Browserspec zweimal
unmittelbar aufeinanderfolgend, sieben Typechecks, Mobile-Build, scoped
Lint/Format, 19 Boundaries, Fixture-/Releasechecks, voller Mobilelauf und
Diff-/Vierpfadprüfung. Die Pflichtläufe betreffen den finalen Endstand.

Von den zwölf ursprünglichen Schutzpfaden bleiben elf Original-Sollhashes
unverändert. Ausschließlich `apps/mobile/src/App.test.tsx` wurde zuvor im
separaten autorisierten test-only Commit korrigiert und ist für diesen
Writer erneut schreibgeschützt auf SHA-256
`40958504ba94a1eeff49b9341715af60e9d98b66ae86353e01d338b6780d6e5e`.
Die ursprüngliche Medienprüfung auf `fe528fd` behält ihren alten Zwölferbeleg;
keine nachträgliche Behauptung identischer Hashes über beide Commits.

Zusätzlich müssen die zwei Clearfixpfade und der Reader-Test dem eingefrorenen
`9b6cc34` entsprechen. Kein Parallelwriter, keine Reparatur außerhalb dieser
vier Pfade. Rückgabe unstaged an Chief, danach unabhängige Delta-QA und
Integritätsprüfung. P4-B und alle externen Gates bleiben geschlossen.
