/*! mi-aspects-selector.js — self-contained Market Intelligence Aspects layout.
 * Public surface mounts it. Internal MI can reuse the same mount later.
 *
 * Eight Aspects, all visible, one tap. Core five, then a lighter facility group.
 * The sentence above the map is the legend, paired with the four AMP bands:
 * Red, Competitive, Magnet, Destination. Warmer Red is harder to recruit.
 * Place draw heat is painted by the host, inside the selected state.
 *
 * Mount API
 * ----------
 * AmpMiAspectsSelector.CORE
 *   Raw, Place draw, Day load, Specialty supply, Support.
 * AmpMiAspectsSelector.FACILITY
 *   CAH, FQHC. Same one-tap lenses, drawn lighter.
 * AmpMiAspectsSelector.BANDS
 *   Red #f87171, Competitive #fbbf24, Magnet #60a5fa, Destination #a78bfa.
 *   These match the existing Place draw band colors. Red is the hard end.
 *
 * AmpMiAspectsSelector.mount(host, options) -> handle
 *   host: Element, or a string id (with or without "#").
 *   options.mapEl: Element moved into the 70% map column. Optional.
 *   options.active: lens id. Default "specialty_supply".
 *   options.specialtyKey: current specialty key.
 *   options.exactValues: false on public. Internal may pass true to print
 *     row.value and card.value beside the band. Rank labels stay either way.
 *   options.getSpecialties(): [{ key, label }]
 *   options.onSpecialty(key): host applies its own gate. This file does not.
 *   options.onSelect(id, lens): one tap on any of the eight lenses.
 *   options.getRead(id): {
 *     sentence: string,
 *     pending: boolean,
 *     mode: "rank" | "sample",
 *     top: [{ code, name, band, value? }],
 *     bottom: [{ code, name, band, value? }],
 *     note: string
 *   }
 *   options.getCard(code): {
 *     name, sentence, tags: [string], value?, locked: boolean
 *   } | null
 *   options.onOpenState(code): host selects the state (and enforces gating).
 *
 * handle.setActive(id, { silent: true })
 * handle.getActive()
 * handle.refresh()
 * handle.syncSpecialty()
 * handle.setSpecialtyKey(key)
 * handle.openState(code)
 * handle.clearCard()
 * handle.destroy()
 *
 * Public shows bands and rank. This file does not print dollar amounts, city
 * names, or drive times unless options.exactValues is true and the host
 * supplied a value string.
 */
(function (global) {
  "use strict";

  var CORE = [
    { id: "raw", label: "Raw", group: "core" },
    { id: "place_draw", label: "Place draw", group: "core" },
    { id: "day_load", label: "Day load", group: "core" },
    { id: "specialty_supply", label: "Specialty supply", group: "core" },
    { id: "support", label: "Support", group: "core" }
  ];
  var FACILITY = [
    { id: "cah", label: "CAH", group: "facility" },
    { id: "fqhc", label: "FQHC", group: "facility" }
  ];
  var LENSES = CORE.concat(FACILITY);
  var BANDS = [
    { id: "red", label: "Red", fill: "#f87171" },
    { id: "competitive", label: "Competitive", fill: "#fbbf24" },
    { id: "magnet", label: "Magnet", fill: "#60a5fa" },
    { id: "destination", label: "Destination", fill: "#a78bfa" }
  ];
  var byId = {};
  LENSES.forEach(function (item) { byId[item.id] = item; });

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
    var active = byId[options.active] ? options.active : "specialty_supply";
    var specialtyKey = options.specialtyKey || "";
    var exactValues = !!options.exactValues;
    var mapEl = resolveEl(options.mapEl);

    root.classList.add("mi-aspects-selector");
    root.setAttribute("data-mi-aspects-selector", "1");

    function lensBtn(item) {
      var on = item.id === active;
      return '<button type="button" class="mi-aspects-lens' + (on ? " is-on" : "") + '" data-aspect="' + item.id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        esc(item.label) + "</button>";
    }

    var keyHtml = BANDS.map(function (band) {
      return '<li><i style="background:' + band.fill + '"></i>' + esc(band.label) + "</li>";
    }).join("");

    root.innerHTML =
      '<div class="mi-aspects-top">' +
        '<label class="mi-aspects-search"><span>Specialty</span>' +
          '<input type="search" class="mi-aspects-spec" placeholder="Type a specialty" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" />' +
          '<ul class="mi-aspects-suggest" role="listbox" hidden></ul>' +
        "</label>" +
        '<label class="mi-aspects-state"><span>State</span>' +
          '<select class="mi-aspects-state-sel" aria-label="State"></select>' +
        "</label>" +
        '<div class="mi-aspects-switch" role="group" aria-label="Aspect">' +
          '<div class="mi-aspects-group mi-aspects-group-core">' + CORE.map(lensBtn).join("") + "</div>" +
          '<div class="mi-aspects-group mi-aspects-group-facility" aria-label="Facility">' + FACILITY.map(lensBtn).join("") + "</div>" +
        "</div>" +
      "</div>" +
      '<p class="mi-aspects-sentence" data-mi-aspects-sentence="1"></p>' +
      '<ul class="mi-aspects-key" aria-label="Red, Competitive, Magnet, Destination. Red is harder to recruit.">' + keyHtml + "</ul>" +
      '<div class="mi-aspects-stage">' +
        '<div class="mi-aspects-map" data-mi-aspects-map="1"></div>' +
        '<aside class="mi-aspects-rail" aria-label="Hardest and easiest states">' +
          '<div id="mi-worksheets" class="mi-aspects-worksheets" hidden></div>' +
          '<div class="mi-aspects-ranks" data-mi-aspects-ranks="1"></div>' +
          '<article class="mi-aspects-card" data-mi-aspects-card="1" hidden></article>' +
        "</aside>" +
      "</div>";

    var mapSlot = root.querySelector("[data-mi-aspects-map]");
    if (mapEl && mapSlot) mapSlot.appendChild(mapEl);

    var specInput = root.querySelector(".mi-aspects-spec");
    var suggest = root.querySelector(".mi-aspects-suggest");
    var sentenceEl = root.querySelector("[data-mi-aspects-sentence]");
    var ranksEl = root.querySelector("[data-mi-aspects-ranks]");
    var cardEl = root.querySelector("[data-mi-aspects-card]");
    var stateSel = root.querySelector(".mi-aspects-state-sel");

    /* State picker beside specialty: host supplies getStates() -> [{code,name,locked}], getState() -> code, onState(code). */
    function syncState() {
      if (!stateSel) return;
      var list = [];
      if (typeof options.getStates === "function") { try { list = options.getStates() || []; } catch (e) {} }
      var cur = "";
      if (typeof options.getState === "function") { try { cur = options.getState() || ""; } catch (e2) {} }
      var sig = list.map(function (r) { return r.code + (r.locked ? "!" : ""); }).join(",");
      if (stateSel.getAttribute("data-sig") !== sig) {
        stateSel.innerHTML = '<option value="">All states</option>' + list.map(function (r) {
          return '<option value="' + esc(r.code) + '">' + esc(r.name) + (r.locked ? " (locked)" : "") + "</option>";
        }).join("");
        stateSel.setAttribute("data-sig", sig);
      }
      stateSel.value = cur || "";
      if (stateSel.value !== (cur || "")) stateSel.value = "";
    }
    function onStateChange() {
      if (typeof options.onState === "function") options.onState(stateSel.value);
      syncState();
    }

    function specialties() {
      if (typeof options.getSpecialties !== "function") return [];
      try { return options.getSpecialties() || []; } catch (e) { return []; }
    }

    function labelForKey(key) {
      var list = specialties();
      for (var i = 0; i < list.length; i++) {
        if (list[i].key === key) return list[i].label || key;
      }
      return "";
    }

    function syncSpecialty() {
      if (!specInput) return;
      var label = labelForKey(specialtyKey);
      if (label) specInput.value = label;
    }

    function paintPressed() {
      root.querySelectorAll(".mi-aspects-lens").forEach(function (btn) {
        var on = btn.getAttribute("data-aspect") === active;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function valueBit(row) {
      if (!exactValues || !row || row.value == null || row.value === "") return "";
      return '<span class="mi-aspects-rank-value">' + esc(row.value) + "</span>";
    }

    function rankButtons(rows) {
      return (rows || []).map(function (row, i) {
        return '<button type="button" class="mi-aspects-rank" data-state="' + esc(row.code) + '">' +
          '<span class="mi-aspects-rank-n">' + (i + 1) + "</span>" +
          '<span class="mi-aspects-rank-name">' + esc(row.name) + "</span>" +
          '<span class="mi-aspects-rank-band">' + esc(row.band || "Pending") + "</span>" +
          valueBit(row) +
          "</button>";
      }).join("");
    }

    function paintRead() {
      var read = { sentence: "", top: [], bottom: [], mode: "sample", note: "", pending: false };
      if (typeof options.getRead === "function") {
        try { read = options.getRead(active) || read; } catch (e) {}
      }
      if (sentenceEl) sentenceEl.textContent = read.sentence || "";
      if (!ranksEl) return;
      var html = "";
      if (read.pending) html += '<p class="mi-aspects-rank-note">Bands pending for this lens.</p>';
      if (read.mode === "rank") {
        html += '<h3 class="mi-aspects-rank-h">Top 5 · hardest</h3>' + rankButtons(read.top);
        html += '<h3 class="mi-aspects-rank-h">Bottom 5 · easier</h3>' + rankButtons(read.bottom);
      } else if ((read.top || []).length) {
        html += '<h3 class="mi-aspects-rank-h">In your plan</h3>' + rankButtons(read.top);
      }
      if (read.note) html += '<p class="mi-aspects-rank-note">' + esc(read.note) + "</p>";
      ranksEl.innerHTML = html;
    }

    function paintCard(card) {
      if (!cardEl) return;
      if (!card) {
        cardEl.hidden = true;
        cardEl.innerHTML = "";
        return;
      }
      var tags = (card.tags || []).map(function (tag) {
        return '<li class="mi-aspects-tag">' + esc(tag) + "</li>";
      }).join("");
      var fig = exactValues && card.value ? '<p class="mi-aspects-card-value">' + esc(card.value) + "</p>" : "";
      cardEl.hidden = false;
      cardEl.innerHTML =
        "<h3>" + esc(card.name || "State") + "</h3>" +
        "<p>" + esc(card.sentence || "") + "</p>" +
        fig +
        (tags ? '<ul class="mi-aspects-tags">' + tags + "</ul>" : "");
    }

    function closeSuggest() {
      if (!suggest) return;
      suggest.hidden = true;
      suggest.innerHTML = "";
      if (specInput) specInput.setAttribute("aria-expanded", "false");
    }

    function openSuggest(q) {
      if (!suggest) return;
      var query = String(q || "").trim().toLowerCase();
      var list = specialties().filter(function (row) {
        if (!query) return false;
        return String(row.label || "").toLowerCase().indexOf(query) >= 0;
      }).slice(0, 8);
      if (!list.length) { closeSuggest(); return; }
      suggest.innerHTML = list.map(function (row) {
        return '<li role="option"><button type="button" data-spec="' + esc(row.key) + '">' + esc(row.label) + "</button></li>";
      }).join("");
      suggest.hidden = false;
      if (specInput) specInput.setAttribute("aria-expanded", "true");
    }

    paintPressed();
    syncSpecialty();
    paintRead();

    function onClick(e) {
      var specBtn = e.target && e.target.closest ? e.target.closest("[data-spec]") : null;
      if (specBtn && root.contains(specBtn)) {
        specialtyKey = specBtn.getAttribute("data-spec");
        syncSpecialty();
        closeSuggest();
        if (typeof options.onSpecialty === "function") options.onSpecialty(specialtyKey);
        return;
      }
      var rankBtn = e.target && e.target.closest ? e.target.closest(".mi-aspects-rank") : null;
      if (rankBtn && root.contains(rankBtn)) {
        var code = rankBtn.getAttribute("data-state");
        if (typeof options.onOpenState === "function") options.onOpenState(code);
        else handle.openState(code);
        return;
      }
      var btn = e.target && e.target.closest ? e.target.closest(".mi-aspects-lens") : null;
      if (!btn || !root.contains(btn)) return;
      var id = btn.getAttribute("data-aspect");
      if (!byId[id] || id === active) return;
      active = id;
      paintPressed();
      paintRead();
      if (typeof options.onSelect === "function") options.onSelect(active, byId[active]);
    }

    function onInput() { openSuggest(specInput.value); }

    root.addEventListener("click", onClick);
    if (specInput) specInput.addEventListener("input", onInput);
    if (stateSel) stateSel.addEventListener("change", onStateChange);
    syncState();

    var handle = {
      setActive: function (id, opts) {
        if (!byId[id]) return;
        active = id;
        paintPressed();
        paintRead();
        if (!(opts && opts.silent) && typeof options.onSelect === "function") options.onSelect(active, byId[active]);
      },
      getActive: function () { return active; },
      refresh: function () { syncSpecialty(); syncState(); paintRead(); },
      syncState: function () { syncState(); },
      syncSpecialty: function () { syncSpecialty(); },
      setSpecialtyKey: function (key) { specialtyKey = key || ""; syncSpecialty(); },
      openState: function (code) {
        var card = null;
        if (typeof options.getCard === "function") {
          try { card = options.getCard(code); } catch (e) {}
        }
        paintCard(card);
      },
      clearCard: function () { paintCard(null); },
      destroy: function () {
        root.removeEventListener("click", onClick);
        if (specInput) specInput.removeEventListener("input", onInput);
        if (stateSel) stateSel.removeEventListener("change", onStateChange);
        root.innerHTML = "";
      }
    };
    global.AmpMiAspectsSelectorHandle = handle;
    return handle;
  }

  global.AmpMiAspectsSelector = {
    CORE: CORE,
    FACILITY: FACILITY,
    LENSES: LENSES,
    BANDS: BANDS,
    mount: mount,
    setActive: function (id, opts) {
      if (global.AmpMiAspectsSelectorHandle) global.AmpMiAspectsSelectorHandle.setActive(id, opts || { silent: true });
    },
    getActive: function () {
      return global.AmpMiAspectsSelectorHandle ? global.AmpMiAspectsSelectorHandle.getActive() : null;
    },
    refresh: function () {
      if (global.AmpMiAspectsSelectorHandle) global.AmpMiAspectsSelectorHandle.refresh();
    },
    openState: function (code) {
      if (global.AmpMiAspectsSelectorHandle) global.AmpMiAspectsSelectorHandle.openState(code);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
