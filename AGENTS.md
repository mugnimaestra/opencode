- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- The default branch in this repo is `dev`.
- Local `main` ref may not exist; use `dev` or `origin/dev` for diffs.

## Commits and PR Titles

Use conventional commit-style messages and PR titles: `type(scope): summary`.

Valid types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`. Scopes are optional; use the affected package or area when helpful, e.g. `core`, `opencode`, `tui`, `app`, `desktop`, `sdk`, or `plugin`.

Examples: `fix(tui): simplify thinking toggle styling`, `docs: update contributing guide`, `chore(sdk): regenerate types`.

## Building Local Binary

Use the `build-local.sh` script at the repo root:

```bash
./build-local.sh
```

This automates: fetch → rebase onto `origin/dev` → install deps → build → copy → codesign → verify.

### Versioning

The script sets `OPENCODE_CHANNEL=latest` so the binary uses the **standard opencode.db** and a proper semver version (e.g., `1.4.3`) instead of a branch-specific prerelease like `0.0.0-my-own-opencode-20260410XXXXXX`.

Without `OPENCODE_CHANNEL=latest`, the build defaults to the git branch name as the channel, which produces:

- A prerelease version string (`0.0.0-{branch}-{timestamp}`)
- A separate database file (`opencode-{branch}.db` instead of `opencode.db`)

Always use `build-local.sh` or set `OPENCODE_CHANNEL=latest` when building locally.

### Manual Build (if script unavailable)

1. **Rebase onto latest origin/dev**:

   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. **Sync dependencies** (required after rebase):

   ```bash
   bun install
   ```

3. **Build the binary** (from packages/opencode directory):

   ```bash
   cd packages/opencode && OPENCODE_CHANNEL=latest bun ./script/build.ts --single
   ```

4. **Copy to local binary directory**:

   ```bash
   cp packages/opencode/dist/opencode-darwin-arm64/bin/opencode ~/personal/opencode-binary/opencode
   chmod +x ~/personal/opencode-binary/opencode
   ```

5. **Resign for macOS** (required after copy):

   ```bash
   codesign --force --sign - ~/personal/opencode-binary/opencode
   ```

6. **Verify**:
   ```bash
   ~/personal/opencode-binary/opencode --version
   ```

The built binary will be at `packages/opencode/dist/opencode-{os}-{arch}/bin/opencode`.

### Rebase Conflict Resolution

After rebasing onto `origin/dev`, you may encounter conflicts where upstream extracted code into new modules. If the rebase keeps the old inline copy alongside the new import, remove the duplicate old code. Common symptoms include "Duplicate declaration" TypeScript errors during build.

If rebase is interrupted (stale `.git/rebase-merge` or `.git/rebase-apply`), run `git rebase --abort` first before retrying.

For ripgrep/archive zip conflicts, keep upstream `src/file/ripgrep.ts` Effect Schema and `@opencode-ai/core/*` imports, then port only the `.zip` extraction branch via `Archive.extractZip(...)` wrapped in `Effect.tryPromise`. Keep `src/util/archive.ts` as a flat module with `export * as Archive from "./archive"`.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Do not extract single-use helpers preemptively. Inline the logic at the call site unless the helper is reused, hides a genuinely complex boundary, or has a clear independent name that improves the caller.
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream
- In `src/config`, follow the existing self-export pattern at the top of the file (for example `export * as ConfigAgent from "./agent"`) when adding a new config module.

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Imports

- Never alias imports. Do not use `import { foo as bar } from "..."` or renamed imports like `resolve as pathResolve`.
- Never use star imports. Do not use `import * as Foo from "..."` or `import type * as Foo from "..."`.
- If a namespace-style value is needed, import the module's own exported namespace by name, for example `import { Project } from "@opencode-ai/core/project"`, then reference `Project.ID`.
- Prefer dynamic imports for heavy modules that are only needed in selected code paths, especially in startup-sensitive entrypoints. Destructure dynamic import bindings near the top of the narrowest scope that needs them so they read like normal imports. Avoid inline chains such as `await import("./module").then((mod) => mod.value())` or `(await import("./module")).value()`. Keep branch-specific imports inside the branch that needs them to preserve lazy loading.

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Complex Logic

When a function has several validation branches or supporting details, make the main function read as the happy path and move supporting details into small helpers below it.

```ts
// Good
export function loadThing(input: unknown) {
  const config = requireConfig(input)
  const metadata = readMetadata(input)
  return createThing({ config, metadata })
}

function requireConfig(input: unknown) {
  ...
}
```

- Keep helpers close to the code they support, below the main export when that improves readability.
- Do not over-abstract simple expressions into many single-use helpers; extract only when it names a real concept like `requireConfig` or `readMetadata`.
- Do not return `Effect` from helpers unless they actually perform effectful work. Synchronous parsing, validation, and option building should stay synchronous.
- Prefer Effect schema helpers such as `Schema.UnknownFromJsonString` and `Schema.decodeUnknownOption` over manual `JSON.parse` wrapped in `Effect.try` when parsing untrusted JSON strings.
- Add comments for non-obvious constraints and surprising behavior, not for obvious assignments or control flow.

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root (guard: `do-not-run-tests-from-root`); run from package dirs like `packages/opencode`.

## Type Checking

- Always run `bun typecheck` from package directories (e.g., `packages/opencode`), never `tsc` directly.

## V2 Session Core

- Keep durable prompt admission separate from model execution. `SessionV2.prompt(...)` admits one durable `session_input` row before scheduling advisory `SessionExecution.wake(sessionID)` unless `resume: false` requests admit-only behavior. The serialized runner promotes admitted inputs into visible user messages at safe boundaries.
- Reusing a Session ID adopts the existing Session. Reusing a prompt message ID reconciles an exact retry only when Session, prompt, and delivery mode match; conflicting reuse fails. Historical projected prompts lazily synthesize promoted inbox records during exact retry.
- Keep `SessionExecution` process-global and Session-ID based. Its local implementation owns the process-local Session coordinator and discovers placement through `SessionStore` plus `LocationServiceMap.get(session.location)` only when a drain starts; no layer should take a Session ID. V2 interruption targets the active process-local ownership chain for that Session; idle or missing interruption is a no-op.
- Keep `SessionRunner`, model resolution, tool registry, permissions, and filesystem Location-scoped. Omitted `Location.workspaceID` means implicit-local placement; explicit workspace identity remains reserved for future placement semantics.
- Preserve one explicit `llm.stream(request)` call per provider turn and reload projected history before durable continuation. Do not bridge through legacy `SessionPrompt.loop(...)` or delegate orchestration to an in-memory tool loop.
- Keep local Session drains process-local until clustering is implemented. `SessionRunCoordinator` joins explicit same-Session resumes, coalesces prompt wakeups, and allows different Sessions to run concurrently. Advisory wakes drain eligible durable inbox rows only; post-crash activity recovery requires a separate explicit design before it may retry provider work.
- Keep delivery vocabulary explicit. Prompts steer by default and coalesce into the active activity at the next safe provider-turn boundary. Explicit `queue` inputs open FIFO future activities one at a time after the active activity settles.
- Keep EventV2 replay owner claims separate from clustered Session execution ownership.
- Keep the System Context algebra, registry, and built-ins in `src/system-context`; keep Context Source producers with their observed domains, and keep Session History selection plus Context Epoch persistence Session-owned.

## Custom Agent / Subagent Permissions (RECURRING REGRESSION)

This is a recurring regression that breaks on rebases. Re-verify the invariant below every time you rebase onto `origin/dev`.

### Symptom

Custom subagents defined in `~/.config/opencode/agents/*.md` (e.g. `explore-opus-4.7`) lose access to tools they explicitly allow in their frontmatter `permission:` block (`read`/`grep`/`glob`/`edit`/`bash`) when spawned via the `task` tool by a parent agent — especially orchestrators like `beast-orchestrator-*` that `deny` those tools.

### Mechanism

- Permission gating is **permission-only** (there is no per-agent tools list) and is **LAST-MATCH-WINS** via `findLast` in `packages/core/src/permission.ts`.
- A subagent's runtime ruleset is `Permission.merge(subagent.permission, derivedSessionPermission)`.
- Denies forwarded from the parent into the derived session permission land **last** and therefore override the subagent's own `allow` rules.

### Canonical Fix Location

`deriveSubagentSessionPermission` in `packages/opencode/src/agent/subagent-permissions.ts` (find by function name, not line number).

### INVARIANT (re-verify after every rebase)

A parent agent's `edit`/tool `deny` must **NOT** be forwarded into a subagent session for any permission the subagent explicitly `allow`s. Subagent self-declared allows win over inherited parent ceilings — **EXCEPT** where Plan Mode requires the ceiling: built-in `explore`/`general` do **not** declare `edit: allow`, so they still inherit the parent `edit` deny (Plan Mode read-only stays enforced).

### Upstream Issue Chain

`#26514 → #27201 → #27654` — watch these so future rebases can recognize related upstream churn around this code.

### Verification

- From `packages/opencode` run `bun test test/agent/` (specifically subagent permission tests like `plan-mode-subagent-bypass.test.ts`) plus `bun typecheck`.
- Tests CANNOT run from repo root (guard `do-not-run-tests-from-root`).
- Manual repro: define a custom agent with `edit: allow`, have an orchestrator agent (which has `edit: deny`) spawn it via the `task` tool, and confirm `edit`/`write` are available in the spawned subagent.

## Troubleshooting

### "Unknown component type: spinner" Error

If you see `[Reconciler] Unknown component type: spinner` when starting a chat, the Bun bundler is including stale cached versions of `@opentui` packages from `node_modules/.bun/`. The `opentui-spinner` side-effect import (`import "opentui-spinner/solid"`) registers the spinner on one copy of the component catalogue, but `createElement` runs against a different (stale) copy.

**Fix**: Remove stale cached versions and rebuild:

```bash
find node_modules/.bun -maxdepth 1 -name '@opentui+*' -not -name '*0.1.86*' -exec rm -rf {} +
find node_modules/.bun -maxdepth 1 -name 'opentui-spinner*' -not -name '*0.0.6*' -exec rm -rf {} +
cd packages/opencode && bun install && bun ./script/build.ts --single
```

Update the version numbers above to match whatever is current in `packages/opencode/package.json`.
