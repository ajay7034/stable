# GitHub Pages hosting

The repository includes two deployment options:

- **GitHub Pages:** a static public website with category/article pages, responsive navigation, client-side filtering and email enquiry composition. GitHub does not execute PHP, Node servers or SQLite. The public export does not include the admin studio, database, staff credentials or private uploads. Enquiry forms open the visitor's email application; the visitor must send the email there. Public phone and WhatsApp links also work.
- **Full application hosting:** use the aaPanel guide for the live CMS, database-backed submissions, private attachments and scheduled publishing.

The Pages site address is `https://ajay7034.github.io/stable/`.

## One-time GitHub setting
In the repository's **Settings → Pages**, choose **Deploy from a branch**, then **gh-pages** and **/(root)**, and save. Repository administrator permissions are required. Publishing generated files to a branch alone does not prove that Pages is enabled.

The **Publish GitHub Pages** workflow builds on pushes to `main`, initializes only the verified public seed content in a temporary database, renders the public website, downloads public assets and publishes the result to `gh-pages`. The workflow preserves publication history and does not force-push. It explicitly requests a Pages build after publishing, because commits made with the workflow token do not themselves trigger a Pages build. The first run can report a Pages API error until the one-time Pages setting is enabled. Its build database is disposable; it is not a hosted CMS database. Changes made in a local CMS are not automatically committed or included in future workflow builds. Update versioned seed content/assets or deploy the full backend for ongoing CMS editing.

## Local preview and publishing
With the full application running on port 3000:

```sh
cd frontend
npm ci
node scripts/export-pages.mjs
cd ..
bash scripts/publish-pages.sh
```

`frontend/pages-out` is generated and ignored on `main`. `PAGES_URL` controls the public URL and path prefix; `EXPORT_ORIGIN` controls the local rendering server. No runtime APIs are called from the exported website. Test the generated site under the `/stable/` prefix, rather than only at `/`, to catch asset/link issues.
