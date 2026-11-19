/*
 * noticias.js
 * Página noticias.html: mostra as notícias da mais nova para a mais antiga,
 * 9 por vez, com o botão "Mostrar notícias anteriores".
 */

const POR_VEZ = 9;

async function iniciar() {
  const area = document.querySelector('[data-lista="noticias"]');
  const blocoMais = document.querySelector('[data-mais]');
  try {
    const noticias = await carregarNoticias();
    let mostradas = 0;

    const mostrarMais = () => {
      const proximas = noticias.slice(mostradas, mostradas + POR_VEZ);
      if (mostradas === 0) area.innerHTML = '';
      area.insertAdjacentHTML('beforeend', proximas.map(cartaoDeNoticia).join(''));
      mostradas += proximas.length;
      blocoMais.hidden = mostradas >= noticias.length;
    };

    if (!noticias.length) {
      area.innerHTML = '<p class="carregando">Nenhuma notícia publicada ainda.</p>';
      return;
    }
    mostrarMais();
    blocoMais.querySelector('button').addEventListener('click', mostrarMais);
  } catch (erro) {
    console.error(erro);
    area.innerHTML = '<p class="carregando">Não foi possível carregar as notícias. Abra o site por um servidor (ex.: Live Server).</p>';
  }
}

iniciar();
