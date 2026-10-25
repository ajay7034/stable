<?php
namespace App\Controllers;
use CodeIgniter\RESTful\ResourceController;
class Api extends ResourceController
{
    private array $content = [
        "pages",
        "categories",
        "products",
        "blogs",
        "careers",
    ];
    protected function out($data, $code = 200)
    {
        return $this->respond(["data" => $data], $code);
    }
    protected function sessionStart()
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_name("stable_session");
            session_set_cookie_params([
                "lifetime" => 0,
                "path" => env("STABLE_BASE_PATH", "") ?: "/",
                "secure" => ENVIRONMENT === "production",
                "httponly" => true,
                "samesite" => "Strict",
            ]);
            ini_set("session.use_strict_mode", "1");
            session_start();
        }
    }
    protected function user()
    {
        $this->sessionStart();
        if (!isset($_SESSION["uid"])) {
            return null;
        }
        if (
            time() - ($_SESSION["seen"] ?? 0) > 1800 ||
            time() - ($_SESSION["started"] ?? 0) > 28800
        ) {
            unset($_SESSION["uid"]);
            return null;
        }
        $u = db_connect()
            ->table("users")
            ->where(["id" => $_SESSION["uid"], "active" => 1])
            ->get()
            ->getRowArray();
        if (!$u || $u["session_version"] !== ($_SESSION["version"] ?? null)) {
            unset($_SESSION["uid"]);
            return null;
        }
        $_SESSION["seen"] = time();
        return $u;
    }
    protected function allowed($module, $action = null)
    {
        $u = $this->user();
        if (!$u) {
            return false;
        }
        $permissions = [
            "super_admin" => ["*"],
            "admin" => [
                "pages",
                "categories",
                "products",
                "blogs",
                "careers",
                "inquiries",
                "settings",
                "navigation",
                "media",
                "applications",
            ],
            "editor" => ["pages", "blogs", "media"],
            "catalogue_manager" => ["categories", "products", "media"],
            "enquiry_manager" => ["inquiries", "applications"],
        ];
        if ($u["role"] === "super_admin") {
            return true;
        }
        $action ??= match ($this->request->getMethod()) {
            "GET" => "read",
            "DELETE" => "delete",
            "POST" => "create",
            default => "update",
        };
        $override = db_connect()
            ->table("role_permissions")
            ->where([
                "role" => $u["role"],
                "module" => $module,
                "action" => $action,
            ])
            ->get()
            ->getRowArray();
        if ($override) {
            return (bool) $override["allowed"];
        }
        $p = $permissions[$u["role"]] ?? [];
        return in_array($module, $p);
    }
    protected function csrf()
    {
        return isset($_SESSION["csrf"]) &&
            hash_equals(
                $_SESSION["csrf"],
                $this->request->getHeaderLine("X-CSRF-Token"),
            );
    }
    protected function throttle($scope, $limit)
    {
        return service("throttler")->check(
            $scope . hash("sha256", $this->request->getIPAddress()),
            $limit,
            60,
        );
    }
    public function publicRead($module, $slug = null)
    {
        $db = db_connect();
        if ($module === "settings") {
            return $this->out(
                array_column(
                    $db->table("site_settings")->get()->getResultArray(),
                    "value",
                    "key",
                ),
            );
        }
        if ($module === "navigation") {
            return $this->out(
                $db
                    ->table("menu_items")
                    ->where("visible", 1)
                    ->orderBy("position")
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!in_array($module, $this->content)) {
            return $this->failNotFound();
        }
        \App\Services\Content::scheduled();
        $q = $db->table("content_publications")->where("module", $module);
        if ($slug) {
            $q->where("slug", $slug);
            $row = $q->get()->getRowArray();
            if (!$row) {
                $redirect = $db
                    ->table("redirects")
                    ->where(["module" => $module, "old_slug" => $slug])
                    ->get()
                    ->getRowArray();
                if ($redirect) {
                    $row = $db
                        ->table("content_publications")
                        ->where([
                            "module" => $module,
                            "record_id" => $redirect["record_id"],
                        ])
                        ->get()
                        ->getRowArray();
                }
            }
            if (!$row) {
                return $this->failNotFound();
            }
            $r = json_decode($row["content"], true);
            if (isset($r["sections"])) {
                $r["sections"] = array_values(
                    array_filter(
                        $r["sections"],
                        fn($section) => !empty($section["visible"]),
                    ),
                );
            }
            return $this->out($r);
        }
        $search = $this->request->getGet("q");
        if (is_string($search) && $search !== "") {
            $q->groupStart()
                ->like("title", substr($search, 0, 100))
                ->orLike("tags", substr($search, 0, 100))
                ->groupEnd();
        }
        $category = $this->request->getGet("category");
        if (
            $module === "products" &&
            is_scalar($category) &&
            ctype_digit((string) $category)
        ) {
            $q->where("category_id", (int) $category);
        }
        if ($this->request->getGet("featured") === "1") {
            $q->where("featured", 1);
        }
        $total = $q->countAllResults(false);
        $sort = $this->request->getGet("sort");
        if ($sort === "newest") {
            $q->orderBy("published_at", "DESC");
        } elseif ($sort === "featured") {
            $q->orderBy("featured", "DESC")->orderBy("title");
        } else {
            $q->orderBy("title");
        }
        $pageValue = $this->request->getGet("page");
        $limitValue = $this->request->getGet("per_page");
        $page = is_scalar($pageValue)
            ? max(1, min(100000, (int) $pageValue))
            : 1;
        $limit = is_scalar($limitValue)
            ? max(1, min(100, (int) $limitValue))
            : 24;
        if (!$limitValue) {
            $limit = 24;
        }
        $rows = $q
            ->limit($limit, ($page - 1) * $limit)
            ->get()
            ->getResultArray();
        $data = array_map(fn($r) => json_decode($r["content"], true), $rows);
        return $this->respond([
            "data" => $data,
            "meta" => [
                "total" => $total,
                "page" => $page,
                "per_page" => $limit,
                "pages" => (int) ceil($total / $limit),
            ],
        ]);
    }
    public function submit($kind)
    {
        if (!in_array($kind, ["contact", "quotes"])) {
            return $this->failNotFound();
        }
        if (!$this->throttle("submit", 6)) {
            return $this->fail("Please try again later", 429);
        }
        $payload = $this->request->getPost("payload");
        $data =
            $payload !== null
                ? json_decode($payload, true)
                : $this->request->getJSON(true) ?? [];
        if (!is_array($data)) {
            return $this->failValidationErrors("Invalid submission");
        }
        if (!empty($data["website"])) {
            return $this->out(["received" => true], 201);
        }
        $rules = [
            "name" => "required|min_length[2]|max_length[150]",
            "email" => "required|valid_email|max_length[254]",
            "phone" => "required|min_length[7]|max_length[40]",
            "message" => "required|min_length[10]|max_length[10000]",
            "company" => "permit_empty|max_length[200]",
            "subject" => "permit_empty|max_length[200]",
            "project_location" => "permit_empty|max_length[300]",
            "category" => "permit_empty|max_length[200]",
            "required_date" => "permit_empty|valid_date[Y-m-d]",
        ];
        if (
            !$this->validateData($data, $rules) ||
            ($data["consent"] ?? false) !== true
        ) {
            return $this->failValidationErrors(
                $this->validator->getErrors() + [
                    "consent" => "Contact permission is required.",
                ],
            );
        }
        $row = array_intersect_key($data, $rules);
        $resolvedItems = [];
        $items = $data["items"] ?? [];
        if (!is_array($items) || count($items) > 100) {
            return $this->failValidationErrors("Invalid quote list");
        }
        if ($kind === "quotes" && $items) {
            $lines = [];
            foreach ($items as $item) {
                if (
                    !is_array($item) ||
                    !isset($item["id"], $item["quantity"]) ||
                    !is_int($item["quantity"]) ||
                    $item["quantity"] < 1 ||
                    $item["quantity"] > 100000
                ) {
                    return $this->failValidationErrors("Invalid quantity");
                }
                $product = \App\Services\Content::live(
                    "products",
                    (int) $item["id"],
                );
                if (!$product) {
                    return $this->failValidationErrors(
                        "A selected product is unavailable",
                    );
                }
                $resolvedItems[] = [
                    "product_id" => (int) $product["id"],
                    "quantity" => $item["quantity"],
                ];
                $lines[] =
                    $product["id"] .
                    ": " .
                    $product["title"] .
                    " x " .
                    $item["quantity"];
            }
            $row["message"] .=
                "\n\nSelected materials:\n" . implode("\n", $lines);
        }
        $row["kind"] = $kind;
        $row["created_at"] = date("Y-m-d H:i:s");
        $filename = null;
        $f = $this->request->getFile("attachment");
        if ($f && $f->getError() !== UPLOAD_ERR_NO_FILE) {
            if (
                $kind !== "quotes" ||
                !$f->isValid() ||
                $f->getSize() > 5 * 1024 * 1024 ||
                $f->getMimeType() !== "application/pdf" ||
                strtolower($f->getClientExtension()) !== "pdf" ||
                file_get_contents($f->getTempName(), false, null, 0, 5) !==
                    "%PDF-"
            ) {
                return $this->failValidationErrors(
                    "BOQ must be a PDF up to 5 MB",
                );
            }
            $dir = WRITEPATH . "boqs";
            if (!is_dir($dir)) {
                mkdir($dir, 0700, true);
            }
            $filename = bin2hex(random_bytes(24)) . ".pdf";
            $f->move($dir, $filename);
            chmod($dir . "/" . $filename, 0600);
        }
        $row["attachment"] = $filename;
        $db = db_connect();
        $db->transStart();
        $db->table("inquiries")->insert($row);
        $id = (int) $db->insertID();
        foreach ($resolvedItems as $item) {
            $db->table("quote_items")->insert($item + ["inquiry_id" => $id]);
        }
        $db->transComplete();
        if (!$db->transStatus()) {
            if ($filename) {
                unlink(WRITEPATH . "boqs/" . $filename);
            }
            return $this->fail("Unable to save enquiry", 500);
        }
        \App\Services\Notifications::enqueue($kind, $id);
        return $this->out(["received" => true], 201);
    }
    public function auth($action)
    {
        $this->sessionStart();
        if ($action === "session") {
            $u = $this->user();
            $_SESSION["csrf"] ??= bin2hex(random_bytes(32));
            return $this->out([
                "user" => $u
                    ? array_intersect_key(
                        $u,
                        array_flip(["id", "email", "role"]),
                    )
                    : null,
                "csrf" => $_SESSION["csrf"],
                "access" => $u
                    ? array_combine(
                        [
                            ...$this->content,
                            "media",
                            "inquiries",
                            "applications",
                            "settings",
                            "navigation",
                            "users",
                            "system",
                            "audit_logs",
                        ],
                        array_map(fn($m) => $this->allowed($m, "read"), [
                            ...$this->content,
                            "media",
                            "inquiries",
                            "applications",
                            "settings",
                            "navigation",
                            "users",
                            "system",
                            "audit_logs",
                        ]),
                    )
                    : [],
            ]);
        }
        if (!$this->csrf()) {
            return $this->failForbidden("Invalid CSRF token");
        }
        if ($action === "logout") {
            $_SESSION = [];
            session_destroy();
            return $this->out(["ok" => true]);
        }
        if ($action !== "login") {
            return $this->failNotFound();
        }
        if (!$this->throttle("login", 5)) {
            return $this->fail("Please try again later", 429);
        }
        $data = $this->request->getJSON(true) ?? [];
        if (
            !is_array($data) ||
            !is_string($data["email"] ?? null) ||
            !is_string($data["password"] ?? null)
        ) {
            return $this->failValidationErrors("Invalid credentials");
        }
        $u = db_connect()
            ->table("users")
            ->where([
                "email" => strtolower($data["email"] ?? ""),
                "active" => 1,
            ])
            ->get()
            ->getRowArray();
        if (!$u || !password_verify($data["password"] ?? "", $u["password"])) {
            return $this->failUnauthorized("Invalid credentials");
        }
        session_regenerate_id(true);
        $_SESSION["uid"] = $u["id"];
        $_SESSION["seen"] = time();
        $_SESSION["started"] = time();
        $_SESSION["version"] = $u["session_version"];
        $_SESSION["csrf"] = bin2hex(random_bytes(32));
        return $this->out(["csrf" => $_SESSION["csrf"]]);
    }
    public function admin($module, $id = null)
    {
        if (
            !in_array($module, [
                ...$this->content,
                "inquiries",
                "settings",
                "audit_logs",
            ])
        ) {
            return $this->failNotFound();
        }
        if (!$this->allowed($module)) {
            return $this->failForbidden();
        }
        $db = db_connect();
        $table = $module === "settings" ? "site_settings" : $module;
        $method = $this->request->getMethod();
        if ($method === "GET") {
            $q = $db->table($table);
            $search = $this->request->getGet("q");
            if (
                is_string($search) &&
                $search !== "" &&
                in_array($module, $this->content)
            ) {
                $q->like("title", substr($search, 0, 100));
            }
            return $this->out($q->limit(1000)->get()->getResultArray());
        }
        if (!$this->csrf()) {
            return $this->failForbidden("Invalid CSRF token");
        }
        $data = $this->request->getJSON(true) ?? [];
        if (!is_array($data)) {
            return $this->failValidationErrors("Invalid data");
        }
        if ($module === "audit_logs") {
            return $this->failForbidden();
        }
        if ($module === "settings") {
            if ($error = \App\Services\WebsiteSettings::validate($data)) return $this->failValidationErrors($error);
            $keys = array_column(
                $db
                    ->table("site_settings")
                    ->select("key")
                    ->get()
                    ->getResultArray(),
                "key",
            );
            foreach ($data as $key => $value) {
                if (
                    !in_array($key, $keys) ||
                    !is_string($value) ||
                    strlen($value) > 5000
                ) {
                    return $this->failValidationErrors("Invalid setting");
                }
                if (
                    in_array($key, [
                        "maps_url",
                        "instagram_url",
                        "linkedin_url",
                        "facebook_url",
                    ]) &&
                    $value !== "" &&
                    (!filter_var($value, FILTER_VALIDATE_URL) ||
                        !str_starts_with($value, "https://"))
                ) {
                    return $this->failValidationErrors("Links must use HTTPS");
                }
                if (
                    str_ends_with($key, "_href") &&
                    $value !== "" &&
                    !preg_match('~^/[a-z0-9/-]*$~', $value)
                ) {
                    return $this->failValidationErrors(
                        "CTA links must be internal paths",
                    );
                }
            }
            $db->transStart();
            foreach ($data as $key => $value) {
                $db->table($table)
                    ->where("key", $key)
                    ->update(["value" => $value]);
            }
            $this->auditEvent("settings:update");
            $db->transComplete();
            return $this->out(["saved" => true]);
        }
        if ($module === "inquiries") {
            $rules = [
                "status" => "required|in_list[new,in_progress,replied,closed]",
                "notes" => "permit_empty|max_length[10000]",
            ];
        } else {
            $rules = [
                "title" => "required|max_length[200]",
                "slug" =>
                    'required|regex_match[/^[a-z0-9]+(?:-[a-z0-9]+)*$/]|max_length[200]',
                "description" => "permit_empty|max_length[3000]",
                "body" => "permit_empty|max_length[50000]",
                "status" =>
                    "required|in_list[draft,published,scheduled,archived]",
                "category_id" => "permit_empty|is_natural_no_zero",
                "cover_id" => "permit_empty|is_natural_no_zero",
                "seo_title" => "permit_empty|max_length[200]",
                "seo_description" => "permit_empty|max_length[500]",
                "featured" => "permit_empty|in_list[0,1]",
                "publish_at" => "permit_empty|valid_date[Y-m-d H:i:s]",
                "tags" => "permit_empty|max_length[1000]",
            ];
        }
        if ($module === "products") {
            $rules += [
                "product_code" => "permit_empty|max_length[100]",
                "availability" =>
                    "permit_empty|in_list[enquire,available,unavailable]",
                "features" => "permit_empty|max_length[5000]",
                "applications" => "permit_empty|max_length[5000]",
                "specifications" => "permit_empty|max_length[10000]",
                "variants" => "permit_empty|max_length[5000]",
            ];
        }
        if ($module === "categories") {
            $rules += ["parent_id" => "permit_empty|is_natural_no_zero"];
        }
        if ($module === "blogs") {
            $rules += [
                "author" => "permit_empty|max_length[200]",
                "blog_category" => "permit_empty|max_length[200]",
            ];
        }
        if ($module === "careers") {
            $rules += [
                "department" => "permit_empty|max_length[200]",
                "location" => "permit_empty|max_length[200]",
                "employment_type" => "permit_empty|max_length[100]",
            ];
        }
        if (!$this->validateData($data, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        if (
            isset($data["body"]) &&
            !\App\Services\RichText::valid($data["body"])
        ) {
            return $this->failValidationErrors("Invalid rich text document");
        }
        if (
            in_array($data["status"] ?? "", [
                "published",
                "scheduled",
                "archived",
            ]) &&
            !$this->allowed($module, "publish")
        ) {
            return $this->failForbidden("Publishing permission required");
        }
        if (
            ($data["status"] ?? "") === "scheduled" &&
            (empty($data["publish_at"]) ||
                strtotime($data["publish_at"] . " UTC") <= time())
        ) {
            return $this->failValidationErrors(
                "Choose a future UTC publication date",
            );
        }
        if (
            !empty($data["cover_id"]) &&
            !$db
                ->table("media_files")
                ->where("id", (int) $data["cover_id"])
                ->countAllResults()
        ) {
            return $this->failValidationErrors("Unknown cover image");
        }
        if ($module === "categories" && !empty($data["parent_id"])) {
            $parent = (int) $data["parent_id"];
            $visited = [];
            while ($parent) {
                if ($parent === (int) $id || in_array($parent, $visited)) {
                    return $this->failValidationErrors(
                        "Category hierarchy cannot contain cycles",
                    );
                }
                $visited[] = $parent;
                $r = $db
                    ->table("categories")
                    ->where("id", $parent)
                    ->get()
                    ->getRowArray();
                if (!$r) {
                    return $this->failValidationErrors(
                        "Unknown parent category",
                    );
                }
                $parent = (int) ($r["parent_id"] ?? 0);
            }
        }
        if (
            $module === "categories" &&
            ($data["status"] ?? "") === "archived" &&
            $id &&
            $db
                ->table("content_publications")
                ->where(["module" => "products", "category_id" => (int) $id])
                ->countAllResults()
        ) {
            return $this->fail("Unpublish dependent products first", 409);
        }
        $row = array_intersect_key($data, $rules);
        if ($module !== "inquiries") {
            $row["updated_at"] = date("Y-m-d H:i:s");
            if (empty($row["publish_at"])) {
                $row["publish_at"] = null;
            }
        }
        $db->transBegin();
        try {
            if ($id) {
                $old = $db
                    ->table($table)
                    ->where("id", (int) $id)
                    ->get()
                    ->getRowArray();
                if (!$old) {
                    $db->transRollback();
                    return $this->failNotFound();
                }
                if ($module !== "inquiries") {
                    $db->table("content_versions")->insert([
                        "module" => $module,
                        "record_id" => (int) $id,
                        "content" => json_encode(
                            \App\Services\Content::draft($module, (int) $id),
                        ),
                        "created_at" => date("Y-m-d H:i:s"),
                    ]);
                }
                $db->table($table)->where("id", (int) $id)->update($row);
            } else {
                if ($module === "inquiries") {
                    $db->transRollback();
                    return $this->failForbidden();
                }
                $row["created_at"] = date("Y-m-d H:i:s");
                $db->table($table)->insert($row);
                $id = (int) $db->insertID();
            }
            if (in_array($module, $this->content)) {
                if ($row["status"] === "published") {
                    \App\Services\Content::publish($module, (int) $id);
                } elseif ($row["status"] === "archived") {
                    $db->table("content_publications")
                        ->where(["module" => $module, "record_id" => (int) $id])
                        ->delete();
                }
            }
            $this->auditEvent($module . ":save:" . $id);
            if (!$db->transStatus()) {
                throw new \RuntimeException("Database constraint");
            }
            $db->transCommit();
            return $this->out(["saved" => true, "id" => (int) $id]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->fail(
                "Record conflicts with an existing slug, relationship or publication. No changes saved.",
                409,
            );
        }
    }
    protected function auditEvent(string $action): void
    {
        db_connect()
            ->table("audit_logs")
            ->insert([
                "user_id" => $_SESSION["uid"],
                "action" => $action,
                "created_at" => date("Y-m-d H:i:s"),
            ]);
    }
}
