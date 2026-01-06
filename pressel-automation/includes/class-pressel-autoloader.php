<?php
if (!defined('ABSPATH')) { exit; }

class Pressel_Autoloader {
    public static function register(string $base_dir): void {
        spl_autoload_register(function ($class) use ($base_dir) {
            if (strpos($class, 'Pressel_') !== 0) { return; }
            $filename = 'class-' . strtolower(str_replace('_', '-', $class)) . '.php';
            $paths = array(
                trailingslashit($base_dir) . 'includes/' . $filename,
                trailingslashit($base_dir) . 'src/' . $filename,
            );
            foreach ($paths as $path) {
                if (file_exists($path)) { require_once $path; return; }
            }
        });
    }
}


