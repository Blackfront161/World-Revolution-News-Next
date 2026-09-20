# WRN – veraltete Löschbestätigung für lokale Personalisierung

Auftraggeber: PO im aktuellen Chief-Task am 8. September 2026; ausdrücklicher
Auftrag zur Codeanalyse und Bugkorrektur. Quellenbasis `e84d839`. Befund schon
im Task „App-Neuaufbau mit Live-App prüfen“ gemeldet und jetzt im Code bestätigt.
Scope: `PERSONAL-01`, lokaler Datenverlustschutz; keine neue Produktfunktion.

## Fehler und enges Ziel

Store A lädt Einstellungen. Store B speichert neuere Einstellungen. A bestätigt
später Löschen. `clear()` prüft die geladene Berechtigung, aber weder deren
Konfliktepoche noch den inzwischen gespeicherten Rohwert und entfernt B.
Vor `removeItem()` soll derselbe vorsichtige Vorab-Konfliktschutz wie bei
`save()` greifen. LocalStorage wird dadurch ausdrücklich nicht transaktional.

## Besitz und Sequenz

Delegation: erlaubt, keine Kinder. Slotvergabe allein Chief. Ein Sol/high-
Reviewer darf das kleine Design und die UI-Fehlerbehandlung unabhängig nur
lesen; keine Gesamtrepository-/Security-Vollanalyse. Umsetzung erst nach
Rückgabe der exklusiven Medienwriterrechte, durch Chief oder genau einen
Terra-Writer. Keine parallel schreibenden Produktrollen.

Erlaubte Produktpfade ausschließlich:

1. `apps/mobile/src/local-personalization-state.ts`
2. `apps/mobile/src/local-personalization-state.test.ts`

Chief pflegt diesen Brief und seinen Ergebnisbericht separat. Alle anderen
Produktdateien, Schema, Runtimekeys, Dependencies, Legacy/Live bleiben unverändert.

## Abnahme und Checks

- Geladene Berechtigung bleibt einmalig. Veraltete Epoche oder ungleicher
  aktueller Rohwert ergibt `conflict` ohne `removeItem()`.
- `conflict` wird zur Clear-Result-Union ergänzt. Die vorhandene UI behandelt
  bereits `conflict` mit ehrlicher Fehlermeldung und neu erforderlichem Laden;
  das ist vor Umsetzung am Consumer zu bestätigen.
- Ein fehlgeschlagener Vorabread ergibt `unavailable`, null Deletes.
- Ready- und opaque/protected-Werte werden bei aktuellem bestätigtem Stand
  weiterhin exakt am einzelnen eigenen Key entfernt; fremde Keys bleiben.
- Tests: zwei echte Adapter über denselben Speicher, ready->ready,
  ready->future und protected->ready; Storageevent/ABA, Readthrow,
  Wiederverwendung der alten Berechtigung, gültiger Clear und Fremdkeyschutz.
- Node 24.19, fokussierte bestehende/erweiterte Suite, Mobile-Typecheck und
  scoped Format/Lint. Keine sichtbare Layoutänderung; keine neue Screenshotmatrix.
- Unabhängiger read-only Review des finalen Deltas vor Abschluss.

Privacy/Netz/Kosten: nur lokaler Ein-Key-Adapter, keine externe Übertragung oder
neue Abhängigkeit. Rücknahme über getrennten lokalen Commit; keine Datenmigration.

Sol-Designreview am 8. September: GREEN, keine Findings. Reihenfolge und
bestehende UI-Conflictbehandlung unabhängig bestätigt. Medienwriter und
Terra-QA haben ihre Rechte abgegeben; Chief setzt ausschließlich diese beiden
vom Medienkandidaten disjunkten Dateien um. Der Medienreview bleibt unverändert.

Abschlusskandidat: `a489f83`. Fünf neue Regressionen gegen den unveränderten
Altcode zunächst FAIL, nach Fix 14/14 Storetests PASS. Drei Fälle verwenden
zwei reale Adapter über denselben LocalStorage; dazu beobachtetes ABA und
fehlschlagender Vorabread ohne Delete. Bestehende gültige Ready-/Protected-
Löschung und Fremdkeyschutz bleiben grün. Der unabhängige enge Review des
finalen Deltas ist beauftragt; keine neue visuelle oder Releasefreigabe.
