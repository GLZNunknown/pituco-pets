/* =========================================================================
   PITUCO PETS — DADOS DO CATÁLOGO
   Produtos, categorias, pets, dicas e depoimentos.
   ⚠️ Preços, avaliações e depoimentos abaixo são EXEMPLOS.
      Substitua pelos dados reais da loja antes de publicar.
   ========================================================================= */
window.ZP = window.ZP || {};

ZP.categories = [
  { id: "shampoo",       name: "Shampoo",             desc: "Limpeza profunda e pelagem saudável",      icon: "shampoo", color: "#1d74c4", tint: "#efe4ff" },
  { id: "condicionador", name: "Condicionador",       desc: "Maciez, hidratação e desembaraço",          icon: "condicionador", color: "#d6266b", tint: "#eefbc9" },
  { id: "leave-in",      name: "Leave-in",            desc: "Proteção, brilho e perfumação",             icon: "leave-in", color: "#0f8f83", tint: "#dff6f4" },
  { id: "perfumes",      name: "Perfumes e colônias", desc: "Aquele cheirinho delicioso por mais tempo", icon: "perfume", color: "#7b4ae0", tint: "#ffe6f1" },
  { id: "higiene",       name: "Higiene e cuidados",  desc: "Tudo para manter seu pet bem cuidado",      icon: "higiene", color: "#2f80ed", tint: "#e4efff" },
  { id: "kits",          name: "Kits de banho",       desc: "Combinações completas com desconto",        icon: "kit", color: "#d9542f", tint: "#fff3cf" },
];

ZP.pets = [
  { id: "caes",    name: "Cães",    icon: "dog", photo: "caes" },
  { id: "gatos",   name: "Gatos",   icon: "cat", photo: "gatos" },
  { id: "coelhos", name: "Coelhos", icon: "rabbit", photo: "coelhos" },
  { id: "cavalos", name: "Cavalos", icon: "horse", photo: "cavalos" },
];

/* Campos de cada produto:
   id, slug, name, cat, pets[], variants[{label, price, old?}],
   rating?, reviews?  → SÓ preencha com avaliações reais (ex.: rating: 4.8, reviews: 12).
                        Sem esses campos, o site mostra "Novo na loja" no lugar das estrelas.
   tags[] ("destaque" | "novo" | "promo"), needs[] (ver ZP.needs — usado pelo assistente), short, description, benefits[], howTo,
   includes? → (kits) ids dos produtos que vêm no kit; o site calcula a economia sozinho
   art { shape?, body?, cap?, label?, sub? }  → ilustração automática do frasco
   FOTOS → o jeito fácil: salve a foto com o slug do produto (ex.: shampoo-limpeza-profunda.jpg) em
           fotos-originais/produtos/ e rode `python ferramentas/otimizar_imagens.py`. Ela aparece sozinha.
           (Avançado: img: "nome-base" e gallery: ["nome-2", ...] forçam fotos específicas.) */
ZP.products = [
  // ---------- SHAMPOO ----------
  {
    id: 1, slug: "shampoo-limpeza-profunda", name: "Shampoo Limpeza Profunda", cat: "shampoo", pets: ["caes", "gatos"],
    variants: [{ label: "500 ml", price: 34.9, old: 42.9 }, { label: "1 L", price: 59.9, old: 69.9 }],
    tags: ["destaque", "promo"],
    needs: ["limpeza"],
    short: "Remove sujeira e oleosidade sem ressecar a pele.",
    description: "Fórmula com pH balanceado para a pele do pet, que limpa em profundidade e deixa a pelagem leve, solta e com brilho natural. Rende muito e tem enxágue fácil.",
    benefits: ["pH balanceado para cães e gatos", "Limpeza profunda sem ressecar", "Perfume suave e duradouro", "Enxágue rápido"],
    howTo: "Molhe bem a pelagem, aplique o shampoo e massageie até formar espuma, evitando olhos e ouvidos. Enxágue completamente. Repita se necessário.",
    art: { body: "#6a1fc2", cap: "#b6e61e", sub: "Limpeza profunda" },
  },
  {
    id: 2, slug: "shampoo-neutro-hipoalergenico", name: "Shampoo Neutro Hipoalergênico", cat: "shampoo", pets: ["caes", "gatos"],
    variants: [{ label: "500 ml", price: 29.9 }, { label: "1 L", price: 49.9 }],
    tags: [],
    needs: ["sensivel", "limpeza"],
    short: "Suave para peles sensíveis e filhotes.",
    description: "Sem corantes e com fragrância leve, é ideal para pets com pele sensível, filhotes a partir de 3 meses e banhos mais frequentes.",
    benefits: ["Sem corantes", "Ideal para pele sensível", "Indicado para filhotes", "Não arde os olhos"],
    howTo: "Aplique na pelagem molhada, massageie suavemente e enxágue bem com água morna.",
    art: { body: "#8fd3ff", cap: "#2f80ed", sub: "Hipoalergênico" },
  },
  {
    id: 3, slug: "shampoo-pelos-brancos", name: "Shampoo Pelos Brancos e Claros", cat: "shampoo", pets: ["caes", "gatos"],
    variants: [{ label: "500 ml", price: 39.9 }],
    tags: ["novo"],
    needs: ["brilho", "limpeza"],
    short: "Realça o branco e reduz o amarelado da pelagem.",
    description: "Com pigmentos violeta que neutralizam o tom amarelado, devolve a luminosidade de pelagens brancas, cinzas e claras.",
    benefits: ["Neutraliza o amarelado", "Realça o brilho", "Pelagem macia"],
    howTo: "Aplique na pelagem molhada, deixe agir por 3 minutos e enxágue bem.",
    art: { body: "#ffffff", cap: "#8a4fff", sub: "Pelos brancos" },
  },
  {
    id: 4, slug: "shampoo-citronela", name: "Shampoo Citronela para Cães", cat: "shampoo", pets: ["caes"],
    variants: [{ label: "500 ml", price: 36.9 }],
    tags: [],
    needs: ["limpeza"],
    short: "Com óleo de citronela, perfeito para passeios ao ar livre.",
    description: "Limpa e perfuma com o frescor da citronela. Uso exclusivo para cães (óleos essenciais podem fazer mal a gatos).",
    benefits: ["Aroma refrescante de citronela", "Limpeza completa", "Pelagem perfumada por mais tempo"],
    howTo: "Aplique na pelagem molhada, massageie e enxágue bem. Uso exclusivo para cães.",
    art: { body: "#ffd23f", cap: "#2e7d32", sub: "Citronela" },
  },
  {
    id: 5, slug: "shampoo-equinos-brilho", name: "Shampoo Equinos Brilho Intenso", cat: "shampoo", pets: ["cavalos"],
    variants: [{ label: "1 L", price: 79.9 }, { label: "5 L", price: 289.9 }],
    tags: [],
    needs: ["limpeza", "brilho"],
    short: "Brilho de pista para pelagem, crina e cauda.",
    description: "Desenvolvido para equinos, remove poeira e suor e deixa a pelagem com brilho intenso. Rendimento alto, ideal para haras e criadores.",
    benefits: ["Alto rendimento", "Brilho intenso", "Remove suor e poeira"],
    howTo: "Dilua 1 parte em 10 de água, aplique com esponja, massageie e enxágue abundantemente.",
    art: { body: "#8a4b2a", cap: "#b6e61e", sub: "Equinos" },
  },

  // ---------- CONDICIONADOR ----------
  {
    id: 6, slug: "condicionador-maciez-hidratacao", name: "Condicionador Maciez & Hidratação", cat: "condicionador", pets: ["caes", "gatos"],
    variants: [{ label: "500 ml", price: 32.9 }, { label: "1 L", price: 54.9 }],
    tags: ["destaque"],
    needs: ["hidratacao"],
    short: "Hidrata, desembaraça e deixa o pelo sedoso.",
    description: "Complemento ideal do shampoo: repõe a hidratação, sela as cutículas e facilita a escovação, com perfume delicado.",
    benefits: ["Hidratação profunda", "Facilita a escovação", "Reduz o frizz", "Perfume delicado"],
    howTo: "Após o shampoo, aplique na pelagem úmida, deixe agir por 2 minutos e enxágue.",
    art: { body: "#ff9cc7", cap: "#5b1fa8", sub: "Maciez" },
  },
  {
    id: 7, slug: "condicionador-pelos-longos", name: "Condicionador Pelos Longos Desembaraçante", cat: "condicionador", pets: ["caes", "gatos"],
    variants: [{ label: "500 ml", price: 36.9, old: 44.9 }],
    tags: ["promo"],
    needs: ["nos", "hidratacao"],
    short: "Desembaraça nós sem puxar o pelo.",
    description: "Para Shih Tzu, Lhasa, Yorkshire, Persas e outras raças de pelo longo. Desfaz nós com facilidade e deixa o pelo solto.",
    benefits: ["Desfaz nós com facilidade", "Ideal para pelos longos", "Brilho e leveza"],
    howTo: "Aplique mecha a mecha após o shampoo, desembarace com pente e enxágue.",
    art: { body: "#ffb26b", cap: "#5b1fa8", sub: "Pelos longos" },
  },
  {
    id: 8, slug: "condicionador-equinos-crina-cauda", name: "Condicionador Equinos Crina & Cauda", cat: "condicionador", pets: ["cavalos"],
    variants: [{ label: "1 L", price: 84.9 }],
    tags: [],
    needs: ["hidratacao", "nos"],
    short: "Crina e cauda soltas, macias e volumosas.",
    description: "Nutre os fios da crina e da cauda, reduz a quebra e deixa um acabamento solto e brilhante.",
    benefits: ["Reduz a quebra dos fios", "Fios soltos e volumosos", "Brilho duradouro"],
    howTo: "Aplique após o shampoo, deixe agir por 3 minutos e enxágue.",
    art: { body: "#a35c32", cap: "#b6e61e", sub: "Crina & cauda" },
  },

  // ---------- LEAVE-IN ----------
  {
    id: 9, slug: "leave-in-protecao-brilho", name: "Leave-in Proteção & Brilho", cat: "leave-in", pets: ["caes", "gatos"],
    variants: [{ label: "240 ml", price: 27.9 }],
    tags: [],
    needs: ["brilho", "perfume"],
    short: "Finalizador sem enxágue com brilho e perfume.",
    description: "Protege a pelagem do sol e da poeira, dá brilho e mantém o perfume do banho por mais tempo. Não deixa o pelo pesado.",
    benefits: ["Sem enxágue", "Protege do sol e da poeira", "Brilho instantâneo"],
    howTo: "Borrife a 20 cm da pelagem úmida ou seca e espalhe com escova. Evite olhos e focinho.",
    art: { body: "#20b8a8", cap: "#ffd23f", sub: "Brilho" },
  },
  {
    id: 10, slug: "leave-in-desembaracante-spray", name: "Leave-in Desembaraçante Spray", cat: "leave-in", pets: ["caes", "gatos"],
    variants: [{ label: "240 ml", price: 29.9 }],
    tags: ["novo"],
    needs: ["nos"],
    short: "Escovação sem sofrimento entre os banhos.",
    description: "Spray que solta os nós e reduz a estática na hora de escovar. Ótimo para o dia a dia entre um banho e outro.",
    benefits: ["Solta os nós na hora", "Reduz a estática", "Uso diário"],
    howTo: "Borrife nas áreas com nós e escove delicadamente.",
    art: { body: "#7b8cff", cap: "#ffd23f", sub: "Desembaraça" },
  },
  {
    id: 11, slug: "leave-in-crina-cauda", name: "Leave-in Crina e Cauda", cat: "leave-in", pets: ["cavalos"],
    variants: [{ label: "500 ml", price: 59.9 }],
    tags: [],
    needs: ["nos", "brilho"],
    short: "Desembaraça e protege crina e cauda.",
    description: "Facilita o pentear e protege os fios da crina e da cauda contra a quebra, com brilho e perfume suave.",
    benefits: ["Facilita o pentear", "Protege contra a quebra", "Brilho de pista"],
    howTo: "Borrife nos fios e penteie de baixo para cima.",
    art: { body: "#7a3e1d", cap: "#b6e61e", sub: "Crina & cauda" },
  },

  // ---------- PERFUMES ----------
  {
    id: 12, slug: "colonia-cheirinho-de-bebe", name: "Colônia Cheirinho de Bebê", cat: "perfumes", pets: ["caes", "gatos"],
    variants: [{ label: "120 ml", price: 24.9, old: 29.9 }],
    tags: ["destaque", "promo"],
    needs: ["perfume"],
    short: "Aquele cheirinho delicioso por mais tempo.",
    description: "A clássica fragrância de talco de bebê, suave e duradoura, para finalizar o banho ou perfumar entre um banho e outro.",
    benefits: ["Fragrância suave e duradoura", "Não mancha a pelagem", "Finalização perfeita"],
    howTo: "Borrife a 20 cm do corpo, evitando olhos, focinho e mucosas.",
    art: { shape: "perfume", body: "#ff8fc0", cap: "#5b1fa8", sub: "Bebê" },
  },
  {
    id: 13, slug: "perfume-floral-premium", name: "Perfume Floral Premium", cat: "perfumes", pets: ["caes"],
    variants: [{ label: "100 ml", price: 39.9 }],
    tags: [],
    needs: ["perfume"],
    short: "Notas florais sofisticadas e marcantes.",
    description: "Perfume com fixação prolongada e notas florais delicadas, para o pet sair do banho cheiroso por dias.",
    benefits: ["Alta fixação", "Notas florais", "Frasco premium"],
    howTo: "Borrife a 20 cm do corpo, evitando olhos e focinho.",
    art: { shape: "perfume", body: "#c18cff", cap: "#ff6fae", sub: "Floral" },
  },
  {
    id: 14, slug: "colonia-fresh-lavanda", name: "Colônia Fresh Lavanda para Cães", cat: "perfumes", pets: ["caes"],
    variants: [{ label: "120 ml", price: 26.9 }],
    tags: ["novo"],
    needs: ["perfume"],
    short: "Frescor relaxante de lavanda.",
    description: "Fragrância fresca e relaxante. Uso exclusivo para cães (lavanda não é indicada para gatos).",
    benefits: ["Aroma relaxante", "Sensação de frescor", "Uso exclusivo para cães"],
    howTo: "Borrife a 20 cm do corpo, evitando olhos e focinho.",
    art: { shape: "perfume", body: "#9f7aea", cap: "#ffffff", sub: "Lavanda" },
  },

  // ---------- HIGIENE ----------
  {
    id: 15, slug: "banho-a-seco-espuma", name: "Banho a Seco em Espuma", cat: "higiene", pets: ["caes", "gatos", "coelhos"],
    variants: [{ label: "200 ml", price: 31.9 }],
    tags: ["novo"],
    needs: ["sem-agua"],
    short: "Limpeza sem água — ideal para coelhos e dias frios.",
    description: "Espuma que limpa e perfuma sem precisar de água nem enxágue. Perfeita para coelhos (que não devem tomar banho molhado), pets idosos e dias frios.",
    benefits: ["Sem água e sem enxágue", "Seguro para coelhos", "Seca rapidinho"],
    howTo: "Aplique a espuma na pelagem, massageie e retire o excesso com toalha. Escove em seguida.",
    art: { shape: "tube", body: "#3b82f6", cap: "#b6e61e", label: "Banho a seco", sub: "Espuma" },
  },
  {
    id: 16, slug: "lenco-umedecido-pet", name: "Lenço Umedecido Pet (50 un)", cat: "higiene", pets: ["caes", "gatos", "coelhos"],
    variants: [{ label: "50 un", price: 19.9 }, { label: "3 pacotes", price: 52.9, old: 59.7 }],
    tags: [],
    needs: ["sem-agua"],
    short: "Patinhas limpas depois do passeio.",
    description: "Lenços com aloe vera para limpar patas, rosto e pelagem no dia a dia. Sem álcool.",
    benefits: ["Sem álcool", "Com aloe vera", "Prático para levar"],
    howTo: "Passe delicadamente sobre a área a ser limpa. Não precisa enxaguar.",
    art: { shape: "box", body: "#20b8a8", cap: "#ffd23f", label: "Lenços", sub: "50 unidades" },
  },
  {
    id: 17, slug: "escova-removedora-de-pelos", name: "Escova Removedora de Pelos", cat: "higiene", pets: ["caes", "gatos", "coelhos"],
    variants: [{ label: "Unidade", price: 22.9 }],
    tags: [],
    needs: ["nos"],
    short: "Remove pelos mortos e massageia a pele.",
    description: "Cerdas macias de silicone que removem pelos soltos e estimulam a circulação. Fácil de lavar.",
    benefits: ["Cerdas macias", "Reduz a queda de pelos", "Fácil de lavar"],
    howTo: "Escove no sentido do pelo, com movimentos suaves.",
    art: { shape: "brush", body: "#ff7a59", cap: "#ffd23f" },
  },
  {
    id: 18, slug: "limpador-de-orelhas", name: "Limpador de Orelhas", cat: "higiene", pets: ["caes", "gatos"],
    variants: [{ label: "100 ml", price: 24.9 }],
    tags: [],
    needs: ["limpeza"],
    short: "Higiene suave para os ouvidos.",
    description: "Solução suave para remover cera e sujeira do pavilhão auricular. Em caso de vermelhidão ou odor forte, consulte o veterinário.",
    benefits: ["Fórmula suave", "Remove cera e sujeira", "Uso semanal"],
    howTo: "Umedeça um algodão e limpe a parte visível da orelha. Nunca use cotonete no canal auditivo.",
    art: { shape: "tube", body: "#ffffff", cap: "#19a7a0", label: "Orelhas", sub: "Limpador" },
  },

  // ---------- KITS ----------
  {
    id: 19, includes: [1, 6, 12], slug: "kit-banho-completo", name: "Kit Banho Completo", cat: "kits", pets: ["caes", "gatos"],
    variants: [{ label: "3 itens", price: 84.9, old: 92.7 }],
    tags: ["destaque", "promo"],
    needs: ["limpeza", "hidratacao", "perfume"],
    short: "Shampoo + Condicionador + Colônia Cheirinho de Bebê.",
    description: "Tudo para o banho perfeito em casa: Shampoo Limpeza Profunda 500 ml, Condicionador Maciez & Hidratação 500 ml e Colônia Cheirinho de Bebê 120 ml.",
    benefits: ["Economia em relação aos itens avulsos", "Banho completo do início ao fim", "Ótimo para presentear"],
    howTo: "Use o shampoo, depois o condicionador e finalize com a colônia.",
    art: { shape: "kit", colors: ["#6a1fc2", "#ff9cc7", "#ff8fc0"], label: "Banho completo" },
  },
  {
    id: 20, includes: [2, 7, 10], slug: "kit-pelos-longos", name: "Kit Pelos Longos", cat: "kits", pets: ["caes", "gatos"],
    variants: [{ label: "3 itens", price: 84.9, old: 96.7 }],
    tags: ["promo"],
    needs: ["nos", "hidratacao"],
    short: "Shampoo + Condicionador Desembaraçante + Leave-in Spray.",
    description: "A rotina completa para raças de pelo longo: Shampoo Neutro 500 ml, Condicionador Pelos Longos 500 ml e Leave-in Desembaraçante 240 ml.",
    benefits: ["Fim dos nós", "Pelagem solta e brilhante", "Economia no kit"],
    howTo: "Shampoo, condicionador mecha a mecha e leave-in na escovação.",
    art: { shape: "kit", colors: ["#8fd3ff", "#ffb26b", "#7b8cff"], label: "Pelos longos" },
  },
  {
    id: 21, includes: [5, 8, 11], slug: "kit-equinos-show", name: "Kit Equinos Show", cat: "kits", pets: ["cavalos"],
    variants: [{ label: "3 itens", price: 199.9, old: 224.7 }],
    tags: ["promo"],
    needs: ["brilho", "nos", "limpeza"],
    short: "Shampoo 1 L + Condicionador 1 L + Leave-in Crina e Cauda.",
    description: "Para deixar o cavalo pronto para provas e exposições: Shampoo Brilho Intenso 1 L, Condicionador Crina & Cauda 1 L e Leave-in Crina e Cauda 500 ml.",
    benefits: ["Brilho de pista", "Crina e cauda impecáveis", "Economia no kit"],
    howTo: "Shampoo diluído, condicionador e leave-in para finalizar.",
    art: { shape: "kit", colors: ["#8a4b2a", "#a35c32", "#7a3e1d"], label: "Equinos" },
  },
  {
    id: 22, includes: [2, 12, 17], slug: "kit-primeiro-banho-filhote", name: "Kit Primeiro Banho do Filhote", cat: "kits", pets: ["caes", "gatos"],
    variants: [{ label: "3 itens", price: 64.9, old: 77.7 }],
    tags: ["novo", "promo"],
    needs: ["sensivel"],
    short: "Shampoo Neutro + Colônia Bebê + Escova macia.",
    description: "O kit de boas-vindas para o novo membro da família: Shampoo Neutro Hipoalergênico 500 ml, Colônia Cheirinho de Bebê 120 ml e Escova Removedora de Pelos.",
    benefits: ["Fórmulas suaves", "Perfeito para presentear", "Economia no kit"],
    howTo: "Banho com água morna, shampoo neutro, secagem completa e colônia para finalizar.",
    art: { shape: "kit", colors: ["#8fd3ff", "#ff8fc0", "#ffd23f"], label: "Filhote" },
  },
];

/* ---------- NECESSIDADES (usadas pelo assistente "O Pituco te ajuda") ---------- */
ZP.needs = [
  { id: "limpeza",    label: "Limpeza do dia a dia",  hint: "Tira sujeira e oleosidade",  color: "#1d74c4", tint: "#e3f3ff" },
  { id: "sensivel",   label: "Pele sensível ou filhote", hint: "Fórmulas bem suaves",     color: "#0f8f83", tint: "#dcf7ef" },
  { id: "hidratacao", label: "Pelo ressecado",        hint: "Maciez e hidratação",        color: "#d6266b", tint: "#ffe6f1" },
  { id: "nos",        label: "Nós e pelos longos",    hint: "Desembaraça sem puxar",      color: "#7b4ae0", tint: "#efe6fb" },
  { id: "brilho",     label: "Brilho e pelagem bonita", hint: "Acabamento caprichado",    color: "#b77b00", tint: "#fff3cf" },
  { id: "perfume",    label: "Cheirinho que dura",    hint: "Colônias e perfumes",        color: "#d9542f", tint: "#ffe9dc" },
  { id: "sem-agua",   label: "Limpeza sem água",      hint: "Banho a seco e lenços",      color: "#2f80ed", tint: "#e4efff" },
];

ZP.byId = (id) => ZP.products.find((p) => p.id === id);
ZP.bySlug = (slug) => ZP.products.find((p) => p.slug === slug);
ZP.catById = (id) => ZP.categories.find((c) => c.id === id);
ZP.petById = (id) => ZP.pets.find((p) => p.id === id);

/* ---------- DICAS (blog) ---------- */
ZP.articles = [
  {
    id: "frequencia-banho", photo: "gatos", icons: ["dog", "cat"], tag: "Cães e gatos", read: "3 min",
    title: "De quanto em quanto tempo dar banho no seu pet?",
    excerpt: "Banho demais resseca, de menos acumula sujeira. Veja a frequência ideal para cada caso.",
    body: [
      "Não existe uma regra única: a frequência depende do tipo de pelo, da rotina e da pele de cada pet.",
      "<b>Cães de pelo curto</b> costumam ficar bem com um banho a cada 15 a 30 dias. <b>Cães de pelo longo</b> ou que passeiam muito podem precisar de banho a cada 7 a 15 dias.",
      "<b>Gatos</b> se limpam sozinhos e, em geral, só precisam de banho em situações específicas — sujeira forte, pelagem muito longa ou recomendação veterinária.",
      "Entre um banho e outro, escovação, lenços umedecidos e leave-in mantêm a pelagem bonita sem ressecar a pele.",
      "Em caso de coceira, vermelhidão, queda de pelo ou odor forte, procure um médico-veterinário antes de mudar a rotina de banho.",
    ],
  },
  {
    id: "banho-perfeito", photo: "caes", icons: ["shampoo", "condicionador"], tag: "Passo a passo", read: "4 min",
    title: "Passo a passo do banho perfeito em casa",
    excerpt: "Da escovação à secagem: o roteiro para um banho tranquilo e sem estresse.",
    body: [
      "<b>1. Escove antes.</b> Desfazer os nós com a pelagem seca evita que eles fiquem ainda mais presos com a água.",
      "<b>2. Água morna.</b> Teste no pulso: a temperatura deve ser agradável, nunca quente.",
      "<b>3. Shampoo próprio para pets.</b> O pH da pele do pet é diferente do nosso; produtos humanos podem irritar.",
      "<b>4. Condicionador.</b> Deixe agir por 2 minutos para hidratar e facilitar a escovação.",
      "<b>5. Enxágue muito bem.</b> Resíduos de produto são uma das principais causas de coceira.",
      "<b>6. Seque completamente.</b> Toalha e secador em temperatura morna, principalmente entre os dedos e nas dobrinhas.",
      "<b>7. Finalize.</b> Leave-in para proteger e uma borrifada de colônia para aquele cheirinho de banho tomado.",
    ],
  },
  {
    id: "coelho-banho", photo: "coelhos", icons: ["rabbit"], tag: "Coelhos", read: "2 min",
    title: "Coelho pode tomar banho?",
    excerpt: "Spoiler: banho molhado não é indicado. Saiba como manter seu coelho limpinho.",
    body: [
      "Coelhos são animais muito limpos e passam boa parte do dia se higienizando. O banho com água <b>não é recomendado</b>: ele pode causar estresse intenso, hipotermia e problemas de pele.",
      "Para a higiene do dia a dia, prefira <b>escovação frequente</b>, principalmente na troca de pelo, e <b>limpeza localizada</b> com lenço umedecido ou banho a seco quando houver sujeira.",
      "Se o coelho estiver com a região traseira suja com frequência, isso pode indicar um problema de saúde — procure um veterinário de animais exóticos.",
    ],
  },
  {
    id: "cavalo-crina", photo: "cavalos", icons: ["horse"], tag: "Cavalos", read: "3 min",
    title: "Crina e cauda impecáveis: cuidados com o cavalo",
    excerpt: "Como lavar, desembaraçar e proteger os fios do seu cavalo.",
    body: [
      "Lave a crina e a cauda com shampoo próprio para equinos, diluído conforme o rótulo, e enxágue bem para não deixar resíduos.",
      "Aplique condicionador e, depois de seco, use um leave-in para desembaraçar. Penteie sempre <b>de baixo para cima</b>, segurando os fios para não quebrar.",
      "Evite pentear a cauda todos os dias: o excesso de escovação quebra os fios. Separar com os dedos e usar leave-in já ajuda muito.",
    ],
  },
];

/* ---------- DEPOIMENTOS ----------
   ⚠️ Coloque aqui SOMENTE depoimentos reais, com autorização do cliente.
   Enquanto a lista estiver vazia, a seção "Quem usa, recomenda" fica escondida.
   Formato:
   { name: "Mariana S.", pet: "tutora do Thor 🐶", text: "O que o cliente disse...", rating: 5 },
*/
ZP.testimonials = [];

/* ---------- LEGENDAS DAS FOTOS DE CLIENTES (opcional) ----------
   As fotos vêm de fotos-originais/clientes/ (ver ferramentas/otimizar_imagens.py).
   ⚠️ Publique só fotos com autorização do tutor. Legenda pelo nome do arquivo:
   ex.: "thor": "Thor, depois do Kit Banho Completo" */
ZP.customerCaptions = {};
