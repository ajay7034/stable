<?php
$db=new SQLite3('/tmp/stable-clean-validation.sqlite');
if($db->querySingle("SELECT COUNT(*) FROM content_publications WHERE module='categories'")!==8)throw new RuntimeException('Expected eight public categories');
if($db->querySingle("SELECT COUNT(*) FROM content_publications WHERE module='pages'")!==4)throw new RuntimeException('Expected four published initial pages');
if($db->querySingle("SELECT COUNT(*) FROM content_publications WHERE module='blogs'")!==3)throw new RuntimeException('Expected three original articles');
if($db->querySingle("SELECT COUNT(*) FROM products")!==0)throw new RuntimeException('Unexpected inventory');
if($db->querySingle("SELECT COUNT(*) FROM categories WHERE status='draft'")<20)throw new RuntimeException('Missing candidate taxonomy');
if($db->querySingle('PRAGMA integrity_check')!=='ok')throw new RuntimeException('Integrity failure');
echo "PASS: clean installation, nine migrations, initial publications, private taxonomy and no fabricated inventory.\n";
