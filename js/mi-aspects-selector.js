/*! mi-aspects-selector.js — self-contained Market Intelligence Aspects picker.
 * Public surface mounts it; internal MI can reuse the same mount API later.
 *
 * Mount API
 * ----------
 * AmpMiAspectsSelector.LENSES
 *   The eight v1 lenses: raw, place_draw, day_load, specialty_supply,
 *   support, cah, fqhc, cms. Each has id, label, and blurb (one line).
 *
 * AmpMiAspectsSelector.mount(host, options) -> handle
 *   host: Element, or a string id (with or without "#").
 *   options.numbersHost: Element | id — key numbers beside the map.
 *   options.active: lens id (default "raw").
 *   options.onSelect(id, lens): fired on a user tap. Not fired by setActive(..., {silent:true}).
 *   options.getSnapshot(id): () => { legend: {title, low, high, note}, numbers: [{label, value, pending}] }
 *     Return only existing data. Use value "Pending" where a hook is not wired.
 *
 * handle.setActive(id, {silent:true})
 * handle.getActive()
 * handle.refresh()  — re-reads getSnapshot for the active lens (legend + numbers)
 * handle.destroy()
 *
 * One tap switches the lens. All eight stay visible (no dropdown). The host
 * page recolors the map inside onSelect; this file does not invent dollars.
 */
(function (global) {
  "use strict";

  var LENSES = [
    { id: "raw", label: "Raw", blurb: "Cash ruler for this specialty — YOUR Baseline when AMP bands are set." },
    { id: "place_draw", label: "Place draw", blurb: "Desirability and cost of living inside the selected state only." },
    { id: "day_load", label: "Day load", blurb: "Schedule and patients-per-day versus headline pay — qualitative v1." },
    { id: "specialty_supply", label: "Specialty supply", blurb: "How many of this specialty live in the selected state (Redi)." },
    { id: "support", label: "Support", blurb: "Culture, admin burden, and unspoken value — qualitative v1." },
    { id: "cah", label: "CAH", blurb: "Critical-access pressure from public HPSA need — not a facility list." },
    { id: "fqhc", label: "FQHC", blurb: "HPSA context for community health — not “more sites = higher pay.”" },
    { id: "cms", label: "CMS", blurb: "Collections triangulation for this specialty. Not Baseline dollars." }
  ];

  var byId = {};
  LENSES.forEach(function (lens) { byId[lens.id] = lens; });

  function resolveEl(ref) {
    if (!ref) return null;
    if (typeof ref === "string") return document.getElementById(ref.replace(/^#/, ""));
    return ref;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mount(host, options) {
    options = options || {};
    var root = resolveEl(host);
    if (!root) return null;
    var numbersHost = resolveEl(options.numbersHost);
    var active = byId[options.active] ? options.active : "raw";

    root.classList.add("mi-aspects-selector");
    root.setAttribute("data-mi-aspects-selector", "1");
    if (numbersHost) {
      numbersHost.classList.add("mi-aspects-numbers");
      numbersHost.setAttribute("data-mi-aspects-numbers", "1");
    }

    function lensButtons() {
      return LENSES.map(function (lens) {
        var on = lens.id === active;
        return '<button type="button" class="mi-aspects-lens' + (on ? " is-on" : "") + '" data-aspect="' + lens.id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="mi-aspects-lens-name">' + esc(lens.label) + "</span>" +
          '<span class="mi-aspects-lens-blurb">' + esc(lens.blurb) + "</span>" +
          "</button>";
      }).join("");
    }

    function paintChrome() {
      root.innerHTML =
        '<div class="mi-aspects-head"><span class="mi-aspects-kicker">Aspects</span>' +
        '<span class="mi-aspects-hint">One tap switches the lens. Map and numbers follow.</span></div>' +
        '<div class="mi-aspects-grid" role="group" aria-label="Market Intelligence Aspects">' + lensButtons() + "</div>";
    }

    function paintNumbers() {
      if (!numbersHost) return;
      var snap = { legend: { title: "", low: "", high: "", note: "" }, numbers: [] };
      if (typeof options.getSnapshot === "function") {
        try { snap = options.getSnapshot(active) || snap; } catch (e) {}
      }
      var legend = snap.legend || {};
      var nums = Array.isArray(snap.numbers) ? snap.numbers : [];
      var swatch = '<div class="mi-aspects-legend" aria-label="Legend">' +
        '<div class="mi-aspects-legend-title">' + esc(legend.title || (byId[active] && byId[active].label) || "Lens") + "</div>" +
        '<div class="mi-aspects-scale" data-lens="' + esc(active) + '"><i></i></div>' +
        '<div class="mi-aspects-scale-labels"><span>' + esc(legend.low || "") + "</span><span>" + esc(legend.high || "") + "</span></div>" +
        (legend.note ? '<p class="mi-aspects-legend-note">' + esc(legend.note) + "</p>" : "") +
        "</div>";
      var rows = nums.map(function (row) {
        var pending = row.pending || String(row.value || "") === "Pending";
        return '<div class="mi-aspects-num' + (pending ? " is-pending" : "") + '"><span class="mi-aspects-num-k">' + esc(row.label) + '</span><strong>' + esc(row.value == null ? "Pending" : row.value) + "</strong></div>";
      }).join("");
      numbersHost.innerHTML = swatch + '<div class="mi-aspects-num-list">' + (rows || '<div class="mi-aspects-num is-pending"><span class="mi-aspects-num-k">Figures</span><strong>Pending</strong></div>') + "</div>";
      numbersHost.setAttribute("data-lens", active);
    }

    function paintPressed() {
      root.querySelectorAll(".mi-aspects-lens").forEach(function (btn) {
        var on = btn.getAttribute("data-aspect") === active;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    paintChrome();
    paintNumbers();

    function onClick(e) {
      var btn = e.target && e.target.closest ? e.target.closest(".mi-aspects-lens") : null;
      if (!btn || !root.contains(btn)) return;
      var id = btn.getAttribute("data-aspect");
      if (!byId[id] || id === active) {
        active = id || active;
        paintPressed();
        return;
      }
      active = id;
      paintPressed();
      paintNumbers();
      if (typeof options.onSelect === "function") options.onSelect(active, byId[active]);
    }
    root.addEventListener("click", onClick);

    var handle = {
      setActive: function (id, opts) {
        if (!byId[id]) return;
        active = id;
        paintPressed();
        paintNumbers();
        if (!(opts && opts.silent) && typeof options.onSelect === "function") options.onSelect(active, byId[active]);
      },
      getActive: function () { return active; },
      refresh: function () { paintNumbers(); },
      destroy: function () {
        root.removeEventListener("click", onClick);
        root.innerHTML = "";
      }
    };
    global.AmpMiAspectsSelectorHandle = handle;
    return handle;
  }

  global.AmpMiAspectsSelector = {
    LENSES: LENSES,
    mount: mount,
    setActive: function (id, opts) {
      if (global.AmpMiAspectsSelectorHandle) global.AmpMiAspectsSelectorHandle.setActive(id, opts || { silent: true });
    },
    getActive: function () {
      return global.AmpMiAspectsSelectorHandle ? global.AmpMiAspectsSelectorHandle.getActive() : null;
    },
    refresh: function () {
      if (global.AmpMiAspectsSelectorHandle) global.AmpMiAspectsSelectorHandle.refresh();
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
