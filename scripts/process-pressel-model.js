/**
 * Script para processar arquivos de modelo Pressel após upload
 */

const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads/pressel-models');

async function processUploadedModel() {
  console.log('🔧 PROCESSANDO MODELOS PRESSEL UPLOADED');
  console.log('======================================\n');

  try {
    // Verificar se a pasta existe
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log('❌ Pasta de upload não encontrada');
      return;
    }

    // Listar modelos disponíveis
    const models = ['V1', 'V3', 'V4', 'V5', 'B1'];
    console.log('🎯 Modelos esperados:', models.join(', '));
    console.log('');

    // Verificar cada modelo
    const processedModels = [];
    const missingModels = [];

    for (const modelName of models) {
      const modelDir = path.join(UPLOAD_DIR, modelName);
      
      if (!fs.existsSync(modelDir)) {
        missingModels.push(modelName);
        console.log(`❌ Modelo ${modelName}: Pasta não encontrada`);
        continue;
      }

      const modelFiles = fs.readdirSync(modelDir);
      const requiredFiles = ['template.php', 'acf-fields.json'];
      
      // Verificar nomes alternativos de arquivos
      const templateFile = modelFiles.find(file => 
        file === 'template.php' || 
        file.includes('pressel') || 
        file.includes('modelo') ||
        file.endsWith('.php')
      );
      
      const acfFile = modelFiles.find(file => 
        file === 'acf-fields.json' || 
        file.includes('ACF') || 
        file.includes('acf') ||
        file.endsWith('.json')
      );
      
      const missingFiles = [];
      if (!templateFile) missingFiles.push('template.php (ou arquivo .php)');
      if (!acfFile) missingFiles.push('acf-fields.json (ou arquivo .json)');
      
      if (missingFiles.length > 0) {
        missingModels.push(modelName);
        console.log(`❌ Modelo ${modelName}: Arquivos faltando: ${missingFiles.join(', ')}`);
        continue;
      }

      console.log(`✅ Modelo ${modelName}: Arquivos encontrados`);
      processedModels.push(modelName);
    }

    console.log('');
    
    if (processedModels.length === 0) {
      console.log('❌ Nenhum modelo válido encontrado');
      console.log('💡 Por favor, faça upload dos arquivos necessários para cada modelo.');
      return;
    }

    if (missingModels.length > 0) {
      console.log(`⚠️  Modelos faltando: ${missingModels.join(', ')}`);
      console.log('💡 Processando apenas os modelos disponíveis.\n');
    }

    // Processar cada modelo válido
    const allModelsConfig = {};
    
    for (const modelName of processedModels) {
      console.log(`\n📄 Processando modelo ${modelName}...`);
      
      const modelDir = path.join(UPLOAD_DIR, modelName);
      
      // Encontrar arquivos corretos
      const modelFiles = fs.readdirSync(modelDir);
      const templateFile = modelFiles.find(file => 
        file === 'template.php' || 
        file.includes('pressel') || 
        file.includes('modelo') ||
        file.endsWith('.php')
      );
      
      const acfFile = modelFiles.find(file => 
        file === 'acf-fields.json' || 
        file.includes('ACF') || 
        file.includes('acf') ||
        file.endsWith('.json')
      );

      // Processar template PHP
      const templatePath = path.join(modelDir, templateFile);
      const phpContent = fs.readFileSync(templatePath, 'utf8');
      
      const templateInfo = extractTemplateInfo(phpContent, modelName);
      console.log(`✅ Template PHP ${modelName} processado:`);
      console.log(`   📝 Nome: ${templateInfo.name}`);
      console.log(`   🔗 Slug: ${templateInfo.slug}`);
      console.log(`   📋 Descrição: ${templateInfo.description}`);

      // Processar campos ACF
      const acfPath = path.join(modelDir, acfFile);
      const acfContent = fs.readFileSync(acfPath, 'utf8');
      const acfFields = JSON.parse(acfContent);
      
      console.log(`✅ Campos ACF ${modelName} processados:`);
      console.log(`   📊 Grupos: ${Array.isArray(acfFields) ? acfFields.length : 'N/A'}`);
      
      let totalFields = 0;
      if (Array.isArray(acfFields)) {
        acfFields.forEach((group, index) => {
          console.log(`   ${index + 1}. ${group.title}: ${group.fields ? group.fields.length : 0} campos`);
          totalFields += group.fields ? group.fields.length : 0;
        });
      } else {
        console.log(`   ⚠️ Estrutura ACF não é um array`);
      }
      console.log(`   📈 Total de campos: ${totalFields}`);

      // Gerar estrutura JSON de exemplo
      const exampleJson = generateExampleJSON(acfFields, templateInfo);
      
      const examplePath = path.join(modelDir, 'example-data.json');
      fs.writeFileSync(examplePath, JSON.stringify(exampleJson, null, 2));
      console.log(`✅ JSON de exemplo gerado: ${modelName}/example-data.json`);

      // Criar configuração do modelo
      const modelConfig = {
        template: templateInfo,
        acfFields: acfFields,
        jsonStructure: exampleJson,
        validationRules: generateValidationRules(acfFields),
        previewData: exampleJson,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        modelName: modelName
      };
      
      const configPath = path.join(modelDir, 'model-config.json');
      fs.writeFileSync(configPath, JSON.stringify(modelConfig, null, 2));
      console.log(`✅ Configuração do modelo criada: ${modelName}/model-config.json`);
      
      allModelsConfig[modelName] = modelConfig;
    }

    // Resumo final
    console.log('\n🎉 PROCESSAMENTO CONCLUÍDO!');
    console.log('==========================');
    console.log(`📊 Modelos processados: ${processedModels.length}`);
    console.log(`📋 Modelos: ${processedModels.join(', ')}`);
    
    if (missingModels.length > 0) {
      console.log(`⚠️  Modelos faltando: ${missingModels.join(', ')}`);
    }
    
    console.log('\n📁 Arquivos gerados por modelo:');
    processedModels.forEach(modelName => {
      console.log(`   ${modelName}/:`);
      console.log(`     - example-data.json (dados de exemplo)`);
      console.log(`     - model-config.json (configuração completa)`);
    });
    
    // Criar arquivo de configuração geral
    const generalConfigPath = path.join(UPLOAD_DIR, 'all-models-config.json');
    fs.writeFileSync(generalConfigPath, JSON.stringify(allModelsConfig, null, 2));
    console.log(`\n📋 Configuração geral criada: all-models-config.json`);
    
    console.log('\n🚀 Próximos passos:');
    console.log('   1. Revisar os arquivos gerados');
    console.log('   2. Executar script de importação no sistema');
    console.log('   3. Configurar modelos no Pressel Automation');
    console.log('   4. Testar com todos os sites do CMS');
    console.log('   5. Validar que todos os sites têm os modelos necessários');

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
  }
}

function extractTemplateInfo(phpContent, modelName) {
  const nameMatch = phpContent.match(/\/\*\*\s*Template Name:\s*(.+?)\s*\*\//);
  const slugMatch = phpContent.match(/\/\*\*\s*Template Slug:\s*(.+?)\s*\*\//);
  const descMatch = phpContent.match(/\/\*\*\s*Description:\s*(.+?)\s*\*\//);
  
  return {
    name: nameMatch ? nameMatch[1].trim() : `Modelo ${modelName}`,
    slug: slugMatch ? slugMatch[1].trim() : `modelo-${modelName.toLowerCase()}`,
    description: descMatch ? descMatch[1].trim() : `Template modelo ${modelName} criado via Pressel Automation`,
    phpContent: phpContent,
    modelName: modelName
  };
}

function generateExampleJSON(acfFields, templateInfo) {
  const exampleData = {
    page_title: 'Exemplo de Página',
    page_content: 'Conteúdo da página de exemplo',
    page_status: 'draft',
    page_template: `${templateInfo.slug}.php`,
    page_slug: 'exemplo-pagina',
    acf_fields: {},
    seo: {
      meta_title: 'Exemplo de Página - SEO',
      meta_description: 'Descrição SEO da página de exemplo',
      focus_keyword: 'exemplo'
    },
    featured_image: 'https://via.placeholder.com/1200x600'
  };
  
  if (Array.isArray(acfFields)) {
    acfFields.forEach(group => {
      if (group.fields && Array.isArray(group.fields)) {
        group.fields.forEach(field => {
      switch (field.type) {
        case 'text':
          exampleData.acf_fields[field.name] = `Exemplo de ${field.label}`;
          break;
        case 'textarea':
          exampleData.acf_fields[field.name] = `Texto longo de exemplo para ${field.label}`;
          break;
        case 'select':
          exampleData.acf_fields[field.name] = field.choices ? Object.keys(field.choices)[0] : 'opcao1';
          break;
        case 'checkbox':
          exampleData.acf_fields[field.name] = true;
          break;
        case 'radio':
          exampleData.acf_fields[field.name] = field.choices ? Object.keys(field.choices)[0] : 'opcao1';
          break;
        case 'image':
          exampleData.acf_fields[field.name] = 'https://via.placeholder.com/600x400';
          break;
        case 'file':
          exampleData.acf_fields[field.name] = 'https://via.placeholder.com/document.pdf';
          break;
        case 'number':
          exampleData.acf_fields[field.name] = 123;
          break;
        case 'email':
          exampleData.acf_fields[field.name] = 'exemplo@email.com';
          break;
        case 'url':
          exampleData.acf_fields[field.name] = 'https://exemplo.com';
          break;
        case 'date':
          exampleData.acf_fields[field.name] = '2024-01-01';
          break;
        case 'time':
          exampleData.acf_fields[field.name] = '12:00';
          break;
        case 'datetime':
          exampleData.acf_fields[field.name] = '2024-01-01 12:00:00';
          break;
        case 'color':
          exampleData.acf_fields[field.name] = '#FF6B35';
          break;
        case 'wysiwyg':
          exampleData.acf_fields[field.name] = '<p>Conteúdo rico de exemplo</p>';
          break;
        default:
          exampleData.acf_fields[field.name] = 'Valor padrão';
      }
        });
      }
    });
  }
  
  return exampleData;
}

function generateValidationRules(acfFields) {
  const rules = {};
  
  if (Array.isArray(acfFields)) {
    acfFields.forEach(group => {
      if (group.fields && Array.isArray(group.fields)) {
        group.fields.forEach(field => {
          rules[field.name] = {
            required: field.required || false,
            type: field.type,
            label: field.label
          };
        });
      }
    });
  }
  
  return rules;
}

processUploadedModel();
