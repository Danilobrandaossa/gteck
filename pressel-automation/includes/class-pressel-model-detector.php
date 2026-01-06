<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_Model_Detector {
    public static function detect(array $data): array {
        // 1) Prefer explicit model
        $explicit = isset($data['page_model']) ? trim((string)$data['page_model']) : '';
        if ($explicit !== '') {
            return array('model' => self::normalize($explicit), 'confidence' => 1.0, 'source' => 'explicit');
        }
        // 2) Heuristic by fields
        $acf = isset($data['acf_fields']) && is_array($data['acf_fields']) ? $data['acf_fields'] : array();
        if (isset($acf['benefits']) && isset($acf['faq_title'])) {
            return array('model' => 'V4', 'confidence' => 0.7, 'source' => 'heuristic');
        }
        if (isset($acf['hero_description']) && isset($acf['titulo_faq'])) {
            return array('model' => 'V1', 'confidence' => 0.7, 'source' => 'heuristic');
        }
        // 3) Fallback
        return array('model' => 'V1', 'confidence' => 0.3, 'source' => 'fallback');
    }

    public static function normalize(string $model): string {
        $m = strtolower($model);
        if (in_array($m, array('v4', 'pressel_v4', 'modelo_v4', 'modelo-ecommerce', 'ecommerce'), true)) { return 'V4'; }
        if (in_array($m, array('v1', 'pressel_v1', 'modelo_v1', 'modelo_brasileiro', 'pt_br'), true)) { return 'V1'; }
        return strtoupper($model);
    }
}


