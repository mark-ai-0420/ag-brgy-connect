# Handoff Artifacts Directory

This directory contains structured handoff artifacts for each feature pipeline cycle.

## Directory Convention

```
handoffs/
├── YYYY-MM-DD_feature-slug/
│   ├── 01_product_brief.md        # Product Strategist output
│   ├── 02_design_spec.md          # UI/UX output
│   ├── 03_implementation_plan.md  # Engineering plan (user-approved)
│   ├── 04_walkthrough.md          # Engineering completion proof + screenshots
│   ├── 05_dba_audit.md            # DBA audit report (if schema-touching)
│   ├── 06_release_post.md         # Poster draft
│   └── screenshots/               # Visual verification artifacts
```

## Rules

1. **Each feature pipeline creates a new dated directory** with a descriptive slug.
2. **Artifacts are numbered by pipeline stage** so agents know where to find upstream work and where to write their output.
3. **Screenshots go in the `screenshots/` subdirectory** for each feature.
4. **Previous handoff directories are read-only** — never modify a completed cycle's artifacts.
