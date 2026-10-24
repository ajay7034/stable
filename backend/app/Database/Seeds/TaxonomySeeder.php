<?php
namespace App\Database\Seeds;
use CodeIgniter\Database\Seeder;
class TaxonomySeeder extends Seeder
{
    public function run()
    {
        if (
            $this->db
                ->table("site_settings")
                ->where("key", "taxonomy_seeded")
                ->countAllResults()
        ) {
            return;
        }
        $families = [
            "hardware" => [
                "Fasteners & Fixings",
                "Locks & Door Hardware",
                "Hand Tools",
            ],
            "power-tools" => [
                "Drills & Drivers",
                "Cutting & Grinding Tools",
                "Tool Accessories",
            ],
            "plumbing-materials" => [
                "Pipes & Fittings",
                "Valves & Connections",
                "Plumbing Accessories",
            ],
            "sanitary-ware" => [
                "Basins & Sinks",
                "Taps & Mixers",
                "Bathroom Accessories",
            ],
            "ceramics-tiles" => [
                "Wall Tiles",
                "Floor Tiles",
                "Tile Accessories",
            ],
            "electrical-materials" => [
                "Wires & Cables",
                "Switches & Sockets",
                "Electrical Accessories",
            ],
            "cement-products" => ["Cement & Mortar", "Concrete Accessories"],
            "waterproofing-materials" => [
                "Waterproofing Membranes",
                "Waterproofing Coatings",
            ],
            "" => [
                "Blocks",
                "Plywood & Timber",
                "Paints",
                "Steel",
                "Sand & Aggregates",
                "Safety Equipment",
            ],
        ];
        foreach ($families as $parent => $names) {
            $p = $parent
                ? $this->db
                    ->table("categories")
                    ->where("slug", $parent)
                    ->get()
                    ->getRowArray()
                : null;
            foreach ($names as $name) {
                $slug = strtolower(
                    trim(preg_replace("/[^a-z0-9]+/i", "-", $name), "-"),
                );
                if (
                    !$this->db
                        ->table("categories")
                        ->where("slug", $slug)
                        ->countAllResults()
                ) {
                    $this->db
                        ->table("categories")
                        ->insert([
                            "title" => $name,
                            "slug" => $slug,
                            "status" => "draft",
                            "parent_id" => $p["id"] ?? null,
                            "description" =>
                                "Candidate category awaiting supplier and product verification.",
                            "body" =>
                                "Confirm the range, specifications and availability before publishing this category.",
                            "created_at" => date("Y-m-d H:i:s"),
                            "updated_at" => date("Y-m-d H:i:s"),
                        ]);
                }
            }
        }
        $this->db
            ->table("site_settings")
            ->insert(["key" => "taxonomy_seeded", "value" => "1"]);
    }
}
