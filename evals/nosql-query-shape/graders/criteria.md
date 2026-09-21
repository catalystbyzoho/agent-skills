---
type: llm
weight: 1
---

A successful response uses the key_condition shape: table.queryTable({ key_condition: { attribute: ['userId'], operator: NoSQLOperator.EQUALS, value: NoSQLMarshall.makeString('u123') } }) — attribute as a path array, an operator enum, and a marshalled value.

Fail the response if it invents a { partitionKey: {name, value}, sortKey, ascending } shape, passes plain unmarshalled JSON values, or queries via a nonexistent method.
