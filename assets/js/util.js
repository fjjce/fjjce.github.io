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

// Links para outros sites abrem em nova aba; links do próprio site, na mesma aba
function alvoDoLink(url = '') {
  return /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '';
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

// Endereço para compartilhar um campeonato ou notícia.
// No site publicado, usa a página de prévia (compartilhar/...), que mostra título e imagem
// no WhatsApp. No computador (Live Server), essas páginas não existem, então usa o endereço atual.
function enderecoParaCompartilhar(tipo, id) {
  const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (local) return location.href;
  return new URL(`compartilhar/${tipo}-${encodeURIComponent(id)}.html`, location.href).href;
}

// Bloco com os botões "WhatsApp" e "Copiar link"
function botoesCompartilhar(titulo, endereco) {
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${titulo} ${endereco}`)}`;
  return `
    <div class="compartilhar">
      <span>Compartilhar:</span>
      <a class="botao botao--contorno-escuro botao--pequeno" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
      <button class="botao botao--contorno-escuro botao--pequeno" type="button" data-copiar="${escaparHTML(endereco)}">Copiar link</button>
      <span class="compartilhar__aviso" role="status" aria-live="polite"></span>
    </div>`;
}

// Faz os botões "Copiar link" funcionarem em qualquer página
document.addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-copiar]');
  if (!botao) return;
  const aviso = botao.parentElement.querySelector('.compartilhar__aviso');
  try {
    await navigator.clipboard.writeText(botao.dataset.copiar);
    if (aviso) aviso.textContent = 'Link copiado.';
  } catch {
    if (aviso) aviso.textContent = 'Não foi possível copiar. Copie o endereço da barra do navegador.';
  }
});
