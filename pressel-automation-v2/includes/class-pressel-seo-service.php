<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_SEO_Service {
    public function save_seo($post_id, $seo_data) {
        if (!$post_id || !is_array($seo_data)) { return 0; }
        $saved = 0;

        // Normalizar nomes dos campos (aceitar ambos: novos e antigos)
        $seo_title = !empty($seo_data['seo_title']) ? $seo_data['seo_title'] : (!empty($seo_data['meta_title']) ? $seo_data['meta_title'] : '');
        $meta_description = !empty($seo_data['meta_description']) ? $seo_data['meta_description'] : '';
        $focus_keyphrase = !empty($seo_data['focus_keyphrase']) ? $seo_data['focus_keyphrase'] : (!empty($seo_data['focus_keyword']) ? $seo_data['focus_keyword'] : '');

        // Yoast SEO
        if (defined('WPSEO_VERSION')) {
            if (!empty($seo_title)) {
                update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($seo_title));
                $saved++;
            }
            if (!empty($meta_description)) {
                update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_textarea_field($meta_description));
                $saved++;
            }
            if (!empty($focus_keyphrase)) {
                update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($focus_keyphrase));
                $saved++;
            }
            if (!empty($seo_data['og_title'])) {
                update_post_meta($post_id, '_yoast_wpseo_opengraph-title', sanitize_text_field($seo_data['og_title']));
                $saved++;
            }
            if (!empty($seo_data['og_description'])) {
                update_post_meta($post_id, '_yoast_wpseo_opengraph-description', sanitize_textarea_field($seo_data['og_description']));
                $saved++;
            }
            if (!empty($seo_data['og_image'])) {
                update_post_meta($post_id, '_yoast_wpseo_opengraph-image', esc_url_raw($seo_data['og_image']));
                $saved++;
            }
            if (!empty($seo_data['canonical_url'])) {
                update_post_meta($post_id, '_yoast_wpseo_canonical', esc_url_raw($seo_data['canonical_url']));
                $saved++;
            }
            if (!empty($seo_data['robots'])) {
                update_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', (strpos($seo_data['robots'], 'noindex') !== false) ? 1 : 0);
                update_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', (strpos($seo_data['robots'], 'nofollow') !== false) ? 1 : 0);
                $saved++;
            }
        }

        // Rank Math SEO
        if (defined('RANK_MATH_VERSION')) {
            if (!empty($seo_title)) {
                update_post_meta($post_id, 'rank_math_title', sanitize_text_field($seo_title));
                $saved++;
            }
            if (!empty($meta_description)) {
                update_post_meta($post_id, 'rank_math_description', sanitize_textarea_field($meta_description));
                $saved++;
            }
            if (!empty($focus_keyphrase)) {
                update_post_meta($post_id, 'rank_math_focus_keyword', sanitize_text_field($focus_keyphrase));
                $saved++;
            }
            if (!empty($seo_data['og_title'])) {
                update_post_meta($post_id, 'rank_math_facebook_title', sanitize_text_field($seo_data['og_title']));
                $saved++;
            }
            if (!empty($seo_data['og_description'])) {
                update_post_meta($post_id, 'rank_math_facebook_description', sanitize_textarea_field($seo_data['og_description']));
                $saved++;
            }
            if (!empty($seo_data['og_image'])) {
                update_post_meta($post_id, 'rank_math_facebook_image', esc_url_raw($seo_data['og_image']));
                $saved++;
            }
            if (!empty($seo_data['canonical_url'])) {
                update_post_meta($post_id, 'rank_math_canonical_url', esc_url_raw($seo_data['canonical_url']));
                $saved++;
            }
        }

        // All in One SEO
        if (defined('AIOSEO_VERSION')) {
            if (!empty($seo_title)) {
                update_post_meta($post_id, '_aioseo_title', sanitize_text_field($seo_title));
                $saved++;
            }
            if (!empty($meta_description)) {
                update_post_meta($post_id, '_aioseo_description', sanitize_textarea_field($meta_description));
                $saved++;
            }
            if (!empty($seo_data['og_title'])) {
                update_post_meta($post_id, '_aioseo_og_title', sanitize_text_field($seo_data['og_title']));
                $saved++;
            }
            if (!empty($seo_data['og_description'])) {
                update_post_meta($post_id, '_aioseo_og_description', sanitize_textarea_field($seo_data['og_description']));
                $saved++;
            }
            if (!empty($seo_data['og_image'])) {
                update_post_meta($post_id, '_aioseo_og_image_custom_url', esc_url_raw($seo_data['og_image']));
                $saved++;
            }
            if (!empty($seo_data['canonical_url'])) {
                update_post_meta($post_id, '_aioseo_canonical_url', esc_url_raw($seo_data['canonical_url']));
                $saved++;
            }
        }

        return $saved;
    }
}

