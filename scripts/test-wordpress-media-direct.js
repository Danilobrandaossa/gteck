// Script para testar diretamente a API de mídia do WordPress
console.log('🖼️ TESTANDO API DE MÍDIA DO WORDPRESS DIRETAMENTE');
console.log('================================================');

const testWordPressMediaAPI = async () => {
  const wordpressUrl = 'https://atlz.online'
  const username = 'danilobrandao'
  const password = 'j4qD STH0 m2SB e2xc ZAfW 4XAK'
  
  console.log('📋 CREDENCIAIS:');
  console.log(`URL: ${wordpressUrl}`);
  console.log(`Usuário: ${username}`);
  console.log(`Senha: ${password.substring(0, 4)}...`);
  
  console.log('\n🔍 TESTE 1: Acesso público à API de mídia');
  try {
    const publicResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/media?per_page=5`)
    console.log(`Status: ${publicResponse.status}`);
    
    if (publicResponse.ok) {
      const publicData = await publicResponse.json()
      console.log(`✅ ${publicData.length} mídias encontradas (público)`);
      if (publicData.length > 0) {
        console.log('📄 Primeira mídia:', {
          id: publicData[0].id,
          title: publicData[0].title?.rendered,
          media_type: publicData[0].media_type,
          source_url: publicData[0].source_url
        });
      }
    } else {
      console.log('❌ Erro no acesso público:', publicResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Erro na requisição pública:', error.message);
  }
  
  console.log('\n🔍 TESTE 2: Acesso autenticado via CMS Proxy');
  try {
    const authResponse = await fetch('http://localhost:3002/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${wordpressUrl}/wp-json/wp/v2/media?per_page=10`,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        }
      })
    })
    
    console.log(`Status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json()
      console.log('📊 Resposta do proxy:', {
        success: authData.success,
        dataType: typeof authData.data,
        dataLength: Array.isArray(authData.data) ? authData.data.length : 'N/A'
      });
      
      if (authData.success && authData.data) {
        let mediaData = []
        if (typeof authData.data === 'string') {
          mediaData = JSON.parse(authData.data)
        } else if (Array.isArray(authData.data)) {
          mediaData = authData.data
        }
        
        console.log(`✅ ${mediaData.length} mídias encontradas (autenticado)`);
        if (mediaData.length > 0) {
          console.log('📄 Primeira mídia autenticada:', {
            id: mediaData[0].id,
            title: mediaData[0].title?.rendered,
            media_type: mediaData[0].media_type,
            source_url: mediaData[0].source_url,
            alt_text: mediaData[0].alt_text
          });
        }
      } else {
        console.log('❌ Resposta inválida do proxy:', authData);
      }
    } else {
      console.log('❌ Erro no proxy:', authResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Erro na requisição autenticada:', error.message);
  }
  
  console.log('\n🎯 DIAGNÓSTICO:');
  console.log('1. Se o teste público funcionar: WordPress está acessível');
  console.log('2. Se o teste autenticado funcionar: Credenciais estão corretas');
  console.log('3. Se ambos funcionarem: Problema está na interface do CMS');
  console.log('4. Se nenhum funcionar: Problema de conectividade');
  
  console.log('\n🔧 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o CMS está rodando (http://localhost:3002)');
  console.log('2. Acessar /media no CMS');
  console.log('3. Verificar se há site selecionado');
  console.log('4. Abrir console do navegador');
  console.log('5. Observar logs de carregamento');
  console.log('6. Clicar em "Atualizar" se necessário');
};

// Executar teste
testWordPressMediaAPI().catch(console.error);











