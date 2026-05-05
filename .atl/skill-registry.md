# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| when implementing a change, preparing commits... | work-unit-commits | C:\Users\DGUTIERREZ\.config\opencode\skills\work-unit-commits\SKILL.md |
| when drafting or posting feedback... | comment-writer | C:\Users\DGUTIERREZ\.config\opencode\skills\comment-writer\SKILL.md |
| When creating a pull request... | branch-pr | C:\Users\DGUTIERREZ\.config\opencode\skills\branch-pr\SKILL.md |
| when a PR would exceed 400 changed lines... | chained-pr | C:\Users\DGUTIERREZ\.config\opencode\skills\chained-pr\SKILL.md |
| When writing Go tests... | go-testing | C:\Users\DGUTIERREZ\.config\opencode\skills\go-testing\SKILL.md |
| When user says "judgment day"... | judgment-day | C:\Users\DGUTIERREZ\.config\opencode\skills\judgment-day\SKILL.md |
| when writing guides, READMEs... | cognitive-doc-design | C:\Users\DGUTIERREZ\.config\opencode\skills\cognitive-doc-design\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### work-unit-commits
- Commit by work unit: each commit represents a deliverable behavior, fix, migration, or docs
- Do not commit by file type: avoid `models`, then `services`, then `tests` if none works alone
- Keep tests with code: tests belong in the same commit as the behavior they verify
- Keep docs with user-visible change: docs belong with the feature they explain
- Tell a story: a reviewer should understand why each commit exists from its diff and message

### comment-writer
- Be useful fast: start with the actionable point, don't recap the whole PR first
- Be warm and direct: sound like a thoughtful teammate, not a corporate bot
- Keep it short: 1-3 short paragraphs or a tight bullet list
- Explain why: give the technical reason when asking for a change
- Avoid pile-ons: comment on the highest-value issue, not every tiny preference
- Match thread language: use Rioplatense Spanish/voseo for Spanish threads

### branch-pr
- Every PR MUST link an approved issue
- Every PR MUST have exactly one type:* label
- Automated checks must pass before merge
- Blank PRs without issue linkage will be blocked

### chained-pr
- MUST split when PR exceeds 400 lines unless maintainer-approved size:exception
- Design each PR for ≤60-minute human review
- Every chained PR states start, end, dependencies, and next steps
- One deliverable work unit per PR

### go-testing
- Use table-driven tests for multiple test cases
- Keep golden files in testdata/ directory
- Use t.Cleanup() for teardown

### judgment-day
- Follow skill-resolver protocol before launching judges
- Inject project standards into both judge prompts
- Maximum 2 iterations before escalation

### cognitive-doc-design
- Lead with the answer: put decision/action first
- Progressive disclosure: happy path first, then details
- Chunking: group related info into small sections
- Recognition over recall: prefer tables/checklists over prose

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | C:\Users\DGUTIERREZ\Documents\David Gutiérrez\Almacén_vehiculos\AGENTS.md | Index — full project documentation |

Read AGENTS.md for:
- Project structure
- Commands (backend/frontend)
- Tech stack details
- Common pitfalls
- Database schema notes
- API entry points
- Environment variables