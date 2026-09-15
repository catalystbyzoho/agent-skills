---
name: catalyst-pipelines
description: "Catalyst Pipelines — configure CI/CD with catalyst-pipelines.yaml, GitHub/GitLab/Bitbucket integration, build/test/deploy jobs, runners, images, variables, and execution history. Use for 'create a pipeline', 'automate deployment', 'pipeline failed', 'pipeline not triggering', 'missing pipeline variable', 'approval job paused', getPipelineDetails, runPipeline, get_pipeline_details, or run_pipeline."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the workflow** — Determine whether the user needs pipeline setup, an existing run diagnosed, or SDK execution. For setup, inspect the application's build/test commands, Catalyst configuration, Git repository/branch, organization, project, and data center. Default deployment examples to Development.
2. **Load `references/pipelines-basics.md`** — Follow the relevant section for console integration, YAML configuration, or execution history. Preserve existing pipeline jobs when extending a configuration; use Catalyst's schema and variable namespaces.
3. **Prepare the deployment** — Keep credentials in console Global Variables and check that the deploy command targets the intended function and project. Load the linked Functions or CLI reference only when function configuration or project initialization needs work.
4. **Use the supported interface** — Create/configure pipelines through the console and YAML; use the documented Node.js/Python SDK methods for details or execution. Discover any available MCP tool's schema before using it; do not invent a pipeline creation tool or CLI command.
5. **Verify the outcome** — Check the execution record's stages/jobs and logs, then the deployed function's expected behavior. A queued SDK response or saved YAML is not a completed deployment. Report any live validation that could not be performed.

## Triggers

Use this skill for: "Catalyst Pipelines", "CI/CD", "create a pipeline", "automate deployment", "GitHub pipeline", "GitLab pipeline", "Bitbucket pipeline", `catalyst-pipelines.yaml`, "pipeline failed", "pipeline not triggering", "missing pipeline variable", "approval job paused", "pipeline execution history", `getPipelineDetails`, `runPipeline`, `get_pipeline_details`, or `run_pipeline`.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/pipelines-basics.md` | Creating a pipeline, Git integration, YAML jobs/stages, variables, a Node.js Functions deployment, Node.js/Python SDK execution, execution history, and common errors |
