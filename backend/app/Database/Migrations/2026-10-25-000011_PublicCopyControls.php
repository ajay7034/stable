<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
use App\Services\WebsiteSettings;
class PublicCopyControls extends Migration
{
    public function up() { WebsiteSettings::installDefaults(); }
    public function down() { /* Keep operator-authored website copy. */ }
}
