# Architecture

Next.js App Router/TypeScript renders public content through the CodeIgniter 4 REST API. Only PHP accesses SQLite. The browser uses a same-origin API proxy locally and Nginx/PHP-FPM in production. Public reads are dynamic so publication and revocation are reflected immediately; static fonts/artwork and Next assets receive normal static delivery. Private media responses are not publicly cached.

The frontend uses Tailwind/CSS, local Manrope/Inter fonts, Lucide, Radix dialogs, React Hook Form/Zod and a lazily loaded Tiptap editor. Small intersection observers and CSS handle progressive scroll reveals without a heavyweight animation runtime on public pages. Content remains visible without the enhancement and reduced-motion preferences are honored.

## Content and data
Core tables are users, pages, categories, products, blogs, careers, inquiries, site_settings, audit_logs, media_files, applications, content_versions, page_sections, notification_queue and quote_items. Additional tables provide immutable content_publications, slug redirects, FAQs, menu_items, role_permissions, product_images, product_specifications, product_variants and immutable documents. An earlier product_datasheets table remains for migration compatibility; active datasheets use products.datasheet_id and documents.

Drafts live in editable content/relation tables. Publishing assembles a validated record and relation snapshot into content_publications. Public readers use these snapshots exclusively. Thus changing a draft or replacing a datasheet cannot silently change the live page. Archiving removes its publication. Slug changes create redirects. Scheduled publishing runs under a worker lock, on public reads or through the maintenance command. Revisions restore content and stored relations as drafts inside transactions.

Category parent relationships are cycle-checked. Product specifications/variants and quote quantities use related rows. Tags and journal category labels are lightweight searchable fields rather than separate taxonomy tables. Catalogue inventory is intentionally empty until verified; candidate category families are private drafts.

## Security and operations
PHP enforces roles and optional per-module/action overrides. Passwords use Argon2id. Sessions have HttpOnly/SameSite Strict cookies, idle/absolute timeouts and version revocation; the synchronizer CSRF token rotates at login. Login and form submissions are rate-limited. All values are query-builder parameters and content is escaped by React. Rich text is a constrained AST, not executable HTML.

Uploads are validated and kept outside public/. Image files are decoded and re-encoded as WebP. Private BOQs/resumes require authorized download; datasheets/images become public only when referenced by a publication. Revision references protect media from deletion. File validation is not an antivirus engine. Add malware scanning to the deployment if its upload policy requires it.

Notifications queue after a saved submission and use a locked worker with retry/backoff. SMTP is optional and unset in the development environment. Backups use SQLite VACUUM INTO, while operational backups must also include files and separately managed secrets. Retention runs only with an explicit positive configured period and only for closed records. Deployment-specific HTTPS, SMTP and recovery checks are documented separately.
