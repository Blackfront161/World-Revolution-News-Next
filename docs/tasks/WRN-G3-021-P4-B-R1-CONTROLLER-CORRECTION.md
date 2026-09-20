# P4-B R1 – Controller und unterscheidende Orakel

Stand: 9. September 2026. Status: zur Ausführung gebunden nach separatem
Commit dieses Gates. Sol-Abschluss `21656ac`, QA `b0fe614`;
Ausgangskandidat `03025f6`, dokumentarische Startbasis `21656ac`.
Chief-Auftrag: lokale Fehlerkorrektur und Fertigstellung. Paritätsbezug:
laufender G3-021-Medienbereich, keine neue Medien- oder Providerfunktion.

## Gebundene Probleme und Entscheidung

1. Asynchrone Projektionen desselben Hubs können überholt zurückkommen.
   Run-/Hubidentität allein unterscheiden ihre Reihenfolge nicht.
2. Ein bereits committetes SaveCandidate kann nach Unmount ohne Activate
   verbleiben. Der kanonisch-leere Bootstrap startet beim Wiederöffnen dann
   nicht. Der dauerhafte Real-IDB-Nachweis fehlt im Kandidaten; die QA führt
   dies als P4-B-QA-M-001. Vor Produktänderung rot reproduzieren.
3. Zwei ungeordnete Date.now-Init-Skripte schwächen das tatsächliche
   Browser-Zeitgrenzenorakel (P4-B-QA-M-002).
4. Die neue Visualspec enthält einen benutzerspezifischen absoluten
   Harnesspfad. Dieser Test muss vom tatsächlichen Checkout ableitbar sein.

Der vorläufige Same-Payload-CAS-Verdacht ist widerlegt: Der reale P2-Store
prüft expectedGeneration vor jedem No-op innerhalb derselben Transaktion.
P2/P3 bleiben unverändert. Finale unabhängige IDs: P4-B-ARCH-M-001
(unterbrochener Bootstrap), P4-B-ARCH-M-002 (Projektionsreihenfolge),
P4-B-ASSURANCE-M-003 (Testuhr) und P4-B-ASSURANCE-L-004 (Harnesspfad).
Sol bewertet den Korrekturweg PASS CONDITIONAL; die drei geforderten
Konkretisierungen sind in diesem Gate vollständig eingetragen. Laut seinem
Abschluss ist dafür keine weitere Architektur-/Privacy-Vorrunde erforderlich.

## Enger Produktweg

Jeder Aufruf von publishProjection erhält eine monoton steigende, rein
flüchtige Anfragekennung. Nur die jüngste Anfrage desselben aktiven Runs/Hubs
darf Modell und Expirytimer publizieren. Überholte Erfüllung oder Ablehnung
darf weder eine neuere Darstellung noch deren Timer ersetzen. Unmount/Reload
invalidieren weiterhin den gesamten Run. Keine IDB-Pollschleife.

Automatischer Bootstrap bleibt ausschließlich kanonisch leer. Ein gültiger
Candidate ohne Active wird niemals automatisch gezeigt oder aktiviert.
Die neue Recovery ist ausschließlich bei Active und Previous jeweils null
und vorhandenem Candidate zulässig, einschließlich übereinstimmender
Bundle-/Controlslots. Andere noncanonical Zustände bleiben protected/read-only.
Statt des irreführenden gewöhnlichen Leerzustands erscheint eine verständliche
Meldung über die unterbrochene lokale Vorbereitung mit expliziter Aktion zum
Abschließen. Keine internen Generationen/Hashes in Nutzertexten.

**Explizit unabhängig geprüfte Vertragspräzisierung:** Nach genau
dieser Nutzeraktion darf der Controller den bereits sichtseitig beobachteten
Candidate über die vorhandene P2-API abschließen. Die Kandidatenidentität
bleibt nur flüchtig im jeweiligen Controllerlauf. Vor dem Aufruf erneut
snapshot lesen, aktiven Run prüfen und Generation, Candidateinhalt und
Active-/Previouszustand mit dem beobachteten Zustand vergleichen. Bei einer
Abweichung keine Aktivierung; den frischen Zustand ehrlich darstellen.
activate erhält ausschließlich die zuvor beobachtete exakte Generation und
führt unverändert seine atomare CAS-, Pin-, Rechte-, Safety- und Zeitprüfung
aus. Danach Run prüfen und neue Active-only-Hubprojektion lesen.

Dies erweitert die bisherige Grenze „kein Restore aus Candidate“ ausschließlich
um diese bewusste, nochmals geprüfte Nutzeraktion. Kein Restore aus Previous,
kein automatisches Wiederholen, keine neue Persistenz, kein Löschen oder
direkter IDB-Write. Ein fremder/ersetzter Candidate wird nicht durch eine alte
Bestätigung übernommen. Abgelaufene, gesperrte oder geschützte Zustände bleiben
entsprechend den bestehenden P2-Fehlern gesperrt. Fehlt ein sicherer öffentlicher
API-Weg, wird kein UI-Workaround am P2 vorbei implementiert.

## Besitz und Allowlist nach Startbindung

Delegation: erlaubt, zentraler Chief-Slot 1. Genau der vorhandene
frontend_brand_engineer `/root/p4_media_ui_writer`, Terra/high, übernimmt
sequenziell. Keine Kinder, kein Index und keine Parallelwriter. Er ist nicht
allein im Repository; fremde Änderungen bleiben erhalten. Chief integriert.
Die bisherigen unabhängigen Prüfer bleiben von Produkt-/Testwrites getrennt.

Exakt acht Writerpfade:

- `apps/mobile/src/mobile-media-hub-ui.tsx`
- `apps/mobile/src/mobile-media-hub-ui.test.tsx`
- `packages/ui-language/src/index.ts` – ausschließlich zwei neue
  schlüsselgleiche Medien-Copyfelder in den neun Katalogen
- `tests/e2e/g3-021-media-hub-visual.spec.ts`
- `tests/e2e/g3-021-media-hub-visual-harness.tsx` – ausschließlich zusätzliche
  klar getrennte echte Controller-Mountfunktion mit den vorhandenen Adaptern;
  bestehende reine Präsentationsfunktion bleibt semantisch unverändert
- `docs/evidence/WRN-G3-021/P4-B-R1-CONTROLLER-IMPLEMENTATION.md`
- `docs/evidence/WRN-G3-021/P4-B-R1-CONTROLLER-VISUAL-MANIFEST.md`
- `docs/handoffs/WRN-G3-021-p4-b-r1-controller-implementation.md`

P2/P3, Appintegration, CSS/Header, Fixtures/Pins, Config, Lockfile,
Dependencies, Website und Altquellen bleiben read-only. Keine Installation,
Liveänderung, Ausgabe, Veröffentlichung oder automatische Profilbereinigung.
Der engere Headerauftrag wartet bis zum Ende dieses Produktwriters.

## Unterscheidende Abnahme

1. Eine frühere ready-Projektion wird verzögert; eine spätere blocked/stale-
   Projektion darf durch deren späte Rückkehr nicht überschrieben werden.
   Neuester Zustand und Expirytimer bleiben korrekt; auch alter Reject inert.
   Umgekehrter legitimer neuer Readyfall und Unmount/Reload bleiben erreichbar.
2. Realer Catalog und realer Controller: kanonisch leer, SaveCandidate wirklich
   committen, Rückgabe verzögern, Controller unmounten, Rückgabe freigeben.
   Dauerhaften Zustand über frisches DB-Handle exakt prüfen. Neuer Mount
   aktiviert/lädt nicht automatisch und zeigt die neue Aktion. Nutzeraktion
   führt über reales activate zu Active und sichtbarer Hubprojektion; erneuter
   Mount bleibt erfolgreich. Vorherfall muss den alten Dauer-empty zeigen.
3. Zwischen Anzeige/Aktion und frischem Snapshot beziehungsweise Activate
   ausgetauschte Generation: keine Übernahme durch die alte Bestätigung;
   Bytes, Generation und Aufrufzahlen unterscheiden Konflikt von Erfolg.
   Zeitablauf, Safetyblock, Protected, Storagefehler und erneuter Unmount
   aktivieren keinen unzulässigen Inhalt und enden ohne unhandled rejection.
4. Bestehender Unmount-during-load bleibt gen0 ohne Mutation. Fortsetzen,
   explizites Resume und die reale Late-Save-Kompensation bleiben unverändert.
5. Pro Page/Context genau eine deklarierte Uhrinitialisierung. Beide echten
   Routenfälle prüfen zusätzlich den tatsächlichen Date.now-Wert. Keine
   Änderung an Produktuhr, App-Testhook oder Fixturezeit/Pins.
6. Harness-URL aus der Spec-Datei ableiten, benutzerspezifische Pfade entfernen.
   Alle bisherigen 104 Präsentationsvarianten und neun Statusfälle erhalten;
   neuen Status und erfolgreichen echten Recoveryzustand zusätzlich abbilden.
   Keine vorzeitigen Medienrequests; Keyboard/Axe/Overflow/44px nachweisen.

Tests nutzen vorhandene Adapter und echte P2/P3-Komponenten. Keine private
Zustandsnachbildung als Ersatz für den realen IDB-Nachzustand. Wenn ein
unterscheidender Test eine andere Ursache zeigt, vor größerem Delta melden.

## Verifikation, Auswirkungen und Rücknahme

Node exakt 24.19, vorhandene Binaries direkt. Fokussierte Regressionen zuerst
rot auf dem alten Controller, dann grün. Voller Mobilelauf und UI-Sprachsuite,
betroffene Typechecks, scoped Lint/Format, Build sowie 19 Boundaries und
Fixture-/Releasechecks. Die zehn read-only Schutzpins bleiben unverändert.
Browser exklusiv Writer, danach abgegeben. Neue Bilder mit einem eigenen Root,
nachvollziehbarem Kandidatenbezug, Exitstatus und kanonischem Manifest binden.

Keine neue Datenform, kein Migrations-/Provider-/Kosten-/Loggingdelta. Die
Recovery nutzt dieselbe bereits bestehende Catalogrotation und deren CAS.
Der separate Kandidat ist über Git rücknehmbar; bereits erlaubte Aktivierungen
sind normale bestehende P2-Zustände und benötigen keine Schema-Rückmigration.

Nach gesichertem Kandidaten: Chief-Reproduktion und enge unabhängige
Terra-/Sol-Nachprüfung der genannten Befunde, keine erneute Vollanalyse der
unveränderten P2/P3-Historie. Handoff nach Agentenvorlage mit echten Checks,
Restrisiken, Rechteabgabe und END-CHECK. Technisches GREEN bleibt Voraussetzung
für die konkrete lokale PO-Sichtprobe; diese wird nicht vorweggenommen.

## Erfüllte Startbindung

Die beiden unabhängigen Reviewer haben ihre Prüfungen und Belege abgeschlossen.
Browser ist freigegeben; keine parallelen Produkt-/Testwriter. Chief hat die
zehn unveränderten P4-/P3-Schutzpins erneut PASS und die drei neuen Pfade als
nicht vorhanden geprüft. Kein anderer WIP wurde übernommen.

| Erlaubter Pfad | SHA-256 vor R1 beziehungsweise neue Datei |
| --- | --- |
| `apps/mobile/src/mobile-media-hub-ui.tsx` | `b17dda76ce889204b47ecc7733f3f76c9eb9423c7e91593201cb72003c4ebf5b` |
| `apps/mobile/src/mobile-media-hub-ui.test.tsx` | `4829c2a300e5c82c8e7f5da01bda444141dab023603063bd3ba34ff4deeecbd8` |
| `packages/ui-language/src/index.ts` | `8be117fcbc72f8fb2b394f0f603ffc16422e9a5bcd3a223e68c4b90cc6051788` |
| `tests/e2e/g3-021-media-hub-visual.spec.ts` | `140cc71c990c6d833daaff80af31ce63847145e9985737cdc26c9d722f454030` |
| `tests/e2e/g3-021-media-hub-visual-harness.tsx` | `c92e52a1d5445af484e3c3602feacd572dbb4868220017bd9ddc8094b8040f3c` |
| `docs/evidence/WRN-G3-021/P4-B-R1-CONTROLLER-IMPLEMENTATION.md` | ABSENT – neue Datei, vor Start nicht vorhanden |
| `docs/evidence/WRN-G3-021/P4-B-R1-CONTROLLER-VISUAL-MANIFEST.md` | ABSENT – neue Datei, vor Start nicht vorhanden |
| `docs/handoffs/WRN-G3-021-p4-b-r1-controller-implementation.md` | ABSENT – neue Datei, vor Start nicht vorhanden |

### Bereits gebundene Nachprüfung nach Writerende

Nach eingefrorenem R1-Kandidaten und Chief-Reproduktion reserviert Chief die
vorhandenen unabhängigen Reviewer erneut; keiner hat Produktcode geschrieben.
Keine Kinder/Produkt-/Test-/Indexwrites und kein zusätzlicher Vollscan.

- Slot 1: `/root/p4_media_qa`, Terra/high, exklusiver Browser;
  `docs/evidence/WRN-G3-021/P4-B-R1-INDEPENDENT-QA.md` und
  `docs/handoffs/WRN-G3-021-p4-b-r1-independent-qa.md`.
- Slot 2: `/root/p4_media_integrity`, Sol/high, gezielter read-only Delta-/
  Privacy-/Architekturabschluss;
  `docs/evidence/WRN-G3-021/P4-B-R1-INTEGRITY-ARCHITECTURE.md` und
  `docs/handoffs/WRN-G3-021-p4-b-r1-integrity-architecture.md`.

QA reproduziert die neuen echten Orakel sowie die durch den R1-Diff
betroffenen vollen Mobile-/Sprach-, Typ-, Build-/statischen und Browsergates;
neue Bilder mit exaktem Kandidat, eigenem Listenhash und abgeschlossenem
Prozess binden. Sol prüft ausschließlich die vier IDs, korrekte Begrenzung
der Candidate-only-Recovery, die Testaussagekraft und erhaltene P2/P3-Grenzen;
nach QA ist damit auch der enge Architekturabschluss abgedeckt. Der reine
Mocktest kann einen echten Hub-/Catalogtest ergänzen, ihn nicht ersetzen.
Konkrete neue Findings werden selbstverständlich gemeldet. Headerkorrektur
und technische Gesamtfreigabe folgen erst nach diesem Abschluss.

Die fehlenden zwei unterscheidenden Regressionen werden zuerst test-only
gegen den unveränderten Controller von `03025f6` ausgeführt. Erst ihr
nachvollziehbarer RED-Nachweis erlaubt innerhalb dieses Auftrags das
Produktdelta. Das ist eine gebundene Testreihenfolge und benötigt keinen
weiteren Metadatencommit oder eine zusätzliche Reviewrunde. Der im separaten
Gatecommit gesicherte Vertrag aktiviert genau den genannten Terra-Writer.
END-CHECK: :)

## Chief-Fortsetzung nach unvollständiger Rückgabe

Der Terra-Writer ist beendet und hat alle Rechte/Browsersessions abgegeben.
Sein Achtpfad-WIP ist in 39b4c56 gesichert, ausdrücklich kein fertiger Kandidat.
Nach diesem eigenen Dispositionscommit übernimmt allein Chief sequenziell
exakt dieselben acht Pfade. Keine Parallelwriter, keine neuen Produktrechte
außerhalb dieses Vertrags; P2/P3 und zehn Schutzpins bleiben unverändert.
Die obigen acht Vorstände sind jetzt im vollständigen WIP-Commit39b4c56
rückverfolgbar. Die unabhängigen Reviewer haben keine Implementierung geschrieben.

Offen sind die vertraglichen Recovery-Negativorakel und der erfolgreiche
Folgemount. Die bisherigen 402/6/7-Läufe und117Writerbilder gelten nur für
deren tatsächlich geprüften Zwischenstand. Die frühere Writer-GREEN-Aussage
ist zurückgenommen. Root korrigiert Evidence/Handoff nach der Fertigstellung.

Die exakte Altprüfung war kein belegter Vitefehler: Der Writer schrieb git-show
über PowerShell Set-Content -NoNewline. Dadurch wurden Zeilenumbrüche entfernt
und Kommentare konnten nachfolgende Exports verschlucken; der Altdateihash
9dda541716e03b7b88be73ffa3d2892e6edc145a2c7b2668477ccc4faf77299b
war nicht der gebundene Controller. Chief verwendet Gitbytes über Node
execFileSync/writeFileSync, prüft Hash und stellt eigenen WIP im finally wieder
her. Kein Installationsversuch; zwei frühe read-only Transpileversuche mit
nicht installiertem esbuild liefern keinen Produktbefund und werden verworfen.

Erst die vollständigen bestehenden Akzeptanzzeilen und Endprüfungen führen
zum Kandidaten und den oben gebundenen unabhängigen Nachprüfungen.

## R1-Kandidat lokal abgeschlossen; unabhängige Prüfung

Codekandidat aaba48ee4d671b3401ac1f24ddc159a80833a4c5 besteht Chief-Prüfung:
416 Mobile,6 Sprache,7 Typechecks,19 Boundaries,15 Chrome und138PNG,
Build/scoped Lint/Format sowie zehn Schutzpins GREEN. Exakter Altcontroller
fachlich RED reproduziert; vollständige Recovery-Negativorakel/Folgemount
belegt. Writerrechte und Browser abgegeben, kein Produkt-/Testwriter aktiv.
Nach diesem Metadatencommit folgen die bereits gebundenen R1-Prüfungen.
Laufzeitinventur: frühere QA-Instanz nicht mehr erreichbar; Slot1 reserviert
frische p4_media_r1_qa (qa_release_engineer Terra/high), exklusiver Browser,
dieselben zwei R1-QA-Belegpfade. Slot2 reserviert vorhandenen p4_media_integrity
Sol/high, ausschließlich zwei R1-Integrity-Belegpfade. Keine Kinder/Indexwrites,
Slot3 frei. Headerfix wartet auf beide Abschlüsse; PO-/externe Gates offen.
