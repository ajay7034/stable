<?php
namespace App\Commands;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
class Backup extends BaseCommand
{
    protected $group = "Stable";
    protected $name = "stable:backup";
    protected $description = "Create a consistent private SQLite backup.";
    public function run(array $params)
    {
        $dir = WRITEPATH . "backups";
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $file = $dir . "/stable-" . date("Ymd-His") . ".sqlite";
        $db = db_connect();
        $db->query("VACUUM INTO " . $db->escape($file));
        chmod($file, 0600);
        CLI::write("Backup created in writable/backups.");
    }
}
