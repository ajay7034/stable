<?php
// Isolated restore drill. Uses a consistent copy, never replaces the application DB.
$source = new SQLite3('/app/backend/writable/stable.sqlite');
$file = '/tmp/stable-restore-'.bin2hex(random_bytes(6)).'.sqlite';
$source->exec("VACUUM INTO '".$file."'");
chmod($file,0600);
try {
    $restored=new SQLite3($file);
    if ($restored->querySingle('PRAGMA integrity_check') !== 'ok') throw new RuntimeException('Integrity check failed');
    foreach(['users','site_settings','categories','content_publications'] as $table) {
        if($restored->querySingle("SELECT COUNT(*) FROM $table")!==$source->querySingle("SELECT COUNT(*) FROM $table"))throw new RuntimeException('Restored row count mismatch: '.$table);
    }
    $r=$restored->querySingle("SELECT content FROM content_publications WHERE module='pages' AND slug='home'");
    if(!json_decode($r,true)['title'])throw new RuntimeException('Published home not recoverable');
    $restored->close();
    echo "PASS: isolated SQLite restore, integrity, row counts and published content.\n";
} finally { $source->close(); @unlink($file); }
