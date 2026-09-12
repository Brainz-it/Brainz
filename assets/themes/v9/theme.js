/* V9 · Faire-part (inspiré des faire-part en ligne « minimalism dark red ») :
   couverture avec carte, enveloppe et photo, cartes bordeaux, calendrier, galerie,
   dress code, programme illustré, livre d'or (Google Sheets), cagnotte, musique. */
window.WEDDING_THEME = (function () {
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var audio = null, musicOn = false;

  function toggleMusic(btn) {
    if (!audio) return;
    if (musicOn) { audio.pause(); musicOn = false; btn.classList.remove("on"); }
    else { audio.play().catch(function () {}); musicOn = true; btn.classList.add("on"); }
  }

  function calendar(dateStr, lang) {
    var d = new Date(dateStr); if (isNaN(d)) return "";
    var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    var first = new Date(y, m, 1), start = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    var monthName = d.toLocaleDateString(lang, { month: "long", year: "numeric" });
    var head = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(function (x) { return "<span class='t9-dow'>" + x + "</span>"; }).join("");
    var cells = ""; for (var i = 0; i < start; i++) cells += "<span></span>";
    for (var n = 1; n <= days; n++) cells += "<span class='" + (n === day ? "t9-day t9-day--on" : "t9-day") + "'>" + n + "</span>";
    return "<div class='t9-cal'><div class='t9-cal-title'>" + esc(monthName) + "</div><div class='t9-cal-grid'>" + head + cells + "</div></div>";
  }

  function ics(c) {
    var d = new Date(c.event.date); if (isNaN(d)) return "#";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var fmt = function (x) { return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + "T" + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + "00Z"; };
    var end = new Date(d.getTime() + 6 * 3600 * 1000);
    var title = "Wedding of " + c.couple.bride + " & " + c.couple.groom;
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wedding//FR", "BEGIN:VEVENT", "DTSTART:" + fmt(d), "DTEND:" + fmt(end), "SUMMARY:" + title, "LOCATION:" + ((c.invitation.reception || {}).address || c.event.city || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
  }

  function dateParts(c) {
    var d = new Date(c.event.date), lang = c.site.language || "en";
    if (isNaN(d)) return { dow: "", day: "", month: "", year: "" };
    return { dow: d.toLocaleDateString(lang, { weekday: "long" }), day: d.getDate(), month: d.toLocaleDateString(lang, { month: "long" }), year: d.getFullYear() };
  }

  function bigDate(c, time) {
    var p = dateParts(c);
    return "<div class='t9-bigdate'><div class='t9-bd-side'><span>" + esc(p.dow) + "</span>" + (time ? "<span>" + esc(time) + "</span>" : "") + "</div><div class='t9-bd-day'>" + esc(p.day) + "</div><div class='t9-bd-side'><span>" + esc(p.month) + "</span><span>" + esc(p.year) + "</span></div></div>";
  }

  function build(c, h, photos) {
    var inv = c.invitation || {}, cp = c.couple, ev = c.event, f = inv.families || {}, gf = f.groom || {}, bf = f.bride || {}, rc = inv.reception || {}, ce = inv.ceremony || {}, dc = inv.dressCode || {}, gb = inv.guestbook || {}, gift = inv.gift || {};
    var monogram = cp.monogram || (cp.bride.charAt(0) + "&" + cp.groom.charAt(0));
    var icons = inv.scheduleIcons || [];
    var names = esc(cp.bride) + "<span class='t9-amp'>" + esc(cp.conjunction || "&") + "</span>" + esc(cp.groom);
    var html = ''
      + '<section class="t9-sec t9-save reveal"><div class="t9-kicker">' + esc(inv.kicker || "Save the date") + '</div>'
      + '  <div class="t9-envelope"><img class="t9-roses t9-roses--l" src="assets/themes/v9/art/roses.webp" alt="" aria-hidden="true"><div class="t9-photo"><img src="' + esc(c.hero.photo) + '" alt="' + esc(cp.bride + " & " + cp.groom) + '"></div><div class="t9-env-back"></div><div class="t9-env-front"></div><img class="t9-seal" src="assets/themes/v9/art/seal.svg" alt="" aria-hidden="true"><img class="t9-roses t9-roses--r" src="assets/themes/v9/art/roses.webp" alt="" aria-hidden="true"></div>'
      + '  <h1 class="t9-names">' + names + '</h1></section>'
      + '<section class="t9-sec reveal"><div class="t9-card">'
      + '  <div class="t9-card-title">' + esc(f.title || "Ceremony info") + '</div>'
      + '  <div class="t9-families"><div><small>' + esc(gf.prefix || "") + '</small><b>' + esc(gf.father || "") + '</b><b>' + esc(gf.mother || "") + '</b><em>' + esc(gf.city || "") + '</em></div><div><small>' + esc(bf.prefix || "") + '</small><b>' + esc(bf.father || "") + '</b><b>' + esc(bf.mother || "") + '</b><em>' + esc(bf.city || "") + '</em></div></div>'
      + '  <p class="t9-announce">' + esc(inv.announce || "").replace(/\n/g, "<br>") + '</p>'
      + '  <div class="t9-fullname">' + esc(inv.groomFullName || cp.groom) + '<small>' + esc(inv.groomLabel || "The groom") + '</small></div><div class="t9-amp2">' + esc(cp.conjunction || "&") + '</div><div class="t9-fullname">' + esc(inv.brideFullName || cp.bride) + '<small>' + esc(inv.brideLabel || "The bride") + '</small></div>'
      + '  <div class="t9-ceremony"><span>' + esc(ce.label || "Wedding ceremony at") + '</span><b>' + esc(ce.venue || "") + '</b><span>' + esc(ce.time ? "at " + ce.time : "") + '</span></div>'
      + bigDate(c, "") + '</div></section>'
      + '<section class="t9-sec reveal"><div class="t9-title">' + esc((inv.gallery || {}).title || "Photo gallery") + '</div><div class="t9-gallery" id="t9-gallery"></div></section>'
      + '<section class="t9-sec reveal"><div class="t9-card">'
      + '  <div class="t9-card-title">' + esc(rc.title || "Reception info") + '</div><p class="t9-announce">' + esc(rc.intro || "") + '</p>'
      + bigDate(c, rc.time || "")
      + '  <div class="t9-times"><div><small>' + esc(rc.welcomeLabel || "Welcome") + '</small><b>' + esc(rc.welcomeTime || "") + '</b></div><div><small>' + esc(rc.receptionLabel || "Reception") + '</small><b>' + esc(rc.time || "") + '</b></div></div>'
      + calendar(ev.date, c.site.language || "en")
      + '  <a class="t9-link" href="' + ics(c) + '" download="wedding.ics">' + esc(rc.addToCalendar || "Add to calendar") + '</a>'
      + '  <button class="t9-btn t9-btn--light" data-open-modal="rsvp">' + esc(rc.confirm || "Confirm attendance") + '</button></div></section>'
      + '<section class="t9-sec reveal"><div class="t9-title">' + esc(rc.venueTitle || "Wedding reception venue") + '</div><p class="t9-addr"><b>' + esc(rc.venue || "") + '</b><br>' + esc(rc.address || ev.city || "") + '</p><button class="t9-outline" data-open-modal="loc">⌖ ' + esc(c.venue.buttonLabel || "Directions") + '</button></section>'
      + '<section class="t9-sec reveal"><div class="t9-title">' + esc(dc.title || "Dress code") + '</div><p class="t9-addr">' + esc(dc.text || "") + '</p><div class="t9-swatches">' + (dc.colors || []).map(function (col) { return "<i style='background:" + esc(col) + "'></i>"; }).join("") + '</div></section>'
      + '<section class="t9-sec reveal"><div class="t9-card"><div class="t9-card-title">' + esc(inv.scheduleTitle || c.schedule.title) + '</div><div class="t9-timeline">'
      + (c.schedule.items || []).filter(function (it) { return it.title; }).map(function (it, i) { return "<div class='t9-tl'><span class='t9-tl-time'>" + esc(it.time) + "</span><span class='t9-tl-dot'>" + esc(icons[i % icons.length] || "•") + "</span><span class='t9-tl-name'>" + esc(it.title) + "</span></div>"; }).join("")
      + '</div></div></section>'
      + '<section class="t9-sec reveal"><div class="t9-paper"><div class="t9-title">' + esc(gb.title || "Guestbook") + '</div><form id="t9-gb-form"><input name="name" placeholder="' + esc(gb.namePlaceholder || "Your name") + '" required><textarea name="wish" rows="2" placeholder="' + esc(gb.wishPlaceholder || "Your wishes") + '" required></textarea><button class="t9-btn" type="submit">✧ ' + esc(gb.send || "Send wishes") + '</button><p class="t9-gb-status" id="t9-gb-status"></p></form></div><div class="t9-wishes" id="t9-wishes"><p class="t9-muted">' + esc(gb.empty || "") + '</p></div></section>'
      + '<section class="t9-sec reveal t9-giftsec"><div class="t9-title">' + esc(gift.title || "Gift box") + '</div><button class="t9-gift" data-open-modal="gifts" data-bank="morocco"><img src="assets/themes/v9/art/gift.webp" alt=""><span>' + esc(gift.tap || "Tap to open") + '</span></button><p class="t9-addr">' + esc(gift.text || "") + '</p></section>'
      + '<footer class="t9-footer"><div class="t9-mono">' + esc(monogram) + '</div><div class="t9-date">' + esc(ev.shortDate || "") + '</div>' + (c.site.creditsPage ? '<a class="photo-credit" href="' + esc(c.site.creditsPage) + '">Crédits photos & musique</a>' : "") + '</footer>';
    var page = h.$(".page");
    page.innerHTML = '<img class="t9-castle" src="assets/themes/v9/art/riad.webp" alt="" aria-hidden="true">' + html;
    h.hide("#scroll-cue");
    // apparition progressive (les sections sont créées après l'observateur du site)
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.08 });
    h.$$(".t9-sec.reveal").forEach(function (el) { io.observe(el); });
    // seal monogram
    var seal = h.$(".t9-seal"); if (seal) seal.addEventListener("load", function () {}, { once: true });
    // galerie
    var g = h.$("#t9-gallery");
    g.innerHTML = photos.map(function (p) { return "<figure><img src='" + esc(p.src) + "' alt='" + esc(p.alt || "") + "' loading='lazy'></figure>"; }).join("");
    // musique
    if (inv.music && inv.music.src) {
      audio = new Audio(inv.music.src); audio.loop = true; audio.preload = "auto";
      var mb = document.createElement("button"); mb.className = "t9-music"; mb.type = "button"; mb.setAttribute("aria-label", "Music"); mb.innerHTML = "♪";
      mb.addEventListener("click", function () { toggleMusic(mb); });
      document.body.appendChild(mb);
    }
    // livre d'or
    initGuestbook(c, h);
  }

  function initGuestbook(c, h) {
    var gb = (c.invitation || {}).guestbook || {}, ep = (c.rsvp || {}).googleSheetEndpoint, list = h.$("#t9-wishes"), form = h.$("#t9-gb-form"), status = h.$("#t9-gb-status");
    var usable = ep && ep.indexOf("XXXX") === -1;
    function render(items) {
      if (!items.length) { list.innerHTML = "<p class='t9-muted'>" + esc(gb.empty || "") + "</p>"; return; }
      list.innerHTML = items.map(function (w) { return "<div class='t9-wish'><b>" + esc(w.name) + "</b><time>" + esc(w.date || "") + "</time><p>" + esc(w.wish) + "</p></div>"; }).join("");
    }
    function load() {
      if (!usable) return;
      fetch(ep + "?action=wishes&t=" + Date.now()).then(function (r) { return r.json(); }).then(function (d) { if (d && d.wishes) render(d.wishes); }).catch(function () {});
    }
    load();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      if (!data.name.trim() || !data.wish.trim()) return;
      status.textContent = "…";
      var entry = { name: data.name.trim(), wish: data.wish.trim(), date: new Date().toLocaleDateString(c.site.language || "en") };
      if (usable) {
        fetch(ep, { method: "POST", mode: "no-cors", body: new URLSearchParams({ type: "wish", name: entry.name, wish: entry.wish }) }).then(function () { status.textContent = gb.thanks || "Thank you!"; form.reset(); setTimeout(load, 1500); }).catch(function () { status.textContent = "Error"; });
      } else { status.textContent = gb.thanks || "Thank you!"; form.reset(); }
      var cur = list.querySelector(".t9-wish") ? Array.prototype.slice.call(list.querySelectorAll(".t9-wish")).map(function (el) { return { name: el.querySelector("b").textContent, date: el.querySelector("time").textContent, wish: el.querySelector("p").textContent }; }) : [];
      render([entry].concat(cur));
    });
  }

  return {
    name: "Faire-part",
    pagedScroll: false,
    intro: function (ctx) {
      var c = ctx.config, inv = c.invitation || {}, enter = ctx.enter;
      enter.innerHTML = '<span class="t9-hearts"></span><span class="t9-cover"><img class="t9-cover-roses t9-cover-roses--l" src="assets/themes/v9/art/roses.webp" alt="" aria-hidden="true"><img class="t9-cover-roses t9-cover-roses--r" src="assets/themes/v9/art/roses.webp" alt="" aria-hidden="true">'
        + '<span class="t9-heart">♥</span><span class="t9-cover-names">' + ctx.escapeHtml(c.couple.bride) + '<i>' + ctx.escapeHtml(c.couple.conjunction || "&") + '</i>' + ctx.escapeHtml(c.couple.groom) + '</span>'
        + '<img class="t9-orn" src="assets/themes/v9/art/ornament.svg" alt="" aria-hidden="true"><span class="t9-cover-date">' + ctx.escapeHtml(c.event.dateLabel || "") + '</span><span class="t9-cover-invites">' + ctx.escapeHtml(inv.coverInvites || "Cordially invites") + '</span>'
        + '<span class="t9-open">' + ctx.escapeHtml(inv.openLabel || "Open") + '</span></span>';
      var done = false;
      enter.addEventListener("click", function (e) {
        e.preventDefault(); if (done) return; done = true;
        enter.classList.add("t9-opening");
        if (audio && inv.music && inv.music.autoplay !== false) { audio.play().then(function () { musicOn = true; var mb = document.querySelector(".t9-music"); if (mb) mb.classList.add("on"); }).catch(function () {}); }
        setTimeout(ctx.reveal, 700);
      });
    },
    decorate: function (c, h) {
      var self = this;
      fetch("content/gallery.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : { photos: [] }; }).catch(function () { return { photos: [] }; })
        .then(function (g) { build(c, h, (g.photos || []).filter(function (p) { return p && p.src; })); document.dispatchEvent(new Event("t9:built")); });
      // construction synchrone minimale pour que le reveal observer ait des cibles
      h.$(".page").innerHTML = "";
    }
  };
})();
