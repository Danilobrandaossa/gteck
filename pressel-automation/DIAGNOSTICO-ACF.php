<?php
/**
 * Diagnóstico específico para campos ACF
 * Execute este arquivo para verificar se os campos estão configurados corretamente
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

echo "<h2>🔍 DIAGNÓSTICO DE CAMPOS ACF</h2>";

// 1. Verificar se ACF está ativo
echo "<h3>📋 Status do Plugin ACF</h3>";
if (!function_exists('update_field')) {
    echo "❌ <strong>ACF NÃO ESTÁ ATIVO!</strong><br>";
    echo "Instale e ative o plugin Advanced Custom Fields primeiro.<br><br>";
    die();
} else {
    echo "✅ <strong>ACF está ativo!</strong><br>";
    echo "Versão: " . (defined('ACF_VERSION') ? ACF_VERSION : 'Desconhecida') . "<br><br>";
}

// 2. Listar Field Groups
echo "<h3>📁 Field Groups Disponíveis</h3>";
$field_groups = acf_get_field_groups();
if ($field_groups) {
    echo "Field Groups encontrados:<br>";
    foreach ($field_groups as $group) {
        echo "- <strong>" . $group['title'] . "</strong> (ID: " . $group['ID'] . ")<br>";
    }
} else {
    echo "❌ Nenhum Field Group encontrado<br>";
}

// 3. Verificar campos específicos do Pressel
echo "<h3>🎯 Campos do Pressel V1</h3>";

$required_fields = array(
    'hero_description' => 'Descrição do Hero',
    'link_h1' => 'Link H1',
    'botao_tipo_selecao' => 'Tipo de Seleção do Botão',
    'titulo_da_secao' => 'Título da Seção',
    'cor_botao' => 'Cor do Botão',
    'texto_botao_p1' => 'Texto do Botão 1',
    'link_botao_p1' => 'Link do Botão 1',
    'texto_botao_p2' => 'Texto do Botão 2',
    'link_botao_p2' => 'Link do Botão 2',
    'texto_botao_p3' => 'Texto do Botão 3',
    'link_botao_p3' => 'Link do Botão 3',
    'texto_usuario' => 'Texto do Usuário',
    'titulo_h2_' => 'Título H2 Principal',
    'info_content' => 'Conteúdo Principal',
    'titulo_h2_02' => 'Título H2 Secundário',
    'info_content_2' => 'Conteúdo Secundário',
    'titulo_beneficios' => 'Título dos Benefícios',
    'titulo_beneficios_1' => 'Título Benefício 1',
    '_beneficio_text_1' => 'Texto Benefício 1',
    'titulo_beneficios_2' => 'Título Benefício 2',
    '_beneficio_text_2' => 'Texto Benefício 2',
    'titulo_beneficios_3' => 'Título Benefício 3',
    '_beneficio_text_3' => 'Texto Benefício 3',
    'titulo_beneficios_4' => 'Título Benefício 4',
    '_beneficio_text_4' => 'Texto Benefício 4',
    'titulo_faq' => 'Título FAQ',
    'pergunta_1' => 'Pergunta 1',
    'resposta_1' => 'Resposta 1',
    'pergunta_2' => 'Pergunta 2',
    'resposta_2' => 'Resposta 2',
    'pergunta_3' => 'Pergunta 3',
    'resposta_3' => 'Resposta 3',
    'aviso' => 'Aviso'
);

$found_fields = 0;
$missing_fields = array();

echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
echo "<tr style='background: #f0f0f0;'>";
echo "<th>Campo</th><th>Nome</th><th>Status</th><th>Tipo</th>";
echo "</tr>";

foreach ($required_fields as $field_name => $field_label) {
    $field_object = get_field_object($field_name);
    
    if ($field_object) {
        echo "<tr style='background: #d4edda;'>";
        echo "<td><strong>$field_name</strong></td>";
        echo "<td>$field_label</td>";
        echo "<td>✅ Encontrado</td>";
        echo "<td>" . $field_object['type'] . "</td>";
        echo "</tr>";
        $found_fields++;
    } else {
        echo "<tr style='background: #f8d7da;'>";
        echo "<td><strong>$field_name</strong></td>";
        echo "<td>$field_label</td>";
        echo "<td>❌ Não encontrado</td>";
        echo "<td>-</td>";
        echo "</tr>";
        $missing_fields[] = $field_name;
    }
}

echo "</table>";

// 4. Resumo
echo "<h3>📊 Resumo</h3>";
echo "✅ Campos encontrados: $found_fields<br>";
echo "❌ Campos faltando: " . count($missing_fields) . "<br>";

if (!empty($missing_fields)) {
    echo "<br><strong>Campos que precisam ser criados:</strong><br>";
    foreach ($missing_fields as $field) {
        echo "- $field<br>";
    }
}

// 5. Instruções de correção
echo "<h3>🔧 INSTRUÇÕES DE CORREÇÃO</h3>";

if (count($missing_fields) > 0) {
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px;'>";
    echo "<strong>🚨 AÇÃO NECESSÁRIA:</strong><br><br>";
    echo "1. <strong>Importar Field Group:</strong><br>";
    echo "   - ACF > Tools > Import<br>";
    echo "   - Selecionar arquivo: json-v1.json<br>";
    echo "   - Clicar em Import<br><br>";
    echo "2. <strong>Verificar Field Group:</strong><br>";
    echo "   - ACF > Field Groups<br>";
    echo "   - Deve aparecer: 'Campos Pressel V1'<br>";
    echo "   - Verificar se todos os campos estão lá<br><br>";
    echo "3. <strong>Configurar Localização:</strong><br>";
    echo "   - Editar Field Group<br>";
    echo "   - Localização: Page Template is equal to pressel-oficial.php<br>";
    echo "   - Salvar<br><br>";
    echo "4. <strong>Testar novamente:</strong><br>";
    echo "   - Recarregar este diagnóstico<br>";
    echo "   - Verificar se todos os campos aparecem<br>";
    echo "</div>";
} else {
    echo "<div style='background: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;'>";
    echo "✅ <strong>Todos os campos ACF estão configurados!</strong><br><br>";
    echo "Se ainda há problemas no preenchimento:<br>";
    echo "1. Verificar se o Field Group está associado ao template correto<br>";
    echo "2. Verificar se o template pressel-oficial.php está sendo usado<br>";
    echo "3. Verificar logs do WordPress para erros específicos<br>";
    echo "</div>";
}

// 6. Teste de preenchimento
echo "<h3>🧪 Teste de Preenchimento</h3>";
echo "<p>Para testar se os campos funcionam:</p>";
echo "<ol>";
echo "<li>Criar uma página de teste</li>";
echo "<li>Aplicar template 'pressel-oficial.php'</li>";
echo "<li>Verificar se os campos ACF aparecem no editor</li>";
echo "<li>Preencher alguns campos manualmente</li>";
echo "<li>Salvar e verificar se os dados são salvos</li>";
echo "</ol>";

echo "<br><strong>🎯 Próximo passo:</strong> ";
if (count($missing_fields) > 0) {
    echo "Importar json-v1.json no ACF";
} else {
    echo "Testar criação de página via Pressel Auto";
}
echo "<br><br>";

// Botão para recarregar
echo "<button onclick='location.reload()'>🔄 Recarregar Diagnóstico ACF</button>";
?>


