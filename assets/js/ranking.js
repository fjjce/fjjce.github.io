/*
 * ranking.js
 * Página ranking.html: filtros por sexo, idade, faixa e peso, busca e ranking por equipes.
 * Os filtros ficam no endereço da página (ex.: ranking.html?sexo=feminino&faixa=azul),
 * então dá para copiar o link e mandar no WhatsApp já com a categoria escolhida.
 */

let todos = [];
const formulario = document.querySelector('[data-filtros]');
const campos = {
  sexo: document.getElementById('f-sexo'),
  idade: document.getElementById('f-idade'),
  faixa: document.getElementById('f-faixa'),
  peso: document.getElementById('f-peso'),
  busca: document.getElementById('f-busca'),
};

/* ---------- montar opções dos filtros ---------- */

function preencherSelect(select, opcoes, primeira) {
  const atual = select.value;
  select.innerHTML = (primeira ? `<option value="">${primeira}</option>` : '') +
    opcoes.map((o) => `<option value="${slug(o)}">${escaparHTML(o)}</option>`).join('');
  if ([...select.options].some((o) => o.value === atual)) select.value = atual;
}

// Só mostra as faixas e pesos que existem para o sexo e a idade escolhidos
function atualizarOpcoes() {
  const base = todos.filter((a) => slug(a.sexo) === campos.sexo.value && slug(a.idade) === campos.idade.value);
  const faixas = RANKING.faixas.filter((f) => base.some((a) => a.faixa === f));
  preencherSelect(campos.faixa, faixas);
  const daFaixa = base.filter((a) => slug(a.faixa) === campos.faixa.value);
  const pesos = RANKING.pesos.filter((p) => daFaixa.some((a) => a.peso === p));
  preencherSelect(campos.peso, pesos, 'Todos');
}

/* ---------- tabelas ---------- */

function tabela({ titulo, faixa, linhas, colunaExtra, rotuloPos = 'Pos.', rotuloNome = 'Atleta' }) {
  const corpo = linhas.length
    ? linhas.map((a) => `
        <tr>
          <th scope="row" class="ranking__pos">${a.posicao}</th>
          <td>
            <span class="ranking__nome">${escaparHTML(a.atleta)}</span>
            <span class="ranking__equipe">${escaparHTML(colunaExtra ? colunaExtra(a) : [a.equipe, medalhas(a)].filter(Boolean).join('. '))}</span>
          </td>
          <td class="ranking__pontos">${formatarPontos(a.pontos)}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" class="ranking__vazio">Nenhum atleta pontuou nesta categoria ainda.</td></tr>';

  return `
    <div class="ranking__tabela">
      <table>
        <caption>
          <span class="ranking__titulo">
            ${faixa ? `<span class="faixa-cor faixa-cor--${slug(faixa)}" aria-hidden="true"></span>` : ''}
            ${escaparHTML(titulo)}
          </span>
        </caption>
        <thead><tr><th scope="col">${rotuloPos}</th><th scope="col">${rotuloNome}</th><th scope="col">Pontos</th></tr></thead>
        <tbody>${corpo}</tbody>
      </table>
    </div>`;
}

function mostrar() {
  const resultado = document.querySelector('[data-resultado]');
  const resumo = document.querySelector('[data-resumo]');
  const busca = campos.busca.value.trim();

  // Busca: procura em todas as categorias
  if (busca.length >= 2) {
    const termo = slug(busca);
    const achados = todos.filter((a) => slug(a.atleta).includes(termo) || slug(a.equipe).includes(termo));
    // posição de cada atleta dentro da própria categoria
    const comPosicao = achados.map((a) => {
      const categoria = classificar(todos.filter((b) =>
        b.sexo === a.sexo && b.idade === a.idade && b.faixa === a.faixa && b.peso === a.peso));
      return categoria.find((b) => b.atleta === a.atleta);
    }).sort((x, y) => x.posicao - y.posicao || y.pontos - x.pontos);

    resumo.innerHTML = `${achados.length} resultado${achados.length === 1 ? '' : 's'} para "${escaparHTML(busca)}" em todas as categorias. <button type="button" class="link-botao" data-limpar>Limpar busca</button>`;
    resultado.classList.add('ranking--uma-coluna');
    resultado.innerHTML = achados.length
      ? tabela({
        titulo: 'Resultado da busca',
        rotuloPos: 'Pos. na categoria',
        rotuloNome: 'Atleta e categoria',
        linhas: comPosicao,
        colunaExtra: (a) => `${a.equipe}. ${a.sexo} ${a.idade.toLowerCase()}, faixa ${a.faixa.toLowerCase()}, ${a.peso.toLowerCase()}. ${medalhas(a)}`,
      })
      : '<p class="ranking__vazio">Nenhum atleta ou equipe encontrado. Confira a grafia ou busque só pelo sobrenome.</p>';
    salvarNoEndereco();
    return;
  }

  // Filtros: uma tabela por categoria de peso
  resultado.classList.remove('ranking--uma-coluna');
  const filtrados = todos.filter((a) =>
    slug(a.sexo) === campos.sexo.value &&
    slug(a.idade) === campos.idade.value &&
    slug(a.faixa) === campos.faixa.value &&
    (!campos.peso.value || slug(a.peso) === campos.peso.value));

  const pesos = RANKING.pesos.filter((p) => filtrados.some((a) => a.peso === p));
  const nomeFaixa = campos.faixa.selectedOptions[0]?.textContent || '';
  const descricao = `${campos.sexo.selectedOptions[0].textContent} ${campos.idade.selectedOptions[0].textContent.toLowerCase()}, faixa ${nomeFaixa.toLowerCase()}`;

  resumo.textContent = `${descricao}: ${filtrados.length} atleta${filtrados.length === 1 ? '' : 's'} com pontos.`;
  resultado.innerHTML = pesos.length
    ? pesos.map((p) => tabela({
      titulo: p,
      faixa: nomeFaixa,
      linhas: classificar(filtrados.filter((a) => a.peso === p)),
    })).join('')
    : '<p class="ranking__vazio">Nenhum atleta pontuou nesta categoria ainda.</p>';
  salvarNoEndereco();
}

function mostrarEquipes() {
  const area = document.querySelector('[data-equipes]');
  area.innerHTML = tabela({
    titulo: 'Ranking por equipes',
    rotuloNome: 'Equipe',
    linhas: rankingEquipes(todos),
    colunaExtra: (e) => `${e.atletas} atleta${e.atletas === 1 ? '' : 's'} no pódio. ${medalhas(e)}`,
  });
}

/* ---------- endereço da página (link compartilhável) ---------- */

function salvarNoEndereco() {
  const p = new URLSearchParams();
  ['sexo', 'idade', 'faixa', 'peso', 'busca'].forEach((c) => {
    if (campos[c].value.trim()) p.set(c, campos[c].value.trim());
  });
  if (document.getElementById('aba-equipes').getAttribute('aria-selected') === 'true') p.set('ver', 'equipes');
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

function lerDoEndereco() {
  const p = new URLSearchParams(location.search);
  ['sexo', 'idade'].forEach((c) => {
    if (p.get(c) && [...campos[c].options].some((o) => o.value === p.get(c))) campos[c].value = p.get(c);
  });
  atualizarOpcoes();
  if (p.get('faixa') && [...campos.faixa.options].some((o) => o.value === p.get('faixa'))) campos.faixa.value = p.get('faixa');
  atualizarOpcoes();
  if (p.get('peso') && [...campos.peso.options].some((o) => o.value === p.get('peso'))) campos.peso.value = p.get('peso');
  if (p.get('busca')) campos.busca.value = p.get('busca');
  if (p.get('ver') === 'equipes') trocarAba('equipes', false);
}

/* ---------- abas ---------- */

function trocarAba(nome, focar = true) {
  ['atletas', 'equipes'].forEach((n) => {
    const aba = document.getElementById(`aba-${n}`);
    const ativa = n === nome;
    aba.setAttribute('aria-selected', String(ativa));
    aba.tabIndex = ativa ? 0 : -1;
    document.getElementById(`painel-${n}`).hidden = !ativa;
    if (ativa && focar) aba.focus();
  });
  salvarNoEndereco();
}

document.querySelectorAll('.abas__botao').forEach((botao) => {
  botao.addEventListener('click', () => trocarAba(botao.id.replace('aba-', '')));
  botao.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      trocarAba(botao.id === 'aba-atletas' ? 'equipes' : 'atletas');
    }
  });
});

/* ---------- eventos ---------- */

formulario.addEventListener('submit', (e) => e.preventDefault());
formulario.addEventListener('change', (e) => {
  if (e.target === campos.sexo || e.target === campos.idade || e.target === campos.faixa) atualizarOpcoes();
  mostrar();
});
let espera;
campos.busca.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(mostrar, 200);
});
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-limpar]')) {
    campos.busca.value = '';
    mostrar();
    campos.busca.focus();
  }
});

/* ---------- início ---------- */

async function iniciar() {
  try {
    const { info, atletas } = await carregarRanking();
    document.querySelectorAll('[data-temporada]').forEach((el) => { el.textContent = info.temporada; });

    // Ranking ainda não publicado: mostra o aviso e para por aqui
    if (info.publicado === false || !atletas.length) {
      document.querySelector('[data-conteudo-ranking]').hidden = true;
      document.querySelector('[data-em-breve]').hidden = false;
      return;
    }
    todos = atletas;
    document.querySelector('[data-aviso]').innerHTML = avisoDemonstracao(info);
    document.querySelectorAll('[data-temporada]').forEach((el) => { el.textContent = info.temporada; });
    if (info.atualizado_em) {
      document.querySelector('[data-atualizado]').textContent =
        `Pontos somados nos pódios dos campeonatos da temporada. Atualizado em ${dataPorExtenso(info.atualizado_em)}.`;
    }
    preencherSelect(campos.sexo, RANKING.sexos);
    preencherSelect(campos.idade, RANKING.idades.filter((i) => todos.some((a) => a.idade === i)));
    campos.idade.value = 'adulto';
    atualizarOpcoes();
    campos.faixa.value = 'preta';
    atualizarOpcoes();
    lerDoEndereco();
    mostrar();
    mostrarEquipes();
  } catch (erro) {
    console.error(erro);
    document.querySelector('[data-resultado]').innerHTML =
      '<p class="ranking__vazio">Não foi possível carregar o ranking. Abra o site por um servidor (ex.: Live Server).</p>';
  }
}

iniciar();
