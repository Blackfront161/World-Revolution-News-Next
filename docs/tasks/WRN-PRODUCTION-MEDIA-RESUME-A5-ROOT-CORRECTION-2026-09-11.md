# A5 Root integration correction

Terra returned all rights; candidate36ff5842 preserves its complete delivery.
Root review finds clearExact serializes undefined when an expected record is
absent, violating no-op exact mismatch. E2E also hardcodes the current Windows
workspace path. Bind Root only to existing A5 store/unit/E2E trio plus own
matching ROOT-CORRECTION report/handoff/helpers/output. No A1–A4/V1/core changes.
No children; Root owns returned browser43173–75, preserves43190/91/43176.

Add real-IDB regression: matching generation but absent requested record must
return no-op and preserve raw state. Also present record with changed position
must not clear it; MAX_SAFE_INTEGER generation save must abort unchanged and
reject finite protected. Check malformed caller record/clear inputs produce
finite protected failure and zero writes, including missing-key comparison.
Use an explicit existing-record guard before canonical comparison; snapshot
errors map to finite protected at the public input boundary. Resolve E2E module
URL via path.resolve instead of machine path. Preserve prior4browser/2unit cases;
type/static/boundary checks, independent closure after separate candidate.
