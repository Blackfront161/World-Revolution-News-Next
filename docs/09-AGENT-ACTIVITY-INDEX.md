# Mitarbeiter-Dashboard

Stand: 28. August 2026
Zweck: einfache, menschenlesbare Kontrolle aller sichtbaren Projekt-Tasks,
internen Subagenten, Modelle, Ergebnisse und Git-Nachweise.

## 1. Sichtbare Codex-Projekt-Tasks

Zusatzauftrag PO-077 abgeschlossen: WEB-SEC-P0 `/root/web_security_preflight`,
R1 `/root/web_security_audit` und R2 `/root/web_security_architecture` beendet.
45 Website-Dateien statisch untersucht; zwei Low-Findings vom Chief bestaetigt;
kanonischer Scan abgeschlossen, Hostinggates offen. Alle Slots frei.
Keine Implementierung, Kinder oder Veroeffentlichung. Verbindlicher Status:
`docs/tasks/WRN-WEB-ANALYSIS-001-SECURITY-REVIEW.md`.

WRN-GOV-001: Der G2-Task lieferte den isolierten Organisationscommit
`09d8964` auf Basis `04e349d`. Chief pruefte und integrierte nur passende
Organisationshunks gegen `662b29c`. Profile und Regeln sind bereit, kein
Subagent wurde dafuer gestartet. Handoff:
`docs/handoffs/WRN-GOV-001-chief-integration.md`. Produktstatus und historische
Tabellen dieses Hauptcheckouts bleiben massgeblich. Der G2-Task haelt nach
Uebergabe keine Schreibrechte im Hauptcheckout.

| Task/Chat | Typ | Aufgabe | Umgebung | Status | Verweis |
|---|---|---|---|---|---|
| `WRN – Chief AI Architect & Orchestrierung` | sichtbarer, angehefteter Haupttask | G3-014 akzeptiert; G3-015 Website-Offline-Shell gestartet | `codex/g3-015-website-offline-shell` | S8-M-001 unabhaengig geschlossen; Produktarbeit pausiert bis PO-Ergebnisentscheidung, P2/P3/P4 offen | `docs/WRN-G3-015-DELEGATION-REGISTER.md` |
| `Unterstütze bei Arbeiten` | bestehender sichtbarer Unterstuetzungstask | S10: einmaliger read-only Uebergabeabgleich | feste Hauptcheckoutbasis32516ba | BEENDET; zwei Statuspflegepunkte berichtigt, keine Produkt-/Endstandfreigabe, Slot frei | `docs/tasks/WRN-G3-015-DECISION-HANDOFF-CONTINUITY.md` |
| `WRN G2 – Zielarchitektur & ADRs` | sichtbarer Phasentask | `WRN-G2-001`: Zielarchitektur und ADR-Paket; kein Produktcode | isolierter Codex-Git-Worktree | ABGESCHLOSSEN UND VOM PRODUCT OWNER AKZEPTIERT | `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md` |

Sichtbarer G2-Codex-Thread: `01a02497-f526-7cf1-b398-dc664a90c044`.

Regel: Jede grosse Phase oder jedes eigenstaendige Ergebnis bekommt hoechstens
einen sichtbaren Projekt-Task. Kurzlebige Recherche-, Test- und Auditaufgaben
laufen als Subagenten innerhalb des zustaendigen sichtbaren Tasks.

## 2. Abgeschlossene G1-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Task | Ergebnis | Dauerhafter Handoff | Git-Checkpoint |
|---|---|---|---|---|---|
| Legacy Product Analyst – App/Android | Terra/medium Runtime | `WRN-G1-001` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-001-legacy_product_analyst.md` | `6fab0c6` |
| Visual/Accessibility Reviewer – App | Terra/high | `WRN-G1-002` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-002-visual-app-baseline.md` | `b17506c` |
| Backend/Data Reliability Analyst | Terra/high | `WRN-G1-003` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-003-backend-data-privacy-baseline.md` | `93547dd` |
| Security/Privacy Reviewer | Sol/high | `WRN-G1-004` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-004-security-privacy-review.md` | `dfe06da` |
| Website/Brand Analyst | Luna/medium Runtime-Fallback fuer Spark | `WRN-G1-005` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-005-website-brand-baseline.md` | `9596b11` |
| Website Visual Reviewer | Terra/high | `WRN-G1-006` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-006-visual-website-baseline.md` | `845c2e7` |
| Context Continuity Auditor | Luna/medium | G1-Meilensteinaudits | alle Instanzen beendet; Audits GREEN | `docs/handoffs/WRN-G1-00*-context-audit.md` | letzter Audit in `86f2615` |

Die Instanzen sind beendet und verbrauchen keine weiteren Tokens. Ihre
Profile, Handoffs, Screenshots und Git-Nachweise bleiben erhalten.

## 3. Abgeschlossene G3-001-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat |
|---|---|---|---|---|---|
| Frontend Brand Engineer | Terra/high | `apps/mobile`, `apps/website`, `packages/brand-tokens` | Implementierung abgeschlossen; Gesamt-QA GREEN | `docs/handoffs/WRN-G3-001-frontend-foundation.md` | `e4d78b4` |
| Backend/Data Reliability Engineer | Terra/high | Domain-, Contract-, Test-Support- und Boundary-Pakete | Implementierung abgeschlossen; Gesamt-QA GREEN | `docs/handoffs/WRN-G3-001-contract-foundation.md` | `e4d78b4` |
| QA Release Engineer | Terra/high | unabhaengiger read-only Abschlussreview | GREEN; null Blocker/High/Medium, ein Low-Loghinweis | `docs/handoffs/WRN-G3-001-independent-qa.md` | `e4d78b4` |

Alle drei Instanzen sind beendet. Ihre Profile, Handoffs und Belege bleiben
erhalten und verbrauchen keine weiteren Tokens.

## 4. Abgeschlossene G3-002-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat |
|---|---|---|---|---|---|
| Backend/Data Reliability Engineer | Terra/high | Contentvertrag, Domain und lokale Fixture | abgeschlossen; Contract-/Integritaetsgate GREEN | `docs/handoffs/WRN-G3-002-contract-foundation.md` | `422917b7a686` |
| Frontend Brand Engineer | Terra/high | Mobile-/Websitefeed und lokale Zustaende | abgeschlossen; integrierte QA GREEN | `docs/handoffs/WRN-G3-002-frontend-newsfeed.md` | `422917b7a686` |
| QA/Architektur-Reviews | Terra/Sol high | unabhaengige read-only Gates | GREEN; Reflow-Medium behoben, final null Blocker/High/Medium | `docs/handoffs/WRN-G3-002-independent-qa.md` | `422917b7a686` |

Alle G3-002-Instanzen sind beendet. Der Product Owner akzeptierte die sichtbare
Produktrichtung; fehlende Funktionen und finale Marke bleiben eigene Tasks.

## 5. Abgeschlossene G3-003-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat |
|---|---|---|---|---|---|
| Frontend Brand Engineer | Terra/high | Brandpaket sowie Mobile-/Website-Markendarstellung | abgeschlossen; Hash-, Scope- und Gesamttests GREEN | `docs/handoffs/WRN-G3-003-frontend-brand.md` | `af2fd9920191` |
| QA Release Engineer | Terra/high | unabhaengige technische und visuelle QA | GREEN; null Blocker/High/Medium/Low | `docs/handoffs/WRN-G3-003-independent-qa.md` | `af2fd9920191` |
| Frontend Brand Engineer – Amendment 1 | Terra/high | PO-026: kompakter Webheader sowie App-Projekt-/Spendenhinweis | abgeschlossen; Gesamttests GREEN | `docs/handoffs/WRN-G3-003-frontend-amendment-1.md` | `0a822398a888` |
| QA Release Engineer – Amendment 1 | Terra/high | unabhaengige PO-026- und visuelle QA | GREEN; null Blocker/High/Medium/Low | `docs/handoffs/WRN-G3-003-PO-026-independent-qa.md` | `0a822398a888` |
| Spark Micro Task Worker – Amendment 2 | Spark/medium | PO-027: eng begrenzte neutrale App-Copy und Assertions | abgeschlossen; Gesamtchecks GREEN | `docs/handoffs/WRN-G3-003-PO-027-spark-copy.md` | `f54a2993e1ec` |
| QA Release Engineer – Amendment 2 | Terra/high | unabhaengige PO-027- und visuelle QA | GREEN; null Blocker/High/Medium/Low | `docs/handoffs/WRN-G3-003-PO-027-independent-qa.md` | `f54a2993e1ec` |

Alle sechs Instanzen sind beendet und verbrauchen keine weiteren Tokens. Der
Product Owner hat G3-003 mit PO-028 visuell akzeptiert. Das Fontgate und alle
Folgefeatures ausser der reinen G3-004-Dokumentvorbereitung bleiben gesperrt.

## 6. Abgeschlossene G3-004-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat |
|---|---|---|---|---|---|
| Frontend Brand Engineer | Terra/high | stabile Ziel-IDs sowie getrennte Mobile-/Website-Navigation | abgeschlossen; Hauptchecks GREEN | `docs/handoffs/WRN-G3-004-frontend-navigation.md` | `3d89fbc05c53` |
| QA Release Engineer | Terra/high | unabhaengige technische und visuelle Abschluss-QA | GREEN; null offene Findings | `docs/handoffs/WRN-G3-004-final-independent-qa.md` | `3d89fbc05c53` |

Der Product Owner akzeptierte G3-004 mit PO-030 visuell. Beide Instanzen sind
beendet; Profile und Belege bleiben erhalten.

## 7. Abgeschlossene G3-005-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat |
|---|---|---|---|---|---|
| Frontend Brand Engineer | Terra/high | lokaler Discoververtrag, Domain sowie getrennte Mobile-/Websiteansichten | abgeschlossen; Hauptchecks GREEN | `docs/handoffs/WRN-G3-005-implementation.md` | `9a9a2216a4fa` |
| QA Release Engineer | Terra/high | unabhaengige technische, Privacy-, A11y- und visuelle QA | GREEN; null offene Findings | `docs/handoffs/WRN-G3-005-independent-qa.md` | `9a9a2216a4fa` |

Der Product Owner akzeptierte G3-005 mit PO-034 visuell. Beide Instanzen sind
beendet.

## 8. Abgeschlossene G3-006-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat/Beleg |
|---|---|---|---|---|---|
| Backend/Data Reliability Engineer | Terra/high | Readervertrag, Domain und lokale Fixture | GREEN abgeschlossen | `docs/handoffs/WRN-G3-006-contract-domain-fixture.md` | `678e6cf` |
| Frontend Brand Engineer | Terra/high | getrennte App-/Website-Reader | Hauptchecks GREEN | `docs/handoffs/WRN-G3-006-frontend-reader.md` | `206a7e1` |
| QA Release Engineer | Terra/high | erste unabhaengige Gesamt-QA | RED; H-002/M-001 dokumentiert | `docs/handoffs/WRN-G3-006-independent-qa.md` | `baa97f8` |
| Backend/Data Reliability Engineer | Terra/high | M-001-Langtextfixture | GREEN abgeschlossen | `docs/handoffs/WRN-G3-006-M001-long-reader-fixture.md` | `31b96b4` |
| Frontend Brand Engineer | Terra/high | H-002 mobiler Reader-Reflow | GREEN abgeschlossen | `docs/handoffs/WRN-G3-006-H002-mobile-reflow.md` | `6a4c64b` |
| QA Release Engineer | Terra/high | vollstaendige unabhaengige Re-QA | GREEN; null offene Findings | `docs/handoffs/WRN-G3-006-independent-reqa.md` | `6da7339` |

Der Product Owner akzeptierte G3-006 mit PO-038 visuell. Alle Instanzen sind
beendet; kein Mitarbeiter ist aktiv.

## 9. Abgeschlossene G3-007-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat/Beleg |
|---|---|---|---|---|---|
| Backend/Data Reliability Engineer | Terra/high | Vertrag, Fixture und deterministischer Publisher | GREEN abgeschlossen | `docs/handoffs/WRN-G3-007-contract-publisher.md` | `a37aff3` |
| Frontend Brand Engineer | Terra/high | statische Websitekomposition und Buildintegration | GREEN abgeschlossen | `docs/handoffs/WRN-G3-007-website-landing.md` | `053e816` |
| QA Release Engineer | Terra/high | unabhaengige Gesamt-QA | GREEN mit Low L-001 | `docs/handoffs/WRN-G3-007-independent-qa.md` | `38728a7` |
| Spark Micro Task Worker | Spark/medium | exakter assetfreier Favicon-Fix | GREEN abgeschlossen | `docs/handoffs/WRN-G3-007-L001-favicon.md` | `5db27a5` |
| QA Release Engineer | Terra/high | begrenzte unabhaengige Re-QA | GREEN; null offene Findings | `docs/handoffs/WRN-G3-007-independent-reqa.md` | `02a4e90` |

Alle Instanzen sind beendet. Security/Privacy und Architecture Reviewer wurden
nicht benoetigt. Der Product Owner akzeptierte G3-007 am 25. August 2026 mit
PO-041 visuell; Abschlusscheckpoint `fe9a848`. Kein Folgefeature wurde gestartet.

## 10. Abgeschlossene G3-010-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat/Beleg |
|---|---|---|---|---|---|
| Frontend Brand Engineer | Terra/high | Themevertrag, Brandtokens, getrennte Mobile-/Websiteprojektionen und lokale Tests | GREEN abgeschlossen; optionale Maske nicht importiert | `docs/handoffs/WRN-G3-010-implementation.md` | `3cc85e1` / `6ec6010` |
| Visual/Accessibility Reviewer | Terra/high | unabhaengige technische, visuelle, A11y- und Runtime-QA | GREEN; null offene Findings | `docs/handoffs/WRN-G3-010-independent-qa.md` | `f3e2c94` |

Beide Instanzen sind beendet und verbrauchen keine weiteren Tokens. Der
Product Owner akzeptierte G3-010 am 26. August 2026 mit PO-051 visuell; kein
Folgefeature wurde gestartet.

## 11. WRN-G3-011-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat/Beleg |
|---|---|---|---|---|---|
| Backend/Data Reliability Engineer | Terra/high | V1-Vertrag, Domain und selbst erstellte Migrationsfixture | GREEN abgeschlossen | `docs/handoffs/WRN-G3-011-contract-domain.md` | `b0aee26` / `4cf249f` |
| Frontend Brand Engineer – erster Lauf | Terra/high | begonnene Mobile-UI und lokaler Adapter | YELLOW an fehlender Paketbruecke korrekt gestoppt; Website/E2E nicht begonnen | `docs/handoffs/WRN-G3-011-frontend-blocked.md` | `e7f627f` / `63218cd` |
| Backend/Data Reliability Engineer – PO-054 | Terra/high | nur additive Domain-Exportbruecke plus enge Tests | GREEN abgeschlossen | `docs/handoffs/WRN-G3-011-contract-bridge.md` | `d856f64` / `34a60d8` |
| Frontend Brand Engineer – Fortsetzung | Terra/high | Mobile-/Websiteadapter, Saved-/Readeraktionen, Tests und Implementierungsevidenz | KANDIDAT GESICHERT; Implementierungschecks GREEN | `docs/handoffs/WRN-G3-011-frontend.md` | `0f51885` / `962ae9e` |
| Visual/Accessibility Reviewer | Terra/high | unveraenderter Kandidat; Visual-, A11y-, Storage-, Request- und Runtime-QA | RED abgeschlossen; High H-001, Restmatrix gestoppt | `docs/handoffs/WRN-G3-011-independent-qa.md` | `68fcb13` |
| Frontend Brand Engineer – PO-055 | Terra/high | nur aktive Client-ID-/Lifecyclebindung und enge Regressionstests | GREEN abgeschlossen | `docs/handoffs/WRN-G3-011-H001-fix.md` | `67ffc39` / `853be13` |
| Visual/Accessibility Reviewer – Re-QA | Terra/high | unveraenderter H-001-Kandidat; gesamte G3-011-Matrix | YELLOW abgeschlossen; H-001 zu, Medium M-002 offen | `docs/handoffs/WRN-G3-011-independent-reqa.md` | `ab41b91` |
| Frontend Brand Engineer – PO-057 | Terra/high | nur Escape-/Fokusvertrag beider Loeschdialoge und enge Regressionen | GREEN abgeschlossen | `docs/handoffs/WRN-G3-011-M002-fix.md` | `b619533` / `70a69ef` |
| Visual/Accessibility Reviewer – M-002-Re-QA | Terra/high | unveraenderter M-002-Kandidat; Dialog/Keyboard und volle Regression | GREEN abgeschlossen; null offene Findings | `docs/handoffs/WRN-G3-011-M002-independent-reqa.md` | `657a00e` |
| Independent Architecture Reviewer – PO-056 | Sol/high | gesamter lokaler Zielprojektstand G3-001 bis G3-011, strikt read-only | RED abgeschlossen; 1 Blocker, 0 High, 0 Medium, 1 Low | `docs/handoffs/WRN-G3-011-full-controller-review.md` | `0bfc9e3` |
| Backend/Data Reliability Engineer – PO-058 | Terra/high | B-003-Nur-Lese-Schutz, Client-/Browserregressionen und Implementierungsevidenz | GREEN abgeschlossen; unabhaengige QA offen | `docs/handoffs/WRN-G3-011-B003-fix.md` | `d19ce4d` / `e38696d` |
| Visual/Accessibility Reviewer – PO-058-Re-QA | Terra/high | unveraenderter B-003-Kandidat; volle G3-011-Storage-, A11y-, Visual- und Regressionmatrix | GREEN abgeschlossen; null offene Findings | `docs/handoffs/WRN-G3-011-B003-independent-reqa.md` | `f1ebf70` |
| Independent Architecture Reviewer – PO-056-Recheck | Sol/high | gesamter lokaler Stand nach PO-058, strikt read-only | B-003 geschlossen; RED nur wegen erneutem GOV-L-004-Low | `docs/handoffs/WRN-G3-011-full-controller-recheck.md` | `1b344b6` |
| Independent Architecture Reviewer – GOV-L-004-Abschluss | Sol/high | dauerhafter read-only Registerabgleich ohne Produktdiff | GREEN abgeschlossen; null offene Findings | `docs/handoffs/WRN-G3-011-full-controller-register-closure.md` | `695b1c0` |
| Context Continuity Auditor – G2/G3-Abgleich | Luna/medium | sichtbaren G2-Task und isolierten Worktree mit aktuellem G3-011-Stand vergleichen | GREEN read-only; keine fehlende Architekturentscheidung, keine Uebernahme aus Parallelspur | `docs/handoffs/WRN-G3-011-G2-CONTINUITY-AND-PO-ACCEPTANCE.md` | kein Produktcheckpoint |

## 12. WRN-G3-012-Vorbereitungsinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff | Kandidat/Beleg |
|---|---|---|---|---|---|
| Explorer – Runtimeinventar | Codex/Explorer | Client-, Test-Support-, Publisher- und Boundarypfade read-only | GREEN; vollstaendige Kopplung und Publisherblinden Fleck gefunden | `docs/handoffs/WRN-G3-012-preparation.md` | keine Datei geaendert |
| Security/Privacy Reviewer | Sol/high | same-origin Lesegrenze, Root of Trust, No-Side-Effects und spaetere Gates read-only | GREEN unter gebundenen Zusatzkriterien | `docs/handoffs/WRN-G3-012-preparation.md` | keine Datei geaendert |
| Backend/Data Reliability Engineer | Terra/high | Release-Descriptor, atomischer Consumer-/Fehlervertrag, Test-Support-Releasevorbereitung und Boundarytests | GREEN abgeschlossen; Agent beendet | `docs/handoffs/WRN-G3-012-backend-data.md` | `171b3ba` / `63cbc10` |
| Frontend Brand Engineer | Terra/high | getrennte Mobile-/Websiteadapter, lokale Releaseartefakte, Publisherumstellung und Regressionen | GREEN abgeschlossen; Agent beendet | `docs/handoffs/WRN-G3-012-frontend.md` | `c99fa2b` / `eb8fc78` |
| QA Release Engineer | Terra/high | unveraenderter Kandidat; Release-, Regression-, Visual-, A11y- und No-Side-Effect-Matrix | GREEN abgeschlossen; 0 Findings; Agent beendet | `docs/handoffs/WRN-G3-012-independent-qa.md` | `012d6a2` |
| Independent Architecture Reviewer | Sol/high | Package-/Publishergrenzen und G3-013-Cachevoraussetzungen, strikt read-only | RED abgeschlossen; Medium M-001; Agent beendet | `docs/handoffs/WRN-G3-012-independent-architecture-review.md` | `aec0d82` |
| Security/Privacy Reviewer – PO-062-Voruntersuchung | Sol/high | M-001-Requestkette, sichere Zweiphasengrenze und Bypasspfade, strikt read-only | GREEN abgeschlossen; Agent beendet | Main-Agent-Pruefpfad gebunden | keine Datei geaendert |
| Frontend Brand Engineer – PO-062 | Terra/high | nur beide Releaseadapter, direkte Requestzaehler-Regressionen und Implementierungsevidenz | GREEN abgeschlossen; Agent beendet | `docs/handoffs/WRN-G3-012-M001-fix.md` | `1520c05` / `18018ce` |
| Security/Privacy Reviewer – PO-062-Bypassreview | Sol/high | unveraenderter Kandidat, Requestpolicy, Aufrufer und Browser-Bypasspfade, strikt read-only | GREEN; 0 Findings; Agent beendet | Main-Agent-Pruefpfad gebunden | `1520c05` |
| QA Release Engineer – PO-062-Re-QA | Terra/high | unveraenderter Kandidat; volle G3-012-, Regression-, Visual-, A11y- und No-Side-Effect-Matrix | GREEN; 0 Findings; Agent beendet | `docs/handoffs/WRN-G3-012-M001-independent-reqa.md` | `f122555` |
| Independent Architecture Reviewer – PO-062-Recheck | Sol/high | M-001-Schliessung, Paket-/Publishergrenzen und G3-013-Voraussetzungen, read-only | GREEN; 0 Findings; Agent beendet | `docs/handoffs/WRN-G3-012-M001-architecture-recheck.md` | `ac48f86` |

Voruntersuchung, einzige Schreibinstanz, Bypassreview, vollstaendige Re-QA und
letzter Architektur-Recheck sind beendet. Der Product Owner akzeptierte
G3-012 sichtbar. Ein frischer Explorer inventarisiert nun ausschliesslich
read-only den getrennten Header-Sprachwahl-Folgebedarf; kein Produktcode wird
veraendert.

## 13. WRN-G3-013-Vorbereitungsinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff |
|---|---|---|---|---|
| Explorer – Sprach-/Headerinventar | Codex/Explorer | Legacy- und Zielpfade, Sprachen, Keys, Header und Tests read-only | GREEN; neun Referenzsprachen und Ziel-Luecke bestaetigt | `docs/handoffs/WRN-G3-013-preparation.md` |
| Security/Privacy Reviewer | Sol/high | Persistenz, Allowlist, No-Side-Effects, Content-/Translationgrenze read-only | GREEN unter gebundenen Kriterien | `docs/handoffs/WRN-G3-013-preparation.md` |
| Visual/Accessibility Reviewer | Terra/high | Headerplatzierung, Reflow, Fokus, Tastatur, Glyphen und Visualmatrix read-only | GREEN unter gebundenen Kriterien | `docs/handoffs/WRN-G3-013-preparation.md` |

Alle drei Instanzen sind beendet. Kein Implementierungsagent ist aktiv.

Der Product Owner erteilte am 27. August 2026 exakt `START WRN-G3-013`.
Als erste und einzige Schreibinstanz wird genau ein frischer
`frontend_brand_engineer` fuer Sprachvertrag, englischen Basiskatalog,
getrennte Speicheradapter und erste Clientintegration gestartet. Spark-
Katalogarbeit beginnt erst nach seinem gesicherten Fundamentcheckpoint.

## 13a. WRN-G3-013-Implementierungs- und Reviewinstanzen

| Instanz/Rolle | Modell im Lauf | Eigentum | Ergebnis | Dauerhafter Handoff/Checkpoint |
|---|---|---|---|---|
| Frontend Brand Engineer – Fundament, erste Instanz | Terra/high | Sprachvertrag, EN-Katalog, Adapter, erste Clientroute | korrekte WIP-Teile, aber wiederholte vorzeitige Statusabschluesse; sequenziell ersetzt, nichts verworfen | Arbeitsstand von frischer Instanz uebernommen |
| Frontend Brand Engineer – Fundament, frische Ersatzinstanz | Terra/high | vollstaendiger EN-Keyset, Routing, sichere Adapter, Tests | GREEN; 148 Tests, 19 Boundaries, 8 Typechecks, beide Builds | `e5ccb3b` / `docs/handoffs/WRN-G3-013-frontend-foundation.md` |
| Spark-Kataloggruppe DE/ES/FR | Spark/medium | nur `catalogs/de.ts`, `es.ts`, `fr.ts` | 3 x 186 Keys/Platzhalterparitaet; beendet | in Kandidat `56057dd` integriert |
| Spark-Kataloggruppe IT/PT/TR | Spark/medium | nur `catalogs/it.ts`, `pt.ts`, `tr.ts` | 3 x 186 Keys/Platzhalterparitaet; beendet | in Kandidat `56057dd` integriert |
| Spark-Kataloggruppe RU/EL | Spark/medium | nur `catalogs/ru.ts`, `el.ts` | 2 x 186 Keys/Platzhalterparitaet; beendet | in Kandidat `56057dd` integriert |
| Frontend Brand Engineer – Neunsprachenintegration | Terra/high | Katalogreview, Registry, Clients, Tests, Browsermatrix | Produkt GREEN; Provenienzsignal nach Abschluss vom Main Agent bereinigt; Agent beendet | `56057dd` / `55b0d4b` |
| Security/Privacy Reviewer | Sol/high | Storage/No-Request/Content-/Rollbackgrenzen read-only | GREEN; 0 Findings; Agent beendet | `0afcc34` / `docs/handoffs/WRN-G3-013-security-privacy-review.md` |
| Visual/Accessibility Reviewer | Terra/high | volle unabhaengige Runtime-/Visual-/A11y-Matrix read-only | YELLOW; Medium `WRN-G3-013-M-001`; Agent beendet | `3125cd5` / `docs/handoffs/WRN-G3-013-visual-accessibility-review.md` |
| Frontend Brand Engineer – PO-067-M-001-Korrektur | Terra/high | native Reflowbreite, enger Mobile-Dokumentfluss, Tests | Kandidat/Implementierungsmatrix GREEN; Agent beendet | `b21b02e` / `f181d0d` / `docs/handoffs/WRN-G3-013-M001-correction.md` |
| Visual/Accessibility Reviewer – PO-067-Re-QA | Terra/high | vollstaendige unabhaengige Matrix, Nach-Mount-Reflow | YELLOW; M-001 nach Mount offen; Agent beendet | `01a0e07` / `docs/handoffs/WRN-G3-013-M001-independent-reqa.md` |
| Incident Debugger – PO-068 | Sol/high | Lifecycle, initialer/Nach-Mount-Reflow, Timeline und RED-vor-Korrektur read-only | kein stabiles Produkt-RED; historische feste 150-ms-Probe nicht deterministisch; Agent beendet | `a0504ce` / `docs/handoffs/WRN-G3-013-M001-incident-diagnosis.md` |
| Visual/Accessibility Reviewer – PO-068 deterministische Re-QA | Terra/high | zustandsbasiertes Polling, 24 Nach-Mount-Wiederholungen und volle Matrix read-only | YELLOW; M-001 24/24 stabil reproduziert; Agent beendet | `91a9971` / `docs/handoffs/WRN-G3-013-M001-deterministic-reqa.md` |
| Frontend Brand Engineer – PO-068-Lifecyclefix | Terra/high | beide Header-Lifecyclegrenzen und enger Nach-Mount-Test | GREEN; Kandidat und Handoff gesichert; Agent beendet | `0462b4c` / `a51ebe2` / `docs/handoffs/WRN-G3-013-M001-po068-correction.md` |
| Visual/Accessibility Reviewer – finale PO-068-Re-QA | Terra/high | unveraenderter Kandidat, 216 Nach-Mount-Uebergaenge und volle Matrix read-only | GREEN; 0 B/H/M/L; Agent beendet | `40f37f6` / `docs/handoffs/WRN-G3-013-M001-po068-final-reqa.md` |

Der Product Owner erteilte am 27. August 2026 exakt
`G3-013 M-001 BEHEBEN`. Genau ein frischer `frontend_brand_engineer` darf die
enge responsive Selectdarstellung und zugehoerige Regressionen korrigieren.
Danach folgt eine frische vollstaendige unabhaengige Re-QA. WRN-G3-014 bleibt
gesperrt.

Der Product Owner erteilte am 27. August 2026 exakt
`G3-013 M-001 ERNEUT BEHEBEN`. Zuerst startet genau ein frischer read-only
`incident_debugger`; erst nach gesichertem Diagnosehandoff darf eine frische
Frontend-Schreibinstanz beginnen.

Der Kandidat `0462b4c` und die finale unabhaengige Re-QA `40f37f6` schliessen
M-001 technisch. PO-069 akzeptiert G3-013 am 28. August 2026 visuell.
Alle Einsaetze sind beendet; die Abnahme startet keinen neuen Mitarbeiter.

## 14. Aktive oder reservierte Profile

Aktuell G3-015: S1/P1-R1 in5c78ff9 GREEN beendet; S2-Kern-WIP in115d8a7/
38f5375 und Handoff5460f34 YELLOW beendet. S3 in f7cec67 abgeschlossen,
zwei Kern-Highs echt reproduziert. S4 `/root/g3015_completion` ist in7256d6a
GREEN gesichert/beendet; Kern b062ab7, Testbuild5ede03d. Chief hat die gesamte
Kernmatrix und3720 Hashbindungen uebernommen. S5 `/root/g3015_frontend`
Terra/high arbeitet am Websitepanel. Der eingefrorene Copyvertrag cbb7662
und Englisch-/Typcheckpoint33e09ba wurden geprueft; der zentral reservierte
Spark-Helfer `/root/g3015_frontend/g3015_languages` hat zwoelf neue Keys in
acht Katalogen geliefert und ist in9e8b8d3/f60b673 beendet. Chief uebergab
die Integration in04ae299 an S5. Nur S5 aktiv, kein weiterer Helfer. Der
abweichende Helpertest mit Node24.16 wird unter24.19 wiederholt; keine
behauptete Kosteneinsparung. Security/QA/Architektur folgen nach beendetem P3.
Nur `docs/WRN-G3-015-DELEGATION-REGISTER.md` vergibt Slots/Schreibrechte;
dieses Dashboard ist eine Lesehilfe und eroeffnet keinen zweiten Pool.

### Historischer Profil-/Reservierungsstand waehrend G3-014

Die folgenden G3-014-Tabellen sind Historie, keine aktiven Einsaetze.
G3-014 ist inzwischen durch PO-073 visuell akzeptiert.

G3-014 ist durch PO-071 gestartet. P1 und P2-L sind GREEN beendet; P2 bleibt
insgesamt YELLOW. Der verbleibende Backendumfang wird sequenziell
als Speicherabschluss und Controller abgeschlossen. Die jeweils
aktive Instanz und Slotfreigabe stehen ausschliesslich im kanonischen Register
`docs/WRN-G3-014-DELEGATION-REGISTER.md`, nicht in einem zweiten Slotregister.
Danach folgen unveraendert Frontend, unabhaengige QA und Architekturabschluss:

| Rolle | Auftrag | Bedingung |
|---|---|---|
| Independent Architecture Reviewer (Sol/high) | Storage-/Revocation-/Rollbackvertrag read-only | P1 GREEN `c80829c`, beendet |
| Backend Data Reliability Engineer (Terra/high) | reine Vertraege, Testdaten, getrennte IDB-/Leseadapter und Controller | laufender P2-Rest, genau eine Instanz laut Register |
| Frontend Brand Engineer (Terra/high) | beide Oberflaechen, neue neunsprachige Copy, Integration | nach Backend-GREEN und gesichertem Handoff |
| QA Release Engineer (Terra/high) | unabhaengige Gesamtmatrix inkl. echter IDB-/Mehrtabtests | nach beendetem Frontend |
| Independent Architecture Reviewer (Sol/high, frisch) | read-only Abschluss der Daten-/Loesch-/Rollbackgrenze | nach GREEN-QA |

Immer nur eine Instanz aktiv. Incident Debugger bzw. Security/Privacy Reviewer
bleiben Reserve fuer den dokumentierten konkreten Ausloeser, kein Dauerteam.

Profile unter `.codex/agents/` sind Stellenbeschreibungen, keine laufenden
Mitarbeiter. `VERFUEGBAR` bedeutet deshalb: darf bei passendem Task Brief
gestartet werden, arbeitet aber aktuell nicht.

| Profil | Modellrouting | Status | Naechster typischer Einsatz |
|---|---|---|---|
| `legacy_product_analyst` | Spark/medium | VERFUEGBAR | kleine read-only Bestandsaufnahme |
| `frontend_brand_engineer` | Terra/high | VERFUEGBAR | naechster klar begrenzter Frontend-Slice |
| `backend_data_reliability_engineer` | Terra/high | G3-014 P2 IN ARBEIT | aktive Instanz und abgeschlossene Teile im G3-014-Register |
| `qa_release_engineer` | Terra/high | VERFUEGBAR | unabhaengige QA nach neuem Produktkandidaten |
| `independent_architecture_reviewer` | Sol/high | VERFUEGBAR; G3-014 P1 GREEN BEENDET | frischer G3-014-Abschlussreview erst nach QA |
| `context_continuity_auditor` | Luna/medium | G2-AUDIT GREEN 10/12 – INSTANZ ABGESCHLOSSEN | `docs/handoffs/WRN-G2-001-context-audit.md` |
| Reserveprofile | Spark/Luna/Terra/Sol je Risiko | BEDARFSGESTEUERT | nur bei dokumentiertem Ausloeser |

## 15. Wo der Product Owner Arbeit kontrolliert

1. **Sichtbarer Codex-Task:** laufende Kommunikation, Status und Rueckfragen.
2. **`docs/tasks/`:** exakter Auftrag und Verbote vor Arbeitsbeginn.
3. **`docs/handoffs/`:** verdichtetes Mitarbeiterergebnis.
4. **`docs/evidence/`:** Screenshots und sonstige visuelle Belege.
5. **`docs/PROJECT-STATE.md`:** aktuelle Phase, aktive Instanz, naechste Aktion.
6. **Git-Verlauf:** unveraenderlicher Nachweis, wann welche Governance-Datei
   aufgenommen wurde.

## 16. Lifecycle-Regeln

- `START <Task-ID>` startet nur einen bereits schriftlich begrenzten Auftrag.
- `STATUS <Name/Task-ID>` fordert einen kompakten Zustand an.
- `STOPP <Name/Task-ID>` unterbricht ohne Loeschung.
- `FEUERN: <Name>` beendet die Instanz nach gesicherter Uebergabe.
- Profile, Handoffs, Evidenz und Git-Historie werden nicht automatisch geloescht.
- Ein fehlendes `END-CHECK: :)` ist nur ein Auditsignal; Ersatz erfolgt erst
  nach Continuity-Pruefung.

## WRN-AGENT-STATUS

- Task: Mitarbeiter-Dashboard / WRN-G3-015
- Status: PO-074 ACTIVE; P2 GREEN/beendet, S5-R1 WIP gesichert/beendet;
  S6 hat Update-Ergebnisabweichung reproduziert/sichert Ende;
  P2 wieder offen, S7 read-only Incidentdiagnose reserviert
- Aktueller Fortschritt: S5 WIP b5e2ea9/f201be7 beendet; S5-R1 in9d85a7f
  beauftragt. P3 bleibt YELLOW bis FRONTEND-COMPLETION vollstaendig belegt ist.
  Spark9e8b8d3/f60b673 beendet; keine weiteren Kinder.
- Quellstand: G3-014 PO-073 akzeptiert; Kern b062ab7,
  Produktionsbuild-Paritaet5ede03d, P2-Evidence/Handoff7256d6a
- Erledigt: P1-Vertrag, vollstaendiger P2-Kern, echte Offlineprozessneustarts,
  enge Incident-/Lifecyclekorrekturen mit getrennten roten/gruenen Belegen
- Tests: zehn finale Einzelgates GREEN; Root228PASS/577Skips/0Fehler/0Flaky,
  zwei Worker; 228Vitest+17Node, sieben Typechecks/19Boundaries/beide Builds
- Offen: P3/Pilot, unabhaengige Gates und Sichtabnahme
- Handoff: `docs/handoffs/WRN-G3-015-chief-handoff.md`
- Naechster Schritt: Chief fuehrt die gebundene Korrektur im Paket fort;
  keine neue gewoehnliche Start-/Fixnachricht erforderlich
- END-CHECK: :)
