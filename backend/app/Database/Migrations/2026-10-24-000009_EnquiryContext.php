<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class EnquiryContext extends Migration {
 public function up(){ $this->forge->addColumn('inquiries',['subject'=>['type'=>'TEXT','default'=>''],'project_location'=>['type'=>'TEXT','default'=>''],'required_date'=>['type'=>'TEXT','default'=>''],'category'=>['type'=>'TEXT','default'=>'']]); }
 public function down(){ $this->forge->dropColumn('inquiries',['subject','project_location','required_date','category']); }
}
