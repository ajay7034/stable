<?php
namespace App\Commands;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
class SendNotifications extends BaseCommand
{
    protected $group = "Stable";
    protected $name = "stable:notifications";
    protected $description = "Deliver queued admin notifications using configured SMTP.";
    public function run(array $params)
    {
        $host = env("STABLE_SMTP_HOST");
        $from = env("STABLE_SMTP_FROM");
        $to = env("STABLE_NOTIFICATION_EMAIL");
        if (
            !$host ||
            !filter_var($from, FILTER_VALIDATE_EMAIL) ||
            !filter_var($to, FILTER_VALIDATE_EMAIL)
        ) {
            CLI::write("SMTP is not configured; notifications remain queued.");
            return;
        }
        $lock = fopen(WRITEPATH . "notification-worker.lock", "c");
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            CLI::write("A notification worker is already running.");
            return;
        }
        try {
            $db = db_connect();
            $queue = $db
                ->table("notification_queue")
                ->where("status", "pending")
                ->where("next_attempt <=", time())
                ->limit(25)
                ->get()
                ->getResultArray();
            foreach ($queue as $r) {
                $table = in_array($r["event"], [
                    "application",
                    "application_confirmation",
                ])
                    ? "applications"
                    : "inquiries";
                if (
                    !$db
                        ->table($table)
                        ->where("id", (int) $r["record_id"])
                        ->countAllResults()
                ) {
                    $db->table("notification_queue")
                        ->where("id", $r["id"])
                        ->update(["status" => "cancelled"]);
                    continue;
                }
                $email = service("email", null, false);
                $email->initialize([
                    "protocol" => "smtp",
                    "SMTPHost" => $host,
                    "SMTPUser" => env("STABLE_SMTP_USER", ""),
                    "SMTPPass" => env("STABLE_SMTP_PASSWORD", ""),
                    "SMTPPort" => (int) env("STABLE_SMTP_PORT", 587),
                    "SMTPCrypto" => env("STABLE_SMTP_CRYPTO", "tls"),
                    "mailType" => "text",
                    "charset" => "UTF-8",
                    "newline" => "\r\n",
                    "CRLF" => "\r\n",
                ]);
                $email->setFrom($from, "Stable website");
                $confirmation = $r["event"] === "application_confirmation";
                $recipient = $confirmation
                    ? $db
                        ->table("applications")
                        ->where("id", (int) $r["record_id"])
                        ->get()
                        ->getRowArray()["email"]
                    : $to;
                $email->setTo($recipient);
                $email->setSubject(
                    $confirmation
                        ? "Your application to Stable"
                        : "New Stable " . $r["event"],
                );
                $email->setMessage(
                    $confirmation
                        ? "Thank you for your interest in Stable Building Materials Trading LLC. Your application has been received. Our team will review it and contact you if there is a suitable next step. Reference " .
                            $r["record_id"] .
                            "."
                        : "A new " .
                            $r["event"] .
                            " was received. Reference " .
                            $r["record_id"] .
                            ". Sign in to the content studio to review it.",
                );
                try {
                    $sent = $email->send(false);
                } catch (\Throwable $e) {
                    $sent = false;
                }
                $attempts = $r["attempts"] + 1;
                $db->table("notification_queue")
                    ->where("id", $r["id"])
                    ->update([
                        "status" => $sent
                            ? "sent"
                            : ($attempts >= 5
                                ? "failed"
                                : "pending"),
                        "attempts" => $attempts,
                        "next_attempt" =>
                            time() + min(86400, 60 * 2 ** $attempts),
                    ]);
            }
            CLI::write("Processed " . count($queue) . " notification records.");
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
