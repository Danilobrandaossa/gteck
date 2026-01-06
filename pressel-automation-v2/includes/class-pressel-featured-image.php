<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Featured_Image {
    /**
     * Define imagem destacada a partir de URL
     */
    public function set_from_url($post_id, $image_url) {
        if (empty($image_url) || !filter_var($image_url, FILTER_VALIDATE_URL)) {
            error_log('[Pressel v2] URL de imagem inválida: ' . $image_url);
            return false;
        }

        // Se a URL já é uma mídia do WordPress, buscar o attachment ID
        $attachment_id = $this->get_attachment_id_from_url($image_url);
        
        if ($attachment_id) {
            $result = set_post_thumbnail($post_id, $attachment_id);
            error_log('[Pressel v2] Featured image definida via attachment existente: ' . $attachment_id);
            return $result;
        }

        // Buscar por meta _wp_attached_file também
        $filename = basename(parse_url($image_url, PHP_URL_PATH));
        $attachment_id = $this->find_by_filename($filename);
        
        if ($attachment_id) {
            $result = set_post_thumbnail($post_id, $attachment_id);
            error_log('[Pressel v2] Featured image definida via filename match: ' . $attachment_id);
            return $result;
        }

        // Caso contrário, fazer download e upload da imagem
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        // Verificar se é URL local do WordPress primeiro
        $home_url = home_url();
        $site_url = site_url();
        if (strpos($image_url, $home_url) === 0 || strpos($image_url, $site_url) === 0) {
            // URL local - tentar buscar attachment existente primeiro
            $path = parse_url($image_url, PHP_URL_PATH);
            if ($path) {
                $attachment_id = $this->find_by_path($path);
                if ($attachment_id) {
                    $result = set_post_thumbnail($post_id, $attachment_id);
                    error_log('[Pressel v2] Featured image definida via path local: ' . $attachment_id);
                    return $result;
                }
            }
        }

        // Download temporário da imagem
        $tmp = download_url($image_url, 300); // timeout de 5 minutos
        
        if (is_wp_error($tmp)) {
            error_log('[Pressel v2] Erro ao baixar imagem: ' . $tmp->get_error_message());
            // Tentar definir apenas a URL como meta se download falhar
            update_post_meta($post_id, '_thumbnail_ext_url', $image_url);
            return false;
        }

        // Preparar arquivo
        $file_array = [
            'name' => $filename,
            'tmp_name' => $tmp
        ];

        // Upload para WordPress
        $attachment_id = media_handle_sideload($file_array, $post_id);
        
        if (is_wp_error($attachment_id)) {
            @unlink($tmp);
            error_log('[Pressel v2] Erro ao fazer upload: ' . $attachment_id->get_error_message());
            // Tentar salvar URL como meta alternativa
            update_post_meta($post_id, '_thumbnail_ext_url', $image_url);
            return false;
        }

        // Definir como featured image
        $result = set_post_thumbnail($post_id, $attachment_id);
        
        if ($result) {
            error_log('[Pressel v2] Featured image definida com sucesso: attachment ' . $attachment_id);
        } else {
            error_log('[Pressel v2] Falha ao definir featured image para post ' . $post_id);
        }
        
        return $result;
    }

    /**
     * Busca attachment ID a partir da URL
     */
    private function get_attachment_id_from_url($url) {
        global $wpdb;
        
        // Busca exata
        $attachment = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} WHERE guid='%s' AND post_type='attachment'",
            $url
        ));
        
        if (!empty($attachment)) {
            return (int) $attachment[0];
        }

        // Tentar buscar por URL parcial (caminho do arquivo)
        $url_parts = parse_url($url);
        $path = $url_parts['path'] ?? '';
        
        if (!empty($path)) {
            // Buscar pelo nome do arquivo
            $filename = basename($path);
            $attachment = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type='attachment' AND post_title LIKE %s ORDER BY ID DESC LIMIT 1",
                '%' . $wpdb->esc_like($filename) . '%'
            ));
            
            if (!empty($attachment)) {
                return (int) $attachment[0];
            }

            // Buscar pela URL parcial
            $attachment = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE guid LIKE %s AND post_type='attachment' ORDER BY ID DESC LIMIT 1",
                '%' . $wpdb->esc_like($path) . '%'
            ));
            
            if (!empty($attachment)) {
                return (int) $attachment[0];
            }
        }
        
        return false;
    }

    /**
     * Busca attachment pelo nome do arquivo
     */
    private function find_by_filename($filename) {
        global $wpdb;
        
        $attachment = $wpdb->get_col($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
             WHERE pm.meta_key = '_wp_attached_file' 
             AND pm.meta_value LIKE %s
             AND p.post_type = 'attachment'
             ORDER BY p.ID DESC LIMIT 1",
            '%' . $wpdb->esc_like($filename) . '%'
        ));
        
        if (!empty($attachment)) {
            return (int) $attachment[0];
        }
        
        return false;
    }

    /**
     * Busca attachment pelo caminho
     */
    private function find_by_path($path) {
        global $wpdb;
        
        // Extrair nome do arquivo do path
        $filename = basename($path);
        
        // Buscar por guid
        $attachment = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} 
             WHERE post_type='attachment' 
             AND guid LIKE %s 
             ORDER BY ID DESC LIMIT 1",
            '%' . $wpdb->esc_like($filename) . '%'
        ));
        
        if (!empty($attachment)) {
            return (int) $attachment[0];
        }
        
        return false;
    }
}

