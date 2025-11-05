/**
 * SkipLink Component
 * 
 * Componente de acessibilidade que permite usuários de teclado/screen readers
 * pularem diretamente para o conteúdo principal da página.
 * 
 * Conformidade: WCAG 2.1 - Critério 2.4.1 (Bypass Blocks)
 */

export const SkipLink = () => {
  return (
    <a 
      href="#main-content" 
      className="skip-link"
      aria-label="Pular para o conteúdo principal"
    >
      Pular para o conteúdo principal
    </a>
  );
};
