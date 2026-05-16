# Phase 3: Pipeline Upload - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-05-16
**Phase:** 03-pipeline-upload
**Mode:** discuss
**Areas discussed:** Public URL format, Upload behavior, sort_key field

## Areas Not Discussed

### R2 credentials approach
Not selected for discussion — deferred to Claude's discretion.
**Resolved as:** Environment variables (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) for secrets; non-secret R2 config (bucket name, endpoint, public URL base) in `config.yaml`. Consistent with existing config.yaml comment.

## Discussion Log

### Public URL format

**Question:** What URL base will serve your R2 files publicly?

**Context presented:** Three options — custom domain, Cloudflare's auto-assigned r2.dev URL, or defer to config. Noted that Cloudflare Registrar registration is ~$10/year and ~5 minutes setup since already in the Cloudflare ecosystem.

**User explored:** Asked whether getting `noa-omri-wedding-photos.com` was feasible and cost-effective.

**Claude answered:** Cloudflare Registrar ~$10/year for `.com`, 5-minute setup (register → R2 bucket settings → connect custom domain). Recommended it given Cloudflare ecosystem fit and readable guest-facing URLs.

**Follow-up question:** Which URL approach to lock in?

**User selected:** Custom domain — register via Cloudflare Registrar.

**Decision locked:** Base URL from `config.yaml` as `r2_public_url`. URL pattern: `{r2_public_url}/photos/{id}.jpg` and `{r2_public_url}/thumbs/{id}.jpg`.

---

### Upload behavior

**Question:** When upload.py runs, what should happen if a file already exists in R2?

**Options:** Skip-if-exists (faster reruns) vs. always overwrite (simpler).

**User selected:** Always overwrite.

**Decision locked:** Upload unconditionally. Aligns with one-shot pipeline philosophy.

---

### sort_key field

**Question:** Should `sort_key` be included in the uploaded metadata.json?

**Context presented:** `sort_key` is set by `apply_custom_order.py` (drag-and-drop ordering tool). Not in the original spec schema. Site could use it for custom cluster ordering.

**Options:** Keep it (site uses for ordering) vs. strip it (timestamp-only ordering, spec-exact schema).

**User selected:** Keep it — site will use it for custom ordering.

**Decision locked:** `sort_key` included in uploaded metadata.json.
