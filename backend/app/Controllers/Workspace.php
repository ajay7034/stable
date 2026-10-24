<?php
namespace App\Controllers;
class Workspace extends Api
{
    private function audit($action)
    {
        db_connect()
            ->table("audit_logs")
            ->insert([
                "user_id" => $_SESSION["uid"],
                "action" => $action,
                "created_at" => date("Y-m-d H:i:s"),
            ]);
    }
    public function dashboard()
    {
        if (!$this->user()) {
            return $this->failUnauthorized();
        }
        $data = [];
        foreach (
            ["products", "categories", "blogs", "inquiries", "applications"]
            as $t
        ) {
            if ($this->allowed($t)) {
                $data[] = [
                    "title" => ucfirst($t),
                    "count" => db_connect()->table($t)->countAllResults(),
                ];
            }
        }
        return $this->out($data);
    }
    public function media($id = null)
    {
        if (!$this->allowed("media")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        $method = $this->request->getMethod();
        if ($method === "GET") {
            $q = $db->table("media_files");
            $search = $this->request->getGet("q");
            if (is_string($search) && $search !== "") {
                $q->like("alt", substr($search, 0, 100));
            }
            return $this->out(
                $q->orderBy("id", "DESC")->limit(200)->get()->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden("Invalid CSRF token");
        }
        if ($method === "DELETE") {
            $row = $db
                ->table("media_files")
                ->where("id", (int) $id)
                ->get()
                ->getRowArray();
            if (!$row) {
                return $this->failNotFound();
            }
            if (\App\Services\Content::mediaUsed((int) $id)) {
                return $this->fail(
                    "Image is used by content, a live publication or revision history.",
                    409,
                );
            }
            $db->table("media_files")->where("id", (int) $id)->delete();
            @unlink(WRITEPATH . "media/" . $row["filename"]);
            if ($row["thumbnail"]) {
                @unlink(WRITEPATH . "media/" . $row["thumbnail"]);
            }
            $this->audit("media:delete:" . $id);
            return $this->out(["deleted" => true]);
        }
        $data =
            $method === "PUT"
                ? $this->request->getJSON(true) ?? []
                : $this->request->getPost();
        $rules = [
            "folder" => "permit_empty|max_length[100]",
            "alt" => "required|max_length[300]",
            "source_url" =>
                "permit_empty|valid_url_strict[https,http]|max_length[1000]",
            "owner" => "required|max_length[200]",
            "license" => "required|max_length[1000]",
        ];
        if (!$this->validateData($data, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        if ($method === "PUT") {
            if (
                !$id ||
                !$db
                    ->table("media_files")
                    ->where("id", (int) $id)
                    ->countAllResults()
            ) {
                return $this->failNotFound();
            }
            $db->table("media_files")
                ->where("id", (int) $id)
                ->update(array_intersect_key($data, $rules));
            $this->audit("media:metadata:" . $id);
            return $this->out(["saved" => true]);
        }
        $f = $this->request->getFile("file");
        if (!$f || !$f->isValid() || $f->getSize() > 5 * 1024 * 1024) {
            return $this->failValidationErrors("Choose an image up to 5 MB.");
        }
        $mime = $f->getMimeType();
        $ext =
            [
                "image/jpeg" => "jpg",
                "image/png" => "png",
                "image/webp" => "webp",
            ][$mime] ?? null;
        $size = @getimagesize($f->getTempName());
        if (
            !$ext ||
            !$size ||
            $size[0] * $size[1] > 24000000 ||
            $size[0] < 1 ||
            $size[1] < 1 ||
            $size["mime"] !== $mime
        ) {
            return $this->failValidationErrors(
                "Only valid JPEG, PNG and WebP images up to 24 megapixels are accepted.",
            );
        }
        $dir = WRITEPATH . "media";
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        if (!extension_loaded("gd")) {
            return $this->fail("Image processing is not available", 503);
        }
        $decoded = @imagecreatefromstring(file_get_contents($f->getTempName()));
        if (!$decoded) {
            return $this->failValidationErrors("Image decoding failed");
        }
        $max = max($size[0], $size[1]);
        if ($max > 2400) {
            $scaled = imagescale(
                $decoded,
                (int) round(($size[0] * 2400) / $max),
            );
            imagedestroy($decoded);
            $decoded = $scaled;
        }
        imagesavealpha($decoded, true);
        $filename = bin2hex(random_bytes(24)) . ".webp";
        $thumbnail = "thumb-" . $filename;
        if (!imagewebp($decoded, $dir . "/" . $filename, 88)) {
            imagedestroy($decoded);
            return $this->fail("Unable to process image", 500);
        }
        $thumb = imagescale($decoded, min(480, imagesx($decoded)));
        imagesavealpha($thumb, true);
        imagewebp($thumb, $dir . "/" . $thumbnail, 82);
        imagedestroy($thumb);
        $width = imagesx($decoded);
        $height = imagesy($decoded);
        imagedestroy($decoded);
        chmod($dir . "/" . $filename, 0600);
        chmod($dir . "/" . $thumbnail, 0600);
        $bytes = filesize($dir . "/" . $filename);
        $mime = "image/webp";
        try {
            $db->table("media_files")->insert(
                array_intersect_key($data, $rules) + [
                    "filename" => $filename,
                    "mime" => $mime,
                    "size" => $bytes,
                    "width" => $width,
                    "height" => $height,
                    "thumbnail" => $thumbnail,
                    "created_at" => date("Y-m-d H:i:s"),
                ],
            );
        } catch (\Throwable $e) {
            unlink($dir . "/" . $filename);
            @unlink($dir . "/" . $thumbnail);
            return $this->fail("Unable to store image", 500);
        }
        $this->audit("media:create:" . $db->insertID());
        return $this->out(["saved" => true], 201);
    }
    public function image($id)
    {
        $db = db_connect();
        $row = $db
            ->table("media_files")
            ->where("id", (int) $id)
            ->get()
            ->getRowArray();
        if (!$row) {
            return $this->failNotFound();
        }
        $visible = \App\Services\Content::mediaPublic((int) $id);
        if (!$visible && !$this->allowed("media")) {
            return $this->failNotFound();
        }
        return $this->response
            ->setHeader("Content-Type", $row["mime"])
            ->setHeader("X-Content-Type-Options", "nosniff")
            ->setHeader("Cache-Control", "private, no-store")
            ->setBody(
                file_get_contents(
                    WRITEPATH .
                        "media/" .
                        ($this->request->getGet("size") === "thumb" &&
                        $row["thumbnail"]
                            ? $row["thumbnail"]
                            : $row["filename"]),
                ),
            );
    }
    public function apply($job)
    {
        if (!$this->throttle("application", 5)) {
            return $this->fail("Try again later", 429);
        }
        $db = db_connect();
        if (!\App\Services\Content::live("careers", (int) $job)) {
            return $this->failNotFound();
        }
        $data = $this->request->getPost();
        if (!empty($data["website"])) {
            return $this->out(["received" => true], 201);
        }
        $rules = [
            "name" => "required|min_length[2]|max_length[150]",
            "email" => "required|valid_email|max_length[254]",
            "phone" => "required|max_length[40]",
            "message" => "required|min_length[10]|max_length[10000]",
            "consent" => "required|in_list[true]",
        ];
        if (!$this->validateData($data, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        $f = $this->request->getFile("resume");
        $filename = null;
        if ($f && $f->getError() !== UPLOAD_ERR_NO_FILE) {
            $extension = \App\Services\Resume::extension($f);
            if (!$extension) return $this->failValidationErrors('Resume must be a valid PDF, DOC or DOCX up to 5 MB.');
            $dir = WRITEPATH . "resumes";
            if (!is_dir($dir)) {
                mkdir($dir, 0700, true);
            }
            $filename = bin2hex(random_bytes(24)) . "." . $extension;
            $f->move($dir, $filename);
            chmod($dir . "/" . $filename, 0600);
        }
        $row = array_intersect_key(
            $data,
            array_flip(["name", "email", "phone", "message"]),
        );
        $db->table("applications")->insert(
            $row + [
                "job_id" => (int) $job,
                "filename" => $filename,
                "created_at" => date("Y-m-d H:i:s"),
            ],
        );
        \App\Services\Notifications::enqueue(
            "application",
            (int) $db->insertID(),
        );
        return $this->out(["received" => true], 201);
    }
    public function applications($id = null)
    {
        if (!$this->allowed("applications")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db
                    ->table("applications")
                    ->select(
                        "id,job_id,name,email,phone,message,status,notes,created_at",
                    )
                    ->orderBy("id", "DESC")
                    ->limit(200)
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $row = $db
            ->table("applications")
            ->where("id", (int) $id)
            ->get()
            ->getRowArray();
        if (!$row) {
            return $this->failNotFound();
        }
        if ($this->request->getMethod() === "DELETE") {
            $db->table("notification_queue")
                ->whereIn("event", ["application", "application_confirmation"])->where("record_id", (int)$id)
                ->delete();
            $db->table("applications")->where("id", (int) $id)->delete();
            if ($row["filename"]) {
                @unlink(WRITEPATH . "resumes/" . $row["filename"]);
            }
            $this->audit("application:delete:" . $id);
            return $this->out(["deleted" => true]);
        }
        $data = $this->request->getJSON(true) ?? [];
        if (
            !$this->validateData($data, [
                "status" => "required|in_list[new,in_progress,replied,closed]",
                "notes" => "permit_empty|max_length[10000]",
            ])
        ) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        $db->table("applications")
            ->where("id", (int) $id)
            ->update(
                array_intersect_key($data, array_flip(["status", "notes"])),
            );
        $this->audit("application:update:" . $id);
        return $this->out(["saved" => true]);
    }
    public function resume($id)
    {
        if (!$this->allowed("applications")) {
            return $this->failForbidden();
        }
        $row = db_connect()
            ->table("applications")
            ->where("id", (int) $id)
            ->get()
            ->getRowArray();
        if (!$row || !$row["filename"]) {
            return $this->failNotFound();
        }
        $this->audit("application:download:" . $id);
        return $this->response
            ->download(WRITEPATH . "resumes/" . $row["filename"], null)
            ->setFileName("resume." . pathinfo($row["filename"], PATHINFO_EXTENSION));
    }
    public function versions($module, $id)
    {
        if (
            !in_array($module, [
                "pages",
                "categories",
                "products",
                "blogs",
                "careers",
                "page_sections",
            ]) ||
            !$this->allowed($module === "page_sections" ? "pages" : $module)
        ) {
            return $this->failForbidden();
        }
        return $this->out(
            db_connect()
                ->table("content_versions")
                ->where(["module" => $module, "record_id" => (int) $id])
                ->orderBy("id", "DESC")
                ->limit(30)
                ->get()
                ->getResultArray(),
        );
    }
    public function preview($module, $id)
    {
        if (
            !in_array($module, [
                "pages",
                "categories",
                "products",
                "blogs",
                "careers",
            ]) ||
            !$this->allowed($module)
        ) {
            return $this->failForbidden();
        }
        return $this->out(\App\Services\Content::draft($module, (int) $id));
    }

    public function users($id = null)
    {
        if (!$this->allowed("users")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db
                    ->table("users")
                    ->select("id,email,role,active")
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $data = $this->request->getJSON(true) ?? [];
        $rules = [
            "email" => "required|valid_email|max_length[254]",
            "role" =>
                "required|in_list[super_admin,admin,editor,catalogue_manager,enquiry_manager]",
            "active" => "required|in_list[0,1]",
            "password" => "permit_empty|min_length[14]|max_length[128]",
        ];
        if (!$this->validateData($data, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        if (!$id && empty($data["password"])) {
            return $this->failValidationErrors(
                "New accounts require a password of at least 14 characters",
            );
        }
        if (
            $id == (string) $_SESSION["uid"] &&
            ($data["role"] !== "super_admin" || (int) $data["active"] !== 1)
        ) {
            return $this->failValidationErrors(
                "You cannot deactivate or demote your own account",
            );
        }
        $row = [
            "email" => strtolower($data["email"]),
            "role" => $data["role"],
            "active" => (int) $data["active"],
        ];
        if (!empty($data["password"])) {
            $row["password"] = password_hash(
                $data["password"],
                PASSWORD_ARGON2ID,
            );
        }
        try {
            if ($id) {
                $old = $db
                    ->table("users")
                    ->where("id", (int) $id)
                    ->get()
                    ->getRowArray();
                if (!$old) {
                    return $this->failNotFound();
                }
                $row["session_version"] = $old["session_version"] + 1;
                $db->table("users")->where("id", (int) $id)->update($row);
            } else {
                $db->table("users")->insert($row);
            }
        } catch (\Throwable $e) {
            return $this->fail("Email already exists", 409);
        }
        $this->audit("users:save:" . ($id ?? $db->insertID()));
        return $this->out(["saved" => true]);
    }
    public function export($module)
    {
        if (
            !in_array($module, ["products", "inquiries", "applications"]) ||
            !$this->allowed($module, "export")
        ) {
            return $this->failForbidden();
        }
        $fields =
            $module === "products"
                ? [
                    "title",
                    "slug",
                    "description",
                    "body",
                    "status",
                    "category_id",
                ]
                : [
                    "id",
                    "name",
                    "email",
                    "phone",
                    "message",
                    "status",
                    "notes",
                    "created_at",
                ];
        $records = db_connect()
            ->table($module)
            ->select(implode(",", $fields))
            ->get()
            ->getResultArray();
        $stream = fopen("php://temp", "r+");
        fputcsv($stream, $fields, ",", '"', "");
        foreach ($records as $r) {
            $values = [];
            foreach ($r as $v) {
                $v = (string) $v;
                if (preg_match('/^[=+@\-\t\r]/', $v)) {
                    $v = "'" . $v;
                }
                $values[] = $v;
            }
            fputcsv($stream, $values, ",", '"', "");
        }
        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);
        $this->audit($module . ":export");
        return $this->response
            ->setHeader("Content-Type", "text/csv; charset=utf-8")
            ->setHeader(
                "Content-Disposition",
                'attachment; filename="' . $module . '.csv"',
            )
            ->setHeader("Cache-Control", "no-store")
            ->setBody($csv);
    }
    public function import()
    {
        if (!$this->allowed("products") || !$this->csrf()) {
            return $this->failForbidden();
        }
        $f = $this->request->getFile("file");
        if (
            !$f ||
            !$f->isValid() ||
            $f->getSize() > 1024 * 1024 ||
            strtolower($f->getClientExtension()) !== "csv"
        ) {
            return $this->failValidationErrors("Choose a CSV up to 1 MB");
        }
        $h = fopen($f->getTempName(), "r");
        $header = fgetcsv($h, 0, ",", '"', "");
        if (
            $header !== [
                "title",
                "slug",
                "description",
                "body",
                "status",
                "category_id",
            ]
        ) {
            fclose($h);
            return $this->failValidationErrors(
                "Use the product export column headers",
            );
        }
        $db = db_connect();
        $rows = [];
        $seen = [];
        $errors = [];
        $line = 1;
        while (($values = fgetcsv($h, 0, ",", '"', "")) !== false) {
            $line++;
            if ($line > 1001) {
                $errors[] = "Maximum 1000 records";
                break;
            }
            if (count($values) !== 6) {
                $errors[] = "Row $line: expected six columns";
                continue;
            }
            $r = array_combine($header, $values);
            $r["status"] = "draft";
            if (
                !$this->validateData($r, [
                    "title" => "required|max_length[200]",
                    "slug" =>
                        'required|regex_match[/^[a-z0-9]+(?:-[a-z0-9]+)*$/]|max_length[200]',
                    "description" => "permit_empty|max_length[3000]",
                    "body" => "permit_empty|max_length[50000]",
                ])
            ) {
                $errors[] = "Row $line: invalid title, slug or text length";
                continue;
            }
            if (
                isset($seen[$r["slug"]]) ||
                $db
                    ->table("products")
                    ->where("slug", $r["slug"])
                    ->countAllResults()
            ) {
                $errors[] = "Row $line: duplicate slug";
                continue;
            }
            $seen[$r["slug"]] = true;
            if (
                $r["category_id"] !== "" &&
                (!ctype_digit($r["category_id"]) ||
                    !$db
                        ->table("categories")
                        ->where("id", (int) $r["category_id"])
                        ->countAllResults())
            ) {
                $errors[] = "Row $line: unknown category";
                continue;
            }
            $r["category_id"] =
                $r["category_id"] === "" ? null : (int) $r["category_id"];
            $r["created_at"] = $r["updated_at"] = date("Y-m-d H:i:s");
            $rows[] = $r;
        }
        fclose($h);
        if ($errors) {
            return $this->failValidationErrors($errors);
        }
        if (!$rows) {
            return $this->failValidationErrors("CSV contains no records");
        }
        $db->transStart();
        $db->table("products")->insertBatch($rows);
        $db->transComplete();
        if (!$db->transStatus()) {
            return $this->fail("Import conflict; no records saved", 409);
        }
        $this->audit("products:import:" . count($rows));
        return $this->out(["imported" => count($rows)]);
    }

    public function sections($page)
    {
        if (!$this->allowed("pages")) {
            return $this->failForbidden();
        }
        $db = db_connect();
        if (!$db->table("pages")->where("id", (int) $page)->countAllResults()) {
            return $this->failNotFound();
        }
        if ($this->request->getMethod() === "GET") {
            return $this->out(
                $db
                    ->table("page_sections")
                    ->where("page_id", (int) $page)
                    ->orderBy("position")
                    ->get()
                    ->getResultArray(),
            );
        }
        if (!$this->csrf()) {
            return $this->failForbidden();
        }
        $rows = $this->request->getJSON(true);
        if (!is_array($rows) || !array_is_list($rows) || count($rows) > 30) {
            return $this->failValidationErrors("Maximum 30 sections");
        }
        $safe = [];
        foreach ($rows as $i => $r) {
            $rules = [
                "kind" =>
                    "required|in_list[intro,categories,cta,values,approach,journal,contact]",
                "heading" => "required|max_length[300]",
                "eyebrow" => "permit_empty|max_length[200]",
                "body" => "permit_empty|max_length[10000]",
                "button_label" => "permit_empty|max_length[100]",
                "button_href" =>
                    'permit_empty|regex_match[/^\/[a-z0-9\/-]*$/]|max_length[200]',
                "visible" => "required|in_list[0,1]",
            ];
            if (!is_array($r) || !$this->validateData($r, $rules)) {
                return $this->failValidationErrors(
                    "Invalid section " . ($i + 1),
                );
            }
            $safe[] = array_intersect_key($r, $rules) + [
                "page_id" => (int) $page,
                "position" => $i,
            ];
        }
        $db->transStart();
        $old = $db
            ->table("page_sections")
            ->where("page_id", (int) $page)
            ->orderBy("position")
            ->get()
            ->getResultArray();
        $db->table("content_versions")->insert([
            "module" => "page_sections",
            "record_id" => (int) $page,
            "content" => json_encode($old),
            "created_at" => date("Y-m-d H:i:s"),
        ]);
        $db->table("page_sections")->where("page_id", (int) $page)->delete();
        if ($safe) {
            $db->table("page_sections")->insertBatch($safe);
        }
        $db->transComplete();
        if (!$db->transStatus()) {
            return $this->fail("Unable to save sections", 500);
        }
        $db->table("pages")
            ->where("id", (int) $page)
            ->update(["status" => "draft"]);
        $this->audit("page_sections:save:" . $page);
        return $this->out(["saved" => true]);
    }
    public function notifications()
    {
        if (!$this->allowed("system")) {
            return $this->failForbidden();
        }
        $rows = db_connect()
            ->table("notification_queue")
            ->orderBy("id", "DESC")
            ->limit(200)
            ->get()
            ->getResultArray();
        return $this->out($rows);
    }
    public function boq($id)
    {
        if (!$this->allowed("inquiries")) {
            return $this->failForbidden();
        }
        $row = db_connect()
            ->table("inquiries")
            ->where(["id" => (int) $id, "kind" => "quotes"])
            ->get()
            ->getRowArray();
        if (!$row || !$row["attachment"]) {
            return $this->failNotFound();
        }
        $this->audit("quote:download:" . $id);
        return $this->response
            ->download(WRITEPATH . "boqs/" . $row["attachment"], null)
            ->setFileName("material-list.pdf");
    }
}
