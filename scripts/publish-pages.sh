#!/usr/bin/env bash
set -euo pipefail
repo_root=$(git rev-parse --show-toplevel)
output_dir="$repo_root/frontend/pages-out"
test -f "$output_dir/index.html"
test -f "$output_dir/.nojekyll"
if find "$output_dir" -type f \( -name '.env' -o -name '*.sqlite' -o -name 'LOCAL_ADMIN_ACCESS.txt' \) | read -r unwanted; then
  echo 'Refusing to publish private runtime files.' >&2
  exit 1
fi
# Build an independent index without changing the application checkout or staging area.
task_index=$(mktemp)
rm -f "$task_index"
trap 'rm -f "$task_index"' EXIT
export GIT_INDEX_FILE="$task_index"
git read-tree --empty
git --work-tree="$output_dir" add --all
pages_tree=$(git write-tree)
parent_args=()
if git ls-remote --exit-code --heads origin gh-pages > /dev/null; then
  git fetch origin gh-pages
  parent_args=(-p "$(git rev-parse FETCH_HEAD)")
fi
pages_commit=$(git commit-tree "$pages_tree" "${parent_args[@]}" -m 'Publish Stable public website')
git push origin "$pages_commit:refs/heads/gh-pages"
