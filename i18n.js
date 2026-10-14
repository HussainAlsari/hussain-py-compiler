/* Hussain Compiler - language engine.
   - Interface language: translates the whole IDE by matching exact English strings (static and dynamic).
   - Course language: separate setting used by courses.js.
   - Any language: export the template, translate it, import it (stored in this browser). */
(() => {
  "use strict";
  const KEY = "hussain-lang-v1";
  const HC = (window.HC = window.HC || {});
  const packs = (HC.packs = HC.packs || {});
  packs.en = { code: "en", name: "English", dir: "ltr", ui: {}, course: { items: {} } };
  HC.register = (p) => { packs[p.code] = p; };

  const bad = (k) => k === "__proto__" || k === "constructor" || k === "prototype";
  const get = (o, k) => (o && Object.hasOwn(o, k) ? o[k] : undefined);

  function safeMap(o, maxEntries, maxLen) {
    const out = Object.create(null);
    if (!o || typeof o !== "object" || Array.isArray(o)) return out;
    let n = 0;
    for (const [k, v] of Object.entries(o)) {
      if (bad(k)) continue;
      if (++n > maxEntries) break;
      if (typeof v === "string" && v.length <= maxLen) out[k] = v;
    }
    return out;
  }
  function validate(raw) {
    if (!raw || typeof raw !== "object") throw new Error("not a JSON object");
    const code = String(raw.code || "").trim();
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(code) || code === "en") throw new Error("invalid language code (use fr, es, tr, ur ...)");
    const items = Object.create(null);
    const ri = raw.course && raw.course.items;
    if (ri && typeof ri === "object") {
      for (const [k, v] of Object.entries(ri)) {
        if (bad(k) || !v || typeof v !== "object") continue;
        if (Object.keys(items).length > 200) break;
        const it = Object.create(null);
        for (const f of ["title", "simple", "body", "task", "hint"]) if (typeof v[f] === "string" && v[f].length <= 20000) it[f] = v[f];
        for (const f of ["walk", "mistakes", "must"]) if (Array.isArray(v[f])) it[f] = v[f].slice(0, 30).map((x) => (typeof x === "string" && x.length <= 2000 ? x : ""));
        items[k] = it;
      }
    }
    return { code, name: String(raw.name || code).slice(0, 40), dir: raw.dir === "rtl" ? "rtl" : "ltr", ui: safeMap(raw.ui, 3000, 3000), course: { items }, custom: true };
  }

  const state = { ui: "en", course: "same", custom: {} };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && typeof s === "object") {
      state.ui = String(s.ui || "en");
      state.course = String(s.course || "same");
      for (const [c, raw] of Object.entries(s.custom && typeof s.custom === "object" ? s.custom : {})) {
        try { const p = validate(raw); if (!packs[p.code]) { packs[p.code] = p; state.custom[p.code] = p; } } catch (_) { /* ignore bad pack */ }
      }
    }
  } catch (_) { /* storage unavailable */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };

  const uiLang = () => (packs[state.ui] ? state.ui : "en");
  const courseLang = () => { const c = state.course === "same" ? uiLang() : state.course; return packs[c] ? c : "en"; };
  HC.lang = uiLang;
  HC.courseLang = courseLang;

  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)) : s);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function patterns(p) {
    if (p._pat) return p._pat;
    const out = [];
    for (const k of Object.keys(p.ui)) {
      if (!/\{\w+\}/.test(k) || !p.ui[k]) continue;
      const names = [];
      const src = esc(k).replace(/\\\{(\w+)\\\}/g, (_, n) => { names.push(n); return "(.+?)"; });
      out.push({ re: new RegExp("^" + src + "$"), names, out: p.ui[k] });
    }
    Object.defineProperty(p, "_pat", { value: out, enumerable: false });
    return out;
  }
  function tr(core, lang) {
    const p = packs[lang];
    if (!p || lang === "en") return null;
    const v = get(p.ui, core);
    if (v) return v;
    for (const q of patterns(p)) {
      const m = core.match(q.re);
      if (m) return q.out.replace(/\{(\w+)\}/g, (x, n) => { const i = q.names.indexOf(n); return i >= 0 ? m[i + 1] : x; });
    }
    return null;
  }
  HC.T = (s, v, lang) => {
    const l = lang || uiLang();
    return fill((l !== "en" && get(packs[l] && packs[l].ui, s)) || s, v);
  };

  // ---- DOM translation ----
  const textMap = new WeakMap(), attrMap = new WeakMap();
  const ATTRS = ["title", "aria-label", "placeholder"];
  const SKIP = "[data-i18n-skip],.CodeMirror,textarea,script,style,pre";
  function skippedText(el) {
    if (!el || el.closest(SKIP)) return true;
    return !!(el.closest("#console") && !el.closest(".system,.welcome-line"));
  }
  function doText(node) {
    if (skippedText(node.parentElement)) return;
    const v = node.nodeValue, rec = textMap.get(node);
    const orig = rec && v === rec.out ? rec.orig : v;
    const m = orig.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return;
    const lang = uiLang();
    const t = lang === "en" ? null : tr(m[2].replace(/\s+/g, " "), lang);
    const out = t ? m[1] + t + m[3] : orig;
    if (out !== v) node.nodeValue = out;
    if (t || rec) textMap.set(node, { orig, out });
  }
  function doAttr(el, name) {
    if (el.closest(SKIP)) return;
    const v = el.getAttribute(name);
    if (v == null) return;
    let rec = attrMap.get(el);
    if (!rec) attrMap.set(el, (rec = {}));
    const r = rec[name], orig = r && v === r.out ? r.orig : v, lang = uiLang();
    const t = lang === "en" ? null : tr(orig.trim().replace(/\s+/g, " "), lang);
    const out = t || orig;
    if (out !== v) el.setAttribute(name, out);
    if (t || r) rec[name] = { orig, out };
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach(doText);
    [root, ...root.querySelectorAll("[title],[aria-label],[placeholder]")].forEach((el) => ATTRS.forEach((a) => el.hasAttribute(a) && doAttr(el, a)));
  }
  const mo = new MutationObserver((recs) => {
    if (uiLang() === "en") return;
    for (const r of recs) {
      if (r.type === "characterData") doText(r.target);
      else if (r.type === "attributes") doAttr(r.target, r.attributeName);
      else r.addedNodes.forEach(walk);
    }
  });

  for (const f of ["prompt", "confirm", "alert"]) {
    const orig = window[f].bind(window);
    window[f] = (m, ...rest) => orig(typeof m === "string" ? tr(m, uiLang()) || m : m, ...rest);
  }

  function applyMeta() {
    const p = packs[uiLang()];
    document.documentElement.lang = p.code;
    document.documentElement.toggleAttribute("data-rtl", p.dir === "rtl");
  }
  HC.setLang = (ui, course) => {
    if (ui) state.ui = ui;
    if (course) state.course = course;
    persist(); applyMeta(); walk(document.body); syncSelects();
    document.dispatchEvent(new CustomEvent("hc-lang"));
  };

  // ---- settings UI ----
  let selUi, selCourse;
  const toast = (m, err) => { if (typeof showToast === "function") showToast(m, err); };
  function syncSelects() {
    if (!selUi) return;
    const codes = Object.keys(packs).sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
    const fillSel = (sel, value, extra) => {
      sel.replaceChildren();
      if (extra) sel.add(new Option(HC.T(extra), "same"));
      codes.forEach((c) => sel.add(new Option(packs[c].name, c)));
      sel.value = value;
    };
    fillSel(selUi, uiLang());
    fillSel(selCourse, state.course === "same" || !packs[state.course] ? "same" : state.course, "Same as interface");
  }
  function exportTemplate() {
    const ui = {};
    Object.keys((packs.ar && packs.ar.ui) || {}).forEach((k) => { ui[k] = k; });
    const items = {};
    (HC.courses || []).forEach((c) => {
      items[c.id] = { title: c.title };
      c.lessons.forEach((l) => {
        items[`${c.id}/${l.id}`] = { title: l.title, simple: l.simple, body: l.body, task: l.task, hint: l.hint, walk: l.walk.map((w) => w[1]), mistakes: l.mistakes, must: (l.must || []).map((m) => m[1]) };
      });
    });
    const tpl = {
      _help: "Set code (e.g. fr), name (shown in the menu) and dir (ltr or rtl). Translate the VALUES only, never the keys. In ui, keep {placeholders} such as {n}. Keep code inside <pre> and <code> unchanged. Then import this file from Settings > Language packs.",
      code: "xx", name: "Your language name", dir: "ltr", ui, course: { items },
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(tpl, null, 2)], { type: "application/json" }));
    a.download = "hussain-language-template.json";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(HC.T("Template downloaded. Translate the values, then import it."));
  }
  function buildSettings() {
    const dlg = document.getElementById("settingsDialog");
    const footer = dlg && dlg.querySelector(".settings-footer");
    if (!footer) return;
    const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    const row = (title, desc, ctl) => {
      const r = mk("div", "setting-row lang-row"), info = mk("span");
      info.append(mk("strong", "", title), mk("small", "", desc));
      r.append(info, ctl);
      return r;
    };
    selUi = mk("select", "lang-select"); selUi.id = "langUi";
    selCourse = mk("select", "lang-select"); selCourse.id = "langCourse";
    selUi.onchange = () => HC.setLang(selUi.value);
    selCourse.onchange = () => HC.setLang(null, selCourse.value);
    const actions = mk("span", "lang-actions");
    const bExp = mk("button", "", "Export template"), bImp = mk("button", "", "Import pack"), bDel = mk("button", "", "Remove custom packs");
    [bExp, bImp, bDel].forEach((b) => { b.type = "button"; });
    const file = mk("input"); file.type = "file"; file.accept = ".json,application/json"; file.hidden = true;
    bExp.onclick = exportTemplate;
    bImp.onclick = () => file.click();
    bDel.onclick = () => {
      if (!confirm("Remove all imported language packs?")) return;
      Object.keys(state.custom).forEach((c) => { delete packs[c]; });
      state.custom = {};
      if (!packs[state.ui]) state.ui = "en";
      if (state.course !== "same" && !packs[state.course]) state.course = "same";
      HC.setLang();
      toast(HC.T("Custom language packs removed."));
    };
    file.onchange = async () => {
      const f = file.files[0]; file.value = "";
      if (!f) return;
      try {
        if (f.size > 3e6) throw new Error("file is too large");
        const p = validate(JSON.parse(await f.text()));
        if (packs[p.code] && !packs[p.code].custom) throw new Error("this code is a built-in language");
        packs[p.code] = p; state.custom[p.code] = p; persist(); syncSelects();
        toast(HC.T("Language pack “{name}” added.", { name: p.name }));
      } catch (e) { toast(HC.T("Could not read this language pack: {msg}", { msg: e.message }), true); }
    };
    actions.append(bExp, bImp, bDel, file);
    footer.before(
      row("Interface language", "Language of menus, buttons and messages.", selUi),
      row("Course language", "Language of the Python lessons.", selCourse),
      row("Language packs", "Add any language: export the template, translate it, then import it.", actions),
    );
    syncSelects();
  }

  let started = false;
  function init() {
    if (started) return;
    started = true;
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    buildSettings();
    applyMeta();
    walk(document.body);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
