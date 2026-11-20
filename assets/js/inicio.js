/*
 * inicio.js
 * Monta a página inicial a partir dos arquivos da pasta dados/:
 *   dados/eventos.json   -> destaque do topo e próximos campeonatos
 *   dados/resultados.csv -> prévia do ranking (via ranking-dados.js)
 *   dados/noticias.json  -> últimas notícias (via noticias-dados.js)
 * Para atualizar o site, edite os arquivos de dados. Não é preciso mexer aqui.
 * Usa funções de util.js, eventos-dados.js, ranking-dados.js e noticias-dados.js.
 */

/* ---------- destaque do topo ---------- */

// Mostra o próximo campeonato. Se não houver nenhum marcado,
// mostra o último que aconteceu (com link para os resultados).
function montarDestaque(evento, jaAconteceu) {
  const campo = (nome) => document.querySelector(`[data-destaque="${nome}"]`);
  campo('rotulo').textContent = jaAconteceu ? 'Último campeonato' : 'Próximo campeonato';
  campo('nome').textContent = evento.nome;
  campo('etapa').textContent = evento.etapa || '';
  campo('data').textContent = formatarPeriodo(evento.inicio, evento.fim);
  campo('local').textContent = `${evento.local}, ${evento.cidade}`;

  const links = linksDoEvento(evento);
  const achar = (chave) => links.find((l) => l.chave === chave);
  const acoes = [];

  if (jaAconteceu) {
    const resultados = achar('resultados');
    if (resultados) {
      acoes.push(`<a class="botao botao--ouro" href="${escaparHTML(resultados.url)}" target="_blank" rel="noopener">Ver resultados</a>`);
    }
  } else if (estadoInscricoes(evento) === 'abertas' && achar('inscricoes')) {
    acoes.push(`<a class="botao botao--ouro" href="${escaparHTML(achar('inscricoes').url)}" target="_blank" rel="noopener">Inscrever-se no iLutas</a>`);
  } else if (estadoInscricoes(evento) === 'encerradas') {
    // Quando as chaves (ou o cronograma) saem, viram o botão principal do topo
    const doDia = documentosDoDia(evento)[0];
    acoes.push(doDia
      ? `<a class="botao botao--ouro" href="${escaparHTML(doDia.url)}" target="_blank" rel="noopener">${doDia.texto}</a>`
      : '<span class="destaque__aviso">Inscrições encerradas</span>');
  } else {
    acoes.push('<span class="destaque__aviso">Inscrições em breve</span>');
  }
  acoes.push(`<a class="botao botao--claro" href="${linkDoEvento(evento)}">Detalhes do campeonato</a>`);
  campo('acoes').innerHTML = acoes.join('');

  if (evento.imagem) {
    const figura = campo('cartaz');
    const img = figura.querySelector('img');
    img.src = evento.imagem;
    img.alt = `Cartaz do ${evento.nome}`;
    figura.hidden = false;
  }
}

/* ---------- próximos campeonatos ---------- */

function montarCalendario(eventos) {
  const lista = document.querySelector('[data-lista="eventos"]');
  const futuros = proximos(eventos).slice(0, 4);
  lista.innerHTML = futuros.length
    ? futuros.map(itemDeEvento).join('')
    : '<li class="carregando">Nenhum campeonato com data marcada no momento. Acompanhe as novidades no Instagram @fjjce_oficial.</li>';
}

/* ---------- ranking ---------- */

// Prévia: os 5 maiores pontuadores da faixa preta adulto, masculino e feminino.
function montarRanking({ info, atletas }) {
  // Enquanto o ranking não for publicado, a seção some da página inicial
  if (info.publicado === false || !atletas.length) {
    document.getElementById('ranking').hidden = true;
    return;
  }
  document.querySelector('[data-aviso-ranking]').innerHTML = avisoDemonstracao(info);
  document.querySelector('[data-temporada-ranking]').textContent = info.temporada;
  if (info.atualizado_em) {
    document.querySelector('[data-ranking-atualizado]').textContent =
      `Maiores pontuações da faixa preta adulto, somando todos os pesos. Atualizado em ${dataPorExtenso(info.atualizado_em)}.`;
  }
  const grupos = [
    { titulo: 'Masculino adulto, faixa preta', sexo: 'Masculino', link: 'ranking.html?sexo=masculino&idade=adulto&faixa=preta' },
    { titulo: 'Feminino adulto, faixa preta', sexo: 'Feminino', link: 'ranking.html?sexo=feminino&idade=adulto&faixa=preta' },
  ];
  document.querySelector('[data-lista="ranking"]').innerHTML = grupos.map((g) => {
    const top = classificar(atletas.filter((a) => a.sexo === g.sexo && a.idade === 'Adulto' && a.faixa === 'Preta')).slice(0, 5);
    return `
    <div class="ranking__tabela">
      <table>
        <caption>
          <span class="ranking__titulo">
            <span class="faixa-cor faixa-cor--preta" aria-hidden="true"></span>
            <a class="ranking__link" href="${g.link}">${g.titulo}</a>
          </span>
        </caption>
        <thead>
          <tr><th scope="col">Pos.</th><th scope="col">Atleta</th><th scope="col">Pontos</th></tr>
        </thead>
        <tbody>
          ${top.map((a) => `
            <tr>
              <th scope="row" class="ranking__pos">${a.posicao}</th>
              <td>
                <span class="ranking__nome">${escaparHTML(a.atleta)}</span>
                <span class="ranking__equipe">${escaparHTML(a.equipe)}, peso ${escaparHTML(a.peso.toLowerCase())}. ${medalhas(a)}</span>
              </td>
              <td class="ranking__pontos">${formatarPontos(a.pontos)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }).join('');
}

/* ---------- notícias ---------- */

async function montarNoticias() {
  const noticias = await carregarNoticias();
  document.querySelector('[data-lista="noticias"]').innerHTML = noticias.slice(0, 3).map((n, i) => `
    <article class="noticia${i === 0 ? ' noticia--principal' : ''}${n.imagem ? '' : ' noticia--sem-imagem'}">
      ${n.imagem ? `<img src="${escaparHTML(n.imagem)}" alt="" loading="lazy" width="327" height="184">` : ''}
      <div class="noticia__texto">
        <time datetime="${escaparHTML(n.data)}">${dataPorExtenso(n.data)}</time>
        <h3><a href="${linkDaNoticia(n)}">${escaparHTML(n.titulo)}</a></h3>
        <p>${escaparHTML(n.resumo || '')}</p>
      </div>
    </article>`).join('');
}

/* ---------- início ---------- */

async function iniciar() {
  try {
    const eventos = await carregarEventos();
    montarCalendario(eventos);
    const proximo = proximos(eventos)[0];
    const ultimo = encerrados(eventos)[0];
    if (proximo) montarDestaque(proximo, false);
    else if (ultimo) montarDestaque(ultimo, true);
  } catch (erro) {
    console.error(erro);
    document.querySelector('[data-lista="eventos"]').innerHTML =
      '<li class="carregando">Não foi possível carregar os campeonatos. Abra o site por um servidor (ex.: Live Server).</li>';
  }

  try { montarRanking(await carregarRanking()); } catch (erro) { console.error(erro); }
  try { await montarNoticias(); } catch (erro) { console.error(erro); }
}

iniciar();
