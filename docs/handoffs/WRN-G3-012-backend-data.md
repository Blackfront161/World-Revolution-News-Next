# Agent Handoff – WRN-G3-012 Backend/Data

Stand: 27. August 2026

Produktcheckpoint: `171b3ba`

## GREEN-Ergebnis innerhalb des Backend/Data-Scopes

Der Vertrag fuer eine immutable lokale Contentrevision ist fertig. Er nutzt
Manifest v1 weiter, ohne dessen Schema oder Semantik zu aendern. Ein
Release-Descriptor pinnt den Manifesthash sowie alle additiven Teilvertraege.
Erst die vollstaendige Validierung von Manifest/Payloads, Discover,
Readerdetails, Lifecycle und Websitepublikation liefert `ready`; jede
Abweichung liefert ausschliesslich sichere Fehlerkategorien.

`packages/test-support` erstellt nur eine deterministische, selbst verfasste
Releasefixture. Es ist keine Runtimequelle und es wurde keine Produktdatei
darauf umgestellt.

Der Release-Boundary-Checker deckt nun zusaetzlich Website-Publisher, normale
Werkzeuge und finale `dist`-Artefakte ab. Seine echte Releaseausfuehrung ist
vor dem Folgeschritt bewusst RED, weil die Ausgangsimporte noch vorhanden
sind; seine Negativtestmatrix ist GREEN.

## Naechster einzig erlaubter Mitarbeiter

Ein frischer `frontend_brand_engineer` darf nun ausschliesslich:

1. je einen getrennten Mobile- und Websiteadapter an den G3-012-Descriptor
   binden;
2. die kontrollierten lokalen JSON-Releaseartefakte in jedem Client bereitstellen;
3. Runtime- und normale Buildimports von `@wrn/test-support` entfernen;
4. den Website-Landingpage-Publisher auf dieselbe Descriptorrevision umstellen;
5. enge Client-/Publisher-/Artefaktregressionen schreiben.

Er darf keine Manifestsemantik, Testfixture, Brand/UI, Navigation, Storage,
Service Worker, Cache, Android, Remote/CI, Cloud, Deployment oder echte
Inhalte aendern. Nach seinem Kandidaten folgt ausschliesslich frische,
unabhaengige QA.

## Risiken / Hinweise

- Die lokale Node-Version ist weiterhin 24.16.0 statt der gebundenen 24.19.0;
  dies verhindert nur das Gesamtskript, nicht die gruenen Einzelchecks.
- Es gibt keine produktive Signatur oder Attestation. Das ist bewusst ein
  spaeteres Gate.
- Der neue Release-Lifecycle verwendet dieselben drei validierten Artikel-IDs
  wie Feed/Discover/Reader/Publikation; die alte G3-008-Testlifecyclefixture
  blieb unveraendert.

## WRN-AGENT-STATUS

- Task: WRN-G3-012 Immutable Content Revision Consumer – Backend/Data
- Status: GREEN, Produktcheckpoint `171b3ba`
- Kosten: 0 CHF, keine Provider oder Netzwerkaktion
- Offene Arbeit: ausschliesslich der beschriebene Frontend-/Publisher-Handoff
- Unerlaubte Aenderungen: 0
- END-CHECK: :)
