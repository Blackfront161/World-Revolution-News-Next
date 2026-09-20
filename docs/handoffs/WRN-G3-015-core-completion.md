# S4 Backend-Core Handoff

- Agent: worker, gpt-5.6-sol/high, `/root/g3015_completion`.
- Task: WRN-G3-015 P2/S4 CORE-COMPLETION, PO-074, Elternbrief B1–B4.
- Ergebnis: P2-Implementierungsumfang GREEN, finaler Kandidat vollstaendig geprueft.
- Basis `7f86159`; Zwischencheckpoint `0ef801b`; Produktkern `b062ab7`;
  Buildparitaets-Testcheckpoint `5ede03d`.
- Branch: `codex/g3-015-website-offline-shell`, gemeinsamer Projektcheckout.
- Slot S4; Slotvergeber/Reviewadressat Chief `/root`; keine Kinder.
- Produkt-/Testschreibarbeit beendet; Belegarbeit endet mit diesem Handoffcommit.
- Rechteuebergabe/Slotfreigabe nach Abschlussnachricht durch Chief bestaetigen.

## Kurzfazit

Gemeinsamer strikt begrenzter Control-/Generation-/Jobvertrag, immutable Ready
je Generation, nicht erzeugende Reads, native Jobs ohne Settlement unter Lock,
durable Removal-/Recoveryfence und beobachtbarer Defaultbrowseradapter sind
verbunden. S3-Highs durch getrennte reale Regressionen geschlossen. Enge neue
Fehler vor jeweiliger Korrektur roh gesichert. Kein UI-/Paket-/Releaseabschluss.

## API fuer P3

Import aus `apps/website/src/offline-shell/adapter.ts`:

```ts
const shell = createWebsiteShellAdapter();
const unsubscribe = shell.subscribe(() => render(shell.getSnapshot()));
await shell.refresh();
// Nur bewusste neue Nutzeraktionen, KEINE Mountsequenz:
await shell.enable();
await shell.update();
// Erst NACH der UI-Bestaetigung:
await shell.remove();
unsubscribe();
shell.dispose();
```

Construction beginnt Beobachtung, niemals enable/update/remove in Mount/Effect
ausloesen. React kann getSnapshot/subscribe als externen Store nutzen; Snapshots
sind gefroren/referenzstabil bis Publication. Ein Adapter je gemountetem Owner,
Subscription und Adapter beim Unmount entsorgen. App/main/Styles und Texte sind
in P2 unveraendert; normale Website-/Source-/Mobilebesuche registrieren nichts.

Jede Aktion liefert Promise<WebsiteShellStatus>. Erfolg am Ergebnis messen,
nicht am Promise-Resolve/unregister(true). Keine eigenen Control-/Cache-/Epoch-/
ServiceWorker-Aufrufe in P3. WebsiteShellPlatform ist Test-/Plattformnaht, keine
UI-Abkuerzung. prepare ist ausschließlich internes genau ticketgebundenes
Re-enableprotokoll.

| kind | Bedeutung / Felder |
|---|---|
| initializing | erste Beobachtung laeuft, epoch null, noch kein Offlineschutz |
| uncontrolled | kein Control/keine eigene Registration, bewusstes Enable moeglich |
| saved | Ready verifiziert, aktuelles Fenster noch nicht mit dieser Shell kontrolliert |
| active | bedienende Shell Ready verifiziert, shellId gesetzt |
| waiting | vollstaendige wartende Shell, waitingShellId und ggf. aktive shellId |
| pending | enable/update/remove offen oder Recovery unbewiesen, operation gesetzt |
| removed | Payload/Registration nach Queuefence/restgeprueft entfernt, kleiner Schutzmarker bleibt |
| protected | fremder Besitz/Namespace oder malformed/unknown/oversized, kein Reset |
| error | kein belegter Offlineschutz, code beachten |

controlled ist separater Browserzustand, kein Ready-/Content-/Offlinebeweis.
Er darf bei removed bis zum Schliessen alter Seiten true bleiben. epoch ist
intern erfasste Authority, kein UI-Zaehler. shellId/waitingShellId sind Hashes.
Shellbereit bedeutet niemals Inhalt gespeichert/zulaessig.

Fehlercodes: unsupported (secure context/SW/Cache/Web Locks fehlen), protected,
budget (u.a. waiting), incomplete (kaputte/fehlende/unfertige Payload), stale
(Snapshot nicht aktuelle Epoch), operation-failed (native/Storagefehler ohne
engeren Code), storage (unerwartete Observeexception). disposed ist im Typ
reserviert; Dispose publiziert aktuell keinen neuen Zustand, sondern friert
die letzte Sicht. Netz-/MIME-/Hash-/Quota-Updates koennen generisch incomplete
oder operation-failed melden; keinen spezifischen Grund erfinden.

Nach uncontrolled/removed kann die UI Enable, nach saved/active Update und
nach Bestaetigung Remove anbieten. Waiting verlangt Ende aller alten Seiten;
keine Activate-/skipWaiting-API. Eigene laufende Aktionspromises nicht doppelt
starten: busy-Aufrufe werden nicht gequeued, sondern liefern aktuellen Snapshot.
refresh waehrend einer Aktion verdraengt ihr Ergebnis nicht. Nach stale neuen
Zustand zeigen und eine neue bewusste Aktion verlangen; den alten Klick nicht
automatisch auf neue Epoch uebertragen. Nach 35 Sekunden Nativewait bedeutet
pending keine Cancellation; die gefencete Fortsetzung kann noch fertig werden.

Subscriptions: controllerchange, echte Changed-Nachrichten, BroadcastChannel,
pageshow/online, updatefound, Worker-Statechanges. Status-ACKs sind keine
rekursiven Changed-Events. Alte Readresultate werden unterdrueckt. Dispose
entfernt Listener/Channel und verhindert Publication, bricht durable Jobs nicht
ab. Bekannte Beobachtung darf begonnenes removing und idempotente bekannte
Activate-/GC-Nacharbeit fortsetzen, aber nie neues Opt-in/Downloads erfinden.

## Build-/Speichervertrag

Vite --manifest -> unveraenderter Publisher -> Generator. Exakt fuenf Pfade:
index.html, ein geschlossenes JS, ein CSS ohne URLs und zwei vorhandene
Brand-PNGs. Neue Split-/Dynamicimports, kleine Extrachunks und andere Assetklassen
scheitern fail-closed; kein stiller Graphausbau durch P3. Keine neuen Dependencies.
Im Rootsetup startet die Vite-CLI mit production-Modus/NODE_ENV in eigenem
Nodeprozess; Mobile/Source-Dev behalten ihre Umgebung. Reales Setup und normaler
CLI-Build sind in allen21 Dateien byteidentisch (RED/GREEN im Bericht).

Controlcache `wrn.website-shell.v1.control`, ein fester Record;
Payload `wrn.website-shell.v1.payload.<shellId>`;
gemeinsamer Lock `wrn.website-shell.v1.lock`.
Control max4KiB, Manifest je Generation max4KiB/fuenf Pfade je max512 UTF-8-Bytes.
Inklusive Duplikat-/Requestkey-/Origin-/Headerreserve 3*16KiB+4KiB=52KiB <64KiB.
Rechnung im Bericht; eingebettete Appmetadaten mitgezaehlt, native physische
Scriptstore-/Browser-/HTTPcacheoverheads wie B3 ausgenommen.
8MiB Payload je Generation, maximal drei Slots inklusive waiting. 10s pro Datei,
30s Aufbau inklusive Lock/Body/letztem Readywrite; nicht abbrechbare Writes
bleiben awaited, keine behauptete harte Browser-IO-Cancellation.

Rollback nur gesamtes kompatibles G3-015-Paket am stabilen Workerpfad,
verifizierte Readywiederverwendung immutable. Inkompatibel/unknown geschuetzt;
44b5cb1 ist kein automatischer SW-Rollbackpartner. Kein Contentrollback oder
Migration. IDB/Sprache/Theme/Lesestatus bleiben getrennt. Removed-Marker behalten,
nicht 'alle Origindaten geloescht' texten. Kein garantierter erster Offlinebesuch,
Force-Reload, Eviction-/Originverlust, physischer Flugmodus oder Androidbeleg.

## Quellen, Dateien und Tests

Vollstaendig gelesen: CORE-COMPLETION, BACKEND-PACKET, Elternbrief B1–B4,
S3-Diagnose/Handoff, S2-Handoff, AGENTS aktuell/3–9, Charter, Source-of-Truth,
Quality Rules, ADR007, P1-Precheck/Recheck, Agent-Handofftemplate.
Nur eigene Shellquellen, Generator/Test, additive Website-Test/Buildscripts,
eine Manifestoption im E2E-Setup und eng benannte Shelltests. Exakte
Quellen-/Datei-/Report-/Bildhashes: `completion/EVIDENCE-INDEX.json`.
Index SHA256: cb30c7067782e2d40ba35805e02a7bddf71d2d673ea640f1cd9e7e3777ae3ee5,
79 Runs und22 Quellen; protectedDiff leer. Belegcommit ist der Commit, der
diesen abschliessenden Handoff und den Index gemeinsam sichert.
Chief-Governance/Attachments nicht gestaged. Browser-Skill und sein Profil-/
Restartlimit sowie W3C/MDN-Primaerreferenzen im CHECKPOINT.md dokumentiert.

Kanonischer Bericht: `docs/evidence/WRN-G3-015/completion/CORE-COMPLETION.md`.
Dort Roh-REDs, Harnessdispositionen, echte Browser-/Prozessproben versus injizierte
native Barrieren/Metadatenfixtures/Units und SHELL01–09/11-Zuordnung.
Kein MiniHTML-/Sourcemock als Websitegesamtnachweis. SHELL10/12 und Cancel-/
Bestaetigungs-UI bleiben P3/P4. Kanonisch: gates-xbXYRR alle10 Exit0,
228 Vitest +17 Node, sieben Typechecks/19 Boundaries/beide Builds/Releaseboundary;
root-browser-0QhRlT 228 PASS/577 Skips/0 Fehler/0 Flaky mit konfigurierten UND
beobachtet maximal2 gleichzeitigen Root-Testworkern. Innere Kernreports
4+33+29+8+2=76 Assertions, keine zusaetzlichen76 Playwrightcases, alle Sourcehashes
aktuell. build-parity-yaPphw bestaetigt21 identische Dateien, Produktpayload
1841533 Bytes, Shell-ID e5552c5539aca55717e60fe918bc23b3140a0961312a654ebd7cdbbab9ad2d57.

S3-H-001/002 und enge weitere Produktbefunde korrigiert, keine pauschale
Vollrepo-/Securityreviewbehauptung. Nativequerydeadlock nicht reproduziert:
beide APIs und Default-Observe/Remove bei offener Scriptqueue mit lebendem UND
geschlossenem Owner geprueft. Direkte A/C-Safetyprobe unter gebauter Shell:
online Einzelreader gefiltert; nach echtem Offlineprozessrestart gesamter
gespeicherter A-Bestand geschuetzt, Null-Reader und bestehende Schutzmeldung.

## Aufwand, Restrisiken und Empfehlung

Keine Kinder/Parallelwriter; Chief nur Governance. Mehrere enge Nacharbeitsrunden
mit Roh-RED/Disposition, keine neuen Befugnisse/Kosten. Token/CHF unbekannt,
keine neue externe APIausgabe/Installation. Eigene kurze Profile/Origins,
Profile bleiben erhalten. Ungeklaerte native Quieszenz konservativ pending.
P2 ersetzt keine unabhaengige QA/Security/Architektur oder sichtbare PO-Abnahme.
Nach Chief-Abgleich und bestaetigtem Ende nur den gebundenen P3-Fachlead-/Spark-
Piloten starten; keine automatische Releaseaktion.

## WRN-AGENT-STATUS

- Task: WRN-G3-015 S4/P2.
- Status: GREEN fuer P2-Implementierung; Chief-Uebernahme und P3/P4/PO separat.
- Quellstand: Produkt `b062ab7`, Testsetup `5ede03d`.
- Erledigt: kohaerenter Shellkern und gebundene Testmatrix.
- Tests: kanonische Gesamtmatrix und Buildparitaet GREEN, genaue Summen oben.
- Offen: Chief-Abgleich; danach P3/P4/PO ausserhalb P2, keine offene P2-Implementierung.
- Handoff: dieser Pfad.
- Naechster Schritt: Chief-Abgleich/Rechteuebergabe; Schreibarbeit endet mit Handoffcommit.
- END-CHECK: :)
