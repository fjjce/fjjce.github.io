/*
 * noticias-dados.js
 * Lê dados/noticias.json (lista) e os textos em noticias/<id>.md.
 * Também transforma o texto "markdown" em HTML. Formatos aceitos:
 *   linha em branco      -> novo parágrafo
 *   ## Subtítulo         -> subtítulo
 *   **negrito**  *itálico*
 *   [texto](link)        -> link
 *   ![descrição](imagem) -> imagem (sozinha na linha)
 *   - item               -> lista
 *   > citação            -> citação
 * (precisa de util.js carregado antes)
 */

async function carregarNoticias() {
  const resposta = await fetch('dados/noticias.json');
  if (!resposta.ok) throw new Error(`noticias.json: ${resposta.status}`);
  const dados = await resposta.json();
  return [...dados.noticias].sort((a, b) => lerData(b.data) - lerData(a.data));
}

async function carregarTexto(id) {
  const resposta = await fetch(`noticias/${encodeURIComponent(id)}.md`);
  if (!resposta.ok) throw new Error(`noticias/${id}.md: ${resposta.status}`);
  return resposta.text();
}

function linkDaNoticia(noticia) {
  return `noticia.html?id=${encodeURIComponent(noticia.id)}`;
}

// Aceita só links seguros: http(s), e-mail, telefone, âncoras e caminhos do próprio site
function urlSegura(url) {
  const limpo = url.trim();
  if (/^(https?:|mailto:|tel:|#)/i.test(limpo)) return limpo;
  if (/^[a-z]+:/i.test(limpo)) return '#'; // bloqueia javascript: e outros
  return limpo;
}

// Negrito, itálico e links dentro de uma linha (o texto já vem escapado)
function formatarLinha(texto) {
  return texto
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, rotulo, url) => {
      const destino = urlSegura(url.replace(/&amp;/g, '&'));
      const externo = /^https?:/i.test(destino);
      return `<a href="${escaparHTML(destino)}"${externo ? ' target="_blank" rel="noopener"' : ''}>${rotulo}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function markdownParaHTML(md) {
  const linhas = md.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragrafo = [];
  let lista = null; // 'ul' ou 'ol'
  let citacao = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) html.push(`<p>${formatarLinha(paragrafo.join(' '))}</p>`);
    paragrafo = [];
  };
  const fecharLista = () => {
    if (lista) html.push(`</${lista}>`);
    lista = null;
  };
  const fecharCitacao = () => {
    if (citacao.length) html.push(`<blockquote><p>${formatarLinha(citacao.join(' '))}</p></blockquote>`);
    citacao = [];
  };
  const fecharTudo = () => { fecharParagrafo(); fecharLista(); fecharCitacao(); };

  linhas.forEach((original) => {
    const linha = escaparHTML(original.trim());
    let m;

    if (!linha) { fecharTudo(); return; }

    if ((m = linha.match(/^(#{2,3})\s+(.*)$/))) {
      fecharTudo();
      const nivel = m[1].length; // ## -> h2, ### -> h3
      html.push(`<h${nivel} id="${slug(original.trim().replace(/^#+\s+/, ''))}">${formatarLinha(m[2])}</h${nivel}>`);
    } else if ((m = linha.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      fecharTudo();
      html.push(`<figure><img src="${escaparHTML(urlSegura(m[2]))}" alt="${m[1]}" loading="lazy">${m[1] ? `<figcaption>${m[1]}</figcaption>` : ''}</figure>`);
    } else if ((m = linha.match(/^[-*]\s+(.*)$/)) || (m = linha.match(/^\d+[.)]\s+(.*)$/))) {
      fecharParagrafo(); fecharCitacao();
      const tipo = /^\d/.test(linha) ? 'ol' : 'ul';
      if (lista !== tipo) { fecharLista(); html.push(`<${tipo}>`); lista = tipo; }
      html.push(`<li>${formatarLinha(m[1])}</li>`);
    } else if ((m = linha.match(/^&gt;\s?(.*)$/))) {
      fecharParagrafo(); fecharLista();
      citacao.push(m[1]);
    } else {
      fecharLista(); fecharCitacao();
      paragrafo.push(linha);
    }
  });
  fecharTudo();
  return html.join('\n');
}

// Cartão usado na lista de notícias (noticias.html)
// destaque = true na primeira notícia da página: a imagem carrega na hora, sem esperar
function cartaoDeNoticia(n, destaque = false) {
  return `
    <article class="noticia-cartao">
      <a class="noticia-cartao__imagem" href="${linkDaNoticia(n)}" tabindex="-1" aria-hidden="true">
        ${n.imagem
    ? `<img src="${escaparHTML(n.imagem)}" alt="" ${destaque === true ? 'fetchpriority="high"' : 'loading="lazy"'} width="640" height="360">`
    : '<span class="noticia-cartao__sem-imagem"><img src="assets/img/logo-fjjce-96.png" alt="" width="72" height="70"></span>'}
      </a>
      <time datetime="${escaparHTML(n.data)}">${dataPorExtenso(n.data)}</time>
      <h2><a href="${linkDaNoticia(n)}">${escaparHTML(n.titulo)}</a></h2>
      <p>${escaparHTML(n.resumo || '')}</p>
    </article>`;
}
