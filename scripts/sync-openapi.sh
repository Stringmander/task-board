#!/usr/bin/env bash
# Sync openapi.yaml from task-api into this repo, prepending a provenance header.
# Run by .github/workflows/sync-openapi.yml; also safe to run locally from the repo root.
# Compares spec bodies only (header excluded), so an unchanged upstream is a no-op.
# Outputs (to $GITHUB_OUTPUT when in Actions): changed=true|false, date, sha.
set -euo pipefail

REPO="Stringmander/task-api"
BRANCH="main"
TARGET="openapi.yaml"
SENTINEL="# --- end provenance header ---"

set_output() { echo "$1=$2" >> "${GITHUB_OUTPUT:-/dev/null}"; }

sha=$(git ls-remote "https://github.com/${REPO}.git" "refs/heads/${BRANCH}" | cut -f1)
if [[ -z "$sha" ]]; then
  echo "Could not resolve ${REPO}@${BRANCH}" >&2
  exit 1
fi

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT
upstream="$tmp_dir/upstream.yaml"
current="$tmp_dir/current.yaml"

# Fetch by SHA, not branch, so the header's commit reference matches the content exactly.
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${sha}/openapi.yaml" -o "$upstream"

# Strip everything through the sentinel line so only the spec body is compared.
if [[ -f "$TARGET" ]]; then
  if grep -qxF "$SENTINEL" "$TARGET"; then
    awk -v s="$SENTINEL" 'found { print } $0 == s { found = 1 }' "$TARGET" > "$current"
  else
    cp "$TARGET" "$current"
  fi
else
  : > "$current"
fi

today=$(date -u +%F)
set_output date "$today"
set_output sha "$sha"

if cmp -s "$upstream" "$current"; then
  echo "No changes: ${TARGET} matches ${REPO}@${sha:0:7}."
  set_output changed false
  exit 0
fi

{
  echo "# ---------------------------------------------------------------------------"
  echo "# VENDORED FILE - DO NOT EDIT BY HAND"
  echo "# Source:    https://github.com/${REPO}/blob/${sha}/openapi.yaml"
  echo "# Synced by: .github/workflows/sync-openapi.yml (weekly, Mon 06:00 UTC)"
  echo "# Last sync: ${today} (${REPO}@${sha:0:7})"
  echo "# Local edits are overwritten on the next sync; change the spec in task-api."
  echo "# ---------------------------------------------------------------------------"
  echo "$SENTINEL"
  cat "$upstream"
} > "$TARGET"

echo "Updated ${TARGET} from ${REPO}@${sha:0:7}."
set_output changed true
