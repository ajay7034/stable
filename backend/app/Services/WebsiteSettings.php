<?php
namespace App\Services;

class WebsiteSettings
{
    public static function fields(): array
    {
        return json_decode(file_get_contents(APPPATH . 'Config/website-fields.json'), true, 512, JSON_THROW_ON_ERROR);
    }
    public static function imageIds(): array
    {
        $keys = array_column(array_filter(self::fields(), fn($f) => $f['type'] === 'image'), 'key');
        return array_map('intval', array_column(db_connect()->table('site_settings')->whereIn('key', $keys)->get()->getResultArray(), 'value'));
    }
    public static function validate(array $data): ?string
    {
        $fields = array_column(self::fields(), null, 'key');
        foreach ($data as $key => $value) {
            if (!str_starts_with((string) $key, 'design_')) continue;
            if (!isset($fields[$key]) || !is_string($value) || strlen($value) > 5000) return 'Invalid website setting';
            $f = $fields[$key];
            switch ($f['type']) {
                case 'image':
                    if ($value !== '' && (!ctype_digit($value) || (int)$value < 1 || !db_connect()->table('media_files')->where('id', (int)$value)->countAllResults())) return $f['label'] . ': select an existing library image';
                    break;
                case 'boolean':
                    if (!in_array($value, ['0', '1'], true)) return 'Invalid toggle';
                    break;
                case 'color':
                    if (!preg_match('/^#[a-f0-9]{6}$/i', $value)) return 'Use a six-digit hex colour';
                    break;
                case 'number':
                    if (!ctype_digit($value) || (int)$value < $f['min'] || (int)$value > $f['max']) return $f['label'] . ': value outside allowed range';
                    break;
                case 'href':
                    if (!preg_match('~^/[a-z0-9/-]*$~', $value)) return 'Use an internal page path';
                    break;
                case 'cards':
                    $cards = json_decode($value, true);
                    if (!is_array($cards) || !array_is_list($cards) || count($cards) > 12) return 'Use up to 12 cards';
                    foreach ($cards as $card) if (!is_array($card) || array_diff(array_keys($card), ['title', 'body']) || !isset($card['title'], $card['body']) || !is_string($card['title']) || !is_string($card['body']) || strlen($card['title']) > 200 || strlen($card['body']) > 1500) return 'Invalid card text';
            }
        }
        return null;
    }
    public static function installDefaults(): void
    {
        $db = db_connect();
        foreach (self::fields() as $field) {
            if ($db->table('site_settings')->where('key', $field['key'])->countAllResults()) continue;
            $value = $field['default'];
            if (!empty($field['asset'])) {
                $source = ROOTPATH . '../frontend/public/' . $field['asset'];
                if (!is_file($source)) throw new \RuntimeException('Website image asset missing');
                $filename = 'website-' . basename($field['asset']);
                $media = $db->table('media_files')->where('filename', $filename)->get()->getRowArray();
                if (!$media) {
                    $dir = WRITEPATH . 'media';
                    if (!is_dir($dir)) mkdir($dir, 0750, true);
                    if (!copy($source, $dir . '/' . $filename)) throw new \RuntimeException('Unable to import website image');
                    chmod($dir . '/' . $filename, 0640);
                    $size = getimagesize($source);
                    $db->table('media_files')->insert([
                        'filename' => $filename, 'mime' => $size['mime'], 'size' => filesize($source),
                        'alt' => $field['label'], 'source_url' => '', 'owner' => 'Stable website asset',
                        'license' => str_contains($filename, 'logo') ? 'User-supplied company logo.' : 'Generated conceptual imagery for Stable; not actual premises, verified inventory or customer projects.',
                        'width' => $size[0], 'height' => $size[1], 'folder' => 'Website design',
                        'thumbnail' => null, 'created_at' => date('Y-m-d H:i:s'),
                    ]);
                    $value = (string)$db->insertID();
                } else $value = (string)$media['id'];
            }
            $db->table('site_settings')->insert(['key' => $field['key'], 'value' => $value]);
        }
    }
}
