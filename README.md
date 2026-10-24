# Stable Building Materials
Next.js frontend and CodeIgniter 4/SQLite backend for STABLE BUILDING MATERIALS TRADING LLC, Ajman.

Start with [setup](docs/setup.md). The responsive public website and content studio are implemented and run locally. See [implementation status](docs/implementation-status.md) for delivered features and the remaining business/deployment inputs.

Local website: `http://localhost:3000` · Staff studio: `/admin`. No default staff account is installed; create one with `docker compose exec api php spark stable:admin`.

- [Architecture](docs/architecture.md)
- [CMS guide](docs/cms-guide.md)
- [aaPanel deployment](docs/deployment-aapanel.md)
- [Backup and restore](docs/backup-restore.md)
- [Verified facts](docs/verified-facts.md)
- [Asset provenance](docs/image-licenses.md)
- [Original requirements](docs/requirements.txt)

## Preview

[Desktop website](docs/screenshots/home-desktop.jpg) · [Mobile website](docs/screenshots/home-mobile.jpg) · [Content studio](docs/screenshots/studio-desktop.jpg)

A local development administrator was created for this checkout. Its generated credentials are stored in the private, Git-ignored `LOCAL_ADMIN_ACCESS.txt`; change the password in My account. Seeders never install a default password. Create a separate production administrator during deployment.

## GitHub Pages

The public website can also be published at `https://ajay7034.github.io/stable/`. See [GitHub Pages setup](docs/github-pages.md). GitHub Pages serves the static public site; CMS/database features require full application hosting. Enquiries on Pages use email composition and direct phone/WhatsApp links.
