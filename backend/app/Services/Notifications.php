<?php
namespace App\Services;
class Notifications
{
    public static function enqueue(string $event, int $id): void
    {
        try {
            db_connect()
                ->table("notification_queue")
                ->insert([
                    "event" => $event,
                    "record_id" => $id,
                    "created_at" => date("Y-m-d H:i:s"),
                ]);
            if ($event === 'application' && filter_var(env('STABLE_APPLICANT_CONFIRMATIONS', false), FILTER_VALIDATE_BOOLEAN)) {
                db_connect()->table('notification_queue')->insert(['event'=>'application_confirmation','record_id'=>$id,'created_at'=>date('Y-m-d H:i:s')]);
            }
        } catch (\Throwable $e) {
            log_message(
                "error",
                "Notification queue write failed; submission remains stored.",
            );
        }
    }
}
