#!/usr/bin/env bash
set -euo pipefail
revision=${1:?Expected committed revision}
[[ $revision =~ ^[0-9a-f]{40}$ ]] || exit 1
source "${STABLE_DEPLOY_CONFIG:-$HOME/.config/stable/deploy.env}"
: "${APP_REPO_PATH:?}" "${DEPLOY_STATE_PATH:?}" "${PHP_BIN:?}" "${NODE_BIN_DIR:?}"
: "${NGINX_BIN:?}" "${FRONTEND_SERVICE:?}" "${PHP_SERVICE:?}" "${HEALTH_ORIGIN:?}" "${PUBLIC_URL:?}"
repo=$APP_REPO_PATH
state=$DEPLOY_STATE_PATH
php=$PHP_BIN
export PATH="$NODE_BIN_DIR:/usr/bin:/bin"
mkdir -p "$state/releases" "$state/backups"
exec 9>"$state/deploy.lock"
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
cd "$repo"
git config --global --add safe.directory "$repo"
[[ -z $(git status --porcelain --untracked-files=no) ]] || { echo 'Server has tracked changes. Back up and reconcile before deployment.' >&2; exit 1; }
git fetch origin main
[[ $(git rev-parse origin/main) == "$revision" ]] || { echo 'Requested revision is not current main.' >&2; exit 1; }
"$NGINX_BIN" -t
backup="$state/backups/$(date -u +%Y%m%dT%H%M%SZ)-$revision"
mkdir -m 700 "$backup"
cp backend/.env "$backup/backend.env"
cp frontend/.env.production "$backup/frontend.env"
(cd backend && "$php" spark stable:backup)
git rev-parse HEAD > "$backup/previous-revision"
git merge --ff-only "$revision"
(cd backend && "$php" /usr/bin/composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction && "$php" spark migrate --all)
chown -R www:www backend/writable
release="$state/releases/$revision-$(date -u +%Y%m%dT%H%M%SZ)"
[[ ! -e $release ]] || { echo 'Release already exists. Inspect it before retrying.' >&2; exit 1; }
mkdir -p "$release"
git archive "$revision" frontend | tar -x -C "$release"
cp frontend/.env.production "$release/frontend/.env.production"
(cd "$release/frontend" && npm ci --no-audit --no-fund && npm run build)
chown -R www:www "$release"
previous=$(readlink -f "$state/current" || true)
ln -s "$release" "$state/current.next"
mv -Tf "$state/current.next" "$state/current"
# Only Stable services are restarted. Other websites and their shared PHP stay untouched.
systemctl restart "$PHP_SERVICE" "$FRONTEND_SERVICE"
if ! curl --fail --silent --show-error --retry 10 --retry-connrefused --retry-delay 2 --max-time 20 "$HEALTH_ORIGIN" > /dev/null ||
   ! curl --fail --silent --show-error --max-time 20 "$HEALTH_ORIGIN/api/v1/settings" > /dev/null; then
  if [[ -n $previous ]]; then
    ln -s "$previous" "$state/current.rollback"
    mv -Tf "$state/current.rollback" "$state/current"
    systemctl restart "$FRONTEND_SERVICE"
  fi
  echo "Health check failed. Previous frontend restored; inspect database backup in $backup before any schema rollback." >&2
  exit 1
fi
printf '%s\n' "$revision" > "$state/deployed-revision"
printf 'Deployed %s to %s\n' "$revision" "$PUBLIC_URL"
