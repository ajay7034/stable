<?php
namespace App\Services;
class Content
{
    public const MODULES = [
        "pages",
        "categories",
        "products",
        "blogs",
        "careers",
    ];
    public static function draft(string $module, int $id): ?array
    {
        if (!in_array($module, self::MODULES)) {
            return null;
        }
        $db = db_connect();
        $r = $db->table($module)->where("id", $id)->get()->getRowArray();
        if (!$r) {
            return null;
        }
        $r["faqs"] = $db
            ->table("faqs")
            ->where(["module" => $module, "record_id" => $id])
            ->orderBy("position")
            ->get()
            ->getResultArray();
        if ($module === "pages") {
            $r["sections"] = $db
                ->table("page_sections")
                ->where("page_id", $id)
                ->orderBy("position")
                ->get()
                ->getResultArray();
        }
        if ($module === "products") {
            foreach (
                [
                    "specifications" => "product_specifications",
                    "variants" => "product_variants",
                ]
                as $key => $table
            ) {
                $r[$key . "_list"] = $db
                    ->table($table)
                    ->where("product_id", $id)
                    ->orderBy("position")
                    ->get()
                    ->getResultArray();
            }
            $r["gallery"] = $db
                ->table("product_images")
                ->select("product_images.media_id,media_files.alt")
                ->join("media_files", "media_files.id=product_images.media_id")
                ->where("product_id", $id)
                ->orderBy("position")
                ->get()
                ->getResultArray();
            $r["datasheet"] = !empty($r["datasheet_id"])
                ? $db
                    ->table("documents")
                    ->select("id,title")
                    ->where("id", (int) $r["datasheet_id"])
                    ->get()
                    ->getRowArray()
                : null;
        }
        return $r;
    }
    public static function publish(string $module, int $id): void
    {
        $db = db_connect();
        $r = self::draft($module, $id);
        if (!$r) {
            throw new \InvalidArgumentException("Record not found");
        }
        $old = $db
            ->table("content_publications")
            ->where(["module" => $module, "record_id" => $id])
            ->get()
            ->getRowArray();
        if ($old && $old["slug"] !== $r["slug"]) {
            $db->table("redirects")
                ->where(["module" => $module, "old_slug" => $old["slug"]])
                ->delete();
            $db->table("redirects")->insert([
                "module" => $module,
                "old_slug" => $old["slug"],
                "record_id" => $id,
            ]);
        }
        $r["status"] = "published";
        $r["published_at"] = date("Y-m-d H:i:s");
        $row = [
            "module" => $module,
            "record_id" => $id,
            "slug" => $r["slug"],
            "title" => $r["title"],
            "category_id" => $r["category_id"],
            "featured" => $r["featured"],
            "tags" => $r["tags"],
            "content" => json_encode($r),
            "published_at" => $r["published_at"],
        ];
        if ($old) {
            $db->table("content_publications")
                ->where("id", $old["id"])
                ->update($row);
        } else {
            $db->table("content_publications")->insert($row);
        }
        $db->table($module)
            ->where("id", $id)
            ->update(["status" => "published", "publish_at" => null]);
    }
    public static function scheduled(): void
    {
        $lock = fopen(WRITEPATH . "publication-worker.lock", "c");
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
            if ($lock) {
                fclose($lock);
            }
            return;
        }
        try {
            $db = db_connect();
            foreach (self::MODULES as $module) {
                $rows = $db
                    ->table($module)
                    ->where("status", "scheduled")
                    ->where("publish_at <=", date("Y-m-d H:i:s"))
                    ->where("publish_at !=", null)
                    ->limit(20)
                    ->get()
                    ->getResultArray();
                foreach ($rows as $row) {
                    $db->transBegin();
                    try {
                        self::publish($module, (int) $row["id"]);
                        if (!$db->transStatus()) {
                            throw new \RuntimeException("Publication conflict");
                        }
                        $db->transCommit();
                    } catch (\Throwable $e) {
                        $db->transRollback();
                        log_message(
                            "error",
                            "Scheduled publication requires review: " .
                                $module .
                                " " .
                                $row["id"],
                        );
                    }
                }
            }
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
    public static function live(string $module, int $id): ?array
    {
        $row = db_connect()
            ->table("content_publications")
            ->where(["module" => $module, "record_id" => $id])
            ->get()
            ->getRowArray();
        return $row ? json_decode($row["content"], true) : null;
    }
    public static function mediaIds(array $r): array
    {
        $ids = [];
        if (!empty($r["cover_id"])) {
            $ids[] = (int) $r["cover_id"];
        }
        foreach ($r["gallery"] ?? [] as $image) {
            if (!empty($image["media_id"])) {
                $ids[] = (int) $image["media_id"];
            }
        }
        return $ids;
    }
    public static function mediaPublic(int $id): bool
    {
        if ($id > 0 && in_array($id, WebsiteSettings::imageIds(), true)) return true;
        foreach (
            db_connect()
                ->table("content_publications")
                ->select("content")
                ->get()
                ->getResultArray()
            as $r
        ) {
            if (
                in_array(
                    $id,
                    self::mediaIds(json_decode($r["content"], true) ?? []),
                )
            ) {
                return true;
            }
        }
        return false;
    }
    public static function mediaUsed(int $id): bool
    {
        if (self::mediaPublic($id)) {
            return true;
        }
        $db = db_connect();
        foreach (self::MODULES as $m) {
            if ($db->table($m)->where("cover_id", $id)->countAllResults()) {
                return true;
            }
        }
        if (
            $db
                ->table("product_images")
                ->where("media_id", $id)
                ->countAllResults()
        ) {
            return true;
        }
        foreach (
            $db
                ->table("content_versions")
                ->select("content")
                ->get()
                ->getResultArray()
            as $r
        ) {
            if (
                in_array(
                    $id,
                    self::mediaIds(json_decode($r["content"], true) ?? []),
                )
            ) {
                return true;
            }
        }
        return false;
    }
}
