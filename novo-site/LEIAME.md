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
├── partials/
│   ├── cabecalho.html    menu (usado em todas as páginas)
│   └── rodape.html       rodapé (usado em todas as páginas)
├── dados/                ← é aqui que o site é atualizado
│   ├── eventos.json      calendário de campeonatos
│   ├── ranking.json      ranking por categoria
│   └── noticias.json     notícias
└── assets/
    ├── css/estilo.css
    ├── js/componentes.js carrega cabeçalho/rodapé e o menu do celular
    ├── js/inicio.js      monta a página inicial a partir de dados/
    ├── fontes/           Bebas Neue e Barlow (licença OFL)
    ├── img/
    └── docs/             PDFs (regras, tabela de peso)
```

## Como atualizar

**Novo campeonato:** copie um bloco dentro de `dados/eventos.json` e troque nome, datas
(formato `AAAA-MM-DD`), local e os links do iLutas. Link vazio (`""`) não aparece no site.
Use `"inscricoes_abertas": true` quando as inscrições abrirem.
O destaque do topo mostra sozinho o próximo campeonato que ainda não aconteceu,
e os eventos passados aparecem como "Encerrado".

**Ranking:** edite `dados/ranking.json`. A página inicial mostra os 5 primeiros de cada categoria.
Valores de `faixa`: `branca`, `azul`, `roxa`, `marrom`, `preta`.

**Notícias:** edite `dados/noticias.json`. A primeira da lista aparece em destaque.

## Dados de exemplo

O calendário, o ranking e as notícias atuais são **exemplos**. Troque pelos dados reais
antes de publicar e remova o aviso no fim de `partials/rodape.html`.
