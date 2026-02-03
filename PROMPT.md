# Prompt de Inicialização - Xpecialist Control Dashboard

## 🎯 Contexto

Este é o **Xpecialist Control Dashboard** - uma aplicação de gerenciamento de conteúdo para Twitter/X. 

**Propósito:** Permitir que William (@drwilliamneves) aprove, rejeite, edite e agende tweets criados por um agente AI (Xpecialist) antes deles serem publicados.

**Fluxo de Trabalho:**
1. Xpecialist (agente AI) cria drafts de tweets
2. Drafts são salvos no Convex com status "pending"
3. William acessa este dashboard para revisar
4. William aprova, rejeita, edita ou agenda o draft
5. Xpecialist publica tweets aprovados via Bird CLI

---

## 🏗️ Arquitetura Atual

**Stack:**
- **Framework:** TanStack Start (file-based routing)
- **Auth:** Clerk (já configurado)
- **Backend:** Convex (já configurado, deployado)
- **UI:** Tailwind CSS + shadcn/ui
- **Package Manager:** Bun
- **Location:** `~/projects/xpecialist-control/`

**Schema Convex (já existe):**
```typescript
// Tables: drafts, published
// drafts: { content, status, authorId, authorName, createdAt, updatedAt, scheduledFor, publishedAt, tweetId, metadata, rejectionReason }
// published: { content, tweetId, draftId, authorId, publishedAt, metrics }
```

**API Convex Disponível (convex/drafts.ts):**
- Queries: listPending, listAll, getById, listPublished
- Mutations: create, approve, reject, schedule, markPublished, updateContent, remove

---

## 🎨 Requisitos de Interface

### 1. Layout Principal (`src/routes/__root.tsx`)
- Header com: Logo "Xpecialist Control", User Menu (Clerk), Nav links
- Sidebar ou nav horizontal: Dashboard, Novo Draft, Histórico, Analytics (futuro)
- Main content area
- Footer simples

### 2. Dashboard Principal (`src/routes/index.tsx`)
**Card de Estatísticas Rápidas:**
- Drafts pendentes (count)
- Publicados hoje (count)
- Agendados (count)

**Tabela de Drafts Pendentes:**
- Colunas: Conteúdo (truncado), Autor, Criado em, Ações
- Ações: [👁️ Ver] [✅ Aprovar] [❌ Rejeitar] [✏️ Editar]
- Click na linha abre modal/drawer com detalhes completos
- Paginação ou load more

**Modal/Drawer de Detalhes do Draft:**
- Conteúdo completo do tweet (com contador de caracteres)
- Preview de como vai ficar no Twitter
- Metadados (tipo, tags, tom)
- Botões de ação grandes: Aprovar / Rejeitar / Editar / Agendar

### 3. Página de Novo Draft (`src/routes/drafts.new.tsx`)
- Formulário para criar draft manualmente
- Campos: Conteúdo (textarea com contador 280 chars), Tipo (single/thread), Tags, Tom
- Botão: Salvar como Pending

### 4. Página de Histórico (`src/routes/drafts.history.tsx`)
- Tabs: Todos | Aprovados | Rejeitados | Publicados | Agendados
- Tabela com filtros
- Para publicados: mostrar metrics (impressions, likes, etc.) se disponível

### 5. Página de Edição (`src/routes/drafts.$id.edit.tsx`)
- Formulário pré-populado com dados do draft
- Edição de conteúdo e metadados
- Salvar alterações

---

## 🔧 Integrações Técnicas

### Clerk Auth
- Proteger todas as rotas (exceto login)
- User ID usado como authorId nos drafts
- Apenas usuários autenticados podem criar/aprovar

### Convex
- Usar `useQuery` e `useMutation` do `@convex-dev/react-query`
- Todas as operações já estão implementadas em `convex/drafts.ts`
- Real-time updates ( Convex live queries )

### shadcn/ui Components Necessários
- Button, Card, Dialog/Sheet, Table, Tabs, Textarea, Input, Select, Badge, Avatar
- Toast/notification para feedback (aprovado, rejeitado, etc.)

---

## 🎨 Design Guidelines

- **Tema:** Escuro preferencial (ou seguir system preference)
- **Cores:** 
  - Twitter/X azul para ações primárias
  - Verde para aprovar
  - Vermelho para rejeitar
  - Amarelo/laranja para pendente
- **Layout:** Clean, minimalista, foco no conteúdo
- **Responsivo:** Desktop-first, mas funcionar em mobile

---

## 📝 Tarefas Imediatas

1. **Setup inicial:**
   - Verificar se Clerk Provider está configurado corretamente
   - Verificar se Convex Provider está configurado
   - Testar autenticação com o usuário demo

2. **Layout base:**
   - Criar/atualizar `__root.tsx` com layout principal
   - Header com navegação

3. **Dashboard:**
   - Página inicial com lista de pending drafts
   - Tabela com ações
   - Modal de detalhes

4. **Integração Convex:**
   - Conectar queries e mutations
   - Testar fluxo completo: criar → listar → aprovar

5. **UI Polish:**
   - Adicionar loading states
   - Adicionar error handling
   - Adicionar toasts/notifications

---

## 🔗 Referências Úteis

- Convex Dashboard: https://dashboard.convex.dev/d/impressive-sparrow-365
- Clerk Dashboard: https://dashboard.clerk.com
- Test User: gwilliam.nn@gmail.com / passworD!@3

---

## ⚠️ Notas Importantes

- NÃO postar nada no Twitter ainda - isso é só o dashboard de aprovação
- O agente Xpecialist (separado) é quem vai criar drafts e publicar aprovados
- Este dashboard é apenas para visualização e aprovação humana
- Todos os drafts criados aqui devem ter status "pending"

---

**Execute:** Crie o layout base, o dashboard com lista de drafts pendentes, e o modal de detalhes. Use shadcn/ui components, Tailwind para estilos, e Convex para dados. Teste o fluxo completo de criar um draft via UI e aprová-lo.
