# Shared browser production content implementation

Parent RELEASE-COMPLETION/approved StageC, follows completed B2 independent
acceptance including any concrete correction. Root owns shared product code;
delegation allowed only for the disjoint build seam described in the start
disposition below. A disjoint Events/Media data writer may remain active.
This brief is a prepared cut, not permission to alter a still-reviewed B2 pin.

## Purpose and module boundary

Both clients need the same validated production lifecycle/storage/reader rules.
Extract the existing implementation once behind thin explicit client factories;
do not copy620-line stores, the reader area or capacity handling into Website.
Pure domain/contracts remain browser/React-free. Shared browser code owns no
global client DB, singleton state, Android bridge, Service Worker, navigation,
SEO, publication, provider or automatic source URL selection.

New source-only internal library packages/browser-content/src/. It is compiled
and checked by each consuming app, with its own focused test/config if useful.
No package-manager project/dependency/lockfile or installation is introduced.
App-to-library relative entry imports are explicit; library-to-contract imports
keep canonical existing @wrn public exports. Build/type aliases resolve those
already installed workspace sources and React from the consuming app's existing
dependency graph. README documents ownership, API and this source-build model.
No boundary suppression, hidden node_modules links or ad-hoc fallback require.

## Exact extraction

Copy implementation into new library files, replace existing Mobile originals
with compatible reexports/thin adapters; preserve files and all existing callers.
No deletion or filesystem move. Files: content-release-transport-core,
content-offline-store-core, content-offline-controller-core; production-content-
release/profile/store/controller/view; production-reading-state; generic
offline session/hook; production-reader-blocks; production-content-ui/CSS.
Shared APIs require client-owned databaseName, readingStorageKey, controller
factory and heading/archive trigger prefix. No default accidentally chooses
Mobile storage for Website. Current same-origin production pointer remains
/wrn-production-content/current.json and is not caller/content configurable.

Mobile original files under src retain their public exports and actual constants
wrn.mobile-production-content-offline.v1 and
wrn.mobile-production-reading-state.v2. Existing fixture content-offline-ui.ts
retains unchanged explicit fixture factory; shared generic session/hook removes
the duplicate mechanics only. App behavior/copy/production packet unchanged.
App.tsx should not need a behavioral edit. No existing contract/domain/data/
native changes, no title/source/safety/TTL/bounds behavior modification.

Build seam: tools/browser-content-aliases.mjs plus declaration/test as needed;
apps/mobile/vite.config.ts, apps/website/vite.config.ts and existing
tests/e2e/global-setup.ts use the same explicit alias function; tsconfig.base.json
maps the corresponding existing public contract/domain imports for source-only
type resolution. React/ReactDOM use installed consuming-app paths, not another
client's app module. Keep Website's closed-one-JS/one-CSS output configuration.

## Proof before Website implementation

Existing full Mobile, Contracts/Domain/Copy, four types, import/provenance/fixture
parity/release boundaries and relevant old generator/builder tests remain green.
All51B2 browser cases plus narrow shared-library client-isolation harness:
two distinct profile DB/key instances cannot observe/clear each other's content
or reading state. No arbitrary profile derived from user storage/query.
Root genuine pnpm toolchain/check preflight must remain installation-free.
Build both clients; shared source included in existing checks without weakening
glob coverage or exclusions. Add specific package-level tests where real gaps
exist; no duplicated mirror assertions. New browser outputs always fresh.

Freeze source pins and own evidence/handoff WRN-PRODUCTION-BROWSER-CONTENT-SHARED-
2026-09-10. Independent Terra reproduction and narrow Sol extraction integrity
review on exact immutable candidate precede Website use; no architecture restart
unless a concrete behavioral seam contradicts this extraction. No installs,
signing, device actions, version changes or external writes.

## Start disposition after B2 R1

B2-R1 candidate37ae0be is independently GREEN from Terra17units/32Chrome and
same Sol M001/M002 closure. Both reviewers returned rights. Data candidate
c80bd68 is separately frozen for independent Terra QA; Root starts extraction.
Slot1 existing production_mobile_b1 may implement only the build seam:
tools/browser-content-aliases.mjs, .d.mts, .test.mjs; Mobile/Website vite.config.ts,
tests/e2e/global-setup.ts and tsconfig.base.json. Root owns all new shared source
and Mobile wrappers; no overlapping files. No children/index/browser for Slot1.
The helper resolves explicit existing public @wrn/content-contracts/domain/
ui-language exports and consuming-app React paths. No package install/symlink,
new package project, fallback module probing or change to Website output graph.
Preserve explicit fixture entry injection and per-server Vite caches. Root runs
integration after the seam writer's tested handoff; source-only architecture and
all remaining proof requirements above remain binding. Maximum two writers.
