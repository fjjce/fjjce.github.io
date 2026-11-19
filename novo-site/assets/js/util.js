/*
 * util.js
 * Funções pequenas usadas em várias páginas (datas, textos, segurança).
 * Precisa ser carregado antes dos outros scripts da página.
 */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Evita que texto vindo dos arquivos de dados vire HTML
function escaparHTML(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// "Meio-pesado" -> "meio-pesado", "Médio" -> "medio" (para links, filtros e classes)
function slug(texto = '') {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-');
}

// Lê "2026-11-22" como data local (evita erro de fuso horário)
function lerData(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function hoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// "2026-11-22" -> "22 de novembro de 2026"
function dataPorExtenso(texto) {
  const d = lerData(texto);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}
