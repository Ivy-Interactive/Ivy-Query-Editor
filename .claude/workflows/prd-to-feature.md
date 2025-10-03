# PRD to Feature Workflow

Complete automated feature development from PRD.

## Usage:

Start the orchestrator with:
```bash
claude-code "Build feature from PRD at docs/prd/[filename].md using the prd-to-feature workflow"
```

## Configuration:

Workflow settings in `.claude/workflow-config.json`

## Steps:

1. **Initialization**
   - Load PRD
   - Load configuration
   - Initialize agents
   - Set up logging

2. **Execute Orchestrator**
   - Follow orchestrator workflow
   - Log all agent interactions
   - Track metrics

3. **Completion**
   - Generate summary report
   - Create PR description (optional)
   - Update documentation
