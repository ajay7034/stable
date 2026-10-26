<?php
namespace App\Services;

class WebsiteSettings
{
    public static function fields(): array
    {
        return json_decode(file_get_contents(APPPATH . 'Config/website-fields.json'), true, 512, JSON_THROW_ON_ERROR);
    }
    public static function imageIds(bool $includeHidden = false): array
    {
        $keys = array_column(array_filter(self::fields(), fn($f) => $f['type'] === 'image'), 'key');
        $ids = array_map('intval', array_column(db_connect()->table('site_settings')->whereIn('key', $keys)->get()->getResultArray(), 'value'));
        $logos = db_connect()->table('site_settings')->where('key', 'design_brand_logos')->get()->getRowArray();
        foreach (json_decode($logos['value'] ?? '[]', true) ?: [] as $logo) if ($includeHidden || !empty($logo['visible'])) $ids[] = (int) $logo['image'];
        return array_values(array_unique($ids));
    }
    public static function validate(array $data): ?string
    {
        $fields = array_column(self::fields(), null, 'key');
        foreach ($data as $key => $value) {
            if (!str_starts_with((string) $key, 'design_')) continue;
            if (!isset($fields[$key]) || !is_string($value) || strlen($value) > ($fields[$key]['type'] === 'logos' ? 30000 : 5000)) return 'Invalid website setting';
            $f = $fields[$key];
            switch ($f['type']) {
                case 'phone':
                    if ($value !== '' && !preg_match('/^\+?[0-9][0-9 ()-]{6,24}$/', $value)) return 'Use an international phone number';
                    break;
                case 'logos':
                    $logos = json_decode($value, true);
                    if (!is_array(json_decode($value)) || !is_array($logos) || !array_is_list($logos) || count($logos) > 100) return 'Use up to 100 brand logos';
                    foreach ($logos as $logo) {
                        if (!is_array($logo) || array_diff(array_keys($logo), ['name', 'image', 'visible']) || !isset($logo['name'], $logo['image'], $logo['visible']) || !is_string($logo['name']) || trim($logo['name']) === '' || strlen($logo['name']) > 120 || !is_string($logo['image']) || !ctype_digit($logo['image']) || !is_bool($logo['visible'])) return 'Each brand needs a name, image and visibility';
                        $media = db_connect()->table('media_files')->where('id', (int)$logo['image'])->get()->getRowArray();
                        if (!$media || !str_starts_with($media['mime'], 'image/')) return 'Select an existing library image for each brand';
                    }
                    break;
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
                    if (!is_array(json_decode($value)) || !is_array($cards) || !array_is_list($cards) || count($cards) > 12) return 'Use up to 12 cards';
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
            if (!empty($field['asset'])) $value = self::importImage($field['asset'], $field['label'], $field['license'] ?? null);
            if ($field['type'] === 'logos') {
                $logos = [];
                foreach ($field['items'] ?? [] as $item) $logos[] = [
                    'name' => $item['name'], 'visible' => $item['visible'],
                    'image' => self::importImage($item['asset'], $item['name'], 'User-supplied company profile artwork. Third-party trademarks belong to their respective owners.'),
                ];
                $value = json_encode($logos, JSON_THROW_ON_ERROR);
            }
            $db->table('site_settings')->insert(['key' => $field['key'], 'value' => $value]);
        }
    }
    private static function importImage(string $asset, string $label, ?string $license): string
    {
        $db = db_connect();
        $source = ROOTPATH . '../frontend/public/' . $asset;
        if (!is_file($source)) throw new \RuntimeException('Website image asset missing');
        $filename = 'website-' . basename($asset);
        $media = $db->table('media_files')->where('filename', $filename)->get()->getRowArray();
        if ($media) return (string)$media['id'];
        $dir = WRITEPATH . 'media';
        if (!is_dir($dir)) mkdir($dir, 0750, true);
        if (!copy($source, $dir . '/' . $filename)) throw new \RuntimeException('Unable to import website image');
        chmod($dir . '/' . $filename, 0640);
        $size = getimagesize($source);
        $db->table('media_files')->insert([
            'filename' => $filename, 'mime' => $size['mime'], 'size' => filesize($source),
            'alt' => $label, 'source_url' => '', 'owner' => 'Stable website asset',
            'license' => $license ?? (str_contains($filename, 'logo') ? 'User-supplied company logo.' : 'Generated conceptual imagery for Stable; not actual premises, verified inventory or customer projects.'),
            'width' => $size[0], 'height' => $size[1], 'folder' => str_contains($asset, 'brands/') ? 'Brand logos' : 'Website design',
            'thumbnail' => null, 'created_at' => date('Y-m-d H:i:s'),
        ]);
        return (string)$db->insertID();
    }
}
