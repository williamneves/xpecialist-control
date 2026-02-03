---
created: 2026-02-03T12:00
title: Layout centralizado com max-width
area: ui
files:
  - src/routes/__root.tsx
  - src/routes/index.tsx
---

## Problem

O layout da aplicacao inteira nao esta centralizado. Falta margin-x-auto e um max-width adequado para que o conteudo nao se estique em telas largas.

## Solution

Adicionar container com `mx-auto` e `max-w-4xl` ou `max-w-6xl` no layout root ou nas paginas principais.
