# Claude Code Workspace Configuration

## CRITICAL RULES
**NEVER modify the Filters.g4 grammar file.** If there are parsing issues, adjust the application code to match the grammar rules, not the other way around. The grammar is the source of truth.

## Project Overview
This workspace uses a multi-agent feature development system for building features from Product Requirements Documents (PRDs).

## Agent System Architecture

### Available Agents
- **Planner Agent** (`.claude/agents/planner.md`) - Analyzes PRDs and creates technical implementation plans
- **Builder Agent** (`.claude/agents/builder.md`) - Implements code with best practices
- **Tester Agent** (`.claude/agents/tester.md`) - Executes tests and validates quality
- **Reviewer Agent** (`.claude/agents/reviewer.md`) - Reviews code for quality, security, and completeness
- **Orchestrator** (`.claude/orchestrator.md`) - Coordinates all agents through the workflow

### Workflow Process

#### Phase 1: Planning
1. Read PRD from `docs/prd/` directory
2. Activate Planner agent to analyze requirements
3. Generate technical implementation plan
4. Present plan to user for approval

#### Phase 2: Iterative Development
For each component:
1. **Build** - Builder agent implements the component
2. **Review** - Reviewer agent checks code quality
3. **Test** - Tester agent validates functionality
4. **Iterate** - Loop back if issues found (max 3 iterations)
5. **Complete** - Mark component done when all checks pass

#### Phase 3: Final Validation
1. Complete feature review
2. Full test suite execution
3. Generate completion report
4. Request user acceptance

## Configuration Files

### `.claude/workflow-config.json`
Controls workflow behavior:
- `review_strictness` - How strict code reviews should be
- `max_iterations_per_component` - Maximum build/test cycles
- `auto_fix_minor_issues` - Auto-fix simple problems
- `require_user_approval` - When to pause for user input
- `test_configuration` - Test coverage and execution settings

### `.claude/logging-config.json`
Controls logging and reporting:
- Log directory location
- What events to log (agents, file changes, tests, reviews)
- Summary report generation

## Documentation Standards

### IMPORTANT: Documentation Location
**ALL documentation files MUST be placed in the `docs/` folder structure:**
- `docs/prd/` - Product Requirements Documents
- `docs/guides/` - User guides and tutorials
- `docs/workflows/` - Workflow instructions and templates
- `docs/api/` - API documentation (if needed)
- `docs/architecture/` - System architecture docs (if needed)

**NEVER create documentation files in the root directory.**

### PRD Standards
All PRDs must be placed in `docs/prd/` and should include:
- Overview and goals
- User stories
- Functional requirements with acceptance criteria
- Technical requirements
- API specifications (if applicable)
- Data models
- Edge cases and error handling
- Dependencies
- Success metrics

Use `docs/prd/template.md` as a starting point.

## Quick Start Commands

### Validate a PRD
```bash
./scripts/validate-prd.sh docs/prd/your-feature.md
```

### Start Feature Development
See `docs/workflows/START-ORCHESTRATOR-PROMPT.md` for the complete prompt to activate the orchestrator.

Basic pattern:
```
I want to build a feature from the PRD at docs/prd/[your-prd].md

You are now the Feature Development Orchestrator as defined in .claude/orchestrator.md
[... rest of prompt from START-ORCHESTRATOR-PROMPT.md]
```

## File Organization

### Source Code
- Keep application source code in standard locations (src/, lib/, etc.)
- Follow existing project conventions

### Documentation
- `docs/prd/` - All PRDs and requirements
- `docs/guides/` - How-to guides and tutorials
- `docs/workflows/` - Workflow templates and instructions
- Other doc folders as needed (api/, architecture/, etc.)

### Scripts
- `scripts/` - Helper scripts and automation
- Must be executable (`chmod +x`)
- Should have clear usage instructions

### Agent System Files
- `.claude/agents/` - Agent role definitions
- `.claude/workflows/` - Workflow templates
- `.claude/logs/` - Execution logs (git-ignored)
- `.claude/*.json` - Configuration files
- `.claude/*.md` - System documentation

## Agent Communication Protocol

### Switching Agent Roles
When the orchestrator needs to switch agent roles, it should:
1. Explicitly state the role switch
2. Reference the agent definition file
3. Provide context from previous steps
4. Execute the agent's responsibilities

Example:
```
Switching to Builder Agent mode (following .claude/agents/builder.md)

BUILD REQUEST
=============
Component: User Registration API
Requirements: [from plan]
Dependencies: [list]

[Builder implements and reports back]
```

### State Tracking
The orchestrator maintains state throughout execution:
- Feature name and status
- Current component and phase
- Component statuses (pending/building/review/testing/complete/blocked)
- Iteration counts
- Metrics (build iterations, review cycles, test runs, bugs found)

### Decision Points
- **Iterate**: Review finds issues OR tests fail (max 3 iterations)
- **Proceed**: Review ✅ AND Tests ✅
- **Escalate**: Max iterations exceeded OR critical blocker
- **Complete**: All components done AND final validation passes

## Best Practices

### For Agent Operation
1. Stay in role - follow the agent definition strictly
2. Communicate clearly - explain decisions and blockers
3. Track progress - update state after each step
4. Quality first - don't skip review/test cycles
5. Ask when blocked - escalate to user if unclear

### For PRDs
1. Be specific - vague requirements lead to poor results
2. Include examples - API formats, data structures, UI mockups
3. Define success - clear acceptance criteria per requirement
4. Note constraints - performance, security, compatibility needs
5. List dependencies - external services, libraries, existing features

### For Development
1. Review plans before building - catch architectural issues early
2. Build incrementally - complete one component before starting next
3. Test continuously - run tests after each component
4. Document as you go - explain complex logic and decisions
5. Iterate when needed - don't merge code with known issues

## Troubleshooting

### Agent Confusion
- **Symptom**: Agent doesn't follow expected behavior
- **Fix**: Explicitly state which agent role to follow and reference the .md file

### Missing Tests
- **Symptom**: Tester reports no tests found
- **Fix**: Ensure test framework is configured, update test commands in `tester.md`

### Review Too Strict/Lenient
- **Symptom**: Reviews blocking good code or approving bad code
- **Fix**: Adjust `review_strictness` in `workflow-config.json` or modify `reviewer.md` checklist

### Build Iterations Stuck
- **Symptom**: Same component failing repeatedly
- **Fix**: Check if max iterations reached, review blocker details, may need manual intervention

## Logging

Logs are stored in `.claude/logs/` (git-ignored) and include:
- Agent conversations and decisions
- File changes and diffs
- Test results and coverage
- Review feedback and approvals
- Summary reports in markdown format

## Support

For issues with:
- **The workflow system**: Check `docs/guides/README-ORCHESTRATOR.md`
- **PRD format**: See `docs/prd/template.md` and example PRDs
- **Starting orchestrator**: See `docs/workflows/START-ORCHESTRATOR-PROMPT.md`
- **Script usage**: Run scripts without arguments for usage info
