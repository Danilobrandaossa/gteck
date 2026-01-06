<?php
/**
 * Script para verificar status do template
 * Execute este arquivo via WordPress admin ou diretamente
 */

// Verificar se está sendo executado via WordPress
if (!defined('ABSPATH')) {
    // Se não estiver, tentar carregar WordPress
    $wp_load_paths = [
        '../../../wp-load.php',
        '../../wp-load.php',
        '../wp-load.php',
        './wp-load.php'
    ];
    
    $wp_loaded = false;
    foreach ($wp_load_paths as $path) {
        if (file_exists($path)) {
            require_once($path);
            $wp_loaded = true;
            break;
        }
    }
    
    if (!$wp_loaded) {
        die('❌ WordPress não encontrado. Execute este script via admin do WordPress.');
    }
}

echo "<h2>🔍 DIAGNÓSTICO DO TEMPLATE PRESELL</h2>";

// 1. Verificar tema ativo
$active_theme = wp_get_theme();
echo "<h3>📋 Tema Ativo</h3>";
echo "Nome: " . $active_theme->get('Name') . "<br>";
echo "Diretório: " . $active_theme->get_stylesheet_directory() . "<br><br>";

// 2. Verificar se template existe
$template_file = 'pressel-oficial.php';
$template_path = $active_theme->get_stylesheet_directory() . '/' . $template_file;

echo "<h3>📁 Verificação do Template</h3>";
echo "Arquivo: " . $template_file . "<br>";
echo "Caminho completo: " . $template_path . "<br>";

if (file_exists($template_path)) {
    echo "✅ <strong>Template encontrado!</strong><br>";
    echo "Tamanho: " . filesize($template_path) . " bytes<br>";
    echo "Última modificação: " . date('d/m/Y H:i:s', filemtime($template_path)) . "<br>";
} else {
    echo "❌ <strong>Template NÃO encontrado!</strong><br>";
    echo "O arquivo pressel-oficial.php precisa ser copiado para:<br>";
    echo "<code>" . $active_theme->get_stylesheet_directory() . "/" . $template_file . "</code><br><br>";
}

// 3. Verificar permissões
if (file_exists($template_path)) {
    $perms = fileperms($template_path);
    echo "Permissões: " . substr(sprintf('%o', $perms), -4) . "<br>";
}

// 4. Verificar páginas criadas
echo "<h3>📄 Páginas Criadas pelo Plugin</h3>";
$pages = get_posts([
    'post_type' => 'page',
    'meta_key' => '_wp_page_template',
    'meta_value' => 'pressel-oficial.php',
    'numberposts' => 5,
    'orderby' => 'date',
    'order' => 'DESC'
]);

if ($pages) {
    echo "✅ Encontradas " . count($pages) . " páginas com template pressel-oficial.php:<br>";
    foreach ($pages as $page) {
        echo "- <a href='" . get_edit_post_link($page->ID) . "'>" . $page->post_title . "</a> (ID: " . $page->ID . ")<br>";
    }
} else {
    echo "❌ Nenhuma página encontrada com template pressel-oficial.php<br>";
}

// 5. Verificar templates disponíveis
echo "<h3>📋 Templates Disponíveis no Tema</h3>";
$templates = wp_get_theme()->get_page_templates();
if ($templates) {
    echo "Templates encontrados:<br>";
    foreach ($templates as $file => $name) {
        echo "- $file ($name)<br>";
    }
} else {
    echo "❌ Nenhum template personalizado encontrado<br>";
}

// 6. Verificar logs de erro
echo "<h3>📝 Logs Recentes</h3>";
$log_file = WP_CONTENT_DIR . '/debug.log';
if (file_exists($log_file)) {
    $logs = file_get_contents($log_file);
    $pressel_logs = [];
    $lines = explode("\n", $logs);
    
    // Pegar últimas 20 linhas que contenham "Pressel Auto"
    foreach (array_reverse($lines) as $line) {
        if (strpos($line, 'Pressel Auto') !== false) {
            $pressel_logs[] = $line;
            if (count($pressel_logs) >= 10) break;
        }
    }
    
    if ($pressel_logs) {
        echo "Últimos logs do Pressel Auto:<br>";
        foreach ($pressel_logs as $log) {
            echo "<small>" . htmlspecialchars($log) . "</small><br>";
        }
    } else {
        echo "Nenhum log do Pressel Auto encontrado<br>";
    }
} else {
    echo "Arquivo de log não encontrado<br>";
}

// 7. Instruções de correção
echo "<h3>🔧 INSTRUÇÕES DE CORREÇÃO</h3>";

if (!file_exists($template_path)) {
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px;'>";
    echo "<strong>🚨 AÇÃO NECESSÁRIA:</strong><br><br>";
    echo "1. <strong>Copiar arquivo:</strong><br>";
    echo "   - Arquivo: pressel-oficial.php<br>";
    echo "   - Para: " . $active_theme->get_stylesheet_directory() . "/<br><br>";
    echo "2. <strong>Via FTP/File Manager:</strong><br>";
    echo "   - Navegar até: /wp-content/themes/" . $active_theme->get_stylesheet() . "/<br>";
    echo "   - Upload: pressel-oficial.php<br><br>";
    echo "3. <strong>Verificar permissões:</strong><br>";
    echo "   - Arquivo deve ter permissão 644<br><br>";
    echo "4. <strong>Testar:</strong><br>";
    echo "   - Criar nova página via Pressel Auto<br>";
    echo "   - Verificar se template é aplicado<br>";
    echo "</div>";
} else {
    echo "<div style='background: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;'>";
    echo "✅ <strong>Template está no lugar correto!</strong><br><br>";
    echo "Se o template ainda não está sendo aplicado:<br>";
    echo "1. Verificar se a página tem o template correto em 'Atributos da Página'<br>";
    echo "2. Limpar cache do WordPress<br>";
    echo "3. Verificar se o template tem sintaxe PHP correta<br>";
    echo "</div>";
}

echo "<br><strong>🎯 Próximo passo:</strong> ";
if (!file_exists($template_path)) {
    echo "Copiar pressel-oficial.php para o tema ativo";
} else {
    echo "Testar criação de nova página";
}
echo "<br><br>";

// Botão para recarregar
echo "<button onclick='location.reload()'>🔄 Recarregar Diagnóstico</button>";
?>


