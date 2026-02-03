---
created: 2026-02-03T12:00
title: Simplificar botao approve no drawer
area: ui
files:
  - src/components/DraftDetailSheet.tsx
---

## Problem

No drawer de verificacao (DraftDetailSheet), o botao e o link estao quebrando linha (wrapping). Usuario sugere que apenas "Aprovar" e suficiente - o usuario ja sabe que precisa segurar o botao.

## Solution

Simplificar o texto do botao de aprovacao. Remover texto extra ou link que causa o wrapping. Manter apenas "Aprovar" como label.
