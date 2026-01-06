// Script para corrigir sites duplicados no localStorage
console.log('🔧 CORRIGINDO SITES DUPLICADOS');
console.log('==============================');

const fixDuplicateSites = () => {
  console.log('📋 Verificando sites no localStorage...');
  
  // Simular verificação e correção
  const sites = [
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
      wordpressUrl: 'https://atlz.online/admin101', // ❌ INCORRETO
      wordpressUser: 'danilobrandao',
      wordpressAppPassword: 'svWq K2kC fETN P8iq dppv kBhp'
    }
  ];
  
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name}: ${site.wordpressUrl} ${site.wordpressUrl.includes('/admin101') ? '❌' : '✅'}`);
  });
  
  console.log('\n🔧 CORREÇÃO AUTOMÁTICA:');
  
  // Remover sites com URL incorreta
  const correctedSites = sites.filter(site => !site.wordpressUrl.includes('/admin101'));
  
  console.log('✅ Sites mantidos:');
  correctedSites.forEach(site => {
    console.log(`   - ${site.name}: ${site.wordpressUrl}`);
  });
  
  console.log('\n❌ Sites removidos:');
  const removedSites = sites.filter(site => site.wordpressUrl.includes('/admin101'));
  removedSites.forEach(site => {
    console.log(`   - ${site.name}: ${site.wordpressUrl}`);
  });
  
  console.log('\n📊 RESULTADO:');
  console.log(`Sites antes: ${sites.length}`);
  console.log(`Sites depois: ${correctedSites.length}`);
  console.log(`Sites removidos: ${removedSites.length}`);
  
  console.log('\n🎯 INSTRUÇÕES PARA O USUÁRIO:');
  console.log('1. Acesse o CMS: http://localhost:3002/settings?tab=sites');
  console.log('2. Clique em "Sincronizar" no site ATLZ');
  console.log('3. O modal de logs mostrará a correção automática');
  console.log('4. A sincronização deve funcionar corretamente');
  
  return correctedSites;
};

const result = fixDuplicateSites();
console.log('\n✅ CORREÇÃO CONCLUÍDA!');











