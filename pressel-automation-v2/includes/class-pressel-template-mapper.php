<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Template_Mapper {
    public function get_template_by_model($model) {
        $model = strtoupper($model);
        $map = [
            'V1' => 'pressel-oficial.php',
            'MODELO_V1' => 'pressel-oficial.php',
            'V4' => 'V4.php',
            'MODELO_V4' => 'V4.php',
        ];
        return isset($map[$model]) ? $map[$model] : null;
    }

    public function validate_template_exists($template_file) {
        if (!$template_file) { return false; }
        $theme_paths = [
            get_stylesheet_directory() . '/' . $template_file,
            get_template_directory() . '/' . $template_file,
        ];
        foreach ($theme_paths as $path) {
            if (file_exists($path)) { return true; }
        }
        return false;
    }
}


