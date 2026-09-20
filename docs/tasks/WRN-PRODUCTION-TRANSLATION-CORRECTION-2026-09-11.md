# Translation candidate — four concrete corrections

Parent SERVICE/RELEASE-COMPLETION. Root owns the five existing files only:
packages/api-contracts/src/translation-v1.ts and tests/translation-v1.test.ts;
services/translation/src/handler.ts, src/index.ts, tests/handler.test.ts.
Own new CORRECTION report/handoff/output. No delegated writer, no children.
Independent Sol report againsta87e8b56 binds TRN-M-001..004; no design reround.
Sol now reviews frozen core; Terra checks Rootsourceinput, both read-only.

Validate runtime enabled boolean, exact adapter identity/config/source policy,
all required ports and exact true quotas before any dependent I/O; bad runtime
configuration yields safe503, denied/malformedquota yields429/503 with no work.
Split canonical lowercase source BCP47 validation from nine fixed targets.
Exact configured supportedSourceLanguages is mandatory; no guessed provider
support. und/private/extension/aliases/case-invalid tags fail beforeI/O.
Output is wellformed nonblank plaintext<=32768UTF8 and wholeJSON<=36864;
6000UTF16 applies only to input, never response/cache output.

Carry callerAbortSignal from Worker through body and handler. Bound body reading
and the full service operation to12s (client's later15s remains separate), with
single controller and no retry. Race awaited ports even if they ignoreSignal;
check authority before subsequent I/O/response/write. Reader read/cancel failure
maps to safe error, cancellation itself must not block completion. A pending
cache put cannot be rolled back once a provider has committed; require a signal-
aware put port with final precommit guard as part of adapter contract, test
cooperative deferred put and fence every new write. Never claim arbitrary
external side effects can be undone; liveadapter proof remains required.
One provider reservation remains spent once dispatch may have happened;
definite pre-dispatch failure alone may refund. No active provider/bindings/UI.

Tests reproduce corrected failure paths, including malformed config/origins,
all three truthy nonboolean quotas, unsupportedsource and supported ar,
6001output/32768/32769UTF8/envelope, errored/cancelthrowing/pending body,
abort at quota/cache/upstream/preput and no late writes/response. Preserve
existing19tests and scoped types/lint/format/boundaries. Separate immutable
candidate then sameSol's bounded finding closure when it returns from core.
No installs, provider requests, deployment or oldV1writes. END-CHECK: :).
