# WRN-G3-021 – Übergabe an ein neues Chatfenster

Stand: **1. September 2026 – sicher gestoppt vor dem R3-R1-Vertragsrecheck**

## 1. Verbindlicher Git-Stand

- Repository: `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne`
- Branch: `codex/g3-015-website-offline-shell`
- aktueller HEAD:
  `483d524f30b7de1bb8915856a5da801eb8bf69f9`
- Produktkandidat des lokalen providerfreien Medienkerns:
  `1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`
- Arbeitsbaum beim Stopp: sauber, ausgenommen die bekannten unversionierten
  Codexordner `.codex-remote-attachments/` und `.codex/environments/`.
- Der während der Übergabe laufende frische Sol-Recheck wurde auf Wunsch des
  Product Owners unterbrochen. Er hat keine Datei und keinen Commit erzeugt.

## 2. Was G3-021 bisher enthält

G3-021 baut ausschließlich einen lokalen, providerfreien Medien-/Podcast-
Katalogkern. Noch nicht enthalten und weiterhin gesperrt sind sichtbare UI,
Player, echte Quellen oder Medien, Streaming, Downloads, Provider, Website,
Hosting/Live, Android/AAB/Play, Signierung, Upload und Release.

Der Product Owner startete den Slice mit exakt `START WRN-G3-021` als PO-100.
Die Architektur-/Vertragsvorbereitung, lokale selbst erstellte Fixtures,
Root-/Dokumentpins, Admission, Rights, Consent, Lifecycle, Revocation und ein
isolierter IndexedDB-Katalog wurden sequenziell aufgebaut.

Der aktuelle Produktkandidat `1826ed5` verändert gegenüber seinem Writergate
exakt acht Produkt-/Testdateien plus Writer-Evidence und Handoff. Chief und
unabhängige QA reproduzierten:

- beide Typechecks GREEN;
- 13/13 fokussierte Contract-/Loader-/Storetests GREEN;
- 7/7 echte Chrome-/IndexedDB-Fälle GREEN;
- 19/19 Boundarytests GREEN;
- scoped ESLint und Prettier GREEN;
- Fixture-/Releaseboundary sowie alle JSON-, Asset-, EOL-, Package- und zehn
  Boundaryhashes GREEN.

Die bestehende App, Website und Live-Version wurden nicht verändert.

## 3. Warum P2 trotzdem noch nicht GREEN ist

Die unabhängige QA in `a32d3c1` meldet ein Medium-Assurancefinding:

- `P2-R2-QA-M-001`: Die verpflichtende Exact-key-/Zeit-/Cap-/Raw-/Block-/
  Abort-/Future-IDB-Negativmatrix ist noch nicht vollständig automatisiert.

Der defensive Sol-Integrity-/Privacy-Review in `aa055ee` meldet vier Medium-
Produktfindings, null Privacyfindings und null deferred Findings:

1. `P2-R2-DIP-M-001`: Higher-Safety erhält bestehende Entryinhalte nicht
   vollständig byteidentisch.
2. `P2-R2-DIP-M-002`: Revocationreferences sind nicht die exakte Union aus
   aktuellen IDs, Entrytargets und Replacementtargets.
3. `P2-R2-DIP-M-003`: Ein erfolgreicher Rollback auf einen anderen Previous-
   Release ist mit der aktuellen Safetymerge-Logik nicht erreichbar.
4. `P2-R2-DIP-M-004`: Future-/Corrupt-IDB-Records werden nicht exact-key und
   tief genug validiert und könnten später normalisiert werden.

Ein vorheriger versiegelter Securityversuch wurde vom Zugriffssystem vor
einem Ergebnis abgebrochen. Er zählt weder als Finding noch als GREEN. Der
danach erfolgreiche defensive Sol-Review ist die maßgebliche lokale Prüfung.

## 4. Aktuell maßgeblicher Korrekturvertrag

Maßgeblich ist:

`docs/tasks/WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md`

Vertragscommit:
`483d524f30b7de1bb8915856a5da801eb8bf69f9`.

Er bindet:

- byteidentische monotone Safetyentries;
- exakte Revocation-Reference-Union;
- erfolgreichen atomaren A/B/A-Rollback unter unverändertem höherem
  Safety-Floor;
- versionierte, exact-key und tief validierte Bundle-/Control-/Safety-IDB-
  Records;
- sofortigen externen Abort, 5000-ms-Timeout und vollständiges Cleanup;
- vollständige automatisierte Negativ-/Grenzmatrix;
- vollständige Bundle-Selbstbindung: Transporthash aus `releaseRaw`, äußere
  Revision gleich Rawrelease, vollständiger erlaubter Rootpin und alle sechs
  Descriptor-/Dokument-Bytes-/Hash-/Schema-/Revisionsrelationen;
- gekoppelt unerreichbare Caps über realen Maximalfall plus isolierte
  Equal-/`+1`-Grenzen und Redundanzinvariante statt Fake-End-to-End-Test.

Der erste Precheck `f6feb41` war RED nur wegen der damals noch nicht expliziten
Bundle-Selbstbindung. Genau diese Lücke wurde in `483d524` präzisiert. Der
anschließende **frische Recheck wurde begonnen, aber auf Wunsch des Product
Owners ohne Ergebnis unterbrochen**.

## 5. Exakt nächster sicherer Schritt

Noch keinen Produkt- oder Testcode ändern.

1. Einen **frischen** `independent_architecture_reviewer` Sol/high ohne Kinder
   starten.
2. Reviewbasis exakt
   `483d524f30b7de1bb8915856a5da801eb8bf69f9`.
3. Vollständig lesen: `AGENTS.md`, den R3-Korrekturvertrag, den ersten R3-
   Precheck/Handoff, QA `a32d3c1`, defensiven Review `aa055ee`, normative
   P2/R1/R2/R3-Verträge und die acht betroffenen Produkt-/Testdateien.
4. Prüfen, ob `P2-R3-PRE-M-001` geschlossen ist und der gesamte Vertrag mit
   null offenen Findings innerhalb der Zehn-Pfad-Allowlist umsetzbar ist.
5. Nur eigene neue Evidence/Handoff schreiben; kein Produkt-, Test-, Fixture-,
   Config-, Index- oder Commitwrite durch den Reviewer.
6. Nur bei GREEN mit null Findings: Beleg durch den Chief committen, danach
   ein separates Writergate erstellen und genau einen frischen
   `backend_data_reliability_engineer` Terra/high für die zehn gebundenen
   Pfade starten.
7. Nach Writerende zwingend: Chief-Reproduktion, frische Terra-QA, frischer
   defensiver Sol-Integrity-/Privacy-Deltarecheck und finaler frischer Sol-
   Architekturabschluss. Erst vier GREEN-Ergebnisse schließen P2.

## 6. Weiterhin gesperrt

- P3, sichtbare Media-/Podcast-UI und Player;
- echte Quellen, Feeds, Medien, Streaming, Downloads und Provider;
- neue Dependencies, APIs oder Kosten;
- Websiteprodukt, Hosting und Live;
- Android, AAB, Google Play, Signierung, Upload, Deployment und Release;
- alte Live-App und altes Repo;
- `WRN-CONTENT-SOURCES-001` und andere spätere Content-/Recherchepakete ohne
  eigenes exaktes START-Gate.

## 7. Kopiertext für das neue Chatfenster

```text
Übernimm als Chief AI Architect den laufenden Task WRN-G3-021 im Repository
C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne auf Branch
codex/g3-015-website-offline-shell. Lies zuerst vollständig AGENTS.md und
docs/handoffs/WRN-G3-021-CHAT-HANDOFF-2026-09-01.md. Verbindlicher HEAD ist
483d524f30b7de1bb8915856a5da801eb8bf69f9; Produktkandidat ist
1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb. Schreibe noch keinen Produkt- oder
Testcode. Starte zuerst einen frischen unabhängigen Sol/high-Architektur-
Recheck des Vertrages
docs/tasks/WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md gegen HEAD
483d524. GREEN nur bei null Findings. Nur danach darf der Chief ein separates
Writergate binden und genau einen Terra/high-Backend-/Data-Writer innerhalb
der zehn Pfade starten. P3/UI/Player, echte Inhalte/Provider, Website/Live,
Android/AAB/Play und Release bleiben gesperrt. Verwende WRN-Statusblöcke und
beende jede Nachricht mit END-CHECK: :)
```

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-CHAT-HANDOFF`
- Status: sicher gestoppt vor frischem R3-R1-Recheck
- HEAD: `483d524f30b7de1bb8915856a5da801eb8bf69f9`
- Produkt: `1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`
- Laufende Agenten: keine; der Recheck wurde unterbrochen
- Produkt-/Testrechte: gesperrt
- Nächster Schritt: frischer Sol/high-R3-Recheck, null Findings erforderlich
- END-CHECK: :)
