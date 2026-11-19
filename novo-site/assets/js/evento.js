/*
 * evento.js
 * Página evento.html?id=ceara-pro-2026
 * Procura o campeonato pelo "id" em dados/eventos.json e monta a página.
 */

function mapa(evento) {
  const lugar = [evento.local, evento.endereco, evento.cidade].filter(Boolean).join(', ');
  const busca = encodeURIComponent(lugar);
  return `https://www.google.com/maps/search/?api=1&query=${busca}`;
}

function montarEvento(evento) {
  const st = situacao(evento);
  const passou = st.classe === 'encerrado';
  const links = evento.links || {};
  const periodo = formatarPeriodo(evento.inicio, evento.fim);

  document.title = `${evento.nome} | FJJCE`;
  document.querySelector('meta[name="description"]').content =
    `${evento.nome}${evento.etapa ? `, ${evento.etapa}` : ''}. ${periodo}, ${evento.local}, ${evento.cidade}.`;

  // Botão principal
  let acao;
  if (passou && links.resultados) {
    acao = `<a class="botao botao--ouro" href="${escaparHTML(links.resultados)}" target="_blank" rel="noopener">Ver resultados</a>`;
  } else if (passou) {
    acao = '<p class="evento-pagina__aviso">Campeonato encerrado. Os resultados serão publicados aqui.</p>';
  } else if (evento.inscricoes_abertas && links.inscricoes) {
    acao = `<a class="botao botao--ouro" href="${escaparHTML(links.inscricoes)}" target="_blank" rel="noopener">Inscrever-se no iLutas</a>`;
  } else {
    acao = '<p class="evento-pagina__aviso">As inscrições ainda não abriram.</p>';
  }

  // Todos os documentos: os que já existem viram link, os outros aparecem como pendentes
  const documentos = Object.entries(NOMES_LINKS)
    .filter(([chave]) => chave !== 'inscricoes')
    .map(([chave, nome]) => (links[chave]
      ? `<li><a class="doc-evento" href="${escaparHTML(links[chave])}" target="_blank" rel="noopener">${nome}</a></li>`
      : `<li><span class="doc-evento doc-evento--pendente">${nome}<span>${passou ? 'Não publicado' : 'Em breve'}</span></span></li>`))
    .join('');

  const modalidades = (evento.modalidades || []).length
    ? `<div><dt>Modalidades</dt><dd>${evento.modalidades.map(escaparHTML).join('<br>')}</dd></div>`
    : '';

  const apoio = (evento.apoio || []).length
    ? `<h2 class="evento-pagina__subtitulo">Apoio</h2>
       <ul class="evento-pagina__apoio">${evento.apoio.map((a) => `<li>${escaparHTML(a)}</li>`).join('')}</ul>`
    : '';

  document.querySelector('[data-evento]').innerHTML = `
    <section class="pagina-topo" aria-labelledby="evento-titulo">
      <div class="container">
        <p class="pagina-topo__voltar"><a href="campeonatos.html">Todos os campeonatos</a></p>
        <span class="selo selo--${st.classe} selo--no-escuro">${st.texto}</span>
        <h1 id="evento-titulo" class="pagina-topo__titulo">${escaparHTML(evento.nome)}</h1>
        ${evento.etapa ? `<p class="pagina-topo__texto">${escaparHTML(evento.etapa)}</p>` : ''}
      </div>
    </section>

    <div class="faixa" aria-hidden="true"><span></span></div>

    <section class="secao secao--compacta">
      <div class="container evento-pagina">
        <div class="evento-pagina__conteudo">
          <dl class="evento-pagina__info">
            <div><dt>Data</dt><dd>${periodo}</dd></div>
            <div>
              <dt>Local</dt>
              <dd>${escaparHTML(evento.local)}, ${escaparHTML(evento.cidade)}<br>
                ${evento.endereco ? `<span class="evento-pagina__endereco">${escaparHTML(evento.endereco)}</span><br>` : ''}
                <a href="${mapa(evento)}" target="_blank" rel="noopener">Como chegar</a></dd>
            </div>
            ${modalidades}
          </dl>

          <div class="evento-pagina__acao">${acao}</div>

          ${evento.descricao ? `<p class="evento-pagina__descricao">${escaparHTML(evento.descricao)}</p>` : ''}

          <h2 class="evento-pagina__subtitulo">Documentos do campeonato</h2>
          <ul class="evento-pagina__docs">${documentos}</ul>

          ${apoio}
        </div>

        ${evento.imagem ? `
        <figure class="evento-pagina__cartaz">
          <a href="${escaparHTML(evento.imagem)}" target="_blank" rel="noopener">
            <img src="${escaparHTML(evento.imagem)}" alt="Cartaz do ${escaparHTML(evento.nome)}" width="1080" height="1069">
          </a>
          <figcaption>Toque no cartaz para ampliar.</figcaption>
        </figure>` : ''}
      </div>
    </section>`;
}

function naoEncontrado() {
  document.querySelector('[data-evento]').innerHTML = `
    <section class="pagina-topo">
      <div class="container">
        <p class="pagina-topo__voltar"><a href="campeonatos.html">Todos os campeonatos</a></p>
        <h1 class="pagina-topo__titulo">Campeonato não encontrado</h1>
        <p class="pagina-topo__texto">O endereço pode estar incompleto. Veja a lista de campeonatos e escolha o que procura.</p>
      </div>
    </section>`;
}

async function iniciar() {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const eventos = await carregarEventos();
    const evento = eventos.find((e) => e.id === id);
    if (evento) montarEvento(evento);
    else naoEncontrado();
  } catch (erro) {
    console.error(erro);
    naoEncontrado();
  }
}

iniciar();
