<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class QuoteItems extends Migration
{
    public function up()
    {
        $this->forge->addColumn("inquiries", [
            "attachment" => ["type" => "TEXT", "null" => true],
        ]);
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "inquiry_id" => ["type" => "INTEGER"],
            "product_id" => ["type" => "INTEGER"],
            "quantity" => ["type" => "INTEGER"],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addForeignKey(
            "inquiry_id",
            "inquiries",
            "id",
            "CASCADE",
            "CASCADE",
        );
        $this->forge->addForeignKey(
            "product_id",
            "products",
            "id",
            "RESTRICT",
            "RESTRICT",
        );
        $this->forge->createTable("quote_items");
    }
    public function down()
    {
        $this->forge->dropTable("quote_items");
        $this->forge->dropColumn("inquiries", "attachment");
    }
}
