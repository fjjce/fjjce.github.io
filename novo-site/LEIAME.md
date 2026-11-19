# Site FJJCE — nova versão

Nova versão da página inicial da Federação de Jiu-Jitsu do Estado do Ceará.
A versão antiga (`index.html` e `style.css` na pasta de cima) continua intacta.

## Como abrir no computador

O site lê os dados de arquivos `.json`, então **não funciona com duplo clique** no `index.html`.
Abra com um servidor local:

1. No VS Code, instale a extensão **Live Server**.
2. Abra a pasta `novo-site`, clique com o botão direito no `index.html` e escolha **Open with Live Server**.

No GitHub Pages funciona normalmente.

## Estrutura

```
novo-site/
├── index.html            página inicial
├── ranking.html          ranking completo (atletas e equipes)
├── campeonatos.html      lista de campeonatos (próximos e encerrados)
├── evento.html           página de um campeonato (evento.html?id=...)
├── partials/
│   ├── cabecalho.html    menu (usado em todas as páginas)
│   └── rodape.html       rodapé (usado em todas as páginas)
├── dados/                ← é aqui que o site é atualizado
│   ├── eventos.json      calendário de campeonatos
│   ├── ranking.csv       ranking: uma linha por atleta (abre no Excel/Planilhas)
│   ├── ranking-info.json temporada, data de atualização e de onde ler o ranking
│   └── noticias.json     notícias
└── assets/
    ├── css/estilo.css
    ├── js/componentes.js carrega cabeçalho/rodapé e o menu do celular
    ├── js/util.js        funções comuns (datas, textos)
    ├── js/eventos-dados.js lê os campeonatos (usado em 3 páginas)
    ├── js/campeonatos.js e js/evento.js  montam as páginas de campeonatos
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

**Notícias:** edite `dados/noticias.json`. A primeira da lista aparece em destaque.
Para uma notícia levar à página de um campeonato, use `"link": "evento.html?id=..."`.

## Dados de exemplo

O ranking e duas das notícias ainda são **exemplos**. Troque pelos dados reais e remova
o aviso no fim de `partials/rodape.html`. O campeonato cadastrado (Ceará Pro 2026) é real.
