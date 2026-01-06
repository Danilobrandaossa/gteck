<?php
// Bootstrap organizado (não altera lógica existente)
if (defined('ABSPATH')) {
    $pressel_base = plugin_dir_path(__FILE__);
    if (file_exists($pressel_base . 'includes/class-pressel-autoloader.php')) {
        require_once $pressel_base . 'includes/class-pressel-autoloader.php';
        Pressel_Autoloader::register($pressel_base);
    }
    if (class_exists('Pressel_REST_Controller')) {
        add_action('plugins_loaded', function () {
            (new Pressel_REST_Controller())->register();
        });
    }
}
/**
 * Plugin Name: Pressel Automation
 * Plugin URI: https://github.com/seu-usuario/pressel-automation
 * Description: Automação para criação de páginas Pressel através de JSON gerado pelo ChatGPT
 * Version: 1.0.0
 * Author: Seu Nome
 * Author URI: https://seusite.com
 * License: GPL v2 or later
 * Text Domain: pressel-automation
 */

// Evita acesso direto
if (!defined('ABSPATH')) {
    exit;
}

class Pressel_Automation {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Adiciona link de diagnóstico no menu
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_diagnostic_link'));
        add_action('wp_ajax_pressel_process_json', array($this, 'process_json_ajax'));
        add_action('wp_ajax_pressel_convert_text', array($this, 'convert_text_ajax'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_shortcode('pressel_diagnostico_acf', array($this, 'diagnostico_acf_shortcode'));
    }
    
    /**
     * Adiciona menu no admin do WordPress
     */
    /**
     * Adiciona link de diagnóstico na lista de plugins
     */
    public function add_diagnostic_link($links) {
        $diagnostic_link = '<a href="' . plugin_dir_url(__FILE__) . 'VERIFICAR-TEMPLATE.php" target="_blank">🔍 Diagnóstico</a>';
        array_unshift($links, $diagnostic_link);
        return $links;
    }
    
    /**
     * Shortcode para diagnóstico ACF
     */
    public function diagnostico_acf_shortcode($atts) {
        // Verificar se é admin
        if (!current_user_can('manage_options')) {
            return '<p>❌ Acesso negado. Apenas administradores podem executar o diagnóstico.</p>';
        }
        
        ob_start();
        $this->render_diagnostico_acf();
        return ob_get_clean();
    }
    
    /**
     * Renderiza o diagnóstico ACF
     */
    private function render_diagnostico_acf() {
        echo "<h2>🔍 DIAGNÓSTICO DE CAMPOS ACF</h2>";
        
        // 1. Verificar se ACF está ativo
        echo "<h3>📋 Status do Plugin ACF</h3>";
        if (!function_exists('update_field')) {
            echo "❌ <strong>ACF NÃO ESTÁ ATIVO!</strong><br>";
            echo "Instale e ative o plugin Advanced Custom Fields primeiro.<br><br>";
            return;
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
                $field_type = $field_object['type'];
                $type_info = $field_type;
                
                // Adiciona informações específicas para campos de seleção
                if (in_array($field_type, ['select', 'radio', 'button_group']) && isset($field_object['choices'])) {
                    $choices_count = count($field_object['choices']);
                    $type_info = "$field_type ($choices_count opções)";
                } elseif ($field_type == 'checkbox' && isset($field_object['choices'])) {
                    $choices_count = count($field_object['choices']);
                    $type_info = "$field_type ($choices_count opções)";
                }
                
                echo "<tr style='background: #d4edda;'>";
                echo "<td><strong>$field_name</strong></td>";
                echo "<td>$field_label</td>";
                echo "<td>✅ Encontrado</td>";
                echo "<td>$type_info</td>";
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
            echo "   - Recarregar esta página<br>";
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
        
        echo "<br><strong>🎯 Próximo passo:</strong> ";
        if (count($missing_fields) > 0) {
            echo "Importar json-v1.json no ACF";
        } else {
            echo "Testar criação de página via Pressel Auto";
        }
        echo "<br><br>";
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Pressel Automation',
            'Pressel Auto',
            'manage_options',
            'pressel-automation',
            array($this, 'render_admin_page'),
            'dashicons-layout',
            30
        );
    }
    
    /**
     * Enfileira scripts e estilos do admin
     */
    public function enqueue_admin_scripts($hook) {
        if ('toplevel_page_pressel-automation' !== $hook) {
            return;
        }
        
        wp_enqueue_style('pressel-automation-css', plugin_dir_url(__FILE__) . 'assets/admin-style.css', array(), '2.0.0');
        wp_enqueue_script('pressel-automation-js', plugin_dir_url(__FILE__) . 'assets/admin-script.js', array('jquery'), '2.0.0', true);
        
        wp_localize_script('pressel-automation-js', 'presselAuto', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pressel_automation_nonce')
        ));
    }
    
    /**
     * Registra rotas da REST API
     */
    public function register_rest_routes() {
        register_rest_route('pressel-automation/v1', '/create-page', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_page_from_json'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
    }
    
    /**
     * Renderiza página administrativa
     */
    public function render_admin_page() {
        ?>
        <div class="wrap pressel-automation-wrap">
            <h1>🚀 Pressel Automation</h1>
            <p class="description">Crie páginas Pressel automaticamente a partir de JSON gerado pelo ChatGPT</p>
            
            <div class="pressel-section" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #0ea5e9;">
                <h2>🔍 Diagnóstico do Sistema</h2>
                <p style="margin-bottom: 1.5rem; color: #0369a1;">Use os diagnósticos para verificar se tudo está configurado corretamente:</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <a href="<?php echo plugin_dir_url(__FILE__); ?>VERIFICAR-TEMPLATE.php" target="_blank" class="pressel-btn pressel-btn-secondary" style="width: auto; min-width: 200px;">
                        🔍 Diagnóstico Template
                    </a>
                    <a href="<?php echo admin_url('post-new.php?post_type=page'); ?>" class="pressel-btn pressel-btn-secondary" style="width: auto; min-width: 200px;">
                        🎯 Criar Página Diagnóstico ACF
                    </a>
                </div>
            </div>
            
            <div class="pressel-automation-container">
                <!-- NOVA SEÇÃO: CONVERSÃO DE TEXTO -->
                <div class="pressel-text-conversion-section">
                    <h2>📝 Conversão de Texto para JSON</h2>
                    <p class="description">Cole o texto gerado pelo ChatGPT e configure as opções abaixo:</p>
                    
                    <div class="pressel-form-group">
                        <label for="chatgpt-text-input">Texto do ChatGPT:</label>
                        <textarea id="chatgpt-text-input" placeholder="Cole aqui o texto completo gerado pelo ChatGPT..." class="pressel-form-group textarea"></textarea>
                    </div>
                    
                    <div class="pressel-form-row">
                        <div class="pressel-form-group">
                            <label for="page-model-select">Modelo de Página:</label>
                            <select id="page-model-select">
                                <option value="modelo_v1">Modelo V1 (Brasileiro)</option>
                                <option value="modelo_v2">Modelo V2 (Internacional)</option>
                                <option value="modelo_v3">Modelo V3 (Minimalista)</option>
                                <option value="modelo_v4">Modelo V4 (E-commerce)</option>
                                <option value="modelo_v5">Modelo V5 (Afiliado)</option>
                            </select>
                        </div>
                        
                        <div class="pressel-form-group">
                            <label for="page-slug-input">Slug da Página (opcional):</label>
                            <input type="text" id="page-slug-input" placeholder="exemplo: minha-pagina-pressel">
                        </div>
                    </div>
                    
                    <div class="pressel-custom-settings">
                        <h4>🎨 Configurações Personalizadas (Opcional)</h4>
                        
                        <div class="pressel-form-row">
                            <div class="pressel-form-group">
                                <label for="custom-button-type">Tipo de Botão:</label>
                                <select id="custom-button-type">
                                    <option value="">Auto-detectar do texto</option>
                                    <option value="normal">Normal</option>
                                    <option value="rewarded">Rewarded (av-rewarded)</option>
                                </select>
                            </div>
                            
                            <div class="pressel-form-group">
                                <label for="custom-button-color">Cor do Botão:</label>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <input type="color" id="custom-button-color" value="#2352AE">
                                    <div class="color-preview">
                                        <span id="color-value">#2352AE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pressel-form-row">
                            <div class="pressel-form-group">
                                <label for="custom-button-1-url">Link Botão 1:</label>
                                <input type="url" id="custom-button-1-url" placeholder="https://exemplo.com">
                            </div>
                            
                            <div class="pressel-form-group">
                                <label for="custom-button-2-url">Link Botão 2:</label>
                                <input type="url" id="custom-button-2-url" placeholder="https://exemplo.com">
                            </div>
                            
                            <div class="pressel-form-group">
                                <label for="custom-button-3-url">Link Botão 3:</label>
                                <input type="url" id="custom-button-3-url" placeholder="https://exemplo.com">
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" class="pressel-btn pressel-btn-primary" id="convert-text-btn">
                        🔄 Converter Texto e Criar Página
                    </button>
                    
                    <div id="conversion-preview" class="json-preview" style="display: none;">
                        <h3>📋 Preview do JSON Gerado:</h3>
                        <pre id="generated-json"></pre>
                    </div>
                </div>
                
                <div class="pressel-section">
                    <h2>📄 Processar JSON</h2>
                    
                    <!-- Tabs -->
                    <div class="pressel-tabs">
                        <button class="pressel-tab active" data-tab="upload">📁 Upload de Arquivo</button>
                        <button class="pressel-tab" data-tab="paste">📋 Colar JSON</button>
                    </div>
                    
                    <!-- Upload Tab -->
                    <div class="pressel-tab-content active" id="upload-tab">
                        <div class="upload-area" id="upload-area">
                            <div class="upload-placeholder">
                                <span class="dashicons dashicons-cloud-upload"></span>
                                <p>Arraste e solte um arquivo JSON aqui ou clique para selecionar</p>
                            </div>
                        </div>
                        <input type="file" id="json-file-input" accept=".json" style="display: none;">
                    </div>
                    
                    <!-- Paste Tab -->
                    <div class="pressel-tab-content" id="paste-tab">
                        <div class="pressel-json-input">
                            <textarea id="json-text-input" placeholder="Cole aqui o JSON gerado pelo ChatGPT ou assistente..."></textarea>
                        </div>
                    </div>
                    
                    <div id="json-preview" class="json-preview" style="display: none;">
                        <h3>📋 Preview do JSON:</h3>
                        <pre id="json-content"></pre>
                    </div>
                    
                    <button type="button" class="pressel-btn pressel-btn-primary" id="process-json-btn" disabled>
                        🚀 Processar JSON e Criar Página
                    </button>
                </div>
                
                <div class="pressel-section">
                    <h2>📋 Como usar</h2>
                    
                    <div class="pressel-tabs">
                        <button class="pressel-tab active" data-tab="instructions">📖 Instruções</button>
                        <button class="pressel-tab" data-tab="files">📁 Arquivos</button>
                    </div>
                    
                    <!-- Instructions Tab -->
                    <div class="pressel-tab-content active" id="instructions-tab">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 1.5rem; border-radius: 12px; border: 1px solid #0ea5e9;">
                                <h4 style="margin-top: 0; color: #0369a1;">🔄 Método 1: Conversão de Texto</h4>
                                <ol style="margin: 0; padding-left: 1.5rem;">
                                    <li>Cole o texto do ChatGPT na seção acima</li>
                                    <li>Configure o modelo e opções</li>
                                    <li>Clique em "Converter Texto e Criar Página"</li>
                                </ol>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 1.5rem; border-radius: 12px; border: 1px solid #10b981;">
                                <h4 style="margin-top: 0; color: #047857;">📄 Método 2: Upload/Colar JSON</h4>
                                <ol style="margin: 0; padding-left: 1.5rem;">
                                    <li>Use o assistente ChatGPT personalizado</li>
                                    <li>Gere um JSON estruturado</li>
                                    <li>Faça upload ou cole o JSON</li>
                                    <li>Clique em "Processar JSON e Criar Página"</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Files Tab -->
                    <div class="pressel-tab-content" id="files-tab">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
                            <a href="<?php echo plugin_dir_url(__FILE__); ?>docs/prompt-chatgpt.txt" download class="pressel-btn pressel-btn-secondary" style="text-decoration: none;">
                                📝 Prompt ChatGPT
                            </a>
                            <a href="<?php echo plugin_dir_url(__FILE__); ?>docs/schema-pressel-v1.json" download class="pressel-btn pressel-btn-secondary" style="text-decoration: none;">
                                📊 Schema JSON
                            </a>
                            <a href="<?php echo plugin_dir_url(__FILE__); ?>docs/exemplo-pressel.json" download class="pressel-btn pressel-btn-secondary" style="text-decoration: none;">
                                💡 Exemplo JSON
                            </a>
                            <a href="<?php echo plugin_dir_url(__FILE__); ?>docs/README.md" download class="pressel-btn pressel-btn-secondary" style="text-decoration: none;">
                                📖 Documentação
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="pressel-result" class="pressel-result" style="display:none;"></div>
        </div>
        <?php
    }
    
    /**
     * Processa JSON via AJAX
     */
    public function process_json_ajax() {
        check_ajax_referer('pressel_automation_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Permissão negada');
        }
        
        $json_data = json_decode(stripslashes($_POST['json_data']), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('JSON inválido: ' . json_last_error_msg());
        }
        
        $result = $this->create_page_from_data($json_data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Converte texto para JSON via AJAX
     */
    public function convert_text_ajax() {
        check_ajax_referer('pressel_automation_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Permissão negada');
        }
        
        $text_content = sanitize_textarea_field($_POST['text_content']);
        $page_model = sanitize_text_field($_POST['page_model']);
        $page_slug = sanitize_text_field($_POST['page_slug']);
        $custom_settings = isset($_POST['custom_settings']) ? $_POST['custom_settings'] : array();
        
        if (empty($text_content)) {
            wp_send_json_error('Texto é obrigatório');
        }
        
        // Converte o texto para JSON
        $json_data = $this->convert_text_to_json($text_content, $page_model, $page_slug, $custom_settings);
        
        if (is_wp_error($json_data)) {
            wp_send_json_error($json_data->get_error_message());
        }
        
        // Cria a página automaticamente
        $result = $this->create_page_from_data($json_data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        // Adiciona o JSON gerado ao resultado
        $result['generated_json'] = $json_data;
        
        wp_send_json_success($result);
    }
    
    /**
     * Cria página a partir do JSON via REST API
     */
    public function create_page_from_json($request) {
        $json_data = $request->get_json_params();
        $result = $this->create_page_from_data($json_data);
        
        if (is_wp_error($result)) {
            return new WP_Error('creation_failed', $result->get_error_message(), array('status' => 400));
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Converte texto do ChatGPT para JSON estruturado
     */
    private function convert_text_to_json($text_content, $page_model, $page_slug = '', $custom_settings = array()) {
        try {
            // Extrai informações básicas do texto
            $lines = explode("\n", $text_content);
            $title = $this->extract_title($lines);
            $description = $this->extract_description($lines);
            
            // Constrói o JSON base
            $json_data = array(
                'page_title' => $title,
                'page_model' => $page_model,
                'page_template' => $this->get_template_by_model_name($page_model),
                'post_status' => 'publish',
                'acf_fields' => array()
            );
            
            // Adiciona slug se fornecido
            if (!empty($page_slug)) {
                $json_data['page_slug'] = $page_slug;
            }
            
            // Extrai campos ACF baseado no modelo
            $acf_fields = $this->extract_acf_fields($text_content, $page_model, $custom_settings);
            $json_data['acf_fields'] = $acf_fields;
            
            // Gera SEO automaticamente
            $json_data['seo'] = $this->generate_seo_data($title, $description);
            
            // Define imagem destacada padrão
            $json_data['featured_image'] = '';
            
            return $json_data;
            
        } catch (Exception $e) {
            return new WP_Error('conversion_error', 'Erro na conversão: ' . $e->getMessage());
        }
    }
    
    /**
     * Extrai o título do texto
     */
    private function extract_title($lines) {
        foreach ($lines as $line) {
            $line = trim($line);
            if (!empty($line) && strlen($line) > 10 && strlen($line) < 100) {
                // Remove caracteres especiais do início
                $line = preg_replace('/^[#*\-+>\s]*/', '', $line);
                if (!empty($line)) {
                    return $line;
                }
            }
        }
        return 'Página Criada Automaticamente - ' . date('d/m/Y H:i');
    }
    
    /**
     * Extrai descrição do texto
     */
    private function extract_description($lines) {
        foreach ($lines as $line) {
            $line = trim($line);
            if (strlen($line) > 50 && strlen($line) < 200) {
                return $line;
            }
        }
        return 'Conteúdo gerado automaticamente pelo Pressel Automation.';
    }
    
    /**
     * Extrai campos ACF baseado no modelo
     */
    private function extract_acf_fields($text_content, $page_model, $custom_settings = array()) {
        $fields = array();
        
        // Campos padrão para todos os modelos
        $fields['hero_description'] = $this->extract_description(explode("\n", $text_content));
        $fields['link_h1'] = '';
        $fields['texto_usuario'] = 'Você permanecerá no mesmo site';
        
        // Campos específicos por modelo
        switch ($page_model) {
            case 'modelo_v1':
                $fields = array_merge($fields, $this->extract_modelo_v1_fields($text_content, $custom_settings));
                break;
            case 'modelo_v2':
                $fields = array_merge($fields, $this->extract_modelo_v2_fields($text_content, $custom_settings));
                break;
            // Adicionar outros modelos conforme necessário
            default:
                $fields = array_merge($fields, $this->extract_modelo_v1_fields($text_content, $custom_settings));
                break;
        }
        
        return $fields;
    }
    
    /**
     * Extrai campos específicos do Modelo V1
     */
    private function extract_modelo_v1_fields($text_content, $custom_settings = array()) {
        $fields = array();
        
        // Campos de botão - DETECÇÃO INTELIGENTE + CONFIGURAÇÕES PERSONALIZADAS
        $fields['botao_tipo_selecao'] = !empty($custom_settings['button_type']) ? $custom_settings['button_type'] : $this->detect_button_type($text_content);
        $fields['titulo_da_secao'] = $this->extract_button_section_title($text_content);
        $fields['cor_botao'] = !empty($custom_settings['button_color']) ? $custom_settings['button_color'] : $this->detect_button_color($text_content);
        
        // Extrair botões com links reais + CONFIGURAÇÕES PERSONALIZADAS
        $buttons = $this->extract_buttons_with_links($text_content);
        $fields['texto_botao_p1'] = $buttons[0]['text'] ?? 'VER MAIS';
        $fields['link_botao_p1'] = !empty($custom_settings['button_1_url']) ? $custom_settings['button_1_url'] : ($buttons[0]['url'] ?? '');
        $fields['texto_botao_p2'] = $buttons[1]['text'] ?? 'SAIBA MAIS';
        $fields['link_botao_p2'] = !empty($custom_settings['button_2_url']) ? $custom_settings['button_2_url'] : ($buttons[1]['url'] ?? '');
        $fields['texto_botao_p3'] = $buttons[2]['text'] ?? 'ACESSAR';
        $fields['link_botao_p3'] = !empty($custom_settings['button_3_url']) ? $custom_settings['button_3_url'] : ($buttons[2]['url'] ?? '');
        
        // Campos de conteúdo - EXTRAÇÃO INTELIGENTE
        $fields['titulo_h2_'] = $this->extract_h2_title($text_content);
        $fields['info_content'] = $this->extract_main_content($text_content);
        $fields['titulo_h2_02'] = $this->extract_secondary_h2_title($text_content);
        $fields['info_content_2'] = $this->extract_secondary_content($text_content);
        
        // Campos de benefícios - EXTRAÇÃO INTELIGENTE
        $benefits = $this->extract_benefits_from_text($text_content);
        $fields['titulo_beneficios'] = $benefits['title'] ?? 'Principais Benefícios';
        $fields['titulo_beneficios_1'] = $benefits['items'][0]['title'] ?? 'Benefício 1';
        $fields['_beneficio_text_1'] = $benefits['items'][0]['description'] ?? 'Benefício personalizado para sua necessidade';
        $fields['titulo_beneficios_2'] = $benefits['items'][1]['title'] ?? 'Benefício 2';
        $fields['_beneficio_text_2'] = $benefits['items'][1]['description'] ?? 'Solução completa e integrada';
        $fields['titulo_beneficios_3'] = $benefits['items'][2]['title'] ?? 'Benefício 3';
        $fields['_beneficio_text_3'] = $benefits['items'][2]['description'] ?? 'Suporte especializado disponível';
        $fields['titulo_beneficios_4'] = $benefits['items'][3]['title'] ?? 'Benefício 4';
        $fields['_beneficio_text_4'] = $benefits['items'][3]['description'] ?? 'Resultados comprovados e garantidos';
        
        // Campos de FAQ - EXTRAÇÃO INTELIGENTE
        $faq = $this->extract_faq_from_text($text_content);
        $fields['titulo_faq'] = $faq['title'] ?? 'Perguntas Frequentes';
        $fields['pergunta_1'] = $faq['items'][0]['question'] ?? 'Como funciona este processo?';
        $fields['resposta_1'] = $faq['items'][0]['answer'] ?? 'O processo é simples e automatizado.';
        $fields['pergunta_2'] = $faq['items'][1]['question'] ?? 'Qual é o prazo para entrega?';
        $fields['resposta_2'] = $faq['items'][1]['answer'] ?? 'O prazo varia conforme a demanda.';
        $fields['pergunta_3'] = $faq['items'][2]['question'] ?? 'Existe garantia de satisfação?';
        $fields['resposta_3'] = $faq['items'][2]['answer'] ?? 'Sim, oferecemos garantia total.';
        
        // Campo de aviso
        $fields['aviso'] = 'aviso_pt';
        
        // VALIDAÇÃO: Verificar campos obrigatórios
        $this->validate_required_fields($fields);
        
        return $fields;
    }
    
    /**
     * Extrai campos específicos do Modelo V2
     */
    private function extract_modelo_v2_fields($text_content) {
        // Implementar campos específicos do modelo V2
        return array();
    }
    
    /**
     * VALIDAÇÃO: Verifica campos obrigatórios
     */
    private function validate_required_fields($fields) {
        $required_fields = array(
            'titulo_da_secao' => 'Título da Seção é obrigatório',
            'titulo_beneficios' => 'Título dos Benefícios é obrigatório',
            'titulo_faq' => 'Título FAQ é obrigatório'
        );
        
        foreach ($required_fields as $field => $message) {
            if (empty($fields[$field])) {
                throw new Exception($message);
            }
        }
    }
    
    /**
     * DETECÇÃO INTELIGENTE: Tipo de botão
     */
    private function detect_button_type($text_content) {
        $text_lower = strtolower($text_content);
        
        // Detectar se é rewarded (av-rewarded)
        if (strpos($text_lower, 'rewarded') !== false || 
            strpos($text_lower, 'av-rewarded') !== false ||
            strpos($text_lower, 'recompensa') !== false) {
            return 'rewarded';
        }
        
        // Detectar se é popup
        if (strpos($text_lower, 'popup') !== false || 
            strpos($text_lower, 'modal') !== false) {
            return 'popup';
        }
        
        // Padrão é normal
        return 'normal';
    }
    
    /**
     * DETECÇÃO INTELIGENTE: Cor do botão
     */
    private function detect_button_color($text_content) {
        $text_lower = strtolower($text_content);
        
        // Detectar cores por palavras-chave
        if (strpos($text_lower, 'vermelho') !== false || strpos($text_lower, 'red') !== false) {
            return '#FF0000';
        }
        if (strpos($text_lower, 'azul') !== false || strpos($text_lower, 'blue') !== false) {
            return '#2352AE';
        }
        if (strpos($text_lower, 'verde') !== false || strpos($text_lower, 'green') !== false) {
            return '#00AA00';
        }
        if (strpos($text_lower, 'laranja') !== false || strpos($text_lower, 'orange') !== false) {
            return '#FF6600';
        }
        if (strpos($text_lower, 'roxo') !== false || strpos($text_lower, 'purple') !== false) {
            return '#6600CC';
        }
        
        // Detectar códigos hexadecimais no texto
        if (preg_match('/#[0-9A-Fa-f]{6}/', $text_content, $matches)) {
            return $matches[0];
        }
        
        // Cor padrão
        return '#2352AE';
    }
    
    /**
     * DETECÇÃO INTELIGENTE: Botões com links
     */
    private function extract_buttons_with_links($text_content) {
        $buttons = array();
        
        // Padrões para detectar botões
        $patterns = array(
            '/\[([^\]]+)\]\(([^)]+)\)/',  // [Texto](URL)
            '/👉\s*\[([^\]]+)\]/',        // 👉 [Texto]
            '/\[VER\s+([^\]]+)\]/i',      // [VER VAGAS]
            '/\[CONHECER\s+([^\]]+)\]/i', // [CONHECER MAIS]
            '/\[ACESSAR\s+([^\]]+)\]/i',  // [ACESSAR]
        );
        
        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text_content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    if (count($match) >= 3) {
                        $buttons[] = array(
                            'text' => trim($match[1]),
                            'url' => isset($match[2]) ? trim($match[2]) : ''
                        );
                    } elseif (count($match) >= 2) {
                        $buttons[] = array(
                            'text' => trim($match[1]),
                            'url' => ''
                        );
                    }
                }
            }
        }
        
        // Se não encontrou botões específicos, usar padrões genéricos
        if (empty($buttons)) {
            $buttons = array(
                array('text' => 'VER MAIS', 'url' => ''),
                array('text' => 'SAIBA MAIS', 'url' => ''),
                array('text' => 'ACESSAR', 'url' => '')
            );
        }
        
        return $buttons;
    }
    
    /**
     * DETECÇÃO INTELIGENTE: Benefícios do texto
     */
    private function extract_benefits_from_text($text_content) {
        $benefits = array(
            'title' => 'Principais Benefícios',
            'items' => array()
        );
        
        $lines = explode("\n", $text_content);
        $current_benefit = null;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Detectar título dos benefícios
            if (strpos(strtolower($line), 'benefício') !== false || 
                strpos(strtolower($line), 'vantagem') !== false ||
                strpos(strtolower($line), 'por que') !== false) {
                $benefits['title'] = $line;
                continue;
            }
            
            // Detectar benefícios com ✨ ou •
            if (strpos($line, '✨') !== false || strpos($line, '•') !== false || strpos($line, '-') !== false) {
                $clean_line = preg_replace('/^[✨•\-\s]+/', '', $line);
                if (strlen($clean_line) > 10) {
                    $benefits['items'][] = array(
                        'title' => $this->extract_title_from_line($clean_line),
                        'description' => $clean_line
                    );
                }
            }
        }
        
        // Garantir pelo menos 4 benefícios
        while (count($benefits['items']) < 4) {
            $index = count($benefits['items']);
            $benefits['items'][] = array(
                'title' => 'Benefício ' . ($index + 1),
                'description' => 'Benefício personalizado para sua necessidade'
            );
        }
        
        return $benefits;
    }
    
    /**
     * DETECÇÃO INTELIGENTE: FAQ do texto
     */
    private function extract_faq_from_text($text_content) {
        $faq = array(
            'title' => 'Perguntas Frequentes',
            'items' => array()
        );
        
        $lines = explode("\n", $text_content);
        $current_question = null;
        $current_answer = null;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Detectar título do FAQ
            if (strpos(strtolower($line), 'pergunta') !== false || 
                strpos(strtolower($line), 'faq') !== false ||
                strpos(strtolower($line), 'dúvida') !== false) {
                $faq['title'] = $line;
                continue;
            }
            
            // Detectar perguntas numeradas
            if (preg_match('/^(\d+)\.\s*(.+)/', $line, $matches)) {
                if ($current_question && $current_answer) {
                    $faq['items'][] = array(
                        'question' => $current_question,
                        'answer' => $current_answer
                    );
                }
                $current_question = $matches[2];
                $current_answer = '';
            } elseif ($current_question && strlen($line) > 10) {
                $current_answer .= ($current_answer ? ' ' : '') . $line;
            }
        }
        
        // Adicionar última pergunta se existir
        if ($current_question && $current_answer) {
            $faq['items'][] = array(
                'question' => $current_question,
                'answer' => $current_answer
            );
        }
        
        // Garantir pelo menos 3 perguntas
        while (count($faq['items']) < 3) {
            $index = count($faq['items']);
            $faq['items'][] = array(
                'question' => 'Pergunta ' . ($index + 1) . '?',
                'answer' => 'Resposta ' . ($index + 1) . '.'
            );
        }
        
        return $faq;
    }
    
    /**
     * Extrai título de uma linha
     */
    private function extract_title_from_line($line) {
        // Pegar as primeiras palavras como título
        $words = explode(' ', $line);
        if (count($words) >= 3) {
            return implode(' ', array_slice($words, 0, 3));
        }
        return $line;
    }
    
    /**
     * Métodos auxiliares para extração de conteúdo
     */
    private function extract_button_section_title($text_content) {
        $lines = explode("\n", $text_content);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '👉') !== false || strpos($line, '[VER') !== false) {
                return 'Acesse Agora';
            }
        }
        return 'Acesse Agora';
    }
    
    private function extract_h2_title($text_content) {
        $lines = explode("\n", $text_content);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strlen($line) > 20 && strlen($line) < 80) {
                return $line;
            }
        }
        return 'Por que Escolher Nossa Solução';
    }
    
    private function extract_main_content($text_content) {
        $paragraphs = array();
        $lines = explode("\n", $text_content);
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (strlen($line) > 50) {
                $paragraphs[] = "<p>" . $line . "</p>";
                if (count($paragraphs) >= 3) break;
            }
        }
        
        return implode('', $paragraphs);
    }
    
    private function extract_secondary_h2_title($text_content) {
        return 'Como Funciona';
    }
    
    private function extract_secondary_content($text_content) {
        return '<p>Descrição adicional sobre o produto ou serviço.</p>';
    }
    
    private function extract_benefit_text($text_content, $number) {
        $benefits = array(
            'Benefício personalizado para sua necessidade',
            'Solução completa e integrada',
            'Suporte especializado disponível',
            'Resultados comprovados e garantidos'
        );
        return $benefits[$number - 1] ?? 'Benefício ' . $number;
    }
    
    private function extract_faq_question($text_content, $number) {
        $questions = array(
            'Como funciona este processo?',
            'Qual é o prazo para entrega?',
            'Existe garantia de satisfação?'
        );
        return $questions[$number - 1] ?? 'Pergunta ' . $number;
    }
    
    private function extract_faq_answer($text_content, $number) {
        $answers = array(
            'O processo é simples e automatizado.',
            'O prazo varia conforme a demanda.',
            'Sim, oferecemos garantia total.'
        );
        return $answers[$number - 1] ?? 'Resposta ' . $number;
    }
    
    private function get_template_by_model_name($model) {
        $templates = array(
            'modelo_v1' => 'pressel-oficial.php',
            'modelo_v2' => 'presell-enus.php',
            'modelo_v3' => 'presell-minimal.php',
            // V4 mapeado para o arquivo real do tema
            'modelo_v4' => 'V4.php',
            'V4' => 'V4.php',
            'pressel_v4' => 'V4.php',
            'modelo_v5' => 'presell-affiliate.php'
        );
        return $templates[$model] ?? 'pressel-oficial.php';
    }
    
    private function generate_seo_data($title, $description) {
        return array(
            'meta_title' => $title,
            'meta_description' => $description,
            'focus_keyword' => $this->extract_focus_keyword($title)
        );
    }
    
    private function extract_focus_keyword($title) {
        // Extrai palavras-chave do título
        $words = explode(' ', strtolower($title));
        $keywords = array_filter($words, function($word) {
            return strlen($word) > 3 && !in_array($word, ['para', 'com', 'como', 'que', 'uma', 'dos', 'das']);
        });
        return implode(' ', array_slice($keywords, 0, 3));
    }
    
    /**
     * Cria a página WordPress com todos os dados
     */
    private function create_page_from_data($data) {
        try {
            // Validação básica
            if (empty($data['page_title'])) {
                return new WP_Error('invalid_data', 'Título da página é obrigatório');
            }
            
            // Prepara dados do post
            $post_data = array(
                'post_title'    => sanitize_text_field($data['page_title']),
                'post_status'   => isset($data['post_status']) ? $data['post_status'] : 'publish',
                'post_type'     => 'page',
                'post_author'   => get_current_user_id(),
            );
            
            // Adiciona slug personalizado se fornecido
            if (isset($data['page_slug']) && !empty($data['page_slug'])) {
                $post_data['post_name'] = sanitize_title($data['page_slug']);
            }
            
            // Cria o post
            $post_id = wp_insert_post($post_data);
            
            if (is_wp_error($post_id)) {
                return $post_id;
            }
            
            // Sistema de seleção automática de template baseado no modelo
            $template = $this->get_template_by_model($data);
            
            // Verifica se o template existe
            $template_path = get_template_directory() . '/' . $template;
            if (!file_exists($template_path)) {
                error_log("Pressel Auto: Template '$template' não encontrado em '$template_path'");
                // Tenta template padrão se o especificado não existir
                $template = 'pressel-oficial.php';
                $template_path = get_template_directory() . '/' . $template;
                if (!file_exists($template_path)) {
                    error_log("Pressel Auto: Template padrão 'pressel-oficial.php' também não encontrado");
                }
            }
            
            $template_result = update_post_meta($post_id, '_wp_page_template', sanitize_text_field($template));
            
            // Debug: Log template setting
            if (!$template_result) {
                error_log("Pressel Auto: Falha ao definir template '$template' para post $post_id");
            } else {
                error_log("Pressel Auto: Template '$template' definido com sucesso para post $post_id");
            }
            
            // Preenche campos ACF
            $acf_result = $this->populate_acf_fields($post_id, $data);
            if (is_wp_error($acf_result)) {
                wp_delete_post($post_id, true); // Deleta página se ACF falhar
                return $acf_result;
            }
            
            // Configura SEO
            if (isset($data['seo'])) {
                $this->setup_seo($post_id, $data['seo']);
            }
            
            // Processa imagens
            if (isset($data['featured_image'])) {
                $this->set_featured_image($post_id, $data['featured_image']);
            }
            
            return array(
                'success' => true,
                'post_id' => $post_id,
                'edit_link' => get_edit_post_link($post_id, 'raw'),
                'view_link' => get_permalink($post_id),
                'message' => 'Página criada com sucesso!'
            );
            
        } catch (Exception $e) {
            return new WP_Error('creation_error', $e->getMessage());
        }
    }
    
    /**
     * Seleciona template baseado no modelo especificado no JSON
     */
    private function get_template_by_model($data) {
        // Mapeamento de modelos para templates
        $model_templates = array(
            // Modelos V1 (Brasileiro)
            'modelo_v1' => 'pressel-oficial.php',
            'modelo_brasileiro' => 'pressel-oficial.php',
            'presell_ptbr' => 'pressel-oficial.php',
            'pt_br' => 'pressel-oficial.php',
            
            // Modelos V2 (Internacional)
            'modelo_v2' => 'presell-enus.php',
            'modelo_internacional' => 'presell-enus.php',
            'presell_enus' => 'presell-enus.php',
            'en_us' => 'presell-enus.php',
            
            // Modelos V3 (Minimalista)
            'modelo_v3' => 'presell-minimal.php',
            'modelo_minimalista' => 'presell-minimal.php',
            'presell_minimal' => 'presell-minimal.php',
            'minimal' => 'presell-minimal.php',
            
        // Modelos V4 (Pressel V4 do tema BT) → arquivo V4.php
        'modelo_v4' => 'V4.php',
        'V4' => 'V4.php',
        'pressel_v4' => 'V4.php',
        'pressel V4' => 'V4.php',
        'pressel-v4' => 'V4.php',
            
            // Modelos V5 (Afiliado)
            'modelo_v5' => 'presell-affiliate.php',
            'modelo_afiliado' => 'presell-affiliate.php',
            'presell_affiliate' => 'presell-affiliate.php',
            'affiliate' => 'presell-affiliate.php'
        );
        
        // 1. Verifica se tem campo 'page_model' no JSON
        if (isset($data['page_model']) && !empty($data['page_model'])) {
            $model = strtolower(trim($data['page_model']));
            if (isset($model_templates[$model])) {
                error_log("Pressel Auto: Modelo '$model' encontrado, usando template: " . $model_templates[$model]);
                return $model_templates[$model];
            }
        }
        
        // 2. Verifica se tem campo 'page_template' (método antigo)
        if (isset($data['page_template']) && !empty($data['page_template'])) {
            error_log("Pressel Auto: Usando template especificado: " . $data['page_template']);
            return $data['page_template'];
        }
        
        // 3. Detecta modelo automaticamente pelos campos ACF
        $acf_fields = isset($data['acf_fields']) ? $data['acf_fields'] : array();
        
        // Se tem campos específicos do modelo brasileiro
        if (isset($acf_fields['hero_description']) && 
            isset($acf_fields['titulo_beneficios']) && 
            isset($acf_fields['titulo_faq'])) {
            error_log("Pressel Auto: Detectado modelo brasileiro automaticamente");
            return 'pressel-oficial.php';
        }
        
        // Se tem campos específicos do modelo internacional
        if (isset($acf_fields['hero_title']) && 
            isset($acf_fields['benefits_title']) && 
            isset($acf_fields['faq_title'])) {
            error_log("Pressel Auto: Detectado modelo internacional automaticamente");
            return 'presell-enus.php';
        }
        
        // 4. Fallback para modelo padrão
        error_log("Pressel Auto: Usando template padrão (modelo não detectado)");
        return 'pressel-oficial.php';
    }
    
    /**
     * Valida campos de seleção (select, radio, button_group)
     */
    private function validate_select_field($field_object, $value) {
        if (!$field_object || !isset($field_object['choices'])) {
            return sanitize_text_field($value);
        }
        
        $choices = $field_object['choices'];
        $value_clean = sanitize_text_field($value);
        
        // Verifica se o valor está nas opções disponíveis
        if (array_key_exists($value_clean, $choices)) {
            return $value_clean;
        }
        
        // Se não encontrar, tenta por valor (não por chave)
        $found_key = array_search($value_clean, $choices);
        if ($found_key !== false) {
            return $found_key;
        }
        
        // Se não encontrar, usa o primeiro valor disponível como fallback
        $first_choice = array_keys($choices)[0];
        error_log("Pressel Auto: Valor '$value' não encontrado em campo select '{$field_object['name']}', usando '$first_choice' como fallback");
        return $first_choice;
    }
    
    /**
     * Valida campos de checkbox
     */
    private function validate_checkbox_field($field_object, $values) {
        if (!$field_object || !isset($field_object['choices'])) {
            return array_map('sanitize_text_field', $values);
        }
        
        $choices = $field_object['choices'];
        $valid_values = array();
        
        foreach ($values as $value) {
            $value_clean = sanitize_text_field($value);
            
            if (array_key_exists($value_clean, $choices)) {
                $valid_values[] = $value_clean;
            } else {
                // Tenta por valor (não por chave)
                $found_key = array_search($value_clean, $choices);
                if ($found_key !== false) {
                    $valid_values[] = $found_key;
                }
            }
        }
        
        return $valid_values;
    }
    
    /**
     * Verifica se os campos ACF existem
     */
    private function check_acf_fields_exist($field_mapping) {
        $missing_fields = array();
        
        foreach ($field_mapping as $json_key => $acf_key) {
            if (!function_exists('get_field_object')) {
                continue; // Se não tem ACF, pula verificação
            }
            
            $field_object = get_field_object($acf_key);
            if (!$field_object) {
                $missing_fields[] = $acf_key;
            }
        }
        
        if (!empty($missing_fields)) {
            error_log("Pressel Auto: Campos ACF não encontrados: " . implode(', ', $missing_fields));
            return $missing_fields;
        }
        
        return array();
    }
    
    /**
     * Preenche todos os campos ACF
     */
    private function populate_acf_fields($post_id, $data) {
        // CRÍTICO: Verifica se ACF está ativo
        if (!function_exists('update_field')) {
            return new WP_Error('acf_not_found', 'Plugin Advanced Custom Fields não está instalado ou ativo');
        }
        
        $acf_fields = isset($data['acf_fields']) ? $data['acf_fields'] : array();
        
        // Mapeamento dos campos ACF
        $field_mapping = array(
            'hero_description' => 'hero_description',
            'link_h1' => 'link_h1',
            'botao_tipo_selecao' => 'botao_tipo_selecao',
            'titulo_da_secao' => 'titulo_da_secao',
            'cor_botao' => 'cor_botao',
            'texto_botao_p1' => 'texto_botao_p1',
            'link_botao_p1' => 'link_botao_p1',
            'texto_botao_p2' => 'texto_botao_p2',
            'link_botao_p2' => 'link_botao_p2',
            'texto_botao_p3' => 'texto_botao_p3',
            'link_botao_p3' => 'link_botao_p3',
            'texto_usuario' => 'texto_usuario',
            'titulo_h2_' => 'titulo_h2_',
            'info_content' => 'info_content',
            'titulo_h2_02' => 'titulo_h2_02',
            'info_content_2' => 'info_content_2',
            'titulo_beneficios' => 'titulo_beneficios',
            'titulo_beneficios_1' => 'titulo_beneficios_1',
            '_beneficio_text_1' => '_beneficio_text_1',
            'titulo_beneficios_2' => 'titulo_beneficios_2',
            '_beneficio_text_2' => '_beneficio_text_2',
            'titulo_beneficios_3' => 'titulo_beneficios_3',
            '_beneficio_text_3' => '_beneficio_text_3',
            'titulo_beneficios_4' => 'titulo_beneficios_4',
            '_beneficio_text_4' => '_beneficio_text_4',
            'titulo_faq' => 'titulo_faq',
            'pergunta_1' => 'pergunta_1',
            'resposta_1' => 'resposta_1',
            'pergunta_2' => 'pergunta_2',
            'resposta_2' => 'resposta_2',
            'pergunta_3' => 'pergunta_3',
            'resposta_3' => 'resposta_3',
            'aviso' => 'aviso'
        );
        
        // Verifica se os campos ACF existem
        $missing_fields = $this->check_acf_fields_exist($field_mapping);
        if (!empty($missing_fields)) {
            error_log("Pressel Auto: AVISO - Alguns campos ACF não existem: " . implode(', ', $missing_fields));
        }
        
        $updated_fields = 0;
        $failed_fields = 0;
        
        foreach ($field_mapping as $json_key => $acf_key) {
            if (isset($acf_fields[$json_key]) && !empty($acf_fields[$json_key])) {
                $field_value = $acf_fields[$json_key];
                
                // Verifica o tipo de campo ACF para tratamento específico
                $field_object = get_field_object($acf_key);
                $field_type = $field_object ? $field_object['type'] : 'text';
                
                // Trata o valor baseado no tipo de campo
                switch ($field_type) {
                    case 'select':
                    case 'radio':
                    case 'button_group':
                        // Campos de seleção - valida contra opções disponíveis
                        $field_value = $this->validate_select_field($field_object, $field_value);
                        break;
                        
                    case 'checkbox':
                        // Campos de checkbox - pode ser array
                        if (is_array($field_value)) {
                            $field_value = $this->validate_checkbox_field($field_object, $field_value);
                        } else {
                            $field_value = sanitize_text_field($field_value);
                        }
                        break;
                        
                    case 'textarea':
                    case 'wysiwyg':
                        // Campos de texto longo
                        $field_value = wp_kses_post($field_value);
                        break;
                        
                    case 'url':
                        // Campos de URL
                        $field_value = esc_url_raw($field_value);
                        break;
                        
                    case 'email':
                        // Campos de email
                        $field_value = sanitize_email($field_value);
                        break;
                        
                    case 'number':
                        // Campos numéricos
                        $field_value = floatval($field_value);
                        break;
                        
                    default:
                        // Campos de texto simples
                        if (strpos($json_key, 'content') !== false || strpos($json_key, 'info_') !== false) {
                            $field_value = wp_kses_post($field_value);
                        } else {
                            $field_value = sanitize_text_field($field_value);
                        }
                        break;
                }
                
                $result = update_field($acf_key, $field_value, $post_id);
                
                if ($result) {
                    $updated_fields++;
                    error_log("Pressel Auto: Campo '$acf_key' ($field_type) atualizado com sucesso");
                } else {
                    $failed_fields++;
                    error_log("Pressel Auto: Falha ao atualizar campo '$acf_key' ($field_type)");
                }
            } else {
                error_log("Pressel Auto: Campo '$json_key' não encontrado ou vazio no JSON");
            }
        }
        
        error_log("Pressel Auto: Campos atualizados: $updated_fields, Falhas: $failed_fields");
        
        // Verifica se pelo menos alguns campos foram preenchidos
        if ($updated_fields === 0) {
            return new WP_Error('no_fields_updated', 'Nenhum campo ACF foi preenchido. Verifique se os campos existem no ACF.');
        }
    }
    
    /**
     * Configura SEO (Yoast/RankMath)
     */
    private function setup_seo($post_id, $seo_data) {
        // Yoast SEO
        if (defined('WPSEO_VERSION')) {
            update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($seo_data['meta_title'] ?? ''));
            update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_textarea_field($seo_data['meta_description'] ?? ''));
            update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($seo_data['focus_keyword'] ?? ''));
        }
        
        // Rank Math SEO
        if (defined('RANK_MATH_VERSION')) {
            update_post_meta($post_id, 'rank_math_title', sanitize_text_field($seo_data['meta_title'] ?? ''));
            update_post_meta($post_id, 'rank_math_description', sanitize_textarea_field($seo_data['meta_description'] ?? ''));
            update_post_meta($post_id, 'rank_math_focus_keyword', sanitize_text_field($seo_data['focus_keyword'] ?? ''));
        }
        
        // All in One SEO
        if (defined('AIOSEO_VERSION')) {
            update_post_meta($post_id, '_aioseo_title', sanitize_text_field($seo_data['meta_title'] ?? ''));
            update_post_meta($post_id, '_aioseo_description', sanitize_textarea_field($seo_data['meta_description'] ?? ''));
        }
    }
    
    /**
     * Define imagem destacada a partir de URL
     */
    private function set_featured_image($post_id, $image_url) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $image_id = media_sideload_image($image_url, $post_id, null, 'id');
        
        if (!is_wp_error($image_id)) {
            set_post_thumbnail($post_id, $image_id);
        }
    }
}

// Inicializa o plugin
function pressel_automation_init() {
    return Pressel_Automation::get_instance();
}
add_action('plugins_loaded', 'pressel_automation_init');

