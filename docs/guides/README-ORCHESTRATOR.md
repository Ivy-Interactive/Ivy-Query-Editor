# Multi-Agent Feature Builder for Claude Code

This system enables automated feature development from PRDs using specialized AI agents.

## Quick Start

1. **Create a PRD**

   - Use the template at `docs/prd/template.md`
   - Or reference the example at `docs/prd/example-user-authentication.md`

2. **Start the Orchestrator**

In Claude Code, run:

```
I want to build a feature from the PRD at docs/prd/[your-prd].md

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
```

## Agent Descriptions

### Planner Agent

- Analyzes PRD requirements
- Creates technical implementation plan
- Breaks down into components
- Defines success criteria

### Builder Agent

- Implements code per component
- Follows best practices
- Writes tests alongside code
- Documents technical decisions

### Tester Agent

- Runs test suites
- Analyzes coverage
- Reports failures with details
- Suggests missing test cases

### Reviewer Agent

- Reviews code quality
- Checks security
- Validates requirements
- Approves or requests changes

## Configuration

Edit `.claude/workflow-config.json` to customize:

- Review strictness
- Test coverage thresholds
- Approval gates
- Auto-fix behavior

## File Structure

```
.claude/
├── agents/           # Agent definitions
├── workflows/        # Workflow templates
├── logs/            # Execution logs
├── orchestrator.md  # Main orchestrator
├── workflow-config.json
└── logging-config.json

docs/
└── prd/             # Product requirement docs

scripts/             # Helper scripts
```

## Tips

- Be specific in PRDs - better requirements = better results
- Review plans before building - catch issues early
- Watch for agent role switches - understand what's happening
- Check logs for detailed execution history
- Iterate on components - don't build everything at once

## Troubleshooting

**Agent seems confused?**

- Remind it which agent role it should be in
- Reference the specific agent file (e.g., "follow .claude/agents/builder.md")

**Tests failing?**

- Ensure test framework is set up
- Check test commands in .claude/agents/tester.md

**Reviews too strict/lenient?**

- Adjust review_strictness in workflow-config.json
- Modify .claude/agents/reviewer.md checklist

## Examples

See `docs/prd/example-user-authentication.md` for a complete PRD example.
