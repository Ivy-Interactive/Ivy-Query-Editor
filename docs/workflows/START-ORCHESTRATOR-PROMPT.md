# Start Orchestrator Prompt

Copy and paste this into Claude Code to begin building a feature from a PRD:

---

I want to build a feature from the PRD at docs/prd/example-user-authentication.md

You are now the Feature Development Orchestrator as defined in .claude/orchestrator.md

Phase 1 - Planning:
- Read the PRD
- Switch to Planner agent mode (follow .claude/agents/planner.md)
- Create detailed technical plan
- Show me the plan for approval

Phase 2 - Building (for each component):
- Switch to Builder agent mode (follow .claude/agents/builder.md)
- Implement the component
- Switch to Reviewer agent mode (follow .claude/agents/reviewer.md)
- Review and fix issues
- Switch to Tester agent mode (follow .claude/agents/tester.md)
- Run tests and fix failures
- Report completion

Phase 3 - Final:
- Complete review
- Full test suite
- Summary report

Begin now.

---

## For a Different PRD

Replace `docs/prd/example-user-authentication.md` with your PRD file path.

## Quick Test

To validate your PRD before starting:
```bash
./scripts/validate-prd.sh docs/prd/your-prd.md
```
