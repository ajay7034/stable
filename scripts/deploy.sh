#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
[[ $(git branch --show-current) == main ]] || { echo 'Deploy from main.' >&2; exit 1; }
[[ -z $(git status --porcelain) ]] || { echo 'Commit all changes before deploying.' >&2; exit 1; }
source .deploy.env
: "${DEPLOY_SSH_TARGET:?Set DEPLOY_SSH_TARGET in private .deploy.env}"
revision=$(git rev-parse HEAD)
# Push must succeed before any server changes occur.
git push origin main
[[ $(git ls-remote origin refs/heads/main | cut -f1) == "$revision" ]] || { echo 'Remote main changed; update and retry.' >&2; exit 1; }
ssh -o BatchMode=yes -p "${DEPLOY_SSH_PORT:-22}" "$DEPLOY_SSH_TARGET" bash -s -- "$revision" < scripts/deploy-server.sh
