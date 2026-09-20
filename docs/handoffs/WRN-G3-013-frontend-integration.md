# WRN-G3-013 – Frontendintegration Handoff

- Agent: Frontend Brand Engineer
- Status: Produkt-/Testkandidat GREEN
- Produktcheckpoint: `56057dd`
- Evidence/Handoff-Checkpoint: folgt diesem Dokument separat

## Geliefert

`@wrn/ui-language` besitzt eine ausschließlich statische Registry aller neun
freigegebenen UI-Sprachen: `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el` und
`tr`. Die acht nach dem Fundament gelieferten Kataloge sind jeweils vollständig
(186 Schlüssel), typisiert, platzhaltergleich und lokal gebündelt.

Mobile und dynamische Website verwenden den aktiven Katalog für alle bereits
katalogisierten Shell-, Formular-, Dialog-, Reader-, Archiv-, Status- und
A11y-Texte. Die nativen Headerselects enthalten dieselben neun Optionen, ihre
lokalisierten zugänglichen Namen folgen der Auswahl, und `documentElement.lang`
sowie `dir=ltr` werden weiter gesetzt.

Die getrennten Adapterschlüssel bleiben:

- Mobile: `wrn.mobile-ui-language.v1`
- Website: `wrn.website-ui-language.v1`

Fehlender, ungültiger oder nicht lesbarer Rohwert fällt auf Englisch zurück,
ohne den Rohwert zu überschreiben. Ein Schreibfehler bleibt sichtbar und
behauptet keine Persistenz. Es gibt keine dynamischen Importpfade aus Storage.

## Prüfung

Node `24.19.0` und pnpm `11.19.0`:

- Format PASS; Lint PASS.
- 19 Boundarychecks PASS; 8 Typechecks PASS.
- 148 Unit-/Contract-/Komponententests PASS.
- Mobile- und Website-Build PASS.
- Voller Browserlauf: 62 PASS, 148 erwartete Skips, 0 Fehler.
- Ergänzte Neunsprachen-Browsermatrix PASS: Umschalten aller IDs, Persistenz,
  Clientkeytrennung, Storagefehlfälle, lokalisierte Selectnamen, `html lang`,
  `dir`, Hauptbereichswirkung, Contentinvarianz und null neue
  Requests/Cookies/IndexedDB/Cache/SW.

## Visuals

Die 18 beschrifteten Einzelbilder und zwei Kontaktbögen liegen unter
`docs/evidence/WRN-G3-013/implementation/` mit Präfix `56057dd`.

## Enge Reflowanpassungen

- Mobile: Headerselects sind minimal schmaler, damit More, Sprache und Theme
  bei `844x390` nicht umbrechen und die Bottom-Navigation den Maininhalt nicht
  verdeckt.
- Website: Headerlücke, Selectbreiten und Brandtypografie begrenzen die
  200-%-Reflowhöhe; die akzeptierten separaten Mobile-/Websiteheader bleiben
  strukturell unverändert.

## Scopehinweis

Eine beim Arbeitsbeginn vorhandene, fremde unstaged Änderung an
`apps/mobile/src/styles.css` (`.migration-panel`-Abstand) wurde nicht in
`56057dd` aufgenommen und nicht verändert. `.codex-remote-attachments/` wurde
nicht berührt.

## Nachfolge

Der Kandidat ist bereit für die vorgeschriebenen frischen read-only Security-/
Privacy- und Visual-/Accessibilityreviews. Technisches GREEN ist keine
Product-Owner-Abnahme.

END-CHECK: :)
