# Development Guidelines

## ⚠️ CRITICAL RULES - READ FIRST

### Type Checking Workflow

**NEVER run `npm run build` for type checking. This will crash the dev server.**

✅ **ALWAYS use for type checking:**

```bash
npm run typecheck    # or: npx tsc --noEmit
```

❌ **NEVER use for type checking:**

```bash
npm run build        # This deletes .next/ and crashes dev server
```

**When to use `npm run build`:**

- ONLY before deployment
- ONLY when you need a production build
- NEVER during active development
- NEVER when `npm run dev` is running

**Rationale:**

- `npm run build` modifies/deletes the `.next` folder
- This crashes any running `npm run dev` server, requiring restart
- `npx tsc --noEmit` is 5-10x faster (5-10s vs 30+s)
- Type checking doesn't need a full build

---

## Primary Documentation

This project uses **AGENTS.md** as the primary developer documentation. Before starting any task:

1. Read AGENTS.md for:
   - Project structure and architecture
   - Code standards and conventions
   - Feature-specific implementation guides
   - Development workflow and testing requirements

2. Consult the `docs/` directory for detailed feature documentation

All development guidelines, patterns, and best practices are documented in AGENTS.md.
