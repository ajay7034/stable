# Content studio

Create the first account with `php spark stable:admin`, then visit `/admin`. Passwords require at least 14 characters. Staff changes revoke existing sessions; sessions expire after 30 minutes idle or eight hours total. My account changes your own password. Permissions controls explicit allow/deny rules by role, module and action; super administrators retain full access.

## Editing and publishing
Pages, Categories, Products, Journal and Careers support drafts, publication, scheduled publication (UTC) and archiving. Saving a draft keeps the current published version online. Archive removes the live publication. Scheduled items publish through public requests or the `stable:maintain` worker. Changing a published slug creates a redirect from its old URL.

Use the rich text editor for body content. Choose cover images/categories from labelled lists. Preview shows the saved draft. Revision history restores a previous record and its saved relations as a draft, leaving the published version untouched. Homepage sections support ordering, visibility and controlled layouts. Save sections, then publish the page. Section revision history can also load older sections for restoration.

Product details provide ordered gallery images, specification and variant rows, and optional PDF datasheets up to 10 MB. Saving details, FAQs or a datasheet creates draft changes; publish the parent record when ready. PDFs are immutable so older live content keeps its original datasheet. Use the media selectors rather than copying database IDs.

Media accepts authorized JPEG/PNG/WebP up to 5 MB and 24 megapixels. Supply alt text, owner and license; add a source URL when relevant. Uploads are decoded, resized to a maximum 2400-pixel dimension, re-encoded as WebP and given thumbnails. Folder filters and metadata editing help organize the library. Media used by live content or revision history cannot be deleted. Public use does not imply that the business stocks an illustrated product.

Navigation edits header/footer links and ordering. Site settings control contact details, major headings, hero/footer actions, maps, hours and social URLs. Leave unconfirmed fields blank. Credentials belong in environment configuration, never public settings.

## Catalogue workflow
The eight confirmed categories are published. Additional category/subcategory suggestions are private drafts. Confirm product facts before publication; availability defaults to enquiry. Individual products and vacancies have not been invented.

CSV imports use the exported columns, validate the whole file, reject duplicate slugs and always create drafts. Maximum 1000 rows/1 MB. Exports neutralize spreadsheet formula prefixes. Bulk actions affect selected products; archiving removes live copies, while saving as draft preserves existing publications.

## Enquiries and operations
Enquiries, Quotations and Applications have review statuses and private notes. BOQs and resumes are stored outside the web root and require an authorized download. Resume checks validate format/size, including bounded DOCX archives; they do not replace endpoint malware scanning. Delete controls permanently remove the record and its private attachment.

Notifications shows pending/sent/failed delivery. Configure SMTP and schedule `php spark stable:notifications` to deliver admin notifications with retries. Optional applicant acknowledgements use `STABLE_APPLICANT_CONFIRMATIONS=true`. Without SMTP no emails are attempted; submissions remain stored.

System reports database integrity, image-processing availability and queue counts; Download backup creates a consistent private SQLite copy. Include the media/documents/private attachment directories in operational backups as described in backup-restore.md. Retention is disabled until a business policy is configured. Legal pages are drafts until reviewed and published.
