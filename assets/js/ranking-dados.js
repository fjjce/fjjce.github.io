/*
 * ranking-dados.js
 * Lê o ranking (planilha CSV) e oferece funções usadas pela página inicial
 * (precisa de util.js carregado antes)
 * e pela página ranking.html.
 *
 * De onde vêm os dados: dados/ranking-info.json, campo "fonte".
 *   - Arquivo local: "dados/ranking.csv"
 *   - Planilha do Google: Arquivo > Compartilhar > Publicar na Web >
 *     escolha a aba e o formato "Valores separados por vírgula (.csv)" e cole o link.
 *
 * Colunas da planilha (primeira linha, nesta ordem ou em qualquer ordem):
 *   sexo, idade, faixa, peso, atleta, equipe, pontos
 */

const RANKING = {
  sexos: ['Masculino', 'Feminino'],
  idades: ['Juvenil', 'Adulto', 'Master 1'],
  faixas: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  pesos: ['Galo', 'Pluma', 'Pena', 'Leve', 'Médio', 'Meio-pesado', 'Pesado', 'Super-pesado', 'Pesadíssimo'],
};

// Leitor de CSV simples que aceita aspas ("Silva, João") e vírgula ou ponto e vírgula
function lerCSV(texto) {
  const separador = texto.split('\n')[0].includes(';') ? ';' : ',';
  const linhas = [];
  let campo = '';
  let linha = [];
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreAspas = false;
      else campo += c;
    } else if (c === '"') entreAspas = true;
    else if (c === separador) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((v) => v.trim() !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((v) => v.trim() !== '')) linhas.push(linha);

  const cabecalho = linhas.shift().map((c) => slug(c));
  return linhas.map((valores) => Object.fromEntries(cabecalho.map((c, i) => [c, (valores[i] || '').trim()])));
}

// Carrega info + planilha e devolve { info, atletas }
async function carregarRanking() {
  const info = await (await fetch('dados/ranking-info.json')).json();
  const resposta = await fetch(info.fonte);
  if (!resposta.ok) throw new Error(`Ranking: ${resposta.status}`);
  const atletas = lerCSV(await resposta.text()).map((l) => ({
    sexo: l.sexo,
    idade: l.idade,
    faixa: l.faixa,
    peso: l.peso,
    atleta: l.atleta,
    equipe: l.equipe,
    // aceita "372,5" ou "372.5"
    pontos: Number(String(l.pontos).replace(',', '.')) || 0,
  }));
  return { info, atletas };
}

// Ordena por pontos e calcula a posição; empatados ficam na mesma posição (1, 1, 3...)
function classificar(lista) {
  const ordenada = [...lista].sort((a, b) => b.pontos - a.pontos || a.atleta.localeCompare(b.atleta, 'pt-BR'));
  let posicao = 0;
  return ordenada.map((item, i) => {
    if (i === 0 || item.pontos !== ordenada[i - 1].pontos) posicao = i + 1;
    return { ...item, posicao };
  });
}

// Soma os pontos de cada equipe
function rankingEquipes(atletas) {
  const totais = new Map();
  atletas.forEach((a) => {
    const t = totais.get(a.equipe) || { atleta: a.equipe, equipe: a.equipe, pontos: 0, atletas: 0 };
    t.pontos += a.pontos;
    t.atletas += 1;
    totais.set(a.equipe, t);
  });
  return classificar([...totais.values()]);
}

function formatarPontos(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
