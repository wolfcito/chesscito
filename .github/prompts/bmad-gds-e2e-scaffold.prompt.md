---
description: 'E2E Scaffold'
agent: 'agent'
tools: ['read', 'edit', 'search', 'execute']
---

1. Load {project-root}/_bmad/bmm/config.yaml and store ALL fields as session variables
2. Load the workflow engine at {project-root}/_bmad/core/tasks/workflow.xml
3. Load and execute the workflow configuration at {project-root}/_bmad/gds/workflows/gametest/e2e-scaffold/workflow.yaml using the engine from step 2
