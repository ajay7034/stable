<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
use App\Services\WebsiteSettings;
class BrandCollection extends Migration
{
    public function up() { WebsiteSettings::installDefaults(); }
    public function down() { /* Preserve operator-managed brand content and media. */ }
}
