<?php
/*
Plugin Name: Pressel Automation v2
Description: Automação de criação/atualização de páginas via JSON (V1/V4+) com rotas /preview, /publish e /verify.
Version: 0.1.0
Author: CMS Moderno
*/

if (!defined('ABSPATH')) {
    exit;
}

// Constantes do plugin
define('PRESSEL_V2_PATH', plugin_dir_path(__FILE__));
define('PRESSEL_V2_URL', plugin_dir_url(__FILE__));
define('PRESSEL_V2_NS', 'pressel-automation-v2');

// Autoloader simples (opcional)
$autoloader_file = PRESSEL_V2_PATH . 'includes/class-pressel-autoloader.php';
if (file_exists($autoloader_file)) {
    require_once $autoloader_file;
    if (class_exists('Pressel_V2_Autoloader')) {
        Pressel_V2_Autoloader::register();
    }
}

// Inclusões diretas para evitar problemas em ambientes sem SPL/autoloader
// Usando file_exists para evitar fatal errors se arquivos estiverem faltando
$includes = [
    'includes/class-pressel-logger.php',
    'includes/class-pressel-model-detector.php',
    'includes/class-pressel-template-mapper.php',
    'includes/class-pressel-template-applier.php',
    'includes/class-pressel-acf-service.php',
    'includes/class-pressel-seo-service.php', // Carregado sob demanda se necessário
    'includes/class-pressel-featured-image.php',
    'includes/class-pressel-rest-controller.php',
];

foreach ($includes as $include) {
    $file = PRESSEL_V2_PATH . $include;
    if (file_exists($file)) {
        require_once $file;
    } else {
        error_log('[Pressel v2] Arquivo não encontrado: ' . $file);
    }
}

// Inicialização
add_action('init', function () {
    // nada por enquanto
});

// Registrar rotas REST
add_action('rest_api_init', function () {
    if (class_exists('Pressel_V2_REST_Controller')) {
        $controller = new Pressel_V2_REST_Controller();
        $controller->register_routes();
    } else {
        if (function_exists('error_log')) {
            error_log('[PRESSEL v2] Controlador REST ausente. Verifique inclusões do plugin.');
        }
    }
});

// Verificar dependências básicas (ACF opcional, mas recomendado)
add_action('admin_notices', function () {
    if (!function_exists('register_rest_route')) {
        echo '<div class="notice notice-error"><p>[Pressel v2] REST API não disponível. Requer WordPress 4.7+.</p></div>';
    }
});

