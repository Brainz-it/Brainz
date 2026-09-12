/* V10 · Villa — faire-part « éditorial » : enveloppe brodée à ruban, photo plein écran, menu,
   sections numérotées sur lin brodé, RSVP par invité, FAQ. */
window.WEDDING_THEME = (function () {
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var audio = null, musicOn = false;
  function fmtDate(c) { var d = new Date(c.event.date); if (isNaN(d)) return { dd: "", mm: "", yyyy: "", long: c.event.dateLabel || "", dow: "" };
    var pad = function (n) { return String(n).padStart(2, "0"); }; var lang = (c.villa && c.villa.lang) || c.site.language || "fr";
    return { dd: pad(d.getDate()), mm: pad(d.getMonth() + 1), yyyy: d.getFullYear(), long: d.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" }), dow: d.toLocaleDateString(lang, { weekday: "long" }) }; }
  function maps(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }
  function corners() { return '<i class="t10-c t10-c--tl"></i><i class="t10-c t10-c--tr"></i><i class="t10-c t10-c--bl"></i><i class="t10-c t10-c--br"></i>'; }

  function build(c, h) {
    var v = c.villa || {}, cp = c.couple, m = v.menu || {}, dt = fmtDate(c), ve = v.venue || {}, pr = v.program || {}, dr = v.dress || {}, gi = v.gifts || {}, rs = v.rsvp || {}, fq = v.faq || {}, ft = v.footer || {}, cd = v.countdown || {};
    var mono = cp.monogram || (cp.bride.charAt(0) + "&" + cp.groom.charAt(0));
    var icon = function (n) { return '<img src="assets/themes/v10/art/icon-' + esc(n || "glass") + '.svg" alt="">'; };
    var html = ''
      + '<header class="t10-top"><a class="t10-brand" href="#accueil">' + esc(mono) + '</a><button class="t10-burger" id="t10-burger" aria-label="Menu"><span></span><span></span></button></header>'
      + '<nav class="t10-menu" id="t10-menu"><a href="#lieu">' + esc(m.venue) + '</a><a href="#programme">' + esc(m.program) + '</a><a href="#dresscode">' + esc(m.dress) + '</a><a href="#cadeaux">' + esc(m.gifts) + '</a><a href="#rsvp">' + esc(m.rsvp) + '</a><a href="#faq">' + esc(m.faq) + '</a></nav>'
      + '<section id="accueil" class="t10-hero" style="background-image:url(assets/themes/v10/photos/hero.jpg)"><div class="t10-hero-in">'
      + '  <h1 class="t10-names">' + esc(cp.bride).toUpperCase() + '<br><em>' + esc(cp.conjunction === "and" ? "&" : (cp.conjunction || "&")) + '</em> ' + esc(cp.groom).toUpperCase() + '</h1>'
      + '  <p class="t10-tag">' + esc(v.tagline || "") + '</p></div>'
      + '  <div class="t10-hero-card"><span class="t10-place">' + esc(c.event.city || "") + '</span><span class="t10-hero-date"><b>' + dt.dd + '.' + dt.mm + '</b><i></i><b>' + dt.yyyy + '</b></span><a class="t10-scroll" href="#compte">' + esc(v.scrollLabel || "Défiler") + ' <span>↓</span></a></div>'
      + '</section>'
      + '<section id="compte" class="t10-sec t10-count">' + corners() + '<div class="t10-lace"></div><div class="t10-kicker">' + esc(cd.kicker || "") + '</div><div class="t10-script">' + esc(cd.title || "") + '</div>'
      + '  <div class="t10-cd"><div><b id="cd-days">00</b><small>' + esc((cd.labels || c.countdown.labels).days) + '</small></div><div><b id="cd-hours">00</b><small>' + esc((cd.labels || c.countdown.labels).hours) + '</small></div><div><b id="cd-mins">00</b><small>' + esc((cd.labels || c.countdown.labels).minutes) + '</small></div><div><b id="cd-secs">00</b><small>' + esc((cd.labels || c.countdown.labels).seconds) + '</small></div></div>'
      + '  <div class="t10-kicker">' + esc(cd.dateLabel || "Date") + '</div><div class="t10-bigdate">' + esc(dt.long) + '</div><div class="t10-dow">' + esc(dt.dow) + '</div></section>'
      + '<section id="lieu" class="t10-sec">' + corners() + '<div class="t10-num">01</div><h2 class="t10-h2">' + esc(ve.title || "") + '</h2>'
      + '  <div class="t10-place-block"><div class="t10-kicker">' + esc(ve.ceremonyLabel) + '</div><h3>' + esc(ve.ceremonyName) + '</h3><p>' + esc(ve.ceremonyTime) + ' · ' + esc(ve.ceremonyAddress) + '</p><a class="t10-link" target="_blank" rel="noopener" href="' + maps(ve.ceremonyName + " " + ve.ceremonyAddress) + '">' + esc(ve.mapsLabel) + '</a></div>'
      + '  <div class="t10-place-block"><div class="t10-kicker">' + esc(ve.receptionLabel) + '</div><h3>' + esc(ve.receptionName) + '</h3><p>' + esc(ve.receptionTime) + ' · ' + esc(ve.receptionAddress) + '</p><a class="t10-link" target="_blank" rel="noopener" href="' + maps(ve.receptionName + " " + ve.receptionAddress) + '">' + esc(ve.mapsLabel) + '</a></div>'
      + '  <div class="t10-travel">' + (ve.travel || []).map(function (t) { return '<div><div class="t10-kicker">' + esc(t.label) + '</div><p>' + esc(t.text) + '</p></div>'; }).join("") + '</div></section>'
      + '<section id="programme" class="t10-sec">' + corners() + '<div class="t10-num">02</div><div class="t10-kicker">' + esc(pr.kicker || "") + '</div><h2 class="t10-h2">' + esc(pr.title || "") + '</h2><div class="t10-lace t10-lace--mid"></div>'
      + '  <div class="t10-tl">' + (pr.items || []).map(function (it) { return '<div class="t10-ev"><span class="t10-ev-icon">' + icon(it.icon) + '</span><b>' + esc(it.time) + '</b><h3>' + esc(it.title) + '</h3><p>' + esc(it.text || "") + '</p></div>'; }).join("") + '</div></section>'
      + '<section id="dresscode" class="t10-sec t10-sec--band">' + corners() + '<div class="t10-num">03</div><h2 class="t10-h2">' + esc(dr.title || "") + '</h2><div class="t10-headline">' + esc(dr.headline || "") + '</div><p class="t10-p">' + esc(dr.text || "") + '</p>'
      + '  <div class="t10-colors">' + (dr.colors || []).map(function (col) { return '<span style="background:' + esc(col) + '"></span>'; }).join("") + '</div></section>'
      + '<section id="cadeaux" class="t10-sec">' + corners() + '<div class="t10-num">04</div><h2 class="t10-h2">' + esc(gi.title || "") + '</h2><div class="t10-headline">' + esc(gi.headline || "") + '</div><p class="t10-p">' + esc(gi.text || "") + '</p>'
      + '  <button class="t10-btn" data-open-modal="bank" data-bank="abroad">' + esc(gi.button || "") + '</button><img class="t10-emblem" src="assets/themes/v10/art/emblem.svg" alt=""></section>'
      + '<section id="rsvp" class="t10-sec">' + corners() + '<div class="t10-num">05</div><h2 class="t10-h2">' + esc(rs.title || "") + '</h2><div class="t10-kicker">' + esc(rs.kicker || "") + '</div><p class="t10-p">' + esc(rs.text || "") + '</p>'
      + '  <form class="t10-form" id="t10-form"><label class="t10-field"><span>' + esc(rs.familyLabel) + '</span><input name="family" required></label>'
      + '  <div id="t10-guests"></div><button type="button" class="t10-add" id="t10-add">' + esc(rs.addGuest) + '</button>'
      + '  <label class="t10-check"><input type="checkbox" name="children"> ' + esc(rs.children) + '</label>'
      + '  <label class="t10-field"><span>' + esc(rs.message) + '</span><textarea name="word" rows="3"></textarea></label>'
      + '  <p class="t10-privacy">' + esc(rs.privacy || "") + '</p><button class="t10-btn t10-btn--dark" type="submit">' + esc(rs.send) + '</button><p class="t10-status" id="t10-status"></p></form></section>'
      + '<section id="faq" class="t10-sec">' + corners() + '<div class="t10-num">06</div><h2 class="t10-h2">' + esc(fq.title || "") + '</h2>'
      + '  <div class="t10-faq">' + (fq.items || []).map(function (it) { return '<details><summary>' + esc(it.q) + '</summary><p>' + esc(it.a) + '</p></details>'; }).join("") + '</div></section>'
      + '<footer class="t10-footer"><div class="t10-foot-mono">' + esc(mono) + '</div><div class="t10-script">' + esc(ft.withLove || "") + '</div><div class="t10-foot-names">' + esc(cp.bride) + ' &amp; ' + esc(cp.groom) + '</div><div class="t10-foot-date">' + dt.dd + ' · ' + dt.mm + ' · ' + dt.yyyy + '</div>'
      + '  <div class="t10-kicker">' + esc(ft.contactKicker || "") + '</div><p class="t10-p">' + esc(ft.contactText || "") + '</p>' + (c.site.creditsPage ? '<a class="photo-credit" href="' + esc(c.site.creditsPage) + '">Crédits photos & musique</a>' : "") + '</footer>'
      + '<nav class="t10-bottom"><a href="#accueil">' + esc(m.home) + '</a><a href="#lieu">' + esc(m.venue) + '</a><a href="#cadeaux">' + esc(m.giftsShort || m.gifts) + '</a><a href="#rsvp">RSVP</a></nav>';
    var page = h.$(".page"); page.innerHTML = html;
    h.hide("#scroll-cue");
    // menu
    var burger = h.$("#t10-burger"), menu = h.$("#t10-menu");
    burger.addEventListener("click", function () { document.documentElement.classList.toggle("t10-menu-open"); });
    h.$$("#t10-menu a, .t10-bottom a, .t10-scroll").forEach(function (a) { a.addEventListener("click", function () { document.documentElement.classList.remove("t10-menu-open"); }); });
    // invités
    var guests = h.$("#t10-guests"), n = 0;
    function addGuest(name) {
      n++;
      var row = document.createElement("div"); row.className = "t10-guest";
      row.innerHTML = '<input name="guest' + n + '" placeholder="' + esc(rs.guestLabel) + '" value="' + esc(name || "") + '" required>'
        + '<div class="t10-yn"><label><input type="radio" name="presence' + n + '" value="yes" checked><span>' + esc(rs.yes) + '</span></label><label><input type="radio" name="presence' + n + '" value="no"><span>' + esc(rs.no) + '</span></label></div>'
        + '<input name="diet' + n + '" placeholder="' + esc(rs.diet) + ' · ' + esc(rs.dietPlaceholder || "") + '">';
      guests.appendChild(row);
    }
    addGuest(""); h.$("#t10-add").addEventListener("click", function () { addGuest(""); });
    var form = h.$("#t10-form"), status = h.$("#t10-status"), ep = (c.rsvp || {}).googleSheetEndpoint, usable = ep && ep.indexOf("XXXX") === -1;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = Object.fromEntries(new FormData(form).entries());
      var rows = []; for (var i = 1; i <= n; i++) if (d["guest" + i] && d["guest" + i].trim()) rows.push({ name: d["guest" + i].trim(), presence: d["presence" + i] === "yes" ? rs.yes : rs.no, diet: d["diet" + i] || "" });
      if (!d.family.trim() || !rows.length) return;
      status.textContent = "…";
      var payload = { name: d.family.trim() + " — " + rows.map(function (r) { return r.name; }).join(", "), presence: rows.map(function (r) { return r.name + ": " + r.presence; }).join(" / "), accompanied: d.children ? rs.children : "", plusOne: rows.map(function (r) { return r.diet; }).filter(Boolean).join(" / "), word: d.word || "" };
      var done = function () { status.textContent = rs.thanks || "Merci"; form.reset(); guests.innerHTML = ""; n = 0; addGuest(""); };
      if (usable) fetch(ep, { method: "POST", mode: "no-cors", body: new URLSearchParams(payload) }).then(done).catch(function () { status.textContent = rs.error || "Erreur"; });
      else done();
    });
    // musique
    if (v.music && v.music.src) {
      audio = new Audio(v.music.src); audio.loop = true;
      var mb = document.createElement("button"); mb.className = "t10-music"; mb.type = "button"; mb.setAttribute("aria-label", "Musique"); mb.innerHTML = "<span></span><span></span><span></span>";
      mb.addEventListener("click", function () { if (musicOn) { audio.pause(); musicOn = false; mb.classList.remove("on"); } else { audio.play().catch(function () {}); musicOn = true; mb.classList.add("on"); } });
      document.body.appendChild(mb);
    }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.1 });
    h.$$(".t10-sec").forEach(function (s) { s.classList.add("reveal"); io.observe(s); });
  }

  return {
    name: "Villa",
    pagedScroll: false,
    intro: function (ctx) {
      var c = ctx.config, v = c.villa || {}, enter = ctx.enter;
      enter.innerHTML = '<span class="t10-env"><span class="t10-env-back"></span><span class="t10-env-names">' + ctx.escapeHtml(c.couple.bride + " & " + c.couple.groom) + '</span><span class="t10-env-flap"></span><span class="t10-env-front"></span><img class="t10-bow" src="assets/themes/v10/art/bow.svg" alt="" aria-hidden="true"></span><span class="t10-light"></span><span class="t10-tap">' + ctx.escapeHtml(v.tapLabel || "Touchez pour ouvrir") + '</span>';
      var done = false;
      enter.addEventListener("click", function (e) {
        e.preventDefault(); if (done) return; done = true;
        enter.classList.add("t10-open");
        if (audio && (v.music || {}).autoplay !== false) audio.play().then(function () { musicOn = true; var mb = document.querySelector(".t10-music"); if (mb) mb.classList.add("on"); }).catch(function () {});
        setTimeout(function () { enter.classList.add("t10-bloom"); }, 1100);
        setTimeout(ctx.reveal, 1900);
      });
    },
    decorate: function (c, h) { build(c, h); }
  };
})();
