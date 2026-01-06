<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Template_Applier {
    public function apply_template($post_id, $template_file) {
        if (!$post_id || !$template_file) {
            return new WP_Error('PS-WP-004', 'Post ID ou template inválido');
        }

        // Define o template via meta padrão do WP
        update_post_meta($post_id, '_wp_page_template', $template_file);

        // Verificação: ler e confirmar
        $applied = get_post_meta($post_id, '_wp_page_template', true);
        if ($applied !== $template_file) {
            return new WP_Error('PS-WP-004', 'Falha ao aplicar o template');
        }

        return true;
    }
}


