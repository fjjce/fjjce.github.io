/*
 * ranking-dados.js
 * Monta o ranking a partir dos pódios de cada campeonato.
 * Usado pela página inicial, por ranking.html e por evento.html
 * (precisa de util.js carregado antes).
 *
 * De onde vêm os dados:
 *   dados/ranking-info.json  -> temporada, tabela de pontos e quais campeonatos contam
 *   dados/resultados.csv     -> uma linha por atleta no pódio:
 *       evento, sexo, idade, faixa, peso, colocacao, atleta, equipe
 *
 * O site soma sozinho os pontos de cada atleta (por categoria) e de cada equipe.
 */

const RANKING = {
  sexos: ['Masculino', 'Feminino'],
  idades: ['Juvenil', 'Adulto', 'Master 1', 'Master 2', 'Master 3', 'Master 4'],
  faixas: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  pesos: ['Galo', 'Pluma', 'Pena', 'Leve', 'Médio', 'Meio-pesado', 'Pesado', 'Super-pesado', 'Pesadíssimo', 'Absoluto'],
};

const PONTUACAO_PADRAO = { 1: 9, 2: 3, 3: 1 };

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

  const cabecalho = linhas.shift().map((c) => slug(c.replace(/^﻿/, ''))); // tira a marca invisível que o Excel coloca
  return linhas.map((valores) => Object.fromEntries(cabecalho.map((c, i) => [c, (valores[i] || '').trim()])));
}

// Lê os pódios (resultados.csv) e devolve uma linha por atleta no pódio
async function carregarResultados(info) {
  const resposta = await fetch(info.fonte || 'dados/resultados.csv', { cache: 'no-cache' });
  if (!resposta.ok) throw new Error(`Resultados: ${resposta.status}`);
  return lerCSV(await resposta.text())
    .map((l) => ({
      evento: l.evento,
      sexo: l.sexo,
      idade: l.idade,
      faixa: l.faixa,
      peso: l.peso,
      colocacao: parseInt(l.colocacao, 10),
      atleta: l.atleta,
      equipe: l.equipe,
    }))
    .filter((r) => r.atleta && r.colocacao >= 1);
}

// Soma os pontos: um registro por atleta em cada categoria
function somarPontos(resultados, info) {
  const tabela = info.pontuacao || PONTUACAO_PADRAO;
  const etapas = info.etapas && info.etapas.length ? new Set(info.etapas) : null;
  const atletas = new Map();

  resultados
    .filter((r) => !etapas || etapas.has(r.evento))
    .forEach((r) => {
      const chave = [r.sexo, r.idade, r.faixa, r.peso, slug(r.atleta)].join('|');
      const a = atletas.get(chave) || {
        sexo: r.sexo, idade: r.idade, faixa: r.faixa, peso: r.peso,
        atleta: r.atleta, equipe: r.equipe, pontos: 0, ouro: 0, prata: 0, bronze: 0,
      };
      a.pontos += Number(tabela[r.colocacao]) || 0;
      if (r.colocacao === 1) a.ouro += 1;
      if (r.colocacao === 2) a.prata += 1;
      if (r.colocacao === 3) a.bronze += 1;
      a.equipe = r.equipe; // vale a equipe do resultado mais recente
      atletas.set(chave, a);
    });
  return [...atletas.values()];
}

// Carrega tudo e devolve { info, atletas, resultados }
async function carregarRanking() {
  const info = await (await fetch('dados/ranking-info.json', { cache: 'no-cache' })).json();
  const resultados = await carregarResultados(info);
  return { info, atletas: somarPontos(resultados, info), resultados };
}

// Ordena por pontos e calcula a posição; empatados ficam na mesma posição (1, 1, 3...).
// Desempate: mais ouros, depois mais pratas, depois mais bronzes.
function classificar(lista) {
  const ordem = (a, b) => b.pontos - a.pontos
    || (b.ouro || 0) - (a.ouro || 0) || (b.prata || 0) - (a.prata || 0) || (b.bronze || 0) - (a.bronze || 0);
  const ordenada = [...lista].sort((a, b) => ordem(a, b) || a.atleta.localeCompare(b.atleta, 'pt-BR'));
  let posicao = 0;
  return ordenada.map((item, i) => {
    if (i === 0 || ordem(item, ordenada[i - 1]) !== 0) posicao = i + 1;
    return { ...item, posicao };
  });
}

// Soma os pontos e medalhas de cada equipe
function rankingEquipes(atletas) {
  const totais = new Map();
  atletas.forEach((a) => {
    const t = totais.get(a.equipe) || { atleta: a.equipe, equipe: a.equipe, pontos: 0, atletas: 0, ouro: 0, prata: 0, bronze: 0 };
    t.pontos += a.pontos;
    t.atletas += 1;
    t.ouro += a.ouro || 0;
    t.prata += a.prata || 0;
    t.bronze += a.bronze || 0;
    totais.set(a.equipe, t);
  });
  return classificar([...totais.values()]);
}

// "2 ouros, 1 prata"
function medalhas(item) {
  const partes = [];
  if (item.ouro) partes.push(`${item.ouro} ouro${item.ouro > 1 ? 's' : ''}`);
  if (item.prata) partes.push(`${item.prata} prata${item.prata > 1 ? 's' : ''}`);
  if (item.bronze) partes.push(`${item.bronze} bronze${item.bronze > 1 ? 's' : ''}`);
  return partes.join(', ');
}

function formatarPontos(n) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

// Aviso mostrado enquanto o ranking tiver dados de demonstração
function avisoDemonstracao(info) {
  return info.exemplo
    ? '<p class="aviso-demo" role="note"><strong>Ranking de demonstração.</strong> Nomes e equipes fictícios, só para mostrar como o ranking vai funcionar.</p>'
    : '';
}
