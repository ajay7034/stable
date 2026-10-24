# Repository-first deployment

Make and test changes in this repository, commit to `main`, then run:

```bash
bash scripts/deploy.sh
```

The command rejects uncommitted changes, pushes `main`, verifies its exact remote revision, and deploys that revision over SSH. A failed push never starts deployment. A GitHub push alone does not deploy the Ubuntu server; deployments are explicit. The separate GitHub Pages workflow remains independent.

## Private configuration

GitHub push credentials and SSH key access must be configured on the operator's computer. Create a private, Git-ignored `.deploy.env` containing `DEPLOY_SSH_TARGET` and optional `DEPLOY_SSH_PORT` (default 22). Do not commit connection details or credentials.

The remote script reads `$HOME/.config/stable/deploy.env` (or the file named by `STABLE_DEPLOY_CONFIG`) on the server. It defines `APP_REPO_PATH`, `DEPLOY_STATE_PATH`, `PHP_BIN`, `NODE_BIN_DIR`, `NGINX_BIN`, `FRONTEND_SERVICE`, `PHP_SERVICE`, `HEALTH_ORIGIN`, and `PUBLIC_URL`. Keep this file private. Configure the frontend service to run from `DEPLOY_STATE_PATH/current/frontend`. Before first use, point `current` at the existing application checkout.

Runtime frontend environments define `API_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_BASE_PATH`. The backend uses `STABLE_BASE_PATH` for its session cookie path and `app.baseURL` for its public URL. The temporary URL prefix is `/stable`; leave it empty for local development. Next.js applies it to navigation automatically, and browser API/image paths use the same build-time setting. Runtime environment files remain untracked.

## Deployment behavior

The server locks deployments, checks Nginx configuration, backs up SQLite and environment files, fast-forwards the checkout, installs locked PHP dependencies, and runs migrations. It builds a separate frontend release before switching the `current` symlink, restarts only the configured application services, and checks the homepage and API. It never reruns seeders or rewrites other websites' configuration.

A failed health check restores the previous frontend. Database migrations are not automatically reversed; inspect the saved backup before manual restoration. Use backward-compatible migrations because the previous frontend may briefly use the new backend. Failed builds leave the previous frontend running. Runtime data stays in `backend/writable`. Releases and private backups are retained for operator review and cleanup. The deployed commit is recorded in `DEPLOY_STATE_PATH/deployed-revision`.

When publishing through the GitHub connector instead of command-line Git, verify the pushed `main` SHA and run `scripts/deploy-server.sh` over SSH with that exact SHA.
