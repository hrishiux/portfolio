/* Lambda & E20 — the short story. Five charts, all numbers from data/afr-data.js.
   Charts redraw on width change; colours come from CSS classes so the theme switch needs no redraw. */
(function () {
  "use strict";
  var A = window.AFR;
  var SRC = {};
  A.sources.forEach(function (s) { SRC[s.id] = s; });
  var fmt1 = d3.format(".1f"), fmt2 = d3.format(".2f");
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var firstDraw = true;

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById("theme-btn");
  var MODES = ["light", "dark"];
  var mode = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  function applyTheme() {
    var d = document.documentElement;
    d.setAttribute("data-theme", mode);
    try { localStorage.setItem("afr-theme", mode); } catch (e) {}
    themeBtn.innerHTML = '<span class="tl">Theme · </span>' + mode;
  }
  themeBtn.addEventListener("click", function () { mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]; applyTheme(); });
  themeBtn.innerHTML = '<span class="tl">Theme · </span>' + mode;

  /* ---------- tooltip ---------- */
  var tip = document.createElement("div");
  tip.className = "stip"; tip.setAttribute("role", "status"); tip.setAttribute("aria-live", "polite");
  document.body.appendChild(tip);
  function place(x, y) {
    var r = tip.getBoundingClientRect(), pad = 14;
    var tx = x + pad, ty = y + pad;
    if (tx + r.width > innerWidth - 8) tx = x - r.width - pad;
    if (ty + r.height > innerHeight - 8) ty = y - r.height - pad;
    tip.style.transform = "translate(" + Math.max(8, tx) + "px," + Math.max(8, ty) + "px)";
  }
  function showTip(html, x, y) { tip.innerHTML = html; tip.classList.add("on"); place(x, y); }
  function hideTip() { tip.classList.remove("on"); }
  /* pointer and keyboard both reveal the same tooltip */
  function bindTip(sel, html) {
    sel.attr("tabindex", 0)
      .on("pointerenter pointermove", function (ev, d) { showTip(html(d), ev.clientX, ev.clientY); })
      .on("pointerleave blur", hideTip)
      .on("focus", function (ev, d) { var r = this.getBoundingClientRect(); showTip(html(d), r.left + r.width / 2, r.top); });
  }
  function srcLine(ids) {
    return '<span class="ts">' + ids.split(" ").map(function (id) { return SRC[id] ? SRC[id].short : id; }).join(" · ") + "</span>";
  }

  /* ---------- helpers ---------- */
  function frame(id, height, m) {
    var el = document.getElementById(id);
    el.innerHTML = "";
    var W = Math.max(280, el.clientWidth);
    var svg = d3.select(el).append("svg").attr("width", W).attr("height", height).attr("viewBox", "0 0 " + W + " " + height);
    if (el.getAttribute("aria-labelledby")) svg.attr("role", "img").attr("aria-labelledby", el.getAttribute("aria-labelledby"));
    var g = svg.append("g").attr("transform", "translate(" + m.l + "," + m.t + ")");
    return { el: el, svg: svg, g: g, W: W, w: W - m.l - m.r, h: height - m.t - m.b, narrow: W < 560 };
  }
  function gridY(f, y, ticks, suffix, x0) {
    var g = f.g.append("g").attr("class", "grid");
    g.selectAll("line").data(ticks).join("line").attr("x1", x0 || 0).attr("x2", f.w).attr("y1", y).attr("y2", y);
    f.g.append("g").selectAll("text").data(ticks).join("text").attr("class", "tick-l")
      .attr("x", (x0 || 0) - 8).attr("y", y).attr("dy", "0.32em").attr("text-anchor", "end")
      .text(function (d, i) { return d + (i === ticks.length - 1 && suffix ? suffix : ""); });
  }
  function axisX(f, x, ticks, label) {
    f.g.append("line").attr("class", "base").attr("x1", 0).attr("x2", f.w).attr("y1", f.h).attr("y2", f.h);
    f.g.append("g").selectAll("text").data(ticks).join("text").attr("class", "tick-l")
      .attr("x", function (d) { return x(d.v != null ? d.v : d); }).attr("y", f.h + 18)
      .attr("text-anchor", function (d) { return x(d.v != null ? d.v : d) >= f.w - 1 ? "end" : "middle"; })
      .text(function (d) { return d.t != null ? d.t : d; });
  }
  function table(id, head, rows, numCols) {
    var det = document.getElementById(id);
    if (det.querySelector(".tw")) return;
    var html = '<div class="tw"><table><thead><tr>' + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr>" + r.map(function (c, i) { return "<td" + (numCols.indexOf(i) > -1 ? ' class="n"' : "") + ">" + c + "</td>"; }).join("") + "</tr>";
    });
    det.insertAdjacentHTML("beforeend", html + "</tbody></table></div>");
  }
  function label(g, x, y, text, cls, anchor) {
    return g.append("text").attr("class", cls || "ann").attr("x", x).attr("y", y).attr("text-anchor", anchor || "start").text(text);
  }

  /* ---------- 0 · hero: India's blend by year ---------- */
  function drawBlend() {
    var el = document.getElementById("c-blend");
    var narrow = el.clientWidth < 560;
    var f = frame("c-blend", narrow ? 330 : 380, { t: narrow ? 62 : 76, r: narrow ? 12 : 20, b: 34, l: 34 });
    var data = A.blending.map(function (d, i) { return Object.assign({ i: i }, d); });
    var known = data.filter(function (d) { return d.pct != null; });
    var x = d3.scaleLinear().domain([0, data.length - 1]).range([0, f.w]);
    var y = d3.scaleLinear().domain([0, 22]).range([f.h, 0]);

    gridY(f, y, [0, 5, 10, 15, 20], "%");
    var step = f.w < 520 ? 4 : f.w < 900 ? 2 : 1;
    axisX(f, x, data.filter(function (d) { return d.i % step === 0; }).map(function (d) { return { v: d.i, t: d.esy }; }));

    var plot = f.g.append("g");
    if (firstDraw && !reduceMotion) {
      var cid = "clip-blend";
      var rect = f.svg.append("defs").append("clipPath").attr("id", cid).append("rect")
        .attr("x", -10).attr("y", -40).attr("height", f.h + 60).attr("width", 0);
      plot.attr("clip-path", "url(#" + cid + ")");
      rect.transition().duration(1400).ease(d3.easeCubicInOut).attr("width", f.w + 20)
        .on("end", function () { plot.attr("clip-path", null); });
    }
    plot.append("path").datum(known).attr("class", "blend-area")
      .attr("d", d3.area().x(function (d) { return x(d.i); }).y0(f.h).y1(function (d) { return y(d.pct); }));
    for (var j = 0; j < known.length - 1; j++) {
      var a = known[j], b = known[j + 1];
      plot.append("line").attr("class", "blend-line" + (b.i - a.i > 1 ? " blend-line--gap" : ""))
        .attr("x1", x(a.i)).attr("y1", y(a.pct)).attr("x2", x(b.i)).attr("y2", y(b.pct));
    }
    plot.selectAll(".dot").data(known).join("circle")
      .attr("class", function (d) { return "dot" + (d.i === data.length - 1 ? " dot--end" : ""); })
      .attr("cx", function (d) { return x(d.i); }).attr("cy", function (d) { return y(d.pct); })
      .attr("r", function (d) { return d.i === data.length - 1 ? 7 : 5; });

    /* annotations: the story is the climb, so label the start, the 10% moment and the end */
    var ann = f.g.append("g");
    var p0 = known[0];
    label(ann, x(p0.i) + 2, y(p0.pct) - 14, "1.5%", "ann-b");
    var p5 = known[1];
    label(ann, x(p5.i), y(p5.pct) - 14, "5%", "ann-b", "middle");
    if (!narrow) {
      label(ann, x((p0.i + p5.i) / 2), y(3.2) + 22, "no official figures collected", "ann ann-it", "middle");
    }
    var p10 = data[8];
    label(ann, x(p10.i) - 10, y(p10.pct) - 12, narrow ? "10%" : "10%, five months early", "ann-b", "end");
    var end = data[data.length - 1];
    var big = label(ann, x(end.i) + 8, y(end.pct) - 16, "20%", "ann-big", "end");
    label(ann, x(end.i) + 8, big.node().getBBox().y - 6, narrow ? "All petrol E20" : "All petrol is E20 from April 2026", "ann", "end");

    bindTip(f.g.append("g").selectAll("circle").data(known).join("circle").attr("class", "hit")
      .attr("cx", function (d) { return x(d.i); }).attr("cy", function (d) { return y(d.pct); }).attr("r", 16)
      .attr("aria-label", function (d) { return "Supply year " + d.esy + ": " + d.pct + "%"; }),
      function (d) {
        return "<b>Supply year " + d.esy + "</b><br><span class='tv'>" + d.pct + "%</span> ethanol on average" +
          (d.note ? "<br>" + d.note : "") + srcLine(d.src);
      });

    table("n-blend", ["Supply year", "Ethanol %", "Source"], data.map(function (d) {
      return [d.esy, d.pct == null ? "—" : d.pct, d.src ? SRC[d.src].short : "no official figure collected"];
    }), [1]);
  }

  /* ---------- 1 · stoichiometric AFR by ethanol content ---------- */
  function afrAt(v) {
    var s = A.stoich, w = s.rhoEthanol * v / (s.rhoEthanol * v + s.rhoPetrol * (1 - v));
    return w * s.ethanol + (1 - w) * s.petrol;
  }
  function drawStoich() {
    var el = document.getElementById("c-stoich");
    var narrow = el.clientWidth < 560;
    var f = frame("c-stoich", narrow ? 300 : 360, { t: 34, r: narrow ? 14 : 24, b: 36, l: 34 });
    var x = d3.scaleLinear().domain([0, 100]).range([0, f.w]);
    var y = d3.scaleLinear().domain([8.5, 15.3]).range([f.h, 0]);

    f.g.append("rect").attr("class", "india-band").attr("x", 0).attr("y", 0).attr("width", x(20)).attr("height", f.h);
    label(f.g, 6, -10, narrow ? "E0–E20" : "E0 to E20: India’s range", "ann", "start");
    gridY(f, y, [9, 11, 13, 15], "");
    axisX(f, x, [0, 20, 40, 60, 80, 100].map(function (v) { return { v: v, t: v + (v === 100 ? (narrow ? "%" : "% ethanol") : "") }; }));
    f.g.selectAll("text.tick-l").filter(function (d) { return d && d.v === 100; }).attr("text-anchor", "end");

    var curve = d3.range(0, 101).map(function (v) { return { v: v, afr: afrAt(v / 100) }; });
    f.g.append("path").datum(curve).attr("class", "stoich-line")
      .attr("d", d3.line().x(function (d) { return x(d.v); }).y(function (d) { return y(d.afr); }));

    var pubs = A.stoich.published;
    f.g.selectAll(".pub").data(pubs.filter(function (d) { return d.ethanol > 0; })).join("circle").attr("class", "pub")
      .attr("cx", function (d) { return x(d.ethanol); }).attr("cy", function (d) { return y(d.afr); }).attr("r", 5);

    var e20 = afrAt(0.2);
    f.g.append("circle").attr("class", "pt-e0").attr("cx", x(0)).attr("cy", y(14.7)).attr("r", 7);
    f.g.append("circle").attr("class", "pt-e20").attr("cx", x(20)).attr("cy", y(e20)).attr("r", 7);
    label(f.g, x(0) + 12, y(14.7) - 12, "Petrol  14.7 : 1", "ann-b");
    label(f.g, x(20) + 10, y(e20) - 14, "E20  " + fmt1(e20) + " : 1", "ann-b");
    if (!narrow) label(f.g, x(20) + 10, y(e20) - 32, "8% less air for the same fuel", "ann");
    label(f.g, x(85) - 10, y(9.7) - 2, "E85  9.7", "ann", "end");
    if (!narrow) label(f.g, x(98), y(9.0) - 14, "E98  9.0", "ann", "end");

    /* scrub: read the blend under the pointer */
    var hl = f.g.append("line").attr("class", "hover-line").attr("y1", 0).attr("y2", f.h).style("display", "none");
    var cd = f.g.append("circle").attr("class", "cursor-dot").attr("r", 5).style("display", "none");
    f.g.append("rect").attr("class", "hit").attr("width", f.w).attr("height", f.h)
      .on("pointermove", function (ev) {
        var v = Math.round(Math.max(0, Math.min(100, x.invert(d3.pointer(ev, this)[0]))));
        var afr = afrAt(v / 100);
        hl.style("display", null).attr("x1", x(v)).attr("x2", x(v));
        cd.style("display", null).attr("cx", x(v)).attr("cy", y(afr));
        showTip("<b>E" + v + "</b> · <span class='tv'>" + fmt2(afr) + " : 1</span><br>That is <span class='lam'>λ</span> 1 for this blend" +
          "<span class='ts'>Calculated: mass-weighted blend</span>", ev.clientX, ev.clientY);
      })
      .on("pointerleave", function () { hl.style("display", "none"); cd.style("display", "none"); hideTip(); });

    table("n-stoich", ["Fuel", "Ethanol %", "AFR at λ 1", "Kind"], [
      ["Petrol (E0)", 0, "14.70", "published"],
      ["E10", 10, "14.10 (calc. " + fmt2(afrAt(0.1)) + ")", "published"],
      ["E20", 20, fmt2(e20), "calculated"],
      ["E85", 85, "9.70", "published"],
      ["E98", 98, "9.00", "published"]
    ], [1, 2]);
  }

  /* ---------- 2 · Honda Civic 1.8, full-throttle lambda histogram ---------- */
  function drawCivic() {
    var C = A.civicWot;
    var area = function (x, y, h) {
      return d3.area().curve(d3.curveMonotoneX).x(function (d) { return x(d[0]); }).y0(h).y1(function (d) { return y(d[1]); });
    };
    var line = function (x, y) { return d3.line().curve(d3.curveMonotoneX).x(function (d) { return x(d[0]); }).y(function (d) { return y(d[1]); }); };
    var lo = 0.72, hi = 0.95;

    /* overview strip: the whole test, so the zoom has context */
    var o = frame("c-civic-ov", 92, { t: 8, r: 8, b: 22, l: 8 });
    var ox = d3.scaleLinear().domain([0.7, 1.1]).range([0, o.w]);
    var oy = d3.scaleLinear().domain([0, 3100]).range([o.h, 0]);
    o.g.append("rect").attr("class", "win").attr("x", ox(lo)).attr("width", ox(hi) - ox(lo)).attr("y", 0).attr("height", o.h);
    ["e0", "e20"].forEach(function (k) {
      o.g.append("path").datum(C[k]).attr("class", "a-" + k).attr("d", area(ox, oy, o.h));
      o.g.append("path").datum(C[k]).attr("class", "l-" + k).attr("d", line(ox, oy));
    });
    o.g.append("line").attr("class", "base").attr("x1", 0).attr("x2", o.w).attr("y1", o.h).attr("y2", o.h);
    o.g.selectAll(".tl").data([0.7, 0.8, 0.9, 1.0, 1.1]).join("text").attr("class", "tick-l")
      .attr("x", ox).attr("y", o.h + 16).attr("text-anchor", function (d) { return d === 0.7 ? "start" : d === 1.1 ? "end" : "middle"; })
      .text(function (d) { return d.toFixed(1); });
    label(o.g, ox(lo) + 6, 14, o.narrow ? "zoomed below" : "full-throttle enrichment · zoomed below", "ann");
    var cr = label(o.g, ox(1.035), 14, o.narrow ? "λ 1 · cruise" : "λ 1 · cruise, both fuels alike", "ann");
    if (ox(1.035) + cr.node().getComputedTextLength() > o.w) cr.attr("x", o.w).attr("text-anchor", "end");

    /* detail */
    var el = document.getElementById("c-civic");
    var narrow = el.clientWidth < 560;
    var f = frame("c-civic", narrow ? 300 : 380, { t: 40, r: 14, b: 46, l: 40 });
    var x = d3.scaleLinear().domain([lo, hi]).range([0, f.w]);
    var y = d3.scaleLinear().domain([0, 350]).range([f.h, 0]);
    gridY(f, y, [0, 100, 200, 300], "");
    axisX(f, x, [0.75, 0.8, 0.85, 0.9, 0.95].map(function (v) { return { v: v, t: v.toFixed(2) }; }));
    label(f.g, 0, f.h + 38, "← richer", "ann", "start");
    label(f.g, f.w, f.h + 38, "leaner →", "ann", "end");
    label(f.g, f.w / 2, f.h + 38, "λ", "ann lam", "middle");
    label(f.g, -32, -16, "samples", "ann", "start");

    var cut = function (rows) { return rows.filter(function (d) { return d[0] >= lo - 0.005 && d[0] <= hi + 0.005; }); };
    var cp = f.svg.append("defs").append("clipPath").attr("id", "clip-civic");
    cp.append("rect").attr("width", f.w).attr("height", f.h + 2).attr("y", -2);
    var plot = f.g.append("g").attr("clip-path", "url(#clip-civic)");
    ["e0", "e20"].forEach(function (k) {
      plot.append("path").datum(cut(C[k])).attr("class", "a-" + k).attr("d", area(x, y, f.h));
      plot.append("path").datum(cut(C[k])).attr("class", "l-" + k).attr("d", line(x, y));
    });

    var m0 = C.check.e0, m20 = C.check.e20;
    f.g.append("line").attr("class", "mean-e0").attr("x1", x(m0)).attr("x2", x(m0)).attr("y1", y(330)).attr("y2", f.h);
    f.g.append("line").attr("class", "mean-e20").attr("x1", x(m20)).attr("x2", x(m20)).attr("y1", y(330)).attr("y2", f.h);
    label(f.g, x(m0) - 6, y(330) + 4, (narrow ? "E0 · " : "E0 averages ") + C.stated.e0, "ann-b", "end").attr("dy", "0.7em");
    label(f.g, x(m20) + 6, y(330) + 4, (narrow ? "E20 · " : "E20 averages ") + C.stated.e20, "ann-b", "start").attr("dy", "0.7em");

    /* the shift */
    var ay = y(225);
    var defs = f.svg.select("defs");
    defs.append("marker").attr("id", "ah").attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
      .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto")
      .append("path").attr("class", "arrow-head").attr("d", "M0,0 L10,5 L0,10 z");
    f.g.append("line").attr("class", "arrow").attr("x1", x(m0) + 4).attr("x2", x(m20) - 4).attr("y1", ay).attr("y2", ay).attr("marker-end", "url(#ah)");
    var pct = Math.round((C.stated.e20 - C.stated.e0) / C.stated.e0 * 100);
    label(f.g, (x(m0) + x(m20)) / 2, ay - 10, "≈ " + pct + "% leaner", "ann-b", "middle");

    /* crosshair */
    var bis = d3.bisector(function (d) { return d[0]; }).center;
    var hl = f.g.append("line").attr("class", "hover-line").attr("y1", 0).attr("y2", f.h).style("display", "none");
    f.g.append("rect").attr("class", "hit").attr("width", f.w).attr("height", f.h)
      .on("pointermove", function (ev) {
        var l = x.invert(d3.pointer(ev, this)[0]);
        var a = C.e0[bis(C.e0, l)], b = C.e20[bis(C.e20, l)];
        hl.style("display", null).attr("x1", x(l)).attr("x2", x(l));
        showTip("<b><span class='lam'>λ</span> " + l.toFixed(3) + "</b><br>" +
          "<i class='sw' style='background:var(--e0)'></i>E0: <span class='tv'>" + a[1] + "</span> samples<br>" +
          "<i class='sw' style='background:var(--e20)'></i>E20: <span class='tv'>" + b[1] + "</span> samples" + srcLine(C.src), ev.clientX, ev.clientY);
      })
      .on("pointerleave", function () { hl.style("display", "none"); hideTip(); });

    table("n-civic", ["Fuel", "Average λ under enrichment (report)", "Check from the digitised curve"], [
      ["E0", C.stated.e0, C.check.e0], ["E20", C.stated.e20, C.check.e20]
    ], [1, 2]);
  }

  /* ---------- 3 · sixteen cars and catalyst temperature ---------- */
  var CAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11a2 2 0 0 1 2 2v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4a2 2 0 0 1 2-2zm2.2 0h9.6l-1.1-3.1a.6.6 0 0 0-.6-.4H8.9a.6.6 0 0 0-.6.4z"/></svg>';
  function drawFleet() {
    var W = A.ornlWot;
    var host = document.getElementById("c-units");
    if (!host.firstChild) {
      var groups = [
        { n: W.leaner, cls: "lean", text: "ran leaner on E20, still rich", tip: W.leanerText },
        { n: W.held, cls: "held", text: "kept the same full-throttle mixture", tip: W.heldText }
      ];
      groups.forEach(function (g) {
        var div = document.createElement("div");
        div.className = "ugroup";
        div.innerHTML = '<div class="ugroup__head"><span class="ugroup__n">' + g.n + '</span><span class="ugroup__label">' + g.text + "</span></div>" +
          '<div class="ugroup__cars">' + new Array(g.n + 1).join('<span class="u u--' + g.cls + '">' + CAR + "</span>") + "</div>";
        host.appendChild(div);
        bindTip(d3.select(div).datum(g), function (d) { return "<b>" + d.n + " of " + W.fleet + " cars</b><br>" + d.tip + srcLine(W.src); });
      });
    }

    var el = document.getElementById("c-cat");
    var f = frame("c-cat", 200, { t: 26, r: 14, b: 30, l: 8 });
    var x = d3.scaleLinear().domain([-15, 40]).range([0, f.w]);
    label(f.g, 0, -10, "Change in peak catalyst temperature, E20 vs E0", "ann-b");
    f.g.append("g").attr("class", "grid").selectAll("line").data([-10, 10, 20, 30, 40]).join("line")
      .attr("x1", x).attr("x2", x).attr("y1", 6).attr("y2", f.h);
    f.g.append("line").attr("class", "zero").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 6).attr("y2", f.h);
    axisX(f, x, [-10, 0, 10, 20, 30, 40].map(function (v) { return { v: v, t: (v > 0 ? "+" : "") + v + (v === 40 ? " °C" : "") }; }));
    f.g.select(".base").remove();

    var lean = W.catalyst[0], held = W.catalyst[2];
    var r1 = 44, r2 = 118;
    label(f.g, 0, r1 - 16, "The 7 that ran leaner", "ann");
    f.g.append("rect").attr("class", "cat-lean").attr("x", x(lean.lo)).attr("width", x(lean.hi) - x(lean.lo))
      .attr("y", r1 - 6).attr("height", 12).attr("rx", 4);
    label(f.g, x(lean.lo) - 8, r1, "+" + lean.lo + " to +" + lean.hi + " °C", "ann-b", "end").attr("dy", "0.35em");

    label(f.g, 0, r2 - 22, "The 9 that held their mixture", "ann");
    f.g.append("line").attr("class", "cat-held").attr("x1", x(held.rangeLo)).attr("x2", x(held.rangeHi)).attr("y1", r2).attr("y2", r2);
    [held.rangeLo, held.rangeHi].forEach(function (v) {
      f.g.append("line").attr("class", "cat-held").attr("x1", x(v)).attr("x2", x(v)).attr("y1", r2 - 6).attr("y2", r2 + 6);
    });
    f.g.append("rect").attr("class", "cat-held-avg").attr("x", x(0)).attr("width", x(5) - x(0)).attr("y", r2 - 6).attr("height", 12).attr("rx", 3);
    label(f.g, x(held.rangeHi) + 8, r2, "avg under 5 °C", "ann-b").attr("dy", "0.35em");

    bindTip(f.g.append("rect").datum(lean).attr("class", "row-hit").attr("x", 0).attr("width", f.w).attr("y", r1 - 26).attr("height", 40)
      .attr("aria-label", "Seven cars that ran leaner: peak catalyst temperature up 29 to 35 degrees"),
      function () { return "<b>Ran leaner (7 cars)</b><br>Peak catalyst temperature up an average <span class='tv'>29–35 °C</span> against E0, and about 20 °C against E10" + srcLine(W.src); });
    bindTip(f.g.append("rect").datum(held).attr("class", "row-hit").attr("x", 0).attr("width", f.w).attr("y", r2 - 32).attr("height", 46)
      .attr("aria-label", "Nine cars that held their mixture: average change under 5 degrees"),
      function () { return "<b>Held mixture (9 cars)</b><br>" + held.text + srcLine(W.src); });

    table("n-fleet", ["Group", "Cars", "Peak catalyst temperature, E20 vs E0"], [
      ["Ran leaner", W.leaner, "+29 to +35 °C on average (about +20 °C vs E10)"],
      ["Held mixture", W.held, "under 5 °C on average; −14 to +14 °C individually"]
    ], [1]);
  }

  /* ---------- 4 · mileage claims against the energy reference ---------- */
  function energyDrop(base) {
    var labs = ["NREL", "ORNL", "ANL"];
    var v = labs.map(function (lab) {
      var e = function (fuel) { var r = A.ornlFuels.find(function (d) { return d.lab === lab && d.fuel === fuel; }); return r.lhv * r.sg; };
      return (1 - e("E20") / e(base)) * 100;
    });
    return [d3.min(v), d3.max(v)];
  }
  function drawMiles() {
    var el = document.getElementById("c-miles");
    var narrow = el.clientWidth < 640;
    var groups = [
      { key: "E0", title: "Against petrol (E0)", band: energyDrop("E0") },
      { key: "E10", title: "Against E10", band: energyDrop("E10") },
      { key: "unstated", title: "Baseline not stated", band: null }
    ];
    var rowH = narrow ? 62 : 34, headH = 40;
    var rows = [], yy = 0;
    groups.forEach(function (g) {
      g.y0 = yy; yy += headH;
      A.mileage.filter(function (m) { return m.baseline === g.key; }).forEach(function (m) { rows.push(Object.assign({ y: yy, g: g }, m)); yy += rowH; });
      g.y1 = yy; yy += 10;
    });
    var labelW = narrow ? 0 : Math.min(320, el.clientWidth * 0.42);
    var f = frame("c-miles", yy + 40, { t: 10, r: 46, b: 30, l: labelW || 12 });
    var x = d3.scaleLinear().domain([0, 9]).range([0, f.w]);

    f.g.append("g").attr("class", "grid").selectAll("line").data([0, 2, 4, 6, 8]).join("line")
      .attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", yy);
    f.g.append("g").selectAll("text").data([0, 2, 4, 6, 8]).join("text").attr("class", "tick-l")
      .attr("x", x).attr("y", yy + 18).attr("text-anchor", "middle").text(function (d) { return d + "%"; });
    label(f.g, f.w + 46, yy + 34, "fewer km per litre", "ann", "end");

    groups.forEach(function (g) {
      label(f.g, -labelW, g.y0 + 20, g.title, "grp");
      if (g.band) label(f.g, f.w + 46, g.y0 + 20, "energy lost: " + fmt1(g.band[0]) + "–" + fmt1(g.band[1]) + "%", "ann", "end");
    });

    var mid = function (d) { return d.y + (narrow ? 46 : rowH / 2); };
    rows.forEach(function (d) {
      var tx = narrow ? 0 : -labelW, ty = narrow ? d.y + 14 : mid(d) - 3;
      var t = f.g.append("text").attr("x", tx).attr("y", ty);
      t.append("tspan").attr("class", "who").text(d.who.replace(/, \d{4}$/, "") + "  ");
      f.g.append("text").attr("class", "what").attr("x", tx).attr("y", ty + (narrow ? 15 : 14)).text(d.what);
      var cls = d.kind === "measured" ? "m-meas" : "m-stmt";
      if (d.lo === d.hi) f.g.append("circle").attr("class", cls).attr("cx", x(d.lo)).attr("cy", mid(d)).attr("r", 6);
      else f.g.append("rect").attr("class", cls).attr("x", x(d.lo)).attr("width", x(d.hi) - x(d.lo)).attr("y", mid(d) - 6).attr("height", 12).attr("rx", 6);
      label(f.g, x(d.hi) + 10, mid(d), (d.lo === d.hi ? d.lo : d.lo + "–" + d.hi) + "%", "val").attr("dy", "0.35em");
    });

    /* the energy reference sits on top of the marks, translucent, so a bar can't hide it */
    groups.forEach(function (g) {
      if (!g.band) return;
      var bw = Math.max(4, x(g.band[1]) - x(g.band[0])), cx = (x(g.band[0]) + x(g.band[1])) / 2;
      rows.filter(function (d) { return d.g === g; }).forEach(function (d) {
        f.g.append("rect").attr("class", "phys").attr("x", cx - bw / 2).attr("width", bw)
          .attr("y", mid(d) - 12).attr("height", 24).attr("rx", 2);
      });
    });

    bindTip(f.g.append("g").selectAll("rect").data(rows).join("rect").attr("class", "row-hit")
      .attr("x", -labelW).attr("width", f.w + labelW + 40).attr("y", function (d) { return d.y; }).attr("height", rowH)
      .attr("aria-label", function (d) { return d.who + ", " + d.what + ": " + d.lo + " to " + d.hi + " percent"; }),
      function (d) {
        return "<b>" + d.who + "</b><br>" + d.what + "<br><span class='tv'>" + (d.lo === d.hi ? d.lo : d.lo + "–" + d.hi) + "%</span> fewer km per litre" +
          "<br>Compared with: " + (d.baseline === "unstated" ? "not stated" : d.baseline) + " · " + (d.kind === "measured" ? "measured" : "estimate or statement") + srcLine(d.src);
      });

    table("n-miles", ["Source", "Vehicles", "Drop %", "Compared with", "Kind"], A.mileage.map(function (d) {
      return [d.who, d.what, d.lo === d.hi ? d.lo : d.lo + "–" + d.hi, d.baseline, d.kind === "measured" ? "measured" : "statement"];
    }).concat([
      ["Energy per litre (calculated)", "US lab test fuels", fmt1(groups[0].band[0]) + "–" + fmt1(groups[0].band[1]), "E0", "calculated"],
      ["Energy per litre (calculated)", "US lab test fuels", fmt1(groups[1].band[0]) + "–" + fmt1(groups[1].band[1]), "E10", "calculated"]
    ]), [2]);
  }

  /* ---------- sources, numbered as in the lineage map ---------- */
  function listSources() {
    document.getElementById("src-list").innerHTML = A.sources.map(function (s, i) {
      var name = s.url ? '<a href="' + s.url + '" rel="noopener">' + s.short + "</a>" : s.short;
      return '<li id="src-' + s.id + '"><b>' + (i + 1) + "</b> " + name + "</li>";
    }).join("");
  }

  /* ---------- token sheet, read live from the stylesheet ---------- */
  var TOKENS = [["--bg", "page"], ["--surface", "chart surface"], ["--ink", "primary ink"], ["--ink-2", "secondary ink"], ["--muted", "labels"],
    ["--hair", "hairlines"], ["--accent", "accent, single series"], ["--e0", "E0 · petrol"], ["--e20", "E20"], ["--held", "unchanged"],
    ["--mode-rich", "enrichment"], ["--mode-cut", "fuel cut"]];
  var pix = document.createElement("canvas"); pix.width = pix.height = 1;
  var pctx = pix.getContext("2d", { willReadFrequently: true });
  function hexOf(name) {
    pctx.clearRect(0, 0, 1, 1); pctx.fillStyle = "#000";
    pctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    pctx.fillRect(0, 0, 1, 1);
    var d = pctx.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
  }
  function paintTokens() {
    document.getElementById("tokens").innerHTML = TOKENS.map(function (t) {
      return '<div class="swatch"><i style="background:var(' + t[0] + ')"></i><b>' + t[0] + "</b><span>" + hexOf(t[0]) + " · " + t[1] + "</span></div>";
    }).join("");
  }
  new MutationObserver(paintTokens).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintTokens);
  /* ---------- draw and redraw on width change ---------- */
  function drawAll() {
    drawBlend(); drawStoich(); drawCivic(); drawFleet(); drawMiles();
    firstDraw = false;
  }
  listSources();
  paintTokens();
  drawAll();
  var lastW = document.documentElement.clientWidth, t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var w = document.documentElement.clientWidth;
      if (w !== lastW) { lastW = w; hideTip(); drawAll(); }
    }, 120);
  });
})();
