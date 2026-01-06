<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_ACF_Service {
    public static function save_fields(int $post_id, array $fields): array {
        $saved = array();
        foreach ($fields as $key => $value) {
            $ok = false;
            if (function_exists('update_field')) {
                // Permite tanto por key quanto por name
                $ok = update_field($key, $value, $post_id);
                if (!$ok && is_string($key)) { $ok = update_field(sanitize_key($key), $value, $post_id); }
            }
            if (!$ok) { $ok = update_post_meta($post_id, $key, $value) !== false; }
            $saved[$key] = (bool)$ok;
        }
        return $saved;
    }
}


