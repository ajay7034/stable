<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class ExtendCms extends Migration
{
    public function up()
    {
        $this->forge->addColumn("users", [
            "session_version" => ["type" => "INTEGER", "default" => 1],
        ]);
        foreach (
            ["pages", "categories", "products", "blogs", "careers"]
            as $table
        ) {
            $this->forge->addColumn($table, [
                "seo_title" => ["type" => "TEXT", "default" => ""],
                "seo_description" => ["type" => "TEXT", "default" => ""],
                "cover_id" => ["type" => "INTEGER", "null" => true],
            ]);
        }
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "filename" => ["type" => "TEXT"],
            "mime" => ["type" => "TEXT"],
            "size" => ["type" => "INTEGER"],
            "alt" => ["type" => "TEXT"],
            "source_url" => ["type" => "TEXT"],
            "owner" => ["type" => "TEXT"],
            "license" => ["type" => "TEXT"],
            "width" => ["type" => "INTEGER"],
            "height" => ["type" => "INTEGER"],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->createTable("media_files");
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "job_id" => ["type" => "INTEGER"],
            "name" => ["type" => "TEXT"],
            "email" => ["type" => "TEXT"],
            "phone" => ["type" => "TEXT"],
            "message" => ["type" => "TEXT"],
            "filename" => ["type" => "TEXT", "null" => true],
            "status" => ["type" => "TEXT", "default" => "new"],
            "notes" => ["type" => "TEXT", "default" => ""],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addForeignKey(
            "job_id",
            "careers",
            "id",
            "RESTRICT",
            "RESTRICT",
        );
        $this->forge->createTable("applications");
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "module" => ["type" => "TEXT"],
            "record_id" => ["type" => "INTEGER"],
            "content" => ["type" => "TEXT"],
            "created_at" => ["type" => "DATETIME"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addKey(["module", "record_id"]);
        $this->forge->createTable("content_versions");
    }
    public function down()
    {
        foreach (["content_versions", "applications", "media_files"] as $t) {
            $this->forge->dropTable($t);
        }
        foreach (
            ["pages", "categories", "products", "blogs", "careers"]
            as $t
        ) {
            $this->forge->dropColumn($t, [
                "seo_title",
                "seo_description",
                "cover_id",
            ]);
        }
        $this->forge->dropColumn("users", "session_version");
    }
}
