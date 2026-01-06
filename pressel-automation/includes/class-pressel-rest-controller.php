<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_REST_Controller {
    public function register(): void {
        add_action('rest_api_init', function () {
            register_rest_route('pressel-automation/v1', '/preview', array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'preview'),
                'permission_callback' => array($this, 'can_manage_content'),
            ));
            register_rest_route('pressel-automation/v1', '/publish', array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'publish'),
                'permission_callback' => array($this, 'can_manage_content'),
            ));
            register_rest_route('pressel-automation/v1', '/verify', array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'verify'),
                'permission_callback' => array($this, 'can_manage_content'),
                'args' => array(
                    'post_id' => array('required' => false),
                    'slug' => array('required' => false),
                ),
            ));
        });
    }

    public function can_manage_content(): bool {
        return current_user_can('edit_posts');
    }

    public function preview(WP_REST_Request $request): WP_REST_Response {
        $data = $request->get_json_params();
        if (!is_array($data)) { return new WP_REST_Response(array('error' => 'Invalid JSON'), 400); }

        $det = Pressel_Model_Detector::detect($data);
        $template = Pressel_Template_Mapper::template_for($det['model']);

        Pressel_Logger::info('SYS-PREVIEW', 'Modelo detectado', array('model' => $det, 'template' => $template));

        return new WP_REST_Response(array(
            'model' => $det,
            'template' => $template,
            'valid' => true,
        ), 200);
    }

    public function publish(WP_REST_Request $request): WP_REST_Response {
        $data = $request->get_json_params();
        if (!is_array($data)) { return new WP_REST_Response(array('error' => 'Invalid JSON'), 400); }

        $det = Pressel_Model_Detector::detect($data);
        $template = Pressel_Template_Mapper::template_for($det['model']);

        $title = isset($data['page_title']) ? sanitize_text_field($data['page_title']) : 'Pressel Page';
        $slug  = isset($data['page_slug']) ? sanitize_title($data['page_slug']) : sanitize_title($title);
        $status = isset($data['post_status']) ? sanitize_key($data['post_status']) : 'publish';

        // Idempotência: localizar por slug/título
        $existing = get_page_by_path($slug, OBJECT, 'page');
        if (!$existing) {
            $existing = get_page_by_title($title, OBJECT, 'page');
        }

        $postarr = array(
            'post_type' => 'page',
            'post_title' => $title,
            'post_name' => $slug,
            'post_status' => $status,
        );
        if ($existing) { $postarr['ID'] = $existing->ID; }

        $post_id = wp_insert_post($postarr, true);
        if (is_wp_error($post_id)) {
            Pressel_Logger::error('PUB-INSERT', 'Falha ao criar/atualizar página', array('error' => $post_id->get_error_message()));
            return new WP_REST_Response(array('error' => $post_id->get_error_message()), 500);
        }

        // Aplicar template
        $applied = Pressel_Template_Applier::apply($post_id, $template);

        // Salvar ACF
        $acf = isset($data['acf_fields']) && is_array($data['acf_fields']) ? $data['acf_fields'] : array();
        $acf_result = Pressel_ACF_Service::save_fields($post_id, $acf);

        Pressel_Logger::success('PUB-DONE', 'Página publicada', array('post_id' => $post_id, 'template' => $template));
        return new WP_REST_Response(array(
            'post_id' => $post_id,
            'slug' => get_post_field('post_name', $post_id),
            'template' => $template,
            'template_applied' => (bool)$applied,
            'acf_saved' => $acf_result,
            'is_update' => (bool)$existing,
        ), 200);
    }

    public function verify(WP_REST_Request $request): WP_REST_Response {
        $post_id = (int)$request->get_param('post_id');
        $slug = sanitize_title($request->get_param('slug'));
        if (!$post_id && $slug) {
            $p = get_page_by_path($slug, OBJECT, 'page');
            if ($p) { $post_id = $p->ID; }
        }
        if (!$post_id) { return new WP_REST_Response(array('error' => 'post_id ou slug obrigatório'), 400); }

        $template_meta = get_post_meta($post_id, '_wp_page_template', true);
        $template_slug = get_page_template_slug($post_id);
        $acf = function_exists('get_fields') ? get_fields($post_id) : array();

        return new WP_REST_Response(array(
            'post_id' => $post_id,
            'template_meta' => $template_meta,
            'template_slug' => $template_slug,
            'acf' => $acf,
        ), 200);
    }
}


