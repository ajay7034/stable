<?php
namespace App\Database\Seeds;
use CodeIgniter\Database\Seeder;
class CompanySeeder extends Seeder
{
    public function run()
    {
        $now = date("Y-m-d H:i:s");
        $settings = [
            "company_name" => "STABLE BUILDING MATERIALS TRADING LLC",
            "phone" => "+971 52 546 3574",
            "whatsapp" => "971525463574",
            "email" => "Stableuae2025@yahoo.com",
            "address" =>
                "Shop No. 2, Elegant Building, Al Jurf Industrial Area 2, Ajman, UAE",
        ];
        foreach ($settings as $key => $value) {
            if (
                !$this->db
                    ->table("site_settings")
                    ->where("key", $key)
                    ->countAllResults()
            ) {
                $this->db
                    ->table("site_settings")
                    ->insert(compact("key", "value"));
            }
        }
        $categories = [
            "Hardware",
            "Power Tools",
            "Plumbing Materials",
            "Sanitary Ware",
            "Ceramics & Tiles",
            "Electrical Materials",
            "Cement Products",
            "Waterproofing Materials",
        ];
        foreach ($categories as $title) {
            $slug = strtolower(
                trim(preg_replace("/[^a-z0-9]+/i", "-", $title), "-"),
            );
            $this->put("categories", [
                "title" => $title,
                "slug" => $slug,
                "description" => "Discuss your $title requirements with Stable. Share the application and specifications so our team can assist with your enquiry.",
                "status" => "published",
                "created_at" => $now,
                "updated_at" => $now,
            ]);
        }
        $pages = [
            [
                "home",
                "Built on trust. Ready for every project.",
                "Building materials for the spaces you imagine. Wholesale and retail supply in Ajman, with service at the centre.",
                "Stable Building Materials Trading LLC supplies materials for contractors, builders, businesses and retail customers. From practical requirements to finishing details, we help you take the next step.",
            ],
            [
                "about",
                "Materials matter. So does trust.",
                "Your building materials supplier in Al Jurf, Ajman.",
                "We support construction requirements with wholesale and retail enquiries, customer-focused assistance and quality-focused material selection. Always Trusted is our guiding brand theme.",
            ],
            [
                "contact",
                "Let’s talk materials.",
                "Tell us what your project needs.",
                "Shop No. 2, Elegant Building, Al Jurf Industrial Area 2, Ajman, UAE. Company contact: +971 52 546 3574. Email: Stableuae2025@yahoo.com",
            ],
            [
                "request-quote",
                "Your project starts here.",
                "Send us your material list and quantities.",
                "Our team will review your requirements and confirm pricing and availability.",
            ],
            [
                "privacy-policy",
                "Privacy notice",
                "Draft — pending business and legal review.",
                "Enquiry details are used to respond to your request. Please contact Stable for questions about your personal information. Retention periods and the final policy must be confirmed before launch.",
            ],
            [
                "terms-and-conditions",
                "Terms and conditions",
                "Draft — pending legal review.",
                "Product information is for enquiry purposes. Final specifications, availability and pricing must be confirmed by the company.",
            ],
        ];
        foreach ($pages as [$slug, $title, $description, $body]) {
            $this->put(
                "pages",
                compact("slug", "title", "description", "body") + [
                    "status" => in_array($slug, [
                        "privacy-policy",
                        "terms-and-conditions",
                    ])
                        ? "draft"
                        : "published",
                    "created_at" => $now,
                    "updated_at" => $now,
                ],
            );
        }
    }
    private function put($t, $data)
    {
        if (
            !$this->db
                ->table($t)
                ->where("slug", $data["slug"])
                ->countAllResults()
        ) {
            $this->db->table($t)->insert($data);
            if (($data['status'] ?? '') === 'published') \App\Services\Content::publish($t, (int)$this->db->insertID());
        }
    }
}
