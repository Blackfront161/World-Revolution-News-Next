# WRN-G3-021 P2-R1 – LF-Checkoutbindung der Textfixture

Status: **ENGER VERTRAG – PRODUKTCOMMIT BIS SOL-PRECHECK-GREEN GESPERRT**

## Finding

Der technisch GREENe, noch uncommittete P2-WIP bindet
`episode-local.txt` auf exakt 25 LF-Bytes und SHA-256
`ab5596429ec71dd956a264ad8beb93d42ed9e41bd480ff52b9f4c059454d6041`.
Globales Git `core.autocrlf=true` und die bestehende Regel `* text=auto`
koennen diese Bytes bei einem frischen Windows-Checkout in CRLF umwandeln.
Damit waere die runtimegepruefte Assethashbindung trotz technisch korrektem
Indexblob nicht reproduzierbar. Der Writer stoppte vor Commit.

## Exakte Korrektur

Die P2-Allowlist wird um genau einen zweiundzwanzigsten Bestandsdateipfad
erweitert:

22. `.gitattributes`

Prehash:
`9b86e940db220945cc3f996791948c21ed2d806a9a526bcdb04caab3f66b75a1`.

Erlaubt ist ausschliesslich eine additive letzte Zeile, ohne Aenderung,
Reihenfolgewechsel oder Formatierung bestehender Regeln:

```gitattributes
/apps/mobile/public/wrn-mobile-media/v1/episode-local.txt text eol=lf
```

Keine globale `*.txt`-Regel, kein `-text`, keine andere Datei oder Fixture,
keine Gitconfigaenderung und kein neues Tool sind erlaubt. Die semantische
MIME-/Plain-text-Klasse bleibt erhalten; nur die Checkout-EOL wird auf LF
fixiert.

## Pflichtbelege nach Korrektur

1. `git check-attr text eol -- <fixture>` ergibt `text: set`, `eol: lf`.
2. Workingtree-, gestagter Blob- und Ergebniscommit-Blob haben jeweils exakt
   25 Bytes und den gebundenen SHA-256; kein `\r`.
3. Ein isolierter Checkout-/Checkout-index-Beleg unter explizitem
   `core.autocrlf=true` ergibt denselben Bytehash.
4. Alle 22 Pfade und nur diese sind im Produktcommit; `.gitattributes`
   entspricht Prehash plus exakt einer Zeile.
5. Beide Typechecks, scoped ESLint/Prettier, 5 fokussierte Units, 2 echte
   Chrome-IDB-Tests, 19 Boundaries, Release-/Fixturechecks, Package plus zehn
   Boundaryhashes und Diffcheck laufen frisch GREEN.
6. JSON-/Releasebytes bleiben unveraendert, sofern die Korrektur nur
   `.gitattributes` betrifft. Jede weitere WIP-Aenderung verlangt erneute
   Hashbindung und vollstaendige Tests.

## Sequenz

1. Frischer Sol-Precheck prueft diese minimale Scopeerweiterung.
2. Nur bei null Findings darf ein frischer Terra/high-Writer den vorhandenen
   WIP uebernehmen, exakt diese Zeile ergaenzen und alles neu pruefen.
3. Erst komplett GREEN werden alle 22 Pfade in genau einem linearen
   Ergebniscommit gesichert; Handoff und Rechte gehen an Chief.
4. Danach folgen Chief-Reproduktion, frische unabhaengige QA,
   Security/Privacy und Architekturabschluss. P3 bleibt gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R1-EOL-CORRECTION`
- Status: dokumentarisch gebunden; Produktcommit gesperrt
- Finding: checkoutabhaengige LF/CRLF-Hashabweichung
- Rechte: keine bis Sol-Precheck-GREEN
- END-CHECK: :)
