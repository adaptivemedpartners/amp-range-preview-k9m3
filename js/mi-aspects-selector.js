/*! mi-aspects-selector.js — self-contained Market Intelligence Aspects layout.
 * Public surface mounts it. Internal MI can reuse the same mount later.
 *
 * The control answers one question: where is it hard to find this specialty?
 * Darker map bands mean harder to recruit. Place draw is the exception the
 * host still paints as metro heat inside the selected state.
 *
 * Mount API
 * ----------
 * AmpMiAspectsSelector.PRIMARY
 *   Raw, Specialty supply, Place draw, Day load. These are the lenses.
 * AmpMiAspectsSelector.MORE
 *   Support is a lens. CAH, FQHC, and CMS are filters/tags, not recolor lenses.
 *
 * AmpMiAspectsSelector.mount(host, options) -> handle
 *   host: Element, or a string id (with or without "#").
 *   options.mapEl: Element moved into the 70% map column. Optional.
 *   options.active: lens id. Default "specialty_supply".
 *   options.specialtyKey: current specialty key.
 *   options.getSpecialties(): [{ key, label }]
 *   options.onSpecialty(key): host applies its own gate. This file does not.
 *   options.onSelect(id, lens): one tap on a lens. Not fired for filters.
 *   options.onFilters({ cah, fqhc, cms }): filter toggles. Not a recolor.
 *   options.getRead(id, filters): {
 *     sentence: string,          // one line above the map
 *     pending: boolean,
 *     mode: "rank" | "sample",
 *     top: [{ code, name, band }],
 *     bottom: [{ code, name, band }],
 *     note: string
 *   }
 *   options.getCard(code): {
 *     name, sentence, tags: [string], locked: boolean
 *   } | null
 *   options.onOpenState(code): host selects the state (and enforces gating).
 *
 * handle.setActive(id, { silent: true })
 * handle.getActive()
 * handle.getFilters()
 * handle.refresh()       — re-reads getRead (sentence, ranks) and the search label
 * handle.syncSpecialty() — rewrites the search box from specialtyKey / getSpecialties
 * handle.openState(code) — one short card. No raw figures.
 * handle.clearCard()
 * handle.destroy()
 *
 * Bands and rank only. This file does not print dollar amounts, city names,
 * or drive times.
 */
(function (global) {
  "use strict";

  var PRIMARY = [
    { id: "raw", label: "Raw", kind: "lens" },
    { id: "specialty_supply", label: "Specialty supply", kind: "lens" },
    { id: "place_draw", label: "Place draw", kind: "lens" },
    { id: "day_load", label: "Day load", kind: "lens" }
  ];
  var MORE = [
    { id: "support", label: "Support", kind: "lens" },
    { id: "cah", label: "CAH", kind: "filter" },
    { id: "fqhc", label: "FQHC", kind: "filter" },
    { id: "cms", label: "CMS", kind: "filter" }
  ];
  var byId = {};
  PRIMARY.concat(MORE).forEach(function (item) { byId[item.id] = item; });

  function resolveEl(ref) {
    if (!ref) return null;
    if (typeof ref === "string") {
      return document.getElementById(ref.replace(/^#/, ""));
    }
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
    var active = byId[options.active] && byId[options.active].kind === "lens"
      ? options.active
      : "specialty_supply";
    var filters = { cah: false, fqhc: false, cms: false };
    var specialtyKey = options.specialtyKey || "";
    var mapEl = resolveEl(options.mapEl);

    root.classList.add("mi-aspects-selector");
    root.setAttribute("data-mi-aspects-selector", "1");

    function lensBtn(item) {
      var on = item.id === active;
      return '<button type="button" class="mi-aspects-lens' + (on ? " is-on" : "") + '" data-aspect="' + item.id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        esc(item.label) + "</button>";
    }

    root.innerHTML =
      '<div class="mi-aspects-top">' +
        '<label class="mi-aspects-search"><span>Specialty</span>' +
          '<input type="search" class="mi-aspects-spec" placeholder="Type a specialty" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" />' +
          '<ul class="mi-aspects-suggest" role="listbox" hidden></ul>' +
        "</label>" +
        '<div class="mi-aspects-switch" role="group" aria-label="Lens">' +
          PRIMARY.map(lensBtn).join("") +
          '<div class="mi-aspects-more-wrap">' +
            '<button type="button" class="mi-aspects-more" aria-expanded="false" aria-haspopup="true">More</button>' +
            '<div class="mi-aspects-more-menu" hidden>' +
              '<button type="button" class="mi-aspects-lens mi-aspects-more-lens" data-aspect="support" aria-pressed="false">Support</button>' +
              '<p class="mi-aspects-more-note">Filters and tags. They do not recolor the map.</p>' +
              '<label class="mi-aspects-filter"><input type="checkbox" data-filter="cah" /> CAH</label>' +
              '<label class="mi-aspects-filter"><input type="checkbox" data-filter="fqhc" /> FQHC</label>' +
              '<label class="mi-aspects-filter"><input type="checkbox" data-filter="cms" /> CMS</label>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<p class="mi-aspects-sentence" data-mi-aspects-sentence="1"></p>' +
      '<div class="mi-aspects-stage">' +
        '<div class="mi-aspects-map" data-mi-aspects-map="1"></div>' +
        '<aside class="mi-aspects-rail" aria-label="Hardest and easiest states">' +
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
    var moreBtn = root.querySelector(".mi-aspects-more");
    var moreMenu = root.querySelector(".mi-aspects-more-menu");

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
      if (moreBtn) moreBtn.classList.toggle("is-on", active === "support");
    }

    function rankButtons(rows) {
      return (rows || []).map(function (row, i) {
        return '<button type="button" class="mi-aspects-rank" data-state="' + esc(row.code) + '">' +
          '<span class="mi-aspects-rank-n">' + (i + 1) + "</span>" +
          '<span class="mi-aspects-rank-name">' + esc(row.name) + "</span>" +
          '<span class="mi-aspects-rank-band">' + esc(row.band || "Pending") + "</span>" +
          "</button>";
      }).join("");
    }

    function paintRead() {
      var read = { sentence: "", top: [], bottom: [], mode: "sample", note: "", pending: false };
      if (typeof options.getRead === "function") {
        try { read = options.getRead(active, filters) || read; } catch (e) {}
      }
      if (sentenceEl) sentenceEl.textContent = read.sentence || "";
      if (!ranksEl) return;
      var html = "";
      if (read.pending) {
        html += '<p class="mi-aspects-rank-note">Bands pending for this lens. Nothing invented.</p>';
      }
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
      cardEl.hidden = false;
      cardEl.innerHTML =
        "<h3>" + esc(card.name || "State") + "</h3>" +
        "<p>" + esc(card.sentence || "") + "</p>" +
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

    function closeMore() {
      if (!moreMenu || !moreBtn) return;
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    }

    function emitFilters() {
      if (typeof options.onFilters === "function") options.onFilters({ cah: !!filters.cah, fqhc: !!filters.fqhc, cms: !!filters.cms });
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
      var more = e.target && e.target.closest ? e.target.closest(".mi-aspects-more") : null;
      if (more && root.contains(more)) {
        var open = moreMenu.hidden;
        moreMenu.hidden = !open;
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      var btn = e.target && e.target.closest ? e.target.closest(".mi-aspects-lens") : null;
      if (!btn || !root.contains(btn)) return;
      var id = btn.getAttribute("data-aspect");
      if (!byId[id] || byId[id].kind !== "lens") return;
      closeMore();
      if (id === active) return;
      active = id;
      paintPressed();
      paintRead();
      if (typeof options.onSelect === "function") options.onSelect(active, byId[active]);
    }

    function onInput() {
      openSuggest(specInput.value);
    }

    function onFilter(e) {
      var input = e.target;
      if (!input || !input.getAttribute || !input.getAttribute("data-filter")) return;
      filters[input.getAttribute("data-filter")] = !!input.checked;
      emitFilters();
      paintRead();
    }

    root.addEventListener("click", onClick);
    if (specInput) specInput.addEventListener("input", onInput);
    if (moreMenu) moreMenu.addEventListener("change", onFilter);
    function onDoc(e) {
      if (!root.contains(e.target)) closeMore();
    }
    document.addEventListener("click", onDoc);

    var handle = {
      setActive: function (id, opts) {
        if (!byId[id] || byId[id].kind !== "lens") return;
        active = id;
        paintPressed();
        paintRead();
        if (!(opts && opts.silent) && typeof options.onSelect === "function") options.onSelect(active, byId[active]);
      },
      getActive: function () { return active; },
      getFilters: function () { return { cah: !!filters.cah, fqhc: !!filters.fqhc, cms: !!filters.cms }; },
      refresh: function () { syncSpecialty(); paintRead(); },
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
        if (moreMenu) moreMenu.removeEventListener("change", onFilter);
        document.removeEventListener("click", onDoc);
        root.innerHTML = "";
      }
    };
    global.AmpMiAspectsSelectorHandle = handle;
    return handle;
  }

  global.AmpMiAspectsSelector = {
    PRIMARY: PRIMARY,
    MORE: MORE,
    LENSES: PRIMARY.concat(MORE),
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
