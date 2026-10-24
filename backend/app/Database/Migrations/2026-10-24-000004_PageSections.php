<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class PageSections extends Migration
{
    public function up()
    {
        $this->forge->addField([
            "id" => ["type" => "INTEGER", "auto_increment" => true],
            "page_id" => ["type" => "INTEGER"],
            "position" => ["type" => "INTEGER"],
            "kind" => ["type" => "TEXT"],
            "heading" => ["type" => "TEXT"],
            "eyebrow" => ["type" => "TEXT"],
            "body" => ["type" => "TEXT"],
            "button_label" => ["type" => "TEXT"],
            "button_href" => ["type" => "TEXT"],
            "visible" => ["type" => "INTEGER", "default" => 1],
        ]);
        $this->forge->addKey("id", true);
        $this->forge->addForeignKey(
            "page_id",
            "pages",
            "id",
            "CASCADE",
            "CASCADE",
        );
        $this->forge->createTable("page_sections");
        $home = $this->db
            ->table("pages")
            ->where("slug", "home")
            ->get()
            ->getRowArray();
        if ($home) {
            $rows = [
                [
                    "intro",
                    "A dependable place to begin.",
                    "01 / BUILT AROUND YOUR NEEDS",
                    $home["body"],
                    "Get to know Stable",
                    "/about",
                ],
                [
                    "categories",
                    "From foundation to finishing touch.",
                    "02 / MATERIALS THAT MATTER",
                    "",
                    "Explore the catalogue",
                    "/products",
                ],
                [
                    "cta",
                    "One material list. A conversation that counts.",
                    "LET’S GET YOUR PROJECT MOVING",
                    "Share your BOQ or material requirements. Our team will help you discuss pricing and availability.",
                    "Request a quotation",
                    "/request-quote",
                ],
            ];
            foreach ($rows as $i => $r) {
                $this->db
                    ->table("page_sections")
                    ->insert(
                        array_combine(
                            [
                                "kind",
                                "heading",
                                "eyebrow",
                                "body",
                                "button_label",
                                "button_href",
                            ],
                            $r,
                        ) + [
                            "page_id" => $home["id"],
                            "position" => $i,
                            "visible" => 1,
                        ],
                    );
            }
        }
    }
    public function down()
    {
        $this->forge->dropTable("page_sections");
    }
}
