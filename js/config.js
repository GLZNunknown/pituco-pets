/* =========================================================================
   PITUCO PETS — CONFIGURAÇÃO DA LOJA
   Tudo o que muda de uma loja para outra fica aqui. Edite à vontade.
   ========================================================================= */
window.ZP = window.ZP || {};

ZP.config = {
  store: {
    name: "Pituco Pets",
    slogan: "Banho é cuidado, é bem-estar!",
    tagline: "Tudo o que seu pet precisa, em um só lugar!",
    // ⚠️ Troque pelos dados reais antes de publicar
    whatsapp: "5511999999999",           // DDI + DDD + número, só dígitos
    phone: "(11) 99999-9999",
    email: "contato@pitucopets.com.br",
    instagram: "pitucopets",               // sem @
    address: "Rua Exemplo, 123 — Centro, São Paulo/SP",
    hours: "Seg a Sex 9h às 18h · Sáb 9h às 13h",
    cnpj: "00.000.000/0001-00",
  },

  // Endereço público do site (usado em links de compartilhamento, sitemap e páginas geradas).
  // Se mudar (ex.: domínio próprio), atualize aqui e rode: python ferramentas/gerar_paginas.py
  siteUrl: "https://izabelys818-arch.github.io/products-pets/",

  /* ---------- ENTREGA ----------
     Por enquanto atendemos só o estado de São Paulo. Para ampliar no futuro,
     adicione os estados em `serviceArea.ufs` e crie novas faixas em `zones`.
     As faixas são testadas em ordem: a primeira que bater com a cidade/estado vale. */
  shipping: {
    freeFrom: 150,                       // frete grátis a partir deste valor (após cupom)
    serviceArea: {
      ufs: ["SP"],                       // estados atendidos
      label: "estado de São Paulo",      // como aparece nos textos do site
    },
    zones: [
      { name: "Capital", cities: ["São Paulo"], price: 9.9, days: "1 a 2 dias úteis" },
      {
        name: "Grande São Paulo", price: 14.9, days: "1 a 3 dias úteis",
        cities: ["Arujá", "Barueri", "Biritiba-Mirim", "Caieiras", "Cajamar", "Carapicuíba", "Cotia", "Diadema",
          "Embu das Artes", "Embu-Guaçu", "Ferraz de Vasconcelos", "Francisco Morato", "Franco da Rocha", "Guararema",
          "Guarulhos", "Itapecerica da Serra", "Itapevi", "Itaquaquecetuba", "Jandira", "Juquitiba", "Mairiporã", "Mauá",
          "Mogi das Cruzes", "Osasco", "Pirapora do Bom Jesus", "Poá", "Ribeirão Pires", "Rio Grande da Serra",
          "Salesópolis", "Santa Isabel", "Santana de Parnaíba", "Santo André", "São Bernardo do Campo",
          "São Caetano do Sul", "São Lourenço da Serra", "Suzano", "Taboão da Serra", "Vargem Grande Paulista"],
      },
      { name: "Interior e litoral de SP", ufs: ["SP"], price: 24.9, days: "2 a 5 dias úteis" },
    ],
    pickup: { enabled: true, label: "Retirar na loja", days: "Pronto em até 2 horas" },
  },

  payment: {
    pixDiscount: 5,                      // % de desconto no Pix
    maxInstallments: 3,                  // parcelas sem juros
    minInstallment: 30,                  // valor mínimo de cada parcela
  },

  // type: "percent" (value = %) ou "shipping" (frete grátis). min = pedido mínimo.
  coupons: {
    BEMVINDO10: { type: "percent", value: 10, label: "10% OFF na primeira compra" },
    PITUCO20: { type: "percent", value: 20, min: 250, label: "20% OFF acima de R$ 250" },
    FRETEGRATIS: { type: "shipping", min: 80, label: "Frete grátis acima de R$ 80" },
  },

  // Barra de avisos do topo: poucas mensagens, as mais importantes (as vantagens fixas ficam na faixa abaixo do topo)
  announcements: [
    "📍 Entregamos em todo o estado de São Paulo",
    "🚚 Frete grátis em compras acima de R$ 150",
    "💜 10% OFF na primeira compra com o cupom BEMVINDO10",
  ],

  pageSize: 8,                           // produtos exibidos antes do "Carregar mais"
};
