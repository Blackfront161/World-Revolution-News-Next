# WRN-G3-016 – P5-M-001 Legacy-Home-Kompatibilitaet

## Identitaet und Entscheidung

- Task-ID: `WRN-G3-016-S5-F1`.
- Finding: P5-M-001 Medium in `cb1771e`.
- Auftraggeber/Integrationsowner: Main/Chief `/root`.
- Writer: genau ein `frontend_brand_engineer`, Terra/high; keine Kinder.
- Architekturentscheidung: Ein bereits validiertes altes Mobilemanifest ohne
  `homePresentation` bleibt benutzbar. Home zeigt eine getrennte ehrliche
  Legacy-Liste aller bereits validierten Artikel in ihrer vorhandenen
  Reihenfolge. Es werden keine Aufmacher-, Hauptmeldungs- oder Sportrollen
  erfunden. Ein vorhandener, aber ungueltiger aktueller Homevertrag bleibt
  fail-closed und darf nicht auf Legacy zurueckfallen.

## Schreibscope

Erlaubt:

- `apps/mobile/src/App.tsx`;
- `apps/mobile/src/App.test.tsx` nur fuer enge neue Regressionen;
- `docs/evidence/WRN-G3-016/p5-m001-fix/**`;
- `docs/handoffs/WRN-G3-016-p5-m001-fix.md`.

Alles andere ist read-only. Kein Contract-, Fixture-, Store-, Controller-,
Loader-, Website-, Shared-Token-, Katalog-, CSS-, Dependency- oder
Governancewrite. Kein Commit durch den Writer.

## Pflichtsemantik

1. `manifest.homePresentation === undefined` plus validierter Ready-State ist
   ein eigener Legacy-Homezustand, nicht `error`.
2. Die Legacyansicht zeigt Manifestrevision und alle validierten Artikel in
   der vorhandenen Reihenfolge; Reader und Save/Remove bleiben funktionsfaehig.
3. Sie zeigt keine neuen Rollenueberschriften und keinen Sportblock bzw.
   `Alle Sportmeldungen`.
4. Ist `homePresentation` vorhanden, gilt unveraendert nur die strikte
   `1 + 5 + 1 + 2`-Projektion. Fehlende/falsche Rollen duerfen nicht durch die
   Legacyansicht kaschiert werden.
5. Aktuelle G3-016-Sicht, neun Sprachen, vier Themes, Persistenz, Reader,
   Saved, Discover und Fokusnavigation bleiben unveraendert.

## Verifikation

- Enge neue Mobileunit fuer Legacy-Home und fuer kein Fallback bei vorhandenem
  ungueltigem Homevertrag.
- Bestehender A/B/A-Test aus P5-M-001 frisch PASS.
- Vorhandene Neustart-, Aktivierungs- und Rollbackpfade im relevanten Mobile-
  Offlinepaket frisch PASS.
- G3-016-Mobileunits, Typecheck und P3-Visualspec frisch PASS.
- `git diff --check` und Prettier fuer geaenderte Quellen PASS.
- Bericht/Handoff mit exakten Befehlen, Ergebnissen, Dateiliste, Restrisiken,
  Rechteende und `END-CHECK: :)`.

## OUT

Keine echte Inhaltsarbeit, Website, Security-/Architekturfreigabe, Hosting,
Live, Android/AAB/Play, Deployment, Release oder neue Kosten/Dependencies.

