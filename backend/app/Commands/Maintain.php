<?php
namespace App\Commands;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
class Maintain extends BaseCommand
{
    protected $group = "Stable";
    protected $name = "stable:maintain";
    protected $description = "Publish scheduled content and optionally purge closed enquiries after the configured retention period.";
    public function run(array $params)
    {
        \App\Services\Content::scheduled();
        $days = (int) env("STABLE_RETENTION_DAYS", 0);
        if ($days < 1) {
            CLI::write("Scheduled content checked. Retention is disabled.");
            return;
        }
        $db = db_connect();
        $count = 0;
        foreach (["inquiries", "applications"] as $table) {
            $rows = $db
                ->table($table)
                ->where("status", "closed")
                ->where(
                    "created_at <",
                    date("Y-m-d H:i:s", time() - $days * 86400),
                )
                ->limit(500)
                ->get()
                ->getResultArray();
            foreach ($rows as $row) {
                $db->transStart();
                $events =
                    $table === "applications"
                        ? ["application", "application_confirmation"]
                        : [$row["kind"]];
                $db->table("notification_queue")
                    ->whereIn("event", $events)
                    ->where("record_id", $row["id"])
                    ->delete();
                if ($table === "inquiries") {
                    $db->table("quote_items")
                        ->where("inquiry_id", $row["id"])
                        ->delete();
                }
                $db->table($table)->where("id", $row["id"])->delete();
                $db->transComplete();
                if (!$db->transStatus()) {
                    continue;
                }
                $file =
                    $table === "applications"
                        ? $row["filename"] ?? null
                        : $row["attachment"] ?? null;
                if ($file) {
                    @unlink(
                        WRITEPATH .
                            ($table === "applications" ? "resumes/" : "boqs/") .
                            basename($file),
                    );
                }
                $count++;
            }
        }
        CLI::write(
            "Scheduled content checked; purged " .
                $count .
                " closed records under the configured retention policy.",
        );
    }
}
