# Referência de Conversão: Emojis para Ícones Lucide React

## Mapeamento de Emojis para Ícones

### Status e Feedback
- ✅ → `<CheckCircle />` - Sucesso/Confirmação
- ❌ → `<XCircle />` - Erro/Falha
- ⚠️ → `<AlertTriangle />` - Aviso/Atenção
- ℹ️ → `<Info />` - Informação
- 🔔 → `<Bell />` - Notificação

### Ações
- ➕ → `<Plus />` - Adicionar
- ✏️ → `<Edit />` - Editar
- 🗑️ → `<Trash2 />` - Deletar
- 👁️ → `<Eye />` - Visualizar
- 🔍 → `<Search />` - Buscar
- 🔄 → `<RefreshCw />` - Atualizar/Sincronizar
- ⚡ → `<Zap />` - Rápido/Energia
- 🚀 → `<Rocket />` - Lançar/Iniciar

### Navegação
- 📁 → `<Folder />` - Pasta
- 📄 → `<FileText />` - Documento
- 🏠 → `<Home />` - Início
- ⬅️ → `<ChevronLeft />` - Voltar
- ➡️ → `<ChevronRight />` - Avançar
- ⬆️ → `<ChevronUp />` - Subir
- ⬇️ → `<ChevronDown />` - Descer

### Dados e Análise
- 📊 → `<BarChart />` - Gráfico
- 📈 → `<TrendingUp />` - Crescimento
- 📉 → `<TrendingDown />` - Queda
- 💾 → `<Save />` - Salvar
- 📋 → `<Clipboard />` - Área de transferência
- 📝 → `<FileText />` - Texto/Nota

### Configurações e Sistema
- ⚙️ → `<Settings />` - Configurações
- 🔧 → `<Wrench />` - Ferramentas
- 🔑 → `<Key />` - Chave/Senha
- 🔒 → `<Lock />` - Bloqueado
- 🔓 → `<Unlock />` - Desbloqueado
- 🌐 → `<Globe />` - Global/Web

### Usuários e Organização
- 👤 → `<User />` - Usuário
- 👥 → `<Users />` - Múltiplos usuários
- 🏢 → `<Building2 />` - Organização/Empresa
- 📧 → `<Mail />` - Email
- 💬 → `<MessageSquare />` - Mensagem

### Mídia e Conteúdo
- 🖼️ → `<Image />` - Imagem
- 🎨 → `<Palette />` - Paleta/Design
- 📷 → `<Camera />` - Câmera
- 🎬 → `<Video />` - Vídeo
- 🎵 → `<Music />` - Música

### Tempo e Calendário
- 📅 → `<Calendar />` - Calendário
- ⏰ → `<Clock />` - Relógio
- ⏱️ → `<Timer />` - Cronômetro
- 📆 → `<CalendarDays />` - Dias do calendário

### Diversos
- 🎯 → `<Target />` - Alvo/Objetivo
- 🔗 → `<Link />` - Link
- 📦 → `<Package />` - Pacote
- 🏷️ → `<Tag />` - Tag/Etiqueta
- ⭐ → `<Star />` - Favorito/Destaque
- 🎉 → `<PartyPopper />` - Celebração
- 💡 → `<Lightbulb />` - Ideia
- 🔥 → `<Flame />` - Popular/Quente

## Exemplo de Uso

### Antes (com emoji)
```typescript
console.log('✅ Operação concluída com sucesso!')
<button>➕ Adicionar</button>
```

### Depois (com ícone)
```typescript
import { CheckCircle, Plus } from 'lucide-react'

console.log('Operação concluída com sucesso!') // Logs sem ícones
<button><Plus className="w-4 h-4" /> Adicionar</button>
```

## Padrão de Tamanhos

```typescript
// Pequeno
<Icon className="w-3 h-3" /> // 12px

// Médio (padrão)
<Icon className="w-4 h-4" /> // 16px

// Grande
<Icon className="w-5 h-5" /> // 20px

// Extra Grande
<Icon className="w-6 h-6" /> // 24px
```

## Nota Importante

**NUNCA use emojis no código do projeto.** Sempre utilize ícones Lucide React para manter o padrão de qualidade profissional e consistência visual.










