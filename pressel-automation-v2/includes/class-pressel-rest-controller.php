<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_REST_Controller {
    const ROUTE_NS = 'pressel-automation-v2/v1';

    public function register_routes() {
        register_rest_route(self::ROUTE_NS, '/preview', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_preview'],
            'permission_callback' => [$this, 'require_auth'],
        ]);

        register_rest_route(self::ROUTE_NS, '/publish', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_publish'],
            'permission_callback' => [$this, 'require_auth'],
        ]);

        register_rest_route(self::ROUTE_NS, '/verify', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_verify'],
            'permission_callback' => [$this, 'require_auth'],
            'args' => [
                'post_id' => [ 'required' => true ],
            ],
        ]);
    }

    public function require_auth() {
        // Requer capacidade mínima de edição de páginas
        return current_user_can('edit_pages');
    }

    private function parse_json(WP_REST_Request $request) {
        $json = $request->get_json_params();
        if (!$json || !is_array($json)) {
            return new WP_Error('PS-JSON-001', 'JSON inválido ou mal formatado');
        }
        return $json;
    }

    public function handle_preview(WP_REST_Request $request) {
        $json = $this->parse_json($request);
        if (is_wp_error($json)) { return $this->error($json); }

        $detector = new Pressel_V2_Model_Detector();
        $detected = $detector->detect($json);
        if (is_wp_error($detected)) { return $this->error($detected); }

        $mapper = new Pressel_V2_Template_Mapper();
        $template_file = $mapper->get_template_by_model($detected['model']);

        if (!$mapper->validate_template_exists($template_file)) {
            return $this->error(new WP_Error('PS-WP-004', 'Template do modelo não encontrado', [
                'modelo' => $detected['model'],
                'template_file' => $template_file,
            ]));
        }

        $required_ok = true;
        $issues = [];

        // Validações simples
        if (empty($json['page']['title'])) {
            $required_ok = false;
            $issues[] = ['codigo' => 'PS-JSON-002', 'mensagem' => 'Título ausente'];
        }

        return $this->success([
            'detected' => $detected,
            'template_file' => $template_file,
            'required_ok' => $required_ok,
            'issues' => $issues,
        ]);
    }

    public function handle_publish(WP_REST_Request $request) {
        try {
            $json = $this->parse_json($request);
            if (is_wp_error($json)) { return $this->error($json); }

            $detector = new Pressel_V2_Model_Detector();
            $detected = $detector->detect($json);
            if (is_wp_error($detected)) { return $this->error($detected); }

            $mapper = new Pressel_V2_Template_Mapper();
            $template_file = $mapper->get_template_by_model($detected['model']);
            if (!$mapper->validate_template_exists($template_file)) {
                return $this->error(new WP_Error('PS-WP-004', 'Template do modelo não encontrado'));
            }

            $title = isset($json['page']['title']) ? sanitize_text_field($json['page']['title']) : '';
            $slug = isset($json['page']['slug']) ? sanitize_title($json['page']['slug']) : '';
            $status = isset($json['page']['status']) ? sanitize_key($json['page']['status']) : 'publish';
            $excerpt = isset($json['page']['excerpt']) ? sanitize_textarea_field($json['page']['excerpt']) : '';
            $acf = isset($json['acf']) && is_array($json['acf']) ? $json['acf'] : [];
            $seo = isset($json['seo']) && is_array($json['seo']) ? $json['seo'] : [];

            if (empty($title)) {
                return $this->error(new WP_Error('PS-JSON-002', 'Título da página é obrigatório'));
            }

            // Upsert por slug ou título
            $existing = null;
            if (!empty($slug)) {
                $existing = get_page_by_path($slug, OBJECT, 'page');
            }
            if (!$existing) {
                $q = new WP_Query([
                    'post_type' => 'page',
                    'title' => $title,
                    'post_status' => 'any',
                    'posts_per_page' => 1,
                ]);
                if (!empty($q->posts)) { $existing = $q->posts[0]; }
            }

            $postarr = [
                'post_type' => 'page',
                'post_title' => $title,
                'post_status' => $status,
            ];
            if (!empty($slug)) { $postarr['post_name'] = $slug; }
            if (!empty($excerpt)) { $postarr['post_excerpt'] = $excerpt; }

            if ($existing) {
                $postarr['ID'] = $existing->ID;
                $post_id = wp_update_post($postarr, true);
            } else {
                $post_id = wp_insert_post($postarr, true);
            }

            if (is_wp_error($post_id)) {
                return $this->error(new WP_Error('PS-WP-001', 'Erro ao criar/atualizar página', ['error' => $post_id->get_error_message()]));
            }

            // Aplicar template
            $applier = new Pressel_V2_Template_Applier();
            $apply = $applier->apply_template($post_id, $template_file);
            if (is_wp_error($apply)) { return $this->error($apply); }

            // Salvar ACF
            $acf_service = new Pressel_V2_ACF_Service();
            $acf_saved = $acf_service->save_fields($post_id, $acf);

            // Salvar SEO
            $seo_saved = 0;
            if (!empty($seo)) {
                try {
                    if (!class_exists('Pressel_V2_SEO_Service')) {
                        $seo_file = PRESSEL_V2_PATH . 'includes/class-pressel-seo-service.php';
                        if (file_exists($seo_file)) {
                            require_once $seo_file;
                        }
                    }
                    if (class_exists('Pressel_V2_SEO_Service')) {
                        $seo_service = new Pressel_V2_SEO_Service();
                        $seo_saved = $seo_service->save_seo($post_id, $seo);
                    }
                } catch (Exception $e) {
                    error_log('[Pressel v2] Erro ao salvar SEO: ' . $e->getMessage());
                    $seo_saved = 0;
                } catch (Error $e) {
                    error_log('[Pressel v2] Erro fatal ao salvar SEO: ' . $e->getMessage());
                    $seo_saved = 0;
                }
            }

            // Definir featured image se fornecido
            $featured_set = false;
            $featured_image_url = isset($json['page']['featured_image']) ? esc_url_raw($json['page']['featured_image']) : null;
            if (!$featured_image_url && isset($acf['imagem_destaque'])) {
                $featured_image_url = esc_url_raw($acf['imagem_destaque']);
            }
            
            if (!empty($featured_image_url)) {
                try {
                    $featured_file = PRESSEL_V2_PATH . 'includes/class-pressel-featured-image.php';
                    if (file_exists($featured_file) && !class_exists('Pressel_V2_Featured_Image')) {
                        require_once $featured_file;
                    }
                    
                    if (class_exists('Pressel_V2_Featured_Image')) {
                        $featured_service = new Pressel_V2_Featured_Image();
                        $featured_set = $featured_service->set_from_url($post_id, $featured_image_url);
                    } else {
                        error_log('[Pressel v2] Classe Pressel_V2_Featured_Image não encontrada');
                    }
                } catch (Exception $e) {
                    error_log('[Pressel v2] Erro ao definir featured image: ' . $e->getMessage());
                    $featured_set = false;
                } catch (Error $e) {
                    error_log('[Pressel v2] Erro fatal ao definir featured image: ' . $e->getMessage());
                    $featured_set = false;
                }
            }

            return $this->success([
                'post_id' => $post_id,
                'template' => get_post_meta($post_id, '_wp_page_template', true),
                'acf_saved' => $acf_saved,
                'seo_saved' => $seo_saved,
                'featured_image_set' => $featured_set,
                'edit_link' => get_edit_post_link($post_id, ''),
                'view_link' => get_permalink($post_id),
            ]);
        } catch (Exception $e) {
            error_log('[Pressel v2] Exception em handle_publish: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return $this->error(new WP_Error('PS-SYS-002', 'Erro ao processar publicação: ' . $e->getMessage()));
        } catch (Error $e) {
            error_log('[Pressel v2] Fatal error em handle_publish: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ':' . $e->getLine());
            return $this->error(new WP_Error('PS-SYS-003', 'Erro fatal ao processar publicação: ' . $e->getMessage()));
        }
    }

    public function handle_verify(WP_REST_Request $request) {
        $post_id = absint($request->get_param('post_id'));
        if (!$post_id) { return $this->error(new WP_Error('PS-WP-003', 'post_id inválido')); }

        $post = get_post($post_id);
        if (!$post) { return $this->error(new WP_Error('PS-WP-003', 'Página não encontrada')); }

        $template = get_post_meta($post_id, '_wp_page_template', true);
        return $this->success([
            'post_id' => $post_id,
            'title' => get_the_title($post_id),
            'status' => $post->post_status,
            'template' => $template,
            'permalink' => get_permalink($post_id),
        ]);
    }

    private function success($data = [], $logs = []) {
        return new WP_REST_Response([
            'success' => true,
            'data' => $data,
            'logs' => $logs,
        ], 200);
    }

    private function error($error) {
        if ($error instanceof WP_Error) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $error->get_error_message(),
                'code' => $error->get_error_code(),
            ], 400);
        }
        return new WP_REST_Response([
            'success' => false,
            'error' => 'Erro desconhecido',
        ], 500);
    }
}


