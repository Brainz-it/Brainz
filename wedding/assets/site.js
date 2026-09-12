/* Site de mariage paramétrable — rendu 100 % côté client à partir de content/site.json et content/gallery.json */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nl2p = (s) => String(s ?? "").split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const bust = `?t=${Date.now()}`;

  async function loadJSON(path) {
    const res = await fetch(path + bust, { cache: "no-store" });
    if (!res.ok) throw new Error(`Impossible de charger ${path} (${res.status})`);
    return res.json();
  }

  function applyTheme(theme = {}) {
    const r = document.documentElement.style;
    if (theme.colorPrimary) r.setProperty("--primary", theme.colorPrimary);
    if (theme.colorAccent) r.setProperty("--accent", theme.colorAccent);
    if (theme.colorBackground) r.setProperty("--bg", theme.colorBackground);
    if (theme.colorText) r.setProperty("--text", theme.colorText);
    if (theme.fontHeading) r.setProperty("--font-heading", `"${theme.fontHeading}", Georgia, serif`);
    if (theme.fontBody) r.setProperty("--font-body", `"${theme.fontBody}", Arial, sans-serif`);
  }

  function section(id, cls, inner, alt) {
    return `<section id="${esc(id)}" class="section ${alt ? "section--alt" : ""} ${cls || ""}"><div class="container">${inner}</div></section>`;
  }
  function head(title, subtitle) {
    return `<div class="section__head reveal"><h2 class="section__title">${esc(title)}</h2>${subtitle ? `<p class="section__subtitle">${esc(subtitle)}</p>` : ""}</div>`;
  }

  /* ---------- Sections ---------- */
  function renderHero(c) {
    const { couple = {}, event = {} } = c;
    const names = `${esc(couple.bride)} <span class="sep">${esc(couple.separator || "&")}</span> ${esc(couple.groom)}`;
    return `<section id="accueil" class="hero" style="background-image:url('${esc(event.heroImage)}');--hero-overlay:${Number(event.heroOverlayOpacity ?? 0.35)}">
      <div class="hero__inner">
        ${couple.tagline ? `<div class="hero__tagline">${esc(couple.tagline)}</div>` : ""}
        <h1 class="hero__names">${names}</h1>
        <div class="hero__date">${esc(event.dateLabel)}</div>
        ${event.city ? `<div class="hero__city">${esc(event.city)}</div>` : ""}
        ${c.rsvp?.enabled ? `<a class="hero__cta" href="#rsvp">${esc(c.rsvp.title || "RSVP")}</a>` : ""}
      </div>
      <div class="hero__scroll" aria-hidden="true">↓</div>
    </section>`;
  }

  function renderCountdown(c) {
    const cd = c.countdown || {};
    if (!cd.enabled) return "";
    const l = cd.labels || {};
    const item = (k, label) => `<div class="countdown__item"><div class="countdown__num" data-cd="${k}">0</div><div class="countdown__label">${esc(label)}</div></div>`;
    return `<section class="countdown" id="countdown" data-date="${esc(c.event?.date)}">
      <div class="countdown__title">${esc(cd.title || "")}</div>
      <div class="countdown__grid">${item("d", l.days || "jours")}${item("h", l.hours || "heures")}${item("m", l.minutes || "minutes")}${item("s", l.seconds || "secondes")}</div>
      <div class="countdown__done" hidden>${esc(cd.finishedText || "")}</div>
    </section>`;
  }

  function renderInvitation(c) {
    const i = c.invitation || {};
    if (!i.enabled) return "";
    return section("invitation", "", `<div class="invitation reveal">
      <div class="ornament">❧ ❦ ❧</div>
      <h2 class="section__title">${esc(i.title)}</h2>
      <div class="invitation__text" style="margin-top:28px">${nl2p(i.text)}</div>
      ${i.signature ? `<div class="invitation__signature">${esc(i.signature)}</div>` : ""}
    </div>`);
  }

  function renderStory(c) {
    const s = c.story || {};
    if (!s.enabled) return "";
    const paragraphs = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return section("histoire", "", `${head(s.title)}
      <div class="story reveal">
        ${s.image ? `<div class="story__img"><img src="${esc(s.image)}" alt="${esc(s.title)}" loading="lazy"></div>` : ""}
        <div class="story__text">${paragraphs}</div>
      </div>`, true);
  }

  function renderProgram(c) {
    const p = c.program || {};
    if (!p.enabled || !(p.items || []).length) return "";
    const items = p.items.map((it) => `<div class="timeline__item reveal">
        <div class="timeline__dot">${esc(it.icon || "•")}</div>
        <div class="timeline__time">${esc(it.time)}</div>
        <h3 class="timeline__title">${esc(it.title)}</h3>
        <div class="timeline__desc">${esc(it.description)}</div>
      </div>`).join("");
    return section("programme", "", `${head(p.title, p.subtitle)}<div class="timeline">${items}</div>`);
  }

  function renderVenues(c) {
    const v = c.venues || {};
    if (!v.enabled || !(v.items || []).length) return "";
    const items = v.items.map((it) => `<article class="venue reveal">
        ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.place)}" loading="lazy">` : ""}
        <div class="venue__body">
          <div class="venue__kicker">${esc(it.name)}</div>
          <h3 class="venue__name">${esc(it.place)}</h3>
          <p class="venue__addr">${esc(it.address)}</p>
          ${it.time ? `<p class="venue__time">${esc(it.time)}</p>` : ""}
          ${it.mapsUrl ? `<a class="btn btn--outline" href="${esc(it.mapsUrl)}" target="_blank" rel="noopener">Itinéraire</a>` : ""}
        </div>
      </article>`).join("");
    return section("lieux", "", `${head(v.title)}<div class="venues">${items}</div>`, true);
  }

  function renderGallery(c, photos) {
    const g = c.gallery || {};
    if (!g.enabled || !photos.length) return "";
    const items = photos.map((p, i) => `<figure class="gallery__item reveal" data-index="${i}">
        <img src="${esc(p.src)}" alt="${esc(p.alt || "")}" loading="lazy">
      </figure>`).join("");
    return section("galerie", "", `${head(g.title, g.subtitle)}<div class="gallery">${items}</div>`);
  }

  function renderDressCode(c) {
    const d = c.dressCode || {};
    if (!d.enabled) return "";
    const swatches = (d.colors || []).map((col) => `<span class="swatch" style="background:${esc(col)}" title="${esc(col)}"></span>`).join("");
    return section("dresscode", "", `${head(d.title)}<div class="dresscode reveal">
        <div class="dresscode__text">${nl2p(d.text)}</div>
        ${swatches ? `<div class="swatches">${swatches}</div>` : ""}
      </div>`, true);
  }

  function renderInfos(c) {
    const p = c.practicalInfo || {};
    if (!p.enabled || !(p.items || []).length) return "";
    const items = p.items.map((it) => `<div class="info reveal">
        <div class="info__icon">${esc(it.icon || "")}</div>
        <h3 class="info__title">${esc(it.title)}</h3>
        <p>${esc(it.text)}</p>
      </div>`).join("");
    return section("infos", "", `${head(p.title)}<div class="infos">${items}</div>`);
  }

  function renderRsvp(c) {
    const r = c.rsvp || {};
    if (!r.enabled) return "";
    const l = r.labels || {};
    const max = Math.max(1, Number(r.maxGuests || 5));
    const opts = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
    return section("rsvp", "", `${head(r.title, r.subtitle)}
      <form class="rsvp reveal" id="rsvp-form" novalidate>
        <div class="field"><label for="rsvp-name">${esc(l.name || "Nom")}</label><input id="rsvp-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="rsvp-email">${esc(l.email || "Email")}</label><input id="rsvp-email" name="email" type="email" autocomplete="email"></div>
        <div class="field"><label>${esc(l.attending || "Présence")}</label>
          <div class="radios">
            <label><input type="radio" name="attending" value="yes" checked> ${esc(l.yes || "Oui")}</label>
            <label><input type="radio" name="attending" value="no"> ${esc(l.no || "Non")}</label>
          </div>
        </div>
        <div class="field"><label for="rsvp-guests">${esc(l.guests || "Personnes")}</label><select id="rsvp-guests" name="guests">${opts}</select></div>
        <div class="field"><label for="rsvp-message">${esc(l.message || "Message")}</label><textarea id="rsvp-message" name="message"></textarea></div>
        <button class="btn" type="submit">${esc(l.submit || "Envoyer")}</button>
        <div class="rsvp__status" id="rsvp-status" role="status"></div>
      </form>`, true);
  }

  function renderFooter(c) {
    const f = c.footer || {};
    const names = `${c.couple?.bride || ""} ${c.couple?.separator || "&"} ${c.couple?.groom || ""}`;
    return `<div class="footer__names">${esc(names)}</div>
      ${f.showHashtag && c.site?.hashtag ? `<div class="footer__hashtag">${esc(c.site.hashtag)}</div>` : ""}
      ${c.event?.dateLabel ? `<p>${esc(c.event.dateLabel)}${c.event.city ? " · " + esc(c.event.city) : ""}</p>` : ""}
      ${f.text ? `<p>${esc(f.text)}</p>` : ""}`;
  }

  /* ---------- Behaviours ---------- */
  function initNav(c) {
    const nav = $("#nav");
    $("#nav-brand").textContent = `${c.couple?.bride || ""} ${c.couple?.separator || "&"} ${c.couple?.groom || ""}`;
    const links = (c.navigation || []).filter((n) => document.getElementById(n.anchor));
    $("#nav-links").innerHTML = links.map((n) => `<a href="#${esc(n.anchor)}">${esc(n.label)}</a>`).join("");
    const toggle = $("#nav-toggle");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("nav--open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $("#nav-links").addEventListener("click", () => nav.classList.remove("nav--open"));
    const onScroll = () => nav.classList.toggle("nav--solid", window.scrollY > 60 || nav.classList.contains("nav--open"));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initCountdown() {
    const el = $("#countdown");
    if (!el) return;
    const target = new Date(el.dataset.date).getTime();
    if (Number.isNaN(target)) return;
    const nums = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        $(".countdown__grid", el).hidden = true;
        $(".countdown__done", el).hidden = false;
        return clearInterval(timer);
      }
      const s = Math.floor(diff / 1000);
      nums.d.textContent = Math.floor(s / 86400);
      nums.h.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
      nums.m.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      nums.s.textContent = String(s % 60).padStart(2, "0");
    };
    const timer = setInterval(tick, 1000);
    tick();
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("is-visible"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  function initLightbox(photos) {
    const lb = $("#lightbox"), img = $("#lightbox-img"), cap = $("#lightbox-caption");
    if (!photos.length) return;
    let idx = 0;
    const show = (i) => {
      idx = (i + photos.length) % photos.length;
      img.src = photos[idx].src;
      img.alt = photos[idx].alt || "";
      cap.textContent = photos[idx].caption || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
    document.querySelectorAll(".gallery__item").forEach((fig) => fig.addEventListener("click", () => show(Number(fig.dataset.index))));
    $("#lightbox-close").addEventListener("click", close);
    $("#lightbox-prev").addEventListener("click", () => show(idx - 1));
    $("#lightbox-next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  function initRsvp(c) {
    const form = $("#rsvp-form");
    if (!form) return;
    const r = c.rsvp || {}, l = r.labels || {};
    const status = $("#rsvp-status");
    const setStatus = (ok, msg) => { status.className = `rsvp__status rsvp__status--${ok ? "ok" : "err"}`; status.textContent = msg; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim()) { setStatus(false, l.name ? `${l.name} : champ obligatoire` : "Nom obligatoire"); return; }
      const attending = data.attending === "yes" ? (l.yes || "Oui") : (l.no || "Non");
      const summary = `RSVP – ${data.name}\n${l.attending || "Présence"} : ${attending}\n${l.guests || "Personnes"} : ${data.guests}\n${l.email || "Email"} : ${data.email || "-"}\n${l.message || "Message"} : ${data.message || "-"}`;

      try {
        if (r.mode === "formspree" && r.formspreeEndpoint) {
          const res = await fetch(r.formspreeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...data, _subject: `RSVP – ${data.name}` }) });
          if (!res.ok) throw new Error("formspree");
          form.reset();
          setStatus(true, l.success || "Merci !");
        } else if (r.mode === "whatsapp" && r.whatsappNumber) {
          window.open(`https://wa.me/${String(r.whatsappNumber).replace(/\D/g, "")}?text=${encodeURIComponent(summary)}`, "_blank", "noopener");
          setStatus(true, l.success || "Merci !");
        } else {
          const to = r.email || "";
          window.location.href = `mailto:${to}?subject=${encodeURIComponent(`RSVP – ${data.name}`)}&body=${encodeURIComponent(summary)}`;
          setStatus(true, l.success || "Merci !");
        }
      } catch (err) {
        console.error(err);
        setStatus(false, l.error || "Erreur");
      }
    });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    const app = $("#app");
    try {
      const [c, g] = await Promise.all([loadJSON("content/site.json"), loadJSON("content/gallery.json").catch(() => ({ photos: [] }))]);
      const photos = (g.photos || []).filter((p) => p && p.src);

      document.title = c.site?.title || document.title;
      document.documentElement.lang = c.site?.language || "fr";
      $('meta[name="description"]').setAttribute("content", c.site?.description || "");
      if (c.site?.favicon) $('link[rel="icon"]').href = c.site.favicon;
      applyTheme(c.theme);

      app.innerHTML = [
        renderHero(c), renderCountdown(c), renderInvitation(c), renderStory(c), renderProgram(c),
        renderVenues(c), renderGallery(c, photos), renderDressCode(c), renderInfos(c), renderRsvp(c),
      ].join("");
      $("#footer").innerHTML = renderFooter(c);
      app.removeAttribute("aria-busy");

      initNav(c);
      initCountdown();
      initReveal();
      initLightbox(photos);
      initRsvp(c);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="loading">Le site n'a pas pu être chargé : ${esc(err.message)}</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
