/* Site de mariage paramétrable — rendu 100 % côté client à partir de content/site.json et content/gallery.json */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (s) => String(s ?? "").split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const img = (src, cls, alt = "") => (src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : "");
  const bust = `?t=${Date.now()}`;

  async function loadJSON(path) {
    const res = await fetch(path + bust, { cache: "no-store" });
    if (!res.ok) throw new Error(`Cannot load ${path} (${res.status})`);
    return res.json();
  }

  function applyTheme(t = {}) {
    const r = document.documentElement.style;
    if (t.colorBackground) r.setProperty("--bg", t.colorBackground);
    if (t.colorAccent) r.setProperty("--accent", t.colorAccent);
    if (t.colorText) r.setProperty("--text", t.colorText);
    if (t.colorMuted) r.setProperty("--muted", t.colorMuted);
    if (t.fontHeading) r.setProperty("--font-heading", `"${t.fontHeading}", Georgia, serif`);
    if (t.fontBody) r.setProperty("--font-body", `"${t.fontBody}", Arial, sans-serif`);
    document.body.classList.toggle("has-texture", t.paperTexture !== false);
    document.body.classList.toggle("has-blotches", t.watercolorBlotches !== false);
  }

  const title = (t) => (t ? `<h2 class="section__title">${esc(t)}</h2>` : "");

  /* ---------- Sections ---------- */
  function renderHero(c) {
    const { couple = {}, hero = {} } = c;
    return `<section id="home" class="hero">
      ${hero.kicker ? `<div class="hero__kicker">${esc(hero.kicker)}</div>` : ""}
      <h1 class="hero__names">${esc(couple.bride)}<span class="and">${esc(couple.conjunction || "&")}</span>${esc(couple.groom)}</h1>
      ${hero.photo ? `<div class="hero__figure">
        ${img(hero.leftDecoration, "hero__deco hero__deco--left")}
        <img class="hero__photo" src="${esc(hero.photo)}" alt="${esc(couple.bride)} ${esc(couple.conjunction || "&")} ${esc(couple.groom)}">
        ${img(hero.rightDecoration, "hero__deco hero__deco--right")}
      </div>` : ""}
      ${img(hero.divider, "hero__lights")}
    </section>`;
  }

  function renderDate(c) {
    const e = c.event || {}, cd = c.countdown || {}, r = c.rsvp || {};
    const l = cd.labels || {};
    const countdown = cd.enabled && e.date ? `<div class="countdown" id="countdown" data-date="${esc(e.date)}">
        <div class="countdown__digits"><span data-cd="d">00</span><span class="sep">:</span><span data-cd="h">00</span><span class="sep">:</span><span data-cd="m">00</span><span class="sep">:</span><span data-cd="s">00</span></div>
        <div class="countdown__labels"><span>${esc(l.days || "days")}</span><span>${esc(l.hours || "hours")}</span><span>${esc(l.minutes || "minutes")}</span><span>${esc(l.seconds || "seconds")}</span></div>
        <div class="countdown__done" hidden>${esc(cd.finishedText || "")}</div>
      </div>` : "";
    const rsvpHref = r.mode === "link" ? esc(r.url || "#") : "#rsvp";
    const rsvpBtn = r.enabled ? `<div><a class="btn" href="${rsvpHref}" ${r.mode === "link" ? 'target="_blank" rel="noopener"' : ""}>${esc(r.buttonLabel || "RSVP")}</a></div>` : "";
    return `<section id="date" class="date reveal">
      <div class="date__label">${esc(e.dateLabel)}</div>
      ${e.city ? `<div class="date__city">${esc(e.city)}</div>` : ""}
      ${countdown}${rsvpBtn}
    </section>`;
  }

  function renderVenue(c) {
    const v = c.venue || {};
    if (!v.enabled) return "";
    return `<section id="venue" class="section reveal">
      ${title(v.title)}
      ${img(v.illustration, "illus illus--wide", v.name || v.title)}
      ${v.name ? `<h3 class="schedule__title" style="margin-top:14px">${esc(v.name)}</h3>` : ""}
      <div class="text" style="margin-top:18px">${paras(v.text)}</div>
      ${v.mapsUrl ? `<a class="btn" style="margin-top:22px" href="${esc(v.mapsUrl)}" target="_blank" rel="noopener">${esc(v.buttonLabel || "Directions")}</a>` : ""}
    </section>`;
  }

  function renderAttire(c) {
    const a = c.attire || {};
    if (!a.enabled) return "";
    const items = (a.items || []).map((it) => `<div class="attire__item">${img(it.illustration, "illus", it.label)}<div class="attire__label">${esc(it.label)}</div></div>`).join("");
    return `<section id="attire" class="section reveal">
      ${title(a.title)}
      ${a.text ? `<div class="text attire__text">${paras(a.text)}</div>` : ""}
      <div class="attire__grid">${items}</div>
      ${img(a.divider, "attire__divider")}
    </section>`;
  }

  function renderSchedule(c) {
    const s = c.schedule || {};
    if (!s.enabled) return "";
    const items = (s.items || []).map((it) => `<li class="schedule__item">
        <div class="schedule__time">${esc(it.time)}</div>
        <div class="schedule__title">${esc(it.title)}</div>
        ${it.description ? `<div class="text">${esc(it.description)}</div>` : ""}
      </li>`).join("");
    return `<section id="schedule" class="section schedule reveal">
      ${img(s.leftDecoration, "schedule__deco schedule__deco--left")}
      ${img(s.rightDecoration, "schedule__deco schedule__deco--right")}
      ${title(s.title)}
      <ul class="schedule__list">${items}</ul>
      ${s.closingText ? `<div class="schedule__closing">${esc(s.closingText)}</div>` : ""}
    </section>`;
  }

  function renderGallery(c, photos) {
    const g = c.gallery || {};
    if (!g.enabled || !photos.length) return "";
    const items = photos.map((p, i) => `<figure class="gallery__item" data-index="${i}" style="margin:0"><img src="${esc(p.src)}" alt="${esc(p.alt || "")}" loading="lazy"></figure>`).join("");
    return `<section id="gallery" class="section reveal">${title(g.title)}${g.subtitle ? `<div class="text" style="margin:-14px auto 20px;font-style:italic">${esc(g.subtitle)}</div>` : ""}<div class="gallery">${items}</div></section>`;
  }

  function renderWeddingList(c) {
    const w = c.weddingList || {};
    if (!w.enabled) return "";
    const links = (w.links || []).filter((l) => l.label).map((l) => `<a class="btn" href="${esc(l.url || "#")}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
    return `<section id="wedding-list" class="section reveal">
      ${title(w.title)}
      <div class="text">${paras(w.text)}</div>
      ${links ? `<div class="btn-row">${links}</div>` : ""}
    </section>`;
  }

  function renderRsvpForm(c) {
    const r = c.rsvp || {}, f = r.form || {}, l = f.labels || {};
    if (!r.enabled || r.mode === "link") return "";
    const max = Math.max(1, Number(f.maxGuests || 5));
    const opts = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
    return `<section id="rsvp" class="section reveal">
      ${title(f.title || r.buttonLabel || "RSVP")}
      <form class="rsvp-form" id="rsvp-form" novalidate>
        ${f.subtitle ? `<div class="section__subtitle">${esc(f.subtitle)}</div>` : ""}
        <div class="field"><label for="rsvp-name">${esc(l.name || "Name")}</label><input id="rsvp-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="rsvp-email">${esc(l.email || "Email")}</label><input id="rsvp-email" name="email" type="email" autocomplete="email"></div>
        <div class="field"><label>${esc(l.attending || "Attending?")}</label>
          <div class="radios">
            <label><input type="radio" name="attending" value="yes" checked> ${esc(l.yes || "Yes")}</label>
            <label><input type="radio" name="attending" value="no"> ${esc(l.no || "No")}</label>
          </div>
        </div>
        <div class="field"><label for="rsvp-guests">${esc(l.guests || "Guests")}</label><select id="rsvp-guests" name="guests">${opts}</select></div>
        <div class="field"><label for="rsvp-message">${esc(l.message || "Message")}</label><textarea id="rsvp-message" name="message"></textarea></div>
        <button class="btn" type="submit">${esc(l.submit || "Send")}</button>
        <div class="rsvp__status" id="rsvp-status" role="status"></div>
      </form>
    </section>`;
  }

  function renderFooter(c) {
    const f = c.footer || {}, e = c.event || {}, cp = c.couple || {};
    const monogram = cp.monogram || `${(cp.bride || "")[0] || ""}&${(cp.groom || "")[0] || ""}`;
    return `<footer class="footer reveal">
      ${img(f.illustration, "footer__illus")}
      ${f.showMonogram !== false ? `<div class="footer__monogram">${esc(monogram)}</div>` : ""}
      ${f.showDate !== false && e.shortDate ? `<div class="footer__date">${esc(e.shortDate)}</div>` : ""}
      ${f.text ? `<div class="footer__text">${esc(f.text)}</div>` : ""}
      <div class="footer__chevron" aria-hidden="true">⌄</div>
    </footer>`;
  }

  /* ---------- Behaviours ---------- */
  function initCountdown() {
    const el = $("#countdown");
    if (!el) return;
    const target = new Date(el.dataset.date).getTime();
    if (Number.isNaN(target)) return;
    const n = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
    const pad = (x) => String(x).padStart(2, "0");
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        $(".countdown__digits", el).hidden = true; $(".countdown__labels", el).hidden = true; $(".countdown__done", el).hidden = false;
        return clearInterval(timer);
      }
      const s = Math.floor(diff / 1000);
      n.d.textContent = pad(Math.floor(s / 86400)); n.h.textContent = pad(Math.floor((s % 86400) / 3600));
      n.m.textContent = pad(Math.floor((s % 3600) / 60)); n.s.textContent = pad(s % 60);
    };
    const timer = setInterval(tick, 1000);
    tick();
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("is-visible"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  function initLightbox(photos) {
    const lb = $("#lightbox"), im = $("#lightbox-img"), cap = $("#lightbox-caption");
    if (!photos.length || !$(".gallery")) return;
    let idx = 0;
    const show = (i) => { idx = (i + photos.length) % photos.length; im.src = photos[idx].src; im.alt = photos[idx].alt || ""; cap.textContent = photos[idx].caption || ""; lb.hidden = false; document.body.style.overflow = "hidden"; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
    document.querySelectorAll(".gallery__item").forEach((fig) => fig.addEventListener("click", () => show(Number(fig.dataset.index))));
    $("#lightbox-close").addEventListener("click", close);
    $("#lightbox-prev").addEventListener("click", () => show(idx - 1));
    $("#lightbox-next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
  }

  function initRsvp(c) {
    const form = $("#rsvp-form");
    if (!form) return;
    const f = c.rsvp?.form || {}, l = f.labels || {};
    const status = $("#rsvp-status");
    const setStatus = (ok, msg) => { status.className = `rsvp__status rsvp__status--${ok ? "ok" : "err"}`; status.textContent = msg; };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim()) { setStatus(false, `${l.name || "Name"}: required`); return; }
      const attending = data.attending === "yes" ? (l.yes || "Yes") : (l.no || "No");
      const summary = `RSVP – ${data.name}\n${l.attending || "Attending"}: ${attending}\n${l.guests || "Guests"}: ${data.guests}\n${l.email || "Email"}: ${data.email || "-"}\n${l.message || "Message"}: ${data.message || "-"}`;
      try {
        if (f.sendVia === "formspree" && f.formspreeEndpoint) {
          const res = await fetch(f.formspreeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...data, _subject: `RSVP – ${data.name}` }) });
          if (!res.ok) throw new Error("formspree");
          form.reset();
        } else if (f.sendVia === "whatsapp" && f.whatsappNumber) {
          window.open(`https://wa.me/${String(f.whatsappNumber).replace(/\D/g, "")}?text=${encodeURIComponent(summary)}`, "_blank", "noopener");
        } else {
          window.location.href = `mailto:${f.email || ""}?subject=${encodeURIComponent(`RSVP – ${data.name}`)}&body=${encodeURIComponent(summary)}`;
        }
        setStatus(true, l.success || "Thank you!");
      } catch (err) { console.error(err); setStatus(false, l.error || "Error"); }
    });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    const app = $("#app");
    try {
      const [c, g] = await Promise.all([loadJSON("content/site.json"), loadJSON("content/gallery.json").catch(() => ({ photos: [] }))]);
      const photos = (g.photos || []).filter((p) => p && p.src);
      document.title = c.site?.title || document.title;
      document.documentElement.lang = c.site?.language || "en";
      $('meta[name="description"]').setAttribute("content", c.site?.description || "");
      if (c.site?.favicon) $('link[rel="icon"]').href = c.site.favicon;
      applyTheme(c.theme);
      app.innerHTML = [renderHero(c), renderDate(c), renderVenue(c), renderAttire(c), renderSchedule(c), renderGallery(c, photos), renderWeddingList(c), renderRsvpForm(c), renderFooter(c)].join("");
      app.removeAttribute("aria-busy");
      initCountdown(); initReveal(); initLightbox(photos); initRsvp(c);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="loading">The site could not be loaded: ${esc(err.message)}</div>`;
    }
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
