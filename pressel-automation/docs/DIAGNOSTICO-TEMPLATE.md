# 🔍 DIAGNÓSTICO DE TEMPLATE

## 📍 LOCALIZAÇÃO

**Arquivo de diagnóstico:** `pressel-automation/VERIFICAR-TEMPLATE.php`

**Como acessar:**

### 1. Via Menu do Plugin
- WordPress Admin > **Pressel Auto**
- Clicar em **"🔍 Executar Diagnóstico"**

### 2. Via Lista de Plugins
- Plugins > Plugins Instalados
- Encontrar "Pressel Automation"
- Clicar em **"🔍 Diagnóstico"**

### 3. Via URL Direta
```
https://seu-site.com/wp-content/plugins/pressel-automation/VERIFICAR-TEMPLATE.php
```

---

## 🔧 O QUE O DIAGNÓSTICO VERIFICA

### 1. Tema Ativo
- Nome do tema
- Diretório do tema
- Caminho completo

### 2. Template `pressel-oficial.php`
- Se o arquivo existe
- Localização correta
- Tamanho do arquivo
- Data de modificação
- Permissões do arquivo

### 3. Páginas Criadas
- Páginas que usam o template
- IDs das páginas
- Links para edição

### 4. Templates Disponíveis
- Lista de todos os templates do tema
- Templates personalizados

### 5. Logs do Sistema
- Últimos logs do Pressel Auto
- Erros de template
- Debugging information

---

## 📋 INTERPRETAÇÃO DOS RESULTADOS

### ✅ Template Encontrado
```
✅ Template encontrado!
Tamanho: 15,432 bytes
Última modificação: 15/01/2025 14:30:25
Permissões: 0644
```

**Significa:** Template está no lugar correto e funcionando

### ❌ Template Não Encontrado
```
❌ Template NÃO encontrado!
O arquivo pressel-oficial.php precisa ser copiado para:
/wp-content/themes/[SEU-TEMA]/pressel-oficial.php
```

**Significa:** Precisa copiar o template para o tema

### 📄 Páginas Criadas
```
✅ Encontradas 2 páginas com template pressel-oficial.php:
- Como Fazer Crochê (ID: 1653)
- Tutorial de Tricô (ID: 1654)
```

**Significa:** Sistema está funcionando e criando páginas

### 📝 Logs do Sistema
```
Pressel Auto: Modelo 'modelo_v1' encontrado, usando template: pressel-oficial.php
Pressel Auto: Template 'pressel-oficial.php' definido com sucesso para post 1653
```

**Significa:** Sistema detectando modelos corretamente

---

## 🔧 SOLUÇÕES COMUNS

### Problema: Template Não Encontrado

**Solução:**
1. **Copiar arquivo:**
   ```
   De: pressel-oficial.php (do seu computador)
   Para: /wp-content/themes/[SEU-TEMA]/pressel-oficial.php
   ```

2. **Via FTP/File Manager:**
   ```
   1. Conectar ao servidor
   2. Navegar para: /wp-content/themes/[SEU-TEMA]/
   3. Upload: pressel-oficial.php
   4. Verificar permissões: 644
   ```

### Problema: Permissões Incorretas

**Solução:**
```
Permissões corretas: 644
Propriedade: www-data ou apache
```

### Problema: Nenhuma Página Criada

**Solução:**
1. **Verificar se plugin está ativo**
2. **Verificar se ACF está instalado**
3. **Testar criação de nova página**

### Problema: Logs de Erro

**Solução:**
1. **Verificar se template existe**
2. **Verificar sintaxe PHP do template**
3. **Verificar se ACF está ativo**

---

## 🧪 TESTE COMPLETO

### 1. Executar Diagnóstico
- Acessar via menu do plugin
- Verificar todos os itens

### 2. Se Template Não Existe
- Copiar `pressel-oficial.php` para tema
- Executar diagnóstico novamente

### 3. Se Template Existe
- Criar página de teste
- Verificar se template é aplicado

### 4. Verificar Logs
- Procurar por erros
- Verificar se modelo é detectado

---

## 📞 SUPORTE

### Informações para Suporte

**Ao pedir ajuda, envie:**

1. **Resultado do diagnóstico completo**
2. **Nome do tema ativo**
3. **Se template existe ou não**
4. **Logs de erro (se houver)**
5. **Mensagem de erro específica**

### Exemplo de Relatório

```
Tema Ativo: Astra
Template: ❌ NÃO encontrado
Caminho: /wp-content/themes/astra/pressel-oficial.php
Páginas criadas: 0
Logs: Nenhum log encontrado
```

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

- [ ] Executar diagnóstico
- [ ] Verificar se template existe
- [ ] Se não existe, copiar para tema
- [ ] Verificar permissões (644)
- [ ] Testar criação de página
- [ ] Verificar se template é aplicado
- [ ] Verificar logs para erros

---

## ⚡ USO RÁPIDO

**1. Problema com template?**
```
Menu Pressel Auto > 🔍 Executar Diagnóstico
```

**2. Template não encontrado?**
```
Copiar pressel-oficial.php para /wp-content/themes/[SEU-TEMA]/
```

**3. Ainda não funciona?**
```
Verificar logs e enviar resultado do diagnóstico
```

---

**🔍 O diagnóstico é sua ferramenta principal para resolver problemas de template!**

**Use sempre que houver dúvidas sobre a configuração do sistema.** ✨


