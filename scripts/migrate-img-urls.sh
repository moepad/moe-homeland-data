#!/usr/bin/env bash
# Migrate img.moegirl.org.cn URLs to storage.moegirl.org.cn
# Based on the nginx redirect rules for the deprecated img.moegirl domain.

set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/../data" && pwd)"

echo "Target directory: $DATA_DIR"
echo ""

# Dry-run by default; pass --apply to actually modify files.
DRY_RUN=true
if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=false
fi

# Build sed expressions matching the nginx location rules (order matters):

SED_ARGS=(
  # 1) Avatars: /common/avatars/{path}/(original|128|256).png
  -e 's|https://img\.moegirl\.org\.cn/common/avatars/\([^"]*\)/\(original\|128\|256\)\.png|https://storage.moegirl.org.cn/moegirl/avatars/\1/latest.png|g'

  # 1b) Avatars: /common/avatars/{rest}
  -e 's|https://img\.moegirl\.org\.cn/common/avatars/|https://storage.moegirl.org.cn/moegirl/avatars/|g'

  # 2) Thumbnails for four sites:
  #    /{site}/thumb/(archive/)?{a}/{ab}/{name}/{size}px-xxx
  #    => storage.../moegirl/{mapped}/{archive/}{a}/{ab}/{name}!/fw/{size}

  # common -> commons
  -e 's|https://img\.moegirl\.org\.cn/common/thumb/\(archive/\)\{0,1\}\([0-9a-f]\)/\([0-9a-f][0-9a-f]\)/\([^/]*\)/\([0-9]*\)px-[^"]*|https://storage.moegirl.org.cn/moegirl/commons/\1\2/\3/\4!/fw/\5|g'

  # enmoegirl -> en
  -e 's|https://img\.moegirl\.org\.cn/enmoegirl/thumb/\(archive/\)\{0,1\}\([0-9a-f]\)/\([0-9a-f][0-9a-f]\)/\([^/]*\)/\([0-9]*\)px-[^"]*|https://storage.moegirl.org.cn/moegirl/en/\1\2/\3/\4!/fw/\5|g'

  # jamoegirl -> ja
  -e 's|https://img\.moegirl\.org\.cn/jamoegirl/thumb/\(archive/\)\{0,1\}\([0-9a-f]\)/\([0-9a-f][0-9a-f]\)/\([^/]*\)/\([0-9]*\)px-[^"]*|https://storage.moegirl.org.cn/moegirl/ja/\1\2/\3/\4!/fw/\5|g'

  # librarymoegirl -> library
  -e 's|https://img\.moegirl\.org\.cn/librarymoegirl/thumb/\(archive/\)\{0,1\}\([0-9a-f]\)/\([0-9a-f][0-9a-f]\)/\([^/]*\)/\([0-9]*\)px-[^"]*|https://storage.moegirl.org.cn/moegirl/library/\1\2/\3/\4!/fw/\5|g'

  # 3) Non-thumbnail paths for four sites
  -e 's|https://img\.moegirl\.org\.cn/common/|https://storage.moegirl.org.cn/moegirl/commons/|g'
  -e 's|https://img\.moegirl\.org\.cn/enmoegirl/|https://storage.moegirl.org.cn/moegirl/en/|g'
  -e 's|https://img\.moegirl\.org\.cn/jamoegirl/|https://storage.moegirl.org.cn/moegirl/ja/|g'
  -e 's|https://img\.moegirl\.org\.cn/librarymoegirl/|https://storage.moegirl.org.cn/moegirl/library/|g'

  # 4) Fallback: any remaining img.moegirl.org.cn paths
  -e 's|https://img\.moegirl\.org\.cn/|https://storage.moegirl.org.cn/moegirl/|g'
)

FILES=("$DATA_DIR"/*.json)

if $DRY_RUN; then
  echo "[dry-run] Preview of changes (use --apply to modify files):"
  echo ""
  for f in "${FILES[@]}"; do
    diff <(cat "$f") <(sed "${SED_ARGS[@]}" "$f") && true
    # diff exits 1 when there are differences; that's expected
  done | head -200
  echo ""
  REMAINING=$(sed "${SED_ARGS[@]}" "${FILES[@]}" | grep -c 'img\.moegirl\.org\.cn' || true)
  echo "Remaining img.moegirl.org.cn references after replace: $REMAINING"
else
  sed -i '' "${SED_ARGS[@]}" "${FILES[@]}"
  REMAINING=$(grep -c 'img\.moegirl\.org\.cn' "${FILES[@]}" || true)
  echo "Done. Remaining img.moegirl.org.cn references: $REMAINING"
fi
