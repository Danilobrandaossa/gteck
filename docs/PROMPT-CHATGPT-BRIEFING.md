# 📝 Prompt Base para ChatGPT - Briefing de Criativos

## 🎯 COMO USAR

Copie o prompt abaixo e cole no ChatGPT. Depois, descreva seu produto/serviço e o ChatGPT vai formatar tudo para você preencher no gerador de criativos.

---

## 📋 PROMPT COMPLETO

```
Você é um especialista em criação de briefings para anúncios de alta performance. 

Sua tarefa é extrair informações estruturadas de qualquer descrição de produto/serviço que eu fornecer e formatá-las em um briefing completo e otimizado.

FORMATO DE SAÍDA (responda APENAS neste formato JSON, sem texto adicional):

{
  "productName": "Nome do produto/serviço",
  "productDescription": "Descrição clara e objetiva do produto/serviço, destacando o que é e para que serve",
  "targetAudience": "Público-alvo específico e detalhado (ex: Empreendedores iniciantes de 25-40 anos que querem aprender marketing digital)",
  "keyBenefits": [
    "Benefício 1 (concreto e mensurável)",
    "Benefício 2 (concreto e mensurável)",
    "Benefício 3 (concreto e mensurável)"
  ],
  "callToAction": "CTA direto e claro (ex: Comece agora, Garanta sua vaga, Baixe grátis)",
  "tone": "professional|casual|friendly|urgent|inspiring",
  "platform": "facebook|instagram|google|linkedin|twitter",
  "maxLength": 200
}

REGRAS IMPORTANTES:
1. NÃO invente informações que não foram mencionadas
2. Se algo não foi especificado, use valores padrão sensatos
3. Benefícios devem ser CONCRETOS e MENSURÁVEIS (não genéricos como "qualidade")
4. Público-alvo deve ser ESPECÍFICO (não apenas "pessoas interessadas")
5. CTA deve ser DIRETO e com VERBO DE AÇÃO
6. Tom deve ser escolhido baseado no produto e público
7. Plataforma deve ser escolhida baseado no público-alvo

Agora, descreva seu produto/serviço:
```

---

## 🎨 EXEMPLO DE USO

**Você escreve:**
```
Quero criar anúncios para um curso online de programação Python para iniciantes. 
O curso tem 50 horas, certificado, acesso vitalício, suporte da comunidade e projetos práticos. 
Preço: R$ 297. 
Quero focar em pessoas que querem mudar de carreira ou começar na área de tecnologia.
```

**ChatGPT responde (formato JSON):**
```json
{
  "productName": "Curso de Programação Python para Iniciantes",
  "productDescription": "Curso completo de 50 horas para aprender Python do zero, com certificado, acesso vitalício, suporte da comunidade e projetos práticos para construir portfólio",
  "targetAudience": "Pessoas que querem mudar de carreira ou começar na área de tecnologia, sem conhecimento prévio em programação, idade 20-45 anos",
  "keyBenefits": [
    "50 horas de conteúdo prático e atualizado",
    "Certificado válido para currículo",
    "Acesso vitalício para estudar no seu ritmo",
    "Suporte da comunidade de alunos",
    "Projetos práticos para portfólio"
  ],
  "callToAction": "Comece sua nova carreira agora",
  "tone": "inspiring",
  "platform": "facebook",
  "maxLength": 200
}
```

---

## 📝 VERSÃO SIMPLIFICADA (se preferir menos campos)

```
Você é um especialista em criação de briefings para anúncios. 

Extraia e formate as informações do produto/serviço que eu descrever.

Responda APENAS neste formato (sem texto adicional):

PRODUTO: [nome]
DESCRIÇÃO: [descrição curta]
PÚBLICO: [público-alvo específico]
BENEFÍCIOS: 
- [benefício 1]
- [benefício 2]
- [benefício 3]
CTA: [call to action]
TOM: [professional/casual/friendly/urgent/inspiring]
PLATAFORMA: [facebook/instagram/google/linkedin/twitter]

Agora descreva seu produto:
```

---

## 🚀 DICAS DE USO

### ✅ O QUE FUNCIONA BEM:
- Descreva o produto de forma natural
- Mencione características específicas (horas, certificado, garantia, etc.)
- Fale sobre o público que você quer atingir
- Mencione benefícios concretos

### ❌ EVITE:
- Informações muito genéricas
- Benefícios vagos como "qualidade" ou "excelência"
- Público-alvo muito amplo como "todos"

### 🎯 EXEMPLOS DE BOAS DESCRIÇÕES:

**Bom:**
```
Curso de Marketing Digital com 30 horas, certificado, focado em empreendedores que querem vender online. 
Inclui estratégias de Facebook Ads, Google Ads e email marketing. 
Preço: R$ 497. 
Garantia de 7 dias.
```

**Ruim:**
```
Curso de marketing. É bom. Para quem quer aprender.
```

---

## 📋 CHECKLIST ANTES DE USAR O RESULTADO

Antes de copiar para o gerador, verifique:

- [ ] Nome do produto está claro
- [ ] Descrição explica o que é o produto
- [ ] Público-alvo é específico (não genérico)
- [ ] Benefícios são concretos e mensuráveis
- [ ] CTA tem verbo de ação
- [ ] Tom faz sentido para o produto
- [ ] Plataforma faz sentido para o público

---

## 🔄 WORKFLOW RECOMENDADO

1. **Copie o prompt** para o ChatGPT
2. **Descreva seu produto** de forma natural
3. **Copie o JSON** retornado
4. **Cole no gerador** `/criativos` (ou ajuste manualmente se necessário)
5. **Gere o criativo** e revise
6. **Ajuste** campos se necessário e gere novamente

---

## 💡 PROMPT ALTERNATIVO (Mais Conversacional)

Se preferir uma abordagem mais conversacional:

```
Preciso criar um briefing completo para gerar anúncios de alta performance. 

Me ajude a estruturar as informações do meu produto/serviço.

Me faça perguntas específicas se precisar de mais detalhes, e depois me dê o resultado formatado em JSON com estes campos:

- productName
- productDescription  
- targetAudience
- keyBenefits (array)
- callToAction
- tone (escolha entre: professional, casual, friendly, urgent, inspiring)
- platform (escolha entre: facebook, instagram, google, linkedin, twitter)
- maxLength (sugira um valor entre 150-300)

Vamos começar? Descreva seu produto/serviço:
```

---

## 📌 NOTAS IMPORTANTES

- O ChatGPT pode variar a formatação. Se não vier em JSON puro, peça: "Formate como JSON válido"
- Sempre revise os benefícios - eles devem ser específicos e mensuráveis
- O público-alvo deve ser o mais específico possível
- CTA deve ter verbo de ação claro

---

**Pronto para usar!** Copie o prompt principal e comece a criar briefings otimizados! 🚀






