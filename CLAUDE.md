# Pedi&Recebe — Contexto do Projeto

## O que é

Sistema de gestão de delivery com painel admin, super admin, cardápio público para clientes e integração com Chatwoot (WhatsApp).

---

## Repositórios

| Parte | Repo | Deploy |
|---|---|---|
| Frontend (este repo) | https://github.com/Pedrao22/Delivery.git | Vercel (auto) |
| Backend (NestJS) | https://github.com/Pedrao22/pedirecebe-backend.git | Render.com (auto) |

> ⚠️ O diretório `backend/` tem seu próprio `.git`. **Nunca** fazer `git add backend/` neste repo. Para commitar o backend: `cd backend` e fazer git lá.

---

## Setup em novo PC

```bash
# 1. Clonar
git clone https://github.com/Pedrao22/Delivery.git
cd Delivery
git clone https://github.com/Pedrao22/pedirecebe-backend.git backend

# 2. Instalar
npm install
cd backend && npm install

# 3. Criar arquivos .env (ver seção abaixo)

# 4. Rodar
npm run dev           # frontend → http://localhost:5173
cd backend && npm run start:dev   # backend → http://localhost:3333
```

---

## Arquivos .env necessários (NÃO estão no git)

### `Delivery/.env.local`
```
VITE_API_URL=https://pedirecebe-backend.onrender.com/api
```
> Para dev local com backend local: `VITE_API_URL=http://localhost:3333/api`

### `Delivery/backend/.env`
Contém: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CHATWOOT_TOKEN`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_INBOX_ID`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`.

Ver `backend/.env.example` para as chaves necessárias. Os valores reais devem ser copiados do PC anterior ou do painel do Supabase/Render.

---

## Tecnologias

- **Frontend:** React 19, Vite, React Router 7, CSS puro
- **Backend:** NestJS 11, TypeScript, Supabase (banco + auth)
- **Banco:** Supabase (PostgreSQL)
- **Chat:** Chatwoot via Uply.chat (account 12113, inbox 30419)

---

## Estrutura do Frontend (`src/`)

```
pages/
  Dashboard, OrdersPage, ChatPage, SettingsPage, MenuPage...
  super/   → SuperAdminLayout + páginas do super admin
components/
  customer/   → CustomerView (cardápio público, estilo Anota.ai)
  menu/       → ProductCard, Cart, MenuGrid, ProductModal
  orders/     → OrderCard, OrderModal
  shared/     → Modal, Button, Badge, ConversationPanel...
context/
  OrdersContext.jsx  → estado global: pedidos, produtos, settings, addOrder
  AuthContext.jsx    → login, logout, profile, impersonation
hooks/
  useCart.js
lib/
  supabase.js  → apiFetch, storeSession, getToken
```

---

## Decisões técnicas importantes

### itens do pedido (JSONB)
Coluna `itens` na tabela `pedidos` é JSONB. Bug histórico: salvava `[[],[]]`.
Sempre filtrar: `.filter(i => i && typeof i === 'object' && !Array.isArray(i))`
Sanitização também feita no backend antes do INSERT.

### addOrder retorna objeto completo
`addOrder` em `OrdersContext.jsx` retorna `newOrder` (objeto com `confirmCode`), não só o ID.

### Endereço do restaurante
Salvo em `restaurantes.endereco`. No frontend: `formData.endereco` (não `formData.address`).
Usado na mensagem de retirada enviada pelo Chatwoot.

### Notificação automática ao cliente (Chatwoot)
Quando pedido vai para status `ready`:
- Backend chama `notifyReady()` em `orders.service.ts`
- Busca conversa pelo telefone se não tiver `chatwoot_conversation_id`
- Delivery → mensagem de saída para entrega
- Retirada → mensagem com endereço do estabelecimento

### Confirmação de pedido pelo Chat
`ChatPage.jsx` → `handleConfirmOrder` → chama `addOrder` → envia resumo via `POST /chatwoot/conversations/:id/reply`
Template em `buildOrderSummary()`: itens com variações/complementos, tipo, pagamento, endereço, estimativa.

---

## Segurança (implementado)

- Rate limit: `POST /public/orders` → 10/min | login → 10/min | reset-password → 5/min
- Logout revoga sessão no Supabase (`auth.signOut`)
- Impersonação valida UUID + loga email/IP/rota
- `GET /restaurants/me` usa select explícito (sem `select *`)
- `SuperAdminLayout` redireciona para `/dashboard` se role ≠ `super_admin`

---

## Roles

- `super_admin` — acesso total, pode impersonar qualquer restaurante via header `X-Impersonate-Restaurant-Id`
- `admin` — acesso somente ao próprio restaurante

---

## Chatwoot

- URL: https://app.uply.chat
- Account ID: 12113
- Inbox ID: 30419
- Webhook: `POST /chatwoot/webhook` (sem auth, `@SkipThrottle`)
- Sync manual: `POST /chatwoot/sync`

---

## Preferências do usuário

- Respostas sempre em **português**
- Commits no padrão `feat/fix/chore(escopo): descrição`
- Backend e frontend em repos separados — commitar separadamente
