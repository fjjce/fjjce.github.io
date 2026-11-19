/*
 * inicio.js
 * Monta a página inicial a partir dos arquivos da pasta dados/:
 *   dados/eventos.json   -> destaque do próximo campeonato e calendário
 *   dados/ranking.json   -> prévia do ranking
 *   dados/noticias.json  -> últimas notícias
 * Para atualizar o site, edite os arquivos .json. Não é preciso mexer aqui.
 */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const NOMES_LINKS = {
  inscricoes: 'Inscrições',
  edital: 'Edital',
  checagem: 'Checagem',
  cronograma: 'Cronograma',
  chaves: 'Chaves',
  resultados: 'Resultados',
};

/* ---------- utilidades ---------- */

// Lê "2027-03-06" como data local (evita erro de fuso horário)
function lerData(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d);
}

// "6 e 7 de março de 2027", "11 a 13 de junho de 2027", "9 de maio de 2027"
function formatarPeriodo(inicio, fim) {
  const i = lerData(inicio);
  const f = lerData(fim || inicio);
  const ano = f.getFullYear();
  if (i.getTime() === f.getTime()) return `${i.getDate()} de ${MESES[i.getMonth()]} de ${ano}`;
  if (i.getMonth() === f.getMonth()) {
    const diferenca = Math.round((f - i) / 86400000);
    const ligacao = diferenca === 1 ? 'e' : 'a';
    return `${i.getDate()} ${ligacao} ${f.getDate()} de ${MESES[f.getMonth()]} de ${ano}`;
  }
  return `${i.getDate()} de ${MESES[i.getMonth()]} a ${f.getDate()} de ${MESES[f.getMonth()]} de ${ano}`;
}

function formatarDataCurta(texto) {
  const d = lerData(texto);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// Evita que texto dos arquivos .json vire HTML
function escapar(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function carregar(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`${caminho}: ${resposta.status}`);
  return resposta.json();
}

function hoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function situacao(evento) {
  if (lerData(evento.fim || evento.inicio) < hoje()) return { classe: 'encerrado', texto: 'Encerrado' };
  if (evento.inscricoes_abertas) return { classe: 'aberto', texto: 'Inscrições abertas' };
  return { classe: 'em-breve', texto: 'Em breve' };
}

function linksDoEvento(evento) {
  return Object.entries(evento.links || {})
    .filter(([, url]) => url)
    .map(([chave, url]) => ({ chave, texto: NOMES_LINKS[chave] || chave, url }));
}

/* ---------- destaque e calendário ---------- */

function montarDestaque(evento) {
  const campo = (nome) => document.querySelector(`[data-destaque="${nome}"]`);
  campo('nome').textContent = evento.nome;
  campo('etapa').textContent = evento.etapa || '';
  campo('data').textContent = formatarPeriodo(evento.inicio, evento.fim);
  campo('local').textContent = `${evento.local}, ${evento.cidade}`;

  const links = linksDoEvento(evento);
  const inscricao = links.find((l) => l.chave === 'inscricoes');
  const edital = links.find((l) => l.chave === 'edital');
  const acoes = [];
  if (evento.inscricoes_abertas && inscricao) {
    acoes.push(`<a class="botao botao--ouro" href="${escapar(inscricao.url)}" target="_blank" rel="noopener">Inscrever-se no iLutas</a>`);
  } else {
    acoes.push('<span class="destaque__aviso">Inscrições em breve</span>');
  }
  if (edital) {
    acoes.push(`<a class="botao botao--claro" href="${escapar(edital.url)}" target="_blank" rel="noopener">Ler o edital</a>`);
  }
  acoes.push('<a class="botao botao--claro" href="#calendario">Ver calendário</a>');
  campo('acoes').innerHTML = acoes.join('');

  if (evento.imagem) {
    const figura = campo('cartaz');
    const img = figura.querySelector('img');
    img.src = evento.imagem;
    img.alt = `Cartaz do ${evento.nome}`;
    figura.hidden = false;
  }
}

function montarCalendario(eventos) {
  const lista = document.querySelector('[data-lista="eventos"]');
  lista.innerHTML = eventos.map((evento) => {
    const i = lerData(evento.inicio);
    const f = lerData(evento.fim || evento.inicio);
    const dias = i.getTime() === f.getTime() ? `${i.getDate()}` : `${i.getDate()}–${f.getDate()}`;
    const st = situacao(evento);
    const links = linksDoEvento(evento);
    const linksHtml = links.length
      ? `<ul class="evento__links">${links.map((l) => `<li><a href="${escapar(l.url)}" target="_blank" rel="noopener">${escapar(l.texto)}</a></li>`).join('')}</ul>`
      : '<p class="evento__pendente">Edital e inscrições serão divulgados aqui.</p>';

    return `
      <li class="evento evento--${st.classe}">
        <time class="evento__data" datetime="${escapar(evento.inicio)}">
          <span class="evento__dias">${dias}</span>
          <span class="evento__mes">${MESES_CURTOS[i.getMonth()]}</span>
        </time>
        <div class="evento__corpo">
          <h3 class="evento__nome">${escapar(evento.nome)}</h3>
          <p class="evento__meta">${evento.etapa ? `${escapar(evento.etapa)}. ` : ''}${escapar(evento.local)}, ${escapar(evento.cidade)}</p>
          ${linksHtml}
        </div>
        <span class="selo selo--${st.classe}">${st.texto}</span>
      </li>`;
  }).join('');
}

/* ---------- ranking ---------- */

function montarRanking(dados) {
  document.querySelector('[data-temporada-ranking]').textContent = dados.temporada;
  if (dados.atualizado_em) {
    document.querySelector('[data-ranking-atualizado]').textContent =
      `Pontuação acumulada nas etapas do Campeonato Cearense. Atualizado em ${formatarDataCurta(dados.atualizado_em)}.`;
  }
  const area = document.querySelector('[data-lista="ranking"]');
  area.innerHTML = dados.categorias.map((cat) => `
    <div class="ranking__tabela">
      <table>
        <caption>
          <span class="ranking__titulo">
            <span class="faixa-cor faixa-cor--${escapar(cat.faixa)}" aria-hidden="true"></span>
            ${escapar(cat.titulo)}, faixa ${escapar(cat.faixa)}
          </span>
        </caption>
        <thead>
          <tr><th scope="col">Pos.</th><th scope="col">Atleta</th><th scope="col">Pontos</th></tr>
        </thead>
        <tbody>
          ${cat.atletas.slice(0, 5).map((a, n) => `
            <tr>
              <th scope="row" class="ranking__pos">${n + 1}</th>
              <td>
                <span class="ranking__nome">${escapar(a.nome)}</span>
                <span class="ranking__equipe">${escapar(a.equipe)}</span>
              </td>
              <td class="ranking__pontos">${a.pontos.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');
}

/* ---------- notícias ---------- */

function montarNoticias(dados) {
  const area = document.querySelector('[data-lista="noticias"]');
  area.innerHTML = dados.noticias.slice(0, 3).map((n, i) => `
    <article class="noticia${i === 0 ? ' noticia--principal' : ''}">
      <img src="${escapar(n.imagem)}" alt="" loading="lazy" width="327" height="184">
      <div class="noticia__texto">
        <time datetime="${escapar(n.data)}">${formatarDataCurta(n.data)}</time>
        <h3><a href="${escapar(n.link)}">${escapar(n.titulo)}</a></h3>
        <p>${escapar(n.resumo)}</p>
      </div>
    </article>`).join('');
}

/* ---------- início ---------- */

async function iniciar() {
  try {
    const dados = await carregar('dados/eventos.json');
    const eventos = [...dados.eventos].sort((a, b) => lerData(a.inicio) - lerData(b.inicio));
    document.querySelectorAll('[data-temporada]').forEach((el) => { el.textContent = dados.temporada; });
    montarCalendario(eventos);
    const proximo = eventos.find((e) => lerData(e.fim || e.inicio) >= hoje());
    if (proximo) montarDestaque(proximo);
  } catch (erro) {
    console.error(erro);
    document.querySelector('[data-lista="eventos"]').innerHTML =
      '<li class="carregando">Não foi possível carregar o calendário. Abra o site por um servidor (ex.: Live Server).</li>';
  }

  try { montarRanking(await carregar('dados/ranking.json')); } catch (erro) { console.error(erro); }
  try { montarNoticias(await carregar('dados/noticias.json')); } catch (erro) { console.error(erro); }
}

iniciar();
