#!/usr/bin/env bash
set -euo pipefail
cd /workspace/stable
export DOCKER_CONFIG=/workspace/.docker-config
build_options=()
if getent ahostsv4 proxy >/dev/null; then
  proxy_ip=$(getent ahostsv4 proxy | awk 'NR==1 {print $1}')
  build_options+=(--add-host "proxy:$proxy_ip" --secret id=cloud_ca,src=/etc/ssl/certs/ca-certificates.crt --build-arg http_proxy --build-arg https_proxy --build-arg no_proxy)
fi
docker build "${build_options[@]}" -t stable-api -f Dockerfile.php .
cd frontend
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
cd ../backend
# Cloud tasks retain the installed vendor directory. On clean hosts install
# with Composer using the trusted CA bundle and standard package access.
if [ ! -f vendor/autoload.php ]; then
 docker run --rm --user "$(id -u):$(id -g)" -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY -e COMPOSER_CAFILE=/trust/ca.pem -v /etc/ssl/certs/ca-certificates.crt:/trust/ca.pem:ro -v /workspace/stable:/app -w /app/backend stable-api composer install --no-dev --no-interaction
fi
if [ ! -f .env ]; then
 cp .env.example .env
 sed -i 's/CI_ENVIRONMENT = production/CI_ENVIRONMENT = development/' .env
fi
cd ..
docker compose run --rm --user "$(id -u):$(id -g)" api php spark migrate
docker compose run --rm --user "$(id -u):$(id -g)" api php spark db:seed CompanySeeder
docker compose run --rm --user "$(id -u):$(id -g)" api php spark db:seed DesignSeeder
docker compose run --rm --user "$(id -u):$(id -g)" api php spark db:seed TaxonomySeeder
