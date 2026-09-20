# Agent Handoff – WRN-G3-014 / S9 Controller Recovery

- Agent: fachlicher Backend/Data-Owner, `worker`, explizit Sol/high.
- Task-ID: WRN-G3-014 / P2-C Controller Recovery; PO-071.
- Ergebnis: Implementierung und lokale Matrix bestanden; Chief-P2-Abgleich
  und unabhaengige Abnahme ausstehend.
- Eltern-/Kindbrief: LOCAL-CONTENT-OFFLINE-TRANSACTIONS,
  CONTROLLER-COMPLETION, CONTROLLER-RECOVERY; keine Kinder.
- Instanz: `/root/g3014_controller_recovery`.
- Basis: `efbc23c`, Branch `codex/g3-014-content-offline-transactions`,
  gemeinsamer Hauptcheckout.
- Slot: S9, ausschliesslich Chief `/root` reserviert/freigegeben.
- Schreibarbeit: nach lokalem Kandidaten-/Evidencecommit beendet; keine
  selbst erteilte Frontendfreigabe. Register-/Slotabschluss liegt beim Chief.
- Reviewadressat: Main/Chief `/root`, danach die gebundene unabhaengige Folge.

## Kurzfazit

Der ehemalige S6-Draft `9e589b7` / `5e7c0da` ist durch vollstaendige
UI-neutrale Controller, eine rein lesende Storeprojektion und die begrenzte
Defaulttransportkette ersetzt. S7 `600eefe` lieferte den roten Ausgang;
S8 `4d19dbc` bleibt unveraenderte Equality-Grundlage. Beide Clients haben
echte Defaultloader-/IDB-Tests; fertige Checkmock-Ergebnisse sind kein
Integrationsbeleg mehr. P2-GREEN bleibt eine Chief-Entscheidung.

## Exakte importierbare API

Je Client **nur sein eigenes Modul** importieren:

```ts
import {
  createMobileContentOfflineController,
  type ContentOfflineControllerResult,
} from './content-offline-controller';
// Website: createWebsiteContentOfflineController aus dem Website-Modul.
```

`createMobileContentOfflineController(overrides?)` beziehungsweise
`createWebsiteContentOfflineController(overrides?)` erzeugt eine Instanz.
P3 verwendet **keine Overrides**. Der eng typisierte optionale Testseam besteht
aus `openStore(signal?)`, `check(signal, knownSafety)`, `now()` und
`operationId()`. Es gibt keinen `load`-Override/Floor-0-Restoreweg mehr.

Die Instanz ist eingefroren und besitzt:

| Methode | Parameter / Ergebnis / Semantik |
|---|---|
| restore | `AbortSignal?` -> `Promise<ContentOfflineControllerResult>`; gespeicherten Stand revalidieren; ohne Stand sicherer Sessionquellenpfad; kein Bundleautowrite |
| save | gleiches Signature; expliziter neuer Komplettcheck, Safetyreihenfolge, transaktionales Speichern; aktiviert nur die gerade gepruefte Kandidatenidentitaet |
| check | gleiches Signature; expliziter Check, persistenter Pending vor Quellenrequests, Safety unabhaengig von Content; neue Revision nur stagen |
| activate | gleiches Signature; nach P3-Bestaetigung, nur erneut revalidierter/zulaessiger Kandidat |
| rollback | gleiches Signature; nach P3-Bestaetigung, nur erneut revalidierter/zulaessiger Vorherstand, alte eigene Frist |
| clear | gleiches Signature; nach P3-Bestaetigung; praemptiert alte Operation, entfernt nur Content, erhaelt Safety/Pending |
| guard | gleiches Signature; vor Readerzugriff, ohne Quellenfetch; aktueller Control plus aktive Runtime/Metadaten |
| resumeGuard | identische Guardfunktion, bei Rueckkehr/Resume, ohne Quellenfetch |
| dispose | synchron `void`; beendet Instanz, laufende Promises werden begrenzt mit disposed beantwortet, bestehende/spaete Verbindungen geschlossen |

Ein Operationsslot je Instanz. Nicht-Clear-Parallelanfragen liefern
`busy` mit Runtime null und ohne Aktionen. Pre-Abort erzeugt weder Open
noch Fetch. Gesamtdeadline ab Beginn 15s einschliesslich Open/Reads/
Validierung/Writes; einzelne IDB-/Requestoperationen 5s. Caller-Abort,
Clear, Dispose und Deadline entwerten alte Ergebnisse. Bestaetigte
Transaktionen werden nicht rueckwirkend zurueckgerollt.

### Ergebnisvertrag – alle Felder immer vorhanden

- `status`: active, candidate-staged, session-only, needs-source-check,
  unavailable, storage-error, aborted, stale-operation, busy oder disposed.
  Das ist der Operationsausgang, **keine** Leseerlaubnis.
- `readAccess`: allowed / blocked / unavailable; `reason` ist eine stabile
  uebersetzbare Kategorie. `runtime` ist **aktive** LocalContentReleaseRuntime
  oder null; `persistence` stored / session-only / none.
- `active`: null oder `{key: string|null, revision, checkedAt, expiresAt}`.
  Bei einer gesperrten gespeicherten Revision kann active vorhanden sein,
  waehrend runtime null ist. Metadaten sind kein Inhaltsfreigabesignal.
- `candidate` / `previous`: null oder `{key, revision, checkedAt,
  expiresAt, eligible, reason}`; keine zweite Runtime.
- `control`: `generation`, `clearEpoch`, `observedAt` (letzter
  Controller-Controlread), `lastObservedAt` (hoechste beobachtete Zeit),
  `safetyFloor` (bekannter RAM/DB-Stand), `persistedSafetyFloor`
  (tatsaechlich gelesener DB-Stand/null), `pendingRecheck`, `protection`.
  Fehlgeschlagener Safetywrite darf nicht als persistierter Schutz angezeigt werden.
- `guard`: bestehender Domain-Guard oder null. Auch er ersetzt readAccess
  nicht, weil RAM-Safety zusaetzlich sperren kann.
- `actions`: immer ein unveraenderliches Array aus save/check/activate/
  rollback/clear; Kandidat/Vorheraktionen nur bei aktueller Zulaessigkeit.
  Inkompatibler/unklarer Speicher hat keine ausfuehrbaren Schreibaktionen.
- `failure` / `storageFailure`: stabile Kategorie oder null, keine
  Rohfehler, Artikeltexte oder technischen Logs fuer UI.
- `confirmedWrites`: nur die vom Controller empfangenen Store-complete-
  Bestaetigungen. Kein Rollbacklog und keine Garantie, dass nach Abbruch eine
  noch unbestaetigte Transaktion nicht bereits committed hatte. Naechster
  Guard liest die tatsaechliche Generation.
- Legacyaliase `checkedAt`, `revision`, `activeRevision`,
  `candidateRevision`, `previousRevision`: alle nullable Pflichtfelder.
  `revision` ist **immer aktiv**, nicht der gepruefte B-Kandidat.

Alle Ergebnisse einschliesslich Runtimeunterobjekten sind tief eingefroren.
B-Teilfehler kann `status=needs-source-check` und gleichzeitig
`readAccess=allowed` mit dem unverjuengten A liefern. C-Teilfehler liefert
Runtime null. Eine IDB-aus-Saveaktion kann `storage-error`, aber eine
zulaessige `session-only`-Runtime liefern. Darum niemals auf
`status === 'active'` reduzieren.

Bei IDB-aus liefert check(B) einen ehrlichen Speicherfehler und behaelt
zulaessiges sessionweises A mit dessen alter Zeit. Es gibt weder implizite
B-Aktivierung noch RAM-Kandidaten. Nur ein kompletter Check derselben
Descriptoridentitaet erneuert A. Neue C-Safety kann A trotzdem sperren.

## Sicherer P3-Aufrufablauf

Nur UI-Lebensdauer/Ergebnisticket verwalten, keine eigene Safety-/TTL-/IDB-
Orchestrierung. Folgendes ist ein Aufrufbeispiel, kein freigegebener Reactcode:

```ts
const content = createMobileContentOfflineController();
let viewTicket = 0;
let mounted = true;

async function invoke(call: () => Promise<ContentOfflineControllerResult>) {
  const ticket = ++viewTicket;
  const snapshot = await call();
  if (!mounted || ticket !== viewTicket) return null;
  // EIN Zustand fuer Feed, Discover, Reader, Lifecycle, Archiv und Dialoge.
  publishContentState(snapshot);
  // Bei runtime:null Ansichten sperren/schliessen, NICHT Leselisten leeren
  // oder mit einem erfundenen leeren ID-Set reconciliieren.
  return snapshot;
}

await invoke(() => content.restore()); // einmal pro Controller-Lebensdauer

// Ausdrueckliche UI-Aktionen, nur wenn in snapshot.actions angeboten:
await invoke(() => content.save());
await invoke(() => content.check());  // A bleibt aktiv; B nur Metadaten
// Erst nach Bestaetigung:
await invoke(() => content.activate());
// Rollback/Clear ebenfalls erst nach ihrer Bestaetigung.

const access = await invoke(() => content.guard());
if (access?.readAccess === 'allowed' && access.runtime !== null) {
  openReaderFromSnapshot(access.runtime);
}
await invoke(() => content.resumeGuard()); // Resume, kein Autoquellencheck

// Cleanup; neue Mount-Lebensdauer bekommt eine neue Instanz:
mounted = false;
viewTicket++;
content.dispose();
```

Das Ticket verwirft nur veraltete UI-Callbacks. Es ist kein Ersatz fuer den
Controllerguard. Nicht aus Runtime null auf ein leeres Contentangebot
schliessen; Gespeichert/Gelesen/Progress bleiben erhalten. Keine direkte
Store-/Loaderbenutzung, Timer-Netzpolls, `navigator.onLine`-Freigabe,
Control-/Safetyrekonstruktion oder eigenen Zeitberechnungen in P3.

Hinweise aus fremden Tabs duerfen einen Guard anstossen, aber keine Inhalte/
Safety liefern. Bestehende Browser-Projekttests mit reinen Quellmodulen muessen
auf isolierten Leerseiten bleiben; P3 mountet dort nicht heimlich die App.
Echte sichtbare Website-QA benutzt den gebauten Server 43174, nicht 43175.

## Quellen, Dateien und Belege

Gelesen: aktuelle AGENTS-Gates, Product Charter, Source-of-Truth,
Zielarchitektur/Qualitaetsregeln, Elternbrief, Recovery-/Completion-Briefs,
OFF-Abnahmeplan, S7-Diagnose und P2-S-Handoff. Fachliche Offenheiten wurden
nicht durch geaenderte Contracts oder neue Produktpolitik verdeckt.

Eigene Dateien:

- `apps/{mobile,website}/src/content-offline-controller.ts` und Tests.
- Beide `content-offline-store.ts`: ausschliesslich readProjection/Metadatentypen.
- Beide `local-content-release.ts` und enge Transporttests.
- `tests/e2e/content-offline-controller.spec.ts` sowie der neue
  `content-offline-controller-harness.ts`.
- `docs/evidence/WRN-G3-014/CONTROLLER-COMPLETION.md`,
  `controller-recovery/` und dieser Handoff.

Testsetup musste S9 nicht erneut aendern. Chief-Governance und
`.codex-remote-attachments/` sind fremd und nicht gestaged.
Vollstaendige Befehle, rote Ausgangs-/Nacharbeitsbelege, Fehlereinspritzungen
und OFF-01–25-Disposition stehen im Completionbericht.

Bisher final bestaetigt: 66 neue echte Controller-Browser-PASS,
S7 20 PASS, voller Browserlauf **173 PASS / 422 erwartete Skips / null Fehler**,
214 Vitest + acht statische Website-Tests, Format/Lint/19 Boundaries,
sieben Typechecks, beide Builds, echte Releaseboundary und diffcheck.
Finales maschinenlesbares Checkprotokoll:
`docs/evidence/WRN-G3-014/controller-recovery/validation.json`.

## Risiken, Aufwand und naechster Schritt

Keine bekannten offenen Fehler im abgearbeiteten P2-C-Vertrag. Dies ist eine
Implementiereraussage, kein unabhaengiger Review. P3 und seine echten
React-StrictMode-/Unmount-/Reader-/Dialog-/Reconciliation-/Visualbelege sind
noch offen, danach unabhaengige QA und Architekturreview. Kein Browser-
Originverlustschutz, keine volle Offline-Shell, keine Android-/Live-/Releaseaktion.

Keine Kinder/Koordinationskonflikte; Quell-/Scopegrenzen eingehalten.
Vier eng nachgewiesene Controller-Nacharbeiten jeweils in einer Fixrunde
geschlossen (Freeze, Session-B-Staging, inkompatible Aktionsprojektion,
IDB-aus-B-Check ohne stille Aktivierung; letzteres durch Chief bestaetigt).
Token-/Kostenverbrauch nicht gemessen; keine kostenpflichtige externe API.
Die einmalige Sol/high-Zuweisung war gebunden, keine Profilaenderung.

Chief prueft den gesamten P2-L/S/C-Abgleich und entscheidet erst danach ueber
P2-GREEN und die sequenzielle P3-Zuweisung. Dieser Agent startet niemanden.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 / S9 Controller Recovery.
- Status: Implementierung/Pruefmatrix GREEN zur Chief-Uebernahme; P2 gesamt
  weiterhin nicht selbst freigegeben.
- Quellstand: Basis efbc23c; Ergebniscommit wird vom abschliessenden lokalen
  Gitcheckpoint und der direkten Chief-Meldung gebunden.
- Erledigt: vollstaendige UI-neutrale API, reine Store-Readprojektion,
  Defaultloader-/Deadline-/Safetyintegration, dauerhafte Fehlerfallbelege.
- Offen: Chief-Gesamtabgleich, P3, unabhaengige QA/Architektur und PO-Abnahme.
- Handoff: dieser Pfad.
- Naechster Schritt: Chief-Uebernahme, keine eigene Folgeaktion.
- END-CHECK: :)
