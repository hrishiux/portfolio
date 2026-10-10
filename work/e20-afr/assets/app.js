/* Lambda & E20 — charts and page logic.
   Plain D3 v7, no build step. Every number comes from window.AFR (data/afr-data.js).
   Charts redraw on resize and on fuel change; colours come from CSS tokens, so theme
   switches need no redraw. Every chart has a keyboard path and a table twin. */
(function () {
  "use strict";

  const D = window.AFR;
  if (!D || !window.d3) {
    document.querySelectorAll(".chart, .pair, .ornl").forEach(n => {
      n.textContent = "The chart library did not load. The numbers are in each chart's table and in the sources section.";
    });
    return;
  }
  const d3 = window.d3;

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const NF = {};
  const fmt = (v, d = 1) => {
    const k = String(d);
    NF[k] = NF[k] || new Intl.NumberFormat("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
    return NF[k].format(v);
  };
  const pct = v => String(Math.round(v * 100) / 100);
  const SRC = new Map(D.sources.map((s, i) => [s.id, Object.assign({ n: i + 1 }, s)]));
  const VEH = new Map(D.vehicles.map(v => [v.id, v]));
  const KIND_LABEL = { measured: "Measured", oem: "Manufacturer", gap: "Not found", statement: "Statement", published: "Published", calculated: "Calculated", digitised: "Digitised", relative: "Close relative", owner: "Owner" };

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    kids.flat().forEach(c => { if (c != null) n.append(c); });
    return n;
  }

  function refs(ids) {
    const f = document.createDocumentFragment();
    String(ids || "").split(/\s+/).filter(Boolean).forEach(id => {
      const s = SRC.get(id);
      if (!s) return;
      f.append(h("a", { class: "ref", href: "#src-" + id, title: s.short, "aria-label": "Source " + s.n + ": " + s.short, text: "[" + s.n + "]" }));
    });
    return f;
  }

  function chip(kind) { return h("span", { class: "chip chip--" + kind, text: KIND_LABEL[kind] || kind }); }

  function shapeKey(v) { return h("span", { class: "key key--shape key--s" + v.slot, "data-shape": v.shape, "aria-hidden": "true" }); }

  const SYMBOL = { circle: d3.symbolCircle, square: d3.symbolSquare, triangle: d3.symbolTriangle };
  const symbolPath = (shape, size) => d3.symbol().type(SYMBOL[shape] || d3.symbolCircle).size(size)();

  function stoichAt(pct) {
    const s = D.stoich, f = pct / 100;
    const w = (s.rhoEthanol * f) / (s.rhoEthanol * f + s.rhoPetrol * (1 - f));
    return w * s.ethanol + (1 - w) * s.petrol;
  }
  function fuelStoich(id) {
    const f = D.fuels.find(x => x.id === id);
    const pub = D.stoich.published.find(p => p.ethanol === f.ethanol);
    return pub ? { afr: pub.afr, kind: "published", src: pub.src, ethanol: f.ethanol } : { afr: stoichAt(f.ethanol), kind: "calculated", ethanol: f.ethanol };
  }

  /* tooltip: one per chart, values lead and labels follow, text only */
  function makeTip(container) {
    const tip = h("div", { class: "tip", role: "presentation" });
    tip.hidden = true;
    container.append(tip);
    return {
      show(x, y, rows) {
        tip.replaceChildren();
        rows.forEach((r, i) => {
          if (r.value != null) tip.append(h("span", { class: "tip__v", text: r.value }));
          if (r.label != null) {
            const l = h("span", { class: "tip__l" });
            if (r.key) l.append(r.key, " ");
            l.append(r.label);
            tip.append(l);
          }
          if (r.row) tip.append(r.row);
          if (i < rows.length - 1 && r.gap) tip.append(h("span", { class: "tip__l", text: " " }));
        });
        tip.hidden = false;
        const cw = container.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
        const left = Math.max(tw / 2 + 2, Math.min(cw - tw / 2 - 2, x));
        tip.style.left = left + "px";
        tip.style.top = y + "px";
        tip.style.transform = y - th - 14 < 0 ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 12px))";
      },
      hide() { tip.hidden = true; }
    };
  }

  function lineKey(cls) { return h("span", { class: "key key--line", style: "background:var(--" + cls + ")" }); }

  /* responsive registry */
  const charts = [];
  function register(container, render) {
    const c = { el: container, render, w: 0 };
    charts.push(c);
    const ro = new ResizeObserver(() => {
      const w = Math.floor(container.clientWidth);
      if (w > 0 && Math.abs(w - c.w) > 2) { c.w = w; render(w); }
    });
    ro.observe(container);
    const w0 = Math.floor(container.clientWidth);
    if (w0 > 0) { c.w = w0; render(w0); }
    return c;
  }
  const redraw = c => { if (c && c.w) c.render(c.w); };

  /* widest of some labels as the chart's CSS sets them, so label columns fit whatever the look's type is */
  function textWidth(el, specs) {
    const s = d3.select(el).append("svg").attr("width", 0).attr("height", 0).attr("aria-hidden", "true")
      .style("position", "absolute").style("visibility", "hidden");
    let max = 0;
    specs.forEach(([cls, str]) => { max = Math.max(max, s.append("text").attr("class", cls).text(str).node().getComputedTextLength()); });
    s.remove();
    return Math.ceil(max);
  }

  /* shorten a label with an ellipsis if it is wider than maxW; the full text stays in the table and tooltip */
  function fitText(sel, maxW) {
    const n = sel.node(), full = n.textContent;
    let s = full;
    while (s.length > 4 && n.getComputedTextLength() > maxW) { s = s.slice(0, -2).trimEnd(); n.textContent = s + "…"; }
    return sel;
  }

  function svgIn(el, w, hgt, label) {
    d3.select(el).selectAll("svg").remove();
    return d3.select(el).append("svg")
      .attr("viewBox", `0 0 ${w} ${hgt}`)
      .attr("width", w).attr("height", hgt)
      .attr("role", "img")
      .attr("aria-label", label);
  }

  function table(target, head, rows, numCols = []) {
    const t = h("table");
    const tr = h("tr");
    head.forEach((c, i) => tr.append(h("th", { scope: "col", class: numCols.includes(i) ? "num" : null, text: c })));
    t.append(h("thead", null, tr));
    const tb = h("tbody");
    rows.forEach(r => {
      const row = h("tr");
      r.forEach((c, i) => row.append(h("td", { class: numCols.includes(i) ? "num" : null, text: c == null ? "–" : String(c) })));
      tb.append(row);
    });
    t.append(tb);
    $(target).replaceChildren(t);
  }

  function keyStepper(node, opts) {
    // opts: { get, set, step, big, min, max, leave }
    node.attr("tabindex", 0)
      .on("keydown", ev => {
        const k = ev.key;
        if (k === "ArrowRight" || k === "ArrowLeft") {
          ev.preventDefault();
          const s = (ev.shiftKey ? opts.big : opts.step) * (k === "ArrowRight" ? 1 : -1);
          const cur = opts.get();
          opts.set(Math.max(opts.min, Math.min(opts.max, (cur == null ? opts.start : cur) + s)));
        } else if (k === "Home") { ev.preventDefault(); opts.set(opts.min); }
        else if (k === "End") { ev.preventDefault(); opts.set(opts.max); }
        else if (k === "Escape") { opts.leave(); }
      })
      .on("focus", () => { if (opts.get() == null) opts.set(opts.start); })
      .on("blur", () => opts.leave());
  }

  /* ---------- state: fuel ---------- */
  const state = { fuel: "E20" };
  const onFuel = [];
  function setFuel(id) {
    state.fuel = id;
    document.querySelectorAll(".seg input").forEach(i => { i.checked = i.value === id; });
    onFuel.forEach(fn => fn());
  }
  function buildSeg(fieldset, name) {
    D.fuels.forEach(f => {
      const id = name + "-" + f.id;
      const input = h("input", { type: "radio", name, id, value: f.id });
      input.checked = f.id === state.fuel;
      input.addEventListener("change", () => setFuel(f.id));
      fieldset.append(input, h("label", { for: id, text: f.id, title: f.name }));
    });
  }

  function updateGauge() {
    const r = fuelStoich(state.fuel);
    $("#gauge-afr").textContent = fmt(r.afr, 1);
    $("#gauge-fuel").textContent = state.fuel === "E0" ? "petrol (E0)" : state.fuel;
    const tag = $("#gauge-tag");
    tag.textContent = r.kind;
    tag.className = "tag" + (r.kind === "published" ? " tag--published" : "");
    tag.title = r.kind === "published" ? "Published by " + SRC.get(r.src).short : "Calculated: mass-weighted blend, see Method";
  }

  /* =====================================================================
     1. Stoichiometric AFR by ethanol content
     ===================================================================== */
  function renderStoich(w) {
    const el = $("#chart-stoich");
    const hgt = w < 520 ? 290 : 340;
    const m = { t: 40, r: 16, b: 44, l: 42 };
    const x = d3.scaleLinear([0, 100], [m.l, w - m.r]);
    const y = d3.scaleLinear([8, 15], [hgt - m.b, m.t]);
    const sel = fuelStoich(state.fuel);
    const svg = svgIn(el, w, hgt, `Line chart. Stoichiometric air-fuel ratio falls from 14.7 to 1 for petrol to 9.0 to 1 for E98. Selected: ${state.fuel} at ${fmt(sel.afr, 1)} to 1, ${sel.kind}.`)
      .attr("aria-describedby", "chart-stoich-read");

    const yt = [9, 10, 11, 12, 13, 14, 15];
    svg.append("g").attr("class", "grid").selectAll("line").data(yt).join("line")
      .attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").selectAll("text").data(yt).join("text")
      .attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d);
    svg.append("text").attr("x", m.l - 8).attr("y", 12).attr("text-anchor", "start").attr("class", "t-ink2")
      .text("kg of air per kg of fuel");

    const xt = [0, 20, 40, 60, 80, 100];
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
    svg.append("g").selectAll("text").data(xt).join("text")
      .attr("x", d => x(d)).attr("y", hgt - m.b + 18).attr("text-anchor", (d, i) => i === 0 ? "start" : i === xt.length - 1 ? "end" : "middle").text(d => d + "%");
    svg.append("text").attr("x", w - m.r).attr("y", hgt - 6).attr("text-anchor", "end").attr("class", "t-ink2").text("ethanol, % by volume");

    const pts = d3.range(0, 101, 1).map(v => [v, stoichAt(v)]);
    svg.append("path").attr("class", "line-ink").attr("d", d3.line().x(d => x(d[0])).y(d => y(d[1]))(pts));

    // selected fuel
    const sx = x(sel.ethanol), sy = y(sel.afr);
    svg.append("line").attr("class", "refline").attr("x1", sx).attr("x2", sx).attr("y1", sy).attr("y2", hgt - m.b);
    svg.append("circle").attr("class", "ring-accent").attr("cx", sx).attr("cy", sy).attr("r", 7.5);

    // published values
    const lab = {
      0: { dx: 10, dy: -12, anchor: "start" },
      10: { dx: 0, dy: 24, anchor: "middle" },
      85: { dx: -10, dy: 20, anchor: "end" },
      98: { dx: -10, dy: 20, anchor: "end" }
    };
    D.stoich.published.forEach(p => {
      svg.append("circle").attr("class", "dot-ink").attr("cx", x(p.ethanol)).attr("cy", y(p.afr)).attr("r", 5);
      const L = lab[p.ethanol];
      svg.append("text").attr("class", "t-strong halo").attr("x", x(p.ethanol) + L.dx).attr("y", y(p.afr) + L.dy).attr("text-anchor", L.anchor)
        .text(`${p.ethanol === 0 ? "E0" : p.label} · ${fmt(p.afr, 1)}`);
    });
    if (sel.kind === "calculated") {
      const nar = w < 520;
      svg.append("text").attr("class", "t-strong halo").attr("x", sx + 12).attr("y", sy - 12)
        .text(`${state.fuel} · ${fmt(sel.afr, 2)}${nar ? "" : " calculated"}`);
    }

    // cursor layer
    const tip = el.__tip || (el.__tip = makeTip(el));
    const cursor = svg.append("g").style("display", "none");
    cursor.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", hgt - m.b);
    const cdot = cursor.append("circle").attr("r", 4).attr("class", "dot-ink");
    let cur = null;
    const read = $("#chart-stoich-read");
    function show(v) {
      cur = v;
      const a = stoichAt(v);
      const pub = D.stoich.published.find(p => p.ethanol === v);
      cursor.style("display", null);
      cursor.select("line").attr("x1", x(v)).attr("x2", x(v));
      cdot.attr("cx", x(v)).attr("cy", y(a));
      const rows = [{ value: `${fmt(a, 2)} : 1`, label: `${v}% ethanol · calculated` }];
      if (pub) rows.push({ value: null, label: `Published: ${fmt(pub.afr, 1)} (${SRC.get(pub.src).short})` });
      tip.show(x(v), y(a), rows);
      read.textContent = `${v}% ethanol: ${fmt(a, 2)} to 1 calculated${pub ? `, ${fmt(pub.afr, 1)} published` : ""}.`;
    }
    function leave() { cur = null; cursor.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", hgt - m.t - m.b)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.round(Math.max(0, Math.min(100, x.invert(px))))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 1, big: 10, min: 0, max: 100, start: sel.ethanol, leave });
  }

  function tableStoich() {
    const rows = D.stoich.published.map(p => [p.label, p.ethanol, fmt(p.afr, 1), "published", SRC.get(p.src).short]);
    [0, 5, 10, 15, 20, 25, 30, 50, 85, 100].forEach(v => rows.push([`E${v}`, v, fmt(stoichAt(v), 2), "calculated", "Method: mass-weighted blend"]));
    table("#table-stoich", ["Fuel", "Ethanol, % vol", "Stoichiometric AFR", "Kind", "Source"], rows, [1, 2]);
  }

  /* =====================================================================
     2. Lambda ruler with AFR scale for the chosen fuel
     ===================================================================== */
  function renderRuler(w) {
    const el = $("#chart-ruler");
    const narrow = w < 600;
    const labelW = narrow ? 0 : 176;
    const rowH = narrow ? 48 : 36;
    const rows = D.targets;
    const m = { t: 40, r: 18, b: narrow ? 86 : 70, l: 10 + labelW };
    const hgt = m.t + rows.length * rowH + m.b;
    const x = d3.scaleLinear([0.75, 1.10], [m.l, w - m.r]);
    const st = fuelStoich(state.fuel);
    const svg = svgIn(el, w, hgt, `Lambda ruler from 0.75 to 1.10 with reference targets. Turbo full throttle 0.82 to 0.85, non-turbo full throttle 0.85 to 0.92, idle and cruise 1.00, best economy about 1.05. AFR scale shown for ${state.fuel}.`)
      .attr("aria-describedby", "chart-ruler-read");

    const ticks = d3.range(0.75, 1.1001, 0.05);
    svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line")
      .attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.t - 6).attr("y2", hgt - m.b);

    // richer / leaner
    svg.append("text").attr("class", "t-ink2").attr("x", m.l).attr("y", 14).text("← richer, more fuel");
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", 14).attr("text-anchor", "end").text("leaner, more air →");

    // stoichiometric line
    svg.append("line").attr("class", "refline").attr("x1", x(1)).attr("x2", x(1)).attr("y1", m.t - 14).attr("y2", hgt - m.b);
    svg.append("text").attr("class", "t-strong halo").attr("x", x(1) + 6).attr("y", m.t - 6).text("λ 1");

    rows.forEach((r, i) => {
      const y0 = m.t + i * rowH;
      const yc = narrow ? y0 + 30 : y0 + rowH / 2;
      if (narrow) svg.append("text").attr("class", "t-sans").attr("x", m.l).attr("y", y0 + 14).text(r.label);
      else svg.append("text").attr("class", "t-sans").attr("x", m.l - 14).attr("y", yc).attr("dy", "0.35em").attr("text-anchor", "end").text(r.label);
      if (r.hi > r.lo) {
        svg.append("rect").attr("class", "bar-range").attr("x", x(r.lo)).attr("y", yc - 5).attr("width", x(r.hi) - x(r.lo)).attr("height", 10).attr("rx", 5);
        svg.append("text").attr("class", "t-strong halo").attr("x", x(r.hi) + 8).attr("y", yc).attr("dy", "0.35em").text(`${fmt(r.lo, 2)}–${fmt(r.hi, 2)}`);
      } else {
        svg.append("circle").attr("class", r.approx ? "ring-ink" : "dot-ink").attr("cx", x(r.lo)).attr("cy", yc).attr("r", 5.5);
        svg.append("text").attr("class", "t-strong halo").attr("x", x(r.lo) + 10).attr("y", yc).attr("dy", "0.35em").text(`${r.approx ? "≈ " : ""}${fmt(r.lo, 2)}`);
      }
    });

    // two scales: lambda, and AFR for the chosen fuel
    const ay = hgt - m.b;
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", ay).attr("y2", ay);
    const every = w < 420 ? 2 : 1;
    const tl = ticks.filter((d, i) => i % every === 0);
    svg.append("g").selectAll("text").data(tl).join("text").attr("class", "t-strong")
      .attr("x", d => x(d)).attr("y", ay + 18).attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => fmt(d, 2));
    svg.append("g").selectAll("text").data(tl).join("text")
      .attr("x", d => x(d)).attr("y", ay + 40).attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => fmt(d * st.afr, 1));
    const lx = narrow ? m.l : m.l - 14, la = narrow ? "start" : "end";
    if (narrow) {
      svg.append("text").attr("class", "t-ink2").attr("x", m.l).attr("y", ay + 62).text(`top: λ · below: AFR on ${state.fuel}`);
      svg.append("text").attr("class", "t-ink2").attr("x", m.l).attr("y", ay + 78).text(`${fmt(st.afr, st.kind === "calculated" ? 2 : 1)} : 1 at λ 1, ${st.kind}`);
    } else {
      svg.append("text").attr("class", "t-sans").attr("x", lx).attr("y", ay + 18).attr("text-anchor", la).text("λ");
      svg.append("text").attr("class", "t-sans").attr("x", lx).attr("y", ay + 40).attr("text-anchor", la).text(`AFR on ${state.fuel}`);
      svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", ay + 62).attr("text-anchor", "end").text(`${st.kind}: ${fmt(st.afr, st.kind === "calculated" ? 2 : 1)} : 1 at λ 1`);
    }

    // cursor
    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t - 10).attr("y2", ay);
    let cur = null;
    const read = $("#chart-ruler-read");
    function show(l) {
      l = Math.round(l * 100) / 100;
      cur = l;
      g.style("display", null);
      g.select("line").attr("x1", x(l)).attr("x2", x(l));
      const afr = l * st.afr;
      tip.show(x(l), m.t, [{ value: `λ ${fmt(l, 2)}`, label: `${fmt(afr, 1)} : 1 on ${state.fuel} · ${fmt(l * 14.7, 1)} on a petrol-scale gauge` }]);
      read.textContent = `λ ${fmt(l, 2)} is ${fmt(afr, 1)} to 1 on ${state.fuel}; a petrol-scale gauge shows ${fmt(l * 14.7, 1)}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t - 14).attr("width", w - m.l - m.r).attr("height", ay - m.t + 14)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(0.75, Math.min(1.10, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 0.01, big: 0.05, min: 0.75, max: 1.10, start: 1.0, leave });
  }

  function tableRuler() {
    const rows = D.targets.map(r => [r.label, r.hi > r.lo ? `${fmt(r.lo, 2)}–${fmt(r.hi, 2)}` : `${r.approx ? "≈ " : ""}${fmt(r.lo, 2)}`,
      ...D.fuels.map(f => { const a = fuelStoich(f.id).afr; return r.hi > r.lo ? `${fmt(r.lo * a, 1)}–${fmt(r.hi * a, 1)}` : fmt(r.lo * a, 1); })]);
    table("#table-ruler", ["Target", "λ", ...D.fuels.map(f => "AFR on " + f.id)], rows);
  }

  /* =====================================================================
     3. Vehicle cards
     ===================================================================== */
  function buildCards() {
    const wrap = $("#vehicle-cards");
    D.vehicles.forEach(v => {
      const dl = h("dl", { class: "specs" });
      v.specs.forEach(([k, val, s]) => { dl.append(h("dt", { text: k }), h("dd", null, val, refs(s))); });
      const card = h("article", { class: "card", "aria-labelledby": "card-" + v.id },
        h("div", { class: "card__top" }, shapeKey(v), h("h3", { class: "card__name", id: "card-" + v.id, text: v.name })),
        h("p", { class: "card__aka", text: v.aka }),
        h("p", { class: "card__type", text: v.type }),
        dl);
      const ev = h("div", { class: "card__evidence" });
      if (v.id === "octavia") {
        ev.append("Audi's training manual for this engine family: mixture set to ", h("span", { class: "lambda-glyph", text: "λ" }), " 1 in all operating ranges except directly after a start.", refs("ssp384"));
      } else if (v.id === "sy416") {
        ev.append("No public mixture data found for the G16B or its G13 siblings. A stock dyno run of this model is charted below.", refs("rd"));
      } else {
        ev.append("Stock against aftermarket ECU on a Dynojet 250i, Jakarta, 2012.", refs("mp"));
        const t = h("table", { class: "mini" });
        t.append(h("thead", null, h("tr", null, h("th", { text: "" }), h("th", { text: "AFR" }), h("th", { text: "Peak" }), h("th", { text: "Limiter" }))));
        const tb = h("tbody");
        D.cbrDyno.rows.forEach(r => tb.append(h("tr", null, h("td", { text: r.setup }), h("td", { text: r.afr }), h("td", { text: fmt(r.hp, 2) + " hp" }), h("td", { text: fmt(r.limiter, 0) }))));
        t.append(tb);
        ev.append(t);
      }
      card.append(ev);
      wrap.append(card);
    });
  }

  /* =====================================================================
     4. SY416 dyno, small multiples sharing rpm
     ===================================================================== */
  function renderDyno(w) {
    const el = $("#chart-dyno");
    const rows = D.balenoDyno.rows.map(r => ({ rpm: r[0], nm: r[1], hp: r[2] }));
    const ph = w < 520 ? 128 : 150, gap = 44;
    const m = { t: 28, r: 18, b: 40, l: 42 };
    const hgt = m.t + ph + gap + ph + m.b;
    const x = d3.scaleLinear([1800, 6800], [m.l, w - m.r]);
    const top2 = m.t + ph + gap;
    const yT = d3.scaleLinear([50, 110], [m.t + ph, m.t]);
    const yP = d3.scaleLinear([0, 80], [top2 + ph, top2]);
    const svg = svgIn(el, w, hgt, "Two line charts sharing an rpm axis. Wheel torque peaks near 106.8 newton metres around 2,900 to 3,000 rpm; wheel power peaks near 71.2 hp around 5,500 rpm.")
      .attr("aria-describedby", "chart-dyno-read");

    function panel(y, ticks, title, top) {
      svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line")
        .attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(ticks).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d);
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", top - 12).text(title);
    }
    panel(yT, [60, 80, 100], "Torque at the wheels, N·m", m.t);
    panel(yP, [0, 20, 40, 60, 80], "Power at the wheels, hp", top2);

    svg.append("path").attr("class", "s2-line").attr("d", d3.line().x(d => x(d.rpm)).y(d => yT(d.nm))(rows));
    svg.append("path").attr("class", "s2-line").attr("d", d3.line().x(d => x(d.rpm)).y(d => yP(d.hp))(rows));

    const pT = rows.reduce((a, b) => (b.nm > a.nm ? b : a));
    const pP = rows.reduce((a, b) => (b.hp > a.hp ? b : a));
    svg.append("circle").attr("class", "s2-fill mark").attr("cx", x(pT.rpm)).attr("cy", yT(pT.nm)).attr("r", 4.5);
    // drop the torque label under its point when the panel title would run into it
    const below = w < 560 || x(pT.rpm) + 10 < m.l - 8 + textWidth(el, [["t-sans-strong", "Torque at the wheels, N·m"]]) + 8;
    svg.append("text").attr("class", "t-strong halo").attr("x", x(pT.rpm) + 10).attr("y", below ? yT(pT.nm) + 20 : yT(pT.nm) - 10).text(`${fmt(D.balenoDyno.published.nm, 2)} N·m peak${w < 560 ? "" : ", as printed"}`);
    svg.append("circle").attr("class", "s2-fill mark").attr("cx", x(pP.rpm)).attr("cy", yP(pP.hp)).attr("r", 4.5);
    svg.append("text").attr("class", "t-strong halo").attr("x", x(pP.rpm)).attr("y", yP(pP.hp) - 12).attr("text-anchor", w < 560 ? "end" : "middle").text(`${fmt(D.balenoDyno.published.whp, 2)} hp peak${w < 560 ? "" : ", as printed"}`);

    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", top2 + ph).attr("y2", top2 + ph);
    const xt = [2000, 3000, 4000, 5000, 6000];
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", top2 + ph + 18).attr("text-anchor", "middle").text(d => fmt(d, 0));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("engine speed, rpm");

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", top2 + ph);
    const d1 = g.append("circle").attr("r", 4).attr("class", "s2-fill mark");
    const d2 = g.append("circle").attr("r", 4).attr("class", "s2-fill mark");
    let cur = null;
    const read = $("#chart-dyno-read");
    function show(rpm) {
      rpm = Math.round(rpm / 100) * 100;
      const r = rows.find(d => d.rpm === rpm);
      if (!r) return;
      cur = rpm;
      g.style("display", null);
      g.select("line").attr("x1", x(rpm)).attr("x2", x(rpm));
      d1.attr("cx", x(rpm)).attr("cy", yT(r.nm));
      d2.attr("cx", x(rpm)).attr("cy", yP(r.hp));
      tip.show(x(rpm), m.t + ph + gap / 2, [{ value: `${fmt(r.nm, 1)} N·m · ${fmt(r.hp, 1)} hp`, label: `${fmt(rpm, 0)} rpm, digitised` }]);
      read.textContent = `${fmt(rpm, 0)} rpm: ${fmt(r.nm, 1)} newton metres and ${fmt(r.hp, 1)} horsepower at the wheels, digitised.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", top2 + ph - m.t)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(1800, Math.min(6800, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 100, big: 500, min: 1800, max: 6800, start: 3000, leave });
  }

  function tableDyno() {
    table("#table-dyno", ["rpm", "Wheel torque, N·m", "Wheel power, hp"], D.balenoDyno.rows.map(r => [fmt(r[0], 0), fmt(r[1], 1), fmt(r[2], 1)]), [0, 1, 2]);
  }

  /* =====================================================================
     5. Evidence matrix
     ===================================================================== */
  function buildMatrix() {
    const t = $("#matrix");
    const hr = h("tr", null, h("th", { scope: "col", text: "Vehicle" }));
    D.regions.forEach(r => hr.append(h("th", { scope: "col", text: r })));
    t.append(h("thead", null, hr));
    const tb = h("tbody");
    D.vehicles.forEach(v => {
      const tr = h("tr", null, h("th", { scope: "row" }, shapeKey(v), v.name));
      D.evidence[v.id].forEach(c => {
        const td = h("td", { class: c.kind === "gap" ? "cell--gap" : null }, chip(c.kind), h("br"));
        td.append(c.text);
        if (c.src) td.append(refs(c.src));
        tr.append(td);
      });
      tb.append(tr);
    });
    t.append(tb);
  }

  /* =====================================================================
     6. Full throttle lambda
     ===================================================================== */
  function renderWot(w) {
    const el = $("#chart-wot");
    const rows = D.fullThrottle;
    const labelFit = textWidth(el, rows.flatMap(r => [["t-sans-strong", r.label], ["t-sans", KIND_LABEL[r.kind]]])) + 26;
    const narrow = w < 620 || labelFit > w * 0.42;
    const labelW = narrow ? 0 : Math.max(150, labelFit);
    const rowH = narrow ? 62 : 50;
    const m = { t: 52, r: 18, b: 40, l: 10 + labelW };
    const hgt = m.t + rows.length * rowH + m.b;
    const x = d3.scaleLinear([0.70, 1.10], [m.l, w - m.r]);
    const svg = svgIn(el, w, hgt, "Dot and range chart of full-throttle lambda. Octavia 1.00 per Audi's manual; its predecessor the 1.8T 20-valve 0.79 to 0.93 on a stock map and 0.75 to 0.91 chipped; a stock EA888 Gen 3 2.0 0.92 to 1.02, the same on Stage 1 0.80 to 0.86, a Gen 3 1.8 on Stage 1 0.80 to 0.85. Suzuki SY416 no public measurement; a VW 1.6 non-turbo 0.80 to 0.93, a Honda 1.8 non-turbo about 0.82, a Mazda MX-5 about 11 to 1 by 6,000 rpm. CBR250R stock about 0.95, with a Vortex ECU about 0.82.");

    const turbo = D.targets.find(t => t.id === "turbo"), na = D.targets.find(t => t.id === "na");
    svg.append("rect").attr("class", "band").attr("x", x(turbo.lo)).attr("width", x(turbo.hi) - x(turbo.lo)).attr("y", m.t - 4).attr("height", hgt - m.b - m.t + 4);
    svg.append("rect").attr("class", "band-soft").attr("x", x(na.lo)).attr("width", x(na.hi) - x(na.lo)).attr("y", m.t - 4).attr("height", hgt - m.b - m.t + 4);
    svg.append("text").attr("class", "t-ink2").attr("x", x((turbo.lo + turbo.hi) / 2)).attr("y", m.t - 30).attr("text-anchor", "middle").text("turbo target");
    svg.append("text").attr("class", "t-ink2").attr("x", x((na.lo + na.hi) / 2)).attr("y", m.t - 14).attr("text-anchor", "middle").text("non-turbo target");
    svg.append("line").attr("class", "refline").attr("x1", x(1)).attr("x2", x(1)).attr("y1", m.t - 22).attr("y2", hgt - m.b);
    svg.append("text").attr("class", "t-strong halo").attr("x", x(1) + 6).attr("y", m.t - 14).text("λ 1");

    const tip = el.__tip || (el.__tip = makeTip(el));
    const read = $("#chart-wot-read");
    rows.forEach((r, i) => {
      const v = VEH.get(r.vehicle);
      const y0 = m.t + i * rowH;
      const yc = narrow ? y0 + 38 : y0 + rowH / 2;
      if (i > 0) svg.append("line").attr("class", "grid").attr("x1", narrow ? m.l : 10).attr("x2", w - m.r).attr("y1", y0).attr("y2", y0).style("stroke", "var(--grid)");
      if (narrow) {
        fitText(svg.append("text").attr("class", "t-sans-strong").attr("x", m.l).attr("y", y0 + 16).text(r.label), w - m.l - m.r);
      } else {
        svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 14).attr("y", yc - 4).attr("text-anchor", "end").text(r.label);
        svg.append("text").attr("class", "t-sans").attr("x", m.l - 14).attr("y", yc + 12).attr("text-anchor", "end").text(KIND_LABEL[r.kind]);
      }
      if (r.lambda == null) {
        svg.append("text").attr("class", "t-italic").attr("x", narrow ? m.l : x(0.77)).attr("y", yc).attr("dy", "0.35em").text(narrow ? "No public data found" : r.note);
        return;
      }
      const cx = x(r.lambda);
      const hollow = r.kind === "oem";
      const ranged = r.lo != null;
      if (ranged) {
        svg.append("rect").attr("class", `s${v.slot}-fill range-soft`).attr("x", x(r.lo)).attr("y", yc - 4).attr("width", x(r.hi) - x(r.lo)).attr("height", 8).attr("rx", 4);
      }
      svg.append("path").attr("d", symbolPath(v.shape, ranged ? 90 : 130)).attr("transform", `translate(${cx},${yc})`)
        .attr("class", `s${v.slot}-fill s${v.slot}-stroke mark${hollow ? " mark--hollow" : ""}`)
        .style("stroke", hollow ? `var(--s${v.slot})` : null);
      const edgeHi = ranged ? r.hi : r.lambda, edgeLo = ranged ? r.lo : r.lambda;
      const right = edgeHi < 0.97;
      const txt = ranged ? (narrow ? `${fmt(r.lo, 2)}–${fmt(r.hi, 2)}` : `${fmt(r.lo, 2)}–${fmt(r.hi, 2)} · ${r.markLabel || "typical"} ${fmt(r.lambda, 3)}`)
        : r.afr ? (narrow ? `λ ≈ ${fmt(r.lambda, 2)}` : `≈ ${r.afr} : 1 · λ ${fmt(r.lambda, 2)}`) : r.kind === "oem" ? `λ ${fmt(r.lambda, 2)} · ${narrow ? "manual" : "Audi manual"}`
        : r.approx ? `λ ≈ ${fmt(r.lambda, 2)}` : `λ ${fmt(r.lambda, 3)}`;
      svg.append("text").attr("class", "t-strong halo").attr("x", right ? x(edgeHi) + 12 : x(edgeLo) - 12).attr("y", yc).attr("dy", "0.35em")
        .attr("text-anchor", right ? "start" : "end").text(txt);
      const desc = `${r.label}: ${r.approx ? "about " : ""}λ ${fmt(r.lambda, 2)}. ${r.note}. ${KIND_LABEL[r.kind]}, ${SRC.get(r.src).short}.`;
      svg.append("circle").attr("class", "hit").attr("cx", cx).attr("cy", yc).attr("r", 16).attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
        .on("pointerenter focus", () => {
          tip.show(cx, yc - 10, [{ value: `${r.approx ? "≈ " : ""}λ ${fmt(r.lambda, 2)}`, label: r.label }, { label: `${r.note}. ${SRC.get(r.src).short}.` }]);
          read.textContent = desc;
        })
        .on("pointerleave blur", () => tip.hide());
    });

    const ay = hgt - m.b;
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", ay).attr("y2", ay);
    const ticks = d3.range(0.70, 1.1001, 0.05).filter((d, i) => w < 420 ? i % 2 === 0 : true);
    svg.append("g").selectAll("text").data(ticks).join("text").attr("x", d => x(d)).attr("y", ay + 18).attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => fmt(d, 2));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 2).attr("text-anchor", "end").text("λ at full throttle");
  }

  function tableWot() {
    table("#table-wot", ["Vehicle", "λ", "Range", "AFR (petrol scale)", "Kind", "Note", "Source"], D.fullThrottle.map(r => [
      r.label, r.lambda == null ? null : (r.approx ? "≈ " : "") + fmt(r.lambda, 3), r.lo != null ? `${fmt(r.lo, 3)}–${fmt(r.hi, 3)}` : null,
      r.afr ? "≈ " + r.afr : null, KIND_LABEL[r.kind], r.note, r.src ? SRC.get(r.src).short : null
    ]), [1]);
  }

  /* =====================================================================
     6b. Close relatives: lambda through the revs
     ===================================================================== */
  function nearest(arr, rpm, tol) {
    let best = null;
    arr.forEach(p => { if (Math.abs(p[0] - rpm) <= tol && (!best || Math.abs(p[0] - rpm) < Math.abs(best[0] - rpm))) best = p; });
    return best;
  }

  function renderCurves(w) {
    const el = $("#chart-curves");
    const pull2 = D.drive16.rows.filter(r => r[0] >= 227 && r[0] <= 244).map(r => [r[3], r[1], r[2]]);
    const series = [
      { id: "s3s", label: "1.8T 20V, stock map", cls: "s1-line", dash: false, pts: D.s3.stock },
      { id: "s3c", label: "1.8T 20V, chipped", cls: "s1-line dash-line", dash: true, pts: D.s3.chipped },
      { id: "vw16", label: "VW 1.6 non-turbo, stock", cls: "s2-line", dash: false, pts: pull2 }
    ];
    const hgt = w < 520 ? 300 : 340;
    const m = { t: 30, r: w < 520 ? 16 : 120, b: 40, l: 44 };
    const x = d3.scaleLinear([2000, 7000], [m.l, w - m.r]);
    const y = d3.scaleLinear([0.72, 1.0], [hgt - m.b, m.t]);
    const svg = svgIn(el, w, hgt, "Line chart of full-throttle lambda against rpm for three relatives: the 1.8T 20-valve on its stock map holds about 0.88 and drops to 0.79 near 6,700 rpm; chipped it reaches 0.75 at 6,200; the VW 1.6 non-turbo holds 0.90 and drops to 0.80 above 5,500.")
      .attr("aria-describedby", "chart-curves-read");
    const turbo = D.targets.find(t => t.id === "turbo"), na = D.targets.find(t => t.id === "na");
    svg.append("rect").attr("class", "band").attr("x", m.l).attr("width", w - m.l - m.r).attr("y", y(turbo.hi)).attr("height", y(turbo.lo) - y(turbo.hi));
    svg.append("rect").attr("class", "band-soft").attr("x", m.l).attr("width", w - m.l - m.r).attr("y", y(na.hi)).attr("height", y(na.lo) - y(na.hi));
    const yt = [0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
    svg.append("g").attr("class", "grid").selectAll("line").data(yt).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").selectAll("text").data(yt).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => fmt(d, 2));
    svg.append("text").attr("class", "t-ink2").attr("x", m.l - 8).attr("y", 12).text("λ, richer ↓");
    svg.append("text").attr("class", "t-ink2 halo").attr("x", m.l + 6).attr("y", y(na.hi) + 12).text("non-turbo target");
    svg.append("text").attr("class", "t-ink2 halo").attr("x", m.l + 6).attr("y", y(turbo.lo) - 4).text("turbo target");
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
    const tickW = textWidth(el, [["", "7,000"]]) + 10;
    const xt = [2000, 3000, 4000, 5000, 6000, 7000].filter((d, i) => x(3000) - x(2000) >= tickW * 1.5 || i % 2 === 0);
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 18)
      .attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 && d === 7000 ? "end" : "middle").text(d => fmt(d, 0));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("engine speed, rpm");

    const line = d3.line().x(d => x(d[0])).y(d => y(d[1]));
    series.forEach(s => {
      svg.append("path").attr("class", s.cls).attr("d", line(s.pts));
      if (w >= 520) {
        const last = s.pts[s.pts.length - 1];
        svg.append("text").attr("class", "t-sans halo").attr("x", x(last[0]) + 8).attr("y", y(last[1]) + (s.id === "s3c" ? 12 : s.id === "s3s" ? -4 : 4))
          .text(s.id === "vw16" ? "VW 1.6" : s.id === "s3s" ? "1.8T stock" : "1.8T chipped");
      }
    });
    // requested lambda for the 1.6, as small ticks
    svg.append("g").selectAll("circle").data(pull2).join("circle").attr("class", "ring-ink").attr("r", 2.5).attr("cx", d => x(d[0])).attr("cy", d => y(d[2]));

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", hgt - m.b);
    let cur = null;
    const read = $("#chart-curves-read");
    function show(rpm) {
      rpm = Math.round(rpm / 20) * 20;
      cur = rpm;
      g.style("display", null);
      g.select("line").attr("x1", x(rpm)).attr("x2", x(rpm));
      const rows = [{ value: `${fmt(rpm, 0)} rpm`, label: null }];
      const parts = [];
      series.forEach((s, i) => {
        const p = nearest(s.pts, rpm, 260);
        const key = h("span", { class: "key key--line" + (s.dash ? " key--dash" : ""), style: s.dash ? "" : `background:var(--s${i < 2 ? 1 : 2})` });
        const txt = p ? `λ ${fmt(p[1], 3)} at ${fmt(p[0], 0)} rpm` : "no sample here";
        rows.push({ label: `${s.label}: ${txt}`, key });
        parts.push(`${s.label} ${p ? "λ " + fmt(p[1], 3) : "no sample"}`);
      });
      tip.show(x(rpm), m.t + 10, rows);
      read.textContent = `${fmt(rpm, 0)} rpm. ${parts.join("; ")}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", hgt - m.t - m.b)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(2000, Math.min(7000, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 100, big: 500, min: 2000, max: 7000, start: 4000, leave });
  }

  function tableCurves() {
    const rows = [];
    D.s3.stock.forEach(p => rows.push(["1.8T 20V, stock map (Audi S3)", fmt(p[0], 0), fmt(p[1], 3), null, SRC.get("rs246").short]));
    D.s3.chipped.forEach(p => rows.push(["1.8T 20V, chipped (Audi S3)", fmt(p[0], 0), fmt(p[1], 3), null, SRC.get("rs246").short]));
    D.drive16.rows.filter(r => r[0] >= 227 && r[0] <= 244).forEach(r => rows.push(["VW 1.6 non-turbo, stock (SEAT Leon)", fmt(r[3], 0), fmt(r[1], 3), fmt(r[2], 3), SRC.get("sc16").short]));
    table("#table-curves", ["Engine", "rpm", "λ measured", "λ requested", "Source"], rows, [1, 2, 3]);
  }

  /* =====================================================================
     6c. Exhaust-temperature protection on a remapped 1.8T
     ===================================================================== */
  function renderEgt(w) {
    const el = $("#chart-egt");
    const A = D.leonR.runA, B = D.leonR.runB, lim = D.leonR.limit;
    const ph = w < 520 ? 120 : 140, gap = 46;
    const m = { t: 28, r: 18, b: 40, l: 46 };
    const hgt = m.t + ph * 3 + gap * 2 + m.b;
    const x = d3.scaleLinear([2300, 6900], [m.l, w - m.r]);
    const top = i => m.t + i * (ph + gap);
    const yL = d3.scaleLinear([0.72, 1.02], [top(0) + ph, top(0)]);
    const yE = d3.scaleLinear([650, 960], [top(1) + ph, top(1)]);
    const yF = d3.scaleLinear([0, 20], [top(2) + ph, top(2)]);
    const svg = svgIn(el, w, hgt, "Three charts sharing an rpm axis for a remapped 1.8T. Lambda holds 0.875 then falls to 0.75 above 5,700 rpm. Modelled exhaust temperature rises from 680 to 940 degrees, crossing 920 near 5,200 rpm. Enrichment factor rises from 0 to about 17 percent past that point.")
      .attr("aria-describedby", "chart-egt-read");
    function panel(i, y, ticks, title, f) {
      svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(ticks).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(f);
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", top(i) - 12).text(title);
    }
    panel(0, yL, [0.75, 0.85, 0.95], "Lambda", d => fmt(d, 2));
    panel(1, yE, [700, 800, 900], "Modelled exhaust temperature, °C", d => d);
    panel(2, yF, [0, 10, 20], "Enrichment factor, %", d => d);
    // protection limit across panel 2, and the rpm where it is crossed across all panels
    svg.append("line").attr("class", "refline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", yE(lim)).attr("y2", yE(lim));
    svg.append("text").attr("class", "t-strong halo").attr("x", m.l + 6).attr("y", yE(lim) - 6).text(`${lim} °C protection limit`);
    const cross = (() => { for (let i = 1; i < B.length; i++) if (B[i - 1][1] < lim && B[i][1] >= lim) { const [r0, e0] = B[i - 1], [r1, e1] = B[i]; return r0 + (lim - e0) / (e1 - e0) * (r1 - r0); } return null; })();
    if (cross) {
      svg.append("line").attr("class", "cursor").attr("x1", x(cross)).attr("x2", x(cross)).attr("y1", top(0)).attr("y2", top(2) + ph).style("stroke-dasharray", "2 3");
      const rr = fmt(Math.round(cross / 10) * 10, 0);
      let ct = `limit crossed ≈ ${rr} rpm`, tw = textWidth(el, [["t-ink2", ct]]);
      if (x(cross) - 6 - tw < m.l + 4 && x(cross) + 6 + tw > w - m.r) { ct = `≈ ${rr} rpm`; tw = textWidth(el, [["t-ink2", ct]]); }
      const left = x(cross) - 6 - tw > m.l + 4;
      svg.append("text").attr("class", "t-ink2 halo").attr("x", left ? x(cross) - 6 : x(cross) + 6).attr("y", top(2) + ph - 8).attr("text-anchor", left ? "end" : "start").text(ct);
    }
    const ln = (yy, idx) => d3.line().x(d => x(d[0])).y(d => yy(d[idx]));
    svg.append("path").attr("class", "line-spec").attr("d", ln(yL, 2)(A));
    svg.append("path").attr("class", "s1-line").attr("d", ln(yL, 1)(A));
    svg.append("path").attr("class", "s1-line").attr("d", ln(yE, 1)(B));
    svg.append("path").attr("class", "s1-line").attr("d", ln(yF, 2)(B));
    [[yL, A, 1], [yE, B, 1], [yF, B, 2]].forEach(([yy, arr, idx]) => svg.append("g").selectAll("circle").data(arr).join("circle")
      .attr("class", "s1-fill mark").attr("r", 3).attr("cx", d => x(d[0])).attr("cy", d => yy(d[idx])));
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", top(2) + ph).attr("y2", top(2) + ph);
    const xt = [3000, 4000, 5000, 6000];
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", top(2) + ph + 18).attr("text-anchor", "middle").text(d => fmt(d, 0));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("engine speed, rpm");

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", top(0)).attr("y2", top(2) + ph);
    let cur = null;
    const read = $("#chart-egt-read");
    function show(rpm) {
      rpm = Math.round(rpm / 20) * 20;
      cur = rpm;
      g.style("display", null);
      g.select("line").attr("x1", x(rpm)).attr("x2", x(rpm));
      const a = nearest(A, rpm, 300), b = nearest(B, rpm, 300);
      const rows = [{ value: `${fmt(rpm, 0)} rpm`, label: null }];
      rows.push({ label: a ? `λ ${fmt(a[1], 3)} measured, ${fmt(a[2], 3)} requested (${fmt(a[0], 0)} rpm)` : "No lambda sample here" });
      rows.push({ label: b ? `${b[1]} °C modelled, enrichment ${fmt(b[2], 1)}% (${fmt(b[0], 0)} rpm)` : "No temperature sample here" });
      tip.show(x(rpm), top(1) + ph / 2, rows);
      read.textContent = `${fmt(rpm, 0)} rpm. ${rows.slice(1).map(r => r.label).join(". ")}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", top(0)).attr("width", w - m.l - m.r).attr("height", top(2) + ph - top(0))
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(2300, Math.min(6900, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 100, big: 500, min: 2300, max: 6900, start: 5300, leave });
  }

  function tableEgt() {
    const rows = [];
    D.leonR.runA.forEach(r => rows.push(["Pull 1", fmt(r[0], 0), fmt(r[1], 3), fmt(r[2], 3), null, null]));
    D.leonR.runB.forEach(r => rows.push(["Pull 2", fmt(r[0], 0), null, null, r[1], fmt(r[2], 1)]));
    table("#table-egt", ["Pull", "rpm", "λ measured", "λ requested", "Exhaust °C (modelled)", "Enrichment %"], rows, [1, 2, 3, 4, 5]);
  }

  /* =====================================================================
     6c2. EA888 Gen 3, stock and Stage 1 (rows: t, rpm, λ, spec bar, actual bar, IAT, throttle)
     ===================================================================== */
  function renderGen3(w) {
    const el = $("#chart-gen3");
    const S = D.gen3.stock, T = D.gen3.stage1;
    const series = [
      { id: "stock", label: "Stock", cls: "s1-line", dash: false, pts: S, src: D.gen3.src.stock },
      { id: "stage1", label: "Stage 1", cls: "s1-line dash-line", dash: true, pts: T, src: D.gen3.src.stage1 }
    ];
    const narrow = w < 520;
    const ph1 = narrow ? 190 : 230, ph2 = narrow ? 110 : 130, gap = 52;
    const m = { t: 30, r: narrow ? 16 : 76, b: 40, l: 46 };
    const hgt = m.t + ph1 + gap + ph2 + m.b;
    const x = d3.scaleLinear([1700, 6600], [m.l, w - m.r]);
    const top2 = m.t + ph1 + gap;
    const yL = d3.scaleLinear([0.78, 1.06], [m.t + ph1, m.t]);
    const yB = d3.scaleLinear([1.4, 3.0], [top2 + ph2, top2]);
    const svg = svgIn(el, w, hgt, "Two charts sharing an rpm axis for an EA888 Gen 3 2.0 at full throttle. Stock: lambda 0.98 to 1.02 from 2,000 to 4,300 rpm, easing to 0.92 to 0.96 above 5,000, at up to 2.2 bar absolute. Stage 1: lambda 0.80 to 0.86 from 2,050 rpm, at up to 2.9 bar absolute.")
      .attr("aria-describedby", "chart-gen3-read");
    const turbo = D.targets.find(t => t.id === "turbo");
    svg.append("rect").attr("class", "band").attr("x", m.l).attr("width", w - m.l - m.r).attr("y", yL(turbo.hi)).attr("height", yL(turbo.lo) - yL(turbo.hi));
    function panel(y, ticks, title, f, topY) {
      svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(ticks).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(f);
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", topY - 14).text(title);
    }
    panel(yL, [0.8, 0.85, 0.9, 0.95, 1.0, 1.05], "Lambda, richer ↓", d => fmt(d, 2), m.t);
    panel(yB, [1.5, 2.0, 2.5, 3.0], "Charge pressure, bar absolute", d => fmt(d, 1), top2);
    svg.append("line").attr("class", "refline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", yL(1)).attr("y2", yL(1));
    svg.append("text").attr("class", "t-ink2 halo").attr("x", x(4200)).attr("y", yL(turbo.hi) - 7).text("turbo target");
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", top2 + ph2).attr("y2", top2 + ph2);
    const xt = [2000, 3000, 4000, 5000, 6000];
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", top2 + ph2 + 18).attr("text-anchor", "middle").text(d => fmt(d, 0));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("engine speed, rpm");

    const ln = (yy, idx) => d3.line().x(d => x(d[1])).y(d => yy(d[idx]));
    series.forEach(s => {
      svg.append("path").attr("class", s.cls).attr("d", ln(yL, 2)(s.pts));
      svg.append("path").attr("class", s.cls).attr("d", ln(yB, 4)(s.pts));
      if (!narrow) {
        const last = s.pts[s.pts.length - 1];
        svg.append("text").attr("class", "t-sans halo").attr("x", x(last[1]) + 8).attr("y", yL(last[2])).attr("dy", "0.35em").text(s.label);
        svg.append("text").attr("class", "t-sans halo").attr("x", x(last[1]) + 8).attr("y", yB(last[4])).attr("dy", "0.35em").text(s.label);
      }
    });
    if (narrow) {
      svg.append("text").attr("class", "t-sans halo").attr("x", x(3000)).attr("y", yL(0.99) - 10).text("Stock");
      svg.append("text").attr("class", "t-sans halo").attr("x", x(3000)).attr("y", yL(0.81) + 16).text("Stage 1");
    }

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", top2 + ph2);
    let cur = null;
    const read = $("#chart-gen3-read");
    const near = (arr, rpm) => { let b = null; arr.forEach(p => { if (Math.abs(p[1] - rpm) <= 120 && (!b || Math.abs(p[1] - rpm) < Math.abs(b[1] - rpm))) b = p; }); return b; };
    function show(rpm) {
      rpm = Math.round(rpm / 20) * 20;
      cur = rpm;
      g.style("display", null);
      g.select("line").attr("x1", x(rpm)).attr("x2", x(rpm));
      const rows = [{ value: `${fmt(rpm, 0)} rpm`, label: null }];
      const parts = [];
      series.forEach(s => {
        const p = near(s.pts, rpm);
        const key = h("span", { class: "key key--line" + (s.dash ? " key--dash" : ""), style: s.dash ? "" : "background:var(--s1)" });
        const txt = p ? `λ ${fmt(p[2], 3)}, ${fmt(p[4], 2)} bar, intake ${p[5]} °C (${fmt(p[1], 0)} rpm)` : "no sample here";
        rows.push({ label: `${s.label}: ${txt}`, key });
        parts.push(`${s.label} ${p ? "λ " + fmt(p[2], 3) + " at " + fmt(p[4], 2) + " bar" : "no sample"}`);
      });
      tip.show(x(rpm), m.t + ph1 * 0.45, rows);
      read.textContent = `${fmt(rpm, 0)} rpm. ${parts.join("; ")}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", top2 + ph2 - m.t)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(1800, Math.min(6460, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 100, big: 500, min: 1800, max: 6460, start: 3000, leave });
  }

  function tableGen3() {
    const rows = [];
    [["Stock", D.gen3.stock, "aet-stock"], ["Stage 1", D.gen3.stage1, "aet-stg1"]].forEach(([lab, arr, src]) => arr.forEach(r =>
      rows.push([lab, fmt(r[0], 2), fmt(r[1], 0), fmt(r[2], 4), fmt(r[3], 3), fmt(r[4], 3), r[5], fmt(r[6], 1), SRC.get(src).short])));
    table("#table-gen3", ["Calibration", "Time, s", "rpm", "λ", "Charge pressure specified, bar abs", "Actual, bar abs", "Intake air, °C", "Throttle, %", "Source"], rows, [1, 2, 3, 4, 5, 6, 7]);
  }

  /* =====================================================================
     9b. A Honda 1.8 non-turbo at full throttle on E0 and E20 (ORNL/TM-2011/234, Fig. 3.3)
     ===================================================================== */
  function renderCivic(w) {
    const el = $("#chart-civic");
    const C = D.civicWot;
    const narrow = w < 520;
    const cap = 400;
    const hgt = narrow ? 316 : 340;
    const tight = w < 820;   // header row too short for the means and the peak note together
    const m = { t: tight ? 58 : 40, r: 18, b: 40, l: 46 };
    const x = d3.scaleLinear([0.70, 1.10], [m.l, w - m.r]);
    const y = d3.scaleLinear([0, cap], [hgt - m.b, m.t]);
    const svg = svgIn(el, w, hgt, `Histogram of lambda during a full-throttle test of a 2009 Honda Civic 1.8. On E0 the enriched samples cluster near 0.81, averaging about ${fmt(C.stated.e0, 2)}; on E20 they cluster near 0.87, averaging about ${fmt(C.stated.e20, 2)}. Both fuels peak at lambda 1 during cruise and idle.`)
      .attr("aria-describedby", "chart-civic-read");
    const clipId = "civic-clip";
    svg.append("clipPath").attr("id", clipId).append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", hgt - m.t - m.b);
    const yt = [0, 100, 200, 300, 400];
    svg.append("g").attr("class", "grid").selectAll("line").data(yt).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").selectAll("text").data(yt).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => fmt(d, 0));
    svg.append("text").attr("class", "t-ink2").attr("x", m.l - 8).attr("y", 12).text("samples at each λ");
    const series = [
      { id: "e0", label: "E0", cls: "civic-e0", pts: C.e0, mean: C.stated.e0 },
      { id: "e20", label: "E20", cls: "civic-e20", pts: C.e20, mean: C.stated.e20 }
    ];
    const area = d3.area().x(d => x(d[0])).y0(y(0)).y1(d => y(Math.min(d[1], cap * 1.05))).curve(d3.curveStepAfter);
    const line = d3.line().x(d => x(d[0])).y(d => y(Math.min(d[1], cap * 1.05))).curve(d3.curveStepAfter);
    const g0 = svg.append("g").attr("clip-path", `url(#${clipId})`);
    series.forEach(s => {
      g0.append("path").attr("class", s.cls + " civic-area").attr("d", area(s.pts));
      g0.append("path").attr("class", s.cls + " civic-line").attr("d", line(s.pts));
    });
    // stated averages during enrichment
    series.forEach((s, i) => {
      svg.append("line").attr("class", "refline").attr("x1", x(s.mean)).attr("x2", x(s.mean)).attr("y1", m.t - 6).attr("y2", hgt - m.b);
      svg.append("text").attr("class", "t-strong halo").attr("x", x(s.mean) + (i === 0 ? -6 : 6)).attr("y", m.t - 12).attr("text-anchor", i === 0 ? "end" : "start").text(`${s.label} ≈ ${fmt(s.mean, 2)}`);
    });
    // the cruise peak runs off the cut scale
    const pk = series.map(s => s.pts.reduce((b, p) => p[1] > b[1] ? p : b));
    svg.append("text").attr("class", "t-ink2 halo").attr("x", w - m.r).attr("y", tight ? m.t - 30 : m.t - 12).attr("text-anchor", "end")
      .text(tight ? `λ 1 peak ≈ ${fmt(Math.round(pk[0][1] / 100) * 100, 0)} ↑` : `cruise peak, off the scale: ${fmt(pk[0][1], 0)} on E0, ${fmt(pk[1][1], 0)} on E20 ↑`);
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
    const xt = d3.range(0.70, 1.1001, 0.05).filter((d, i) => narrow ? i % 2 === 0 : true);
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 18)
      .attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => fmt(d, 2));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("λ, richer ←");

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", hgt - m.b);
    let cur = null;
    const read = $("#chart-civic-read");
    const at = (arr, l) => arr.reduce((b, p) => Math.abs(p[0] - l) < Math.abs(b[0] - l) ? p : b);
    function show(l) {
      l = Math.round(l * 200) / 200;
      cur = l;
      g.style("display", null);
      g.select("line").attr("x1", x(l)).attr("x2", x(l));
      const rows = [{ value: `λ ${fmt(l, 3)}`, label: null }];
      const parts = [];
      series.forEach(s => {
        const p = at(s.pts, l);
        const key = h("span", { class: "key key--line key--" + s.id });
        rows.push({ label: `${s.label}: ${fmt(p[1], 0)} samples at λ ${fmt(p[0], 3)}`, key });
        parts.push(`${s.label} ${fmt(p[1], 0)} samples`);
      });
      tip.show(x(l), m.t + 40, rows);
      read.textContent = `λ ${fmt(l, 3)}. ${parts.join("; ")}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", hgt - m.t - m.b)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(Math.max(0.70, Math.min(1.10, x.invert(px)))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 0.005, big: 0.05, min: 0.70, max: 1.10, start: 0.82, leave });
  }

  function tableCivic() {
    const C = D.civicWot, rows = [];
    [["E0", C.e0], ["E20", C.e20]].forEach(([f, arr]) => arr.forEach(p => rows.push([f, fmt(p[0], 3), fmt(p[1], 0)])));
    rows.push(["E0", "average under enrichment", `≈ ${fmt(C.stated.e0, 2)} (report); ${fmt(C.check.e0, 3)} from the samples below 0.95`]);
    rows.push(["E20", "average under enrichment", `≈ ${fmt(C.stated.e20, 2)} (report); ${fmt(C.check.e20, 3)} from the samples below 0.95`]);
    table("#table-civic", ["Fuel", "λ", "Samples"], rows, [1, 2]);
  }

  /* =====================================================================
     6d. A drive in lambda, VW 1.6 non-turbo
     ===================================================================== */
  function renderDrive(w) {
    const el = $("#chart-drive");
    const R = D.drive16.rows.map(r => ({ t: r[0], act: r[1], spec: r[2], rpm: r[3], load: r[4], inj: r[5], map: r[6] }));
    const t0 = R[0].t;
    const ph1 = w < 520 ? 150 : 180, ph2 = w < 520 ? 90 : 110, gap = 44;
    const m = { t: 28, r: 18, b: 40, l: 46 };
    const hgt = m.t + ph1 + gap + ph2 + m.b;
    const x = d3.scaleLinear([0, R[R.length - 1].t - t0], [m.l, w - m.r]);
    const yL = d3.scaleLinear([0.72, 1.24], [m.t + ph1, m.t]);
    const top2 = m.t + ph1 + gap;
    const yR = d3.scaleLinear([0, 6000], [top2 + ph2, top2]);
    const svg = svgIn(el, w, hgt, "Two charts over a six-minute drive. Lambda sits near 1.00 most of the time, steps to 0.90 in two full-throttle pulls, reaches 0.80 near 5,700 rpm, and reads 1.20 on every lift-off. Engine speed below ranges from idle to 5,766 rpm.")
      .attr("aria-describedby", "chart-drive-read");
    // full-throttle spans: load above 70% and manifold pressure above 950 mbar
    const spans = [];
    let s = null;
    R.forEach((r, i) => {
      const wot = r.load >= 70 && r.map >= 940;
      if (wot && !s) s = { a: r.t, b: r.t, n: 1 };
      else if (wot && s) { s.b = r.t; s.n++; }
      else if (!wot && s) { if (s.n >= 3) spans.push(s); s = null; }
    });
    spans.forEach(sp => {
      svg.append("rect").attr("class", "band").attr("x", x(sp.a - t0) - 3).attr("width", x(sp.b - t0) - x(sp.a - t0) + 6).attr("y", m.t).attr("height", top2 + ph2 - m.t);
      if (w >= 560) svg.append("text").attr("class", "t-ink2 halo").attr("x", x((sp.a + sp.b) / 2 - t0)).attr("y", m.t - 6).attr("text-anchor", "middle").text("full throttle");
    });
    function panel(y, ticks, title, f, topY) {
      svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(ticks).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(f);
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", topY - 12).text(title);
    }
    panel(yL, [0.8, 0.9, 1.0, 1.1, 1.2], "Lambda", d => fmt(d, 1), m.t);
    panel(yR, [0, 2000, 4000, 6000], "Engine speed, rpm", d => fmt(d, 0), top2);
    const L = acc => d3.line().x(d => x(d.t - t0)).y(d => yL(d[acc]));
    svg.append("path").attr("class", "s2-line").style("stroke-width", 1.5).attr("d", L("act")(R));
    svg.append("path").attr("class", "line-spec").style("stroke", "var(--ink)").attr("d", L("spec")(R));
    svg.append("path").attr("class", "s2-line").style("stroke-width", 1.5).attr("d", d3.line().x(d => x(d.t - t0)).y(d => yR(d.rpm))(R));
    // annotations
    const firstCut = R.find(r => r.act >= 1.2);
    if (firstCut && w >= 520) svg.append("text").attr("class", "t-ink2 halo").attr("x", x(firstCut.t - t0) + 6).attr("y", yL(1.2) + 4).attr("dy", "0.32em").text("1.20: fuel cut on lift-off");
    if (w >= 520) svg.append("text").attr("class", "t-ink2 halo").attr("x", x(0) + 4).attr("y", yL(0.852) + 14).text("0.85 requested after start");
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", top2 + ph2).attr("y2", top2 + ph2);
    const xt = w < 560 ? [0, 120, 240, 360] : [0, 60, 120, 180, 240, 300, 360];
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", top2 + ph2 + 18)
      .attr("text-anchor", (d, i) => i === 0 ? "start" : "middle").text(d => `${d / 60} min`);

    const tip = el.__tip || (el.__tip = makeTip(el));
    const g = svg.append("g").style("display", "none");
    g.append("line").attr("class", "cursor").attr("y1", m.t).attr("y2", top2 + ph2);
    const d1 = g.append("circle").attr("r", 3.5).attr("class", "s2-fill mark");
    const d2 = g.append("circle").attr("r", 3.5).attr("class", "s2-fill mark");
    let cur = null;
    const read = $("#chart-drive-read");
    function show(i) {
      i = Math.max(0, Math.min(R.length - 1, Math.round(i)));
      cur = i;
      const r = R[i];
      g.style("display", null);
      g.select("line").attr("x1", x(r.t - t0)).attr("x2", x(r.t - t0));
      d1.attr("cx", x(r.t - t0)).attr("cy", yL(r.act));
      d2.attr("cx", x(r.t - t0)).attr("cy", yR(r.rpm));
      const mode = r.act >= 1.2 && r.inj === 0 ? "overrun, injectors off" : r.load >= 70 ? "high load" : r.rpm < 900 ? "idle" : "part load";
      tip.show(x(r.t - t0), m.t + ph1 / 2, [{ value: `λ ${fmt(r.act, 3)} measured`, label: `${fmt(r.spec, 3)} requested · ${fmt(r.rpm, 0)} rpm` }, { label: `${fmt(r.t - t0, 0)} s · load ${fmt(r.load, 0)}% · ${mode}` }]);
      read.textContent = `${fmt(r.t - t0, 0)} seconds: lambda ${fmt(r.act, 3)} measured, ${fmt(r.spec, 3)} requested, ${fmt(r.rpm, 0)} rpm, load ${fmt(r.load, 0)} percent, ${mode}.`;
    }
    function leave() { cur = null; g.style("display", "none"); tip.hide(); }
    const bis = d3.bisector(d => d.t - t0).center;
    svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", top2 + ph2 - m.t)
      .on("pointermove", ev => { const [px] = d3.pointer(ev); show(bis(R, x.invert(px))); })
      .on("pointerleave", leave);
    keyStepper(svg, { get: () => cur, set: show, step: 1, big: 10, min: 0, max: R.length - 1, start: 0, leave });
  }

  function tableDrive() {
    const t0 = D.drive16.rows[0][0];
    table("#table-drive", ["Seconds", "λ measured", "λ requested", "rpm", "Load %", "Injection ms", "Manifold mbar"],
      D.drive16.rows.map(r => [fmt(r[0] - t0, 1), fmt(r[1], 3), fmt(r[2], 3), fmt(r[3], 0), fmt(r[4], 1), r[5], fmt(r[6], 1)]), [0, 1, 2, 3, 4, 5, 6]);
  }

  /* =====================================================================
     6e. G13B narrowband sensor trace
     ===================================================================== */
  function renderO2(w) {
    const el = $("#chart-o2");
    const rows = D.g13b.rows;
    const hgt = w < 520 ? 200 : 230;
    const m = { t: 20, r: 16, b: 38, l: 60 };
    const x = d3.scaleLinear([0, 10], [m.l, w - m.r]);
    const y = d3.scaleLinear([0, 8], [hgt - m.b, m.t]);
    const svg = svgIn(el, w, hgt, "Square-ish wave of a narrowband oxygen sensor on a Suzuki G13B, switching between high (rich) and low (lean) about five times across ten screen divisions.")
      .attr("aria-describedby", "chart-o2-read");
    svg.append("g").attr("class", "grid").selectAll("line").data(d3.range(0, 9)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").attr("class", "grid").selectAll("line").data(d3.range(0, 11)).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.t).attr("y2", hgt - m.b);
    svg.append("text").attr("class", "t-ink2").attr("x", m.l - 8).attr("y", y(5.35)).attr("dy", "0.32em").attr("text-anchor", "end").text("rich");
    svg.append("text").attr("class", "t-ink2").attr("x", m.l - 8).attr("y", y(1.95)).attr("dy", "0.32em").attr("text-anchor", "end").text("lean");
    svg.append("path").attr("class", "s2-line").attr("d", d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(d3.curveMonotoneX)(rows));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text(w < 560 ? "time, screen divisions" : "time, screen divisions · about 1 cycle per second per the tuner");
    svg.append("g").selectAll("text").data([0, 2, 4, 6, 8, 10]).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 16).attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => d);
    $("#chart-o2-read").textContent = "";
  }

  function tableO2() {
    table("#table-o2", ["Time, divisions", "Signal, divisions"], D.g13b.rows.map(r => [fmt(r[0], 2), fmt(r[1], 2)]), [0, 1]);
  }

  /* =====================================================================
     7. India's blend by supply year
     ===================================================================== */
  function renderBlend(w) {
    const el = $("#chart-blend");
    const data = D.blending;
    const hgt = w < 520 ? 250 : 290;
    const m = { t: 24, r: 10, b: 42, l: 34 };
    const x = d3.scaleBand(data.map(d => d.esy), [m.l, w - m.r]).paddingInner(0.3).paddingOuter(0.15);
    const y = d3.scaleLinear([0, 22], [hgt - m.b, m.t]);
    const svg = svgIn(el, w, hgt, "Column chart of average ethanol in Indian petrol by supply year: 1.53% in 2013-14, 5% in 2018-19, 8.5% in 2020-21, 10% in 2021-22, 12% in 2022-23, 14.6% in 2023-24, 19.93% in 2024-25 and 20% in 2025-26. Five years have no figure collected.");

    const yt = [5, 10, 15, 20];
    svg.append("g").attr("class", "grid").selectAll("line").data(yt).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").selectAll("text").data([0, ...yt]).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d + "%");

    const bw = Math.min(24, x.bandwidth());
    const tip = el.__tip || (el.__tip = makeTip(el));
    const read = $("#chart-blend-read");
    const labelled = new Set(["2013-14", "2021-22", "2025-26"]);
    data.forEach((d, i) => {
      const cx = x(d.esy) + x.bandwidth() / 2;
      if (d.pct == null) {
        svg.append("circle").attr("class", "missing").attr("cx", cx).attr("cy", y(0) - 6).attr("r", 2.5);
      } else {
        const x0 = cx - bw / 2, x1 = cx + bw / 2, y0 = y(d.pct), yb = y(0), r = Math.min(4, (yb - y0) / 2);
        svg.append("path").attr("class", "bar-ink")
          .attr("d", `M${x0},${yb}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x1 - r}Q${x1},${y0} ${x1},${y0 + r}V${yb}Z`);
        if (labelled.has(d.esy)) svg.append("text").attr("class", "t-strong").attr("x", cx).attr("y", y0 - 7).attr("text-anchor", "middle").text(pct(d.pct) + "%");
      }
      const desc = d.pct == null ? `ESY ${d.esy}: no official figure collected.` : `ESY ${d.esy}: ${pct(d.pct)}% ethanol. ${d.note ? d.note + ". " : ""}${SRC.get(d.src).short}.`;
      svg.append("rect").attr("class", "hit").attr("x", x(d.esy) - (x.step() - x.bandwidth()) / 2).attr("y", m.t).attr("width", x.step()).attr("height", hgt - m.t - m.b)
        .attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
        .on("pointerenter focus", () => {
          const rows = d.pct == null ? [{ value: "No figure", label: `ESY ${d.esy}, none collected` }] :
            [{ value: pct(d.pct) + "%", label: `ESY ${d.esy}` }, { label: (d.note ? d.note + ". " : "") + SRC.get(d.src).short }];
          tip.show(cx, d.pct == null ? y(2) : y(d.pct), rows);
          read.textContent = desc;
        })
        .on("pointerleave blur", () => tip.hide());
    });

    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0));
    const every = x.bandwidth() < 26 ? 2 : 1;
    svg.append("g").selectAll("text").data(data.filter((d, i) => i % every === 0)).join("text")
      .attr("x", d => x(d.esy) + x.bandwidth() / 2).attr("y", y(0) + 18).attr("text-anchor", "middle")
      .text(d => d.esy.slice(2, 4) + "–" + d.esy.slice(5));
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("ethanol supply year");
  }

  function buildMilestones() {
    const ol = $("#milestones");
    D.milestones.forEach(ms => ol.append(h("li", null, h("span", { class: "when", text: ms.when }), h("span", null, ms.text, refs(ms.src)))));
    table("#table-blend", ["Ethanol supply year", "Average ethanol, %", "Note", "Source"], D.blending.map(d => [d.esy, d.pct == null ? null : fmt(d.pct, 2), d.note || (d.pct == null ? "No official figure collected" : null), d.src ? SRC.get(d.src).short : null]), [1]);
  }

  /* =====================================================================
     8. Pump fuel ethanol, Aug 2025
     ===================================================================== */
  function renderPump(w) {
    const el = $("#chart-pump");
    const rows = D.pump.rows.slice().sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi));
    const lw = textWidth(el, rows.map(r => ["t-sans-strong", r.fuel])) + 22;
    const m = { t: 30, r: 60, b: 38, l: Math.max(96, Math.min(lw, w * 0.42)) };
    const rowH = 36;
    const hgt = m.t + rows.length * rowH + m.b;
    const x = d3.scaleLinear([0, 25], [m.l, w - m.r]);
    const svg = svgIn(el, w, hgt, "Range chart of ethanol share in Indian pump fuels in August 2025: IOCL 91 RON 18 to 20%, XP95 18 to 22%, Power 95 15 to 18%, Shell V-Power 12 to 15%, XP100 8 to 12%.");
    const xt = [0, 5, 10, 15, 20, 25];
    svg.append("g").attr("class", "grid").selectAll("line").data(xt).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.t - 6).attr("y2", hgt - m.b);
    svg.append("line").attr("class", "refline").attr("x1", x(20)).attr("x2", x(20)).attr("y1", m.t - 16).attr("y2", hgt - m.b);
    svg.append("text").attr("class", "t-strong halo").attr("x", x(20) + 6).attr("y", m.t - 10).text("E20");

    const tip = el.__tip || (el.__tip = makeTip(el));
    const read = $("#chart-pump-read");
    rows.forEach((r, i) => {
      const yc = m.t + i * rowH + rowH / 2;
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 12).attr("y", yc).attr("dy", "0.35em").attr("text-anchor", "end").text(r.fuel);
      svg.append("rect").attr("class", "bar-range").attr("x", x(r.lo)).attr("y", yc - 6).attr("width", Math.max(12, x(r.hi) - x(r.lo))).attr("height", 12).attr("rx", 6);
      svg.append("text").attr("class", "t-strong halo").attr("x", x(r.hi) + 8).attr("y", yc).attr("dy", "0.35em").text(`${r.lo}–${r.hi}%`);
      const desc = `${r.fuel}: ${r.lo} to ${r.hi}% ethanol, test-bottle reading, ${D.pump.when}.`;
      svg.append("rect").attr("class", "hit").attr("x", 0).attr("y", yc - rowH / 2).attr("width", w).attr("height", rowH)
        .attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
        .on("pointerenter focus", () => { tip.show(x((r.lo + r.hi) / 2), yc - 8, [{ value: `${r.lo}–${r.hi}%`, label: `${r.fuel} · ${D.pump.when}` }]); read.textContent = desc; })
        .on("pointerleave blur", () => tip.hide());
    });
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 18).attr("text-anchor", "middle").text(d => d + "%");
  }

  function buildPumpExtras() {
    const ol = $("#pump-earlier");
    D.pump.earlier.forEach(e => ol.append(h("li", null, h("span", { class: "when", text: e.when }), h("span", null, e.text, refs(D.pump.src)))));
    table("#table-pump", ["Fuel", "Ethanol, low %", "Ethanol, high %", "When", "Source"], D.pump.rows.map(r => [r.fuel, r.lo, r.hi, D.pump.when, SRC.get(D.pump.src).short]), [1, 2]);
  }

  /* =====================================================================
     9. US DOE: sixteen cars at full throttle
     ===================================================================== */
  function renderOrnl(w) {
    const box = $("#chart-ornl");
    box.replaceChildren();
    const o = D.ornlWot;
    const units = h("div", { class: "ornl__units" });
    const temps = h("div", { class: "ornl__temps chart" });
    box.append(units, temps);

    // unit chart, 4 × 4
    const s = 28, gp = 8, cols = 4;
    const uw = cols * s + (cols - 1) * gp, uh = 4 * s + 3 * gp;
    const us = d3.select(units).append("svg").attr("viewBox", `0 0 ${uw} ${uh}`).attr("width", uw).attr("height", uh)
      .attr("role", "img").attr("aria-label", `${o.held} of ${o.fleet} cars held their full-throttle mixture on E20; ${o.leaner} ran leaner.`)
      .style("max-width", uw + "px");
    d3.range(o.fleet).forEach(i => {
      const held = i < o.held;
      us.append("rect").attr("x", (i % cols) * (s + gp) + 1).attr("y", Math.floor(i / cols) * (s + gp) + 1)
        .attr("width", s - 2).attr("height", s - 2).attr("rx", 3).attr("class", held ? "unit-full" : "unit-hollow");
    });
    units.append(
      h("p", { class: "ornl__caption" }, h("strong", { text: `${o.held} held their mixture. ` }), o.heldText + "."),
      h("p", { class: "ornl__caption" }, h("strong", { text: `${o.leaner} ran leaner. ` }), o.leanerText + ".")
    );

    // catalyst temperature change
    const tw = Math.max(260, Math.floor(temps.clientWidth || (w - 260)));
    const narrow = tw < 460;
    const rows = o.catalyst;
    const rowH = narrow ? 60 : 44;
    const m = { t: 22, r: 18, b: 40, l: narrow ? 10 : 170 };
    const hgt = m.t + rows.length * rowH + m.b;
    const x = d3.scaleLinear([-15, 40], [m.l, tw - m.r]);
    const svg = d3.select(temps).append("svg").attr("viewBox", `0 0 ${tw} ${hgt}`).attr("width", tw).attr("height", hgt)
      .attr("role", "img").attr("aria-label", "Change in peak catalyst temperature at full throttle. Cars that ran leaner: plus 29 to 35 degrees on E20 against E0, about plus 20 against E10. Cars that held mixture: under 5 degrees on average, individual results from minus 14 to plus 14.");
    svg.append("text").attr("class", "t-sans-strong").attr("x", narrow ? m.l : 0).attr("y", 10).text("Peak catalyst temperature change, °C");
    const xt = [-10, 0, 10, 20, 30, 40];
    svg.append("g").attr("class", "grid").selectAll("line").data(xt).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.t).attr("y2", hgt - m.b);
    svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", m.t).attr("y2", hgt - m.b).style("stroke", "var(--axis)").style("stroke-width", 1.5);
    const tip = temps.__tip || (temps.__tip = makeTip(temps));
    const read = $("#chart-ornl-read");
    rows.forEach((r, i) => {
      const y0 = m.t + i * rowH;
      const yc = narrow ? y0 + 40 : y0 + rowH / 2 + 4;
      const lbl = `${r.group} · ${r.comparison}`;
      if (narrow) svg.append("text").attr("class", "t-sans").attr("x", m.l).attr("y", y0 + 18).text(lbl);
      else {
        svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 14).attr("y", yc - 5).attr("text-anchor", "end").text(r.group);
        svg.append("text").attr("class", "t-sans").attr("x", m.l - 14).attr("y", yc + 11).attr("text-anchor", "end").text(r.comparison);
      }
      let valueText;
      if (r.below) {
        svg.append("line").attr("class", "whisker").attr("x1", x(r.rangeLo)).attr("x2", x(r.rangeHi)).attr("y1", yc).attr("y2", yc);
        [r.rangeLo, r.rangeHi].forEach(v => svg.append("line").attr("class", "whisker").attr("x1", x(v)).attr("x2", x(v)).attr("y1", yc - 5).attr("y2", yc + 5));
        svg.append("rect").attr("class", "bar-range").attr("x", x(0)).attr("y", yc - 5).attr("width", x(r.hi) - x(0)).attr("height", 10).attr("rx", 2).style("opacity", 0.35);
        valueText = "average under 5";
        svg.append("text").attr("class", "t-strong halo").attr("x", x(r.rangeHi) + 8).attr("y", yc).attr("dy", "0.35em").text(valueText);
      } else if (r.hi > r.lo) {
        svg.append("rect").attr("class", "bar-range").attr("x", x(r.lo)).attr("y", yc - 6).attr("width", x(r.hi) - x(r.lo)).attr("height", 12).attr("rx", 6);
        valueText = `+${r.lo} to +${r.hi}`;
        const fits = x(r.hi) + 92 < tw;
        svg.append("text").attr("class", "t-strong halo").attr("x", fits ? x(r.hi) + 8 : x(r.lo) - 8).attr("y", yc).attr("dy", "0.35em")
          .attr("text-anchor", fits ? "start" : "end").text(valueText);
      } else {
        svg.append("circle").attr("class", "ring-ink").attr("cx", x(r.lo)).attr("cy", yc).attr("r", 5.5);
        valueText = `about +${r.lo}`;
        svg.append("text").attr("class", "t-strong halo").attr("x", x(r.lo) + 10).attr("y", yc).attr("dy", "0.35em").text(valueText);
      }
      const desc = `${lbl}: ${r.text}.`;
      svg.append("rect").attr("class", "hit").attr("x", 0).attr("y", y0).attr("width", tw).attr("height", rowH)
        .attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
        .on("pointerenter focus", () => { tip.show(x(r.hi), yc - 8, [{ value: valueText + " °C", label: lbl }, { label: r.text }]); read.textContent = desc; })
        .on("pointerleave blur", () => tip.hide());
    });
    const ay = hgt - m.b;
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", tw - m.r).attr("y1", ay).attr("y2", ay);
    svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", ay + 18).attr("text-anchor", "middle").text(d => (d > 0 ? "+" : "") + d);
  }

  function tableOrnl() {
    const o = D.ornlWot;
    const rows = [
      ["Fleet", "16 cars, model years 1999–2007", ""],
      ["Held full-throttle mixture on E20", o.held, o.heldText],
      ["Ran leaner on E20, still rich", o.leaner, o.leanerText],
      ...o.catalyst.map(c => [`Catalyst temperature: ${c.group}, ${c.comparison}`, c.below ? "< 5 °C average" : c.hi > c.lo ? `+${c.lo} to +${c.hi} °C` : `≈ +${c.lo} °C`, c.text]),
      ["Fuel economy, E20 against E0, all 16 cars", fmt(o.economy, 1) + "%", "Average on the LA92 cycle"]
    ];
    table("#table-ornl", ["Finding", "Value", "Detail"], rows);
  }

  /* =====================================================================
     10. Test fuels: oxygen and energy per litre
     ===================================================================== */
  function fuelRows() {
    const e0 = {};
    D.ornlFuels.filter(f => f.fuel === "E0").forEach(f => { e0[f.lab] = f.lhv * f.sg; });
    return D.ornlFuels.map(f => Object.assign({}, f, { energy: (f.lhv * f.sg) / e0[f.lab] * 100 }));
  }

  function renderProps(w) {
    const box = $("#chart-props");
    box.replaceChildren();
    const rows = fuelRows();
    const read = $("#chart-props-read");
    const panels = [
      { key: "o", title: "Oxygen, % by mass", dom: [0, 8], ticks: [0, 2, 4, 6, 8], val: f => f.o * 100, fmtv: v => fmt(v, 1) + "%", note: "E20: 6.8–7.2%" },
      { key: "energy", title: "Energy per litre, each lab's E0 = 100", dom: [92, 100.5], ticks: [92, 94, 96, 98, 100], val: f => f.energy, fmtv: v => fmt(v, 1), note: "E20: 6.8–7.0% less" }
    ];
    const one = w < 640;
    const divs = panels.map(p => {
      const div = h("div");
      div.append(h("p", { class: "chart__panel-title", text: p.title }));
      box.append(div);
      return div;
    });
    panels.forEach((p, pi) => {
      const div = divs[pi];
      const pw = Math.floor(div.clientWidth || (one ? w : (w - 20) / 2));
      const hgt = 220, m = { t: 14, r: 14, b: 40, l: 40 };
      const x = d3.scaleLinear([0, 21], [m.l, pw - m.r]);
      const y = d3.scaleLinear(p.dom, [hgt - m.b, m.t]);
      const svg = d3.select(div).append("svg").attr("viewBox", `0 0 ${pw} ${hgt}`).attr("width", pw).attr("height", hgt)
        .attr("role", "img").attr("aria-label", `Scatter of ${p.title} against ethanol content for twelve measured US DOE test fuels. ${p.note}.`);
      svg.append("g").attr("class", "grid").selectAll("line").data(p.ticks).join("line").attr("x1", m.l).attr("x2", pw - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(p.ticks).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d);
      svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", pw - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
      svg.append("g").selectAll("text").data([0, 5, 10, 15, 20]).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 18).attr("text-anchor", "middle").text(d => d + "%");
      svg.append("text").attr("class", "t-ink2").attr("x", pw - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text("ethanol, % by volume");
      // ordinary least squares through the twelve fuels
      const xs = rows.map(f => f.etoh), ys = rows.map(f => p.val(f));
      const mx = d3.mean(xs), my = d3.mean(ys);
      const sxy = d3.sum(xs, (v, i) => (v - mx) * (ys[i] - my)), sxx = d3.sum(xs, v => (v - mx) ** 2);
      const slope = sxy / sxx, icpt = my - slope * mx;
      const ssr = d3.sum(xs, (v, i) => (ys[i] - (icpt + slope * v)) ** 2), sst = d3.sum(ys, v => (v - my) ** 2);
      const r2 = 1 - ssr / sst;
      svg.append("line").attr("class", "refline").attr("x1", x(0)).attr("x2", x(20)).attr("y1", y(icpt)).attr("y2", y(icpt + slope * 20));
      const fitTxt = `fit: ${slope > 0 ? "+" : "−"}${fmt(Math.abs(slope), 3)} per % ethanol · R² ${r2 >= 0.9995 ? "> 0.999" : fmt(r2, 3)}`;
      if (p.key === "o") svg.append("text").attr("class", "t-ink2 halo").attr("x", pw - m.r).attr("y", y(0.6)).attr("text-anchor", "end").text(fitTxt);
      else svg.append("text").attr("class", "t-ink2 halo").attr("x", pw - m.r).attr("y", y(99.9)).attr("text-anchor", "end").text(fitTxt);
      p.fit = { slope, icpt, r2 };
      rows.forEach(f => svg.append("circle").attr("class", "dot-ink").attr("cx", x(f.etoh)).attr("cy", y(p.val(f))).attr("r", 4.5));
      const e20 = rows.filter(f => f.fuel === "E20");
      const ey = d3.mean(e20, f => p.val(f));
      svg.append("text").attr("class", "t-strong halo").attr("x", x(18.2) - 12).attr("y", y(ey)).attr("dy", "0.35em").attr("text-anchor", "end").text(p.note);
      const tip = makeTip(div);
      rows.forEach(f => {
        const desc = `${f.lab} ${f.fuel}: ${fmt(f.etoh, 1)}% ethanol. ${p.title}: ${p.fmtv(p.val(f))}.`;
        svg.append("circle").attr("class", "hit").attr("cx", x(f.etoh)).attr("cy", y(p.val(f))).attr("r", 10).attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
          .on("pointerenter focus", () => { tip.show(x(f.etoh), y(p.val(f)) - 6, [{ value: p.fmtv(p.val(f)), label: `${f.lab} lab · ${f.fuel} · ${fmt(f.etoh, 1)}% ethanol` }]); read.textContent = desc; })
          .on("pointerleave blur", () => tip.hide());
      });
    });
  }

  function tableProps() {
    table("#table-props", ["Lab", "Fuel", "Ethanol, % vol", "LHV, Btu/lbm", "Specific gravity", "Oxygen, % mass", "Energy per litre, E0 = 100"],
      fuelRows().map(f => [f.lab, f.fuel, fmt(f.etoh, 1), fmt(f.lhv, 0), fmt(f.sg, 3), fmt(f.o * 100, 2), fmt(f.energy, 2)]), [2, 3, 4, 5, 6]);
  }

  /* =====================================================================
     11. Mileage claims against energy per litre
     ===================================================================== */
  function energyRange(base) {
    const out = [];
    ["NREL", "ORNL", "ANL"].forEach(lab => {
      const f = D.ornlFuels.filter(r => r.lab === lab);
      const b = f.find(r => r.fuel === base), e = f.find(r => r.fuel === "E20");
      out.push((1 - (e.lhv * e.sg) / (b.lhv * b.sg)) * 100);
    });
    return [d3.min(out), d3.max(out)];
  }

  function renderMiles(w) {
    const el = $("#chart-miles");
    const groups = [
      { id: "E0", label: "Against petrol (E0)", energy: energyRange("E0") },
      { id: "E10", label: "Against E10", energy: energyRange("E10") },
      { id: "unstated", label: "Comparison fuel not stated", energy: null }
    ];
    const labelFit = textWidth(el, D.mileage.flatMap(r => [["t-sans-strong", r.who], ["t-sans", r.what]])) + 26;
    const narrow = w < 640 || labelFit > w * 0.5;
    const labelW = narrow ? 0 : Math.max(200, labelFit);
    const rowH = narrow ? 66 : 34, headH = narrow ? 52 : 40;
    const m = { t: 8, r: 52, b: 40, l: 10 + labelW };
    let yPos = m.t;
    const layout = [];
    groups.forEach(g => {
      const items = D.mileage.filter(r => r.baseline === g.id).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi));
      layout.push({ type: "head", g, y: yPos });
      yPos += headH;
      const top = yPos;
      items.forEach(r => { layout.push({ type: "row", g, r, y: yPos }); yPos += rowH; });
      g.top = top; g.bottom = yPos;
      yPos += 8;
    });
    const hgt = yPos + m.b;
    const x = d3.scaleLinear([0, 9], [m.l, w - m.r]);
    const svg = svgIn(el, w, hgt, "Dot and range chart of fuel economy lost on E20 by source, grouped by comparison fuel, with the energy-per-litre difference shaded for E0 and E10 comparisons.");
    const xt = d3.range(0, 10, 1);
    svg.append("g").attr("class", "grid").selectAll("line").data(xt).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.t).attr("y2", hgt - m.b);
    groups.forEach(g => {
      if (!g.energy) return;
      svg.append("rect").attr("class", "band").attr("x", x(g.energy[0])).attr("width", Math.max(3, x(g.energy[1]) - x(g.energy[0]))).attr("y", g.top - 4).attr("height", g.bottom - g.top + 4);
    });

    const tip = el.__tip || (el.__tip = makeTip(el));
    const read = $("#chart-miles-read");
    layout.forEach(it => {
      if (it.type === "head") {
        const g = it.g;
        svg.append("text").attr("class", "t-sans-strong").attr("x", 10).attr("y", it.y + 24).text(g.label);
        if (g.energy) {
          const et = narrow ? `energy −${fmt(g.energy[0], 1)} to ${fmt(g.energy[1], 1)}%` : `energy per litre ${fmt(g.energy[0], 1)}–${fmt(g.energy[1], 1)}% less`;
          const fits = x(g.energy[1]) + 6 + et.length * 6.7 < w;
          const ex = narrow ? 10 : fits ? x(g.energy[1]) + 6 : x(g.energy[0]) - 6;
          svg.append("text").attr("class", "t-ink2 halo").attr("x", ex).attr("y", narrow ? it.y + 42 : it.y + 24)
            .attr("text-anchor", narrow || fits ? "start" : "end").text(et);
        }
        return;
      }
      const r = it.r;
      const yc = narrow ? it.y + 50 : it.y + rowH / 2;
      if (narrow) {
        fitText(svg.append("text").attr("class", "t-sans-strong").attr("x", 10).attr("y", it.y + 14).text(r.who), w - 20);
        fitText(svg.append("text").attr("class", "t-sans").attr("x", 10).attr("y", it.y + 30).text(r.what), w - 20);
      } else {
        svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 14).attr("y", yc - 4).attr("text-anchor", "end").text(r.who);
        svg.append("text").attr("class", "t-sans").attr("x", m.l - 14).attr("y", yc + 11).attr("text-anchor", "end").text(r.what);
      }
      const measured = r.kind === "measured";
      if (r.hi > r.lo) {
        svg.append("rect").attr("x", x(r.lo)).attr("y", yc - 4.5).attr("width", x(r.hi) - x(r.lo)).attr("height", 9).attr("rx", 4.5)
          .attr("class", measured ? "bar-range" : "ring-ink").style("stroke-width", measured ? null : 1.5);
      } else {
        svg.append("circle").attr("cx", x(r.lo)).attr("cy", yc).attr("r", 5.5).attr("class", measured ? "dot-ink" : "ring-ink");
      }
      const vt = r.hi > r.lo ? `${r.lo}–${r.hi}%` : `${fmt(r.lo, 1)}%`;
      svg.append("text").attr("class", "t-strong halo").attr("x", x(r.hi) + 9).attr("y", yc).attr("dy", "0.35em").text(vt);
      const base = r.baseline === "unstated" ? "comparison fuel not stated" : "against " + r.baseline;
      const desc = `${r.who}, ${r.what}: ${vt} lower economy on E20, ${base}. ${KIND_LABEL[r.kind]}.${r.note ? " " + r.note + "." : ""}`;
      svg.append("rect").attr("class", "hit").attr("x", 0).attr("y", it.y).attr("width", w).attr("height", rowH)
        .attr("tabindex", 0).attr("role", "img").attr("aria-label", desc)
        .on("pointerenter focus", () => { tip.show(x((r.lo + r.hi) / 2), yc - 8, [{ value: vt + " less", label: `${r.who} · ${r.what}` }, { label: `${KIND_LABEL[r.kind]}, ${base}.` }]); read.textContent = desc; })
        .on("pointerleave blur", () => tip.hide());
    });
    const ay = hgt - m.b;
    svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", ay).attr("y2", ay);
    svg.append("g").selectAll("text").data(xt.filter(d => w < 420 ? d % 2 === 0 : true)).join("text").attr("x", d => x(d)).attr("y", ay + 18).attr("text-anchor", "middle").text(d => d + "%");
    svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 2).attr("text-anchor", "end").text("drop in km per litre on E20");
  }

  function tableMiles() {
    const e0 = energyRange("E0"), e10 = energyRange("E10");
    const rows = D.mileage.map(r => [r.who, r.what, r.hi > r.lo ? `${r.lo}–${r.hi}` : fmt(r.lo, 1), r.baseline === "unstated" ? "not stated" : r.baseline, KIND_LABEL[r.kind], SRC.get(r.src).short]);
    rows.push(["Energy per litre (calculated)", "US DOE test fuels, E20 against E0", `${fmt(e0[0], 2)}–${fmt(e0[1], 2)}`, "E0", "Calculated", SRC.get("ornl").short]);
    rows.push(["Energy per litre (calculated)", "US DOE test fuels, E20 against E10", `${fmt(e10[0], 2)}–${fmt(e10[1], 2)}`, "E10", "Calculated", SRC.get("ornl").short]);
    table("#table-miles", ["Source", "Vehicles", "Drop, %", "Against", "Kind", "Reference"], rows, [2]);
  }

  /* =====================================================================
     12. E20 notes, sources, downloads
     ===================================================================== */
  function buildNotes() {
    const box = $("#e20-notes");
    D.e20Notes.forEach(n => {
      const v = VEH.get(n.vehicle);
      box.append(h("div", { class: "note note--" + v.id },
        h("p", { class: "note__name" }, shapeKey(v), v.name),
        h("p", null, n.text, refs(n.src))));
    });
  }

  function buildSources() {
    const t = $("#sources-table");
    t.append(h("thead", null, h("tr", null,
      h("th", { scope: "col", text: "Source" }), h("th", { scope: "col", text: "Type" }), h("th", { scope: "col", text: "Used for" }), h("th", { scope: "col", text: "Link" }))));
    const tb = h("tbody");
    SRC.forEach(s => {
      let host = "";
      try { host = new URL(s.url).hostname.replace(/^www\./, ""); } catch (e) { host = s.url; }
      tb.append(h("tr", { id: "src-" + s.id },
        h("td", null, h("span", { class: "src-title", text: `[${s.n}] ${s.title}` }), h("span", { class: "src-meta", text: `${s.publisher} · ${s.date}` })),
        h("td", null, chip(s.kind)),
        h("td", { class: "src-used", text: s.used }),
        h("td", null, s.url ? h("a", { href: s.url, rel: "noopener", target: "_blank", text: host }) : "Not online")));
    });
    t.append(tb);
  }

  function csv(rows) {
    return rows.map(r => r.map(c => {
      const s = c == null ? "" : String(c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\n") + "\n";
  }

  function buildDownloads() {
    const box = $("#downloads");
    box.append(h("span", { class: "downloads__label", text: "Download the data as CSV" }));
    const sets = [
      ["stoichiometric-afr.csv", () => csv([["fuel", "ethanol_pct_vol", "stoich_afr", "kind", "source"],
        ...D.stoich.published.map(p => [p.label, p.ethanol, p.afr, "published", SRC.get(p.src).url]),
        ...d3.range(0, 101, 5).map(v => [`E${v}`, v, stoichAt(v).toFixed(3), "calculated", "mass-weighted blend; see Method"])])],
      ["lambda-targets.csv", () => csv([["target", "lambda_low", "lambda_high", "approx", "source"], ...D.targets.map(t => [t.label, t.lo, t.hi, t.approx ? "yes" : "", SRC.get(t.src).url])])],
      ["full-throttle-lambda.csv", () => csv([["vehicle", "lambda", "range_low", "range_high", "afr_petrol_scale", "approx", "kind", "note", "source"], ...D.fullThrottle.map(r => [r.label, r.lambda, r.lo, r.hi, r.afr, r.approx ? "yes" : "", r.kind, r.note, r.src ? SRC.get(r.src).url : ""])])],
      ["relative-ea888-gen3-stock-vs-stage1.csv", () => csv([["calibration", "t_s", "rpm", "lambda", "charge_bar_abs_specified", "charge_bar_abs_actual", "intake_air_c", "throttle_pct", "source"],
        ...D.gen3.stock.map(r => ["stock", ...r, SRC.get("aet-stock").url]), ...D.gen3.stage1.map(r => ["stage 1", ...r, SRC.get("aet-stg1").url])])],
      ["relative-r18-civic-wot-histogram.csv", () => csv([["fuel", "lambda", "samples", "kind", "source"],
        ...D.civicWot.e0.map(p => ["E0", p[0], p[1], "digitised", SRC.get("ornl11").url]), ...D.civicWot.e20.map(p => ["E20", p[0], p[1], "digitised", SRC.get("ornl11").url])])],
      ["sy416-dyno-digitised.csv", () => csv([["rpm", "wheel_torque_nm", "wheel_power_hp", "kind", "source"], ...D.balenoDyno.rows.map(r => [...r, "digitised", SRC.get("rd").url])])],
      ["relative-1.8t-stock-vs-chipped.csv", () => csv([["map", "rpm", "lambda", "kind", "source"], ...D.s3.stock.map(p => ["stock", p[0], p[1], "relative", SRC.get("rs246").url]), ...D.s3.chipped.map(p => ["chipped", p[0], p[1], "relative", SRC.get("rs246").url])])],
      ["relative-1.8t-egt-protection.csv", () => csv([["pull", "rpm", "lambda_measured", "lambda_requested", "egt_modelled_c", "enrichment_pct", "source"], ...D.leonR.runA.map(r => ["1", r[0], r[1], r[2], "", "", SRC.get("sc18t").url]), ...D.leonR.runB.map(r => ["2", r[0], "", "", r[1], r[2], SRC.get("sc18t").url])])],
      ["relative-vw-1.6-drive.csv", () => csv([["t_s", "lambda_measured", "lambda_requested", "rpm", "load_pct", "injection_ms", "map_mbar", "source"], ...D.drive16.rows.map(r => [...r, SRC.get("sc16").url])])],
      ["relative-g13b-o2-trace.csv", () => csv([["x_div", "y_div", "kind", "source"], ...D.g13b.rows.map(r => [r[0], r[1], "digitised", SRC.get("tbhp-unichip").url])])],
      ["india-ethanol-blend.csv", () => csv([["ethanol_supply_year", "blend_pct", "note", "source"], ...D.blending.map(b => [b.esy, b.pct, b.note || "", b.src ? SRC.get(b.src).url : ""])])],
      ["pump-ethanol-aug-2025.csv", () => csv([["fuel", "ethanol_low_pct", "ethanol_high_pct", "when", "source"], ...D.pump.rows.map(r => [r.fuel, r.lo, r.hi, D.pump.when, SRC.get(D.pump.src).url])])],
      ["us-doe-test-fuels.csv", () => csv([["lab", "fuel", "ethanol_pct_vol", "lhv_btu_lbm", "specific_gravity", "oxygen_mass_fraction", "energy_per_litre_index", "source"], ...fuelRows().map(f => [f.lab, f.fuel, f.etoh, f.lhv, f.sg, f.o, f.energy.toFixed(3), SRC.get("ornl").url])])],
      ["e20-economy-claims.csv", () => csv([["source", "vehicles", "drop_low_pct", "drop_high_pct", "baseline", "kind", "url"], ...D.mileage.map(r => [r.who, r.what, r.lo, r.hi, r.baseline, r.kind, SRC.get(r.src).url])])],
      ["sources.csv", () => csv([["n", "id", "title", "publisher", "date", "kind", "used_for", "url"], ...[...SRC.values()].map(s => [s.n, s.id, s.title, s.publisher, s.date, s.kind, s.used, s.url])])]
    ];
    sets.forEach(([name, make]) => {
      const b = h("button", { class: "btn", type: "button", text: name.replace(".csv", "") });
      b.addEventListener("click", () => {
        try {
          const blob = new Blob([make()], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = h("a", { href: url, download: name });
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) { b.textContent = "Download blocked here"; }
      });
      box.append(b);
    });
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const btn = $("#theme-btn");
    const order = ["light", "dark"];
    let mode = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    function apply() {
      document.documentElement.setAttribute("data-theme", mode);
      btn.replaceChildren(h("span", { class: "btn-extra", text: "Theme · " }), mode);
      btn.setAttribute("aria-label", "Colour theme: " + mode + ". Change theme");
      try { localStorage.setItem("afr-theme", mode); } catch (e) { /* storage unavailable */ }
    }
    btn.addEventListener("click", () => { mode = order[(order.indexOf(mode) + 1) % order.length]; apply(); });
    apply();
  }

  /* ---------- boot ---------- */
  initTheme();
  buildSeg($("#fuel-seg-hero"), "fuel-hero");
  buildSeg($("#fuel-seg-ruler"), "fuel-ruler");
  updateGauge();
  buildCards();
  buildMatrix();
  buildMilestones();
  buildPumpExtras();
  buildNotes();
  buildSources();
  buildDownloads();
  tableStoich(); tableRuler(); tableDyno(); tableWot(); tableCurves(); tableGen3(); tableEgt(); tableDrive(); tableO2(); tableOrnl(); tableCivic(); tableProps(); tableMiles();

  const cStoich = register($("#chart-stoich"), renderStoich);
  const cRuler = register($("#chart-ruler"), renderRuler);
  register($("#chart-dyno"), renderDyno);
  register($("#chart-wot"), renderWot);
  register($("#chart-curves"), renderCurves);
  register($("#chart-gen3"), renderGen3);
  register($("#chart-egt"), renderEgt);
  register($("#chart-drive"), renderDrive);
  register($("#chart-o2"), renderO2);
  register($("#chart-blend"), renderBlend);
  register($("#chart-pump"), renderPump);
  register($("#chart-ornl"), renderOrnl);
  register($("#chart-civic"), renderCivic);
  register($("#chart-props"), renderProps);
  register($("#chart-miles"), renderMiles);
  onFuel.push(updateGauge, () => redraw(cStoich), () => redraw(cRuler));
})();
