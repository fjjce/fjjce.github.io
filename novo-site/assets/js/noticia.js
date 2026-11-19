/*
 * noticia.js
 * Página noticia.html?id=...: procura a notícia em dados/noticias.json,
 * lê o texto em noticias/<id>.md e monta a página.
 */

function botoesCompartilhar(noticia) {
  const endereco = location.href;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${noticia.titulo} ${endereco}`)}`;
  return `
    <div class="compartilhar">
      <span>Compartilhar:</span>
      <a class="botao botao--contorno-escuro botao--pequeno" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
      <button class="botao botao--contorno-escuro botao--pequeno" type="button" data-copiar>Copiar link</button>
    </div>`;
}

function montarNoticia(noticia, textoHTML, outras) {
  document.title = `${noticia.titulo} | FJJCE`;
  document.querySelector('meta[name="description"]').content = noticia.resumo || noticia.titulo;

  const campeonato = noticia.campeonato
    ? `<p class="noticia-pagina__campeonato"><a class="botao botao--ouro" href="evento.html?id=${encodeURIComponent(noticia.campeonato)}">Ver página do campeonato</a></p>`
    : '';

  const maisNoticias = outras.length
    ? `<section class="secao secao--cinza" aria-labelledby="outras-titulo">
        <div class="container">
          <div class="secao__cabeca"><h2 id="outras-titulo">Outras notícias</h2></div>
          <div class="noticias-grade">${outras.map(cartaoDeNoticia).join('')}</div>
        </div>
      </section>`
    : '';

  document.querySelector('[data-noticia]').innerHTML = `
    <section class="pagina-topo" aria-labelledby="noticia-titulo">
      <div class="container container--texto">
        <p class="pagina-topo__voltar"><a href="noticias.html">Todas as notícias</a></p>
        <time class="pagina-topo__data" datetime="${escaparHTML(noticia.data)}">${dataPorExtenso(noticia.data)}</time>
        <h1 id="noticia-titulo" class="noticia-pagina__titulo">${escaparHTML(noticia.titulo)}</h1>
        ${noticia.resumo ? `<p class="pagina-topo__texto">${escaparHTML(noticia.resumo)}</p>` : ''}
      </div>
    </section>

    <div class="faixa" aria-hidden="true"><span></span></div>

    <article class="secao secao--compacta">
      <div class="container container--texto">
        ${noticia.imagem ? `<figure class="noticia-pagina__imagem"><img src="${escaparHTML(noticia.imagem)}" alt=""></figure>` : ''}
        <div class="texto-corrido">${textoHTML}</div>
        ${campeonato}
        ${botoesCompartilhar(noticia)}
      </div>
    </article>
    ${maisNoticias}`;

  const copiar = document.querySelector('[data-copiar]');
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copiar.textContent = 'Link copiado';
    } catch {
      copiar.textContent = 'Copie o endereço da barra do navegador';
    }
  });
}

function naoEncontrada() {
  document.querySelector('[data-noticia]').innerHTML = `
    <section class="pagina-topo">
      <div class="container">
        <p class="pagina-topo__voltar"><a href="noticias.html">Todas as notícias</a></p>
        <h1 class="pagina-topo__titulo">Notícia não encontrada</h1>
        <p class="pagina-topo__texto">O endereço pode estar incompleto. Veja a lista de notícias e escolha a que procura.</p>
      </div>
    </section>`;
}

async function iniciar() {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const noticias = await carregarNoticias();
    const noticia = noticias.find((n) => n.id === id);
    if (!noticia) { naoEncontrada(); return; }

    let textoHTML;
    try {
      textoHTML = markdownParaHTML(await carregarTexto(noticia.id));
    } catch (erro) {
      console.error(erro);
      textoHTML = `<p>${escaparHTML(noticia.resumo || '')}</p>`;
    }
    montarNoticia(noticia, textoHTML, noticias.filter((n) => n.id !== id).slice(0, 3));
  } catch (erro) {
    console.error(erro);
    naoEncontrada();
  }
}

iniciar();
