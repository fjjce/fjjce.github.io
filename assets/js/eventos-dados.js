/*
 * eventos-dados.js
 * Lê dados/eventos.json e oferece funções usadas pela página inicial,
 * por campeonatos.html e por evento.html.
 */

const NOMES_LINKS = {
  inscricoes: 'Inscrições',
  edital: 'Edital',
  checagem: 'Checagem (lista de inscritos)',
  cronograma: 'Cronograma',
  chaves: 'Chaves',
  resultados: 'Resultados',
};

// Devolve os eventos em ordem de data
async function carregarEventos() {
  const resposta = await fetch('dados/eventos.json', { cache: 'no-cache' });
  if (!resposta.ok) throw new Error(`eventos.json: ${resposta.status}`);
  const dados = await resposta.json();
  return dados.eventos.map(completarLinks).sort((a, b) => lerData(a.inicio) - lerData(b.inicio));
}

// Com o código do evento no iLutas ("ilutas"), o site monta sozinho os links que seguem
// um endereço fixo: a página do evento (inscrições e edital), a checagem (quando as inscrições abrem)
// e os resultados (a partir do dia do campeonato). Link colado à mão em "links" sempre vale mais.
const ILUTAS = 'https://www.ilutas.com.br';

function completarLinks(evento) {
  const codigo = (evento.ilutas || '').trim();
  if (!codigo) return evento;
  const links = { ...(evento.links || {}) };
  const c = encodeURIComponent(codigo);
  if (!links.inscricoes) links.inscricoes = `${ILUTAS}/Evento/?event=${c}`;
  // A página do evento no iLutas traz o regulamento completo (valores, pesagem, uniforme, premiação)
  if (!links.edital) links.edital = `${ILUTAS}/Evento/?event=${c}`;
  if (!links.checagem && estadoInscricoes(evento) !== 'em-breve') {
    links.checagem = `${ILUTAS}/checagem/list-all/?event=${c}`;
  }
  // Resultados a partir do dia do campeonato: o iLutas publica ao longo do dia
  if (!links.resultados && lerData(evento.inicio) <= hoje()) {
    links.resultados = `${ILUTAS}/resultado/filter/?type=1&event=${c}`;
  }
  return { ...evento, links };
}

function fimDo(evento) {
  return lerData(evento.fim || evento.inicio);
}

// O campeonato termina no último dia, no horário de "encerramento" (ex.: "17:00").
// Sem esse campo, considera encerrado às 20h do último dia.
function terminou(evento) {
  const [h, m] = (evento.encerramento || '20:00').split(':').map(Number);
  const fim = new Date(fimDo(evento));
  fim.setHours(h || 0, m || 0, 0, 0);
  return new Date() >= fim;
}

const proximos = (eventos) => eventos.filter((e) => !terminou(e));
const encerrados = (eventos) => eventos.filter((e) => terminou(e)).reverse();

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

// Inscrições: 'abertas', 'encerradas' ou 'em-breve'.
// Com "prazo_inscricoes" preenchido, as inscrições fecham sozinhas no dia seguinte ao prazo.
function estadoInscricoes(evento) {
  if (evento.prazo_inscricoes && lerData(evento.prazo_inscricoes) < hoje()) return 'encerradas';
  if (evento.inscricoes_abertas) return 'abertas';
  return 'em-breve';
}

function situacao(evento) {
  const inicio = lerData(evento.inicio);
  if (terminou(evento)) return { classe: 'encerrado', texto: 'Encerrado' };
  if (inicio <= hoje()) return { classe: 'hoje', texto: 'É hoje' };
  const insc = estadoInscricoes(evento);
  if (insc === 'abertas') return { classe: 'aberto', texto: 'Inscrições abertas' };
  if (insc === 'encerradas') return { classe: 'em-breve', texto: 'Inscrições encerradas' };
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
  // link de inscrição só aparece enquanto as inscrições estão abertas
  const links = linksDoEvento(evento).filter((l) => l.chave !== 'inscricoes' || estadoInscricoes(evento) === 'abertas');
  const linksHtml = links.length
    ? `<ul class="evento__links">${links.map((l) =>
      `<li><a href="${escaparHTML(l.url)}" target="_blank" rel="noopener">${escaparHTML(l.texto)}</a></li>`).join('')}</ul>`
    : `<p class="evento__pendente">${st.classe === 'encerrado' ? 'Resultados serão publicados aqui.'
      : estadoInscricoes(evento) === 'encerradas' ? 'Chaves e cronograma serão divulgados aqui.'
        : 'Edital e inscrições serão divulgados aqui.'}</p>`;

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

// Depois que as inscrições fecham: os documentos do dia, na ordem em que o atleta precisa deles
const DOCUMENTOS_DO_DIA = ['chaves', 'cronograma', 'checagem', 'resultados'];
const TEXTO_BOTAO = { chaves: 'Ver chaves', cronograma: 'Ver cronograma', checagem: 'Ver checagem', resultados: 'Ver resultados' };

function documentosDoDia(evento) {
  const links = evento.links || {};
  // Depois que as chaves saem, a checagem já encerrou: ela some dos botões principais
  // (continua na lista de documentos do campeonato)
  return DOCUMENTOS_DO_DIA.filter((chave) => links[chave] && !(chave === 'checagem' && links.chaves))
    .map((chave) => ({ chave, texto: TEXTO_BOTAO[chave], url: links[chave] }));
}

/* ---------- Adicionar à agenda ---------- */

// Datas no formato da agenda (AAAAMMDD). O fim é o dia seguinte ao último dia,
// porque é assim que as agendas marcam eventos de dia inteiro.
function datasDaAgenda(evento) {
  const formatar = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const depois = new Date(fimDo(evento));
  depois.setDate(depois.getDate() + 1);
  return { inicio: formatar(lerData(evento.inicio)), fim: formatar(depois) };
}

function lugarDaAgenda(evento) {
  return [evento.local, evento.endereco, evento.cidade].filter(Boolean).join(', ');
}

function linkGoogleAgenda(evento, endereco) {
  const d = datasDaAgenda(evento);
  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.nome,
    dates: `${d.inicio}/${d.fim}`,
    location: lugarDaAgenda(evento),
    details: `${evento.etapa ? `${evento.etapa}. ` : ''}Mais informações: ${endereco}`,
  });
  return `https://calendar.google.com/calendar/render?${parametros}`;
}

// Arquivo .ics: abre na agenda do iPhone, do Outlook e de outros aplicativos.
// No site publicado, usa o arquivo agenda/<id>.ics, criado na hora de publicar
// (ferramentas/gerar_paginas.py): o iPhone só aceita um arquivo de verdade.
// No computador (Live Server), esse arquivo não existe, então o próprio navegador monta um.
function linkArquivoAgenda(evento, endereco) {
  const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (!local) return `agenda/${encodeURIComponent(evento.id)}.ics`;
  return arquivoAgendaNoNavegador(evento, endereco);
}

function arquivoAgendaNoNavegador(evento, endereco) {
  const d = datasDaAgenda(evento);
  const texto = (t) => String(t).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FJJCE//Site//PT-BR',
    'BEGIN:VEVENT',
    `UID:${evento.id}@fjjce`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${d.inicio}`,
    `DTEND;VALUE=DATE:${d.fim}`,
    `SUMMARY:${texto(evento.nome)}`,
    `LOCATION:${texto(lugarDaAgenda(evento))}`,
    `DESCRIPTION:${texto(`${evento.etapa ? `${evento.etapa}. ` : ''}Mais informações: ${endereco}`)}`,
    `URL:${endereco}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(linhas.join('\r\n'))}`;
}

function botoesAgenda(evento, endereco) {
  return `
    <div class="agenda">
      <span>Adicionar à agenda:</span>
      <a class="botao botao--contorno-escuro botao--pequeno" href="${escaparHTML(linkGoogleAgenda(evento, endereco))}" target="_blank" rel="noopener">Google Agenda</a>
      <a class="botao botao--contorno-escuro botao--pequeno" href="${escaparHTML(linkArquivoAgenda(evento, endereco))}"${linkArquivoAgenda(evento, endereco).startsWith('data:') ? ` download="${escaparHTML(evento.id)}.ics"` : ''}>iPhone e outros</a>
    </div>`;
}
