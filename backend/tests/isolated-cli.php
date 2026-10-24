<?php
// Test-only CLI wrapper: all schema/seeding work targets an isolated disposable DB.
$_ENV['database.default.database']='/tmp/stable-clean-validation.sqlite';
$_SERVER['database.default.database']='/tmp/stable-clean-validation.sqlite';
require dirname(__DIR__).'/spark';
