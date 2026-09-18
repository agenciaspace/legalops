# Bend integration

Bend 2.0.8 proves a pure policy, then evaluates every combination of its boolean
inputs into `bend/decisions.generated.json`. The application consumes this exact
artifact. There is no Bend subprocess, GPU, native runtime, LLM or network call
on a request. This first integration targets correctness, not claimed AI-cost or
performance savings.

## Verify and regenerate

```sh
python3 scripts/check-bend.py
python3 scripts/check-bend.py --write
```

The script downloads the pinned official release when needed, checks its SHA-256,
runs `PROOF.bend`, and compares the complete generated artifact. `BEND_BIN` can
select an existing 2.0.8 installation. Telemetry is disabled for these commands.
Read `bend guide` before editing the language. Laws encode requirements; never
weaken them just to make an implementation pass.

## Covered behavior

`bend/access.bend` decides whether an enabled entitlement with a valid expiry
allows access. `LAWS.bend` requires disabled and expired/invalid entitlements to
be denied, and valid enabled entitlements to be accepted. Club and Pro pass their
own independent fields through `lib/bend-access.ts`; community membership never
implies Pro entitlement. Deploy CI checks the proofs and artifact before building.

Status/date parsing, database RLS, sessions, payment approval, network calls and
storage are outside these proofs. Host integration tests remain mandatory.
Finite boolean inputs are indexed in the order in `bend/policies.json`, false
before true. Integration tests cover the entire adapter space and date boundaries.

## Validation on 2026-09-18

- Compiler passed all laws and regenerated tables reproducibly.
- A temporary mutation granting disabled access was rejected by the checker.
- 394 application tests passed, including independent Club/Pro access and dates.

Official references: https://bend-lang.com/ and
https://github.com/bendlang/bend/blob/main/guide/GUIDE.md.
