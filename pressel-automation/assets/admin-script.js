/**
 * Pressel Automation - Admin JavaScript
 */

jQuery(document).ready(function($) {
    
    let jsonData = null;
    let isProcessing = false; // Flag para prevenir múltiplas execuções
    
    // Upload area
    const uploadArea = $('#upload-area');
    const fileInput = $('#json-file-input');
    const jsonPreview = $('#json-preview');
    const jsonContent = $('#json-content');
    const processBtn = $('#process-json-btn');
    const resultDiv = $('#pressel-result');
    
    // JSON text input
    const jsonTextInput = $('#json-text-input');
    
    // Tabs
    const tabs = $('.pressel-tab');
    const tabContents = $('.pressel-tab-content');
    
    // Conversão de texto
    const textInput = $('#chatgpt-text-input');
    const pageModelSelect = $('#page-model-select');
    const pageSlugInput = $('#page-slug-input');
    const convertBtn = $('#convert-text-btn');
    const conversionPreview = $('#conversion-preview');
    const generatedJson = $('#generated-json');
    
    // Configurações personalizadas
    const customButtonType = $('#custom-button-type');
    const customButtonColor = $('#custom-button-color');
    const colorValue = $('#color-value');
    const customButton1Url = $('#custom-button-1-url');
    const customButton2Url = $('#custom-button-2-url');
    const customButton3Url = $('#custom-button-3-url');
    
    // Atualizar valor da cor
    customButtonColor.on('change', function() {
        colorValue.text($(this).val());
    });
    
    // Funcionalidade das Tabs
    tabs.on('click', function() {
        const targetTab = $(this).data('tab');
        
        // Remover classe active de todas as tabs
        tabs.removeClass('active');
        tabContents.removeClass('active');
        
        // Adicionar classe active na tab clicada
        $(this).addClass('active');
        $('#' + targetTab + '-tab').addClass('active');
        
        // Atualizar botão de processamento baseado na tab ativa
        updateProcessButton();
    });
    
    // Função para atualizar o botão de processamento
    function updateProcessButton() {
        const activeTab = $('.pressel-tab.active').data('tab');
        let hasJsonData = false;
        
        if (activeTab === 'upload') {
            hasJsonData = jsonData !== null;
        } else if (activeTab === 'paste') {
            hasJsonData = jsonTextInput.val().trim() !== '';
        }
        
        processBtn.prop('disabled', !hasJsonData);
    }
    
    // JSON text input handler
    jsonTextInput.on('input', function() {
        const jsonText = $(this).val().trim();
        
        if (jsonText) {
            try {
                // Validar JSON
                jsonData = JSON.parse(jsonText);
                jsonPreview.show();
                jsonContent.text(JSON.stringify(jsonData, null, 2));
                updateProcessButton();
            } catch (e) {
                // JSON inválido - não mostrar preview
                jsonData = null;
                jsonPreview.hide();
                updateProcessButton();
            }
        } else {
            jsonData = null;
            jsonPreview.hide();
            updateProcessButton();
        }
    });
    
    // Debug: Verificar se elementos foram encontrados
    console.log('Pressel Auto - Elementos de conversão:', {
        textInput: textInput.length,
        convertBtn: convertBtn.length,
        pageModelSelect: pageModelSelect.length
    });
    
    // Click para abrir seleção de arquivo (versão segura)
    uploadArea.on('click', function(e) {
        if ($(e.target).is('input[type="file"]')) {
            return; // Se clicou no input, deixa o comportamento padrão
        }
        e.preventDefault();
        e.stopPropagation();
        fileInput[0].click(); // Usa DOM nativo em vez de jQuery
    });
    
    // Drag & Drop
    uploadArea.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.addClass('drag-over');
    });
    
    uploadArea.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.removeClass('drag-over');
    });
    
    uploadArea.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.removeClass('drag-over');
        
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Seleção de arquivo (prevenir múltiplos triggers)
    fileInput.on('change', function(e) {
        e.stopPropagation();
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });
    
    // Processa o arquivo
    function handleFile(file) {
        if (!file.name.endsWith('.json')) {
            alert('Por favor, selecione um arquivo JSON válido.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                jsonData = JSON.parse(e.target.result);
                displayJsonPreview(jsonData);
                processBtn.prop('disabled', false);
            } catch (error) {
                alert('Erro ao ler JSON: ' + error.message);
                jsonData = null;
                processBtn.prop('disabled', true);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Exibe preview do JSON
    function displayJsonPreview(data) {
        const prettyJson = JSON.stringify(data, null, 2);
        jsonContent.text(prettyJson);
        jsonPreview.show();
        uploadArea.find('.upload-placeholder p').text('Arquivo carregado: ' + (data.page_title || 'sem título'));
    }
    
    // Processa e cria a página (com proteção contra múltiplos cliques)
    processBtn.on('click', function() {
        if (isProcessing) {
            return; // Já está processando
        }
        
        const activeTab = $('.pressel-tab.active').data('tab');
        let dataToProcess = null;
        
        // Determinar fonte dos dados baseado na tab ativa
        if (activeTab === 'upload' && jsonData) {
            dataToProcess = jsonData;
        } else if (activeTab === 'paste') {
            const jsonText = jsonTextInput.val().trim();
            if (jsonText) {
                try {
                    dataToProcess = JSON.parse(jsonText);
                } catch (e) {
                    showResult('error', { message: 'JSON inválido na área de texto' });
                    return;
                }
            }
        }
        
        if (!dataToProcess) {
            showResult('error', { message: 'Nenhum JSON válido encontrado' });
            return;
        }
        
        isProcessing = true;
        processBtn.prop('disabled', true).text('🔄 Processando...');
        resultDiv.hide();
        
        $.ajax({
            url: presselAuto.ajax_url,
            type: 'POST',
            data: {
                action: 'pressel_process_json',
                nonce: presselAuto.nonce,
                json_data: JSON.stringify(dataToProcess)
            },
            success: function(response) {
                if (response.success) {
                    showResult('success', response.data);
                    // Limpar campos após sucesso
                    if (activeTab === 'paste') {
                        jsonTextInput.val('');
                        jsonPreview.hide();
                    }
                } else {
                    showResult('error', { message: response.data });
                }
            },
            error: function(xhr, status, error) {
                showResult('error', { message: 'Erro ao processar: ' + error });
            },
            complete: function() {
                isProcessing = false;
                processBtn.prop('disabled', false).text('🚀 Processar JSON e Criar Página');
                updateProcessButton();
            }
        });
    });
    
    // Exibe resultado
    function showResult(type, data) {
        resultDiv.removeClass('success error').addClass(type);
        
        let html = '';
        
        if (type === 'success') {
            html = `
                <h3>✅ ${data.message}</h3>
                <p><strong>Post ID:</strong> ${data.post_id}</p>
                <div class="pressel-result-links">
                    <a href="${data.edit_link}" target="_blank">Editar Página</a>
                    <a href="${data.view_link}" target="_blank">Visualizar Página</a>
                </div>
            `;
        } else {
            html = `
                <h3>❌ Erro ao criar página</h3>
                <p>${data.message}</p>
            `;
        }
        
        resultDiv.html(html).show();
    }
    
    // Validação de formulário (se houver)
    function validateJson(data) {
        const required = ['page_title', 'acf_fields'];
        
        for (let field of required) {
            if (!data[field]) {
                return { valid: false, error: `Campo obrigatório ausente: ${field}` };
            }
        }
        
        return { valid: true };
    }
    
    // ==================== CONVERSÃO DE TEXTO ====================
    
    // Handler para conversão de texto
    convertBtn.on('click', function(e) {
        console.log('Botão de conversão clicado!');
        e.preventDefault();
        
        if (isProcessing) {
            console.log('Já está processando, aguarde...');
            return;
        }
        
        const textContent = textInput.val().trim();
        const pageModel = pageModelSelect.val();
        const pageSlug = pageSlugInput.val().trim();
        
        console.log('Dados capturados:', {
            textContent: textContent.substring(0, 50) + '...',
            pageModel: pageModel,
            pageSlug: pageSlug
        });
        
        // Configurações personalizadas
        const customSettings = {
            button_type: customButtonType.val(),
            button_color: customButtonColor.val(),
            button_1_url: customButton1Url.val().trim(),
            button_2_url: customButton2Url.val().trim(),
            button_3_url: customButton3Url.val().trim()
        };
        
        if (!textContent) {
            console.log('Validação falhou: texto vazio');
            alert('Por favor, cole o texto do ChatGPT no campo de texto.');
            return;
        }
        
        if (!pageModel) {
            console.log('Validação falhou: modelo não selecionado');
            alert('Por favor, selecione um modelo de página.');
            return;
        }
        
        console.log('Validação OK, iniciando conversão...');
        
        // Mostrar loading
        convertBtn.prop('disabled', true).text('🔄 Convertendo...');
        isProcessing = true;
        
        // Enviar requisição AJAX
        $.ajax({
            url: presselAuto.ajax_url,
            type: 'POST',
            data: {
                action: 'pressel_convert_text',
                nonce: presselAuto.nonce,
                text_content: textContent,
                page_model: pageModel,
                page_slug: pageSlug,
                custom_settings: customSettings
            },
            success: function(response) {
                if (response.success) {
                    showConversionSuccess(response.data);
                } else {
                    showConversionError(response.data);
                }
            },
            error: function(xhr, status, error) {
                showConversionError('Erro na requisição: ' + error);
            },
            complete: function() {
                convertBtn.prop('disabled', false).text('🔄 Converter Texto e Criar Página');
                isProcessing = false;
            }
        });
    });
    
    // Mostrar sucesso da conversão
    function showConversionSuccess(data) {
        const html = `
            <div class="notice notice-success">
                <h3>✅ Página Criada com Sucesso!</h3>
                <p><strong>Página:</strong> ${data.post_id}</p>
                <p><strong>Título:</strong> ${data.message}</p>
                <div style="margin-top: 15px;">
                    <a href="${data.edit_link}" class="button button-primary" target="_blank">✏️ Editar Página</a>
                    <a href="${data.view_link}" class="button button-secondary" target="_blank">👁️ Ver Página</a>
                </div>
                <div style="margin-top: 15px;">
                    <h4>📋 JSON Gerado:</h4>
                    <pre style="background: #f0f0f0; padding: 10px; border-radius: 3px; max-height: 200px; overflow-y: auto;">${JSON.stringify(data.generated_json, null, 2)}</pre>
                </div>
            </div>
        `;
        
        resultDiv.html(html).show();
        conversionPreview.hide();
        
        // Limpar campos
        textInput.val('');
        pageSlugInput.val('');
    }
    
    // Mostrar erro da conversão
    function showConversionError(error) {
        const html = `
            <div class="notice notice-error">
                <h3>❌ Erro na Conversão</h3>
                <p>${error}</p>
            </div>
        `;
        
        resultDiv.html(html).show();
    }
    
    // Preview do JSON (opcional)
    textInput.on('input', function() {
        const text = $(this).val().trim();
        if (text.length > 100) {
            // Mostrar preview básico
            conversionPreview.show();
            generatedJson.text('Preview será gerado após a conversão...');
        } else {
            conversionPreview.hide();
        }
    });
    
});

