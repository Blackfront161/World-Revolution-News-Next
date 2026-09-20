# Handoff – WRN-G3-019 P2-R2 Architektur-Precheck

- Agent: `g3019_p2_r2_arch`
- Rolle/Modell: `independent_architecture_reviewer`, Sol/high
- Task/Phase: `WRN-G3-019 / P2-R2 Architektur- und Boundary-Precheck`
- gebundene Basis: `6521b4b3411061a56202a4be219b445905f2d46f`
- Review-HEAD: `1d7f225`
- Branch: `codex/g3-015-website-offline-shell`
- Checkout: `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne`
- Ergebnis: **GREEN**, null High/Medium/Low-Findings
- Rechte: nur die zwei neuen Reviewdokumente; Produkt, Tests, Fixtures,
  Governance und Fremddateien read-only
- Kinder: keine
- Tests/Builds/Browser/Netz: keine, auftragsgemaess
- Token-/CHF-Kosten: lokal nicht messbar; keine neue externe API- oder
  Providerkosten

## Uebergabe

Der Redundanzbeweis ist tragfaehig:

1. Raw-Transport und decoded JSON besitzen dieselbe 512-KiB-Grenze. Nach
   bestandenem Raw-Cap kann fatal gueltig dekodiertes und re-encodiertes UTF-8
   nicht ueber dieselbe Grenze wachsen.
2. Der Pixelcap ist exakt `2048 ** 2`. Nach zwei bestandenen
   2048-Dimensionscaps existiert kein isolierter Pixel-`+1`-Fall.

Der R2-Testwrite ist nach Chief-Uebernahme erlaubt, aber nur mit diesen
operationalisierten Bedingungen:

- Loadertripel ohne `content-length` ueber einen echten `ReadableStream`,
  exakter Raw-Pin, ein Request; `-1` und `equal` muessen `ready`, `+1` muss
  `fallback/invalid-sidecar` ergeben.
- Keine privaten Mocks von Reader, Decoder, Parser oder Validator.
- Breitenmatrix mit Hoehe `1`, Hoehenmatrix mit Breite `1`.
- `2048 x 2048` ist der gueltige maximale Flaechenfall; die
  Konstantengleichheiten werden explizit geprueft.
- Ergebnisbericht bildet jede C-13-Grenze auf konkreten Test oder benannte
  Redundanzinvariante ab.

## Erlaubter naechster Schritt

Genau ein `qa_release_engineer` Terra/high darf nur schreiben:

- `apps/mobile/src/mobile-reader-v2.test.ts`,
- `packages/content-contracts/tests/mobile-reader-v2.test.ts`,
- `docs/evidence/WRN-G3-019/P2-R2-BOUNDARY-EVIDENCE.md`,
- `docs/handoffs/WRN-G3-019-p2-r2-boundary-evidence.md`.

Danach zwingend frische unabhaengige QA und Security-Deltacheck. Produktcode,
Fixtures, Website, Shared Reader v1, UI, Provider, Dependencies, G3-020/021,
Karten/Spiel und alle externen Gates bleiben gesperrt. P3 startet nicht aus
diesem Handoff.

## Erzeugte Dateien

- `docs/evidence/WRN-G3-019/P2-R2-ARCHITECTURE-PRECHECK.md`
- `docs/handoffs/WRN-G3-019-p2-r2-architecture-precheck.md`

Mit dieser Uebergabe enden alle Rechte und die Slotreservierung des Reviewers.

**WRN-AGENT-STATUS:** `DONE / P2-R2 ARCHITECTURE GREEN / 0 FINDINGS / TEST-ONLY WRITE MAY START AFTER CHIEF HANDOFF / P3 LOCKED / RIGHTS ENDED`

**END-CHECK:** :)
