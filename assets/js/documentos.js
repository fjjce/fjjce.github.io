/*
 * documentos.js
 * Página documentos.html. Junta dois tipos de documento:
 *   1. os fixos, de dados/documentos.json (regras, tabela de peso, estatuto...)
 *   2. os editais dos campeonatos, que vêm sozinhos de dados/eventos.json
 * O tamanho de cada PDF é descoberto automaticamente.
 */

// Pergunta ao servidor o tamanho do arquivo sem baixá-lo
async function tamanhoDoArquivo(url) {
  try {
    const resposta = await fetch(url, { method: 'HEAD' });
    const bytes = Number(resposta.headers.get('content-length'));
    if (!resposta.ok || !bytes) return '';
    return bytes >= 1048576
      ? `${(bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  } catch {
    return '';
  }
}

function itemDocumento(doc) {
  const externo = /^https?:/i.test(doc.arquivo);
  const pdf = /\.pdf($|\?)/i.test(doc.arquivo);
  const ilutas = /ilutas\.com\.br/i.test(doc.arquivo);
  const formato = ilutas ? 'Página no iLutas' : externo ? 'Link externo' : (doc.arquivo.split('.').pop() || '').toUpperCase();
  const icone = pdf ? 'PDF' : 'Link';
  return `
    <li>
      <a class="documento documento--grande" href="${escaparHTML(doc.arquivo)}" target="_blank" rel="noopener">
        ${doc.capa ? `<img src="${escaparHTML(doc.capa)}" alt="" width="96" height="96" loading="lazy">` : `<span class="documento__icone" aria-hidden="true">${icone}</span>`}
        <span class="documento__texto">
          <span class="documento__titulo">${escaparHTML(doc.titulo)}</span>
          ${doc.descricao ? `<span class="documento__descricao">${escaparHTML(doc.descricao)}</span>` : ''}
          <span class="documento__detalhe" data-tamanho="${externo ? '' : escaparHTML(doc.arquivo)}">${[formato, doc.ano].filter(Boolean).join(', ')}</span>
        </span>
      </a>
    </li>`;
}

function grupoHTML(grupo, cinza) {
  return `
    <section class="secao ${cinza ? 'secao--cinza' : 'secao--compacta'}">
      <div class="container">
        <div class="secao__cabeca">
          <h2>${escaparHTML(grupo.titulo)}</h2>
          ${grupo.descricao ? `<p>${escaparHTML(grupo.descricao)}</p>` : ''}
        </div>
        ${grupo.documentos.length
    ? `<ul class="documentos">${grupo.documentos.map(itemDocumento).join('')}</ul>`
    : `<p class="carregando">${escaparHTML(grupo.vazio || 'Nenhum documento publicado ainda.')}</p>`}
      </div>
    </section>`;
}

async function iniciar() {
  const area = document.querySelector('[data-lista="documentos"]');
  try {
    const dados = await (await fetch('dados/documentos.json')).json();
    const grupos = [...dados.grupos];

    // Editais: um por campeonato que tenha o link "edital" preenchido
    try {
      const eventos = await carregarEventos();
      const editais = eventos
        .filter((e) => e.links && e.links.edital)
        .reverse()
        .map((e) => ({
          titulo: `Edital: ${e.nome}`,
          descricao: `${formatarPeriodo(e.inicio, e.fim)}, ${e.local}`,
          arquivo: e.links.edital,
        }));
      grupos.push({
        titulo: 'Editais de campeonatos',
        descricao: 'Regulamento de cada campeonato: categorias, valores, horários e premiação.',
        documentos: editais,
        vazio: 'Os editais aparecem aqui assim que forem publicados na página de cada campeonato.',
      });
    } catch (erro) {
      console.error(erro);
    }

    area.innerHTML = grupos.map((g, i) => grupoHTML(g, i % 2 === 1)).join('');

    // Completa o tamanho dos PDFs do próprio site
    area.querySelectorAll('[data-tamanho]').forEach(async (el) => {
      if (!el.dataset.tamanho) return;
      const tamanho = await tamanhoDoArquivo(el.dataset.tamanho);
      if (tamanho) el.textContent += `, ${tamanho}`;
    });
  } catch (erro) {
    console.error(erro);
    area.innerHTML = '<section class="secao"><div class="container"><p class="carregando">Não foi possível carregar os documentos. Abra o site por um servidor (ex.: Live Server).</p></div></section>';
  }
}

iniciar();
