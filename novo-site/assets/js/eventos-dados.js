/*
 * eventos-dados.js
 * Lê dados/eventos.json e oferece funções usadas pela página inicial,
 * por campeonatos.html e por evento.html.
 */

const NOMES_LINKS = {
  inscricoes: 'Inscrições',
  edital: 'Edital',
  checagem: 'Checagem de peso',
  cronograma: 'Cronograma',
  chaves: 'Chaves',
  resultados: 'Resultados',
};

// Devolve os eventos em ordem de data
async function carregarEventos() {
  const resposta = await fetch('dados/eventos.json');
  if (!resposta.ok) throw new Error(`eventos.json: ${resposta.status}`);
  const dados = await resposta.json();
  return [...dados.eventos].sort((a, b) => lerData(a.inicio) - lerData(b.inicio));
}

function fimDo(evento) {
  return lerData(evento.fim || evento.inicio);
}

const proximos = (eventos) => eventos.filter((e) => fimDo(e) >= hoje());
const encerrados = (eventos) => eventos.filter((e) => fimDo(e) < hoje()).reverse();

function linkDoEvento(evento) {
  return `evento.html?id=${encodeURIComponent(evento.id)}`;
}

// "22 de novembro de 2026", "6 e 7 de março de 2027", "11 a 13 de junho de 2027"
function formatarPeriodo(inicio, fim) {
  const i = lerData(inicio);
  const f = lerData(fim || inicio);
  const ano = f.getFullYear();
  if (i.getTime() === f.getTime()) return `${i.getDate()} de ${MESES[i.getMonth()]} de ${ano}`;
  if (i.getMonth() === f.getMonth()) {
    const ligacao = Math.round((f - i) / 86400000) === 1 ? 'e' : 'a';
    return `${i.getDate()} ${ligacao} ${f.getDate()} de ${MESES[f.getMonth()]} de ${ano}`;
  }
  return `${i.getDate()} de ${MESES[i.getMonth()]} a ${f.getDate()} de ${MESES[f.getMonth()]} de ${ano}`;
}

function situacao(evento) {
  const inicio = lerData(evento.inicio);
  const fim = fimDo(evento);
  if (fim < hoje()) return { classe: 'encerrado', texto: 'Encerrado' };
  if (inicio <= hoje()) return { classe: 'hoje', texto: 'É hoje' };
  if (evento.inscricoes_abertas) return { classe: 'aberto', texto: 'Inscrições abertas' };
  return { classe: 'em-breve', texto: 'Em breve' };
}

// Só os links preenchidos
function linksDoEvento(evento) {
  return Object.entries(evento.links || {})
    .filter(([, url]) => url)
    .map(([chave, url]) => ({ chave, texto: NOMES_LINKS[chave] || chave, url }));
}

// Linha de um evento nas listas (página inicial e campeonatos.html)
function itemDeEvento(evento) {
  const i = lerData(evento.inicio);
  const f = fimDo(evento);
  const dias = i.getTime() === f.getTime() ? `${i.getDate()}` : `${i.getDate()}–${f.getDate()}`;
  const st = situacao(evento);
  // depois do campeonato, o link de inscrição não faz mais sentido
  const links = linksDoEvento(evento).filter((l) => !(st.classe === 'encerrado' && l.chave === 'inscricoes'));
  const linksHtml = links.length
    ? `<ul class="evento__links">${links.map((l) =>
      `<li><a href="${escaparHTML(l.url)}" target="_blank" rel="noopener">${escaparHTML(l.texto)}</a></li>`).join('')}</ul>`
    : `<p class="evento__pendente">${st.classe === 'encerrado' ? 'Resultados serão publicados aqui.' : 'Edital e inscrições serão divulgados aqui.'}</p>`;

  return `
    <li class="evento evento--${st.classe}">
      <time class="evento__data" datetime="${escaparHTML(evento.inicio)}">
        <span class="evento__dias">${dias}</span>
        <span class="evento__mes">${MESES_CURTOS[i.getMonth()]} ${i.getFullYear()}</span>
      </time>
      <div class="evento__corpo">
        <h3 class="evento__nome"><a href="${linkDoEvento(evento)}">${escaparHTML(evento.nome)}</a></h3>
        <p class="evento__meta">${evento.etapa ? `${escaparHTML(evento.etapa)}. ` : ''}${escaparHTML(evento.local)}, ${escaparHTML(evento.cidade)}</p>
        ${linksHtml}
      </div>
      <span class="selo selo--${st.classe}">${st.texto}</span>
    </li>`;
}
