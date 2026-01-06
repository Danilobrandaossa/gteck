<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Model_Detector {
    public function detect($json) {
        $model = null;
        $template_name = null;

        if (isset($json['pressel']['model'])) {
            $model = strtoupper(trim($json['pressel']['model']));
        } elseif (isset($json['model'])) {
            $model = strtoupper(trim($json['model']));
        }

        if (isset($json['pressel']['template_name'])) {
            $template_name = trim($json['pressel']['template_name']);
        } elseif (isset($json['template_name'])) {
            $template_name = trim($json['template_name']);
        }

        if (!$model && $template_name) {
            // heurística simples
            if (stripos($template_name, 'V4') !== false) { $model = 'V4'; }
            if (stripos($template_name, 'V1') !== false) { $model = 'V1'; }
        }

        if (!$model) {
            return new WP_Error('PS-JSON-003', 'Não foi possível identificar o modelo a partir do JSON');
        }

        return [
            'model' => $model,
            'template_name' => $template_name,
        ];
    }
}


