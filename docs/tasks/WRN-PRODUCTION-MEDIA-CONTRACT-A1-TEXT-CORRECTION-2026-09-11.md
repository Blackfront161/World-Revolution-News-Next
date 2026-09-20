# A1 plain-text correction

Independent Sol found A1-INDEPENDENT-M-001 at2911c388: required text can consist
solely of invisible U+200B/C1 U+0085, or contain bidi override U+202E. The current
ASCII-control/trim check does not enforce the agreed visible plain-text rule.

After Sol returns all A1 rights, Root alone owns exactly the same two A1
TypeScript files plus own matching TEXT-CORRECTION evidence/handoff. No children,
provider, client, old V1 or other contract changes. A2 remains pending. Scope is
the accepted existing plain-text requirement, not a schema or policy expansion.

Add correctly rehashed distinguishing tests before changing the validator:
the three independent witnesses, Unicode line/paragraph/control characters,
whitespace/default-ignorable-only values, valid visible multilingual text and
emoji including joiners/variation selectors. Then reject Unicode Cc/Zl/Zp and
Bidi_Control, require at least one code point outside White_Space and
Default_Ignorable_Code_Point, retain existing max-length/surrogate/markup limits.
Do not blanket-reject all format characters; valid emoji remain supported.

Run focused and full contract suites, TypeScript, scoped lint/format and five
V1 pins. Freeze a separate correction candidate for the same independent Sol
finding closure. No browser or native rebuild is relevant. Rollback stays within
this unconsumed module; raw source and all historical evidence remain preserved.
