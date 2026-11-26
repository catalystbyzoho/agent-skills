---
type: llm
weight: 1
---

A successful response explains that Public Signup is off by default and that is why signUp() fails, and then helps the user choose deliberately rather than just flipping it on: while Public Signup is on, anyone can create an account and read Global-scope Data Store tables, so with real data in a development app it suggests keeping it off (adding test users from User Management), or enabling it together with Custom User Validation to approve each signup, and checking table scopes (user or org) before opening signup.

Fail the response if it only tells the user to enable Public Signup without mentioning the exposure risk or any way to restrict who can sign up.
