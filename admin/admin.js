/* Administration « backend Git » : lit et écrit wedding/content/* dans le dépôt GitHub via l'API Contents. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Libellés français des clés ---------- */
  const LABELS = {
    site: "Site", title: "Titre", language: "Langue (en, fr…)", description: "Description (SEO / partage)", ogImage: "Image de partage (WhatsApp, réseaux)", favicon: "Favicon",
    theme: "Thème (couleurs & polices)", colorRed: "Rouge (titres, boutons)", colorCharcoal: "Gris foncé (prénoms, textes)", colorGrey: "Gris (monogramme)", colorTaupe: "Taupe (filets)", colorCream: "Crème (haut et bas de page)", colorPaper: "Blanc papier (bande centrale)", colorCreamLow: "Crème chaud (bas de page)", fontSerif: "Police serif (Google Fonts)", fontSans: "Police sans-serif (Google Fonts)", fontScript: "Police manuscrite (Google Fonts)",
    intro: "Intro (rideau)", prompt: "Texte du bouton d'entrée",
    couple: "Les mariés", bride: "Mariée", groom: "Marié", conjunction: "Mot entre les prénoms (and, &, et)", monogram: "Monogramme (pied de page)",
    hero: "En-tête", eyebrow: "Phrase d'introduction", photo: "Photo du couple",
    event: "Événement", date: "Date et heure ISO (ex. 2026-09-26T17:30:00+01:00)", dateLabel: "Date affichée", city: "Ville", shortDate: "Date courte (pied de page)",
    countdown: "Compte à rebours", labels: "Libellés", days: "Jours", hours: "Heures", minutes: "Minutes", seconds: "Secondes",
    rsvp: "RSVP", enabled: "Activé", buttonLabel: "Texte du bouton", modalTitle: "Titre de la fenêtre", sendVia: "Envoi via", email: "Email de réception", whatsappNumber: "Numéro WhatsApp (indicatif sans +)", formspreeEndpoint: "URL Formspree",
    name: "Nom", presence: "Présence", yes: "Oui", no: "Non", accompanied: "Accompagné(e) ?", plusOne: "Nom du +1", word: "Mot pour les mariés", send: "Bouton envoyer", sending: "Envoi en cours", success: "Message de succès", errorName: "Erreur : nom manquant", errorPresence: "Erreur : présence manquante", errorPlusOne: "Erreur : nom du +1 manquant", errorSend: "Erreur d'envoi",
    venue: "Lieu", illustration: "Illustration", text: "Texte", latitude: "Latitude", longitude: "Longitude", wazeUrl: "Lien Waze (optionnel, sinon calculé)", googleMapsUrl: "Lien Google Maps (optionnel, sinon calculé)", wazeLabel: "Libellé Waze", googleMapsLabel: "Libellé Google Maps",
    attire: "Tenue (dress code)", items: "Éléments", image: "Image", alt: "Texte alternatif", left: "Position gauche (%)", width: "Largeur (%)", captionWomen: "Légende femmes", captionMen: "Légende hommes",
    schedule: "Programme", time: "Heure",
    weddingList: "Liste de mariage", buttons: "Boutons", bank: "Compte associé (morocco / abroad)", opens: "Ouvre (gifts = boutiques, bank = RIB)", shops: "Boutiques", url: "Lien", emptyText: "Texte si aucune boutique", aside: "Phrase avant le bouton RIB", bankButtonLabel: "Bouton coordonnées bancaires", bankModalTitle: "Titre fenêtre bancaire", banks: "Comptes bancaires", morocco: "Compte Maroc", abroad: "Compte étranger", holder: "Titulaire", kind: "Type (RIB, IBAN)", number: "Numéro", copyLabel: "Bouton copier", copiedLabel: "Texte « copié »", copyFailedLabel: "Texte si copie impossible",
    gallery: "Galerie", label: "Libellé",
    footer: "Pied de page", showMonogram: "Afficher le monogramme", showDate: "Afficher la date courte",
  };
  const label = (k) => LABELS[k] || k;
  const IMAGE_KEYS = new Set(["photo", "image", "favicon", "illustration", "ogImage"]);
  const COLOR_KEYS = /^color/;
  const ENUMS = { sendVia: ["mailto", "whatsapp", "formspree"], opens: ["gifts", "bank"], bank: ["morocco", "abroad"] };

  /* ---------- État ---------- */
  const state = {
    cfg: null,          // {owner, repo, branch, base, token}
    site: null, siteSha: null,
    gallery: null, gallerySha: null,
    files: [],          // fichiers du dossier photos [{name, path, sha, size, download_url}]
    thumbs: {},         // path -> objectURL
    dirty: false,
  };

  /* ---------- API GitHub ---------- */
  const api = {
    url(path) { return `https://api.github.com/repos/${state.cfg.owner}/${state.cfg.repo}/contents/${path}`; },
    headers() { return { Authorization: `Bearer ${state.cfg.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }; },
    async get(path) {
      const res = await fetch(`${this.url(path)}?ref=${encodeURIComponent(state.cfg.branch)}`, { headers: this.headers(), cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GitHub ${res.status} sur ${path}`);
      return res.json();
    },
    async put(path, contentB64, message, sha) {
      const body = { message, content: contentB64, branch: state.cfg.branch };
      if (sha) body.sha = sha;
      const res = await fetch(this.url(path), { method: "PUT", headers: this.headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Échec de l'écriture (${res.status}) : ${(await res.json().catch(() => ({}))).message || ""}`);
      return (await res.json()).content;
    },
    async del(path, sha, message) {
      const res = await fetch(this.url(path), { method: "DELETE", headers: this.headers(), body: JSON.stringify({ message, sha, branch: state.cfg.branch }) });
      if (!res.ok) throw new Error(`Échec de la suppression (${res.status})`);
    },
    async raw(file) {
      // download_url fonctionne pour les dépôts publics ; pour les privés on passe par l'API blob.
      const res = await fetch(file.download_url, { headers: this.headers() }).catch(() => null);
      if (res && res.ok) return res.blob();
      const b = await fetch(`https://api.github.com/repos/${state.cfg.owner}/${state.cfg.repo}/git/blobs/${file.sha}`, { headers: this.headers() });
      const j = await b.json();
      const bin = atob(j.content.replace(/\n/g, ""));
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr]);
    },
  };
  const inRepo = (rel) => (state.cfg.base ? `${state.cfg.base}/${rel}` : rel);
  const P = {
    site: () => inRepo("content/site.json"),
    gallery: () => inRepo("content/gallery.json"),
    photos: () => inRepo("content/photos"),
    art: () => inRepo("assets/art"),
    images: () => inRepo("assets/images"),
  };
  const utf8ToB64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
  const b64ToUtf8 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

  /* ---------- Connexion ---------- */
  function guessRepoFromUrl() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/);
    if (!m) return {};
    const seg = location.pathname.split("/").filter(Boolean);
    return { owner: m[1], repo: seg[0] || `${m[1]}.github.io` };
  }
  function loadSavedCfg() {
    try {
      const s = JSON.parse(localStorage.getItem("wedding-admin") || sessionStorage.getItem("wedding-admin") || "null");
      return s || {};
    } catch { return {}; }
  }
  function saveCfg(remember) {
    const store = remember ? localStorage : sessionStorage;
    (remember ? sessionStorage : localStorage).removeItem("wedding-admin");
    store.setItem("wedding-admin", JSON.stringify(state.cfg));
  }
  function setStatus(el, ok, msg) { el.className = `status ${msg ? (ok ? "status--ok" : "status--err") : ""}`; el.textContent = msg || ""; }

  async function connect(cfg) {
    state.cfg = cfg;
    const site = await api.get(P.site());
    if (!site) throw new Error("content/site.json introuvable : vérifiez propriétaire / dépôt / branche / dossier.");
    state.site = JSON.parse(b64ToUtf8(site.content));
    state.siteSha = site.sha;
    const gal = await api.get(P.gallery());
    state.gallery = gal ? JSON.parse(b64ToUtf8(gal.content)) : { photos: [] };
    state.gallerySha = gal ? gal.sha : null;
    await refreshFiles();
  }
  async function refreshFiles() {
    const lists = await Promise.all([api.get(P.photos()), api.get(P.art()), api.get(P.images())]);
    state.files = lists.flatMap((l) => (Array.isArray(l) ? l : [])).filter((f) => f.type === "file" && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f.name));
  }

  /* ---------- Formulaire généré ---------- */
  const getPath = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const setPath = (obj, path, v) => { const last = path[path.length - 1]; getPath(obj, path.slice(0, -1))[last] = v; state.dirty = true; };
  const photoPath = (f) => (state.cfg.base && f.path.startsWith(state.cfg.base + "/") ? f.path.slice(state.cfg.base.length + 1) : f.path);

  function fieldEl(key, path, value, wide) {
    const wrap = document.createElement("div");
    wrap.className = `field ${wide ? "field--wide" : ""}`;
    const lab = document.createElement("label");
    lab.textContent = label(key);
    wrap.appendChild(lab);
    const bind = (el, conv = (v) => v) => { el.addEventListener("input", () => setPath(state.site, path, conv(el.value))); lab.appendChild(el); };

    if (typeof value === "boolean") {
      lab.className = "check"; lab.textContent = "";
      const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = value;
      cb.addEventListener("change", () => setPath(state.site, path, cb.checked));
      lab.append(cb, document.createTextNode(" " + label(key)));
    } else if (typeof value === "number") {
      const el = document.createElement("input"); el.type = "number"; el.step = "any"; el.value = value; bind(el, Number);
    } else if (ENUMS[key]) {
      const el = document.createElement("select");
      el.innerHTML = ENUMS[key].map((o) => `<option ${o === value ? "selected" : ""}>${o}</option>`).join("");
      el.addEventListener("change", () => setPath(state.site, path, el.value)); lab.appendChild(el);
    } else if (COLOR_KEYS.test(key) && /^#[0-9a-f]{6}$/i.test(value)) {
      const row = document.createElement("div"); row.className = "imgfield";
      const col = document.createElement("input"); col.type = "color"; col.value = value;
      const txt = document.createElement("input"); txt.value = value;
      col.addEventListener("input", () => { txt.value = col.value; setPath(state.site, path, col.value); });
      txt.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(txt.value)) col.value = txt.value; setPath(state.site, path, txt.value); });
      row.append(col, txt); lab.appendChild(row);
    } else if (IMAGE_KEYS.has(key)) {
      const row = document.createElement("div"); row.className = "imgfield";
      const img = document.createElement("img"); img.alt = "";
      const sel = document.createElement("select");
      const opts = [value, ...state.files.map(photoPath)].filter((v, i, a) => v && a.indexOf(v) === i);
      sel.innerHTML = `<option value="">— aucune —</option>` + opts.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("");
      const preview = () => { const f = state.files.find((x) => photoPath(x) === sel.value); img.src = f ? thumb(f) : ""; };
      sel.addEventListener("change", () => { setPath(state.site, path, sel.value); preview(); });
      row.append(img, sel); lab.appendChild(row); preview();
    } else {
      const long = String(value).length > 70 || /\n/.test(value);
      const el = document.createElement(long ? "textarea" : "input"); el.value = value; bind(el);
      if (long) wrap.classList.add("field--wide");
    }
    return wrap;
  }

  function renderObject(obj, path, container) {
    for (const [key, value] of Object.entries(obj)) {
      const p = [...path, key];
      if (Array.isArray(value)) container.appendChild(renderArray(key, p, value));
      else if (value && typeof value === "object") {
        const sub = document.createElement("div"); sub.className = "subgroup";
        sub.innerHTML = `<div class="sub__title">${esc(label(key))}</div>`;
        const body = document.createElement("div"); body.className = "list__body";
        renderObject(value, p, body); sub.appendChild(body); container.appendChild(sub);
      } else container.appendChild(fieldEl(key, p, value, false));
    }
  }

  function renderArray(key, path, arr) {
    const wrap = document.createElement("div"); wrap.className = "list";
    const allPrim = arr.every((v) => typeof v !== "object");
    if (allPrim) {
      const f = document.createElement("div"); f.className = "field field--wide";
      f.innerHTML = `<label>${esc(label(key))}</label>`;
      const ta = document.createElement("textarea"); ta.value = arr.join("\n");
      ta.addEventListener("input", () => setPath(state.site, path, ta.value.split("\n").map((s) => s.trim()).filter(Boolean)));
      f.firstChild.appendChild(ta); wrap.appendChild(f); return wrap;
    }
    const title = document.createElement("div"); title.className = "sub__title";
    title.innerHTML = `<span>${esc(label(key))}</span>`;
    const add = document.createElement("button"); add.type = "button"; add.className = "btn btn--sm"; add.textContent = "+ Ajouter";
    add.addEventListener("click", () => {
      const tpl = arr[arr.length - 1] || {};
      const blank = Object.fromEntries(Object.entries(tpl).map(([k, v]) => [k, typeof v === "number" ? 0 : typeof v === "boolean" ? true : Array.isArray(v) ? [] : typeof v === "object" ? {} : ""]));
      arr.push(blank); state.dirty = true; renderForm();
    });
    title.appendChild(add); wrap.appendChild(title);

    arr.forEach((item, i) => {
      const it = document.createElement("div"); it.className = "list__item";
      const head = document.createElement("div"); head.className = "list__head";
      head.innerHTML = `<span>#${i + 1} ${esc(item.title || item.name || item.label || item.time || "")}</span>`;
      const btns = document.createElement("div"); btns.className = "btns";
      const mk = (txt, fn, cls = "btn--ghost") => { const b = document.createElement("button"); b.type = "button"; b.className = `btn btn--sm ${cls}`; b.textContent = txt; b.addEventListener("click", () => { fn(); state.dirty = true; renderForm(); }); return b; };
      btns.append(
        mk("↑", () => { if (i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }),
        mk("↓", () => { if (i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }),
        mk("Supprimer", () => arr.splice(i, 1), "btn--danger"),
      );
      head.appendChild(btns); it.appendChild(head);
      const body = document.createElement("div"); body.className = "list__body";
      renderObject(item, [...path, i], body); it.appendChild(body); wrap.appendChild(it);
    });
    return wrap;
  }

  function renderForm() {
    const root = $("#tab-content");
    const openGroups = new Set($$("details.group[open]", root).map((d) => d.dataset.key));
    root.innerHTML = "";
    for (const [key, value] of Object.entries(state.site)) {
      const det = document.createElement("details"); det.className = "group"; det.dataset.key = key;
      if (openGroups.has(key) || (!openGroups.size && key === "couple")) det.open = true;
      det.innerHTML = `<summary>${esc(label(key))}</summary>`;
      const body = document.createElement("div"); body.className = "group__body";
      if (Array.isArray(value)) body.appendChild(renderArray(key, [key], value));
      else if (value && typeof value === "object") renderObject(value, [key], body);
      else body.appendChild(fieldEl(key, [key], value, true));
      det.appendChild(body); root.appendChild(det);
    }
    $("#json-site").value = JSON.stringify(state.site, null, 2);
    $("#json-gallery").value = JSON.stringify(state.gallery, null, 2);
  }

  /* ---------- Photos ---------- */
  function thumb(f) {
    if (state.thumbs[f.path]) return state.thumbs[f.path];
    state.thumbs[f.path] = "";
    api.raw(f).then((blob) => {
      state.thumbs[f.path] = URL.createObjectURL(blob);
      $$(`img[data-path="${CSS.escape(f.path)}"]`).forEach((img) => (img.src = state.thumbs[f.path]));
      $$(".imgfield select").forEach((sel) => sel.dispatchEvent(new Event("change")));
    }).catch(() => {});
    return "";
  }
  const thumbImg = (src) => { const f = state.files.find((x) => photoPath(x) === src); return f ? `<img data-path="${esc(f.path)}" src="${esc(thumb(f))}" alt="">` : `<img alt="" src="">`; };

  function renderPhotos() {
    const gal = $("#gallery-list");
    const photos = state.gallery.photos || (state.gallery.photos = []);
    gal.innerHTML = photos.length ? "" : `<p class="hint">La galerie est vide.</p>`;
    photos.forEach((p, i) => {
      const card = document.createElement("div"); card.className = "photo";
      card.innerHTML = `${thumbImg(p.src)}<div class="photo__body">
        <div class="photo__name">${esc(p.src.replace("content/", ""))}</div>
        <input placeholder="Légende" value="${esc(p.caption || "")}" data-k="caption">
        <input placeholder="Texte alternatif" value="${esc(p.alt || "")}" data-k="alt">
        <div class="photo__btns">
          <button class="btn btn--sm btn--ghost" data-act="up">↑</button>
          <button class="btn btn--sm btn--ghost" data-act="down">↓</button>
          <button class="btn btn--sm btn--danger" data-act="remove">Retirer</button>
        </div></div>`;
      $$("input", card).forEach((inp) => inp.addEventListener("input", () => { p[inp.dataset.k] = inp.value; state.dirty = true; }));
      card.addEventListener("click", (e) => {
        const act = e.target.dataset.act; if (!act) return;
        if (act === "up" && i > 0) [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]];
        if (act === "down" && i < photos.length - 1) [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]];
        if (act === "remove") photos.splice(i, 1);
        state.dirty = true; renderPhotos();
      });
      gal.appendChild(card);
    });

    const files = $("#files-list");
    files.innerHTML = state.files.length ? "" : `<p class="hint">Aucun fichier.</p>`;
    state.files.forEach((f) => {
      const inGallery = photos.some((p) => p.src === photoPath(f));
      const card = document.createElement("div"); card.className = "photo";
      card.innerHTML = `${thumbImg(photoPath(f))}<div class="photo__body">
        <div class="photo__name">${esc(photoPath(f))} · ${Math.round(f.size / 1024)} Ko</div>
        <div class="photo__btns">
          ${inGallery ? `<span class="muted">Dans la galerie</span>` : `<button class="btn btn--sm btn--ghost" data-act="add">+ Galerie</button>`}
          <button class="btn btn--sm btn--danger" data-act="delete">Supprimer du dépôt</button>
        </div></div>`;
      card.addEventListener("click", async (e) => {
        const act = e.target.dataset.act; if (!act) return;
        if (act === "add") { photos.push({ src: photoPath(f), alt: f.name.replace(/\.[^.]+$/, ""), caption: "" }); state.dirty = true; renderPhotos(); }
        if (act === "delete") {
          if (!confirm(`Supprimer définitivement ${f.name} du dépôt ?`)) return;
          try {
            await api.del(f.path, f.sha, `wedding: suppression de la photo ${f.name}`);
            const idx = photos.findIndex((p) => p.src === photoPath(f));
            if (idx >= 0) { photos.splice(idx, 1); state.dirty = true; }
            await refreshFiles(); renderPhotos(); renderForm();
            setStatus($("#upload-status"), true, `${f.name} supprimée. ${state.dirty ? "Pensez à enregistrer la galerie." : ""}`);
          } catch (err) { setStatus($("#upload-status"), false, err.message); }
        }
      });
      files.appendChild(card);
    });
  }

  function resizeImage(file, maxPx) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/jpeg", 0.85);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error(`Image illisible : ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }
  const blobToB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();

  async function uploadFiles(fileList) {
    const st = $("#upload-status");
    const original = $("#in-original").checked, maxPx = Number($("#in-maxpx").value) || 1600, addGal = $("#in-addgallery").checked;
    const files = Array.from(fileList);
    let n = 0;
    for (const file of files) {
      try {
        setStatus(st, true, `Envoi ${++n}/${files.length} : ${file.name}…`);
        let blob = file, name = slug(file.name);
        if (!original && !/\.(svg|gif)$/i.test(file.name)) { blob = await resizeImage(file, maxPx); name = name.replace(/\.[^.]+$/, "") + ".jpg"; }
        const existing = state.files.find((f) => f.name === name);
        const content = await api.put(`${P.photos()}/${name}`, await blobToB64(blob), `wedding: ajout de la photo ${name}`, existing?.sha);
        if (addGal && !state.gallery.photos.some((p) => p.src === `content/photos/${name}`)) {
          state.gallery.photos.push({ src: `content/photos/${name}`, alt: name.replace(/\.[^.]+$/, ""), caption: "" });
          state.dirty = true;
        }
        delete state.thumbs[content.path];
      } catch (err) { setStatus(st, false, `${file.name} : ${err.message}`); return; }
    }
    await refreshFiles(); renderPhotos(); renderForm();
    setStatus(st, true, `${files.length} photo(s) envoyée(s).${addGal ? " Cliquez sur « Enregistrer » pour publier la galerie." : ""}`);
  }

  /* ---------- Enregistrement ---------- */
  async function saveAll() {
    const btn = $("#btn-save"), st = $("#save-status");
    btn.disabled = true; setStatus(st, true, "Enregistrement…");
    try {
      // Si l'onglet JSON a été modifié à la main, on le prend en compte.
      const jsonSite = $("#json-site").value, jsonGal = $("#json-gallery").value;
      if (jsonSite.trim() && jsonSite !== JSON.stringify(state.site, null, 2)) { try { state.site = JSON.parse(jsonSite); } catch { throw new Error("site.json invalide (onglet JSON)"); } }
      if (jsonGal.trim() && jsonGal !== JSON.stringify(state.gallery, null, 2)) { try { state.gallery = JSON.parse(jsonGal); } catch { throw new Error("gallery.json invalide (onglet JSON)"); } }

      const s = await api.put(P.site(), utf8ToB64(JSON.stringify(state.site, null, 2) + "\n"), "wedding: mise à jour du contenu du site", state.siteSha);
      state.siteSha = s.sha;
      const g = await api.put(P.gallery(), utf8ToB64(JSON.stringify(state.gallery, null, 2) + "\n"), "wedding: mise à jour de la galerie", state.gallerySha);
      state.gallerySha = g.sha;
      state.dirty = false;
      renderForm();
      setStatus(st, true, "✅ Enregistré. Le site sera mis à jour dans une à deux minutes (déploiement automatique).");
    } catch (err) { setStatus(st, false, err.message); }
    btn.disabled = false;
  }

  /* ---------- UI ---------- */
  function showEditor() {
    $("#panel-login").hidden = true; $("#panel-editor").hidden = false; $("#btn-logout").hidden = false;
    $("#repo-label").textContent = `${state.cfg.owner}/${state.cfg.repo} @ ${state.cfg.branch} · ${inRepo("content")}`;
    renderForm(); renderPhotos();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const saved = { ...guessRepoFromUrl(), ...loadSavedCfg() };
    $("#in-owner").value = saved.owner || ""; $("#in-repo").value = saved.repo || "";
    $("#in-branch").value = saved.branch || "main"; $("#in-base").value = saved.base || "";
    $("#in-token").value = saved.token || ""; $("#in-remember").checked = !!localStorage.getItem("wedding-admin");

    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const st = $("#login-status"); setStatus(st, true, "Connexion…");
      try {
        await connect({ owner: $("#in-owner").value.trim(), repo: $("#in-repo").value.trim(), branch: $("#in-branch").value.trim(), base: $("#in-base").value.trim().replace(/^\/|\/$/g, ""), token: $("#in-token").value.trim() });
        saveCfg($("#in-remember").checked);
        showEditor();
      } catch (err) { setStatus(st, false, err.message); }
    });
    if (saved.token && saved.owner && saved.repo) $("#login-form").requestSubmit();

    $("#btn-logout").addEventListener("click", () => { localStorage.removeItem("wedding-admin"); sessionStorage.removeItem("wedding-admin"); location.reload(); });
    $$(".tab").forEach((t) => t.addEventListener("click", () => {
      $$(".tab").forEach((x) => x.classList.toggle("is-active", x === t));
      $$(".tabpane").forEach((p) => (p.hidden = p.id !== `tab-${t.dataset.tab}`));
    }));
    $("#btn-save").addEventListener("click", saveAll);
    $("#btn-reload").addEventListener("click", async () => {
      if (state.dirty && !confirm("Des modifications non enregistrées seront perdues. Continuer ?")) return;
      try { await connect(state.cfg); state.dirty = false; showEditor(); setStatus($("#save-status"), true, "Rechargé depuis le dépôt."); } catch (err) { setStatus($("#save-status"), false, err.message); }
    });
    $("#btn-json-apply").addEventListener("click", () => {
      try { state.site = JSON.parse($("#json-site").value); state.gallery = JSON.parse($("#json-gallery").value); state.dirty = true; renderForm(); renderPhotos(); setStatus($("#save-status"), true, "JSON appliqué au formulaire (non enregistré)."); }
      catch (err) { setStatus($("#save-status"), false, `JSON invalide : ${err.message}`); }
    });
    $("#in-files").addEventListener("change", (e) => { uploadFiles(e.target.files); e.target.value = ""; });
    window.addEventListener("beforeunload", (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });
  });
})();
