<?php
/**
 * Script para testar especificamente os campos texto_usuario e botao_tipo_selecao
 */

// Tentar carregar WordPress se não estiver carregado
if (!defined('ABSPATH')) {
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

// Apenas administradores podem ver este diagnóstico
if (!current_user_can('manage_options')) {
    die('❌ Acesso negado. Apenas administradores podem executar o teste.');
}

echo "<h1>🧪 TESTE ESPECÍFICO DE CAMPOS</h1>";
echo "<h2>Campos: texto_usuario e botao_tipo_selecao</h2>";

// 1. Verificar se ACF está ativo
if (!function_exists('update_field')) {
    echo "❌ <strong>ACF NÃO ESTÁ ATIVO!</strong><br>";
    exit;
}

// 2. Criar uma página de teste
echo "<h3>📝 Criando Página de Teste</h3>";
$test_post = array(
    'post_title'    => 'Teste Campos Específicos - ' . date('Y-m-d H:i:s'),
    'post_status'   => 'draft',
    'post_type'     => 'page',
    'post_author'   => get_current_user_id(),
);

$test_post_id = wp_insert_post($test_post);

if (is_wp_error($test_post_id)) {
    echo "❌ Erro ao criar página de teste: " . $test_post_id->get_error_message();
    exit;
}

echo "✅ Página de teste criada com ID: $test_post_id<br>";
echo "🔗 <a href='" . get_edit_post_link($test_post_id) . "' target='_blank'>Editar Página</a><br><br>";

// 3. Definir template
$template_result = update_post_meta($test_post_id, '_wp_page_template', 'pressel-oficial.php');
echo "📄 Template definido: " . ($template_result ? "✅ Sucesso" : "❌ Falha") . "<br><br>";

// 4. Testar campo texto_usuario
echo "<h3>🔍 Testando Campo: texto_usuario</h3>";
$texto_usuario_value = "Você permanecerá no mesmo site - Teste " . date('H:i:s');

// Verificar se o campo existe
$field_object = get_field_object('texto_usuario');
if ($field_object) {
    echo "✅ Campo 'texto_usuario' encontrado<br>";
    echo "📋 Tipo: {$field_object['type']}<br>";
    echo "📝 Valor a ser inserido: '$texto_usuario_value'<br>";
    
    // Tentar inserir o valor
    $result = update_field('texto_usuario', $texto_usuario_value, $test_post_id);
    
    if ($result) {
        echo "✅ Campo 'texto_usuario' atualizado com sucesso!<br>";
        
        // Verificar se o valor foi salvo
        $saved_value = get_field('texto_usuario', $test_post_id);
        echo "🔍 Valor salvo: '$saved_value'<br>";
        
        if ($saved_value === $texto_usuario_value) {
            echo "✅ Validação: Valor correto!<br>";
        } else {
            echo "❌ Validação: Valor incorreto!<br>";
            echo "Esperado: '$texto_usuario_value'<br>";
            echo "Salvo: '$saved_value'<br>";
        }
    } else {
        echo "❌ Falha ao atualizar campo 'texto_usuario'<br>";
    }
} else {
    echo "❌ Campo 'texto_usuario' NÃO encontrado!<br>";
    echo "🔧 <strong>SOLUÇÃO:</strong> Verificar se o Field Group foi importado corretamente<br>";
}
echo "<br>";

// 5. Testar campo botao_tipo_selecao
echo "<h3>🔍 Testando Campo: botao_tipo_selecao</h3>";
$botao_tipo_value = "normal";

// Verificar se o campo existe
$field_object = get_field_object('botao_tipo_selecao');
if ($field_object) {
    echo "✅ Campo 'botao_tipo_selecao' encontrado<br>";
    echo "📋 Tipo: {$field_object['type']}<br>";
    
    // Mostrar opções disponíveis
    if (isset($field_object['choices']) && is_array($field_object['choices'])) {
        echo "📋 Opções disponíveis:<br>";
        foreach ($field_object['choices'] as $key => $value) {
            echo "- <strong>$key:</strong> $value<br>";
        }
    }
    
    echo "📝 Valor a ser inserido: '$botao_tipo_value'<br>";
    
    // Tentar inserir o valor
    $result = update_field('botao_tipo_selecao', $botao_tipo_value, $test_post_id);
    
    if ($result) {
        echo "✅ Campo 'botao_tipo_selecao' atualizado com sucesso!<br>";
        
        // Verificar se o valor foi salvo
        $saved_value = get_field('botao_tipo_selecao', $test_post_id);
        echo "🔍 Valor salvo: '$saved_value'<br>";
        
        if ($saved_value === $botao_tipo_value) {
            echo "✅ Validação: Valor correto!<br>";
        } else {
            echo "❌ Validação: Valor incorreto!<br>";
            echo "Esperado: '$botao_tipo_value'<br>";
            echo "Salvo: '$saved_value'<br>";
        }
    } else {
        echo "❌ Falha ao atualizar campo 'botao_tipo_selecao'<br>";
    }
} else {
    echo "❌ Campo 'botao_tipo_selecao' NÃO encontrado!<br>";
    echo "🔧 <strong>SOLUÇÃO:</strong> Verificar se o Field Group foi importado corretamente<br>";
}
echo "<br>";

// 6. Testar com valor "rewarded"
echo "<h3>🔍 Testando Campo: botao_tipo_selecao com valor 'rewarded'</h3>";
$botao_tipo_value_rewarded = "rewarded";

echo "📝 Valor a ser inserido: '$botao_tipo_value_rewarded'<br>";

$result = update_field('botao_tipo_selecao', $botao_tipo_value_rewarded, $test_post_id);

if ($result) {
    echo "✅ Campo 'botao_tipo_selecao' atualizado com sucesso!<br>";
    
    // Verificar se o valor foi salvo
    $saved_value = get_field('botao_tipo_selecao', $test_post_id);
    echo "🔍 Valor salvo: '$saved_value'<br>";
    
    if ($saved_value === $botao_tipo_value_rewarded) {
        echo "✅ Validação: Valor correto!<br>";
    } else {
        echo "❌ Validação: Valor incorreto!<br>";
        echo "Esperado: '$botao_tipo_value_rewarded'<br>";
        echo "Salvo: '$saved_value'<br>";
    }
} else {
    echo "❌ Falha ao atualizar campo 'botao_tipo_selecao' com valor 'rewarded'<br>";
}
echo "<br>";

// 7. Listar todos os campos ACF da página
echo "<h3>📋 Todos os Campos ACF da Página</h3>";
$all_fields = get_fields($test_post_id);
if ($all_fields) {
    echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>Campo</th><th>Valor</th>";
    echo "</tr>";
    
    foreach ($all_fields as $field_name => $field_value) {
        echo "<tr>";
        echo "<td><strong>$field_name</strong></td>";
        echo "<td>" . (is_array($field_value) ? json_encode($field_value) : $field_value) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "❌ Nenhum campo ACF encontrado na página<br>";
}

// 8. Limpeza
echo "<h3>🧹 Limpeza</h3>";
echo "🗑️ <a href='" . get_delete_post_link($test_post_id) . "' onclick='return confirm(\"Tem certeza que deseja deletar a página de teste?\")'>Deletar Página de Teste</a><br>";

echo "<br><strong>🎯 Próximo passo:</strong> ";
echo "Se os campos não funcionaram, verificar se o Field Group foi importado corretamente";
echo "<br><br>";
?>


