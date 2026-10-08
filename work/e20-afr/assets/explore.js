/* Lambda & E20 — explore layer.
   3D engine-map view (three.js), a telemetry monitor with selectable stretches and live statistics,
   a field-against-field explorer with a query readout, the source-to-chart lineage map and the token sheet.
   Same rules as app.js: every number comes from window.AFR, text goes in with textContent. */
(function () {
  "use strict";
  const D = window.AFR, d3 = window.d3;
  if (!D || !d3) return;

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const NF = {};
  const fmt = (v, d = 1) => (NF[d] = NF[d] || new Intl.NumberFormat("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })).format(v);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SRC = new Map(D.sources.map((s, i) => [s.id, Object.assign({ n: i + 1 }, s)]));
  const KIND = { measured: "Measured", relative: "Close relative", oem: "Manufacturer", owner: "Owner", published: "Published", statement: "Statement" };

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else n.setAttribute(k, v);
    }
    kids.flat().forEach(c => { if (c != null) n.append(c); });
    return n;
  }
  function makeTip(container) {
    const tip = h("div", { class: "tip", role: "presentation" });
    tip.hidden = true;
    container.append(tip);
    return {
      show(x, y, rows) {
        tip.replaceChildren();
        rows.forEach(r => {
          if (r.value != null) tip.append(h("span", { class: "tip__v", text: r.value }));
          if (r.label != null) tip.append(h("span", { class: "tip__l", text: r.label }));
        });
        tip.hidden = false;
        const cw = container.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
        tip.style.left = Math.max(tw / 2 + 2, Math.min(cw - tw / 2 - 2, x)) + "px";
        tip.style.top = y + "px";
        tip.style.transform = y - th - 14 < 0 ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 12px))";
      },
      hide() { tip.hidden = true; }
    };
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
  const redraws = [];
  function register(el, render) {
    let w = 0;
    const go = () => { const nw = Math.floor(el.clientWidth); if (nw > 0 && Math.abs(nw - w) > 2) { w = nw; render(nw); } };
    new ResizeObserver(go).observe(el);
    go();
    const again = () => { if (w) render(w); };
    redraws.push(again);
    return again;
  }
  function svgIn(el, w, hgt, label) {
    d3.select(el).selectAll("svg").remove();
    return d3.select(el).append("svg").attr("viewBox", `0 0 ${w} ${hgt}`).attr("width", w).attr("height", hgt).attr("role", "img").attr("aria-label", label);
  }
  /* any CSS colour (including oklch) to [r,g,b] 0..1, by painting one pixel */
  const pix = document.createElement("canvas"); pix.width = pix.height = 1;
  const pctx = pix.getContext("2d", { willReadFrequently: true });
  function rgbOf(cssColor) {
    pctx.clearRect(0, 0, 1, 1);
    pctx.fillStyle = "#000"; pctx.fillStyle = cssColor; pctx.fillRect(0, 0, 1, 1);
    const d = pctx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  const tokenRGB = name => rgbOf(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  const hex = c => "#" + c.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  const themeListeners = [];
  new MutationObserver(() => themeListeners.forEach(f => f())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => themeListeners.forEach(f => f()));

  /* ---------- reading progress ---------- */
  const bar = $("#progress-bar");
  if (bar) {
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
    };
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    upd();
  }

  /* ---------- the drive log, classified ---------- */
  const T0 = D.drive16.rows[0][0];
  const ROWS = D.drive16.rows.map((r, i) => ({ i, t: r[0] - T0, act: r[1], spec: r[2], rpm: r[3], load: r[4], inj: r[5], map: r[6] }));

  /* Class rule, as printed under the monitor */
  function classify(r) {
    if (r.act >= 1.2) return "cut";       // sensor pinned at 1.20: injectors off on lift-off
    if (r.spec < 0.98) return "rich";     // the computer asked for extra fuel
    return "closed";                      // holding λ 1 on the oxygen sensor
  }
  ROWS.forEach(r => { r.mode = classify(r); });
  const MODE_LABEL = { closed: "closed loop", rich: "enrichment", cut: "fuel cut" };

  /* Statistics for any set of samples; this exact function is printed on the page */
  function summarise(rows) {
    const closed = rows.filter(r => r.mode === "closed");
    const lam = closed.map(r => r.act);
    const share = m => rows.filter(r => r.mode === m).length / rows.length;
    return {
      samples: rows.length,
      seconds: d3.sum(rows, r => (r.i < ROWS.length - 1 ? ROWS[r.i + 1].t : r.t + 2) - r.t), // time covered by these samples
      closedShare: share("closed"),
      richShare: share("rich"),
      cutShare: share("cut"),
      meanLambda: lam.length ? d3.mean(lam) : null,
      sdLambda: lam.length > 1 ? d3.deviation(lam) : null,
      inMotBand: lam.length ? lam.filter(v => v >= 0.97 && v <= 1.03).length / lam.length : null,
      maxRpm: d3.max(rows, r => r.rpm)
    };
  }

  /* selection shared by the monitor, the stats and the 3D view */
  const sel = { label: "the whole drive", has: () => true };
  const selListeners = [];
  function setSelection(label, has) {
    sel.label = label; sel.has = has;
    selListeners.forEach(f => f());
  }
  const pulls = (() => {
    const out = new Set(); let run = [];
    ROWS.forEach(r => {
      if (r.load >= 70 && r.map >= 940) run.push(r.i);
      else { if (run.length >= 3) run.forEach(i => out.add(i)); run = []; }
    });
    return out;
  })();
  const finalIdleStart = (() => { let i = ROWS.length - 1; while (i > 0 && ROWS[i - 1].rpm < 900) i--; return i; })();

  /* =====================================================================
     1. 3D engine-map view
     ===================================================================== */
  (function three() {
    const wrap = $("#three-wrap"), canvas = $("#three-canvas"), labels = $("#three-labels"), read = $("#three-read");
    if (!wrap) return;
    table("#table-3d", ["Seconds", "rpm", "Load %", "λ measured", "Class"], ROWS.map(r => [fmt(r.t, 1), fmt(r.rpm, 0), fmt(r.load, 1), fmt(r.act, 3), MODE_LABEL[r.mode]]), [0, 1, 2, 3]);
    let renderer;
    try { if (window.THREE) renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
    if (!renderer) { $("#three-fallback").hidden = false; canvas.hidden = true; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    // data space to scene space
    const X = v => (v / 6000) * 2 - 1;          // rpm 0–6000
    const Z = v => 0.7 - (v / 100) * 1.4;        // load 0–100 %, high load towards the back
    const Y = v => ((v - 0.75) / 0.5) * 1.2 - 0.6; // λ 0.75–1.25
    const P = r => new THREE.Vector3(X(r.rpm), Y(r.act), Z(r.load));

    // round point sprite
    const spr = document.createElement("canvas"); spr.width = spr.height = 64;
    const sc = spr.getContext("2d"); sc.beginPath(); sc.arc(32, 32, 28, 0, Math.PI * 2); sc.fillStyle = "#fff"; sc.fill();
    const sprite = new THREE.CanvasTexture(spr);

    const pos = new Float32Array(ROWS.length * 3), col = new Float32Array(ROWS.length * 3);
    ROWS.forEach((r, i) => { const p = P(r); pos.set([p.x, p.y, p.z], i * 3); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pmat = new THREE.PointsMaterial({ size: 9, sizeAttenuation: false, vertexColors: true, map: sprite, alphaTest: 0.5, transparent: true });
    scene.add(new THREE.Points(geo, pmat));

    const path = new THREE.BufferGeometry().setFromPoints(ROWS.map(P));
    const pathMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.12 });
    scene.add(new THREE.Line(path, pathMat));

    // floor grid, uprights and the λ 1 plane
    const gridMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
    const g = [];
    const y0 = Y(0.75), y1 = Y(1.25);
    [0, 1000, 2000, 3000, 4000, 5000, 6000].forEach(v => g.push(new THREE.Vector3(X(v), y0, Z(0)), new THREE.Vector3(X(v), y0, Z(100))));
    [0, 25, 50, 75, 100].forEach(v => g.push(new THREE.Vector3(X(0), y0, Z(v)), new THREE.Vector3(X(6000), y0, Z(v))));
    [[0, 100], [6000, 100], [0, 0]].forEach(([a, b]) => g.push(new THREE.Vector3(X(a), y0, Z(b)), new THREE.Vector3(X(a), y1, Z(b))));
    [0.8, 0.9, 1.0, 1.1, 1.2].forEach(v => g.push(new THREE.Vector3(X(0), Y(v), Z(100)), new THREE.Vector3(X(6000), Y(v), Z(100))));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(g), gridMat));
    const planeMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4), planeMat);
    plane.rotation.x = -Math.PI / 2; plane.position.y = Y(1);
    scene.add(plane);

    // HTML labels projected from scene anchors
    const L = [];
    const lab = (text, v3, cls) => { const s = h("span", { class: cls || null, text }); labels.append(s); L.push([s, v3]); };
    [0, 2000, 4000, 6000].forEach(v => lab(fmt(v, 0), new THREE.Vector3(X(v), y0 - 0.06, Z(0) + 0.1)));
    lab("engine speed, rpm", new THREE.Vector3(0, y0 - 0.16, Z(0) + 0.22), "ax");
    [0, 50, 100].forEach(v => lab(v + "%", new THREE.Vector3(X(6000) + 0.12, y0, Z(v))));
    lab("load", new THREE.Vector3(X(6000) + 0.28, y0, Z(50)), "ax");
    [0.8, 1.0, 1.2].forEach(v => lab(fmt(v, 1), new THREE.Vector3(X(0) - 0.1, Y(v), Z(100))));
    lab("λ", new THREE.Vector3(X(0) - 0.12, y1 + 0.1, Z(100)), "ax");

    // colours from the theme
    function paint() {
      const rich = tokenRGB("--rich"), lean = tokenRGB("--lean"), mid = tokenRGB("--axis"), surf = tokenRGB("--surface"), ink = tokenRGB("--ink");
      ROWS.forEach((r, i) => {
        let c = r.act < 0.97 ? rich : r.act > 1.03 ? lean : mid;
        if (!sel.has(r)) c = c.map((v, k) => v * 0.18 + surf[k] * 0.82);
        col.set(c, i * 3);
      });
      geo.attributes.color.needsUpdate = true;
      pathMat.color.setRGB(...ink); gridMat.color.setRGB(...mid); planeMat.color.setRGB(...ink);
      draw();
    }

    // camera on a sphere around the centre
    const cam = { theta: -0.72, phi: 1.02, r: 4.3 };
    const VIEWS = { iso: { theta: -0.72, phi: 1.02 }, map: { theta: 0, phi: 0.02 }, side: { theta: 0, phi: Math.PI / 2 - 0.001 } };
    function place() {
      camera.position.set(cam.r * Math.sin(cam.phi) * Math.sin(cam.theta), cam.r * Math.cos(cam.phi), cam.r * Math.sin(cam.phi) * Math.cos(cam.theta));
      camera.lookAt(0, 0, 0);
    }
    let W = 1, H = 1;
    function size() {
      W = wrap.clientWidth; H = wrap.clientHeight;
      renderer.setSize(W, H, false); camera.aspect = W / H;
      cam.r = W < 520 ? 5.6 : 4.3;
      camera.updateProjectionMatrix(); draw();
    }
    function draw() {
      place();
      renderer.render(scene, camera);
      L.forEach(([s, v]) => {
        const p = v.clone().project(camera);
        s.style.left = ((p.x + 1) / 2 * W) + "px";
        s.style.top = ((1 - p.y) / 2 * H) + "px";
        s.style.visibility = p.z < 1 ? "visible" : "hidden";
      });
    }
    let anim = null;
    function goView(name) {
      const to = VIEWS[name];
      wrap.parentElement.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
      if (reduce) { cam.theta = to.theta; cam.phi = to.phi; draw(); return; }
      const from = { theta: cam.theta, phi: cam.phi }, t0 = performance.now();
      cancelAnimationFrame(anim);
      const step = now => {
        const k = Math.min(1, (now - t0) / 650), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        cam.theta = from.theta + (to.theta - from.theta) * e; cam.phi = from.phi + (to.phi - from.phi) * e;
        draw(); if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    document.querySelectorAll("#fig-3d [data-view]").forEach(b => b.addEventListener("click", () => goView(b.dataset.view)));

    // drag to turn, nearest-point tooltip
    const tip = makeTip(wrap);
    let drag = null;
    wrap.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, th: cam.theta, ph: cam.phi }; wrap.setPointerCapture(e.pointerId); tip.hide(); });
    wrap.addEventListener("pointerup", () => { drag = null; });
    wrap.addEventListener("pointercancel", () => { drag = null; });
    wrap.addEventListener("pointermove", e => {
      if (drag) {
        cam.theta = drag.th - (e.clientX - drag.x) * 0.008;
        cam.phi = Math.max(0.02, Math.min(Math.PI / 2 - 0.001, drag.ph - (e.clientY - drag.y) * 0.008));
        wrap.parentElement.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", "false"));
        draw(); return;
      }
      const b = wrap.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top;
      let best = null, bd = 144;
      ROWS.forEach(r => {
        const p = P(r).project(camera), sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H, d = (sx - mx) ** 2 + (sy - my) ** 2;
        if (d < bd) { bd = d; best = { r, sx, sy }; }
      });
      if (best) {
        const r = best.r;
        tip.show(best.sx, best.sy, [{ value: `λ ${fmt(r.act, 3)}` }, { label: `${fmt(r.rpm, 0)} rpm · load ${fmt(r.load, 0)}% · ${fmt(r.t, 0)} s · ${MODE_LABEL[r.mode]}` }]);
      } else tip.hide();
    });
    wrap.addEventListener("pointerleave", () => tip.hide());
    wrap.addEventListener("keydown", e => {
      const k = e.key, s = e.shiftKey ? 0.3 : 0.1;
      if (k === "ArrowLeft") cam.theta += s; else if (k === "ArrowRight") cam.theta -= s;
      else if (k === "ArrowUp") cam.phi = Math.max(0.02, cam.phi - s); else if (k === "ArrowDown") cam.phi = Math.min(Math.PI / 2 - 0.001, cam.phi + s);
      else return;
      e.preventDefault(); draw();
      read.textContent = `View turned to ${Math.round(((cam.theta * 180 / Math.PI) % 360 + 360) % 360)}° around, ${Math.round(90 - cam.phi * 180 / Math.PI)}° above the floor.`;
    });

    new ResizeObserver(size).observe(wrap);
    themeListeners.push(paint);
    selListeners.push(paint);
    size(); paint();
  })();

  /* =====================================================================
     2. Monitor: classes over time, selectable, with statistics
     ===================================================================== */
  const monitorEl = $("#chart-monitor");
  let monitorRedraw = () => {};
  if (monitorEl) {
    const TMAX = ROWS[ROWS.length - 1].t;
    monitorRedraw = register(monitorEl, w => {
      const m = { t: 22, r: 14, b: 34, l: 42 }, ph = w < 520 ? 110 : 130, sh = 22, gap = 14;
      const hgt = m.t + ph + gap + sh + m.b;
      const x = d3.scaleLinear([0, TMAX], [m.l, w - m.r]);
      const y = d3.scaleLinear([0.75, 1.24], [m.t + ph, m.t]);
      const svg = svgIn(monitorEl, w, hgt, "Lambda over the six-minute drive with a strip below classing each sample as closed loop, enrichment or fuel cut. Drag across to select a stretch.");
      svg.append("rect").attr("class", "band-soft").attr("x", m.l).attr("width", w - m.l - m.r).attr("y", y(1.03)).attr("height", y(0.97) - y(1.03));
      svg.append("g").attr("class", "grid").selectAll("line").data([0.8, 1.0, 1.2]).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data([0.8, 1.0, 1.2]).join("text").attr("x", m.l - 8).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => fmt(d, 1));
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", 12).text("Lambda measured");
      svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", 12).attr("text-anchor", "end").text("band: 0.97–1.03");
      svg.append("path").attr("class", "line-spec").attr("d", d3.line().x(r => x(r.t)).y(r => y(r.act))(ROWS));
      const sy = m.t + ph + gap;
      const selG = svg.append("g");
      ROWS.forEach((r, i) => {
        const x1 = i < ROWS.length - 1 ? x(ROWS[i + 1].t) : x(r.t) + 2;
        svg.append("rect").attr("x", x(r.t)).attr("width", Math.max(1, x1 - x(r.t))).attr("y", sy).attr("height", sh)
          .style("fill", `var(--mode-${r.mode === "closed" ? "closed" : r.mode})`);
      });
      svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", sy + sh + 2).attr("y2", sy + sh + 2);
      const xt = w < 560 ? [0, 120, 240, 360] : [0, 60, 120, 180, 240, 300, 360];
      svg.append("g").selectAll("text").data(xt).join("text").attr("x", d => x(d)).attr("y", sy + sh + 18).attr("text-anchor", (d, i, a) => i === 0 ? "start" : i === a.length - 1 ? "end" : "middle").text(d => `${d / 60} min`);
      // marks for set-type selections
      function marks() {
        selG.selectAll("*").remove();
        ROWS.forEach((r, i) => {
          if (!sel.has(r)) return;
          const x1 = i < ROWS.length - 1 ? x(ROWS[i + 1].t) : x(r.t) + 2;
          selG.append("rect").attr("x", x(r.t)).attr("width", Math.max(1, x1 - x(r.t))).attr("y", m.t - 6).attr("height", 3).style("fill", "var(--accent)");
        });
      }
      marks();
      selListeners.length = Math.min(selListeners.length, 1); // keep the 3D painter, replace monitor marks
      selListeners.push(marks, updateStats);
      const brush = d3.brushX().extent([[m.l, m.t], [w - m.r, sy + sh]])
        .on("brush end", ev => {
          if (!ev.sourceEvent) return;
          if (!ev.selection) { setSelection("the whole drive", () => true); return; }
          const [a, b] = ev.selection.map(x.invert);
          setSelection(`${fmt(a, 0)} s to ${fmt(b, 0)} s`, r => r.t >= a && r.t <= b);
        });
      svg.append("g").attr("class", "brush").call(brush);
      monitorEl.__clearBrush = () => svg.select(".brush").call(brush.move, null);
    });

    function tile(v, l) { return h("div", { class: "tile" }, h("b", { text: v }), h("span", { text: l })); }
    function updateStats() {
      const rows = ROWS.filter(r => sel.has(r));
      const box = $("#monitor-tiles");
      if (!rows.length) { box.replaceChildren(tile("–", "No samples in this stretch")); drawHist([]); return; }
      const s = summarise(rows);
      const pc = v => v == null ? "–" : fmt(v * 100, 0) + "%";
      box.replaceChildren(
        tile(`${s.samples}`, `samples in ${sel.label}, ${fmt(s.seconds, 0)} s`),
        tile(pc(s.closedShare), "in closed loop at λ 1"),
        tile(s.meanLambda == null ? "–" : `${fmt(s.meanLambda, 3)}`, s.sdLambda == null ? "mean λ in closed loop" : `mean λ in closed loop, SD ${fmt(s.sdLambda, 3)}`),
        tile(pc(s.inMotBand), "of closed-loop samples inside 0.97–1.03"),
        tile(pc(s.richShare), "with enrichment requested"),
        tile(pc(s.cutShare), "in fuel cut"),
      );
      drawHist(rows.filter(r => r.mode === "closed").map(r => r.act), s.meanLambda);
    }
    let histData = [], histMean = null;
    const histRedraw = register($("#chart-hist"), w => paintHist(w));
    function drawHist(vals, mean) { histData = vals; histMean = mean; histRedraw(); }
    function paintHist(w) {
      const el = $("#chart-hist");
      const m = { t: 26, r: 12, b: 34, l: 34 }, hgt = 200;
      const x = d3.scaleLinear([0.84, 1.16], [m.l, w - m.r]);
      const bins = d3.bin().domain([0.84, 1.16]).thresholds(d3.range(0.84, 1.1601, 0.02))(histData);
      const y = d3.scaleLinear([0, Math.max(4, d3.max(bins, b => b.length) || 0)], [hgt - m.b, m.t]).nice();
      const svg = svgIn(el, w, hgt, `Histogram of ${histData.length} closed-loop lambda readings in the selection.`);
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", 12).text("Closed-loop λ, samples per 0.02");
      svg.append("rect").attr("class", "band-soft").attr("x", x(0.97)).attr("width", x(1.03) - x(0.97)).attr("y", m.t).attr("height", hgt - m.t - m.b);
      svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(4)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").selectAll("text").data(y.ticks(4)).join("text").attr("x", m.l - 6).attr("y", d => y(d)).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d);
      bins.forEach(b => {
        if (!b.length) return;
        const bw = Math.max(2, x(b.x1) - x(b.x0) - 2);
        svg.append("rect").attr("class", "bar-ink").attr("x", x(b.x0) + 1).attr("width", bw).attr("y", y(b.length)).attr("height", y(0) - y(b.length)).attr("rx", 2);
      });
      if (histMean != null) {
        svg.append("line").attr("class", "refline").attr("x1", x(histMean)).attr("x2", x(histMean)).attr("y1", m.t - 4).attr("y2", hgt - m.b);
        svg.append("text").attr("class", "t-strong halo").attr("x", x(histMean) + 5).attr("y", m.t + 6).text(`mean ${fmt(histMean, 3)}`);
      }
      if (!histData.length) svg.append("text").attr("class", "t-italic").attr("x", (m.l + w - m.r) / 2).attr("y", hgt / 2).attr("text-anchor", "middle").text("No closed-loop samples here");
      svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0));
      svg.append("g").selectAll("text").data([0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]).join("text").attr("x", d => x(d)).attr("y", hgt - m.b + 16).attr("text-anchor", "middle").text(d => fmt(d, 2));
    }

    $("#monitor-reset").addEventListener("click", () => { monitorEl.__clearBrush && monitorEl.__clearBrush(); setSelection("the whole drive", () => true); });
    $("#monitor-pulls").addEventListener("click", () => { monitorEl.__clearBrush && monitorEl.__clearBrush(); setSelection("the two full-throttle pulls", r => pulls.has(r.i)); });
    $("#monitor-idle").addEventListener("click", () => { monitorEl.__clearBrush && monitorEl.__clearBrush(); setSelection("the final idle", r => r.i >= finalIdleStart); });
    $("#monitor-code").textContent = classify.toString() + "\n\n" + summarise.toString();
    updateStats();
  }

  /* =====================================================================
     3. Explorer
     ===================================================================== */
  const DATASETS = (() => {
    const yr = s => +s.slice(0, 4);
    return {
      drive: {
        label: "VW 1.6 drive log (SEATCupra, 2012)", table: "vw16_drive",
        fields: { t: "seconds", act: "lambda_measured", spec: "lambda_requested", rpm: "rpm", load: "load_pct", inj: "injection_ms", map: "manifold_mbar" },
        names: { t: "Time, s", act: "λ measured", spec: "λ requested", rpm: "Engine speed, rpm", load: "Load, %", inj: "Injection time, ms", map: "Manifold pressure, mbar" },
        rows: ROWS,
        filters: [["all", "All rows", null], ["closed", "Closed loop only", "mode = 'closed loop'"], ["rich", "Enrichment only", "mode = 'enrichment'"], ["nocut", "Leave out fuel cut", "mode <> 'fuel cut'"]],
        test: (f, r) => f === "all" || (f === "nocut" ? r.mode !== "cut" : r.mode === f),
        x: "rpm", y: "act"
      },
      s3: {
        label: "1.8T 20V pulls, stock and chipped (RS246, 2005)", table: "audi_s3_pulls",
        fields: { rpm: "rpm", lam: "lambda" }, names: { rpm: "Engine speed, rpm", lam: "λ measured" },
        rows: [...D.s3.stock.map(p => ({ map: "stock", rpm: p[0], lam: p[1] })), ...D.s3.chipped.map(p => ({ map: "chipped", rpm: p[0], lam: p[1] }))],
        filters: [["all", "Both maps", null], ["stock", "Stock map", "map = 'stock'"], ["chipped", "Chipped map", "map = 'chipped'"]],
        test: (f, r) => f === "all" || r.map === f, x: "rpm", y: "lam"
      },
      gen3: {
        label: "EA888 Gen 3 2.0 pulls, stock and Stage 1 (AET Motorsport, 2023)", table: "ea888_gen3_pulls",
        fields: { t: "seconds", rpm: "rpm", lam: "lambda", spec: "charge_bar_abs_specified", act: "charge_bar_abs_actual", iat: "intake_air_c", thr: "throttle_pct" },
        names: { t: "Time, s", rpm: "Engine speed, rpm", lam: "λ measured", spec: "Charge pressure specified, bar abs", act: "Charge pressure actual, bar abs", iat: "Intake air, °C", thr: "Throttle, %" },
        rows: [["stock", D.gen3.stock], ["stage1", D.gen3.stage1]].flatMap(([cal, arr]) => arr.map(r => ({ cal, t: r[0], rpm: r[1], lam: r[2], spec: r[3], act: r[4], iat: r[5], thr: r[6] }))),
        filters: [["all", "Both calibrations", null], ["stock", "Stock", "calibration = 'stock'"], ["stage1", "Stage 1", "calibration = 'stage 1'"]],
        test: (f, r) => f === "all" || r.cal === f, x: "act", y: "lam"
      },
      leonA: {
        label: "Remapped 1.8T, lambda pull (SEATCupra, 2013)", table: "leon_18t_pull1",
        fields: { rpm: "rpm", act: "lambda_measured", spec: "lambda_requested" }, names: { rpm: "Engine speed, rpm", act: "λ measured", spec: "λ requested" },
        rows: D.leonR.runA.map(r => ({ rpm: r[0], act: r[1], spec: r[2] })), filters: [["all", "All rows", null]], test: () => true, x: "rpm", y: "act"
      },
      leonB: {
        label: "Remapped 1.8T, exhaust-temperature pull (SEATCupra, 2013)", table: "leon_18t_pull2",
        fields: { rpm: "rpm", egt: "egt_modelled_c", enr: "enrichment_pct" }, names: { rpm: "Engine speed, rpm", egt: "Modelled exhaust temperature, °C", enr: "Enrichment factor, %" },
        rows: D.leonR.runB.map(r => ({ rpm: r[0], egt: r[1], enr: r[2] })), filters: [["all", "All rows", null]], test: () => true, x: "egt", y: "enr"
      },
      fuels: {
        label: "Twelve US DOE test fuels (2009)", table: "doe_test_fuels",
        fields: { etoh: "ethanol_pct_vol", lhv: "lhv_btu_lbm", sg: "specific_gravity", o: "oxygen_pct_mass", energy: "energy_per_litre_index" },
        names: { etoh: "Ethanol, % by volume", lhv: "Heating value, Btu/lbm", sg: "Specific gravity", o: "Oxygen, % by mass", energy: "Energy per litre, E0 = 100" },
        rows: (() => { const e0 = {}; D.ornlFuels.filter(f => f.fuel === "E0").forEach(f => { e0[f.lab] = f.lhv * f.sg; }); return D.ornlFuels.map(f => ({ lab: f.lab, etoh: f.etoh, lhv: f.lhv, sg: f.sg, o: f.o * 100, energy: f.lhv * f.sg / e0[f.lab] * 100 })); })(),
        filters: [["all", "All three labs", null], ["NREL", "NREL fuels", "lab = 'NREL'"], ["ORNL", "ORNL fuels", "lab = 'ORNL'"], ["ANL", "ANL fuels", "lab = 'ANL'"]],
        test: (f, r) => f === "all" || r.lab === f, x: "etoh", y: "energy"
      },
      dyno: {
        label: "SY416 chassis dyno, digitised (Race Dynamics, 2015)", table: "sy416_dyno",
        fields: { rpm: "rpm", nm: "wheel_torque_nm", hp: "wheel_power_hp" }, names: { rpm: "Engine speed, rpm", nm: "Wheel torque, N·m", hp: "Wheel power, hp" },
        rows: D.balenoDyno.rows.map(r => ({ rpm: r[0], nm: r[1], hp: r[2] })), filters: [["all", "All rows", null]], test: () => true, x: "rpm", y: "nm"
      },
      blend: {
        label: "Average ethanol in Indian petrol (government figures)", table: "india_blend",
        fields: { year: "supply_year_start", pct: "blend_pct" }, names: { year: "Supply year starting", pct: "Average ethanol, %" },
        rows: D.blending.filter(b => b.pct != null).map(b => ({ year: yr(b.esy), pct: b.pct })), filters: [["all", "Years with a figure", null]], test: () => true, x: "year", y: "pct"
      }
    };
  })();

  (function explorer() {
    const dsSel = $("#ex-ds"), xSel = $("#ex-x"), ySel = $("#ex-y"), fSel = $("#ex-filter");
    if (!dsSel) return;
    Object.entries(DATASETS).forEach(([k, d]) => dsSel.append(h("option", { value: k, text: d.label })));
    function fillFields() {
      const d = DATASETS[dsSel.value];
      [xSel, ySel].forEach(s => s.replaceChildren(...Object.keys(d.fields).map(k => h("option", { value: k, text: d.names[k] }))));
      xSel.value = d.x; ySel.value = d.y;
      fSel.replaceChildren(...d.filters.map(f => h("option", { value: f[0], text: f[1] })));
    }
    const redraw = register($("#chart-explorer"), w => render(w));
    function current() {
      const d = DATASETS[dsSel.value], xf = xSel.value, yf = ySel.value, f = fSel.value || "all";
      const pts = d.rows.filter(r => d.test(f, r) && r[xf] != null && r[yf] != null && isFinite(r[xf]) && isFinite(r[yf]));
      const where = (d.filters.find(q => q[0] === f) || [])[2];
      $("#ex-query").textContent = `SELECT ${d.fields[xf]}, ${d.fields[yf]}\nFROM ${d.table}` + (where ? `\nWHERE ${where}` : "") + ";";
      return { d, xf, yf, pts };
    }
    function pearson(a, b) {
      const ma = d3.mean(a), mb = d3.mean(b);
      let num = 0, da = 0, db = 0;
      a.forEach((v, i) => { num += (v - ma) * (b[i] - mb); da += (v - ma) ** 2; db += (b[i] - mb) ** 2; });
      return da && db ? num / Math.sqrt(da * db) : null;
    }
    function render(w) {
      const { d, xf, yf, pts } = current();
      const el = $("#chart-explorer");
      const hgt = w < 520 ? 280 : 340, m = { t: 26, r: 18, b: 44, l: 56 };
      const xe = d3.extent(pts, r => r[xf]), ye = d3.extent(pts, r => r[yf]);
      const pad = (e) => { const s = (e[1] - e[0]) || Math.abs(e[0]) || 1; return [e[0] - s * 0.06, e[1] + s * 0.06]; };
      const x = d3.scaleLinear(pts.length ? pad(xe) : [0, 1], [m.l, w - m.r]).nice();
      const y = d3.scaleLinear(pts.length ? pad(ye) : [0, 1], [hgt - m.b, m.t]).nice();
      const svg = svgIn(el, w, hgt, `Scatter of ${d.names[yf]} against ${d.names[xf]}, ${pts.length} points.`);
      const yt = y.ticks(5), xt = x.ticks(w < 520 ? 4 : 7);
      svg.append("g").attr("class", "grid").selectAll("line").data(yt).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", v => y(v)).attr("y2", v => y(v));
      svg.append("g").selectAll("text").data(yt).join("text").attr("x", m.l - 8).attr("y", v => y(v)).attr("dy", "0.32em").attr("text-anchor", "end").text(v => d3.format("~g")(v));
      svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", w - m.r).attr("y1", hgt - m.b).attr("y2", hgt - m.b);
      svg.append("g").selectAll("text").data(xt).join("text").attr("x", v => x(v)).attr("y", hgt - m.b + 18).attr("text-anchor", "middle").text(v => d3.format("~g")(v));
      svg.append("text").attr("class", "t-sans-strong").attr("x", m.l - 8).attr("y", 12).text(d.names[yf]);
      svg.append("text").attr("class", "t-ink2").attr("x", w - m.r).attr("y", hgt - 4).attr("text-anchor", "end").text(d.names[xf]);
      svg.append("g").selectAll("circle").data(pts).join("circle").attr("class", "dot-ink").attr("r", 4).attr("cx", r => x(r[xf])).attr("cy", r => y(r[yf]));
      const r = pts.length > 2 ? pearson(pts.map(p => p[xf]), pts.map(p => p[yf])) : null;
      $("#ex-read").textContent = `${pts.length} points. Pearson's r = ${r == null ? "not defined" : fmt(r, 2)}.`;
      // nearest-point hover
      const tip = el.__tip || (el.__tip = makeTip(el));
      if (pts.length) {
        const del = d3.Delaunay.from(pts, p => x(p[xf]), p => y(p[yf]));
        svg.append("rect").attr("class", "hit").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", hgt - m.t - m.b)
          .on("pointermove", ev => {
            const [mx, my] = d3.pointer(ev); const i = del.find(mx, my), p = pts[i];
            if (Math.hypot(x(p[xf]) - mx, y(p[yf]) - my) > 30) { tip.hide(); return; }
            tip.show(x(p[xf]), y(p[yf]), [{ value: `${d3.format("~g")(+p[yf].toFixed(3))}` }, { label: `${d.names[yf]} at ${d.names[xf].toLowerCase()} ${d3.format("~g")(+p[xf].toFixed(3))}` }]);
          })
          .on("pointerleave", () => tip.hide());
      }
      table("#table-explorer", [d.names[xf], d.names[yf]], pts.map(p => [d3.format("~g")(+p[xf].toFixed(3)), d3.format("~g")(+p[yf].toFixed(3))]), [0, 1]);
    }
    dsSel.value = "drive"; fillFields();
    dsSel.addEventListener("change", () => { fillFields(); redraw(); });
    [xSel, ySel, fSel].forEach(s => s.addEventListener("change", redraw));
    redraw();
  })();

  /* =====================================================================
     4. Lineage
     ===================================================================== */
  (function lineage() {
    const el = $("#chart-lineage");
    if (!el) return;
    const order = ["measured", "relative", "owner", "oem", "published", "statement"];
    const srcs = [...SRC.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.n - b.n);
    const outs = D.lineage.map(o => Object.assign({}, o, { ids: o.src.split(/\s+/) }));
    const used = new Set(outs.flatMap(o => o.ids));
    table("#table-lineage", ["Chart or table", "Sources"], outs.map(o => [o.label, o.ids.map(id => `[${SRC.get(id).n}] ${SRC.get(id).short}`).join("; ")]));
    register(el, w => {
      const narrow = w < 640, rowH = narrow ? 19 : 21, headH = 24;
      const leftW = narrow ? 128 : 230, rightW = narrow ? 118 : 230;
      let yy = 6; const ly = {};
      const heads = [];
      order.forEach(k => {
        const g = srcs.filter(s => s.kind === k);
        if (!g.length) return;
        heads.push({ k, y: yy + 14 }); yy += headH;
        g.forEach(s => { ly[s.id] = yy + rowH / 2; yy += rowH; });
        yy += 6;
      });
      const hgt = yy + 6;
      const ry = {}; const step = (hgt - 12) / outs.length;
      outs.forEach((o, i) => { ry[o.anchor] = 6 + step * i + step / 2; });
      const x0 = leftW, x1 = w - rightW;
      const svg = svgIn(el, w, hgt, `Lineage diagram linking ${srcs.length} sources to ${outs.length} charts and tables.`);
      const linkG = svg.append("g");
      const links = [];
      outs.forEach(o => o.ids.forEach(id => {
        if (ly[id] == null) return;
        const p = linkG.append("path").attr("class", "lin-link").attr("d", `M${x0},${ly[id]} C${(x0 + x1) / 2},${ly[id]} ${(x0 + x1) / 2},${ry[o.anchor]} ${x1},${ry[o.anchor]}`);
        links.push({ id, a: o.anchor, p });
      }));
      heads.forEach(hd => svg.append("text").attr("class", "t-ink2").attr("x", 0).attr("y", hd.y).text(KIND[hd.k].toLowerCase()));
      const read = $("#lineage-read");
      const nodes = [];
      function focus(kind, key) {
        const on = l => (kind === "src" ? l.id === key : l.a === key);
        links.forEach(l => l.p.classed("on", on(l)));
        const linkedSrc = new Set(links.filter(on).map(l => l.id)), linkedOut = new Set(links.filter(on).map(l => l.a));
        nodes.forEach(n => n.g.classed("lin-dim", !(n.kind === kind && n.key === key) && !(n.kind === "src" ? linkedSrc.has(n.key) : linkedOut.has(n.key))));
        if (kind === "src") { const s = SRC.get(key); read.textContent = `[${s.n}] ${s.short} feeds ${linkedOut.size} chart${linkedOut.size === 1 ? "" : "s"} or table${linkedOut.size === 1 ? "" : "s"}${used.has(key) ? "" : "; it supports the text only"}.`; }
        else { const o = outs.find(q => q.anchor === key); read.textContent = `${o.label} rests on ${linkedSrc.size} source${linkedSrc.size === 1 ? "" : "s"}.`; }
      }
      function clear() { links.forEach(l => l.p.classed("on", false)); nodes.forEach(n => n.g.classed("lin-dim", false)); }
      const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + "…" : s;
      srcs.forEach(s => {
        const g = svg.append("g").attr("class", "lin-node").attr("tabindex", 0).attr("role", "button").attr("aria-label", `Source ${s.n}, ${s.short}, ${KIND[s.kind]}. Show where it is used.`);
        g.append("rect").attr("x", 0).attr("y", ly[s.id] - rowH / 2 + 2).attr("width", leftW - 6).attr("height", rowH - 4).attr("rx", 3).style("fill", "var(--bg)").style("stroke", "var(--hair)");
        g.append("text").attr("class", "t-sans").attr("x", 6).attr("y", ly[s.id]).attr("dy", "0.35em").style("font-size", narrow ? "10.5px" : "12px").text(trunc(`${s.n} · ${s.short}`, narrow ? 19 : 34));
        g.append("circle").attr("cx", leftW - 6).attr("cy", ly[s.id]).attr("r", 3).style("fill", used.has(s.id) ? "var(--ink)" : "var(--surface)").style("stroke", "var(--ink)");
        g.on("pointerenter focus", () => focus("src", s.id)).on("pointerleave blur", clear)
          .on("click keydown", ev => { if (ev.type === "keydown" && ev.key !== "Enter") return; const t = document.getElementById("src-" + s.id); t && t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); });
        nodes.push({ kind: "src", key: s.id, g });
      });
      outs.forEach(o => {
        const g = svg.append("g").attr("class", "lin-node").attr("tabindex", 0).attr("role", "button").attr("aria-label", `${o.label}. Show its sources, or press Enter to go to it.`);
        g.append("circle").attr("cx", x1).attr("cy", ry[o.anchor]).attr("r", 3.5).style("fill", "var(--accent)");
        g.append("text").attr("class", "t-sans-strong").attr("x", x1 + 9).attr("y", ry[o.anchor]).attr("dy", "0.35em").style("font-size", narrow ? "10.5px" : "12.5px").text(trunc(o.label, narrow ? 18 : 32));
        g.on("pointerenter focus", () => focus("out", o.anchor)).on("pointerleave blur", clear)
          .on("click keydown", ev => { if (ev.type === "keydown" && ev.key !== "Enter") return; const t = document.getElementById(o.anchor); t && t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
        nodes.push({ kind: "out", key: o.anchor, g });
      });
    });
  })();

  /* =====================================================================
     5. Token sheet
     ===================================================================== */
  (function swatches() {
    const box = $("#swatches");
    if (!box) return;
    const list = [["--bg", "page"], ["--surface", "chart surface"], ["--ink", "primary ink"], ["--ink-2", "secondary ink"], ["--muted", "labels"], ["--hair", "hairlines"],
      ["--accent", "accent"], ["--s1", "Octavia"], ["--s2", "SY416"], ["--s3", "CBR250R"], ["--rich", "richer than λ 1"], ["--lean", "leaner than λ 1"]];
    function paint() {
      box.replaceChildren(...list.map(([v, l]) => {
        const c = hex(tokenRGB(v));
        return h("div", { class: "swatch" }, h("i", { style: `background:var(${v})` }), h("b", { text: v }), h("span", { text: `${c} · ${l}` }));
      }));
    }
    themeListeners.push(paint);
    paint();
  })();
})();
