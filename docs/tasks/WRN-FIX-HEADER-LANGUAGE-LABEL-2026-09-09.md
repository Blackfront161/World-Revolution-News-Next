# Geschlossene Sprachauswahl – enge Fehleranalyse

Stand: 9. September 2026. Status: Ursache lokal eingegrenzt; noch kein
Produkt-/Testwrite während der unabhängigen P4-B-Kandidatenprüfung.
Der Chief-Auftrag autorisiert die lokale Bugkorrektur. Dieser Brief trennt
sie von der eingefrorenen Medienimplementierung `03025f6`.

## Ausgangsverhalten und Belege

Die tatsächliche App-Route bei 390 × 844 zeigt „English (“ statt des
vollständigen gewählten Optionsnamens. Das Verhalten bleibt nach dem
vollständigen Browserlauf bestehen. Beleg: die beiden unabhängigen
Aufnahmen des Writers und Chief-Reproduktion, jeweils
`g3-021-media-actual-route-test-clock.png`. Es ist keine bloße Beobachtung
der isolierten Medienpräsentation.

`apps/mobile/src/styles.css:224` begrenzt den Sprachcontainer regulär auf
6,875 rem beziehungsweise 30 vw. Der native Select ist 100 Prozent breit.
`uiLanguageOptionLabel` im Sprachpaket liefert weiterhin den vollständigen
nativen Namen plus Sprachcode. `needsWideLanguageSelectorLayout` in
`App.tsx:317` aktiviert die vorhandene breite Zeile erst ab 24 Pixel
Rootschrift und höchstens 480 Pixel Viewportbreite.

Die vorhandenen Browserorakel in `tests/e2e/foundation.spec.ts:759` und
`:819` prüfen vollständige Optionsnamen bei 200 Prozent und nach Wechsel
der Schriftgröße, jedoch nicht diese reguläre schmale Ausgangsansicht.
Der P4-B-Diff ändert keine dieser Regeln. Ein bereits älteres sichtbares
Problem ist damit plausibel; ein historischer Gegenlauf ist noch nicht
behauptet. Die unabhängige Terra-QA bestätigt die aktuellen Basiswerte auf
der echten 390 × 844 Route: Selectbreite 110 px, Schrift 700/16 px,
vollständige Option „English (EN)“, neun Optionen, Textbreite 91,25 px.
Das bestehende Orakel reserviert drei em für Pfeil und Padding:
110 − 48 = 62 px verfügbar; es fehlen 29,25 px. Die breite Layoutvariante
ist dabei nicht aktiv.

## Vorgeschlagener enger Korrekturweg

Dem nativen Sprachselect seine für die vollständigen Optionen erforderliche
Breite lassen, statt ihn auf den schmalen Standardwert des Themeschalters
zu begrenzen. Der bestehende flexible Header darf bei Platzmangel umbrechen.
Eine rein mobile CSS-Korrektur ist zuerst zu bevorzugen. Keine verdeckte
Optionsliste, kein neuer Custom-Select, keine geänderten Katalogtexte und
kein Aufweichen des bereits akzeptierten 200-Prozent-Verhaltens.

Der Chief hat nach Browserfreigabe der QA einen rein flüchtigen CSS-Versuch
mit vorhandenem Vite/Chrome und unverändertem Produktcode ausgeführt:
`.language-selector` erhält `flex: 0 0 auto` und `max-width: 100%`;
der zugehörige Select `min-width: 0` und `padding-inline: 1.5em`.
Alle anderen Regeln einschließlich der höher spezifischen 200-Prozent-Regel
bleiben erhalten. Damit erhält das native Steuerelement seine intrinsische
Breite samt Platz für Beschriftung, Padding und Pfeil.

Der Versuch bestätigt zuerst den alten negativen Wert −29,25 px und danach
63 reguläre Messungen (neun Sprachen × 320/360/390/412/600/800/844 px,
844 px im Querformat mit 390 px Höhe): kleinster Textrest +22,421875 px,
Selectbreite 183 px, Mindesthöhe 44 px, kein Seitenoverflow. Neun weitere
Messungen bei 390 px und 200 Prozent Rootschrift: kleinster Rest +4,84375 px,
kein Seitenoverflow. Node 24.19, Exit 0; Browser und Viteserver im finally
geschlossen. Dies ist eine Geometrievorprüfung mit flüchtiger Styleinjektion,
kein Produktfix, keine Screenshotabnahme und kein vollständiger A11y-Nachweis.

Die Änderung darf weder die native Optionsliste
noch deren neun Namen, den zugänglichen Namen, Auswahl, Tastatur und Fokus
verändern. Websiteheader, Mediencontroller, P2/P3, Daten und Provider bleiben
außerhalb dieses Pakets.

## Geplanter Besitz nach den laufenden Reviews

- Alleiniger Produktwriter: Chief, keine parallelen Produktwriter.
- Mögliche Produktdatei: `apps/mobile/src/styles.css`, ausschließlich
  `.language-selector` und unmittelbar zugehörige mobile Selectregeln.
- Enger Browsertest: `tests/e2e/foundation.spec.ts`, ausschließlich die
  Sprachselectororakel; historische Tests erhalten, keine Erwartungen senken.
- Eigene Belege: `docs/evidence/WRN-FIX-HEADER-LANGUAGE-LABEL-2026-09-09.md`
  und `docs/handoffs/WRN-FIX-HEADER-LANGUAGE-LABEL-2026-09-09.md`.
- Weiterdelegation: keine. Ein unabhängiger Prüfer erhält nach dem eigenen
  Kandidaten nur lesenden Zugriff und eigene Belegpfade.

Vor einem Produktwrite müssen die laufenden Media-Reviews beendet und
konkurrierende Besitzer ausgeschlossen sein. Dann eigener Gate-/Basisnachtrag
mit präzisem CSS-Ansatz und Vorhashes; dieser Analysebrief allein erweitert
die aktive P4-B-Allowlist nicht.

## Akzeptanz und Prüfung

1. Bei regulärer Schrift sind alle neun vollständigen Optionen im
   geschlossenen Select bei den gebundenen mobilen Breiten lesbar.
2. Das vorhandene 200-Prozent-Orakel und sein zwölfmaliger Wechsel nach
   normalem Mount bleiben erhalten und grün.
3. Native neun Optionen, Auswahl, Fokus, zugänglicher Name und mindestens
   44 × 44 Pixel bleiben erhalten; kein horizontaler Seitenoverflow.
4. Vergleichsbilder bei gleicher Sprache, Schrift, Theme und Viewport belegen
   die tatsächliche Verbesserung. Ein roter Vorstandsfall ist Pflicht.
5. Nur eigener CSS-/Browserdiff, passende statische Prüfungen, unabhängige
   Sicht-/A11y-Prüfung und danach konkrete lokale PO-Sichtprobe.

Keine Persistenz-, Rechte-, Netzwerk-, Kosten- oder Rollbackwirkung auf Daten.
Der CSS-/Testdiff bleibt separat über Git rücknehmbar. Keine Installation,
Veröffentlichung oder Änderung der Website. END-CHECK: :)

## Präzise Ausführung nach R1-Abschluss

Dieser Nachtrag ist vorbereitet, noch kein Start während der R1-Prüfung.
Root übernimmt nach beiden R1-GREENs die obigen vier Pfade, keine Kinder.
Codebasis aaba48e; unmittelbar vor Write nochmals gleiche Vorhashes prüfen:
CSS4d5d92cf747786bf241d25090d22b0ee0333c255dbed06820c586f4b3cceba32;
Foundation a0cded4c3a78a496809a055dde628148135c202a35c5c3349dc0c6eff2c230dc.
Die beiden Headerbelegpfade sind neu. Produktansatz exakt die vier oben
flüchtig geprüften CSS-Eigenschaften, keine weiteren Selektoren ändern.

Regression zuerst gegen alte CSS rot: neun genaue native Optionsnamen,
reguläre Schrift, sieben Viewports320x568/360x800/390x844/412x915/600x960/
800x1280/844x390. Alle63 in dark; neun Sprachen zusätzlich390x844 in
light/pink/contrast (27), also90 normale Vergleichsbilder. Erste gleiche
390-English-dark-Ansicht vor und nach Fix. Bestehende200Prozent-Fälle,
zwölfmaliger Schriftwechsel und erreichbarer Reader-/Dialogfluss bleiben
inhaltlich erhalten, mobile und Website. Keyboardauswahl und Rückkehr,
zugänglicher Name, Fokus,44px, Overflow, Axe und Fehler/externen Requests
prüfen. 200Prozent ist CSS-Rootschrift, kein nativer Browserzoom.

Chief hat nach QA-Browserfreigabe die bestehenden drei Header-/Reflowtests
unverändert ausgeführt:5PASS und1beabsichtigter Website-Skip, Exit0,19,7s.
Log: C:/Users/patri/AppData/Local/Temp/wrn-header-existing-baseline-b96880be-ac57-4f0e-9832-0c19ccecb5e0.log.
Daher bleiben diese drei Tests bytegleich. Die frühere Vermutung, ihr positiver
Readerfluss werde bereits durch das Homefixture-Ablaufdatum beeinträchtigt,
hat sich in diesem Lauf nicht bestätigt. Kein zusätzlicher Clockfix dort.
Nur der neue Normaltest verwendet genau eine deklarierte Init-Uhr
2026-09-01T12:00:00.000Z vor Navigation (gültiger vollständiger Home-/Sportstand
wie im App.test). Date.now und der geladene Homebestand werden zusätzlich
geprüft. Produktuhr, Fixtures/Pins und sämtliche Staletests bleiben unverändert.

Abnahme: neue Normalmatrix und bestehende drei Sprach-/Reflowfälle,
passende statische Checks, Mobilebuild und Releaseboundary. Ein vollständiger
erneuter Mobilelogiklauf ist für diese reine CSS-Änderung nicht vorgesehen,
sofern kein neuer sachlicher Anlass entsteht. Danach enger unabhängiger
Terra-Sicht-/A11y-/Diffreview mit eigenen Belegpfaden, ohne Produktwrites:
docs/evidence/WRN-FIX-HEADER-LANGUAGE-LABEL-INDEPENDENT-QA.md und
docs/handoffs/WRN-FIX-HEADER-LANGUAGE-LABEL-INDEPENDENT-QA.md.
Delegation: erlaubt für genau einen qa_release_engineer Terra/high nach
Chief-Kandidat; maximal eine Prüf-/Nacharbeitsrunde, keine Kinder/Indexwrites.
Chief reserviert den Slot erst nach abgegebenen Mediarechten im zentralen
G3-021-Register. Anschließend konkrete PO-Sichtprobe.

## Erfüllter Start

Beide R1-Reviewer GREEN und beendet; Chief hat am9.September die obigen
Vorhashes erneut PASS und beide neuen Belegpfade ABSENT geprüft. Nach diesem
separaten Metadatencommit beginnt allein Chief die vier Headerpfade.
