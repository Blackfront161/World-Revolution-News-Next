# Unbenutzter Parameter im bestehenden Home-Browsertest

Chief-Auftrag: lokale Fehlerkorrekturen,9.September2026. Paritätsbezug:
G3-016-Testhygiene, keine Produktänderung. Owner allein Chief, keine Delegation.
Ausgangscode aaba48e; vollständiger ESLintlauf am9.September endet mit genau
1Fehler: tests/e2e/g3-016-legacy-home-independent-qa.spec.ts:203:4, info unused.
Vorhash b10e09aaad18b512afb2c47bca95e5c87023fd846d02391cad948fea0a01cf80.

Nach Ende der Headerwriterarbeit darf Chief ausschließlich den ungenutzten
zweiten Callbackparameter im Test S5-Q1 entfernen. Der erste Test braucht
seinen info-Parameter weiter; keine Testassertion oder sonstige Datei ändern.
Beleg/Handoff in docs/evidence/WRN-FIX-LEGACY-TEST-LINT-2026-09-09.md.
Keine Persistenz-/Produkt-/Privacy-/Kosten-/Livewirkung. Rücknahme ist der
isolierte Gitdiff. Vorher genau obigen Hash und Gitstatus prüfen, fremden WIP
erhalten. Abnahme: nur ungenutzter Parameter entfernt, scoped ESLint/Prettier
und voller ESLintlauf GREEN, diff --check PASS. Kein neuer Verhaltenstest
für einen nicht verwendeten Callbackparameter. Kein globales Formatieren;
die23 bekannten anderen Formatabweichungen bleiben separat dokumentiert.
END-CHECK: :)
