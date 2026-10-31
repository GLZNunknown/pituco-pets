/* =========================================================================
   CATÁLOGO — categorias, pets, filtros, busca, cards, kits e
   página de detalhe do produto (modal com link compartilhável #p/slug)
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { $, $$, brl, esc, norm, icon, debounce, stars, toast, openLayer, closeLayer, waLink } = ZP.u;
  const cfg = ZP.config;

  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const PRICE_CEIL = Math.ceil(Math.max(...ZP.products.map(minPrice)) / 10) * 10;
  const TAGS = { destaque: "Destaque", novo: "Novo", promo: "Oferta" };
  const HAS_RATINGS = ZP.products.some((p) => p.rating);
  const score = (p) => (p.tags.includes("destaque") ? 3 : 0) + (p.tags.includes("promo") ? 1 : 0) + (p.rating || 0);

  const ROOT = ZP.root;
  const pageUrl = (p) => `${ROOT}produtos/${p.slug}.html`;
  let IS_STORE = false;           // true só na página principal (onde existe a grade de produtos)

  const filters = { cat: "all", pet: "all", q: "", sort: "relevance", promo: false, max: PRICE_CEIL, shown: cfg.pageSize };

  /* ---------- Pedaços reutilizáveis ---------- */
  const petIcons = (p) => p.pets.map((id) => `<span title="${ZP.petById(id).name}">${ZP.u.brandIcon(ZP.petById(id).icon)}</span>`).join("");

  function discountPct(v) {
    return v.old ? Math.round((1 - v.price / v.old) * 100) : 0;
  }

  function badges(p, v = p.variants[0]) {
    const list = [];
    if (discountPct(v)) list.push(`<span class="badge badge--sale">-${discountPct(v)}%</span>`);
    p.tags.filter((t) => t !== "promo").forEach((t) => list.push(`<span class="badge badge--${t}">${TAGS[t]}</span>`));
    return list.length ? `<div class="badges">${list.join("")}</div>` : "";
  }

  function priceBlock(p, v = p.variants[0], { from = p.variants.length > 1 } = {}) {
    const inst = ZP.pricing.installments(v.price);
    return `
      <div class="price">
        ${v.old ? `<s class="price__old">${brl(v.old)}</s>` : ""}
        <div class="price__now">${from ? "<small>a partir de</small>" : ""}<b>${brl(v.price)}</b></div>
        <div class="price__pix">${icon("pix")} ${brl(ZP.pricing.pixPrice(v.price))} no Pix</div>
        ${inst.n > 1 ? `<div class="price__inst">ou ${inst.n}x de ${brl(inst.each)} sem juros</div>` : ""}
      </div>`;
  }

  function favButton(p, extra = "") {
    const on = ZP.store.isFav(p.id);
    return `<button class="fav-btn ${extra} ${on ? "is-on" : ""}" data-fav="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remover dos" : "Adicionar aos"} favoritos: ${esc(p.name)}">${icon("heart")}</button>`;
  }

  function card(p) {
    const cat = ZP.catById(p.cat);
    return `
      <article class="product-card">
        <div class="product-card__media${ZP.art.photos(p).length ? " has-photo" : ""}" style="--tint:${cat.tint}">
          ${badges(p)}
          ${favButton(p)}
          <button class="product-card__img" data-open="${p.id}" aria-label="Ver detalhes: ${esc(p.name)}">${ZP.art.product(p)}</button>
          <button class="product-card__quick" data-open="${p.id}" tabindex="-1">${icon("eye")} Ver detalhes</button>
        </div>
        <div class="product-card__body">
          <div class="product-card__meta"><span>${cat.name}</span><span class="pets">${petIcons(p)}</span></div>
          <h3 class="product-card__title"><a href="${pageUrl(p)}" data-product="${p.id}">${esc(p.name)}</a></h3>
          <div class="product-card__rating">${p.rating ? `${stars(p.rating)}<small>(${p.reviews})</small>` : `<span class="new-pill">✨ Novo na loja</span>`}</div>
          ${priceBlock(p)}
          <button class="btn btn--primary btn--block" data-quickadd="${p.id}">${icon("bag")} Adicionar</button>
        </div>
      </article>`;
  }

  function miniCard(p) {
    const v = p.variants[0];
    return `
      <div class="mini-card">
        <button class="mini-card__img" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver ${esc(p.name)}">${ZP.art.product(p)}</button>
        <div class="mini-card__info">
          <button class="mini-card__name" data-open="${p.id}">${esc(p.name)}</button>
          <b>${brl(v.price)}</b>
        </div>
        <button class="icon-btn icon-btn--soft" data-quickadd="${p.id}" aria-label="Adicionar ${esc(p.name)} à sacola">${icon("plus")}</button>
      </div>`;
  }

  /* ---------- Seções de vitrine ---------- */
  function renderCategories() {
    $("#categoryGrid").innerHTML = ZP.categories.map((c) => {
      const n = ZP.products.filter((p) => p.cat === c.id).length;
      return `
        <button class="category-card" data-go-cat="${c.id}" style="--tint:${c.tint};--accent:${c.color}">
          <span class="category-card__icon">${ZP.u.brandIcon(c.icon)}</span>
          <b>${c.name}</b>
          <small>${c.desc}</small>
          <span class="category-card__count">${n} produtos ${icon("arrow-right")}</span>
        </button>`;
    }).join("");
  }

  function renderPets() {
    $("#petGrid").innerHTML = ZP.pets.map((pet) => {
      const n = ZP.products.filter((p) => p.pets.includes(pet.id)).length;
      return `
        <button class="pet-card" data-go-pet="${pet.id}">
          <span class="pet-card__icon">${ZP.u.brandIcon(pet.icon)}</span>
          <b>${pet.name}</b><small>${n} produtos</small>
        </button>`;
    }).join("");
  }

  const kitItems = (p) => (p.includes || []).map(ZP.byId).filter(Boolean);

  function bundle(p) {
    const items = kitItems(p);
    const v = p.variants[0];
    const separate = items.reduce((sum, x) => sum + x.variants[0].price, 0) || v.old || v.price;
    const save = Math.max(0, separate - v.price);
    return `
      <article class="bundle">
        <button class="bundle__art" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver detalhes: ${esc(p.name)}">${badges(p)}${ZP.art.product(p)}</button>
        <div class="bundle__body">
          <div class="product-card__meta"><span>Kit com ${items.length || 3} itens</span><span class="pets">${petIcons(p)}</span></div>
          <h3 class="bundle__title"><a href="${pageUrl(p)}" data-product="${p.id}">${esc(p.name)}</a></h3>
          ${items.length ? `<ul class="bundle__items">${items.map((x) => `
            <li><span class="bundle__thumb" style="--tint:${ZP.catById(x.cat).tint}">${ZP.art.product(x, { sizes: "40px" })}</span>
            <span>${esc(x.name)}<small>${x.variants[0].label}</small></span></li>`).join("")}</ul>` : `<p class="bundle__desc">${esc(p.short)}</p>`}
          <div class="bundle__price">
            ${save > 0 ? `<span class="bundle__sep">Comprando separado: <s>${brl(separate)}</s></span>` : ""}
            <b>${brl(v.price)}</b>
            ${save > 0 ? `<span class="bundle__save">Economize ${brl(save)}</span>` : ""}
          </div>
          <div class="bundle__actions">
            <button class="btn btn--primary" data-quickadd="${p.id}">${icon("bag")} Adicionar kit</button>
            <button class="link-btn" data-open="${p.id}">Ver detalhes</button>
          </div>
        </div>
      </article>`;
  }

  function renderMenus() {
    const cats = ZP.categories.map((c) => `
      <button class="mega__item" data-go-cat="${c.id}" style="--tint:${c.tint}">
        <span class="mega__icon">${ZP.u.brandIcon(c.icon)}</span><span><b>${c.name}</b><small>${c.desc}</small></span>
      </button>`).join("");
    const pets = ZP.pets.map((p) => `
      <button class="mega__pet" data-go-pet="${p.id}">${ZP.u.brandIcon(p.icon)}<span>${p.name}</span></button>`).join("");
    $("#megaMenu").innerHTML = `
      <div class="mega__cats"><p class="mega__label">Categorias</p><div class="mega__grid">${cats}</div></div>
      <div class="mega__side">
        <p class="mega__label">Por pet</p><div class="mega__pets">${pets}</div>
        <a class="mega__promo" href="#kits"><span>Kits de banho</span><b>Economize até 16%</b><small>Ver combos ${icon("arrow-right")}</small></a>
      </div>`;
    $("#drawerCats").innerHTML = ZP.categories.map((c) => `
      <button class="drawer__cat" data-go-cat="${c.id}" style="--tint:${c.tint}">${ZP.u.brandIcon(c.icon)}<span>${c.name}</span></button>`).join("");
    $("#drawerPets").innerHTML = ZP.pets.map((p) => `
      <button class="drawer__pet" data-go-pet="${p.id}">${ZP.u.brandIcon(p.icon)}<span>${p.name}</span></button>`).join("");
  }

  function renderKits() {
    $("#kitGrid").innerHTML = ZP.products.filter((p) => p.cat === "kits").map(bundle).join("");
  }

  /* ---------- Filtros ---------- */
  function renderFilterControls() {
    $("#filterChips").innerHTML = [{ id: "all", name: "Todos" }, ...ZP.categories].map((c) => {
      const n = c.id === "all" ? ZP.products.filter((p) => p.cat !== "kits").length : ZP.products.filter((p) => p.cat === c.id).length;
      const on = filters.cat === c.id;
      return `<button class="chip ${on ? "is-active" : ""}" data-filter-cat="${c.id}" aria-pressed="${on}">${c.name} <small>${n}</small></button>`;
    }).join("");

    $("#petFilter").innerHTML = `<option value="all">Todos os pets</option>` +
      ZP.pets.map((p) => `<option value="${p.id}" ${filters.pet === p.id ? "selected" : ""}>${p.name}</option>`).join("");

    const range = $("#priceMax");
    range.max = PRICE_CEIL;
    range.value = filters.max;
    $("#priceMaxLabel").textContent = filters.max >= PRICE_CEIL ? "Qualquer preço" : `Até ${brl(filters.max)}`;
    $("#promoOnly").checked = filters.promo;
    const ratingOpt = $('#sortSelect option[value="rating"]');
    if (ratingOpt && !HAS_RATINGS) ratingOpt.remove();
    $("#sortSelect").value = filters.sort;
  }

  /* ---------- Busca inteligente: sinônimos, plural e correção de digitação ---------- */
  const SINONIMOS = {
    cheiroso: ["perfume", "colonia"], cheirosa: ["perfume", "colonia"], cheiro: ["perfume", "colonia"], perfumado: ["perfume", "colonia"],
    colonia: ["perfume"], perfume: ["colonia"], fragrancia: ["perfume", "colonia"],
    no: ["desembaraca", "pelos longos"], nos: ["desembaraca", "pelos longos"], embaracado: ["desembaraca"], desembaracar: ["desembaraca"],
    coceira: ["hipoalergenico", "neutro", "sensive"], alergia: ["hipoalergenico", "neutro"], sensivel: ["hipoalergenico", "neutro", "sensive"],
    filhote: ["filhote", "neutro"], bebe: ["bebe", "filhote"],
    cachorro: ["caes"], cachorra: ["caes"], cao: ["caes"], dog: ["caes"], gato: ["gatos"], gata: ["gatos"], felino: ["gatos"],
    coelho: ["coelhos"], cavalo: ["cavalos", "equinos"], egua: ["cavalos", "equinos"], equino: ["equinos"],
    seco: ["banho a seco"], agua: ["banho a seco"], macio: ["maciez", "hidrata"], hidratar: ["hidrata"], ressecado: ["hidrata", "maciez"],
    pulga: ["citronela"], mosquito: ["citronela"], branco: ["pelos brancos", "claros"], amarelado: ["pelos brancos"],
    orelha: ["orelhas"], ouvido: ["orelhas"], lenco: ["lenco umedecido"], queda: ["removedora de pelos"], presente: ["kit"], combo: ["kit"],
  };
  const haystack = new Map();
  const hayOf = (p) => {
    if (!haystack.has(p.id)) haystack.set(p.id, norm([p.name, p.short, p.description, ...p.benefits, ZP.catById(p.cat).name,
      ...p.pets.map((id) => ZP.petById(id).name)].join(" ")));
    return haystack.get(p.id);
  };
  function alternativas(t) {
    const alts = new Set([t]);
    if (t.length > 3 && t.endsWith("s")) alts.add(t.slice(0, -1));
    [...alts].forEach((a) => (SINONIMOS[a] || []).forEach((x) => alts.add(x)));
    if (t.length >= 4) Object.keys(SINONIMOS).filter((k) => k.startsWith(t)).forEach((k) => SINONIMOS[k].forEach((x) => alts.add(x)));
    return [...alts];
  }
  function tokenOk(hay, t) {
    return alternativas(t).some((a) => (a.length <= 2 ? new RegExp(`\\b${a}`).test(hay) : hay.includes(a)));
  }
  function matches(p, tokens) {
    const hay = hayOf(p);
    return tokens.every((t) => tokenOk(hay, t));
  }

  // Relevância: termo no nome ou na categoria vale mais que na descrição
  function textScore(p, tokens) {
    const nome = norm(p.name), cat = norm(ZP.catById(p.cat).name), curto = norm(p.short);
    return tokens.reduce((total, t) => {
      const alts = alternativas(t);
      const em = (txt) => alts.some((a) => txt.includes(a));
      return total + (em(nome) ? 4 : 0) + (em(cat) ? 3 : 0) + (em(curto) ? 1.5 : 0) + 0.5;
    }, 0);
  }

  // "Você quis dizer...?" — procura a palavra conhecida mais parecida (distância de edição)
  const VOCAB = [...new Set([...ZP.products.flatMap((p) => norm(p.name).split(/[^a-z0-9]+/)),
    ...ZP.categories.flatMap((c) => norm(c.name).split(/\s+/)), ...ZP.pets.map((p) => norm(p.name)), ...Object.keys(SINONIMOS)])]
    .filter((w) => w.length >= 4);
  function distancia(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function sugestao(q) {
    let mudou = false;
    const palavras = norm(q).split(/\s+/).filter(Boolean).map((t) => {
      if (ZP.products.some((p) => tokenOk(hayOf(p), t))) return t;
      let melhor = null, dist = t.length <= 5 ? 2 : 3;
      VOCAB.forEach((w) => { const x = distancia(t, w); if (x < dist) { dist = x; melhor = w; } });
      if (melhor) { mudou = true; return melhor; }
      return t;
    });
    return mudou ? palavras.join(" ") : null;
  }

  const POPULARES = ["Shampoo neutro", "Cheirinho de bebê", "Pelos longos", "Banho a seco", "Cavalos", "Kits"];

  function filtered() {
    const tokens = norm(filters.q).split(/\s+/).filter(Boolean);
    const list = ZP.products.filter((p) =>
      (filters.cat === "all" ? (p.cat !== "kits" || tokens.length > 0) : p.cat === filters.cat) &&
      (filters.pet === "all" || p.pets.includes(filters.pet)) &&
      (!filters.promo || p.variants.some((v) => v.old)) &&
      minPrice(p) <= filters.max &&
      (!tokens.length || matches(p, tokens)));

    const sorters = {
      relevance: (a, b) => score(b) - score(a),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0),
      "price-asc": (a, b) => minPrice(a) - minPrice(b),
      "price-desc": (a, b) => minPrice(b) - minPrice(a),
      newest: (a, b) => (b.tags.includes("novo") - a.tags.includes("novo")) || b.id - a.id,
      discount: (a, b) => discountPct(b.variants[0]) - discountPct(a.variants[0]),
    };
    if (tokens.length && filters.sort === "relevance") return list.sort((a, b) => textScore(b, tokens) - textScore(a, tokens) || score(b) - score(a));
    return list.sort(sorters[filters.sort]);
  }

  function renderActiveFilters() {
    const pills = [];
    if (filters.q) pills.push(["q", `Busca: “${esc(filters.q)}”`]);
    if (filters.cat !== "all") pills.push(["cat", ZP.catById(filters.cat).name]);
    if (filters.pet !== "all") pills.push(["pet", ZP.petById(filters.pet).name]);
    if (filters.promo) pills.push(["promo", "Em oferta"]);
    if (filters.max < PRICE_CEIL) pills.push(["max", `Até ${brl(filters.max)}`]);
    const count = pills.length;
    $("#filterCount").textContent = count;
    $("#filterCount").hidden = count === 0;
    $("#activeFilters").innerHTML = pills.map(([k, label]) =>
      `<button class="pill" data-clear="${k}" aria-label="Remover filtro ${label}">${label} ${icon("x")}</button>`).join("") +
      (pills.length > 1 ? `<button class="pill pill--ghost" data-clear="all">Limpar tudo</button>` : "");
  }

  function renderGrid() {
    const list = filtered();
    const visible = list.slice(0, filters.shown);
    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "produto" : "produtos"}`;
    $("#productGrid").innerHTML = visible.map(card).join("");
    $("#emptyState").hidden = list.length > 0;
    const dica = !list.length && filters.q ? sugestao(filters.q) : null;
    $("#didYouMean").hidden = !dica;
    if (dica) $("#didYouMean").innerHTML = `Você quis dizer <button class="link-btn" data-q="${esc(dica)}">${esc(dica)}</button>?`;
    $("#filterApply").textContent = list.length ? `Ver ${list.length} ${list.length === 1 ? "produto" : "produtos"}` : "Nenhum produto — ajuste os filtros";
    const more = $("#loadMore");
    more.hidden = list.length <= filters.shown;
    more.textContent = `Carregar mais (${list.length - visible.length})`;
    renderActiveFilters();
  }

  function update(changes, { scroll = false } = {}) {
    if (!IS_STORE) {
      const params = new URLSearchParams();
      ["cat", "pet", "q"].forEach((k) => { if (changes[k] && changes[k] !== "all") params.set(k, changes[k]); });
      location.href = `${ROOT}index.html${params.toString() ? "?" + params : ""}#produtos`;
      return;
    }
    Object.assign(filters, changes, { shown: cfg.pageSize });
    renderFilterControls();
    renderGrid();
    if (scroll) $("#produtos").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const clearers = {
    q: () => { $("#searchInput").value = ""; return { q: "" }; },
    cat: () => ({ cat: "all" }),
    pet: () => ({ pet: "all" }),
    promo: () => ({ promo: false }),
    max: () => ({ max: PRICE_CEIL }),
    all: () => { $("#searchInput").value = ""; return { q: "", cat: "all", pet: "all", promo: false, max: PRICE_CEIL }; },
  };

  /* ---------- Busca com sugestões ---------- */
  function renderSuggestions() {
    const q = $("#searchInput").value.trim();
    const box = $("#searchSuggest");
    if (q.length < 2) {
      // Campo vazio: buscas populares e o que o cliente viu por último
      const vistos = recentes().slice(0, 3);
      box.innerHTML = `<li class="suggest-head">Buscas populares</li>
        <li class="suggest-chips">${POPULARES.map((t) => `<button type="button" class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join("")}</li>
        ${vistos.length ? `<li class="suggest-head">Vistos recentemente</li>${vistos.map((p) => `
          <li><button type="button" class="suggest" data-open="${p.id}">
            <span class="suggest__img" style="--tint:${ZP.catById(p.cat).tint}">${ZP.art.product(p, { sizes: "48px" })}</span>
            <span class="suggest__name">${esc(p.name)}<small>${ZP.catById(p.cat).name}</small></span>
            <b>${brl(minPrice(p))}</b></button></li>`).join("")}` : ""}`;
      box.hidden = false;
      return;
    }
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const found = ZP.products.filter((p) => matches(p, tokens)).sort((a, b) => textScore(b, tokens) - textScore(a, tokens) || score(b) - score(a));
    box.innerHTML = (found.length
      ? found.slice(0, 5).map((p) => `
          <li><button type="button" class="suggest" data-open="${p.id}">
            <span class="suggest__img" style="--tint:${ZP.catById(p.cat).tint}">${ZP.art.product(p)}</span>
            <span class="suggest__name">${esc(p.name)}<small>${ZP.catById(p.cat).name}</small></span>
            <b>${brl(minPrice(p))}</b>
          </button></li>`).join("") +
        `<li><button type="submit" class="suggest suggest--all">Ver todos os ${found.length} resultados ${icon("arrow-right")}</button></li>`
      : (sugestao(q)
          ? `<li class="suggest suggest--none">Nada encontrado para “${esc(q)}”. Você quis dizer <button type="button" class="link-btn" data-q="${esc(sugestao(q))}">${esc(sugestao(q))}</button>?</li>`
          : `<li class="suggest suggest--none">Nada encontrado para “${esc(q)}”. Tente “shampoo”, “cheiroso” ou “gatos”.</li>`));
    box.hidden = false;
  }

  function hideSuggestions() { $("#searchSuggest").hidden = true; }

  /* ---------- Detalhe do produto ---------- */
  const detail = { id: null, v: 0, qty: 1, img: 0, target: "#productContent" };
  let inlineState = null;   // estado da ficha da página do produto enquanto o modal está aberto

  function related(p) {
    return ZP.products
      .filter((x) => x.id !== p.id && x.pets.some((pet) => p.pets.includes(pet)))
      .sort((a, b) => (a.cat === p.cat) - (b.cat === p.cat) || score(b) - score(a))
      .slice(0, 4);
  }

  function renderDetail() {
    const p = ZP.byId(detail.id);
    const cat = ZP.catById(p.cat);
    const v = p.variants[detail.v];
    const photos = ZP.art.photos(p);
    const pets = p.pets.map((id) => ZP.petById(id)).map((x) => `<span class="pet-tag">${ZP.u.brandIcon(x.icon)} ${x.name}</span>`).join(" ");

    const inline = detail.target !== "#productContent";
    const H = inline ? "h1" : "h2";
    $(detail.target).innerHTML = `
      <div class="pd">
        <div class="pd__gallery">
          <div class="pd__media${photos.length ? " has-photo" : ""}" style="--tint:${cat.tint}">${badges(p, v)}${favButton(p, "fav-btn--media")}${ZP.art.product(p, { sizes: "(max-width: 860px) 90vw, 480px", eager: true, alt: p.name, index: detail.img })}</div>
          ${photos.length > 1 ? `<div class="pd__thumbs" role="group" aria-label="Fotos do produto">${photos.map((b, i) => `
            <button class="pd__thumb ${i === detail.img ? "is-active" : ""}" data-thumb="${i}" aria-pressed="${i === detail.img}" aria-label="Foto ${i + 1} de ${photos.length}">${ZP.art.photo(b, { sizes: "72px" })}</button>`).join("")}</div>` : ""}
        </div>
        <div class="pd__info">
          <p class="pd__crumbs"><button data-go-cat="${cat.id}">${cat.name}</button> <span>·</span> ${pets}</p>
          <${H} class="pd__title" id="${inline ? "pageTitle" : "productTitle"}">${esc(p.name)}</${H}>
          <div class="pd__rating">${p.rating
            ? `${stars(p.rating)} <b>${p.rating.toFixed(1).replace(".", ",")}</b> <small>(${p.reviews} avaliações)</small>`
            : `<span class="new-pill">✨ Novo na loja</span> <a href="${waLink(`Olá! Comprei o ${p.name} e quero deixar minha avaliação.`)}" target="_blank" rel="noopener">Seja o primeiro a avaliar</a>`}</div>
          <p class="pd__short">${esc(p.short)}</p>

          ${p.variants.length > 1 ? `
            <div class="pd__variants" role="radiogroup" aria-label="Escolha o tamanho">
              ${p.variants.map((x, i) => `<button role="radio" aria-checked="${i === detail.v}" class="variant ${i === detail.v ? "is-active" : ""}" data-variant="${i}">${x.label}<small>${brl(x.price)}</small></button>`).join("")}
            </div>` : `<p class="pd__size">Tamanho: <b>${v.label}</b></p>`}

          ${priceBlock(p, v, { from: false })}

          <div class="pd__buy">
            <div class="stepper" aria-label="Quantidade">
              <button data-pd-qty="-1" aria-label="Diminuir">${icon("minus")}</button>
              <output id="pdQty" aria-live="polite">${detail.qty}</output>
              <button data-pd-qty="1" aria-label="Aumentar">${icon("plus")}</button>
            </div>
            <button class="btn btn--primary btn--lg" id="pdAdd">${icon("bag")} Adicionar · ${brl(v.price * detail.qty)}</button>
            ${favButton(p, "fav-btn--lg")}
          </div>

          <ul class="pd__perks">
            <li class="ship-calc-li">
              <form class="ship-calc" data-ship-calc>
                ${icon("truck")}
                <label class="sr-only" for="pdCep">Seu CEP</label>
                <input id="pdCep" inputmode="numeric" autocomplete="postal-code" placeholder="Calcule o frete: seu CEP" maxlength="9" value="${esc(((c) => (c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : c))(ZP.u.storage.get("cep", "")))}">
                <button class="btn btn--outline btn--sm">Calcular</button>
              </form>
              <output class="ship-calc__out" aria-live="polite">${detail.ship || `Frete grátis em compras acima de ${brl(cfg.shipping.freeFrom)} · entregamos em todo o estado de SP`}</output>
            </li>
            <li>${icon("shield")} Compra segura e troca garantida</li>
            <li>${icon("chat")} <a href="${waLink(`Olá! Tenho uma dúvida sobre o produto ${p.name}.`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a></li>
          </ul>

          <div class="pd__details">
            ${kitItems(p).length ? `<details open><summary>O que vem no kit</summary><ul class="check-list">${kitItems(p).map((x) => `<li>${icon("check")} ${esc(x.name)} <small>(${x.variants[0].label})</small></li>`).join("")}</ul></details>` : ""}
            <details ${kitItems(p).length ? "" : "open"}><summary>Descrição</summary><p>${esc(p.description)}</p></details>
            <details><summary>Benefícios</summary><ul class="check-list">${p.benefits.map((b) => `<li>${icon("check")} ${esc(b)}</li>`).join("")}</ul></details>
            <details><summary>Modo de uso</summary><p>${esc(p.howTo)}</p></details>
            <details><summary>Indicado para</summary><p>${pets}</p></details>
          </div>
          <div class="pd__links">
            <button class="link-btn" data-share="${p.id}">${icon("share")} Compartilhar produto</button>
            ${inline ? "" : `<a class="link-btn" href="${pageUrl(p)}">Ver página completa ${icon("arrow-right")}</a>`}
          </div>
        </div>
      </div>
      <div class="pd__related">
        <h3>Combina com</h3>
        <div class="mini-grid">${related(p).map(miniCard).join("")}</div>
      </div>`;
  }

  /* ---------- Barra de compra compacta (página do produto, celular) ---------- */
  // Aparece quando a barra "quantidade + Adicionar" sai da tela, para o cliente comprar de qualquer ponto da página
  function initBuybar() {
    const p = ZP.byId(detail.id);
    const bar = document.createElement("div");
    bar.className = "buybar";
    bar.innerHTML = `<div><b>${esc(p.name)}</b><span id="buybarPrice"></span></div>
      <button class="btn btn--primary" id="buybarAdd">${icon("bag")} Adicionar</button>`;
    document.body.appendChild(bar);
    const atualizarPreco = () => {
      const st = inlineState || detail;
      $("#buybarPrice").textContent = brl(ZP.byId(st.id).variants[st.v].price * st.qty);
    };
    let pendente = false;
    const checar = () => {
      pendente = false;
      const original = $("#pdInline .pd__buy");
      const mostrar = !!original && original.getBoundingClientRect().bottom < 80 && !inlineState;
      bar.classList.toggle("is-show", mostrar);
      document.body.classList.toggle("has-buybar", mostrar);
      if (mostrar) atualizarPreco();
    };
    addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(checar); } }, { passive: true });
    $("#buybarAdd").addEventListener("click", () => addToCart(detail.id, detail.v, detail.qty));
    checar();
  }

  /* ---------- Vistos recentemente (guardado só neste navegador) ---------- */
  const recentes = () => ZP.u.storage.get("recent", []).map(ZP.byId).filter(Boolean);
  function lembrar(id) {
    ZP.u.storage.set("recent", [id, ...ZP.u.storage.get("recent", []).filter((x) => x !== id)].slice(0, 8));
  }
  function renderRecent() {
    const lista = recentes();
    $("#recentBox").hidden = lista.length < 2;
    $("#recentList").innerHTML = lista.map(miniCard).join("");
  }

  function openProduct(id, { fromHash = false } = {}) {
    const p = ZP.byId(id);
    if (!p) return;
    lembrar(id);
    hideSuggestions();
    if (detail.target !== "#productContent") inlineState = { ...detail };
    Object.assign(detail, { id, v: 0, qty: 1, img: 0, ship: "", target: "#productContent" });
    renderDetail();
    if (!fromHash) history.replaceState(null, "", `#p/${p.slug}`);
    document.title = `${p.name} — ${cfg.store.name}`;
    const layer = $("#productLayer");
    if (layer.hidden) openLayer(layer);
    else $(".layer__panel", layer).scrollTop = 0;
  }

  function onHash() {
    const m = location.hash.match(/^#p\/([\w-]+)/);
    if (m && ZP.bySlug(m[1])) openProduct(ZP.bySlug(m[1]).id, { fromHash: true });
  }

  async function share(p) {
    const url = new URL(pageUrl(p), location.href).href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: p.short, url });
      else { await navigator.clipboard.writeText(url); toast("Link copiado!"); }
    } catch {}
  }

  /* ---------- Eventos ---------- */
  function bump() {
    const btn = $("#cartBtn");
    btn.classList.remove("is-bump");
    void btn.offsetWidth;
    btn.classList.add("is-bump");
  }

  function addToCart(id, v = 0, qty = 1) {
    ZP.store.add(id, v, qty);
    bump();
    toast(`${ZP.byId(id).name} na sacola!`);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open],[data-quickadd],[data-fav],[data-thumb],[data-go-cat],[data-go-pet],[data-filter-cat],[data-clear],[data-variant],[data-pd-qty],[data-share],#pdAdd,#loadMore");
      if (!t) return;
      const d = t.dataset;

      if (d.open) { e.preventDefault(); openProduct(+d.open); }
      else if (d.quickadd) addToCart(+d.quickadd);
      else if (d.fav) {
        const on = ZP.store.toggleFav(+d.fav);
        toast(on ? "Adicionado aos favoritos 💜" : "Removido dos favoritos");
      }
      else if (d.goCat || d.goPet) {
        closeLayer("#productLayer");
        closeLayer("#menuLayer");
        const drop = $("#navDrop");
        drop.classList.add("is-closed");
        // Reabre normalmente quando o mouse sai ou quando o foco do teclado volta ao botão
        const reabrir = () => drop.classList.remove("is-closed");
        drop.addEventListener("mouseleave", reabrir, { once: true });
        $(".nav__drop-btn").addEventListener("focus", reabrir, { once: true });
        document.activeElement.blur();
        update(d.goCat ? { cat: d.goCat } : { pet: d.goPet }, { scroll: true });
      }
      else if (d.filterCat) update({ cat: d.filterCat });
      else if (d.clear) update(clearers[d.clear]());
      else if (d.thumb) {
        // Troca só a foto (sem redesenhar a ficha) para não piscar enquanto a nova carrega
        detail.img = +d.thumb;
        const base = ZP.art.photos(ZP.byId(detail.id))[detail.img];
        const img = $(".pd__media img");
        img.srcset = `${ZP.art.photoSrc(base, 400)} 400w, ${ZP.art.photoSrc(base, 800)} 800w`;
        img.src = ZP.art.photoSrc(base, 400);
        $$(".pd__thumb").forEach((b, i) => { b.classList.toggle("is-active", i === detail.img); b.setAttribute("aria-pressed", i === detail.img); });
      }
      else if (d.variant) { detail.v = +d.variant; renderDetail(); $(`[data-variant="${d.variant}"]`).focus(); }
      else if (d.pdQty) { detail.qty = Math.max(1, Math.min(99, detail.qty + +d.pdQty)); renderDetail(); $(`[data-pd-qty="${d.pdQty}"]`).focus(); }
      else if (d.share) share(ZP.byId(+d.share));
      else if (t.id === "pdAdd") { addToCart(detail.id, detail.v, detail.qty); closeLayer("#productLayer"); }
      else if (t.id === "loadMore") { filters.shown += cfg.pageSize; renderGrid(); }
    });

    // Links para a página de cada produto: clique normal abre a ficha rápida; Ctrl/⌘+clique abre a página
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-product]");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      openProduct(+a.dataset.product);
    });

    if (IS_STORE) bindFilters();

    const input = $("#searchInput");
    input.addEventListener("input", debounce(renderSuggestions, 120));
    input.addEventListener("focus", renderSuggestions);
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      hideSuggestions();
      input.blur();
      update({ q: input.value.trim() }, { scroll: true });
    });
    document.addEventListener("click", (e) => { if (!e.target.closest("#searchForm")) hideSuggestions(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") hideSuggestions(); });
    bindRest(input);
  }

  function bindFilters() {
    const toolbar = $("#toolbar");
    const setSheet = (open) => {
      toolbar.classList.toggle("is-open", open);
      document.body.classList.toggle("filters-open", open);
      $("#filterOpen").setAttribute("aria-expanded", open);
      if (open) setTimeout(() => $("#filterSheet .select select").focus({ preventScroll: true }), 250);
    };
    $("#filterOpen").addEventListener("click", () => setSheet(true));
    toolbar.addEventListener("click", (e) => { if (e.target.closest("[data-filter-close]")) { setSheet(false); $("#filterOpen").focus({ preventScroll: true }); } });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && toolbar.classList.contains("is-open")) setSheet(false); });

    $("#petFilter").addEventListener("change", (e) => update({ pet: e.target.value }));
    $("#sortSelect").addEventListener("change", (e) => update({ sort: e.target.value }));
    $("#promoOnly").addEventListener("change", (e) => update({ promo: e.target.checked }));
    $("#priceMax").addEventListener("input", (e) => {
      filters.max = +e.target.value;
      filters.shown = cfg.pageSize;
      $("#priceMaxLabel").textContent = filters.max >= PRICE_CEIL ? "Qualquer preço" : `Até ${brl(filters.max)}`;
      renderGrid();
    });
    $("#recentClear").addEventListener("click", () => { ZP.u.storage.set("recent", []); renderRecent(); });
  }

  function bindRest(input) {
    // Buscas populares e "Você quis dizer"
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      input.value = b.dataset.q;
      hideSuggestions();
      update({ q: b.dataset.q, cat: "all" }, { scroll: true });
    });

    // Calculadora de frete na página do produto
    document.addEventListener("input", (e) => {
      if (e.target.id !== "pdCep") return;
      const d = ZP.u.onlyDigits(e.target.value).slice(0, 8);
      e.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    });
    document.addEventListener("submit", async (e) => {
      if (!e.target.matches("[data-ship-calc]")) return;
      e.preventDefault();
      const out = $(".ship-calc__out");
      const cep = ZP.u.onlyDigits($("#pdCep").value);
      if (cep.length !== 8) { out.textContent = "Digite os 8 números do CEP."; return; }
      out.textContent = "Calculando...";
      try {
        const r = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
        if (r.erro) throw new Error();
        ZP.u.storage.set("cep", cep);
        const z = ZP.pricing.shippingFor(r.uf, r.localidade);
        detail.ship = z
          ? `<b>${esc(r.localidade)}/${r.uf}</b> · ${esc(z.name)}: <b>${brl(z.price)}</b> · chega em ${esc(z.days)}. <span class="ok">Grátis acima de ${brl(cfg.shipping.freeFrom)}</span>`
          : `<b>${esc(r.localidade)}/${r.uf}:</b> ainda não entregamos aqui. Por enquanto atendemos o ${esc(cfg.shipping.serviceArea.label)}.`;
      } catch {
        detail.ship = "Não encontramos esse CEP. Confira os números.";
      }
      out.innerHTML = detail.ship;
    });

    $("#productLayer").addEventListener("layer:close", () => {
      if (IS_STORE) renderRecent();
      // Na página do produto, ao fechar a ficha rápida, a ficha da página volta a ser a ativa
      if (inlineState) { Object.assign(detail, inlineState); inlineState = null; }
      if (location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search);
      document.title = ZP.baseTitle;
    });
    window.addEventListener("hashchange", onHash);

    // Mantém corações e preços sincronizados com o estado
    ZP.store.subscribe((change) => {
      if (change.type !== "favs") return;
      $$(`[data-fav="${change.id}"]`).forEach((b) => {
        b.classList.toggle("is-on", change.on);
        b.setAttribute("aria-pressed", change.on);
      });
    });
  }

  /* ---------- Assistente: O Pituco te ajuda a escolher ---------- */
  const quiz = { pet: null, need: null };

  function quizPicks() {
    const doPet = ZP.products.filter((p) => p.pets.includes(quiz.pet));
    const comNecessidade = doPet.filter((p) => (p.needs || []).includes(quiz.need));
    const avulsos = comNecessidade.filter((p) => p.cat !== "kits").sort((a, b) => score(b) - score(a)).slice(0, 3);
    const kit = comNecessidade.find((p) => p.cat === "kits");
    return { avulsos, kit };
  }

  function renderQuiz() {
    const box = $("#quiz");
    const pet = quiz.pet && ZP.petById(quiz.pet);
    const passo = !quiz.pet ? 1 : !quiz.need ? 2 : 3;
    const progresso = `<ol class="quiz__steps" aria-label="Etapas">${["Pet", "Necessidade", "Indicação"].map((t, i) =>
      `<li class="${i + 1 < passo ? "is-done" : ""} ${i + 1 === passo ? "is-current" : ""}">${t}</li>`).join("")}</ol>`;
    const mascote = `<div class="quiz__mascot" aria-hidden="true"><span class="mascot__face">${ZP.u.brandIcon(pet ? pet.icon : "dog")}</span></div>`;

    let corpo;
    if (passo === 1) {
      corpo = `
        <h3 class="quiz__q">Para quem é o banho?</h3>
        <div class="quiz__pets">${ZP.pets.map((p) => `
          <button class="quiz__pet" data-quiz-pet="${p.id}">${ZP.u.brandIcon(p.icon)}<span>${p.name}</span></button>`).join("")}</div>`;
    } else if (passo === 2) {
      const disponiveis = ZP.needs.filter((n) => ZP.products.some((p) => p.pets.includes(quiz.pet) && (p.needs || []).includes(n.id)));
      corpo = `
        <h3 class="quiz__q">Do que ${quiz.pet === "caes" ? "o seu cão" : quiz.pet === "gatos" ? "o seu gato" : quiz.pet === "coelhos" ? "o seu coelho" : "o seu cavalo"} precisa?</h3>
        ${quiz.pet === "coelhos" ? `<p class="quiz__note">${icon("shield")} Coelhos não devem tomar banho com água: indicamos só limpeza a seco e escovação.</p>` : ""}
        <div class="quiz__needs">${disponiveis.map((n) => `
          <button class="quiz__need" data-quiz-need="${n.id}" style="--c:${n.color};--t:${n.tint}"><b>${n.label}</b><small>${n.hint}</small></button>`).join("")}</div>
        <button class="link-btn" data-quiz-back>${icon("arrow-left")} Voltar</button>`;
    } else {
      const { avulsos, kit } = quizPicks();
      const need = ZP.needs.find((n) => n.id === quiz.need);
      corpo = `
        <h3 class="quiz__q">O Pituco indica para ${pet.name.toLowerCase()} · <span style="color:${need.color}">${need.label.toLowerCase()}</span></h3>
        <div class="quiz__picks">${avulsos.map((p) => `
          <article class="quiz__pick">
            <button class="quiz__pick-img" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver ${esc(p.name)}">${ZP.art.product(p, { sizes: "160px" })}</button>
            <b>${esc(p.name)}</b><small>${esc(p.short)}</small>
            <span class="quiz__price">${brl(minPrice(p))}</span>
            <button class="btn btn--primary btn--sm" data-quickadd="${p.id}">${icon("bag")} Adicionar</button>
          </article>`).join("")}</div>
        ${kit ? `<button class="quiz__kit" data-open="${kit.id}">${icon("gift")}<span>Prefere tudo junto? <b>${esc(kit.name)}</b> por ${brl(kit.variants[0].price)}</span>${icon("arrow-right")}</button>` : ""}
        <div class="quiz__actions">
          ${avulsos.length > 1 ? `<button class="btn btn--primary" data-quiz-all>${icon("bag")} Adicionar os ${avulsos.length} à sacola</button>` : ""}
          <button class="btn btn--ghost" data-quiz-reset>${icon("refresh")} Recomeçar</button>
        </div>`;
    }

    box.innerHTML = `
      <div class="quiz__intro">
        ${mascote}
        <span class="eyebrow">Assistente Pituco</span>
        <h2 id="quizTitle">Não sabe por onde <mark class="hl">começar</mark>?</h2>
        <p>Responda 2 perguntinhas e o Pituco indica os produtos certos para o seu pet.</p>
        ${progresso}
      </div>
      <div class="quiz__body">${corpo}</div>`;
  }

  function bindQuiz() {
    $("#quiz").addEventListener("click", (e) => {
      const t = e.target.closest("[data-quiz-pet],[data-quiz-need],[data-quiz-back],[data-quiz-reset],[data-quiz-all]");
      if (!t) return;
      const d = t.dataset;
      if (d.quizPet) quiz.pet = d.quizPet;
      else if (d.quizNeed) quiz.need = d.quizNeed;
      else if ("quizBack" in d) quiz.pet = null;
      else if ("quizReset" in d) { quiz.pet = null; quiz.need = null; }
      else if ("quizAll" in d) {
        const { avulsos } = quizPicks();
        avulsos.forEach((p) => ZP.store.add(p.id));
        bump();
        toast(`${avulsos.length} produtos na sacola! 🐾`);
        return;
      }
      renderQuiz();
      const foco = $("#quiz .quiz__body button");
      if (foco) foco.focus({ preventScroll: true });
    });
  }

  // Na loja, aceita filtros pela URL (ex.: index.html?cat=shampoo#produtos) — vindos de outras páginas ou compartilhados
  function aplicarParametros() {
    const p = new URLSearchParams(location.search);
    if (ZP.catById(p.get("cat") || "")) filters.cat = p.get("cat");
    if (ZP.petById(p.get("pet") || "")) filters.pet = p.get("pet");
    if (p.get("q")) { filters.q = p.get("q").slice(0, 60); $("#searchInput").value = filters.q; }
  }

  ZP.catalog = {
    init() {
      ZP.baseTitle = document.title;
      IS_STORE = !!$("#productGrid");
      renderMenus();
      if (IS_STORE) {
        aplicarParametros();
        renderCategories();
        renderPets();
        renderKits();
        renderQuiz();
        bindQuiz();
        renderRecent();
        renderFilterControls();
        renderGrid();
      }
      // Página de um produto: a ficha completa é desenhada na própria página
      const inline = $("#pdInline");
      if (inline) {
        Object.assign(detail, { id: +inline.dataset.product, v: 0, qty: 1, img: 0, ship: "", target: "#pdInline" });
        lembrar(detail.id);
        renderDetail();
        initBuybar();
      }
      // Página de categoria: cartões dos produtos da categoria
      const catGrid = $("#catGrid");
      if (catGrid) catGrid.innerHTML = ZP.products.filter((p) => p.cat === catGrid.dataset.cat).map(card).join("");
      bind();
      onHash();
    },
    card, miniCard, openProduct, addToCart,
  };
})(window.ZP);
