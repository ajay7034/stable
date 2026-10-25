# Implementation status

The website and content studio run locally with a production Next.js build and CodeIgniter 4/SQLite backend. The application is deployed under its configured temporary URL prefix with separate frontend and PHP services and a repository-first release pipeline.

## Delivered
- Bespoke navy/gold visual system, original supplied logo, architectural concept artwork, material illustrations, responsive layouts, accessible mobile dialogs and desktop materials navigation.
- Home, About, searchable/paginated catalogue, category and product details, quotations, Contact, journal/articles, Careers/application pages, custom pages and unpublished legal drafts.
- CMS-managed copy, settings, menus, home sections, FAQs, categories, products, posts, jobs and media. Website design controls also manage hero/brand imagery, About content, animation settings, colours and public wording. Three original planning articles provide useful launch content. Eight confirmed categories are public; candidate subcategories and expanded ranges remain drafts.
- Rich text editing with constrained document validation and a safe React renderer; SEO fields, previews, revision restoration, scheduled publication, automatic slug redirects and independent draft/live versions. Editing draft sections, galleries or datasheets preserves the previous live content.
- Normalized specifications and variants, ordered product galleries, immutable PDF datasheets, availability fields, category hierarchy validation, product CSV import/export, search, sorting, pagination and bulk publication actions.
- Image decoding/re-encoding, WebP optimization, thumbnails, folders and provenance metadata. Draft images require authorization; deletion checks include current content, publications and revision history.
- Staff accounts, Argon2id passwords, server-enforced roles and configurable per-module/action permissions, self-service password changes, session expiry/revocation, CSRF and rate limits. No default passwords. A separate, uniquely generated local administrator was created for this checkout; its credentials are private and Git-ignored.
- Contact/RFQ storage, optional project details, persistent browser quote list, selected quantities, private PDF BOQs, application storage and private PDF/DOC/DOCX resumes. Enquiry/application review statuses, notes, protected downloads, CSV exports and deletion.
- SMTP notification queue with retries and optional applicant acknowledgements. SMTP remains unconfigured in this environment; actual delivery requires a deployment test.
- Database health screen and backup download, consistent SQLite CLI backups, scheduled-content maintenance and configurable retention for closed enquiries/applications (disabled by default).
- Metadata, canonical URLs, Open Graph/Twitter images, sitemap, admin noindex, and LocalBusiness, Breadcrumb, Article, Product and FAQ structured data where relevant. Prices/reviews are never fabricated.
- Repeatable cloud setup, aaPanel instructions, automated integration/browser/accessibility tests and an isolated SQLite restore drill. See validation.md for measured results and limits.

## Launch inputs still needed
Production server deployment and an operator-created administrator are configured. SMTP credentials, approved legal policies and a retention period remain operator inputs. Confirm business hours, map pin and any social links before enabling them. Verify actual products/specifications and image rights before publishing inventory. Current material/architecture images are conceptual illustrations, not photographs of the business or its stock.

A deployed HTTPS smoke test, SMTP delivery test and full off-host file/database restore rehearsal remain deployment tasks. Local test results are not a guarantee of production performance or legal compliance.
