---
trigger: always_on
---

# Auto-Approve Rules

1. For code edits to existing files, proceed without requesting review unless the change affects:
   - Database schema
   - Authentication/authorization logic
   - Payment/billing code
   - Deployment configuration
2. For new files, proceed without requesting review unless creating:
   - Configuration files (.env, wrangler.toml, etc.)
   - Database migrations
3. Skip implementation plan approval for:
   - Bug fixes
   - Simple feature additions (< 5 files changed)
   - Refactoring requests
