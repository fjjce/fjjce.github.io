# Site FJJCE

Site da Federação de Jiu-Jitsu do Estado do Ceará.
A primeira versão, de 2024, está guardada na pasta `versao-2024/`.

## Como abrir no computador

O site lê os dados de arquivos `.json`, então **não funciona com duplo clique** no `index.html`.
Abra com um servidor local:

1. No VS Code, instale a extensão **Live Server**.
2. Abra a pasta do projeto, clique com o botão direito no `index.html` e escolha **Open with Live Server**.

No GitHub Pages funciona normalmente.

## Estrutura

```
Projeto-FJJCE/
├── index.html            página inicial
├── ranking.html          ranking completo (atletas e equipes)
├── campeonatos.html      lista de campeonatos (próximos e encerrados)
├── evento.html           página de um campeonato (evento.html?id=...)
├── documentos.html       regras, tabelas e editais
├── noticias.html         lista de notícias
├── noticia.html          página de uma notícia (noticia.html?id=...)
├── noticias/             texto de cada notícia (.md) e o _MODELO.md
├── partials/
│   ├── cabecalho.html    menu (usado em todas as páginas)
│   └── rodape.html       rodapé (usado em todas as páginas)
├── dados/                ← é aqui que o site é atualizado
│   ├── eventos.json      calendário de campeonatos
│   ├── ranking.csv       ranking: uma linha por atleta (abre no Excel/Planilhas)
│   ├── ranking-info.json temporada, data de atualização e de onde ler o ranking
│   ├── noticias.json     lista de notícias
│   ├── documentos.json   documentos da página de regras e documentos
│   └── site.json         endereço público do site (prévias e Google)
└── assets/
    ├── css/estilo.css
    ├── js/componentes.js carrega cabeçalho/rodapé e o menu do celular
    ├── js/util.js        funções comuns (datas, textos)
    ├── js/eventos-dados.js lê os campeonatos (usado em 3 páginas)
    ├── js/campeonatos.js e js/evento.js  montam as páginas de campeonatos
    ├── js/noticias-dados.js lê as notícias e converte o texto .md em HTML
    ├── js/noticias.js e js/noticia.js    montam as páginas de notícias
    ├── js/inicio.js      monta a página inicial a partir de dados/
    ├── js/ranking-dados.js lê a planilha do ranking (usado nas duas páginas)
    ├── js/ranking.js     filtros, busca e abas da página de ranking
    ├── fontes/           Bebas Neue e Barlow (licença OFL)
    ├── img/              imagens gerais
    ├── img/eventos/      cartazes dos campeonatos
    └── docs/             PDFs (regras, tabela de peso)
```

## Como atualizar

**Novo campeonato:**
1. Salve o cartaz em `assets/img/eventos/` com nome simples, sem espaços (ex.: `ceara-open-2027.jpg`).
2. Em `dados/eventos.json`, copie o bloco de um campeonato e troque os dados:
   - `id`: nome curto sem acentos nem espaços (vira o endereço `evento.html?id=ceara-open-2027`);
   - `inicio` e `fim`: datas no formato `AAAA-MM-DD` (num evento de um dia, as duas iguais);
   - `imagem`: caminho do cartaz; `modalidades`, `descricao` e `apoio` são opcionais;
   - `links`: cole os links do iLutas conforme forem saindo. Link vazio (`""`) aparece como "Em breve".
3. Use `"inscricoes_abertas": true` quando as inscrições abrirem.

O site faz o resto sozinho: o topo da página inicial mostra o próximo campeonato (ou o último,
se não houver nenhum marcado), e os eventos passam para "Encerrados" no dia seguinte.
Depois do campeonato, coloque o link de `resultados` para aparecer o botão "Ver resultados".

**Ranking:** o ranking é uma planilha com as colunas
`sexo, idade, faixa, peso, atleta, equipe, pontos` (uma linha por atleta).
O site calcula sozinho as posições, os empates e o ranking por equipes.

- Valores aceitos: sexo `Masculino`/`Feminino`; idade `Juvenil`, `Adulto`, `Master 1`;
  faixa `Branca`, `Azul`, `Roxa`, `Marrom`, `Preta`; peso `Galo`, `Pluma`, `Pena`, `Leve`,
  `Médio`, `Meio-pesado`, `Pesado`, `Super-pesado`, `Pesadíssimo`.
- **Pelo Excel:** abra `dados/ranking.csv`, edite e salve como **CSV UTF-8** (senão os acentos quebram).
- **Pelo Google Planilhas (recomendado para a federação):** importe o `ranking.csv` numa planilha,
  vá em Arquivo > Compartilhar > Publicar na Web, escolha a aba e o formato CSV, copie o link
  e cole no campo `"fonte"` de `dados/ranking-info.json`. A partir daí, quem edita a planilha
  atualiza o site, sem mexer em código.
- Atualize também `"atualizado_em"` em `dados/ranking-info.json`.

Os filtros da página de ranking ficam no endereço, então dá para mandar o link de uma
categoria específica. Exemplo: `ranking.html?sexo=feminino&idade=adulto&faixa=azul`.

**Nova notícia:**
1. Se tiver foto, salve em `assets/img/noticias/` (nome sem espaços). Crie a pasta na primeira vez.
2. Na pasta `noticias/`, copie o `_MODELO.md`, renomeie com um id curto
   (ex.: `2026-11-23-resultado-ceara-pro.md`) e escreva o texto. O modelo mostra como fazer
   negrito, subtítulos, listas, links, fotos e citações.
3. Em `dados/noticias.json`, adicione um bloco no topo da lista com o mesmo `id` (sem o `.md`),
   `titulo`, `resumo`, `data` e, se quiser, `imagem` e `campeonato` (o id do evento, que cria
   o botão "Ver página do campeonato").

As 3 notícias mais recentes aparecem na página inicial; todas aparecem em `noticias.html`.
Para apagar uma notícia, tire o bloco do `noticias.json` e apague o `.md` correspondente.

**Novo documento (estatuto, formulário, nova tabela de peso):**
salve o PDF em `assets/docs/` (nome sem espaços) e adicione um bloco em `dados/documentos.json`
dentro do grupo certo (ou crie um grupo novo, como "Filiação" ou "Estatuto"). O tamanho do
arquivo aparece sozinho. Os **editais** não precisam ser cadastrados aqui: basta colocar o link
`edital` no campeonato, em `dados/eventos.json`, que ele aparece na página de documentos.

## Endereço do site

O site fica na pasta principal do projeto. Outros arquivos dessa pasta:
- `404.html`: aparece quando alguém acessa um endereço que não existe;
- `versao-2024/`: a primeira versão do site, guardada para o portfólio (antes e depois);
- `ferramentas/`: o programa que o GitHub roda na publicação (ver abaixo);
- `.github/workflows/static.yml`: a configuração da publicação no GitHub.

## Prévias no WhatsApp e Google (automático)

Na hora de publicar, o GitHub roda o `ferramentas/gerar_paginas.py` (pasta principal), que:
- cria em `compartilhar/` uma página de prévia para cada campeonato e cada notícia,
  com título, resumo e imagem. Os botões "WhatsApp" e "Copiar link" usam essas páginas,
  então o link compartilhado aparece com o cartaz no WhatsApp;
- cria o `sitemap.xml` para o Google.

Esses arquivos **só existem no site publicado**, não na sua pasta. No Live Server, os botões
de compartilhar usam o endereço normal da página.
Se o site ganhar domínio próprio, troque o endereço em `dados/site.json`.

## Dados de exemplo

O ranking e duas das notícias (as marcadas com `"exemplo": true`) ainda são **exemplos**. Troque pelos dados reais e remova
o aviso no fim de `partials/rodape.html`. O campeonato cadastrado (Ceará Pro 2026) é real.
