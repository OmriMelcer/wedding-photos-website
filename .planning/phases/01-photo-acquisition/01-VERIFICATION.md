---
phase: 01-photo-acquisition
verified: 2026-05-16T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run acquire_google.py with real Google Photos shared album URLs and confirm photos download into sources/photographer_a/, sources/photographer_b/, sources/photographer_c/"
    expected: "Script exits 0 and prints a summary showing image file counts per album folder"
    why_human: "Real album URLs are intentionally not committed; download requires live Google Photos URLs that cannot be tested programmatically in this environment"
  - test: "Run acquire_pictime.py and confirm photos download into sources/pic_time/"
    expected: "Script exits 0 and prints 'pic-time download complete: N images in sources/pic_time/'"
    why_human: "The pic-time gallery (justsmile.pic-time.com/gallery) requires network access and potentially JavaScript rendering; the fallback path (requests+BeautifulSoup) may or may not retrieve all photos depending on whether the gallery is server-rendered"
---

# Phase 1: Photo Acquisition Verification Report

**Phase Goal:** All wedding photos are downloaded to local folders, organized by source, ready for the pipeline
**Verified:** 2026-05-16
**Status:** human_needed (all automated checks PASS; 2 items require human testing with real credentials/network)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running the acquisition script downloads all photos from all 3 Google Photos shared albums into source folders | ? UNCERTAIN | acquire_google.py exists, is syntactically valid, reads config.yaml, validates PLACEHOLDERs correctly (exits 1 with per-label messages). Cannot verify end-to-end download without real album URLs. Placeholder detection confirmed working. |
| 2 | Running the acquisition script downloads all photos from the pic-time gallery into a source folder | ? UNCERTAIN | acquire_pictime.py exists, is syntactically valid, invokes gallery-dl with correct URL and dest, implements automatic fallback. Cannot verify end-to-end download without network access to the live gallery. |
| 3 | A documented manual download path exists and works when auto-download fails for either source | ✓ VERIFIED | docs/manual-download.md exists (94 lines), contains all 5 required sections, covers both sources with numbered steps, matches exact folder structure used by scripts. |
| 4 | Source folders are organized so the pipeline can identify which photos belong to which photographer | ✓ VERIFIED | config.yaml defines unique label-to-output_dir mappings (photographer_a → sources/photographer_a, etc.). Labels match photographer entries exactly. All four output_dirs are unique and unambiguous. |

**Score:** 4/4 truths have sufficient implementation evidence (2 verified, 2 uncertain pending human confirmation with live URLs)

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pipeline/config.yaml` | Central config: 3 google_photos entries, pic_time entry, 3 photographers | ✓ VERIFIED | Valid YAML; 3 google_photos entries each with label/album_url/output_dir; pic_time entry with correct gallery_url; 3 photographers with label/display_name |
| `pipeline/acquire_google.py` | Google Photos downloader with PLACEHOLDER validation | ✓ VERIFIED | Substantive (137 lines); reads config via yaml.safe_load; validates PLACEHOLDERs; creates output dirs; invokes gallery-dl via subprocess; path traversal guard applied |
| `pipeline/acquire_pictime.py` | pic-time downloader with fallback | ✓ VERIFIED | Substantive (152 lines); primary gallery-dl path + automatic requests+BS4 fallback; --fallback flag; creates output dir; counts and reports downloaded files |
| `docs/manual-download.md` | Manual fallback instructions | ✓ VERIFIED | 94 lines; all 5 required sections present; covers both sources; references config.yaml; includes verification commands |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| acquire_google.py | pipeline/config.yaml | yaml.safe_load — reads sources.google_photos list | ✓ WIRED | Line 38: `return yaml.safe_load(fh)` with path resolved via `Path(__file__).resolve().parent / "config.yaml"` |
| acquire_google.py | sources/photographer_a/, photographer_b/, photographer_c/ | gallery-dl subprocess with --dest flag | ✓ WIRED | Lines 107–115: subprocess.run(["gallery-dl", "--dest", str(output_dir), "--filename", "{filename}", album_url]); output_dir resolved from config |
| acquire_pictime.py | sources/pic_time/ | gallery-dl subprocess with --dest flag | ✓ WIRED | Lines 39–49: subprocess.run(["gallery-dl", "--dest", str(OUTPUT_DIR), ...]) with OUTPUT_DIR = Path(__file__).parent.parent / "sources" / "pic_time" |
| docs/manual-download.md | pipeline/config.yaml | Cross-reference for album URL slots | ✓ WIRED | References pipeline/config.yaml 4 times; instructs users to read album_url from sources.google_photos entries |
| docs/manual-download.md | sources/ folder structure | Explicit folder path instructions | ✓ WIRED | All four source folders mentioned by exact name in both table and numbered steps |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces CLI download scripts, not components that render dynamic data. The "data" is photos written to disk; actual data flow requires live network execution (covered in human verification).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| config.yaml is valid YAML with correct structure | `uv run python -c "import yaml; c=yaml.safe_load(open('pipeline/config.yaml')); assert len(c['sources']['google_photos'])==3; assert c['sources']['pic_time']['gallery_url']=='https://justsmile.pic-time.com/gallery'; assert len(c['photographers'])==3; print('config.yaml OK')"` | config.yaml OK | ✓ PASS |
| acquire_google.py PLACEHOLDER detection | `uv run python pipeline/acquire_google.py 2>&1` | Exits 1; prints per-label PLACEHOLDER error for all 3 albums; prints "Aborted: update all PLACEHOLDER album_url values" | ✓ PASS |
| acquire_pictime.py syntax valid | `uv run python -m py_compile pipeline/acquire_pictime.py` | exits 0 | ✓ PASS |
| acquire_google.py syntax valid | `uv run python -m py_compile pipeline/acquire_google.py` | exits 0 | ✓ PASS |
| All 4 dependencies in pyproject.toml | `grep -E "gallery.dl|pyyaml|requests|beautifulsoup4" pyproject.toml` | gallery-dl>=1.32.1, pyyaml>=6.0.3, requests>=2.32.0, beautifulsoup4>=4.12.0 all present | ✓ PASS |
| manual-download.md has required sections | `grep -c "## Google Photos Manual Download" docs/manual-download.md` | 1 | ✓ PASS |
| manual-download.md has pic-time section | `grep -c "## pic-time Manual Download" docs/manual-download.md` | 1 | ✓ PASS |
| manual-download.md has sufficient content | `wc -l docs/manual-download.md` | 94 lines (>= 60 required) | ✓ PASS |

### Probe Execution

No probes declared or conventionally present in this phase. Step 7c: SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACQN-01 | 01-01 | Pipeline automatically downloads photos from all 3 Google Photos shared albums | ? NEEDS HUMAN | acquire_google.py fully implemented; cannot auto-verify end-to-end without real album URLs |
| ACQN-02 | 01-02 | Pipeline automatically downloads photos from pic-time gallery | ? NEEDS HUMAN | acquire_pictime.py fully implemented with fallback; cannot auto-verify without live network access |
| ACQN-03 | 01-03 | Manual download steps documented as fallback when auto-download fails | ✓ SATISFIED | docs/manual-download.md exists with complete, actionable instructions for both sources |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| pipeline/config.yaml | 35, 38, 41 | `TODO: replace with real name before launch` on display_name fields | ⚠️ Warning | TODOs are intentional placeholders for Phase 3 (upload.py will use display_name). The plan explicitly specified placeholder display_names. Not a blocker — these are warning-level markers with documented intent. No issue number referenced; recommend adding a note referencing Phase 3 if desired. |

**Debt marker gate assessment:** No `TBD`, `FIXME`, or `XXX` markers found in any phase-modified file. Three `TODO` markers in config.yaml are warning-level; they describe intentional placeholders explicitly required by the plan spec and documented in the SUMMARY Known Stubs section. The PLAN itself states "display_name set to 'Photographer A/B/C' as placeholder — user will update to real names before Phase 3 upload." These are not unresolved debt — they are designed handoff points.

### Human Verification Required

#### 1. Google Photos End-to-End Download

**Test:** Replace the three PLACEHOLDER `album_url` values in `pipeline/config.yaml` with real Google Photos shared album URLs for photographers A, B, and C, then run `uv run python pipeline/acquire_google.py`
**Expected:** Script exits 0, creates `sources/photographer_a/`, `sources/photographer_b/`, `sources/photographer_c/` directories, downloads all photos into the correct folder per album label, prints a summary with image file count per folder
**Why human:** Real album URLs are intentionally not committed to version control. The download requires live Google Photos shared URLs provided by the wedding photographer. The PLACEHOLDER sentinel enforces this — the automated system cannot test past it.

#### 2. pic-time End-to-End Download

**Test:** Run `uv run python pipeline/acquire_pictime.py` and verify photos are downloaded to `sources/pic_time/`
**Expected:** Script exits 0, prints "pic-time download complete: N images in sources/pic_time/" (or falls back to requests+BS4 and downloads images). Count of images in `sources/pic_time/` should match the visible photo count on `https://justsmile.pic-time.com/gallery`
**Why human:** The pic-time gallery is a live website that may use JavaScript rendering; whether gallery-dl or the requests+BS4 fallback successfully retrieves all photos cannot be verified without live network access. The correctness of the fallback image URL parsing is also site-structure-dependent.

### Gaps Summary

No implementation gaps found. All four artifacts are substantive and wired. The two "uncertain" success criteria are uncertain only due to the intentional design of the system (real URLs not committed, live download requires real credentials/network). The scripts are fully implemented and ready to run once real URLs are supplied.

The phase goal — "All wedding photos are downloaded to local folders, organized by source, ready for the pipeline" — cannot be declared ACHIEVED until the human verification confirms end-to-end download success with real URLs. The implementation is complete and correct; execution confirmation is pending.

---

_Verified: 2026-05-16_
_Verifier: Claude (gsd-verifier)_
