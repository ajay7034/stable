<?php
namespace App\Controllers;
use App\Services\WebsiteSettings;

class Website extends Api
{
    public function settings()
    {
        if (!$this->allowed('settings')) return $this->failForbidden();
        if ($this->request->getMethod() !== 'GET') return $this->admin('settings');
        $rows = db_connect()->table('site_settings')->get()->getResultArray();
        return $this->out([
            'fields' => WebsiteSettings::fields(),
            'values' => array_column($rows, 'value', 'key'),
            'media' => $this->allowed('media', 'read') ? db_connect()->table('media_files')->select('id,alt,folder')->orderBy('id', 'DESC')->get()->getResultArray() : [],
        ]);
    }
}
