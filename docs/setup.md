# Local setup
Use the existing checkout; cloud tasks are already isolated and do not need a worktree.

Prerequisites: Node 24/npm, PHP 8.4 with intl/mbstring/sqlite3/GD(WebP)/zip/fileinfo/DOM/XML, Composer 2. Alternatively build Dockerfile.php and use the api service in compose.yaml.

```sh
cd backend
composer install
cp .env.example .env
# Set CI_ENVIRONMENT=development, app.baseURL and database.default.database
# to the absolute private writable/stable.sqlite path for this machine.
php spark migrate
php spark db:seed CompanySeeder
php spark db:seed DesignSeeder
php spark db:seed TaxonomySeeder
php spark stable:admin
php spark serve --host 127.0.0.1 --port 8080
```

In another terminal:
```sh
cd frontend
npm ci
npm run dev
```

API_ORIGIN defaults to http://127.0.0.1:8080. No raw SQLite access exists in Next.js. Validate with `npm run build`, `npm run typecheck`, and `npx playwright test` while both servers run. Tests use system Chromium at /usr/bin/chromium; change launchOptions to your local installed browser path where needed.

For this cloud environment the Docker runtime image is named stable-api. Use `docker compose run --rm api php spark migrate` and `docker compose up -d api` after building. The compose volume maps the repository to /app. Only seed a fresh database; the company seeder preserves existing content.

If the environment uses a TLS inspection proxy, provide its trusted CA via the cloud_ca Docker build secret. Keep TLS and package signature verification enabled. Standard non-proxy installations can omit this optional secret. Never commit credentials or certificates to this repository.

After code updates run migrations before starting the app. The extended local
integration suite is `RUN_BROWSER_TESTS=1 python backend/tests/smoke.py` with both
servers running. It creates temporary accounts and test records, then cleans them
up. Run only against a disposable development database. Configure optional SMTP
using backend/.env.example; never store real credentials in Git.

Use `scripts/install-cloud.sh` for the configured cloud setup. It installs locked dependencies, applies migrations and runs additive seeders. `DesignSeeder` publishes the initial home design and original articles; `TaxonomySeeder` adds private candidate categories. Existing content is preserved on repeated runs.

For a production-mode local check, stop the development server, run `npm run build`, then `npm run start -- --port 3000`. Do not run `next dev` against `.next` while building.

The cloud environment configuration is saved as a draft. Review and save it in Environment settings, then publish the environment to activate the setup/start instructions and retained filesystem snapshot. Saving the draft alone does not publish it or deploy the website.
