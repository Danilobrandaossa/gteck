# 📚 Documentação dos Códigos de Erro PS- - Pressel Automation

## 🎯 Visão Geral

O Pressel Automation implementa um sistema robusto de códigos de erro únicos iniciados com o prefixo **PS-**. Cada código representa um tipo específico de problema e inclui mensagens claras, sugestões de solução e detalhes contextuais.

## 📋 Formato de Resposta

```json
{
  "status": "erro",
  "codigo": "PS-JSON-001",
  "mensagem": "JSON inválido ou mal formatado",
  "categoria": "JSON",
  "severidade": "error",
  "timestamp": "2025-10-28T18:30:42.465Z",
  "detalhes": {
    "jsonData": "dados específicos do erro"
  },
  "sugestoes": [
    "Verifique se o JSON está bem formatado",
    "Use um validador JSON online",
    "Confirme se todas as chaves estão entre aspas"
  ]
}
```

## 🚨 Códigos de Erro por Categoria

### 📄 JSON (PS-JSON-XXX)

#### PS-JSON-001: JSON inválido ou mal formatado
- **Categoria**: JSON
- **Severidade**: error
- **Descrição**: O JSON enviado não está bem formatado
- **Sugestões**:
  - Verifique se o JSON está bem formatado
  - Use um validador JSON online
  - Confirme se todas as chaves estão entre aspas

#### PS-JSON-002: Campo obrigatório ausente no JSON
- **Categoria**: JSON
- **Severidade**: error
- **Descrição**: Um campo obrigatório está ausente no JSON
- **Sugestões**:
  - Verifique a documentação dos campos obrigatórios
  - Confirme se todos os campos necessários estão presentes
  - Use o JSON de exemplo como referência

#### PS-JSON-003: Estrutura do JSON não corresponde ao modelo esperado
- **Categoria**: JSON
- **Severidade**: error
- **Descrição**: A estrutura do JSON não corresponde ao modelo esperado
- **Sugestões**:
  - Verifique se está usando o modelo correto
  - Confirme a estrutura dos campos ACF
  - Use o template de exemplo do modelo

### 🔧 ACF (PS-ACF-XXX)

#### PS-ACF-001: Modelo ACF não encontrado
- **Categoria**: ACF
- **Severidade**: error
- **Descrição**: O modelo ACF especificado não foi encontrado
- **Sugestões**:
  - Verifique se o modelo está carregado no sistema
  - Confirme se os arquivos ACF estão na pasta correta
  - Execute o script de processamento de modelos

#### PS-ACF-002: Erro ao mapear campos do ACF
- **Categoria**: ACF
- **Severidade**: error
- **Descrição**: Erro ao mapear os campos do ACF
- **Sugestões**:
  - Verifique se os nomes dos campos estão corretos
  - Confirme se os tipos de campo são compatíveis
  - Revise a estrutura do arquivo ACF JSON

#### PS-ACF-003: Campos ACF não puderam ser salvos no WordPress
- **Categoria**: ACF
- **Severidade**: error
- **Descrição**: Os campos ACF não puderam ser salvos no WordPress
- **Sugestões**:
  - Verifique as credenciais do WordPress
  - Confirme se o plugin ACF está ativo
  - Teste a conexão com a API do WordPress

### 🌐 WordPress (PS-WP-XXX)

#### PS-WP-001: Erro ao criar página no WordPress
- **Categoria**: WP
- **Severidade**: error
- **Descrição**: Erro genérico ao criar página no WordPress
- **Sugestões**:
  - Verifique as credenciais do WordPress
  - Confirme se o usuário tem permissões adequadas
  - Teste a conexão com a API REST do WordPress

#### PS-WP-002: Erro ao salvar campos ACF no WordPress
- **Categoria**: WP
- **Severidade**: error
- **Descrição**: Erro ao salvar campos ACF no WordPress
- **Sugestões**:
  - Verifique se o plugin ACF está ativo
  - Confirme se os campos ACF existem no WordPress
  - Teste a API específica do ACF

#### PS-WP-003: Erro ao publicar a página
- **Categoria**: WP
- **Severidade**: error
- **Descrição**: Erro ao publicar a página
- **Sugestões**:
  - Verifique se o usuário tem permissão para publicar
  - Confirme se não há conflitos de slug
  - Teste a publicação manual no WordPress

#### PS-WP-004: Template não encontrado no WordPress
- **Categoria**: WP
- **Severidade**: error
- **Descrição**: O template especificado não foi encontrado no WordPress
- **Sugestões**:
  - Verifique se o arquivo de template existe
  - Confirme se o template está no tema ativo
  - Upload o template para o WordPress

### ⚙️ Sistema (PS-SYS-XXX)

#### PS-SYS-001: Falha de permissão ou configuração do servidor
- **Categoria**: SYS
- **Severidade**: error
- **Descrição**: Falha de permissão ou configuração do servidor
- **Sugestões**:
  - Verifique as permissões de arquivo
  - Confirme as configurações do servidor
  - Teste o acesso aos diretórios necessários

#### PS-SYS-002: Timeout na conexão com WordPress
- **Categoria**: SYS
- **Severidade**: error
- **Descrição**: Timeout na conexão com WordPress
- **Sugestões**:
  - Verifique a conectividade com o WordPress
  - Aumente o timeout da requisição
  - Teste a velocidade da conexão

#### PS-SYS-003: Memória insuficiente para processar o JSON
- **Categoria**: SYS
- **Severidade**: error
- **Descrição**: Memória insuficiente para processar o JSON
- **Sugestões**:
  - Reduza o tamanho do JSON
  - Aumente a memória do servidor
  - Processe os dados em lotes menores

### 🎯 Modelo (PS-MODEL-XXX)

#### PS-MODEL-001: Modelo não identificado automaticamente
- **Categoria**: MODEL
- **Severidade**: error
- **Descrição**: Nenhum modelo foi identificado automaticamente
- **Sugestões**:
  - Verifique se os campos únicos estão presentes
  - Confirme se o modelo está carregado
  - Use campos mais específicos do modelo

#### PS-MODEL-002: Confiança na identificação do modelo muito baixa
- **Categoria**: MODEL
- **Severidade**: warning
- **Descrição**: A confiança na identificação do modelo está muito baixa
- **Sugestões**:
  - Adicione mais campos únicos do modelo
  - Verifique se está usando o modelo correto
  - Confirme a estrutura dos campos ACF

#### PS-MODEL-003: Template do modelo não encontrado
- **Categoria**: MODEL
- **Severidade**: error
- **Descrição**: O template do modelo não foi encontrado
- **Sugestões**:
  - Verifique se o arquivo de template existe
  - Confirme se o template está na pasta correta
  - Execute o processamento de modelos

### ✅ Validação (PS-VALIDATION-XXX)

#### PS-VALIDATION-001: Campos obrigatórios ausentes
- **Categoria**: VALIDATION
- **Severidade**: error
- **Descrição**: Campos obrigatórios estão ausentes
- **Sugestões**:
  - Verifique a lista de campos obrigatórios
  - Adicione os campos ausentes ao JSON
  - Use o JSON de exemplo como referência

#### PS-VALIDATION-002: Campos com valores inválidos
- **Categoria**: VALIDATION
- **Severidade**: warning
- **Descrição**: Campos contêm valores inválidos
- **Sugestões**:
  - Verifique os tipos de dados dos campos
  - Confirme se os valores estão no formato correto
  - Revise as validações específicas de cada campo

#### PS-VALIDATION-003: Campos protegidos detectados - serão ignorados
- **Categoria**: VALIDATION
- **Severidade**: info
- **Descrição**: Campos protegidos foram detectados e serão ignorados
- **Sugestões**:
  - Remova campos fixos do site do JSON
  - Use apenas campos dinâmicos da página
  - Confirme que elementos fixos não serão alterados

## 🔍 Como Interpretar os Erros

### 1. **Identifique o Código**
- Anote o código PS- específico
- Consulte esta documentação para detalhes

### 2. **Verifique a Categoria**
- **JSON**: Problemas de formato e estrutura
- **ACF**: Problemas com campos personalizados
- **WP**: Problemas com WordPress
- **SYS**: Problemas de sistema
- **MODEL**: Problemas de identificação de modelo
- **VALIDATION**: Problemas de validação

### 3. **Analise os Detalhes**
- Os detalhes fornecem contexto específico do erro
- Use essas informações para diagnosticar o problema

### 4. **Siga as Sugestões**
- Cada erro inclui sugestões específicas de solução
- Siga as sugestões na ordem fornecida

### 5. **Consulte os Logs**
- Todos os erros são registrados em logs detalhados
- Use os logs para análise histórica e debugging

## 📊 Estatísticas de Erro

O sistema mantém estatísticas detalhadas dos erros:

```json
{
  "total": 15,
  "byCategory": {
    "JSON": 5,
    "ACF": 3,
    "WP": 4,
    "SYS": 2,
    "MODEL": 1
  },
  "bySeverity": {
    "error": 12,
    "warning": 2,
    "info": 1
  },
  "byCode": {
    "PS-JSON-001": 3,
    "PS-WP-001": 2,
    "PS-MODEL-001": 1
  }
}
```

## 🚀 Melhores Práticas

### Para Desenvolvedores:
1. **Sempre verifique o código de erro** antes de tentar resolver
2. **Use os detalhes** para entender o contexto específico
3. **Implemente tratamento específico** para cada código
4. **Monitore os logs** para identificar padrões de erro

### Para Usuários:
1. **Anote o código PS-** quando receber um erro
2. **Siga as sugestões** fornecidas pelo sistema
3. **Consulte esta documentação** para entender o erro
4. **Entre em contato com suporte** se necessário, fornecendo o código

### Para Suporte Técnico:
1. **Use o código PS-** para identificar rapidamente o problema
2. **Consulte os logs** para contexto adicional
3. **Forneça soluções específicas** baseadas no código
4. **Documente novos padrões** de erro encontrados

## 📝 Exemplos de Uso

### Exemplo 1: JSON Mal Formatado
```bash
curl -X POST http://localhost:3002/api/pressel/process \
  -H "Content-Type: application/json" \
  -d '{"jsonData": "invalid json", "siteUrl": "https://example.com"}'
```

**Resposta:**
```json
{
  "status": "erro",
  "codigo": "PS-JSON-001",
  "mensagem": "JSON inválido ou mal formatado",
  "categoria": "JSON",
  "severidade": "error"
}
```

### Exemplo 2: Campo Obrigatório Ausente
```bash
curl -X POST http://localhost:3002/api/pressel/process \
  -H "Content-Type: application/json" \
  -d '{"jsonData": {"page_title": "Test"}, "siteUrl": "https://example.com"}'
```

**Resposta:**
```json
{
  "status": "erro",
  "codigo": "PS-JSON-002",
  "mensagem": "Campo obrigatório ausente no JSON",
  "categoria": "JSON",
  "severidade": "error",
  "detalhes": {
    "missingField": "acf_fields",
    "providedFields": ["page_title"]
  }
}
```

## 🔄 Atualizações

Esta documentação é atualizada sempre que novos códigos de erro são adicionados ao sistema. A versão atual inclui **19 códigos de erro** cobrindo todas as principais categorias de problemas do Pressel Automation.

---

**📞 Suporte**: Para dúvidas sobre códigos de erro específicos, entre em contato com o suporte técnico fornecendo o código PS- relevante.





