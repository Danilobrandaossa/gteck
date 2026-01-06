<?php

if (!defined('ABSPATH')) { exit; }

class Pressel_V2_Autoloader {
    public static function register() {
        spl_autoload_register([__CLASS__, 'autoload']);
    }

    public static function autoload($class) {
        if (strpos($class, 'Pressel_V2_') !== 0) {
            return;
        }

        $file = strtolower(str_replace('Pressel_V2_', '', $class));
        $file = str_replace('_', '-', $file);
        $path = PRESSEL_V2_PATH . 'includes/class-' . $file . '.php';

        if (file_exists($path)) {
            require_once $path;
        }
    }
}


