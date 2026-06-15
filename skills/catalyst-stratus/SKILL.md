---
name: catalyst-stratus
description: "Catalyst Stratus — S3-compatible object storage with upload/download, signed URLs, and multipart upload support. Trigger on 'Stratus', 'object storage', 'upload file', 'signed URL', 'putObject', 'getObject', or 'bucket'."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Bucket naming** — Bucket names are globally unique. Use `{app-name}-{project-id-prefix}` pattern to avoid collisions.
2. **Load `references/stratus-basics.md`** — for upload/download/delete patterns, the 100 MB single-upload limit, signed URL generation, and multipart setup.
3. **Large files** — Files over 100 MB require multipart upload. Load the multipart section of `stratus-basics.md`.
4. **Signed URLs** — For user-facing direct downloads/uploads, generate a signed URL server-side and return it to the client.

## Triggers

Use this skill for: "Stratus", "object storage", "file storage", "upload file", "download file", "signed URL", "pre-signed URL", "multipart upload", `putObject`, `getObject`, "bucket", "Stratus bucket", "store files on Catalyst", "Stratus vs File Store", "100MB limit", or "file download link".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/stratus-basics.md` | Upload/download/delete, 100MB limit, multipart, signed URLs, busboy upload pattern, bucket naming rules |
