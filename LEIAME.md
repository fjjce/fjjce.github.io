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
├── eventos/              informações extras de cada campeonato (.md) e o _MODELO.md
├── partials/
│   ├── cabecalho.html    menu (usado em todas as páginas)
│   └── rodape.html       rodapé (usado em todas as páginas)
├── dados/                ← é aqui que o site é atualizado
│   ├── eventos.json      calendário de campeonatos
│   ├── resultados.csv    pódios de cada campeonato (abre no Excel); o ranking é calculado daqui
│   ├── ranking-info.json temporada, tabela de pontos e quais campeonatos contam
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
    ├── js/ranking-dados.js lê os pódios e calcula o ranking (usado em 3 páginas)
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
   - `ilutas`: o código do evento no iLutas, o que vem depois de `event=` no endereço da página
     do evento (ex.: `714efca9658ad9b76a620d7e773b97ae`). Com ele, o site monta sozinho os links
     de **inscrição**, **edital** (a página do evento no iLutas, que traz o regulamento), **checagem** (quando as inscrições abrem) e **resultados** (no dia seguinte
     ao campeonato). Você não precisa colar esses três;
   - `encerramento` (opcional): horário em que o campeonato termina no último dia (ex.: `"17:00"`).
     Depois dele, o site já mostra o campeonato como encerrado, com "Ver resultados". Sem ele, considera 20h;
   - `links`: cole os outros links do iLutas conforme forem saindo (chaves e cronograma; edital só se for um PDF próprio).
     Link vazio (`""`) aparece como "Em breve". Link colado à mão vale mais que o automático.
3. Use `"inscricoes_abertas": true` quando as inscrições abrirem.
   Com `"prazo_inscricoes": "AAAA-MM-DD"`, o site fecha as inscrições sozinho depois dessa data
   (o botão some e aparece "Inscrições encerradas"). Se o prazo for prorrogado, é só mudar a data.
4. **Informações do campeonato** (premiação, valores, horários, regras do evento): copie
   `eventos/_MODELO.md`, renomeie com o id do campeonato (ex.: `eventos/ceara-open-2027.md`) e escreva.
   O texto aparece na página do campeonato, na seção "Informações do campeonato".

O site faz o resto sozinho: o topo da página inicial mostra o próximo campeonato (ou o último,
se não houver nenhum marcado), e os eventos passam para "Encerrados" no dia seguinte.
Depois do campeonato, coloque o link de `resultados` para aparecer o botão "Ver resultados".

**Semana do campeonato (passo a passo):**

1. **Saíram as chaves ou o cronograma no iLutas:** em `dados/eventos.json`, cole o link em
   `"chaves"`, `"cronograma"` ou `"checagem"` dentro de `links`. O site troca sozinho o aviso
   "Inscrições encerradas" pelos botões "Ver chaves", "Ver cronograma" e "Ver checagem" (lista de inscritos),
   na página do campeonato e no topo da página inicial.
2. **Depois do campeonato:** com o código `ilutas` preenchido, o botão "Ver resultados" aparece
   sozinho no dia seguinte. Sem o código, cole o link em `"resultados"`.
3. **Notícia de resultados:** copie `noticias/_MODELO-resultados.md`, preencha e cadastre em
   `dados/noticias.json` (pode usar o cartaz do campeonato ou uma foto do pódio como imagem).
4. Salve, faça o commit e sincronize.

A página do campeonato também tem os botões **Adicionar à agenda** (Google Agenda e
"iPhone e outros"). Eles aparecem sozinhos até o dia do campeonato, com a data e o local de `eventos.json`.

**Ranking (automático a partir dos pódios):** você não digita pontos. Depois de cada
campeonato, cadastre os pódios em `dados/resultados.csv`, uma linha por atleta medalhista:

```
evento,sexo,idade,faixa,peso,colocacao,atleta,equipe
ceara-pro-2026,Masculino,Adulto,Preta,Leve,1,Nome do Atleta,Nome da Equipe
ceara-pro-2026,Masculino,Adulto,Preta,Leve,2,Outro Atleta,Outra Equipe
ceara-pro-2026,Masculino,Adulto,Preta,Leve,3,Terceiro,Equipe
ceara-pro-2026,Masculino,Adulto,Preta,Leve,3,Outro Terceiro,Equipe
```

- `evento` é o `id` do campeonato em `dados/eventos.json`.
- Valores aceitos: sexo `Masculino`/`Feminino`; idade `Juvenil`, `Adulto`, `Master 1` a `Master 4`;
  faixa `Branca`, `Azul`, `Roxa`, `Marrom`, `Preta`; peso `Galo`, `Pluma`, `Pena`, `Leve`, `Médio`,
  `Meio-pesado`, `Pesado`, `Super-pesado`, `Pesadíssimo`, `Absoluto`. Escreva sempre igual,
  com acento e letra maiúscula, para o mesmo atleta somar pontos entre as etapas.
- Pode ter dois 3º lugares na mesma categoria (como na IBJJF).
- Pelo **Excel**: abra o arquivo, edite e salve como **CSV UTF-8** (senão os acentos quebram).
  Também dá para editar direto no VS Code.

O site então:
- soma os pontos de cada atleta na categoria e de cada equipe, conta ouros, pratas e bronzes
  e desempata por número de ouros;
- mostra os pódios na página do campeonato, na seção **Resultados**.

Em `dados/ranking-info.json`:
- `pontuacao`: pontos por colocação (padrão IBJJF: 1º = 9, 2º = 3, 3º = 1). Ajuste conforme a federação;
- `etapas`: lista de ids dos campeonatos que contam para o ranking (vazia = todos contam);
- `temporada` e `atualizado_em`: aparecem no site;
- `exemplo`: deixe `true` enquanto o arquivo tiver os dados de demonstração e mude para `false`
  quando colocar os resultados reais (o aviso de "Ranking de demonstração" some).

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
- cria o `sitemap.xml` para o Google;
- cria em `agenda/` o arquivo de agenda de cada campeonato (botão "iPhone e outros");
- coloca o cabeçalho e o rodapé direto dentro de cada página (fica mais rápido);
- coloca um número de versão nos arquivos `.css` e `.js`, para o celular sempre pegar a versão nova;
- liga o contador de visitas, se ele estiver configurado (veja abaixo).

Esses arquivos **só existem no site publicado**, não na sua pasta. No Live Server, os botões
de compartilhar usam o endereço normal da página.
Se o site ganhar domínio próprio, troque o endereço em `dados/site.json`.

## Contador de visitas (GoatCounter)

O contador é gratuito, não usa cookies e não guarda dados pessoais dos visitantes.
Para ligar: crie a conta em goatcounter.com, escolha um código (ex.: `fjjce`) e coloque esse
código em `dados/site.json`, no campo `"contador"`. Para ver as visitas, entre em
`https://<código>.goatcounter.com`. Só contam as visitas do site publicado.

## Imagens

Cartazes e fotos: no máximo **1080 px** de largura e, de preferência, abaixo de **200 KB**.
Se a imagem vier maior (foto de celular costuma ter 3 a 5 MB), reduza antes em squoosh.app
(formato MozJPEG, qualidade 80). Imagem pesada deixa o site lento no celular.

## Roteiro depois de cada campeonato

1. **Resultados:** pegue o resultado no iLutas e cadastre os pódios em `dados/resultados.csv`.
   Na primeira vez, apague as linhas de demonstração (as que começam com `exemplo-etapa`) e mude
   `"exemplo"` para `false` em `dados/ranking-info.json`.
2. **Data do ranking:** atualize `"atualizado_em"` em `dados/ranking-info.json`.
3. **Página do campeonato:** em `dados/eventos.json`, cole no campeonato o link `resultados` do iLutas
   (e, se tiver, `chaves`). O botão "Ver resultados" aparece no topo da página inicial.
4. **Fotos:** salve 2 ou 3 fotos em `assets/img/noticias/` (nome sem espaços, de preferência
   com no máximo 1.600 pixels de largura).
5. **Notícia:** copie o `noticias/_MODELO.md`, escreva o texto (campeões de destaque, equipe campeã,
   agradecimentos aos apoiadores) e cadastre no topo de `dados/noticias.json`, com
   `"campeonato": "id-do-evento"`.
6. **Próximo campeonato:** se já houver data, cadastre em `dados/eventos.json`, com o cartaz.
7. **Conferir no Live Server**, salvar no GitHub e ver se a aba Actions ficou verde.
8. **Divulgar:** use o botão WhatsApp da notícia para mandar nos grupos.

## Dados de exemplo

O ranking (`"exemplo": true` em `ranking-info.json`) e duas das notícias (as marcadas com `"exemplo": true`) ainda são **exemplos**. Troque pelos dados reais e remova
o aviso no fim de `partials/rodape.html`. O campeonato cadastrado (Ceará Pro 2026) é real.
