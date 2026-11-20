/*
 * evento.js
 * Página evento.html?id=ceara-pro-2026
 * Procura o campeonato pelo "id" em dados/eventos.json e monta a página.
 * Se existir o arquivo eventos/<id>.md, mostra a seção "Informações do campeonato".
 * Se houver pódios desse campeonato em dados/resultados.csv, mostra os resultados.
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
  } else if (estadoInscricoes(evento) === 'abertas' && links.inscricoes) {
    acao = `<a class="botao botao--ouro" href="${escaparHTML(links.inscricoes)}" target="_blank" rel="noopener">Inscrever-se no iLutas</a>`
      + (evento.prazo_inscricoes ? `<p class="evento-pagina__prazo">Inscrições até ${dataPorExtenso(evento.prazo_inscricoes)}.</p>` : '');
  } else if (estadoInscricoes(evento) === 'encerradas') {
    // Inscrições fechadas: chaves, cronograma e checagem viram os botões principais
    const doDia = documentosDoDia(evento);
    const encerradas = `Inscrições encerradas${evento.prazo_inscricoes ? ` em ${dataPorExtenso(evento.prazo_inscricoes)}` : ''}.`;
    if (doDia.length) {
      acao = `<div class="evento-pagina__botoes">${doDia.map((d, i) =>
        `<a class="botao ${i === 0 ? 'botao--ouro' : 'botao--contorno-escuro'}" href="${escaparHTML(d.url)}" target="_blank" rel="noopener">${d.texto}</a>`).join('')}</div>
        <p class="evento-pagina__prazo">${encerradas}${links.chaves ? '' : ' Chaves e cronograma serão divulgados em breve, primeiro no iLutas e depois no Instagram da federação.'}</p>`;
    } else {
      acao = `<p class="evento-pagina__aviso">${encerradas}</p>
        <p class="evento-pagina__prazo">Chaves e cronograma serão divulgados em breve, primeiro no iLutas e depois no Instagram da federação.</p>
        ${links.inscricoes ? `<div class="evento-pagina__botoes"><a class="botao botao--contorno-escuro" href="${escaparHTML(links.inscricoes)}" target="_blank" rel="noopener">Acompanhar no iLutas</a></div>` : ''}`;
    }
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

          ${passou ? '' : botoesAgenda(evento, location.href)}

          ${evento.descricao ? `<p class="evento-pagina__descricao">${escaparHTML(evento.descricao)}</p>` : ''}

          <div data-informacoes></div>

          <h2 class="evento-pagina__subtitulo">Documentos do campeonato</h2>
          <ul class="evento-pagina__docs">${documentos}</ul>

          ${apoio}

          ${botoesCompartilhar(evento.nome, enderecoParaCompartilhar('evento', evento.id))}
        </div>

        ${evento.imagem ? `
        <figure class="evento-pagina__cartaz">
          <a href="${escaparHTML(evento.imagem)}" target="_blank" rel="noopener">
            <img src="${escaparHTML(evento.imagem)}" alt="Cartaz do ${escaparHTML(evento.nome)}" width="1080" height="1069" fetchpriority="high">
          </a>
          <figcaption>Toque no cartaz para ampliar.</figcaption>
        </figure>` : ''}
      </div>
    </section>`;
}

/* ---------- informações do campeonato (texto em eventos/<id>.md) ---------- */

async function montarInformacoes(evento) {
  try {
    const resposta = await fetch(`eventos/${encodeURIComponent(evento.id)}.md`);
    if (!resposta.ok) return; // campeonato sem arquivo de informações
    const html = markdownParaHTML(await resposta.text());
    document.querySelector('[data-informacoes]').innerHTML = `
      <h2 class="evento-pagina__subtitulo">Informações do campeonato</h2>
      <div class="texto-corrido texto-corrido--evento">${html}</div>`;
  } catch (erro) {
    console.error(erro);
  }
}

/* ---------- resultados (pódios) ---------- */

function nomesNaColocacao(lista, colocacao) {
  const nomes = lista.filter((r) => r.colocacao === colocacao);
  if (!nomes.length) return '<span class="podio__vazio">-</span>';
  return nomes.map((r) => `<span class="podio__nome">${escaparHTML(r.atleta)}</span><span class="podio__equipe">${escaparHTML(r.equipe)}</span>`).join('');
}

async function montarResultados(evento) {
  let resultados;
  try {
    const info = await (await fetch('dados/ranking-info.json')).json();
    resultados = (await carregarResultados(info)).filter((r) => r.evento === evento.id);
  } catch (erro) {
    console.error(erro);
    return;
  }
  if (!resultados.length) return;

  // Agrupa por sexo + idade + faixa, na ordem das listas do ranking
  const ordem = (lista, valor) => { const i = lista.indexOf(valor); return i < 0 ? 99 : i; };
  const grupos = new Map();
  resultados.forEach((r) => {
    const chave = `${r.sexo}|${r.idade}|${r.faixa}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(r);
  });
  const chaves = [...grupos.keys()].sort((a, b) => {
    const [sa, ia, fa] = a.split('|');
    const [sb, ib, fb] = b.split('|');
    return ordem(RANKING.sexos, sa) - ordem(RANKING.sexos, sb)
      || ordem(RANKING.idades, ia) - ordem(RANKING.idades, ib)
      || ordem(RANKING.faixas, fb) - ordem(RANKING.faixas, fa); // faixa preta primeiro
  });

  const blocos = chaves.map((chave) => {
    const [sexo, idade, faixa] = chave.split('|');
    const lista = grupos.get(chave);
    const pesos = [...new Set(lista.map((r) => r.peso))]
      .sort((a, b) => ordem(RANKING.pesos, a) - ordem(RANKING.pesos, b));
    const linhas = pesos.map((peso) => {
      const doPeso = lista.filter((r) => r.peso === peso);
      return `
        <tr>
          <th scope="row">${escaparHTML(peso)}</th>
          <td>${nomesNaColocacao(doPeso, 1)}</td>
          <td>${nomesNaColocacao(doPeso, 2)}</td>
          <td>${nomesNaColocacao(doPeso, 3)}</td>
        </tr>`;
    }).join('');
    return `
      <details class="podio">
        <summary>
          <span class="faixa-cor faixa-cor--${slug(faixa)}" aria-hidden="true"></span>
          ${escaparHTML(sexo)} ${escaparHTML(idade.toLowerCase())}, faixa ${escaparHTML(faixa.toLowerCase())}
          <span class="podio__qtd">${pesos.length} categoria${pesos.length === 1 ? '' : 's'}</span>
        </summary>
        <div class="podio__tabela" tabindex="0" role="region" aria-label="Pódios: ${escaparHTML(sexo)} ${escaparHTML(idade.toLowerCase())}, faixa ${escaparHTML(faixa.toLowerCase())}">
          <table>
            <thead><tr><th scope="col">Peso</th><th scope="col">Campeão</th><th scope="col">Vice</th><th scope="col">3º lugar</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </details>`;
  }).join('');

  const secao = document.createElement('section');
  secao.className = 'secao secao--cinza';
  secao.setAttribute('aria-labelledby', 'resultados-titulo');
  secao.innerHTML = `
    <div class="container">
      <div class="secao__cabeca">
        <h2 id="resultados-titulo">Resultados</h2>
        <p>Pódio de cada categoria. Toque em uma categoria para ver os medalhistas.</p>
      </div>
      ${blocos}
    </div>`;
  document.querySelector('[data-evento]').appendChild(secao);
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
    if (evento) {
      montarEvento(evento);
      montarInformacoes(evento);
      montarResultados(evento);
    } else naoEncontrado();
  } catch (erro) {
    console.error(erro);
    naoEncontrado();
  }
}

iniciar();
