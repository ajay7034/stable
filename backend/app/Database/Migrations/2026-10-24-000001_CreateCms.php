<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class CreateCms extends Migration
{
    public function up()
    {
        $this->db->query("PRAGMA journal_mode=WAL");
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "email" => ["type" => "VARCHAR", "constraint" => 254],
            "password" => ["type" => "VARCHAR", "constraint" => 255],
            "role" => ["type" => "VARCHAR", "constraint" => 40],
            "active" => ["type" => "INTEGER", "default" => 1],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addUniqueKey("email");
        $this->forge->createTable("users");
        foreach (
            ["pages", "categories", "products", "blogs", "careers"]
            as $table
        ) {
            $this->forge->addField([
                "id" => ["type" => "INTEGER", "auto_increment" => true],
                "title" => ["type" => "VARCHAR", "constraint" => 200],
                "slug" => ["type" => "VARCHAR", "constraint" => 200],
                "description" => ["type" => "TEXT", "default" => ""],
                "body" => ["type" => "TEXT", "default" => ""],
                "status" => [
                    "type" => "VARCHAR",
                    "constraint" => 20,
                    "default" => "draft",
                ],
                "category_id" => ["type" => "INTEGER", "null" => true],
                "created_at" => ["type" => "DATETIME"],
                "updated_at" => ["type" => "DATETIME"],
            ]);
            $this->forge->addKey("id", true);
            $this->forge->addUniqueKey("slug");
            $this->forge->addKey("status");
            if ($table === "products") {
                $this->forge->addForeignKey(
                    "category_id",
                    "categories",
                    "id",
                    "RESTRICT",
                    "RESTRICT",
                );
            }
            $this->forge->createTable($table);
        }
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "kind" => ["type" => "VARCHAR", "constraint" => 30],
            "name" => ["type" => "VARCHAR", "constraint" => 150],
            "email" => ["type" => "VARCHAR", "constraint" => 254],
            "phone" => ["type" => "VARCHAR", "constraint" => 40],
            "company" => [
                "type" => "VARCHAR",
                "constraint" => 200,
                "default" => "",
            ],
            "message" => ["type" => "TEXT"],
            "status" => [
                "type" => "VARCHAR",
                "constraint" => 20,
                "default" => "new",
            ],
            "notes" => ["type" => "TEXT", "default" => ""],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addKey(["kind", "status"]);
        $this->forge->createTable("inquiries");
        $this->forge->addField([
            "key" => ["type" => "VARCHAR", "constraint" => 100],
            "value" => ["type" => "TEXT"],
        ]);
        $this->forge->addKey("key", true);
        $this->forge->createTable("site_settings");
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "user_id" => ["type" => "INTEGER"],
            "action" => ["type" => "VARCHAR", "constraint" => 200],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->createTable("audit_logs");
    }
    public function down()
    {
        foreach (
            [
                "audit_logs",
                "site_settings",
                "inquiries",
                "products",
                "categories",
                "pages",
                "blogs",
                "careers",
                "users",
            ]
            as $t
        ) {
            $this->forge->dropTable($t, true);
        }
    }
}
