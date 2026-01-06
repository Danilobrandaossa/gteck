<?php
/**
 * Script para diagnosticar campos específicos que não estão funcionando
 * Campos: texto_usuario e botao_tipo_selecao
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
    die('❌ Acesso negado. Apenas administradores podem executar o diagnóstico.');
}

echo "<h1>🔍 DIAGNÓSTICO DE CAMPOS ESPECÍFICOS</h1>";
echo "<h2>Campos: texto_usuario e botao_tipo_selecao</h2>";

// 1. Verificar se ACF está ativo
echo "<h3>📋 Status do Plugin ACF</h3>";
if (!function_exists('update_field')) {
    echo "❌ <strong>ACF NÃO ESTÁ ATIVO!</strong><br>";
    echo "Instale e ative o plugin Advanced Custom Fields primeiro.<br><br>";
    exit;
} else {
    echo "✅ <strong>ACF está ativo!</strong><br>";
    echo "Versão: " . (defined('ACF_VERSION') ? ACF_VERSION : 'Desconhecida') . "<br><br>";
}

// 2. Verificar campos específicos
$campos_problema = array(
    'texto_usuario' => array(
        'nome' => 'Texto do Usuário',
        'tipo_esperado' => 'text/textarea'
    ),
    'botao_tipo_selecao' => array(
        'nome' => 'Tipo de Seleção do Botão',
        'tipo_esperado' => 'select/radio/button_group'
    )
);

echo "<h3>🎯 Diagnóstico dos Campos Problemáticos</h3>";
echo "<table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
echo "<tr style='background: #f0f0f0;'>";
echo "<th>Campo</th><th>Nome</th><th>Status</th><th>Tipo ACF</th><th>Opções</th><th>Ações</th>";
echo "</tr>";

foreach ($campos_problema as $field_name => $field_info) {
    $field_object = get_field_object($field_name);
    
    echo "<tr>";
    echo "<td><strong>$field_name</strong></td>";
    echo "<td>{$field_info['nome']}</td>";
    
    if ($field_object) {
        $field_type = $field_object['type'];
        $type_info = $field_type;
        $opcoes_info = "-";
        
        // Informações sobre opções para campos de seleção
        if (in_array($field_type, ['select', 'radio', 'button_group']) && isset($field_object['choices'])) {
            $choices = $field_object['choices'];
            $opcoes_info = count($choices) . " opções";
            
            echo "<td style='background: #d4edda;'>✅ Encontrado</td>";
            echo "<td>$type_info</td>";
            echo "<td>$opcoes_info</td>";
            echo "<td>";
            echo "<details><summary>Ver Opções</summary>";
            echo "<ul>";
            foreach ($choices as $key => $value) {
                echo "<li><strong>$key:</strong> $value</li>";
            }
            echo "</ul>";
            echo "</details>";
            echo "</td>";
        } elseif ($field_type == 'checkbox' && isset($field_object['choices'])) {
            $choices = $field_object['choices'];
            $opcoes_info = count($choices) . " opções";
            
            echo "<td style='background: #d4edda;'>✅ Encontrado</td>";
            echo "<td>$type_info</td>";
            echo "<td>$opcoes_info</td>";
            echo "<td>";
            echo "<details><summary>Ver Opções</summary>";
            echo "<ul>";
            foreach ($choices as $key => $value) {
                echo "<li><strong>$key:</strong> $value</li>";
            }
            echo "</ul>";
            echo "</details>";
            echo "</td>";
        } else {
            echo "<td style='background: #d4edda;'>✅ Encontrado</td>";
            echo "<td>$type_info</td>";
            echo "<td>-</td>";
            echo "<td>-</td>";
        }
    } else {
        echo "<td style='background: #f8d7da;'>❌ Não encontrado</td>";
        echo "<td>-</td>";
        echo "<td>-</td>";
        echo "<td>";
        echo "<strong>🔧 SOLUÇÃO:</strong><br>";
        echo "1. Verificar se o Field Group está ativo<br>";
        echo "2. Verificar se o campo existe no Field Group<br>";
        echo "3. Verificar se o Field Group está associado ao template<br>";
        echo "</td>";
    }
    echo "</tr>";
}

echo "</table>";

// 3. Verificar Field Groups
echo "<h3>📁 Field Groups Ativos</h3>";
$field_groups = acf_get_field_groups();
if ($field_groups) {
    echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>Field Group</th><th>ID</th><th>Status</th><th>Localização</th>";
    echo "</tr>";
    
    foreach ($field_groups as $group) {
        echo "<tr>";
        echo "<td><strong>{$group['title']}</strong></td>";
        echo "<td>{$group['ID']}</td>";
        echo "<td>" . ($group['active'] ? '✅ Ativo' : '❌ Inativo') . "</td>";
        echo "<td>";
        if (isset($group['location']) && is_array($group['location'])) {
            foreach ($group['location'] as $location_group) {
                foreach ($location_group as $location) {
                    if (isset($location['param']) && isset($location['operator']) && isset($location['value'])) {
                        echo "{$location['param']} {$location['operator']} {$location['value']}<br>";
                    }
                }
            }
        } else {
            echo "Não definida";
        }
        echo "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "❌ Nenhum Field Group encontrado";
}

// 4. Verificar se os campos estão em algum Field Group
echo "<h3>🔍 Busca Detalhada dos Campos</h3>";

foreach ($campos_problema as $field_name => $field_info) {
    echo "<h4>Campo: $field_name</h4>";
    
    // Buscar em todos os Field Groups
    $found_in_groups = array();
    foreach ($field_groups as $group) {
        $fields = acf_get_fields($group);
        if ($fields) {
            foreach ($fields as $field) {
                if ($field['name'] === $field_name) {
                    $found_in_groups[] = $group['title'];
                    break;
                }
            }
        }
    }
    
    if (!empty($found_in_groups)) {
        echo "✅ <strong>Campo encontrado nos Field Groups:</strong><br>";
        foreach ($found_in_groups as $group_name) {
            echo "- $group_name<br>";
        }
    } else {
        echo "❌ <strong>Campo NÃO encontrado em nenhum Field Group!</strong><br>";
        echo "<strong>🔧 SOLUÇÃO:</strong><br>";
        echo "1. Verificar se o campo foi criado corretamente<br>";
        echo "2. Verificar se o Field Group foi importado<br>";
        echo "3. Verificar se o nome do campo está correto<br>";
    }
    echo "<br>";
}

// 5. Teste de valores específicos
echo "<h3>🧪 Teste de Valores</h3>";
echo "<h4>Valores esperados para botao_tipo_selecao:</h4>";
echo "<ul>";
echo "<li><strong>normal</strong> - Botão normal</li>";
echo "<li><strong>rewarded</strong> - Botão rewarded (av-rewarded)</li>";
echo "</ul>";

echo "<h4>Valores esperados para texto_usuario:</h4>";
echo "<ul>";
echo "<li>Qualquer texto simples</li>";
echo "<li>Exemplo: \"Você permanecerá no mesmo site\"</li>";
echo "</ul>";

// 6. Instruções de correção
echo "<h3>🔧 INSTRUÇÕES DE CORREÇÃO</h3>";
echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px;'>";
echo "<strong>🚨 SE OS CAMPOS NÃO ESTÃO FUNCIONANDO:</strong><br><br>";
echo "1. <strong>Verificar Field Group:</strong><br>";
echo "   - ACF > Field Groups<br>";
echo "   - Procurar por 'Campos Pressel V1' ou similar<br>";
echo "   - Verificar se está ativo<br><br>";
echo "2. <strong>Verificar Campos:</strong><br>";
echo "   - Editar o Field Group<br>";
echo "   - Procurar por 'texto_usuario' e 'botao_tipo_selecao'<br>";
echo "   - Verificar se existem e estão configurados<br><br>";
echo "3. <strong>Verificar Localização:</strong><br>";
echo "   - Field Group deve estar associado ao template 'pressel-oficial.php'<br>";
echo "   - Ou estar associado a todas as páginas<br><br>";
echo "4. <strong>Reimportar se necessário:</strong><br>";
echo "   - ACF > Tools > Import<br>";
echo "   - Usar arquivo json-v1.json<br>";
echo "   - Fazer backup antes de importar<br>";
echo "</div>";

echo "<br><strong>🎯 Próximo passo:</strong> ";
echo "Se os campos não existem, importar json-v1.json no ACF";
echo "<br><br>";
?>


