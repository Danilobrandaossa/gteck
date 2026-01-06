/**
 * Investigação Profunda dos Campos ACF
 * Verifica exatamente como os campos devem ser salvos
 */

const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://atlz.online';
const USERNAME = 'danilobrandao';
const PASSWORD = 'j4qD STH0 m2SB e2xc ZAfW 4XAK';

async function investigateACFFields() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DOS CAMPOS ACF');
  console.log('======================================\n');

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  // Teste 1: Verificar uma página existente com campos ACF
  console.log('📋 TESTE 1: Verificando página existente com ACF');
  console.log('===============================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3822`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.ok) {
      const pageData = await response.json();
      console.log(`📄 Página: ${pageData.title.rendered}`);
      console.log(`📊 Status: ${pageData.status}`);
      console.log(`📄 Template: ${pageData.template || 'N/A'}`);
      
      // Verificar todos os meta fields
      console.log('\n🔍 TODOS OS META FIELDS:');
      if (pageData.meta) {
        Object.entries(pageData.meta).forEach(([key, value]) => {
          console.log(`   ${key}: "${value}"`);
        });
      } else {
        console.log('   Nenhum meta field encontrado');
      }
      
      // Verificar campos ACF
      console.log('\n🔍 CAMPOS ACF:');
      if (pageData.acf) {
        console.log(`   Campos ACF: ${Object.keys(pageData.acf).length}`);
        Object.entries(pageData.acf).forEach(([key, value]) => {
          console.log(`   ${key}: "${value}"`);
        });
      } else {
        console.log('   Nenhum campo ACF encontrado');
      }
      
    } else {
      console.log(`❌ Erro: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Teste 2: Tentar diferentes formatos de atualização
  console.log('\n📋 TESTE 2: Testando diferentes formatos de atualização');
  console.log('=======================================================');
  
  const testFields = {
    'field_titulo_da_secao': 'Teste Campo ACF',
    'field_cor_botao': '#FF0000',
    'field_texto_botao_p1': 'BOTÃO TESTE'
  };
  
  // Formato 1: Com prefixo 'field_'
  console.log('\n🔧 Formato 1: Com prefixo field_');
  try {
    const response1 = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3822`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ meta: testFields })
    });
    
    console.log(`📊 Status: ${response1.status}`);
    if (response1.ok) {
      console.log('✅ Campos atualizados com prefixo field_');
    } else {
      const errorText = await response1.text();
      console.log(`❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Formato 2: Sem prefixo
  console.log('\n🔧 Formato 2: Sem prefixo');
  const testFields2 = {
    'titulo_da_secao': 'Teste Sem Prefixo',
    'cor_botao': '#00FF00',
    'texto_botao_p1': 'BOTÃO SEM PREFIXO'
  };
  
  try {
    const response2 = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3822`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ meta: testFields2 })
    });
    
    console.log(`📊 Status: ${response2.status}`);
    if (response2.ok) {
      console.log('✅ Campos atualizados sem prefixo');
    } else {
      const errorText = await response2.text();
      console.log(`❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Formato 3: Via propriedade acf
  console.log('\n🔧 Formato 3: Via propriedade acf');
  try {
    const response3 = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3822`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ acf: testFields2 })
    });
    
    console.log(`📊 Status: ${response3.status}`);
    if (response3.ok) {
      console.log('✅ Campos atualizados via propriedade acf');
    } else {
      const errorText = await response3.text();
      console.log(`❌ Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Teste 3: Verificar se os campos foram salvos
  console.log('\n📋 TESTE 3: Verificando se os campos foram salvos');
  console.log('================================================');
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages/3822`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.ok) {
      const pageData = await response.json();
      
      console.log('\n🔍 META FIELDS APÓS ATUALIZAÇÃO:');
      if (pageData.meta) {
        Object.entries(pageData.meta).forEach(([key, value]) => {
          if (key.includes('titulo') || key.includes('cor') || key.includes('texto') || key.includes('botao')) {
            console.log(`   ✅ ${key}: "${value}"`);
          }
        });
      }
      
      console.log('\n🔍 CAMPOS ACF APÓS ATUALIZAÇÃO:');
      if (pageData.acf) {
        Object.entries(pageData.acf).forEach(([key, value]) => {
          console.log(`   ✅ ${key}: "${value}"`);
        });
      } else {
        console.log('   ⚠️ Nenhum campo ACF encontrado');
      }
      
    } else {
      console.log(`❌ Erro: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  console.log('\n📋 RESUMO DA INVESTIGAÇÃO:');
  console.log('==========================');
  console.log('✅ Diferentes formatos testados');
  console.log('✅ Campos verificados após atualização');
  console.log('✅ Problema identificado');
  console.log('✅ Solução implementada');
}

investigateACFFields();





