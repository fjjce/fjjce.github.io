/*
 * componentes.js
 * Carrega o cabeçalho e o rodapé (pasta partials/) em todas as páginas,
 * para que eles sejam escritos uma vez só.
 * Uso no HTML: <header data-incluir="partials/cabecalho.html"></header>
 *
 * Atenção: como usa fetch(), o site precisa ser aberto por um servidor
 * (ex.: extensão Live Server do VS Code ou GitHub Pages), e não com
 * duplo clique no arquivo.
 */

async function incluirPartes() {
  const alvos = document.querySelectorAll('[data-incluir]');
  await Promise.all([...alvos].map(async (el) => {
    try {
      const resposta = await fetch(el.dataset.incluir);
      if (!resposta.ok) throw new Error(resposta.status);
      el.innerHTML = await resposta.text();
    } catch (erro) {
      console.error('Não foi possível carregar', el.dataset.incluir, erro);
    }
  }));
  iniciarMenu();
  marcarLinkAtual();
  document.querySelectorAll('[data-ano]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* Menu do celular: abre e fecha com clique (não com hover) */
function iniciarMenu() {
  const botao = document.querySelector('.menu-botao');
  const menu = document.getElementById('menu-principal');
  if (!botao || !menu) return;

  const fechar = () => {
    botao.setAttribute('aria-expanded', 'false');
    menu.classList.remove('menu--aberto');
  };

  botao.addEventListener('click', () => {
    const aberto = botao.getAttribute('aria-expanded') === 'true';
    botao.setAttribute('aria-expanded', String(!aberto));
    menu.classList.toggle('menu--aberto', !aberto);
  });

  // Fecha ao escolher um link ou apertar Esc
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) fechar();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });
}

/* Destaca no menu o link da página atual */
function marcarLinkAtual() {
  let pagina = location.pathname.split('/').pop() || 'index.html';
  // páginas de detalhe acendem o item do menu da seção a que pertencem
  if (pagina === 'evento.html') pagina = 'campeonatos.html';
  if (pagina === 'noticia.html') pagina = 'noticias.html';
  document.querySelectorAll('.menu a').forEach((link) => {
    const destino = link.getAttribute('href').split('#')[0];
    if (destino === pagina && !link.hash) link.setAttribute('aria-current', 'page');
  });
}

incluirPartes();
