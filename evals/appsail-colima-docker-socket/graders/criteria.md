---
type: llm
weight: 1
---

A successful response identifies the Colima-specific Docker socket issue before (or instead of) any generic Docker debugging: it mentions setting the `ZC_DOCKER_SOCK_PATH` environment variable (Catalyst CLI v1.22.0+) to Colima's socket path (default `$HOME/.colima/default/docker.sock`), or at minimum explains that the Catalyst CLI looks for the Docker Desktop socket by default and must be pointed at Colima's socket.

Fail the response if it recommends reinstalling Docker tooling or switching to Docker Desktop as the primary fix, or walks through a generic AppSail Docker deploy with no mention of the Colima socket path at all.
