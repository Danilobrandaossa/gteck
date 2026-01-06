<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_ACF_Service {
    public function save_fields($post_id, $acf_data) {
        if (!$post_id || !is_array($acf_data)) { return 0; }
        $saved = 0;

        foreach ($acf_data as $field_key_or_name => $value) {
            // Se ACF ativo, preferir update_field (aceita key ou name)
            if (function_exists('update_field')) {
                $ok = update_field($field_key_or_name, $value, $post_id);
                if ($ok) { $saved++; }
            } else {
                // Fallback: update_post_meta (para names simples)
                $ok = update_post_meta($post_id, $field_key_or_name, $value);
                if ($ok !== false) { $saved++; }
            }
        }

        return $saved;
    }
}


