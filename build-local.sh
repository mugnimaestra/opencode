#!/usr/bin/env bash
# Build opencode binary locally and install to ~/personal/opencode-binary
set -euo pipefail

# Constants
ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG="$ROOT/packages/opencode"
DEST="$HOME/personal/opencode-binary"

# Detect platform
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
[[ "$ARCH" == "x86_64" ]] && ARCH="x64"
PLATFORM="${OS}-${ARCH}"

# Helpers
info()    { printf '\033[1;34m→ %s\033[0m\n' "$*"; }
success() { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
error()   { printf '\033[1;31m✗ %s\033[0m\n' "$*"; }

# ── Fetch latest upstream ────────────────────────────────────────────
info "Fetching origin..."
git -C "$ROOT" fetch origin
success "Fetch complete"

# ── Rebase onto origin/dev ───────────────────────────────────────────
info "Rebasing onto origin/dev..."
stashed=false
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  info "Stashing uncommitted changes..."
  git -C "$ROOT" stash --include-untracked
  stashed=true
fi

# Abort any stale rebase state from a previous interrupted run
if [[ -d "$ROOT/.git/rebase-merge" || -d "$ROOT/.git/rebase-apply" ]]; then
  info "Aborting stale rebase state..."
  git -C "$ROOT" rebase --abort 2>/dev/null || true
fi

if ! git -C "$ROOT" rebase origin/dev; then
  conflicts="$(git -C "$ROOT" diff --name-only --diff-filter=U)"
  error "Rebase conflicts detected in:"
  echo "$conflicts" | while read -r f; do printf '    %s\n' "$f"; done
  echo ""
  info "Asking AI to analyze conflicts..."
  opencode run "There are rebase conflicts when rebasing my-own-opencode onto origin/dev in these files: $conflicts. Analyze the conflicts and suggest how to resolve them." --model minimax/minimax-m2.7-highspeed
  echo ""
  info "Aborting rebase..."
  git -C "$ROOT" rebase --abort
  if [[ "$stashed" == true ]]; then
    info "Restoring stashed changes..."
    git -C "$ROOT" stash pop
  fi
  error "Build cancelled — resolve conflicts and re-run"
  exit 1
else
  success "Rebase complete"
fi

if [[ "$stashed" == true ]]; then
  info "Restoring stashed changes..."
  git -C "$ROOT" stash pop
fi

# ── Sync dependencies after rebase ───────────────────────────────────
info "Syncing dependencies..."
(cd "$ROOT" && bun install)
success "Dependencies synced"

# ── Set release channel ──────────────────────────────────────────────
# Force "latest" channel so the binary uses the standard opencode.db
# instead of a branch-specific opencode-my-own-opencode.db
export OPENCODE_CHANNEL=latest

# ── Build ────────────────────────────────────────────────────────────
info "Building opencode (platform: $PLATFORM)..."
(cd "$PKG" && bun ./script/build.ts --single) || {
  error "Build failed"
  echo ""
  info "Common post-rebase build fix: if you see 'Duplicate declaration' errors,"
  info "it likely means upstream extracted code into new modules and the rebase"
  info "kept the old inline copy. Remove the duplicate old code and re-run."
  exit 1
}
success "Build complete"

# ── Install ──────────────────────────────────────────────────────────
info "Installing to $DEST..."
mkdir -p "$DEST"
cp "$PKG/dist/opencode-$PLATFORM/bin/opencode" "$DEST/opencode" || {
  error "Copy failed — check that dist/opencode-$PLATFORM exists"
  exit 1
}
chmod +x "$DEST/opencode"
success "Installed"

# ── Resign (macOS only) ─────────────────────────────────────────────
if [[ "$OS" == "darwin" ]]; then
  info "Re-signing binary for macOS..."
  codesign --force --sign - "$DEST/opencode"
  success "Signed"
fi

# ── Verify ───────────────────────────────────────────────────────────
info "Verifying..."
version="$("$DEST/opencode" --version)"
success "Version: $version"

# ── Summary ──────────────────────────────────────────────────────────
printf '\n\033[1;32m══ Build successful ══\033[0m\n'
printf '  Binary:  %s\n' "$DEST/opencode"
printf '  Version: %s\n' "$version"
