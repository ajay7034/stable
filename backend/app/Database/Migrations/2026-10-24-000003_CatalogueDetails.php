<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class CatalogueDetails extends Migration
{
    public function up()
    {
        $this->forge->addColumn("products", [
            "product_code" => ["type" => "TEXT", "default" => ""],
            "availability" => ["type" => "TEXT", "default" => "enquire"],
            "features" => ["type" => "TEXT", "default" => ""],
            "applications" => ["type" => "TEXT", "default" => ""],
            "specifications" => ["type" => "TEXT", "default" => ""],
            "variants" => ["type" => "TEXT", "default" => ""],
        ]);
        $this->forge->addColumn("categories", [
            "parent_id" => ["type" => "INTEGER", "null" => true],
        ]);
    }
    public function down()
    {
        $this->forge->dropColumn("products", [
            "product_code",
            "availability",
            "features",
            "applications",
            "specifications",
            "variants",
        ]);
        $this->forge->dropColumn("categories", "parent_id");
    }
}
