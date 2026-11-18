<!-- ra-aidlc:begin (managed by `ra-aidlc adapters sync`; edit outside this block) -->
## RA AIDLC

This project runs its work through **RA AIDLC**: an AI-driven lifecycle with stages and human gates. The `ra-aidlc` CLI owns the workflow state; you own the quality of the work inside each stage.

**Always**
- Start with `ra-aidlc status`. Never keep the workflow state in your head or in prose. Run each `ra-aidlc` command on its own (no `;` or `&&` chains).
- Before working on a stage: `ra-aidlc phase start --stage <id>`, then `ra-aidlc stage show <id>` and follow it. It holds the steps, the protocols and the templates, in the project's language.
- Before presenting a gate: `ra-aidlc gate --stage <id>`. Exit 0 clean, 1 failed, 2 a check did not run. Never call a check that did not run clean.
- When every stage of the scope is approved, stop and ask before implementing: approving requirements is not permission to change code.
- Approve only after the person approves in their own words: `ra-aidlc phase approve --stage <id> --by "<their name>"`. Never use your own name or a name they did not give.
- Every requirement, story and intent claim cites its source (`[desc]`, `[Q<n>]` of this stage, `[1.1:Q<n>]` of another, `[BR-NNN]`, `[codekb]`) or is an `[assumption]` listed under Assumptions. Never invent scope or business rules.

**Skills** (load with `ra-aidlc skill show <name>` when your tool does not load them by itself)
- `decision-record`: Records a project decision as a memory item (D-NNN) with context, options and consequences, proposed by the agent and accepted only by a person.
- `intent-interview`: Runs stage 1.1 Intent Capture: a relentless, one-question-at-a-time interview (in the style of grill-me) that turns a loose request into a clear problem, customer, measurable success and boundary.
- `knowledge-interview`: Interviews a business expert to turn knowledge that lives in their head into business rules (BR-NNN), procedures (PR-NNN) and glossary terms, each with an owner, sources and a review date.
- `lesson-capture`: Turns a correction or a recurring mistake into a lesson (L-NNN) scoped to the agent role and the paths it governs, so the mistake is not repeated, and pushes it up the guarantee ladder (remembered, injected, sensor, eval).
- `ra-aidlc-router`: Entry point of RA AIDLC.
- `requirements-analysis`: Runs stage 2.3 Requirements Analysis: asks only what the person's world decides, then writes testable requirements with permanent FR/NFR ids, each tagged with its source, and nothing nobody asked for.
- `reverse-engineering`: Runs stage 2.1 Reverse Engineering in an existing codebase: a scan focused on the paths the intent touches, a code knowledge base with the analyzed commit, and memory candidates (business rules, terms, implicit decisions) for people to confirm.
- `unit-construction`: Runs Construction for one unit: stage 3.1 Unit Plan (an EGM design doc and a spec-kit task list, each task citing the tests that prove it) and stage 3.2 Implementation (task by task, test before code, the gate reading a real JUnit report).
- `units-generation`: Runs stage 2.7 Units Generation, the Inception phase gate: splits the work into units that can be built and reviewed alone, with an acyclic dependency block and every story mapped.
- `user-stories`: Runs stage 2.4 User Stories: decides whether stories add value, then writes personas and INVEST stories with exact acceptance criteria, tracing every FR to a story or an explicit deferral.

**Memory** lives in `aidlc/memory/` and `aidlc/knowledge/`; read `aidlc/memory/INDEX.md` first and open only items whose `governs` paths you touch.
<!-- ra-aidlc:end -->
