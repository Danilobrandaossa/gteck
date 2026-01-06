// Script para verificar localStorage do CMS
console.log('🔍 VERIFICANDO LOCALSTORAGE DO CMS');
console.log('==================================');

// Simular verificação do localStorage
const checkLocalStorage = () => {
  console.log('📋 Sites cadastrados:');
  
  // Simular dados que podem estar no localStorage
  const possibleSites = [
    {
      id: '1',
      name: 'ATLZ',
      url: 'https://atlz.online',
      wordpressUrl: 'https://atlz.online', // ✅ CORRETO
      wordpressUser: 'danilobrandao',
      wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
    },
    {
      id: '2', 
      name: 'ATLZ Admin',
      url: 'https://atlz.online',
      wordpressUrl: 'https://atlz.online/admin101', // ❌ INCORRETO - aqui está o problema!
      wordpressUser: 'danilobrandao',
      wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
    }
  ];
  
  possibleSites.forEach((site, index) => {
    console.log(`\n${index + 1}. Site: ${site.name}`);
    console.log(`   URL: ${site.url}`);
    console.log(`   WordPress URL: ${site.wordpressUrl}`);
    console.log(`   Status: ${site.wordpressUrl.includes('/admin101') ? '❌ INCORRETO' : '✅ CORRETO'}`);
  });
  
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('O site está sendo salvo com URL incorreta:');
  console.log('❌ https://atlz.online/admin101/wp-json/wp/v2/');
  console.log('✅ https://atlz.online/wp-json/wp/v2/');
  
  console.log('\n🔧 SOLUÇÃO:');
  console.log('1. Verificar se há site duplicado no localStorage');
  console.log('2. Remover site com URL incorreta');
  console.log('3. Manter apenas site com URL correta');
};

checkLocalStorage();











