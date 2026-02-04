# Xpecialist API Skill

API para criar e gerenciar drafts de tweets no Xpecialist Control Dashboard.

## Autenticacao

Todas as requisicoes precisam de um Bearer token no header:

```
Authorization: Bearer xpc_XXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Obter Token

1. Acesse `/settings/api-tokens` no dashboard
2. Crie um token com as permissoes necessarias
3. Copie o token (mostrado apenas uma vez)

Ou via API (se voce ja tem um token com `tokens:create`):

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Meu Agente","permissions":["drafts:create","drafts:read"]}' \
  https://YOUR_CONVEX_URL/api/v1/tokens
```

## Permissoes

| Permissao | Descricao |
|-----------|-----------|
| `drafts:read` | Listar e ver drafts |
| `drafts:create` | Criar novos drafts |
| `drafts:approve` | Aprovar drafts pendentes |
| `drafts:reject` | Rejeitar drafts pendentes |
| `drafts:schedule` | Agendar drafts |
| `drafts:publish` | Marcar como publicado |
| `tokens:read` | Listar tokens |
| `tokens:create` | Criar novos tokens |
| `tokens:revoke` | Revogar tokens |

## Endpoints

Base URL: `https://YOUR_CONVEX_URL/api/v1`

### Drafts

#### Criar Draft

```bash
POST /drafts
Content-Type: application/json
Permissao: drafts:create

{
  "content": "Texto do tweet (max 280 chars)"
}
```

Resposta (201):
```json
{"id": "jd7abc123..."}
```

#### Listar Drafts

```bash
GET /drafts
GET /drafts?status=pending
Permissao: drafts:read
```

Status: `pending`, `approved`, `rejected`, `published`

Resposta:
```json
{"drafts": [...]}
```

#### Ver Draft

```bash
GET /drafts/:id
Permissao: drafts:read
```

#### Aprovar Draft

```bash
POST /drafts/:id/approve
Permissao: drafts:approve
```

Resposta:
```json
{"success": true}
```

#### Rejeitar Draft

```bash
POST /drafts/:id/reject
Content-Type: application/json
Permissao: drafts:reject

{
  "reason": "Motivo da rejeicao (opcional)"
}
```

#### Agendar Draft

```bash
POST /drafts/:id/schedule
Content-Type: application/json
Permissao: drafts:schedule

{
  "scheduledFor": 1234567890000
}
```

`scheduledFor` e timestamp Unix em millisegundos. Omitir para desagendar.

#### Marcar como Publicado

```bash
POST /drafts/:id/publish
Content-Type: application/json
Permissao: drafts:publish

{
  "tweetId": "1234567890"
}
```

## Erros

| Codigo | Significado |
|--------|-------------|
| 401 | Token invalido, expirado ou revogado |
| 403 | Token valido mas sem permissao |
| 400 | Dados invalidos ou draft nao esta pendente |
| 404 | Draft nao encontrado |

Formato:
```json
{"error": "Mensagem de erro"}
```

## Workflow Tipico

### Agente de Geracao de Conteudo

```python
# 1. Criar draft
response = post("/drafts", {"content": "Novo tweet gerado pela IA"})
draft_id = response["id"]

# 2. Verificar se foi criado
draft = get(f"/drafts/{draft_id}")
print(draft["status"])  # "pending"
```

### Agente de Publicacao

```python
# 1. Listar drafts aprovados
approved = get("/drafts?status=approved")

# 2. Para cada aprovado, publicar no Twitter e marcar
for draft in approved["drafts"]:
    tweet_id = publish_to_twitter(draft["content"])
    post(f"/drafts/{draft['_id']}/publish", {"tweetId": tweet_id})
```

## OpenAPI Spec

Especificacao completa disponivel em:

```
GET /api/openapi.json
```

Use para gerar clients automaticamente ou validar requests.

## Notas

- Drafts criados via API tem `authorId` no formato `api:xpc_XXXXXXXX`
- O `authorName` e preenchido com a descricao do token
- Tokens revogados retornam 401 imediatamente
- Rate limiting nao implementado (use com responsabilidade)
