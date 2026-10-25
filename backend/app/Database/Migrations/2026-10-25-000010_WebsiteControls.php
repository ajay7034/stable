<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
use App\Services\WebsiteSettings;

class WebsiteControls extends Migration
{
    public function up()
    {
        WebsiteSettings::installDefaults();
    }
    public function down() { /* Preserve published settings and imported media on rollback. */ }
}
