# Validation record

Validated locally on 2026-10-24 against a production Next.js build and PHP 8.4/CodeIgniter 4 API:

- Production build and TypeScript compilation passed; PHP application syntax checks passed.
- Nine migrations and all three initial seeders run successfully on an isolated clean SQLite database. Verified eight public categories, four initial public pages, three original journal posts, private candidate taxonomy and zero invented product records.
- API integration checks pass authentication/session/CSRF and role enforcement, CRUD, immutable draft/live isolation, slug redirects, pagination, scheduled publication, revision restoration, invalid rich-text rejection, galleries/specifications/FAQs, private/public datasheets, image format/privacy/history deletion guards, CSV import/duplicates, applications and private BOQs.
- Authenticated browser workflow passes sign-in, image upload/deletion, draft product creation and sign-out. Temporary staff accounts/fixtures are removed afterward.
- All 21 browser tests passed (20 public/accessibility/layout checks and one authenticated staff workflow). Inner pages were checked at 390 and 1440 pixels with no browser exceptions.
- Public browser checks cover six home widths (360, 390, 768, 1024, 1440, 1920), no horizontal overflow, published category isolation, input/CSRF rejection and a real persisted contact submission.
- Axe checks found no WCAG A/AA rule violations on Home, Products, About, Contact, Request quote, Journal, Careers and the admin sign-in screen. Mobile navigation and search dialogs pass Escape/focus interaction checks. Automated checks supplement, rather than replace, human accessibility review.
- Screenshots were visually reviewed on desktop and mobile. Contrast, image loading and small-screen layout issues were corrected.
- Isolated SQLite restore passed integrity checks, critical row-count comparisons and published-content recovery. This does not replace a deployed off-host database-and-files rehearsal.
- SMTP-unconfigured mode is supported; no real email delivery has been attempted. Validate production SMTP and optional applicant acknowledgements on the deployed host.

## Reproduction
Start the API and production frontend, then run:

```sh
cd frontend
npm run typecheck
npx playwright test tests/site.spec.ts tests/accessibility.spec.ts
cd ..
RUN_BROWSER_TESTS=1 python3 backend/tests/smoke.py
docker compose exec -T api php tests/restore.php
```

Use a disposable development database for submission tests. Fresh-install validation uses `php tests/isolated-cli.php migrate`, then `db:seed CompanySeeder`, `db:seed DesignSeeder`, `db:seed TaxonomySeeder`, followed by `php tests/clean-install.php`, all inside the API container. The wrapper pins the database to `/tmp/stable-clean-validation.sqlite`.

Local Lighthouse measurements are recorded separately in `performance.json`; they use mobile simulated throttling and system Chromium. Results vary by host load and deployment configuration. Real-world performance and HTTPS operation should be checked after staging deployment.

Final local mobile Lighthouse result: performance **85**, accessibility **100**, best practices **100**, SEO **100**. FCP 1.3 s, LCP 4.0 s, total blocking time 150 ms, CLS 0.002. The 90+ performance goal was not reached on this machine; production caching, PHP-FPM and mobile hero delivery remain useful deployment optimizations.
