# Catalyst Pipelines Basics

Configure a Catalyst CI/CD pipeline to test and deploy an application, then inspect its execution.

## Create and connect a pipeline

In the target project's console, open **Pipelines → Create Pipeline**, name the pipeline, and optionally connect a GitHub, GitLab, or Bitbucket account. Select the repository and intended branch. The organization selector means a GitHub organization, GitLab project, or Bitbucket workspace respectively.

Use the exact filename `catalyst-pipelines.yaml`. Edit existing YAML in place when present. The console editor can commit the configuration to the selected branch; review that destination before committing. A draft saves work without completing setup. Without Git integration, configure the pipeline in the console and execute it manually.

For an application deployment, first verify the organization, project, data center, and existing `catalyst.json` configuration. For project initialization, load [CLI guidance](../../catalyst-basics/references/cli.md); for handler/build configuration, load [Functions guidance](../../catalyst-functions/references/functions-basics.md). Do not create a new application project merely to explain pipeline syntax.

Sources: [Create a pipeline](https://docs.catalyst.zoho.com/en/pipelines/help/pipelines/create-a-pipeline/), [configure YAML and Global Variables](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/implementation/).

## Configuration model

Declare reusable jobs under `jobs`, then reference them from the ordered `stages` list. A job's `steps` contain shell commands. Use Catalyst keys, not GitHub Actions keys such as `runs-on` or `uses`.

| Component | Configuration rule |
|-----------|--------------------|
| `version` | An integer identifying the pipeline configuration version; independent of skill metadata |
| `runners` | Named configurations with `config-id`: `1` low, `2` medium, `3` high |
| `images` | Named container images; provide `image` and registry `auth`; Docker Hub is used when `registry` is omitted |
| `jobs` | Named groups of commands under `steps` |
| `stages` | Ordered stage definitions referencing declared jobs; up to five stages and five jobs per stage |

An omitted runner uses the medium configuration. An omitted image uses Catalyst's default Ubuntu image with its CLI installed. For a custom image, include the tools required by the application. Runner/image settings can apply at pipeline, stage, or job level; the more specific setting wins. Reusing an image does not establish a shared application workspace between jobs. When splitting build and deployment, configure explicit [artifact upload/download](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/build-the-pipeline/artifacts/) rather than assuming generated files are present in another job.

Sources: [Schema reference](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/schema-reference/), [runners](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/build-the-pipeline/runners/), [images](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/build-the-pipeline/images/), [steps](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/build-the-pipeline/steps/).

## Variables and credentials

| Where the value is defined | How to reference it |
|----------------------------|---------------------|
| Console **Global Variables** | `<< env.NAME >>` |
| A job's `variables` mapping | `<< variables.NAME >>` |
| JSON supplied when triggering execution | `<< event.NAME >>` |

Variables belong at pipeline or job scope, not stage scope. These are Catalyst template expressions; do not replace them with GitHub Actions expression syntax. Configure the CLI credential as the global variable `CATALYST_TOKEN`. Generate it using the existing [CLI token workflow](../../catalyst-basics/references/cli.md#token-management), not by running interactive login inside a pipeline.

Keep tokens and registry passwords in console Global Variables, not committed YAML, event payloads, or chat. Do not print substituted commands, credentials, or full environment dumps when debugging. Treat logs containing expanded credentials as sensitive and redact them before sharing.

Source: [Variables and namespaces](https://docs.catalyst.zoho.com/en/pipelines/help/catalyst-pipelines.yaml/build-the-pipeline/variables/).

## Example: test and deploy a Node.js function

This example assumes an existing Catalyst application repository with:

- `catalyst.json` at the repository root, listing the function source `functions/api`.
- A function named `api`, with valid Catalyst configuration and a Node.js runtime supported by the project.
- `functions/api/package.json` and a committed `package-lock.json`.
- A real `test` script that exits nonzero on failure; a `build` script is optional for plain JavaScript.

Adapt the directory and `--only functions:api` selector together for another function. The container's Node.js version controls build tooling; it does not change the deployed runtime in the function configuration.

Set these console Global Variables before execution:

| Name | Value |
|------|-------|
| `PROJECT_ID` | Numeric ID of the intended Catalyst project |
| `CATALYST_ORG` | Its organization ID |
| `CATALYST_DC` | Its CLI data-center code, for example `in` or `us` |
| `CATALYST_TOKEN` | CLI token authorized for that organization/project and data center |
| `REGISTRY_USER` | Docker Hub username for pulling the image |
| `REGISTRY_PASSWORD` | Docker Hub registry credential |

Save the following as `catalyst-pipelines.yaml` in the application repository. The CLI version is pinned to the version used to check this example's command interface. Review it when upgrading the CLI.

```yaml
version: 1
runners:
  build_runner:
    config-id: 2
images:
  node_build:
    image: node:22
    auth:
      username: << env.REGISTRY_USER >>
      password: << env.REGISTRY_PASSWORD >>
jobs:
  test_build_deploy:
    steps:
      - >-
        npm install --global zcatalyst-cli@1.27.0
        && test -f catalyst.json
        && npm --prefix functions/api ci
        && npm --prefix functions/api test
        && npm --prefix functions/api run build --if-present
        && catalyst deploy --only functions:api
        --project '<< env.PROJECT_ID >>'
        --org '<< env.CATALYST_ORG >>'
        --dc '<< env.CATALYST_DC >>'
        --token '<< env.CATALYST_TOKEN >>' -ni
stages:
  - name: verify_and_deploy
    runner: build_runner
    image: node_build
    jobs:
      - test_build_deploy
```

The single job keeps dependency installation, tests, build output, and deployment together. The `&&` chain prevents deployment after a failed installation, test, or build. Do not make the test script optional or add `|| true` to make a failed build green.

`catalyst deploy` uploads to **Development**. A production release needs the separate supported release workflow; do not invent a `--production` switch. The `--only` selector avoids deploying unrelated components. Use `PROJECT_ID` consistently: the official sample's variable list declares `PROJECT_ID`, while its command uses `PROJECT_NAME`.

Sources: [Catalyst deployment example](https://docs.catalyst.zoho.com/en/pipelines/help/deployments/deploy-to-catalyst/), [CLI deploy reference](https://docs.catalyst.zoho.com/en/cli/v1/deploy-resources/introduction/).

## Execute and inspect

With Git integration configured, push/merge events in the linked repository trigger runs. Check the configured repository and branch, the exact YAML filename, and whether the configuration was committed when an expected run is missing. For manual execution, use **Execute Pipeline**, supply optional event JSON, and select **Execute**.

Open **Execution History** and select the relevant record. The **Basic** tab shows stage/job status; the **Advanced** tab contains execution logs. A run waiting at an approval job needs its designated reviewer's approval in the Basic tab; repeatedly triggering it does not resolve that wait.

After deployment, verify the intended function in the correct Development project and call its endpoint with the application's required authentication. Compare the response with the expected application behavior. Record the execution ID, commit/branch, and result without including credentials. A saved configuration, queued response, or successful upload alone does not prove the application works.

Sources: [Triggers](https://docs.catalyst.zoho.com/en/pipelines/help/triggers/introduction/), [execution history](https://docs.catalyst.zoho.com/en/pipelines/help/triggers/monitor-execution-status/).

## Node.js and Python SDK operations

SDKs expose details and execution for an existing pipeline. Console/YAML configuration is still needed to create it. For initialization, load the existing [Node.js SDK](../../catalyst-sdk/references/sdk-nodejs.md#initialization) or [Python SDK](../../catalyst-sdk/references/sdk-python.md#initialization) reference. The helpers below accept that initialized app and real pipeline/branch values from the caller. Run them in trusted server code with the application's authorization checks, not an unauthenticated public deployment endpoint.

Node.js helper module:

```javascript
async function getPipelineDetails(catalystApp, pipelineId) {
  return catalystApp.pipeline().getPipelineDetails(pipelineId);
}

async function executePipeline(catalystApp, pipelineId, branch) {
  return catalystApp.pipeline().runPipeline(pipelineId, branch, {});
}

module.exports = { getPipelineDetails, executePipeline };
```

Python helper module:

```python
def get_pipeline_details(catalyst_app, pipeline_id):
    return catalyst_app.pipeline().get_pipeline_details(pipeline_id)


def execute_pipeline(catalyst_app, pipeline_id, branch):
    return catalyst_app.pipeline().run_pipeline(pipeline_id, branch, {})
```

Node.js callers must `await` the returned promise. Supply a branch name as a string, not an undefined identifier. The third argument supplies optional event data; keep credentials in Global Variables. Execution returns a history record that may still be queued. Inspect Execution History for completion; do not interpret the trigger response as deployment success or automatically retry an accepted trigger and create duplicate runs.

Sources: Node.js [instance](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/pipelines/get-pipeline-instance/), [details](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/pipelines/get-pipeline-details/), [execution](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/pipelines/execute-pipeline/); Python [instance](https://docs.catalyst.zoho.com/en/sdk/python/v1/pipelines/get-pipeline-instance/), [details](https://docs.catalyst.zoho.com/en/sdk/python/v1/pipelines/get-pipeline-details/), [execution](https://docs.catalyst.zoho.com/en/sdk/python/v1/pipelines/execute-pipeline/).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Pipeline does not start after a push | Wrong integration/repository/branch, draft configuration, or wrong YAML filename | Check the linked Git configuration and committed `catalyst-pipelines.yaml` before debugging build commands |
| YAML is rejected | Foreign CI keys, incorrect nesting, or references to undeclared jobs/images/runners | Validate against the Catalyst schema; each stage references declared jobs |
| Missing variable or unresolved expression | Wrong namespace, spelling mismatch, or a variable placed at stage scope | Use `env`, `variables`, or `event` according to its source; keep `PROJECT_ID` consistent |
| Container image cannot be pulled | Missing/invalid registry authentication or incorrect image/registry | Check image name and `auth`; an omitted registry means Docker Hub |
| `npm ci` or tests fail | Missing/out-of-sync lockfile, wrong function directory, or failing tests | Fix dependencies/path/tests; preserve the failure so deployment does not run |
| CLI authentication or project lookup fails | Expired/missing CLI token or mismatched project, organization, or data center | Verify the global variables and token authorization; do not run interactive login in the job |
| Pipeline stays paused | An approval job is waiting for its reviewer | Inspect the Basic tab and complete the configured review |
| SDK returns queued but no deployment is visible | Trigger acceptance was mistaken for completion | Follow the execution record and inspect job logs, then verify the target function |
