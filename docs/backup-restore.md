# Backup and restore
Run `php spark stable:backup` as the maintenance account. The command uses SQLite VACUUM INTO for a transactionally consistent copy, stored with mode 600 under private writable/backups. Copy backups to encrypted off-host storage and define a retention schedule with the business. Never serve this directory publicly.

To restore: stop PHP writers, retain the existing database for rollback, check the backup with SQLite `PRAGMA integrity_check`, then restore it to the configured absolute database path. Remove obsolete WAL/SHM sidecars only after all processes have stopped and the original database has been preserved. Restore ownership and permissions, restart PHP and test public reads and authenticated access. Perform a recovery drill on an isolated staging instance before launch.

SQLite is suitable for modest write concurrency. Monitor busy errors and request latency; sustained concurrent writes require a database migration plan. The current application uses SQLite exclusively; a move to a server database would be a separately authorized architecture change.

## Files and recovery validation
A database-only copy does not contain uploaded files. Back up `writable/media`, `writable/documents`, `writable/boqs` and `writable/resumes` alongside the database. Retain immutable documents and revision-referenced media. Store configuration/secrets in a separately encrypted, access-controlled backup. Do not restore transient sessions, caches or worker lock files.

On restoration, verify that the database snapshot's file references exist, check public image/datasheet delivery and authorized BOQ/resume downloads, and invalidate old sessions if restoring staff credentials. Apply the same business retention policy to backup expiry; purging a live record does not remove earlier encrypted backup copies automatically.

`docker compose exec -T api php tests/restore.php` performs a local isolated database restore drill: it creates a consistent copy, opens it independently, checks integrity, compares critical row counts and reads the published home snapshot. It never replaces the running database. A complete off-host database-and-files rehearsal should also run on the actual deployment host before launch.
