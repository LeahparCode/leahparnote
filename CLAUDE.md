# Leahpar Note

App de monitoria de qualidade em React + Vite + Tailwind. Os dados vêm de um Google Apps Script (`API_URL` em `src/App.jsx`).

## Fluxo de trabalho

- Toda alteração no código deve ir para um pull request: crie um branch, faça commit e push, e abra o PR contra `main`. Não faça commit direto no `main`.
- Antes de abrir o PR, rode `npm run build` e confira que compila.
- Depois de abrir o PR, aguarde a revisão automática (Codex) terminar, trate o que ela apontar e faça o merge do PR no `main`.
- Toda a interface é em português do Brasil (pt-BR): use "usuário", "senha", "equipe", "arquivo", "salvar" etc., nunca termos de Portugal.

## Identidade visual

- Os tokens de cor ficam em `src/index.css` (`:root` e `.dark`) como canais RGB e são expostos no `tailwind.config.js` (`paper`, `surface`, `ink`, `sub`, `brand`, `good`, `warn`, `bad`…).
- Fontes: Instrument Serif para títulos (`font-display`), Geist para o texto e Geist Mono para números (`font-mono`).
- Use as classes de componente já existentes (`.panel`, `.btn` e variantes, `.field`, `.field-label`, `.idx`) em vez de criar estilos soltos.
