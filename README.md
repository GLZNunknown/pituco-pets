# 🐾 Pituco Pets — Loja online

> **Banho é cuidado, é bem-estar!** Loja de produtos de banho e cuidado para cães, gatos, coelhos e cavalos.

Site em **HTML, CSS e JavaScript puros**, sem instalação e sem dependências. O cliente monta o pedido no site e **finaliza no WhatsApp da loja**, onde a equipe combina pagamento e entrega. Atende hoje o **estado de São Paulo**.

## ▶️ Como abrir

Dê dois cliques em `index.html`. Para testar como se estivesse publicado:

```bash
python -m http.server 8000
```

Depois acesse http://localhost:8000.

## ✨ Funcionalidades

| Área | O que tem |
|---|---|
| **Vitrine** | Hero com o catálogo, 6 categorias, filtro por pet, kits com desconto |
| **Catálogo** | Busca com sugestões em tempo real, filtros (categoria, pet, preço, ofertas), 6 ordenações, "carregar mais" |
| **Produto** | Página de detalhe com tamanhos, quantidade, benefícios, modo de uso, produtos relacionados e link compartilhável (`#p/nome-do-produto`) |
| **Favoritos** | Coração nos produtos e gaveta de favoritos |
| **Sacola** | Barra de frete grátis, cupons, economia, preço no Pix e sugestões de compra |
| **Checkout** | 3 etapas: dados, entrega (CEP automático via ViaCEP, frete por região de SP ou retirada) e confirmação. Ao finalizar, abre o WhatsApp da loja com o pedido completo para a equipe concluir pagamento e entrega |
| **Conteúdo** | Como comprar, depoimentos, dicas de banho (blog), FAQ, contato e newsletter |
| **Extras** | Página de políticas (entregas, trocas, pagamentos, LGPD), aviso de cookies, botão flutuante do WhatsApp, SEO e acessibilidade |

## 🗂️ Estrutura

```
./
├── index.html          # página principal
├── politicas.html      # entregas, trocas, pagamentos e privacidade
├── css/styles.css      # estilos organizados por seção
├── js/
│   ├── config.js       # ⚙️ dados da loja, frete, cupons e pagamento
│   ├── data.js         # 📦 produtos, categorias, dicas e depoimentos
│   ├── utils.js        # helpers (formatação, modais, toast)
│   ├── store.js        # sacola, favoritos e cálculo de preços
│   ├── art.js          # ilustração automática dos frascos (SVG)
│   ├── catalog.js      # vitrine, filtros, busca e detalhe do produto
│   ├── cart.js         # sacola e favoritos
│   ├── checkout.js     # finalização do pedido
│   └── main.js         # inicialização e seções institucionais
├── assets/img/         # imagens (catálogo, favicon)
└── zeca-pets/          # versão antiga da página inicial (arquivo)
```

## ⚙️ Antes de publicar

1. **`js/config.js`**: troque WhatsApp, telefone, e-mail, Instagram, endereço, horário e CNPJ (hoje são exemplos).
2. **`js/data.js`**: ajuste produtos e preços (hoje são exemplos). **Avaliações e depoimentos só com dados reais**: preencha `rating`/`reviews` no produto e a lista `ZP.testimonials`. Enquanto estiverem vazios, o site mostra "Novo na loja" e esconde a seção de depoimentos.
3. **Fotos reais** (opcional): coloque a imagem em `assets/img/produtos/` e adicione `img: "assets/img/produtos/arquivo.webp"` no produto. A foto substitui a ilustração automática.
4. **Área de entrega, frete e cupons**: em `config.js`, `shipping.serviceArea` define os estados atendidos (hoje só SP) e `shipping.zones` as faixas de frete por cidade/região. Para ampliar, adicione o estado e uma nova faixa.

## 🎟️ Cupons de exemplo

| Cupom | Benefício |
|---|---|
| `BEMVINDO10` | 10% OFF |
| `PITUCO20` | 20% OFF acima de R$ 250 |
| `FRETEGRATIS` | Frete grátis acima de R$ 80 |

## 🎨 Identidade visual

O logo, o favicon, os ícones de celular e a imagem de compartilhamento são gerados por script:

```bash
python ferramentas/gerar_marca.py
```

Requer `pip install pillow fonttools`. As fontes da marca (Baloo 2 e Nunito, licença livre OFL) são baixadas automaticamente na primeira vez.

## 🔄 Atualizando o site

Ao alterar CSS ou JS, troque o número `?v=...` nos `<script>`/`<link>` do `index.html` e do `politicas.html` (ex.: a data do dia). Isso força o navegador dos clientes a baixar a versão nova.
