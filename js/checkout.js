/* =========================================================================
   CHECKOUT — 3 etapas (dados → entrega → confirmação).
   Ao finalizar, o cliente é levado direto ao WhatsApp da loja com o pedido
   completo (itens, valores, dados e endereço). Pagamento e atendimento
   são concluídos pela equipe no WhatsApp.
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { $, brl, esc, icon, onlyDigits, storage, toast, openLayer, closeLayer, waLink } = ZP.u;
  const cfg = ZP.config;
  const area = cfg.shipping.serviceArea;

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const STEPS = ["Seus dados", "Entrega", "Confirmar"];
  const PAYMENTS = {
    pix:  { label: "Pix", desc: `${cfg.payment.pixDiscount}% de desconto`, icon: "pix" },
    card: { label: "Cartão de crédito", desc: `Até ${cfg.payment.maxInstallments}x sem juros, por link seguro`, icon: "card" },
    cash: { label: "Dinheiro", desc: "Na entrega ou na retirada", icon: "money" },
  };

  // Dados do cliente ficam salvos só neste navegador, para agilizar a próxima compra
  const data = Object.assign({
    name: "", phone: "", email: "",
    mode: "delivery", cep: (() => { const c = storage.get("cep", ""); return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : ""; })(), street: "", number: "", complement: "", district: "", city: "", uf: "",
    payment: "pix", change: "", notes: "",
  }, storage.get("customer", {}));

  let step = 0;
  let cepStatus = "";

  /* ---------- Máscaras ---------- */
  const maskPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const maskCep = (v) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };

  /* ---------- Frete e área de entrega ---------- */
  // null = falta informação | { outside: true } = região ainda não atendida | { price, days, name }
  function quote() {
    if (data.mode === "pickup") return { price: 0, days: cfg.shipping.pickup.days, name: cfg.shipping.pickup.label };
    if (!data.uf || !data.city.trim()) return null;
    return ZP.pricing.shippingFor(data.uf, data.city) || { outside: true };
  }

  const totals = () => {
    const q = quote();
    return ZP.pricing.compute({ shipping: q && !q.outside ? q.price : null, payment: data.payment });
  };

  /* ---------- Componentes de formulário ---------- */
  const field = (name, label, { type = "text", req = false, ph = "", cls = "", attrs = "" } = {}) => `
    <div class="field ${cls}">
      <label for="co-${name}">${label}${req ? ' <span aria-hidden="true">*</span>' : ""}</label>
      <input id="co-${name}" name="${name}" type="${type}" value="${esc(data[name])}" placeholder="${ph}" ${req ? "required" : ""} ${attrs}>
      <small class="field__error" aria-live="polite"></small>
    </div>`;

  const option = (group, value, title, desc, iconName, checked, extra = "") => `
    <label class="option ${extra} ${checked ? "is-active" : ""}">
      <input type="radio" name="${group}" value="${value}" ${checked ? "checked" : ""}>
      <span class="option__icon">${icon(iconName)}</span>
      <span class="option__text"><b>${title}</b><small>${desc}</small></span>
      <span class="option__check">${icon("check")}</span>
    </label>`;

  function addressLine() {
    return data.mode === "pickup" ? `${cfg.shipping.pickup.label} — ${cfg.store.address}` :
      `${data.street}, ${data.number}${data.complement ? ` (${data.complement})` : ""} — ${data.district}, ${data.city}/${data.uf} — CEP ${data.cep}`;
  }

  /* ---------- Etapas ---------- */
  const views = [
    // 1. Dados
    () => `
      <h3 class="co__title">Como podemos falar com você?</h3>
      <div class="form-grid">
        ${field("name", "Nome completo", { req: true, ph: "Ex.: Maria Silva", cls: "span-2", attrs: 'autocomplete="name"' })}
        ${field("phone", "Seu WhatsApp", { type: "tel", req: true, ph: "(11) 99999-9999", attrs: 'autocomplete="tel" inputmode="tel"' })}
        ${field("email", "E-mail (opcional)", { type: "email", ph: "voce@email.com", attrs: 'autocomplete="email"' })}
      </div>
      <p class="co__note">${icon("shield")} Seus dados ficam salvos apenas neste navegador e só são enviados para a loja quando você finaliza o pedido.</p>`,

    // 2. Entrega
    () => `
      <h3 class="co__title">Como você quer receber?</h3>
      <p class="co__area">${icon("pin")} Por enquanto entregamos no <b>${esc(area.label)}</b>.</p>
      <div class="options">
        ${option("mode", "delivery", "Receber em casa", "Entregamos no seu endereço", "truck", data.mode === "delivery")}
        ${cfg.shipping.pickup.enabled ? option("mode", "pickup", cfg.shipping.pickup.label, `Grátis · ${cfg.shipping.pickup.days}`, "store", data.mode === "pickup") : ""}
      </div>
      ${data.mode === "pickup" ? `
        <div class="pickup-card">${icon("pin")}<div><b>${esc(cfg.store.address)}</b><small>${esc(cfg.store.hours)}</small></div></div>` : `
        <div class="form-grid">
          ${field("cep", "CEP", { req: true, ph: "00000-000", attrs: 'inputmode="numeric" autocomplete="postal-code"' })}
          <div class="field field--hint"><a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener">Não sei meu CEP</a><small id="cepStatus" aria-live="polite">${esc(cepStatus)}</small></div>
          ${field("street", "Rua / Avenida", { req: true, cls: "span-2", attrs: 'autocomplete="address-line1"' })}
          ${field("number", "Número", { req: true, attrs: 'inputmode="numeric"' })}
          ${field("complement", "Complemento", { ph: "Apto, bloco..." })}
          ${field("district", "Bairro", { req: true })}
          ${field("city", "Cidade", { req: true, attrs: 'autocomplete="address-level2"' })}
          <div class="field">
            <label for="co-uf">Estado <span aria-hidden="true">*</span></label>
            <select id="co-uf" name="uf" required><option value="">Selecione</option>${UFS.map((u) => `<option ${u === data.uf ? "selected" : ""}>${u}</option>`).join("")}</select>
            <small class="field__error" aria-live="polite"></small>
          </div>
        </div>`}
      <div class="ship-quote" id="shipQuote">${shipQuoteHTML(quote())}</div>`,

    // 3. Confirmar
    () => {
      const t = totals();
      const q = quote();
      return `
      <h3 class="co__title">Confira e finalize no WhatsApp</h3>
      <div class="review">
        <section><header><b>${icon("user")} Seus dados</b><button type="button" class="link-btn" data-go-step="0">Editar</button></header>
          <p>${esc(data.name)}<br>${esc(data.phone)}${data.email ? `<br>${esc(data.email)}` : ""}</p></section>
        <section><header><b>${icon("truck")} Entrega</b><button type="button" class="link-btn" data-go-step="1">Editar</button></header>
          <p>${esc(addressLine())}<br><small>${q && !q.outside ? esc(q.days) : ""}</small></p></section>
        <section class="span-2"><header><b>${icon("bag")} Itens (${ZP.store.count()})</b></header>
          <ul class="review__items">${t.lines.map((l) => `<li><span>${l.qty}× ${esc(l.p.name)} <small>${l.variant.label}</small></span><b>${brl(l.total)}</b></li>`).join("")}</ul></section>
      </div>

      <h4 class="co__subtitle">Como prefere pagar? <small>Você confirma o pagamento com a nossa equipe no WhatsApp.</small></h4>
      <div class="options options--row">
        ${Object.entries(PAYMENTS).map(([k, p]) => option("payment", k, p.label, p.desc, p.icon, data.payment === k, "option--compact")).join("")}
      </div>
      <div class="form-grid">
        ${data.payment === "cash" ? field("change", "Troco para quanto? (opcional)", { ph: "Ex.: R$ 100", attrs: 'inputmode="decimal"' }) : ""}
        <div class="field ${data.payment === "cash" ? "" : "span-2"}">
          <label for="co-notes">Observações (opcional)</label>
          <textarea id="co-notes" name="notes" rows="2" placeholder="Ex.: entregar após as 14h, é presente...">${esc(data.notes)}</textarea>
        </div>
      </div>

      <div class="wa-hint">
        ${icon("whatsapp")}
        <p>Ao finalizar, abrimos o <b>WhatsApp da ${esc(cfg.store.name)}</b> com o seu pedido já escrito. É só tocar em <b>enviar</b> e a nossa equipe confirma o frete, o pagamento e o prazo com você por lá.</p>
      </div>
      <label class="consent"><input type="checkbox" id="co-consent"> <span>Li e concordo com as <a href="politicas.html" target="_blank">políticas de troca, entrega e privacidade</a>.</span></label>
      <small class="field__error" id="consentError" aria-live="polite"></small>`;
    },
  ];

  function shipQuoteHTML(q) {
    if (!q) return `${icon("truck")} <span>Informe o CEP para calcular o frete.</span>`;
    if (q.outside) {
      return `<div class="ship-quote__out">${icon("pin")}<span><b>Ainda não entregamos em ${esc(data.city || "sua cidade")}${data.uf ? `/${esc(data.uf)}` : ""}.</b>
        Por enquanto atendemos o ${esc(area.label)}, mas estamos crescendo!
        <a href="${waLink(`Olá! Moro em ${data.city}/${data.uf} e queria saber quando a ${cfg.store.name} vai entregar aqui.`)}" target="_blank" rel="noopener">Avise-me quando chegar</a>
        ${cfg.shipping.pickup.enabled ? ` ou escolha <b>${esc(cfg.shipping.pickup.label)}</b>.` : ""}</span></div>`;
    }
    const t = ZP.pricing.compute({ shipping: q.price });
    const price = data.mode === "pickup" || t.shipping === 0 ? "<b class='ok'>Grátis</b>" : `<b>${brl(t.shipping)}</b>`;
    return `${icon(data.mode === "pickup" ? "store" : "truck")} <span>${esc(q.name)}: ${price} · ${esc(q.days)}</span>`;
  }

  function summaryHTML() {
    const t = totals();
    return `
      <h4>Resumo</h4>
      <ul class="co-sum__items">${t.lines.map((l) => `
        <li><span class="co-sum__img" style="--tint:${ZP.catById(l.p.cat).tint}">${ZP.art.product(l.p)}<i>${l.qty}</i></span>
        <span class="co-sum__name">${esc(l.p.name)}<small>${l.variant.label}</small></span><b>${brl(l.total)}</b></li>`).join("")}</ul>
      <dl class="summary">
        <div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>
        ${t.discount ? `<div class="summary__save"><dt>Cupom ${esc(t.coupon.code)}</dt><dd>− ${brl(t.discount)}</dd></div>` : ""}
        ${t.pix ? `<div class="summary__save"><dt>Desconto Pix</dt><dd>− ${brl(t.pix)}</dd></div>` : ""}
        <div><dt>Frete</dt><dd>${t.shipping == null ? "—" : t.shipping === 0 ? "<b class='ok'>Grátis</b>" : brl(t.shipping)}</dd></div>
        <div class="summary__total"><dt>Total</dt><dd>${brl(t.total)}</dd></div>
      </dl>`;
  }

  function refreshQuote() {
    const box = $("#shipQuote");
    if (box) box.innerHTML = shipQuoteHTML(quote());
    $("#coSummary").innerHTML = summaryHTML();
  }

  function render() {
    const last = step === STEPS.length - 1;
    $("#checkoutContent").innerHTML = `
      <ol class="co-steps" aria-label="Etapas do checkout">
        ${STEPS.map((s, i) => `<li class="${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}" ${i === step ? 'aria-current="step"' : ""}>
          <span>${i < step ? icon("check") : i + 1}</span><b>${s}</b></li>`).join("")}
      </ol>
      <div class="co">
        <form class="co__form" id="coForm" novalidate>
          ${views[step]()}
          <div class="co__nav">
            ${step > 0 ? `<button type="button" class="btn btn--ghost" data-co-back>${icon("arrow-left")} Voltar</button>` : `<button type="button" class="btn btn--ghost" data-close>Voltar à sacola</button>`}
            <button class="btn btn--lg ${last ? "btn--whatsapp" : "btn--primary"}">${last ? `${icon("whatsapp")} Finalizar no WhatsApp` : `Continuar ${icon("arrow-right")}`}</button>
          </div>
        </form>
        <aside class="co-sum" id="coSummary">${summaryHTML()}</aside>
      </div>`;
    const first = $("#coForm input:not([type=radio]):not([type=checkbox]), #coForm select");
    if (first && !first.value && step < 2) setTimeout(() => first.focus(), 80);
  }

  /* ---------- Validação ---------- */
  function setError(name, msg) {
    const input = $(`#co-${name}`);
    const f = input && input.closest(".field");
    const out = f && $(".field__error", f);
    if (!out) return;
    f.classList.toggle("is-error", !!msg);
    out.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate() {
    const errors = {};
    if (step === 0) {
      if (data.name.trim().split(/\s+/).length < 2) errors.name = "Informe nome e sobrenome.";
      if (onlyDigits(data.phone).length < 10) errors.phone = "WhatsApp inválido. Use DDD + número.";
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "E-mail inválido.";
    }
    if (step === 1 && data.mode === "delivery") {
      if (onlyDigits(data.cep).length !== 8) errors.cep = "CEP deve ter 8 dígitos.";
      ["street", "number", "district", "city"].forEach((k) => { if (!data[k].trim()) errors[k] = "Campo obrigatório."; });
      if (!UFS.includes(data.uf)) errors.uf = "Selecione o estado.";
      const q = quote();
      if (!errors.cep && q && q.outside) errors.cep = `Ainda não entregamos nesta região (só ${area.label}).`;
    }
    Object.keys(data).forEach((k) => setError(k, errors[k]));
    if (step === 2 && !$("#co-consent").checked) {
      $("#consentError").textContent = "Confirme que leu as políticas para finalizar.";
      $("#co-consent").focus();
      return false;
    }
    const firstError = Object.keys(errors)[0];
    if (firstError) $(`#co-${firstError}`).focus();
    return !firstError;
  }

  /* ---------- CEP ---------- */
  async function lookupCep() {
    const cep = onlyDigits(data.cep);
    if (cep.length !== 8) return;
    const status = (msg) => { cepStatus = msg; const el = $("#cepStatus"); if (el) el.textContent = msg; };
    status("Buscando endereço...");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const r = await res.json();
      if (r.erro) throw new Error();
      Object.assign(data, { street: r.logradouro || data.street, district: r.bairro || data.district, city: r.localidade, uf: r.uf });
      cepStatus = area.ufs.includes(r.uf) ? "Endereço encontrado ✓" : "";
      render();
      $(data.street ? "#co-number" : "#co-street").focus();
    } catch {
      status("Não encontramos o CEP. Preencha o endereço manualmente.");
    }
  }

  /* ---------- Pedido ---------- */
  function orderMessage(id) {
    const t = totals();
    const q = quote();
    const lines = t.lines.map((l) => `• ${l.qty}x ${l.p.name} (${l.variant.label}) — ${brl(l.total)}`).join("\n");
    const ship = data.mode === "pickup" ? "Retirada na loja (grátis)" : t.shipping === 0 ? `Grátis — ${q.name} (${q.days})` : `${brl(t.shipping)} — ${q.name} (${q.days})`;
    const pay = PAYMENTS[data.payment].label + (data.payment === "cash" && data.change ? ` (troco para ${data.change})` : "");
    const address = data.mode === "pickup" ? "Vou retirar na loja" :
      `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ""}\n${data.district} — ${data.city}/${data.uf}\nCEP ${data.cep}`;

    return [
      `Olá, ${cfg.store.name}! 🐾 Quero finalizar meu pedido:`,
      "",
      `*Pedido ${id}*`,
      lines,
      "",
      `Subtotal: ${brl(t.subtotal)}`,
      t.discount ? `Cupom ${t.coupon.code}: −${brl(t.discount)}` : null,
      t.pix ? `Desconto Pix: −${brl(t.pix)}` : null,
      `Frete: ${ship}`,
      `*Total: ${brl(t.total)}*`,
      "",
      `*Forma de pagamento preferida:* ${pay}`,
      "",
      "*Meus dados*",
      data.name,
      data.phone,
      data.email || null,
      "",
      "*Entrega*",
      address,
      data.notes ? `\n*Observações:* ${data.notes}` : null,
    ].filter((x) => x !== null).join("\n");
  }

  // Abre o WhatsApp da loja: no celular vai direto para o app; no computador, abre em nova aba
  function openWhatsApp(url) {
    const mobile = matchMedia("(pointer: coarse)").matches;
    if (mobile) { location.href = url; return; }
    const w = window.open(url, "_blank");
    if (w) w.opener = null;
    else location.href = url;
  }

  function submitOrder() {
    const id = "PT-" + Date.now().toString(36).slice(-6).toUpperCase();
    const total = totals().total;
    const url = waLink(orderMessage(id));
    ZP.store.clear();
    $("#checkoutContent").innerHTML = `
      <div class="co-done">
        <span class="co-done__icon">💬</span>
        <h2>Quase lá! Finalize no WhatsApp</h2>
        <p>Abrimos o WhatsApp da <b>${esc(cfg.store.name)}</b> com o seu pedido <b>${id}</b> (${brl(total)}) já escrito.<br>
        <b>Toque em enviar</b> e a nossa equipe confirma o frete, o pagamento e o prazo com você.</p>
        <a class="btn btn--whatsapp btn--lg" href="${url}" target="_blank" rel="noopener">${icon("whatsapp")} Abrir o WhatsApp de novo</a>
        <button class="link-btn" data-close>Voltar para a loja</button>
      </div>`;
    openWhatsApp(url);
  }

  /* ---------- Eventos ---------- */
  function bind() {
    const root = $("#checkoutContent");

    root.addEventListener("input", (e) => {
      const el = e.target;
      if (!el.name || el.type === "radio" || el.type === "checkbox") return;
      if (el.name === "phone") el.value = maskPhone(el.value);
      if (el.name === "cep") el.value = maskCep(el.value);
      data[el.name] = el.value;
      if (el.closest(".field")?.classList.contains("is-error")) setError(el.name, "");
      if (el.name === "cep" && onlyDigits(el.value).length === 8) lookupCep();
      if (el.name === "uf" || el.name === "city") refreshQuote();
    });

    root.addEventListener("change", (e) => {
      const el = e.target;
      if (el.type === "radio") {
        data[el.name] = el.value;
        render();
        $(`#coForm input[name="${el.name}"][value="${el.value}"]`)?.focus();
      }
      if (el.id === "co-consent") $("#consentError").textContent = "";
    });

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-co-back]")) { step--; render(); }
      const go = e.target.closest("[data-go-step]");
      if (go) { step = +go.dataset.goStep; render(); }
    });

    root.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      storage.set("customer", { ...data, notes: "" });
      if (step < STEPS.length - 1) { step++; render(); $(".layer__panel", $("#checkoutLayer")).scrollTop = 0; }
      else submitOrder();
    });
  }

  ZP.checkout = {
    init: bind,
    open() {
      if (!ZP.store.state.cart.length) { toast("Sua sacola está vazia.", "error"); return; }
      step = 0;
      render();
      closeLayer("#cartLayer");
      openLayer("#checkoutLayer");
    },
  };
})(window.ZP);
