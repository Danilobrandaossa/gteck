<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_Template_Applier {
    public static function apply(int $post_id, string $template): bool {
        // Tenta pelas duas formas conhecidas
        update_post_meta($post_id, '_wp_page_template', $template);
        $updated = wp_update_post(array(
            'ID' => $post_id,
            'page_template' => $template,
        ), true);
        // Verifica
        $current = get_post_meta($post_id, '_wp_page_template', true);
        if ($current === $template) { return true; }
        $page = get_post($post_id);
        return !is_wp_error($updated) && $page && get_page_template_slug($post_id) === $template;
    }
}


