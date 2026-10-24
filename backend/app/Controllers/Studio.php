<?php
namespace App\Controllers;
use App\Services\Content;
class Studio extends Api
{
    public function restore($version)
    {
        $db = db_connect();
        $v = $db
            ->table("content_versions")
            ->where("id", (int) $version)
            ->get()
            ->getRowArray();
        if (!$v || !in_array($v["module"], Content::MODULES)) {
            return $this->failNotFound();
        }
        $module = $v["module"];
        $id = (int) $v["record_id"];
        if (!$this->allowed($module, "update") || !$this->csrf()) {
            return $this->failForbidden();
        }
        $old = json_decode($v["content"], true);
        $current = Content::draft($module, $id);
        if (!$old || !$current) {
            return $this->failNotFound();
        }
        $db->transBegin();
        try {
            $db->table("content_versions")->insert([
                "module" => $module,
                "record_id" => $id,
                "content" => json_encode($current),
                "created_at" => date("Y-m-d H:i:s"),
            ]);
            $fields = array_diff($db->getFieldNames($module), [
                "id",
                "created_at",
                "updated_at",
            ]);
            $row = array_intersect_key($old, array_flip($fields));
            $row["status"] = "draft";
            $row["publish_at"] = null;
            $row["updated_at"] = date("Y-m-d H:i:s");
            $db->table($module)->where("id", $id)->update($row);
            if (array_key_exists("faqs", $old)) {
                $db->table("faqs")
                    ->where(["module" => $module, "record_id" => $id])
                    ->delete();
                foreach ($old["faqs"] as $i => $f) {
                    $db->table("faqs")->insert([
                        "module" => $module,
                        "record_id" => $id,
                        "question" => $f["question"],
                        "answer" => $f["answer"],
                        "position" => $i,
                    ]);
                }
            }
            if ($module === "pages" && array_key_exists("sections", $old)) {
                $db->table("page_sections")->where("page_id", $id)->delete();
                foreach ($old["sections"] as $i => $section) {
                    unset($section["id"]);
                    $section["page_id"] = $id;
                    $section["position"] = $i;
                    $db->table("page_sections")->insert($section);
                }
            }
            if ($module === "products") {
                foreach (
                    [
                        "specifications_list" => "product_specifications",
                        "variants_list" => "product_variants",
                    ]
                    as $key => $table
                ) {
                    if (array_key_exists($key, $old)) {
                        $db->table($table)->where("product_id", $id)->delete();
                        foreach ($old[$key] as $i => $pair) {
                            $db->table($table)->insert([
                                "product_id" => $id,
                                "label" => $pair["label"],
                                "value" => $pair["value"],
                                "position" => $i,
                            ]);
                        }
                    }
                }
                if (array_key_exists("gallery", $old)) {
                    $db->table("product_images")
                        ->where("product_id", $id)
                        ->delete();
                    foreach ($old["gallery"] as $i => $image) {
                        $db->table("product_images")->insert([
                            "product_id" => $id,
                            "media_id" => $image["media_id"],
                            "position" => $i,
                        ]);
                    }
                }
            }
            $this->auditEvent($module . ":restore:" . $id . ":" . $version);
            if (!$db->transStatus()) {
                throw new \RuntimeException("Conflict");
            }
            $db->transCommit();
            return $this->out(Content::draft($module, $id));
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->fail(
                "This revision conflicts with existing content. No changes saved.",
                409,
            );
        }
    }
    public function navigation()
    {
        if (!$this->allowed("navigation")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db
                    ->table("menu_items")
                    ->orderBy("position")
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $rows = $this->request->getJSON(true);
        if (!is_array($rows) || !array_is_list($rows) || count($rows) > 40) {
            return $this->failValidationErrors("Maximum 40 menu links");
        }
        $clean = [];
        foreach ($rows as $i => $r) {
            $rules = [
                "label" => "required|max_length[60]",
                "href" =>
                    'required|regex_match[/^\/[a-z0-9\/-]*$/]|max_length[200]',
                "group_name" => "required|in_list[header,footer]",
                "visible" => "required|in_list[0,1]",
            ];
            if (!is_array($r) || !$this->validateData($r, $rules)) {
                return $this->failValidationErrors(
                    "Invalid menu link " . ($i + 1),
                );
            }
            $clean[] = array_intersect_key($r, $rules) + ["position" => $i];
        }
        $db->transStart();
        $db->table("menu_items")->emptyTable();
        if ($clean) {
            $db->table("menu_items")->insertBatch($clean);
        }
        $this->auditEvent("navigation:save");
        $db->transComplete();
        return $this->out(["saved" => true]);
    }
    public function details($product)
    {
        if (!$this->allowed("products")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        $r = Content::draft("products", (int) $product);
        if (!$r) {
            return $this->failNotFound();
        }
        if ($this->request->getMethod() === "GET") {
            return $this->out($r);
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $data = $this->request->getJSON(true);
        if (!is_array($data)) {
            return $this->failValidationErrors("Invalid details");
        }
        foreach (["specifications", "variants"] as $k) {
            if (!is_array($data[$k] ?? null) || count($data[$k]) > 100) {
                return $this->failValidationErrors("Maximum 100 " . $k);
            }
            foreach ($data[$k] as $row) {
                if (
                    !is_array($row) ||
                    !$this->validateData($row, [
                        "label" => "required|max_length[200]",
                        "value" => "required|max_length[1000]",
                    ])
                ) {
                    return $this->failValidationErrors(
                        "Each " . $k . " row needs a label and value",
                    );
                }
            }
        }
        if (
            !is_array($data["gallery"] ?? null) ||
            count($data["gallery"]) > 20
        ) {
            return $this->failValidationErrors("Maximum 20 gallery images");
        }
        foreach ($data["gallery"] as $id) {
            if (
                !is_int($id) ||
                !$db->table("media_files")->where("id", $id)->countAllResults()
            ) {
                return $this->failValidationErrors("Unknown gallery image");
            }
        }
        $db->transStart();
        $db->table("content_versions")->insert([
            "module" => "products",
            "record_id" => (int) $product,
            "content" => json_encode($r),
            "created_at" => date("Y-m-d H:i:s"),
        ]);
        foreach (
            [
                "specifications" => "product_specifications",
                "variants" => "product_variants",
            ]
            as $key => $table
        ) {
            $db->table($table)->where("product_id", (int) $product)->delete();
            foreach ($data[$key] as $i => $row) {
                $db->table($table)->insert([
                    "product_id" => (int) $product,
                    "label" => $row["label"],
                    "value" => $row["value"],
                    "position" => $i,
                ]);
            }
        }
        $db->table("product_images")
            ->where("product_id", (int) $product)
            ->delete();
        foreach (array_unique($data["gallery"]) as $i => $id) {
            $db->table("product_images")->insert([
                "product_id" => (int) $product,
                "media_id" => $id,
                "position" => $i,
            ]);
        }
        $db->table("products")
            ->where("id", (int) $product)
            ->update(["status" => "draft"]);
        $this->auditEvent("products:details:" . $product);
        $db->transComplete();
        return $this->out(["saved" => true]);
    }
    public function datasheet($product)
    {
        if (!$this->allowed("products", "update") || !$this->csrf()) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if (
            !$db
                ->table("products")
                ->where("id", (int) $product)
                ->countAllResults()
        ) {
            return $this->failNotFound();
        }
        $f = $this->request->getFile("file");
        if (
            !$f ||
            !$f->isValid() ||
            $f->getSize() > 10 * 1024 * 1024 ||
            strtolower($f->getClientExtension()) !== "pdf" ||
            $f->getMimeType() !== "application/pdf" ||
            file_get_contents($f->getTempName(), false, null, 0, 5) !== "%PDF-"
        ) {
            return $this->failValidationErrors(
                "Choose a PDF datasheet up to 10 MB",
            );
        }
        $dir = WRITEPATH . "documents";
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $name = bin2hex(random_bytes(24)) . ".pdf";
        $f->move($dir, $name);
        chmod($dir . "/" . $name, 0600);
        $db->transStart();
        $db->table("documents")->insert([
            "filename" => $name,
            "title" => "Product datasheet",
            "created_at" => date("Y-m-d H:i:s"),
        ]);
        $doc = (int) $db->insertID();
        $db->table("products")
            ->where("id", (int) $product)
            ->update(["datasheet_id" => $doc, "status" => "draft"]);
        $this->auditEvent("products:datasheet:" . $product);
        $db->transComplete();
        return $this->out(["saved" => true]);
    }
    public function document($id)
    {
        $db = db_connect();
        $r = $db
            ->table("documents")
            ->where("id", (int) $id)
            ->get()
            ->getRowArray();
        if (!$r) {
            return $this->failNotFound();
        }
        $public = false;
        foreach (
            $db
                ->table("content_publications")
                ->where("module", "products")
                ->select("content")
                ->get()
                ->getResultArray()
            as $p
        ) {
            $p = json_decode($p["content"], true);
            if ((int) ($p["datasheet"]["id"] ?? 0) === (int) $id) {
                $public = true;
            }
        }
        if (!$public && !$this->allowed("products")) {
            return $this->failNotFound();
        }
        return $this->response
            ->download(WRITEPATH . "documents/" . $r["filename"], null)
            ->setFileName("datasheet.pdf");
    }
    public function faqs($module, $id)
    {
        if (!in_array($module, Content::MODULES) || !$this->allowed($module)) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if (!$db->table($module)->where("id", (int) $id)->countAllResults()) {
            return $this->failNotFound();
        }
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db
                    ->table("faqs")
                    ->where(["module" => $module, "record_id" => (int) $id])
                    ->orderBy("position")
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $rows = $this->request->getJSON(true);
        if (!is_array($rows) || count($rows) > 30) {
            return $this->failValidationErrors("Maximum 30 FAQs");
        }
        foreach ($rows as $row) {
            if (
                !is_array($row) ||
                !$this->validateData($row, [
                    "question" => "required|max_length[300]",
                    "answer" => "required|max_length[3000]",
                ])
            ) {
                return $this->failValidationErrors(
                    "Invalid question or answer",
                );
            }
        }
        $db->transStart();
        $db->table("faqs")
            ->where(["module" => $module, "record_id" => (int) $id])
            ->delete();
        foreach ($rows as $i => $row) {
            $db->table("faqs")->insert([
                "module" => $module,
                "record_id" => (int) $id,
                "question" => $row["question"],
                "answer" => $row["answer"],
                "position" => $i,
            ]);
        }
        $db->table($module)
            ->where("id", (int) $id)
            ->update(["status" => "draft"]);
        $this->auditEvent($module . ":faqs:" . $id);
        $db->transComplete();
        return $this->out(["saved" => true]);
    }
    public function bulk()
    {
        if (!$this->allowed("products", "update") || !$this->csrf()) {
            return $this->failForbidden();
        }
        $data = $this->request->getJSON(true);
        if (
            !is_array($data) ||
            !in_array($data["status"] ?? "", [
                "draft",
                "published",
                "archived",
            ]) ||
            !is_array($data["ids"] ?? null) ||
            count($data["ids"]) > 100 ||
            !$data["ids"]
        ) {
            return $this->failValidationErrors(
                "Select 1–100 products and a valid status",
            );
        }
        if (
            $data["status"] !== "draft" &&
            !$this->allowed("products", "publish")
        ) {
            return $this->failForbidden();
        }
        $db = db_connect();
        $db->transBegin();
        try {
            foreach (array_unique($data["ids"]) as $id) {
                if (
                    !is_int($id) ||
                    !$db->table("products")->where("id", $id)->countAllResults()
                ) {
                    throw new \InvalidArgumentException("Unknown product");
                }
                $db->table("products")
                    ->where("id", $id)
                    ->update(["status" => $data["status"]]);
                if ($data["status"] === "published") {
                    Content::publish("products", $id);
                }
                if ($data["status"] === "archived") {
                    $db->table("content_publications")
                        ->where(["module" => "products", "record_id" => $id])
                        ->delete();
                }
            }
            $this->auditEvent(
                "products:bulk:" . $data["status"] . ":" . count($data["ids"]),
            );
            if (!$db->transStatus()) {
                throw new \RuntimeException("Conflict");
            }
            $db->transCommit();
            return $this->out(["saved" => true]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->fail("Bulk action failed. No changes saved.", 409);
        }
    }
    public function password()
    {
        if (!$this->user() || !$this->csrf()) {
            return $this->failForbidden();
        }
        $data = $this->request->getJSON(true) ?? [];
        if (
            !$this->validateData($data, [
                "current" => "required|max_length[128]",
                "password" => "required|min_length[14]|max_length[128]",
            ])
        ) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        if (!$this->throttle("password", 5)) {
            return $this->fail("Try again later", 429);
        }
        $u = $this->user();
        if (!password_verify($data["current"], $u["password"])) {
            return $this->failValidationErrors("Current password is incorrect");
        }
        $version = (int) $u["session_version"] + 1;
        db_connect()
            ->table("users")
            ->where("id", $u["id"])
            ->update([
                "password" => password_hash(
                    $data["password"],
                    PASSWORD_ARGON2ID,
                ),
                "session_version" => $version,
            ]);
        $_SESSION["version"] = $version;
        session_regenerate_id(true);
        $this->auditEvent("users:password:self");
        return $this->out(["saved" => true]);
    }
    public function permissions()
    {
        if (!$this->allowed("users")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db->table("role_permissions")->get()->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $rows = $this->request->getJSON(true);
        if (!is_array($rows) || count($rows) > 1000) {
            return $this->failValidationErrors("Invalid permissions");
        }
        $unique = [];
        foreach ($rows as $r) {
            if (
                !is_array($r) ||
                !in_array($r["role"] ?? "", [
                    "admin",
                    "editor",
                    "catalogue_manager",
                    "enquiry_manager",
                ]) ||
                !in_array($r["module"] ?? "", [
                    ...Content::MODULES,
                    "media",
                    "inquiries",
                    "applications",
                    "settings",
                    "navigation",
                    "system",
                    "audit_logs",
                ]) ||
                !in_array($r["action"] ?? "", [
                    "read",
                    "create",
                    "update",
                    "delete",
                    "publish",
                    "export",
                ]) ||
                !in_array($r["allowed"] ?? null, [0, 1], true)
            ) {
                return $this->failValidationErrors("Invalid permission");
            }
            $key = $r["role"] . ":" . $r["module"] . ":" . $r["action"];
            if (isset($unique[$key])) {
                return $this->failValidationErrors("Duplicate permission");
            }
            $unique[$key] = true;
        }
        $db->transStart();
        $db->table("role_permissions")->emptyTable();
        foreach ($rows as $r) {
            $db->table("role_permissions")->insert(
                array_intersect_key(
                    $r,
                    array_flip(["role", "module", "action", "allowed"]),
                ),
            );
        }
        $this->auditEvent("permissions:update");
        $db->transComplete();
        return $this->out(["saved" => true]);
    }
    public function system()
    {
        if (!$this->allowed("system")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        return $this->out([
            "database" => $db->query("PRAGMA quick_check")->getRowArray(),
            "php" => PHP_VERSION,
            "gd" => extension_loaded("gd"),
            "sqlite" => true,
            "smtp_configured" => (bool) env("STABLE_SMTP_HOST"),
            "counts" => [
                "pending_notifications" => $db
                    ->table("notification_queue")
                    ->where("status", "pending")
                    ->countAllResults(),
                "failed_notifications" => $db
                    ->table("notification_queue")
                    ->where("status", "failed")
                    ->countAllResults(),
            ],
            "retention_days" => (int) env("STABLE_RETENTION_DAYS", 0),
            "backup_schedule" =>
                "php spark stable:backup (configure your scheduler)",
        ]);
    }
    public function backup()
    {
        if (!$this->allowed("system", "export") || !$this->csrf()) {
            return $this->failForbidden();
        }
        $dir = WRITEPATH . "backups";
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $file =
            $dir .
            "/stable-" .
            date("Ymd-His") .
            "-" .
            bin2hex(random_bytes(4)) .
            ".sqlite";
        $db = db_connect();
        $db->query("VACUUM INTO " . $db->escape($file));
        chmod($file, 0600);
        $this->auditEvent("system:backup");
        return $this->response
            ->download($file, null)
            ->setFileName("stable-backup.sqlite");
    }
    public function purge($kind, $id)
    {
        $module = $kind === "applications" ? "applications" : "inquiries";
        if (
            !in_array($kind, ["applications", "inquiries"]) ||
            !$this->allowed($module, "delete") ||
            !$this->csrf()
        ) {
            return $this->failForbidden();
        }
        $db = db_connect();
        $row = $db
            ->table($module)
            ->where("id", (int) $id)
            ->get()
            ->getRowArray();
        if (!$row) {
            return $this->failNotFound();
        }
        $db->transStart();
        $db->table("notification_queue")
            ->whereIn('event', $kind === 'applications' ? ['application','application_confirmation'] : [$row['kind']])
            ->where('record_id', (int)$id)
            ->delete();
        if ($kind === "inquiries") {
            $db->table("quote_items")->where("inquiry_id", (int) $id)->delete();
        }
        $db->table($module)->where("id", (int) $id)->delete();
        $this->auditEvent($kind . ":delete:" . $id);
        $db->transComplete();
        $file =
            $kind === "applications"
                ? $row["filename"] ?? null
                : $row["attachment"] ?? null;
        if ($file) {
            @unlink(
                WRITEPATH .
                    ($kind === "applications" ? "resumes/" : "boqs/") .
                    $file,
            );
        }
        return $this->out(["deleted" => true]);
    }
}
