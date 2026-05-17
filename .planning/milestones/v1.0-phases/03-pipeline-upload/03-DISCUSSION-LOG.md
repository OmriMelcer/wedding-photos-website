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

**User explored:** Asked whether getting `noa-omri-wedding-photos.com` was feasible and cost-effective. Asked if a domain can be bought permanently.

**Claude answered:** Domains can't be bought permanently (ICANN rules, always leased). Noted that guests never see R2 URLs — only the Cloudflare Pages URL (free forever via `*.pages.dev`). Recommended skipping the custom domain entirely: use `*.pages.dev` for the site and `pub-xxx.r2.dev` for R2 assets, both free.

**User decision:** No custom domain. Use free `r2.dev` URL for R2 assets.

**Decision locked:** Base URL from `config.yaml` as `r2_public_url` (filled with `pub-xxx.r2.dev` value after bucket creation). URL pattern: `{r2_public_url}/photos/{id}.jpg` and `{r2_public_url}/thumbs/{id}.jpg`.

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
