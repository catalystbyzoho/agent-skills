# Circuits Basics

Design a Catalyst workflow, execute it, and trace the state that caused an incorrect result.

## Availability and targets

Circuits is unavailable in EU, AU, IN, JP, SA, and CA data centers. Its Function state executes **Basic I/O** functions; an Advanced I/O HTTP endpoint cannot be selected as that target. Check existing project context before proposing resources. In a restricted region, explain the limitation and discuss function chaining or Job Scheduling only if it meets the user's requirements. [Source](https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/).

Reuse [function guidance](../../catalyst-functions/references/functions-basics.md) for handlers and [architecture guidance](../../catalyst-basics/references/architecture.md) for service selection.

## Build and inspect the graph

Open **Serverless → Circuits**, create or select a circuit, and configure states in Builder View. Code View reflects the graph as JSON; preserve its generated shape when editing. Saving performs compilation checks before execution. Resolve missing conditions and unbounded cycles there first.

Use the numeric **Circuit ID** for SDK calls. Nested circuits use the **Circuit Reference Name**, which differs from the editable display name. Development supports up to 50 circuits. [Source](https://docs.catalyst.zoho.com/en/serverless/help/circuits/implementation/).

## State and data decisions

| Need | Catalyst behavior |
|------|-------------------|
| Conditional routing | Branch conditions select a path; configure the default for unmatched input |
| Independent concurrent tasks | Parallel; nested Parallel, Success, and Failure states are not allowed inside it |
| Repeat over an array | Batch binds a function or circuit, with at most 10 concurrent jobs |
| Pause / reuse a workflow | Wait uses seconds; Circuit invokes a child workflow |
| Transform / terminate | Pass can add a result; Success and Failure terminate a path |

Input path selects task input; result path merges its result into the payload; output path selects data passed onward. Check paths against the JSON at that state, not only the initial input. The Basic I/O `output` wrapper is handled automatically; do not add another `$.output` without evidence.

Function states support Retry and Fallback; Circuit and Batch handlers support Retry only. For function errors, configure delay, attempts, step delay, and an exhaustion outcome. [State and path reference](https://docs.catalyst.zoho.com/en/serverless/help/circuits/key-concepts/).

For a workflow that charges an order, retrying after a timeout may repeat a completed charge. Use a stable business operation ID to deduplicate side effects, and inspect execution history before submitting another run. An execution name is a tracking label, not a documented idempotency guarantee.

## Execute and inspect with SDKs

These reusable modules accept an initialized, authorized server SDK app. Initialize it in the caller using the [Node.js](../../catalyst-sdk/references/sdk-nodejs.md) or [Python](../../catalyst-sdk/references/sdk-python.md) reference. Obtain resource IDs from the selected project; do not embed access tokens or assume IDs from another environment.

Node.js CommonJS module, `circuits.cjs`:

```javascript
'use strict';

async function startCircuit(app, circuitId, executionName, input) {
  return app.circuit().execute(circuitId, executionName, input);
}

async function readExecution(app, circuitId, executionId) {
  return app.circuit().status(circuitId, executionId);
}

async function abortExecution(app, circuitId, executionId) {
  return app.circuit().abort(circuitId, executionId);
}

module.exports = { startCircuit, readExecution, abortExecution };
```

The returned execution's `id` identifies the run; `status` may initially be `running`. Pass that ID to `readExecution` to follow the same run. Call `abortExecution` only when cancellation is intended. [Node.js SDK](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/serverless/circuits/execute-circuit/).

Python module, `circuits.py`, for `zcatalyst-sdk==1.4.0`:

```python
def start_circuit(app, circuit_id, execution_name, inputs):
    return app.circuit().execute(circuit_id, execution_name, inputs)


def read_execution(app, circuit_id, execution_id):
    return app.circuit().status(circuit_id, execution_id)


def abort_execution(app, circuit_id, execution_id):
    return app.circuit().abort(circuit_id, execution_id)
```

**Python signature:** the published [1.4.0 package](https://pypi.org/project/zcatalyst-sdk/1.4.0/) implements `execute(circuit_id, name, inputs=None)` in `zcatalyst_sdk/circuit.py`. Passing a dictionary as the second argument fails execution-name validation. The [documentation](https://docs.catalyst.zoho.com/en/sdk/python/v1/serverless/circuits/execute-circuit/) describes input but its example omits it; verify the installed package before adapting a different version. The operation uses admin credentials.

## Verify the outcome

In **Save and Execute**, supply a JSON fixture and a test name. Test one successful input and one unmatched branch or function failure. Follow **Execution History → View Graph / View Logs**: compare the failing state's payload, parameters, response, and exception. Function and nested-circuit events link to their own logs. [Execution inspection](https://docs.catalyst.zoho.com/en/serverless/help/circuits/implementation/).

Do not infer workflow completion from successful submission. Report the observed final state and business output, or the execution ID and remaining uncertainty if still running. For polling, use a bounded wait and retain the same ID rather than resubmitting the workflow.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Circuits missing / target function absent | Unsupported DC or function type | Check availability and Basic I/O eligibility first |
| Python execution-name validation fails | Input dictionary supplied as `name` | Pass ID, execution name, then input dictionary |
| Downstream field missing | Path filters the wrong payload or adds an extra wrapper | Inspect the state's actual input/result/output |
| Repeated side effect after retry | The previous operation completed before its response timed out | Check business state and deduplicate before replaying |
| SDK returned `running` but output is absent | Submission mistaken for completion | Inspect that execution's status and history |
