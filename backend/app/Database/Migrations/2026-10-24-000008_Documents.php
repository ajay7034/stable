<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class Documents extends Migration {public function up(){$this->forge->addField(['id'=>['type'=>'INTEGER','auto_increment'=>true],'filename'=>['type'=>'TEXT'],'title'=>['type'=>'TEXT'],'created_at'=>['type'=>'DATETIME']]);$this->forge->addKey('id',true);$this->forge->createTable('documents');$this->forge->addColumn('products',['datasheet_id'=>['type'=>'INTEGER','null'=>true]]);}public function down(){$this->forge->dropColumn('products','datasheet_id');$this->forge->dropTable('documents');}}
