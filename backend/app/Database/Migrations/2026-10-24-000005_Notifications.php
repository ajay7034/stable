<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class Notifications extends Migration
{
    public function up()
    {
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "event" => ["type" => "TEXT"],
            "record_id" => ["type" => "INTEGER"],
            "status" => ["type" => "TEXT", "default" => "pending"],
            "attempts" => ["type" => "INTEGER", "default" => 0],
            "next_attempt" => ["type" => "INTEGER", "default" => 0],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addKey(["status", "next_attempt"]);
        $this->forge->createTable("notification_queue");
    }
    public function down()
    {
        $this->forge->dropTable("notification_queue");
    }
}
