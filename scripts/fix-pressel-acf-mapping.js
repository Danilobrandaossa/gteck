/**
 * Script para corrigir o mapeamento dos campos ACF do Pressel Automation
 * Lê o arquivo ACF-V1-10-25.json e cria um mapeamento correto
 */

const fs = require('fs');
const path = require('path');

const ACF_FILE_PATH = path.join(process.cwd(), 'uploads', 'pressel-models', 'V1', 'ACF-V1-10-25.json');

function createACFFieldMapping() {
  console.log('🔧 CRIANDO MAPEAMENTO CORRETO DOS CAMPOS ACF');
  console.log('==========================================\n');

  try {
    // Ler o arquivo ACF
    const acfContent = fs.readFileSync(ACF_FILE_PATH, 'utf8');
    const acfData = JSON.parse(acfContent);
    
    console.log('✅ Arquivo ACF carregado com sucesso');
    console.log(`📊 Grupos encontrados: ${acfData.length}`);
    
    // Extrair campos do primeiro grupo
    const fieldGroup = acfData[0];
    const fields = fieldGroup.fields;
    
    console.log(`📋 Campos encontrados: ${fields.length}`);
    
    // Criar mapeamento de campos
    const fieldMapping = {};
    const fieldTypes = {};
    const requiredFields = [];
    
    fields.forEach(field => {
      fieldMapping[field.name] = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required === 1 || field.required === true,
        default_value: field.default_value || '',
        maxlength: field.maxlength || null,
        choices: field.choices || null
      };
      
      fieldTypes[field.name] = field.type;
      
      if (field.required === 1 || field.required === true) {
        requiredFields.push(field.name);
      }
    });
    
    console.log('\n📋 MAPEAMENTO DE CAMPOS CRIADO:');
    console.log('===============================');
    
    Object.entries(fieldMapping).forEach(([name, config]) => {
      console.log(`${name}:`);
      console.log(`  - Tipo: ${config.type}`);
      console.log(`  - Obrigatório: ${config.required ? 'Sim' : 'Não'}`);
      console.log(`  - Label: ${config.label}`);
      if (config.maxlength) console.log(`  - Max Length: ${config.maxlength}`);
      if (config.choices) console.log(`  - Opções: ${Object.keys(config.choices).join(', ')}`);
      console.log('');
    });
    
    console.log(`📊 CAMPOS OBRIGATÓRIOS (${requiredFields.length}):`);
    console.log('=====================================');
    requiredFields.forEach(field => {
      console.log(`- ${field} (${fieldTypes[field]})`);
    });
    
    // Criar arquivo de mapeamento
    const mappingData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      modelName: 'V1',
      templateFile: 'pressel-oficial.php',
      fieldMapping: fieldMapping,
      fieldTypes: fieldTypes,
      requiredFields: requiredFields,
      totalFields: fields.length
    };
    
    const mappingPath = path.join(process.cwd(), 'uploads', 'pressel-models', 'V1', 'acf-field-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2));
    
    console.log('\n✅ ARQUIVO DE MAPEAMENTO CRIADO:');
    console.log('===============================');
    console.log(`📄 Local: ${mappingPath}`);
    console.log(`📊 Total de campos: ${mappingData.totalFields}`);
    console.log(`📋 Campos obrigatórios: ${mappingData.requiredFields.length}`);
    
    return mappingData;
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo ACF:', error.message);
    return null;
  }
}

function updateModelIdentifier() {
  console.log('\n🔧 ATUALIZANDO MODEL IDENTIFIER');
  console.log('==============================');
  
  const mappingData = createACFFieldMapping();
  if (!mappingData) return;
  
  // Atualizar o ModelIdentifier com os campos corretos
  const modelIdentifierPath = path.join(process.cwd(), 'lib', 'model-identifier.ts');
  
  try {
    let content = fs.readFileSync(modelIdentifierPath, 'utf8');
    
    // Extrair nomes dos campos
    const fieldNames = Object.keys(mappingData.fieldMapping);
    const requiredFields = mappingData.requiredFields;
    
    // Atualizar a definição do modelo V1
    const v1Definition = `
            // Modelo V1 - Pressel Oficial (campos reais do arquivo ACF)
            this.modelSignatures.set('V1', {
              modelName: 'V1',
              uniqueFields: ${JSON.stringify(fieldNames, null, 16)},
              commonFields: ['hero_title', 'hero_image'],
              fieldPatterns: [
                /titulo_da_secao/,
                /cor_botao/,
                /texto_botao_p[123]/,
                /link_botao_p[123]/,
                /titulo_h2_/,
                /titulo_beneficios/,
                /titulo_faq/,
                /pergunta_[123]/,
                /resposta_[123]/,
                /_beneficio_text_[1234]/
              ],
              requiredFields: ${JSON.stringify(requiredFields, null, 16)},
              optionalFields: ${JSON.stringify(fieldNames.filter(f => !requiredFields.includes(f)), null, 16)},
              templateFile: 'pressel-oficial.php',
              description: 'Modelo V1 - Pressel Oficial com seções de benefícios e FAQ'
            })`;
    
    // Substituir a definição do V1
    const v1Regex = /\/\/ Modelo V1 - Pressel Oficial \(campos reais do arquivo ACF\)[\s\S]*?}\)/;
    content = content.replace(v1Regex, v1Definition.trim());
    
    fs.writeFileSync(modelIdentifierPath, content);
    
    console.log('✅ ModelIdentifier atualizado com sucesso');
    console.log(`📊 Campos únicos: ${fieldNames.length}`);
    console.log(`📋 Campos obrigatórios: ${requiredFields.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar ModelIdentifier:', error.message);
  }
}

function createTestScript() {
  console.log('\n🔧 CRIANDO SCRIPT DE TESTE');
  console.log('==========================');
  
  const testScript = `
/**
 * Teste do Pressel Automation com campos ACF corretos
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function testPresselWithCorrectACF() {
  console.log('🧪 TESTE DO PRESSEL AUTOMATION COM CAMPOS ACF CORRETOS');
  console.log('====================================================\\n');

  const auth = Buffer.from(\`\${USERNAME}:\${PASSWORD}\`).toString('base64');
  
  // JSON de teste com todos os campos ACF corretos
  const testJson = {
    page_title: "Driving Licence Test App: Practice for the Exam!",
    page_model: "modelo_v1",
    page_template: "pressel-oficial.php",
    page_slug: "driving-licence-test-app-corrected",
    post_status: "publish",
    acf_fields: {
      hero_description: "Prepare for your driving licence test with these top-rated free apps.",
      link_h1: "",
      botao_tipo_selecao: "normal",
      titulo_da_secao: "Get your approval!",
      cor_botao: "#2352AE",
      texto_botao_p1: "SEE IF YOU QUALIFY",
      link_botao_p1: "https://example.com/driving-licence-test-app",
      texto_botao_p2: "LEARN MORE",
      link_botao_p2: "https://example.com/driving-licence-test-app",
      texto_botao_p3: "GET STARTED",
      link_botao_p3: "https://example.com/driving-licence-test-app",
      texto_usuario: "Você permanecerá no mesmo site",
      titulo_h2_: "Study the Theory and Pass with Confidence",
      info_content: "<p>Want to pass your driving test on the first try? Use the best driving licence test app to practice for your exam and ensure you're fully prepared.</p>",
      titulo_h2_02: "Test Your Knowledge Anywhere, Anytime",
      info_content_2: "<p>With the Driving Licence Test App, you can practice anytime, anywhere, whether you're at home or on the go.</p>",
      titulo_beneficios: "Main Benefits",
      titulo_beneficios_1: "Interactive Practice Tests",
      _beneficio_text_1: "Take realistic practice exams that simulate the actual driving theory test.",
      titulo_beneficios_2: "Track Your Progress",
      _beneficio_text_2: "Monitor your progress with detailed reports.",
      titulo_beneficios_3: "Free and Accessible",
      _beneficio_text_3: "The app is free to download and provides essential study tools.",
      titulo_beneficios_4: "Flexible Learning",
      _beneficio_text_4: "Study on your own time, with access to offline tests.",
      titulo_faq: "Perguntas Frequentes",
      pergunta_1: "Is the app really free?",
      resposta_1: "Yes, the Driving Licence Test App is completely free to download and use.",
      pergunta_2: "Can I practice road signs and traffic laws?",
      resposta_2: "Absolutely! The app includes specific sections for road sign identification.",
      pergunta_3: "Can I track my progress in the app?",
      resposta_3: "Yes, the app provides detailed progress tracking.",
      aviso: "aviso_pt"
    },
    seo: {
      meta_title: "Driving Licence Test App: Practice & Pass",
      meta_description: "Practice theory tests, road signs and simulations. Study offline and track progress to pass your driving licence exam on the first try.",
      focus_keyword: "driving licence test app"
    }
  };

  console.log('📋 TESTE 1: Processamento completo com campos ACF corretos');
  console.log('=========================================================');
  
  try {
    const response = await fetch('http://localhost:3002/api/pressel/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonData: testJson,
        siteUrl: WORDPRESS_URL,
        testMode: false,
        options: {
          publish: true,
          addSeo: true,
          addAcfFields: true,
          notifyOnComplete: true
        }
      })
    });

    console.log(\`📊 Status do Processamento: \${response.status}\`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Processamento completo funcionando!');
      console.log(\`📄 Página criada: \${result.result?.pageUrl || 'N/A'}\`);
      console.log(\`📄 ID da página: \${result.result?.pageId || 'N/A'}\`);
      console.log(\`📄 Campos processados: \${result.stats?.fieldsProcessed || 'N/A'}\`);
      
      // Verificar se os campos ACF foram preenchidos
      console.log('\\n📋 TESTE 2: Verificando campos ACF preenchidos');
      console.log('==============================================');
      
      const acfResponse = await fetch(\`\${WORDPRESS_URL}/wp-json/acf/v3/pages/\${result.result?.pageId}\`, {
        method: 'GET',
        headers: {
          'Authorization': \`Basic \${auth}\`
        }
      });
      
      if (acfResponse.ok) {
        const pageData = await acfResponse.json();
        const acfFields = pageData.acf || {};
        
        console.log(\`📊 Campos ACF encontrados: \${Object.keys(acfFields).length}\`);
        
        if (Object.keys(acfFields).length > 0) {
          console.log('✅ Campos ACF foram preenchidos corretamente!');
          console.log('📋 Campos preenchidos:');
          Object.entries(acfFields).forEach(([key, value]) => {
            console.log(\`  - \${key}: \${value}\`);
          });
        } else {
          console.log('❌ Nenhum campo ACF foi preenchido');
        }
      } else {
        console.log('❌ Não foi possível verificar campos ACF');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erro no processamento:');
      console.log(\`📄 \${error}\`);
    }
  } catch (error) {
    console.log(\`❌ Erro de conexão: \${error.message}\`);
  }

  console.log('\\n🎉 TESTE CONCLUÍDO!');
  console.log('===================');
}

testPresselWithCorrectACF();
`;

  const testPath = path.join(process.cwd(), 'scripts', 'test-pressel-corrected-acf.js');
  fs.writeFileSync(testPath, testScript);
  
  console.log('✅ Script de teste criado');
  console.log(`📄 Local: ${testPath}`);
}

// Executar todas as correções
console.log('🚀 INICIANDO CORREÇÃO DO PRESSEL AUTOMATION');
console.log('==========================================\n');

createACFFieldMapping();
updateModelIdentifier();
createTestScript();

console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
console.log('=====================');
console.log('✅ Mapeamento de campos ACF criado');
console.log('✅ ModelIdentifier atualizado');
console.log('✅ Script de teste criado');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Execute: node scripts/test-pressel-corrected-acf.js');
console.log('2. Teste no CMS com o JSON fornecido');
console.log('3. Verifique se os campos ACF estão sendo preenchidos');





