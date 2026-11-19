/*
 * campeonatos.js
 * Página campeonatos.html: lista os próximos campeonatos e os encerrados,
 * separados por ano. Os dados vêm de dados/eventos.json.
 */

async function iniciar() {
  const listaProximos = document.querySelector('[data-lista="proximos"]');
  try {
    const eventos = await carregarEventos();

    const futuros = proximos(eventos);
    listaProximos.innerHTML = futuros.length
      ? futuros.map(itemDeEvento).join('')
      : '<li class="carregando">Nenhum campeonato com data marcada no momento. Acompanhe as novidades no Instagram @fjjce_oficial.</li>';

    const passados = encerrados(eventos);
    if (passados.length) {
      const porAno = {};
      passados.forEach((e) => {
        const ano = lerData(e.inicio).getFullYear();
        (porAno[ano] = porAno[ano] || []).push(e);
      });
      document.querySelector('[data-lista="encerrados"]').innerHTML = Object.keys(porAno)
        .sort((a, b) => b - a)
        .map((ano) => `
          <h3 class="calendario__ano">${ano}</h3>
          <ol class="calendario">${porAno[ano].map(itemDeEvento).join('')}</ol>`)
        .join('');
      document.querySelector('[data-bloco="encerrados"]').hidden = false;
    }
  } catch (erro) {
    console.error(erro);
    listaProximos.innerHTML =
      '<li class="carregando">Não foi possível carregar os campeonatos. Abra o site por um servidor (ex.: Live Server).</li>';
  }
}

iniciar();
