# Project workflow

Work on application changes in this repository first. Validate, commit, and push to `main` before deploying the exact pushed commit to the Ubuntu server. Do not edit tracked application source directly on the live server.

Follow `docs/deployment-pipeline.md`. `bash scripts/deploy.sh` pushes a clean local `main` and deploys it. If commits are published through the GitHub connector, verify remote main and run `scripts/deploy-server.sh` over SSH with that exact SHA. Deployments are explicit; GitHub pushes alone do not update the Ubuntu server.

Preserve other websites. Restart only the services specified by the private deployment configuration. Never overwrite runtime `.env` files, reseed an existing database, or commit credentials or `backend/writable` data. Keep the temporary `/stable` prefix.
