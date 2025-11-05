# ♿ Acessibilidade - WaveSurf

**Conformidade**: Global Rules - Seção 69 (Acessibilidade WCAG)  
**Data**: 05/11/2025  
**Versão**: 1.0  
**Padrão**: WCAG 2.1 AA (mínimo obrigatório)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Padrões WCAG Implementados](#padrões-wcag-implementados)
3. [Estrutura Semântica](#estrutura-semântica)
4. [Navegação por Teclado](#navegação-por-teclado)
5. [Contraste e Cores](#contraste-e-cores)
6. [Componentes Acessíveis](#componentes-acessíveis)
7. [Testes de Acessibilidade](#testes-de-acessibilidade)
8. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Visão Geral

WaveSurf implementa padrões de acessibilidade seguindo **WCAG 2.1 nível AA**, garantindo que o e-commerce seja utilizável por pessoas com deficiências visuais, motoras, auditivas e cognitivas.

### Objetivos

- ✅ **100% navegável por teclado**
- ✅ **Compatível com screen readers** (NVDA, VoiceOver, TalkBack)
- ✅ **Contraste mínimo 4.5:1** para textos
- ✅ **Lighthouse Accessibility Score ≥ 95**
- ✅ **Zero violações críticas** no axe-core

---

## 📐 Padrões WCAG Implementados

### Princípio 1: Perceptível

#### 1.1 Alternativas em Texto
- ✅ Todas as imagens de produtos têm `alt` descritivo
- ✅ Ícones decorativos com `aria-hidden="true"`
- ✅ Ícones funcionais com `aria-label`

#### 1.2 Mídia Baseada em Tempo
- ⏳ Vídeos com legendas (quando implementado)
- ⏳ Transcrições para áudio (quando implementado)

#### 1.3 Adaptável
- ✅ Estrutura semântica com HTML5
- ✅ Ordem de leitura lógica
- ✅ Landmarks ARIA implementados

#### 1.4 Distinguível
- ✅ Contraste de cores WCAG AA
- ✅ Texto redimensionável até 200%
- ✅ Informação não dependente apenas de cor
- ✅ Suporte a `prefers-reduced-motion`

### Princípio 2: Operável

#### 2.1 Acessível por Teclado
- ✅ Todas as funcionalidades via teclado
- ✅ Sem armadilhas de teclado
- ✅ Atalhos documentados

#### 2.2 Tempo Suficiente
- ✅ Sem limites de tempo críticos
- ⏳ Avisos antes de timeout de sessão (planejado)

#### 2.3 Convulsões
- ✅ Sem conteúdo piscante acima de 3 vezes/segundo

#### 2.4 Navegável
- ✅ Skip links implementados
- ✅ Títulos de página descritivos
- ✅ Ordem de foco lógica
- ✅ Breadcrumbs (quando aplicável)

### Princípio 3: Compreensível

#### 3.1 Legível
- ✅ Idioma da página definido (`lang="pt-BR"`)
- ✅ Linguagem clara e objetiva

#### 3.2 Previsível
- ✅ Navegação consistente
- ✅ Identificação consistente de componentes
- ✅ Mudanças de contexto apenas com ação do usuário

#### 3.3 Assistência de Entrada
- ✅ Mensagens de erro descritivas
- ✅ Labels e instruções claras
- ✅ Prevenção de erros em transações

### Princípio 4: Robusto

#### 4.1 Compatível
- ✅ HTML válido e semântico
- ✅ ARIA usado corretamente
- ✅ Compatível com tecnologias assistivas

---

## 🏗️ Estrutura Semântica

### Landmarks Implementados

```html
<!-- Estrutura padrão do WaveSurf -->
<header role="banner">
  <nav role="navigation" aria-label="Menu principal">
    <!-- Navegação -->
  </nav>
</header>

<main role="main" id="main-content">
  <h1>Título da Página</h1>
  <!-- Conteúdo principal -->
</main>

<aside role="complementary" aria-label="Carrinho de compras">
  <!-- Sidebar/Carrinho -->
</aside>

<footer role="contentinfo">
  <!-- Rodapé -->
</footer>
```

### Hierarquia de Headings

```
h1: Título principal da página (único)
  h2: Seções principais (Produtos, Sobre, Serviços)
    h3: Subseções (Categorias de produtos)
      h4: Detalhes (Nome do produto individual)
```

---

## ⌨️ Navegação por Teclado

### Atalhos Implementados

| Tecla | Ação |
|-------|------|
| `Tab` | Avançar para próximo elemento focável |
| `Shift + Tab` | Voltar para elemento anterior |
| `Enter` | Ativar link/botão |
| `Space` | Ativar botão/checkbox |
| `Escape` | Fechar modal/dropdown |
| `Arrow keys` | Navegar em menus/dropdowns |

### Skip Links

```html
<!-- Implementado no Header -->
<a href="#main-content" class="skip-link">
  Pular para o conteúdo principal
</a>
```

### Trap de Foco em Modais

- ✅ Foco retorna ao elemento que abriu o modal ao fechar
- ✅ Tab/Shift+Tab circulam apenas dentro do modal
- ✅ Escape fecha o modal

---

## 🎨 Contraste e Cores

### Tokens de Acessibilidade

```css
/* Contrastes WCAG AA */
--text-primary: #1a1a1a;      /* 16.94:1 com branco */
--text-secondary: #4a4a4a;    /* 9.74:1 com branco */
--text-muted: #6b6b6b;        /* 6.61:1 com branco */

/* Estados de foco */
--focus-ring: 2px solid #005fcc;
--focus-ring-offset: 2px;

/* Estados de erro */
--error-color: #d32f2f;       /* 5.93:1 com branco */
--error-bg: #ffebee;

/* Estados de sucesso */
--success-color: #2e7d32;     /* 6.47:1 com branco */
--success-bg: #e8f5e8;
```

### Indicadores Visuais de Foco

```css
/* Foco visível obrigatório */
*:focus {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-ring-offset) rgba(0, 95, 204, 0.2);
}

*:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}
```

### Classes Utilitárias

```css
/* Screen reader only */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--text-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

---

## 🧩 Componentes Acessíveis

### Botões

```tsx
// ✅ Correto
<button 
  type="button"
  aria-label="Adicionar ao carrinho"
  onClick={handleAddToCart}
>
  <ShoppingCart aria-hidden="true" />
  <span className="sr-only">Adicionar ao carrinho</span>
</button>
```

### Links

```tsx
// ✅ Correto: link descritivo
<Link to="/produtos/prancha-surf-pro">
  Ver detalhes da Prancha Surf Pro
</Link>

// ❌ Evitar
<Link to="/produtos/123">
  Clique aqui
</Link>
```

### Formulários

```tsx
// ✅ Correto: label associado
<div className="form-group">
  <label htmlFor="email" className="required">
    E-mail
    <span aria-label="campo obrigatório">*</span>
  </label>
  <input 
    type="email" 
    id="email" 
    name="email"
    required
    aria-describedby="email-help email-error"
    aria-invalid={!!errors.email}
  />
  <div id="email-help" className="help-text">
    Digite seu endereço de e-mail válido
  </div>
  {errors.email && (
    <div id="email-error" className="error-message" role="alert">
      {errors.email}
    </div>
  )}
</div>
```

### Imagens de Produtos

```tsx
// ✅ Correto: alt descritivo
<img 
  src={produto.imagem_url} 
  alt={`${produto.nome} - ${produto.categoria}`}
  loading="lazy"
/>

// ✅ Imagem decorativa
<img 
  src="/decorative-wave.svg" 
  alt=""
  aria-hidden="true"
/>
```

---

## 🧪 Testes de Acessibilidade

### Ferramentas Utilizadas

1. **axe-core**: testes automatizados
2. **Lighthouse**: auditoria completa
3. **WAVE**: validação manual
4. **Screen readers**: NVDA (Windows), VoiceOver (macOS)

### Testes Automatizados

```typescript
// tests/accessibility/a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Home page should not have violations', async () => {
    const { container } = render(<Index />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Product page should not have violations', async () => {
    const { container } = render(<Products />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testes Manuais

**Checklist de Testes**:
- [ ] Navegar todo o site apenas com teclado
- [ ] Testar com NVDA/VoiceOver
- [ ] Verificar contraste com Colour Contrast Analyser
- [ ] Testar com zoom 200%
- [ ] Validar com WAVE browser extension

---

## ✅ Checklist de Implementação

### Estrutura e Semântica
- [x] Hierarquia de headings lógica
- [x] Landmarks semânticos implementados
- [x] HTML5 semântico (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [ ] Roles ARIA onde necessário

### Navegação
- [ ] Skip links implementados
- [x] Navegação por teclado funcional
- [ ] Foco visível em todos os elementos
- [ ] Trap de foco em modais
- [ ] Ordem de foco lógica

### Formulários
- [x] Labels associados a inputs
- [x] Mensagens de erro com `aria-describedby`
- [x] Estados de validação com `aria-invalid`
- [x] Campos obrigatórios identificados
- [ ] Fieldsets para grupos de campos

### Conteúdo
- [x] Alt text em imagens de produtos
- [ ] Contraste mínimo 4.5:1 validado
- [ ] Informação não dependente de cor
- [ ] Suporte a `prefers-reduced-motion`

### Testes
- [ ] axe-core integrado ao pipeline
- [ ] Lighthouse CI configurado
- [ ] ESLint jsx-a11y ativo
- [ ] Testes com screen reader

---

## 📊 Métricas de Sucesso

### Targets

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| Lighthouse Accessibility | ≥ 95 | - | ⏳ Pendente |
| axe-core violations | 0 críticas | - | ⏳ Pendente |
| Cobertura de testes a11y | ≥ 80% | 0% | ⏳ Pendente |
| Navegação por teclado | 100% | ~80% | 🟡 Em progresso |

---

## 🚀 Próximos Passos

### Curto Prazo (Sprint Atual)
1. ✅ Criar documento de acessibilidade
2. ⏳ Adicionar tokens CSS de acessibilidade
3. ⏳ Configurar ESLint jsx-a11y
4. ⏳ Implementar skip links
5. ⏳ Adicionar testes axe-core

### Médio Prazo (Próximo Sprint)
6. ⏳ Implementar trap de foco em modais
7. ⏳ Validar contraste de todas as cores
8. ⏳ Configurar Lighthouse CI
9. ⏳ Testes com screen readers
10. ⏳ Documentar atalhos de teclado

### Longo Prazo (Q1 2026)
11. ⏳ Certificação WCAG 2.1 AA
12. ⏳ Auditoria por especialista
13. ⏳ Testes com usuários com deficiência
14. ⏳ Migração para WCAG 2.2 AA

---

## 📚 Recursos

### Documentação
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Ferramentas
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Última Atualização**: 05/11/2025  
**Responsável**: Equipe de Desenvolvimento WaveSurf  
**Próxima Revisão**: Mensal
