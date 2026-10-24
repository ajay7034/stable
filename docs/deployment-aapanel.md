# aaPanel deployment
Deploy to staging first and complete the domain, business-policy and SMTP checks in implementation-status.md before public launch.

Use Ubuntu, aaPanel Nginx, Node 24 and PHP 8.4 with intl, mbstring, sqlite3, pdo_sqlite, curl, fileinfo, DOM, XML, GD (WebP) and zip. Do not expose the repository root as a website directory. Set the site root to backend/public. Keep writable, vendor and .env outside that web root.

1. Install PHP dependencies with `cd backend && composer install --no-dev --optimize-autoloader`.
2. Copy .env.example to .env; set production mode, the HTTPS baseURL and an absolute SQLite path outside public/.
3. Grant only PHP-FPM and the maintenance account access to writable (directories 750, files 640); never chmod 777. Run `php spark migrate` and, on first installation only, `php spark db:seed CompanySeeder`, `php spark db:seed DesignSeeder` and `php spark db:seed TaxonomySeeder`. These seeders add initial content; do not reset an existing database.
4. Run `php spark stable:admin` interactively to create the administrator. No default account is installed.
5. Set frontend API_ORIGIN to an internal PHP HTTP endpoint. Set NEXT_PUBLIC_SITE_URL to the actual HTTPS domain. Run `npm ci && npm run build` in frontend.
6. Use aaPanel's Node process manager to run `npm run start -- --hostname 127.0.0.1 --port 3000`. Enable restart on failure and boot startup.
7. Obtain a valid TLS certificate. Redirect HTTP to HTTPS. Install the location blocks below in the TLS server, retaining aaPanel's certificate configuration. Adjust the FPM socket for your installation.

```nginx
root /www/wwwroot/stable/backend/public;
client_max_body_size 12m;
location /api/ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/stable/backend/public/index.php;
    fastcgi_param SCRIPT_NAME /index.php;
    fastcgi_param HTTPS on;
    fastcgi_pass unix:/tmp/php-cgi-84.sock;
}
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
location ~ /\. { deny all; }
location ~* \.(sqlite|sqlite3|db|env|bak)$ { deny all; }
```

Run `nginx -t` before reload. Confirm HTTPS cookies, draft isolation and denied unauthenticated admin access. Rotate logs and configure encrypted off-host backups. Do not put SMTP credentials in Git. Admin SMTP notifications are optional and queued; configure the worker described below. Submissions remain stored even if delivery fails.

Updates: back up first, install locked dependencies, run migrations, build frontend, restart Node. Never reset or destructively reseed an existing database. On 502 errors check Node and PHP-FPM service logs and socket permissions. On SQLite errors verify parent directory permissions, WAL/SHM access and the absolute path.

Optional admin email notifications: configure STABLE_SMTP_HOST, STABLE_SMTP_PORT,
STABLE_SMTP_CRYPTO (tls), STABLE_SMTP_USER, STABLE_SMTP_PASSWORD, STABLE_SMTP_FROM
and STABLE_NOTIFICATION_EMAIL securely in backend/.env. Run `php spark
stable:notifications` every minute from an aaPanel scheduled task under the
maintenance user. The worker uses a process lock, exponential retry delays and
stops after five failed attempts. The super-admin notification screen shows status.
It sends reference numbers only, not applicant/contact message contents. With SMTP
unset, records remain queued; no email is attempted. Outbound SMTP still needs an
operator delivery test. Enable `STABLE_APPLICANT_CONFIRMATIONS=true` for applicant acknowledgement emails; these include only a receipt and reference.

Set PHP `memory_limit=256M`, `upload_max_filesize=10M` and `post_max_size=12M`. Set `API_ORIGIN` to a loopback-only Nginx listener forwarding `/api/` to the same PHP-FPM application (or the actual HTTPS site after DNS/TLS is working). Never point it at the Node server itself, which would create a proxy loop.

Schedule these commands with aaPanel under the maintenance account, using absolute PHP and application paths:
- Every minute: `cd /www/wwwroot/stable/backend && php spark stable:maintain`
- Every minute: `cd /www/wwwroot/stable/backend && php spark stable:notifications`
- Daily: `cd /www/wwwroot/stable/backend && php spark stable:backup`, followed by encrypted off-host synchronization of backups and upload directories.

`STABLE_RETENTION_DAYS=0` disables automatic deletion. A positive value purges only closed enquiries/applications older than that number of days from creation, including private attachments and queue records. Choose the value under the approved business retention policy and include backup expiry in that policy.

Verify TLS session cookies, create/edit/publish/restore workflows, a real delivered enquiry notification, phone/WhatsApp links, sitemap canonical URLs and database/file restoration on the staging host before changing public DNS.
