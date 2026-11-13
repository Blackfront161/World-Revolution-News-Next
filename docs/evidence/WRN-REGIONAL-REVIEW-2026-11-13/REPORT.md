# Regional-event renewal — revision 5

Private validation completed on 13 November 2026. **Not deployed; browser acceptance remains open.**

## Scope

Base commit: `8b96b323b8881c561596d1d81cf962e72f4c5eb8`.

The published repository's revision 3 was checked on 25 September and expired on 2 October. Its 48-hour renewal guard correctly stopped content-supply preparation. Four listed events are now past. The replacement retains five regions, four countries, three continents, metadata-only references, seven-day validity and the unchanged 48-hour renewal rule. Revision 5 avoids reusing an already prepared revision 4.

- Generated: 13 November 2026, 20:42:17 UTC.
- Renewal required from: 18 November 2026, 20:42:17 UTC.
- Expires: 20 November 2026, 20:42:17 UTC.
- Exact JSON SHA-256: `12f7b72c4e258319d004b4a82496abbbe6c234d2f242edcb71bf8a65ff4d7ff2`.

No workflow, schema, freshness, privacy or publication guard is weakened. Current data-bound test expectations are updated; historical evidence is retained. A new operations hash manifest binds the unchanged 12-file closure, including the final verifier; both September operations manifests remain unchanged.

## Sources checked on 13 November

| Region | Event and verified source | Schedule |
| --- | --- | --- |
| New York | [Interference Archive — Volunteer Orientation](https://interferencearchive.org/event/volunteer-orientation-7/) | 16 November, 19:00–20:30 America/New_York; venue and UTC iCal values confirmed. Registration is requested by the venue; none was made. |
| London | [ISRF — State Histories: The Politics of Teaching the Past in Iran](https://isrf.org/events/state-histories) | 26 November, 18:00–20:00 GMT, P21 Gallery. The freshly checked page specifies in-person participation; no online access is claimed. |
| Greater Manchester | [Comma Press — National Creative Writing Industry Day 2026](https://commapress.co.uk/events/national-creative-writing-industry-dat-2026) | 5 December, Manchester Metropolitan University. Day precision because no reliable end time is stated; not labelled as a political meeting. |
| Santiago | [Universidad de Chile — Diálogo judicial sobre Derechos Humanos](https://uchile.cl/agenda/246720/libro-dialogo-judicial-sobre-derechos-humanos-m-gonzalez) | 25 November, Aula Magna Derecho, Providencia, Santiago. Day precision because no reliable end time is stated. |
| São Paulo | [A.N.A. announcement via Federação Anarquista](https://www.federacaoanarquista.com.br/envio-de-cartazes-para-xvi-feira-anarquista-de-sp/) | 12 December, 10:00–19:00 America/Sao_Paulo, ARCO Escola-Cooperativa. The attributed republication was freshly verified; the original A.N.A. host failed DNS resolution, so direct fresh verification there is not claimed. |

Past events were replaced, not relabelled as current. No article bodies, images or new personal information were copied. Announcements may subsequently change and require rechecking before activation.

## Executed checks

Exact project toolchain: Node 24.19.0 and pnpm 11.19.0. Frozen dependency installation preserved the lockfile and package/workspace settings, disabled lifecycle scripts, and passed 351 supply-chain policy entries.

- Mobile regional component tests: **7/7**.
- Website App component tests: **39/39**.
- Regional language tests: **9/9**.
- Regional contract tests: **26/26**.
- Content-operation tests: **23/23**, including no-publication workflow and hash bindings.
- Focused candidate boundary/projection checks: **9/9**.
- Mobile and Website TypeScript checks: **passed**.
- Formatting and configured-code lint: **passed**.
- Existing Mobile web build: **passed**.
- Existing Website build, nine article landings and offline-shell generation: **passed**. Offline graph: 8,330,094 bytes, below the unchanged 8 MiB limit.

The real non-publishing supply run was pinned to Data commit `e0bb33f6e4aa8ce62ca608337de5c752c6b37539`. It correctly returned `awaiting-admission` without a reviewed article batch. Metadata-only directory preparation produced 899 article references, 588 sources and three sports notes. Both receipts retained `dryRun: true` and `publicationPerformed: false`; no client pointer was transferred.

## Limits

Browser UI/persistence acceptance is not complete. Development and read-only static preview attempts were not reachable from the browser's loopback connection. No firewall, proxy or other security setting was changed. The existing Playwright viewport/offline matrix was not executed and no 16/16 result is claimed.

These are private source, test and web-build results, not an Android build, signing, installation, hosting deployment or release approval. Existing App release restrictions remain. Before integration or activation, recheck current writer state, source changes, validity and the target branch. The independent LabourNet archive-size and Website policy-endpoint problems are not fixed by this regional refresh.
