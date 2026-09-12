/* Site de mariage paramétrable — le contenu vient de content/site.json.
   Le comportement (intro rideau, défilement par page, modales) reprend celui du site original. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  /* ── 1. Contenu ─────────────────────────────────────────── */
  function applyTheme(t) {
    t = t || {};
    var r = document.documentElement.style;
    var map = { colorRed: "--red", colorCharcoal: "--charcoal", colorGrey: "--grey", colorTaupe: "--taupe", colorCream: "--cream", colorPaper: "--paper", colorCreamLow: "--cream-low" };
    Object.keys(map).forEach(function (k) { if (t[k]) r.setProperty(map[k], t[k]); });
    if (t.fontSerif) { var serif = '"' + t.fontSerif + '",Didot,"Bodoni 72",Georgia,serif'; r.setProperty("--serif", serif); r.setProperty("--apparel", serif); r.setProperty("--button-serif", serif); }
    if (t.fontSans) r.setProperty("--sans", '"' + t.fontSans + '",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif');
    if (t.fontScript) r.setProperty("--script", '"' + t.fontScript + '",cursive');
  }

  function fillText(c) {
    $$("[data-t]").forEach(function (el) {
      var v = get(c, el.dataset.t);
      if (v != null) el.textContent = v;
    });
  }

  function setMeta(c) {
    var s = c.site || {};
    document.title = s.title || document.title;
    document.documentElement.lang = s.language || "en";
    var set = function (sel, val) { var m = $(sel); if (m && val != null) m.setAttribute("content", val); };
    set('meta[name="description"]', s.description);
    set('meta[property="og:title"]', s.title);
    set('meta[property="og:description"]', s.description);
    if (s.ogImage) set('meta[property="og:image"]', new URL(s.ogImage, location.href).href);
    if (s.favicon) $('link[rel="icon"]').href = s.favicon;
  }

  function renderContent(c) {
    var cp = c.couple || {}, hero = c.hero || {}, venue = c.venue || {}, attire = c.attire || {}, sched = c.schedule || {}, wl = c.weddingList || {}, foot = c.footer || {};

    // Sections désactivées : retirées du DOM avant que le défilement par page ne compte les panneaux
    var enabled = { venue: venue.enabled !== false, attire: attire.enabled !== false, schedule: sched.enabled !== false, weddingList: wl.enabled !== false };
    Object.keys(enabled).forEach(function (k) {
      if (!enabled[k]) $$('[data-section="' + k + '"]').forEach(function (el) { el.remove(); });
    });
    if (c.rsvp && c.rsvp.enabled === false) $$('[data-open-modal="rsvp"]').forEach(function (el) { el.remove(); });

    var photo = $("#hero-photo");
    if (photo) { photo.src = hero.photo || ""; photo.alt = (cp.bride || "") + " " + (cp.conjunction || "&") + " " + (cp.groom || ""); }

    // Titres : la première lettre est isolée comme dans l'original (glyph-fix)
    $$(".section-title[data-t]").forEach(function (h) {
      var t = h.textContent;
      if (t) h.innerHTML = '<span class="glyph-fix">' + escapeHtml(t.charAt(0)) + "</span>" + escapeHtml(t.slice(1));
    });

    var va = $("#venue-art"); if (va) va.src = venue.illustration || "";
    var vt = $("#venue-text");
    if (vt) vt.innerHTML = String(venue.text || "").split(/\n+/).map(function (l) { return "<span>" + escapeHtml(l) + "</span>"; }).join("");

    var row = $("#attire-row");
    if (row) {
      var defaults = [{ left: "8%", width: "34%" }, { left: "24.5%", width: "34.8%" }, { left: "61%", width: "25.5%" }];
      row.innerHTML = (attire.items || []).map(function (it, i) {
        var d = defaults[i] || { left: (i * 30) + "%", width: "28%" };
        return '<img src="' + escapeHtml(it.image) + '" alt="' + escapeHtml(it.alt || "") + '" style="left:' + escapeHtml(it.left || d.left) + ";width:" + escapeHtml(it.width || d.width) + '" />';
      }).join("");
    }

    var list = $("#schedule-list");
    if (list) list.innerHTML = (sched.items || []).map(function (ev) {
      var name = String(ev.title || "").split(/\n+/).filter(Boolean).map(function (l) { return "<span>" + escapeHtml(l) + "</span>"; }).join("");
      return '<div class="event"><div class="event-time">' + escapeHtml(ev.time) + "</div>" + (name ? '<div class="event-name">' + name + "</div>" : "") + "</div>";
    }).join("");

    var pair = $("#wedding-list-buttons");
    if (pair) pair.innerHTML = (wl.buttons || []).map(function (b) {
      return '<button class="btn" data-open-modal="' + escapeHtml(b.opens || "gifts") + '" data-bank="' + escapeHtml(b.bank || "morocco") + '">' + escapeHtml(b.label) + "</button>";
    }).join("");

    var fi = $("#footer-illustration");
    if (fi) { if (foot.illustration) fi.src = foot.illustration; else fi.remove(); }
    if (foot.showMonogram === false) $(".monogram").remove();
    if (foot.showDate === false) $(".footer-date").remove();
  }

  /* ── 2. Compte à rebours ───────────────────────────────── */
  function initCountdown(c) {
    var TARGET = new Date((c.event || {}).date).getTime();
    var cd = { days: $("#cd-days"), hours: $("#cd-hours"), mins: $("#cd-mins"), secs: $("#cd-secs") };
    if (!cd.days || isNaN(TARGET)) return;
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var tick = function () {
      var s = Math.floor(Math.max(0, TARGET - Date.now()) / 1000);
      cd.days.textContent = pad(Math.floor(s / 86400));
      cd.hours.textContent = pad(Math.floor(s % 86400 / 3600));
      cd.mins.textContent = pad(Math.floor(s % 3600 / 60));
      cd.secs.textContent = pad(s % 60);
    };
    tick(); setInterval(tick, 1000);
  }

  /* ── 3. Liste de mariage & coordonnées bancaires ───────── */
  var MONOGRAM_SKIP = ["sur", "de", "du", "des", "la", "le", "les", "et", "d", "of", "the", "and"];
  function monogram(label) {
    return String(label).split(/[\s-]+/).filter(function (w) {
      return w && MONOGRAM_SKIP.indexOf(w.toLowerCase().replace(/[^a-zà-ÿ]/gi, "")) === -1;
    }).map(function (w) { return w.charAt(0).toUpperCase(); }).slice(0, 3).join("");
  }
  function copyText(text, done) {
    function legacy() {
      var t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", "");
      t.style.position = "fixed"; t.style.top = "0"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(t); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, legacy);
    else legacy();
  }

  var giftRegion = "morocco";
  function renderBank(c, which) {
    var wl = c.weddingList || {}, banks = wl.banks || {};
    var b = banks[which] || banks[Object.keys(banks)[0]] || {};
    $("#bank-holder").textContent = b.holder || "";
    $("#bank-kind").textContent = b.kind || "";
    $("#bank-number").textContent = b.number || "";
    var btn = $("#bank-copy");
    btn.textContent = wl.copyLabel || "Copy";
    btn.onclick = function () {
      copyText(String(b.number || "").replace(/\s+/g, ""), function (ok) {
        btn.textContent = ok ? (wl.copiedLabel || "Copied") : (wl.copyFailedLabel || "Copy it by hand");
        setTimeout(function () { btn.textContent = wl.copyLabel || "Copy"; }, 2200);
      });
    };
  }
  function renderGifts(c) {
    var wl = c.weddingList || {};
    var items = (wl.shops || []).filter(function (g) { return g.label; });
    $("#gift-grid").innerHTML = items.length ? items.map(function (g) {
      var name = escapeHtml(g.label);
      var thumb = g.image ? '<img class="thumb" src="' + escapeHtml(g.image) + '" alt="" />'
        : '<div class="thumb thumb--mono"><span>' + escapeHtml(monogram(g.label)) + "</span></div>";
      var linked = g.url && g.url !== "#";
      return linked ? '<a class="gift" href="' + escapeHtml(g.url) + '" target="_blank" rel="noopener">' + thumb + '<span class="addr">' + name + "</span></a>"
        : '<div class="gift">' + thumb + '<span class="addr">' + name + "</span></div>";
    }).join("") : '<p class="gift-empty">' + escapeHtml(wl.emptyText || "") + "</p>";
  }

  function initVenueLinks(c) {
    var v = c.venue || {};
    var lat = Number(v.latitude), lng = Number(v.longitude);
    var waze = $("#link-waze"), gm = $("#link-gmaps");
    if (v.wazeUrl) waze.href = v.wazeUrl; else if (!isNaN(lat) && !isNaN(lng)) waze.href = "https://waze.com/ul?ll=" + lat + "," + lng + "&navigate=yes";
    if (v.googleMapsUrl) gm.href = v.googleMapsUrl; else if (!isNaN(lat) && !isNaN(lng)) gm.href = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
  }

  /* ── 4. Modales ────────────────────────────────────────── */
  function initModals(c) {
    var lastFocus = null;
    function openModal(id, trigger) {
      var ov = $("#modal-" + id);
      if (!ov) return;
      var already = $('.overlay[data-open="true"]');
      if (already && already !== ov) already.dataset.open = "false";
      if (trigger && trigger.dataset.bank) giftRegion = trigger.dataset.bank;
      if (id === "gifts") renderGifts(c);
      if (id === "bank") renderBank(c, (trigger && trigger.dataset.bank) || giftRegion);
      if (id === "rsvp") resetRsvpModal();
      lastFocus = trigger || document.activeElement;
      ov.dataset.open = "true";
      document.documentElement.classList.add("modal-open");
      var f = ov.querySelector("input,textarea,a,button:not([data-close])");
      (f || ov.querySelector("[data-close]")).focus();
    }
    function closeModal(ov) {
      ov.dataset.open = "false";
      document.documentElement.classList.remove("modal-open");
      if (lastFocus) lastFocus.focus();
    }
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-open-modal]");
      if (btn) openModal(btn.dataset.openModal, btn);
    });
    $$(".overlay").forEach(function (ov) {
      ov.addEventListener("click", function (e) { if (e.target === ov) closeModal(ov); });
      $$("[data-close]", ov).forEach(function (b) { b.addEventListener("click", function () { closeModal(ov); }); });
      ov.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var f = ov.querySelectorAll("a[href],button,input:not([type=radio]),input[type=radio]:checked,textarea");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var open = $('.overlay[data-open="true"]');
      if (open) closeModal(open);
    });

    /* RSVP */
    var plusOneField = $("#plus-one-field"), plusOneInput = $("#f-plus-one");
    var rsvpForm = $("#rsvp-form"), rsvpSuccess = $("#rsvp-success"), rsvpStatus = $("#rsvp-status");
    function resetRsvpModal() {
      if (!rsvpForm || !rsvpSuccess) return;
      rsvpForm.hidden = false; rsvpSuccess.hidden = true;
      if (rsvpStatus) rsvpStatus.textContent = "";
      var submit = rsvpForm.querySelector(".btn-send");
      if (submit) submit.disabled = false;
    }
    $$('input[name="accompanied"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var bringing = r.value === "yes" && r.checked;
        plusOneField.hidden = !bringing;
        plusOneInput.required = bringing;
        if (!bringing) plusOneInput.value = "";
      });
    });
    var rc = c.rsvp || {}, L = rc.labels || {};
    rsvpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.name || !data.name.trim()) { rsvpStatus.textContent = L.errorName || "Name?"; return; }
      if (!data.presence) { rsvpStatus.textContent = L.errorPresence || "Presence?"; return; }
      if (data.accompanied === "yes" && (!data.plusOne || !data.plusOne.trim())) { rsvpStatus.textContent = L.errorPlusOne || "+1?"; plusOneInput.focus(); return; }
      if (data.accompanied !== "yes") delete data.plusOne;
      var submit = e.target.querySelector(".btn-send");
      submit.disabled = true;
      rsvpStatus.textContent = L.sending || "Sending...";
      var yes = L.yes || "Yes", no = L.no || "No";
      var summary = "RSVP – " + data.name + "\n" + (L.presence || "Presence") + ": " + (data.presence === "yes" ? yes : no) +
        "\n" + (L.accompanied || "Accompanied") + ": " + (data.accompanied === "yes" ? yes : no) +
        (data.plusOne ? "\n" + (L.plusOne || "+1") + ": " + data.plusOne : "") +
        "\n" + (L.word || "Message") + ": " + (data.word || "-");
      var done = function () { rsvpStatus.textContent = ""; e.target.hidden = true; rsvpSuccess.hidden = false; };
      var fail = function (msg) { rsvpStatus.textContent = msg || L.errorSend || "Error"; submit.disabled = false; };
      try {
        if (rc.sendVia === "googlesheet" && rc.googleSheetEndpoint) {
          // Apps Script : envoi en formulaire encodé et sans CORS (réponse opaque), pas de pré-requête à gérer
          var body = new URLSearchParams(Object.assign({}, data, { presence: data.presence === "yes" ? yes : no, accompanied: data.accompanied === "yes" ? yes : no }));
          fetch(rc.googleSheetEndpoint, { method: "POST", mode: "no-cors", body: body })
            .then(function () { done(); }).catch(function () { fail(); });
        } else if (rc.sendVia === "formspree" && rc.formspreeEndpoint) {
          fetch(rc.formspreeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(Object.assign({ _subject: "RSVP – " + data.name }, data)) })
            .then(function (r) { if (!r.ok) throw new Error(); done(); }).catch(function () { fail(); });
        } else if (rc.sendVia === "whatsapp" && rc.whatsappNumber) {
          window.open("https://wa.me/" + String(rc.whatsappNumber).replace(/\D/g, "") + "?text=" + encodeURIComponent(summary), "_blank", "noopener");
          done();
        } else {
          window.location.href = "mailto:" + (rc.email || "") + "?subject=" + encodeURIComponent("RSVP – " + data.name) + "&body=" + encodeURIComponent(summary);
          done();
        }
      } catch (err) { fail(); }
    });
  }

  /* ── 5. Intro : rideau → prénoms centrés → invitation ── */
  function initIntro(c, theme) {
    var enterScreen = $("#enter"), namesEl = $(".names"), video = $("#curtain-video");
    if (theme && typeof theme.intro === "function") {
      var preview = new URLSearchParams(window.location.search).get("preview") === "1" || (c.intro && c.intro.enabled === false);
      if (video) { video.pause(); video.remove(); video = null; }
      if (preview) { themeReveal(); return; }
      document.body.style.overflow = "hidden";
      theme.intro({ enter: enterScreen, config: c, reveal: themeReveal, escapeHtml: escapeHtml });
      return;
    }
    var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var INTRO_CURTAIN_FALLBACK_MS = 5400, INTRO_NAMES_REVEAL_AT = 3, INTRO_VIDEO_FADE_MS = 750;
    var INTRO_NAMES_CENTER_HOLD_MS = 380, INTRO_NAMES_TRAVEL_MS = 1400, INTRO_FONT_LAYOUT_WAIT_MS = 700;
    var introStarted = false, introRevealed = false, curtainsExiting = false, namesTargetRect = null;
    var curtainExitTimer = 0, fadeTimer = 0, restTimer = 0, cleanupTimer = 0, mediaPrimed = false;
    var previewMode = new URLSearchParams(window.location.search).get("preview") === "1" || (c.intro && c.intro.enabled === false);

    function primeMedia() {
      if (mediaPrimed) return; mediaPrimed = true;
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      video.setAttribute("playsinline", ""); video.setAttribute("webkit-playsinline", "");
      try { video.load(); } catch (e) {}
    }
    function paint() {
      var h = document.documentElement;
      h.classList.add("painted");
      setTimeout(function () { h.classList.add("paint-done"); }, 4600);
    }
    function revealRest() { document.documentElement.classList.add("intro-rest-revealed"); }
    function afterFontLayout(callback) {
      var done = false, timer = 0;
      function run() { if (done) return; done = true; clearTimeout(timer); requestAnimationFrame(function () { requestAnimationFrame(callback); }); }
      if (!document.fonts || !document.fonts.ready) { run(); return; }
      timer = setTimeout(run, INTRO_FONT_LAYOUT_WAIT_MS);
      document.fonts.ready.then(run).catch(run);
    }
    function measureSettledNamesRect() {
      if (!namesEl || !namesEl.parentNode) return null;
      var clone = namesEl.cloneNode(true);
      clone.classList.remove("is-settling"); clone.removeAttribute("style"); clone.setAttribute("aria-hidden", "true");
      clone.style.visibility = "hidden"; clone.style.pointerEvents = "none"; clone.style.opacity = "0"; clone.style.filter = "none";
      namesEl.parentNode.insertBefore(clone, namesEl);
      var rect = clone.getBoundingClientRect();
      clone.remove();
      return rect;
    }
    function settleNames() {
      var h = document.documentElement;
      if (!namesEl || calm || !namesEl.animate) { h.classList.remove("intro-names-staged"); h.classList.add("intro-name-settled"); revealRest(); return; }
      var current = namesEl.getBoundingClientRect();
      namesEl.classList.add("is-settling");
      namesEl.style.position = "fixed"; namesEl.style.left = current.left + "px"; namesEl.style.top = current.top + "px";
      namesEl.style.width = current.width + "px"; namesEl.style.margin = "0"; namesEl.style.transform = "none";
      h.classList.remove("intro-names-staged");
      namesTargetRect = measureSettledNamesRect() || namesTargetRect;
      if (!namesTargetRect) { h.classList.add("intro-name-settled"); namesEl.classList.remove("is-settling"); namesEl.removeAttribute("style"); revealRest(); return; }
      var dx = namesTargetRect.left - current.left, dy = namesTargetRect.top - current.top;
      var movement = namesEl.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(" + dx + "px," + dy + "px,0)" }],
        { duration: INTRO_NAMES_TRAVEL_MS, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
      movement.finished.catch(function () {}).then(function () {
        h.classList.add("intro-name-settled");
        namesEl.style.left = namesTargetRect.left + "px"; namesEl.style.top = namesTargetRect.top + "px";
        namesEl.style.width = namesTargetRect.width + "px"; namesEl.style.transform = "none";
        movement.cancel();
        requestAnimationFrame(function () { namesEl.classList.remove("is-settling"); namesEl.removeAttribute("style"); revealRest(); });
      });
    }
    function scheduleSettleNames() { restTimer = setTimeout(function () { afterFontLayout(settleNames); }, INTRO_NAMES_CENTER_HOLD_MS); }
    function revealInvitation() {
      if (introRevealed || !video) return;
      introRevealed = true;
      namesTargetRect = namesEl ? namesEl.getBoundingClientRect() : null;
      document.documentElement.classList.add("intro-revealed", "intro-names-staged");
    }
    function revealNamesOnCue() {
      if (!video || video.currentTime < INTRO_NAMES_REVEAL_AT) return;
      video.removeEventListener("timeupdate", revealNamesOnCue);
      revealInvitation();
    }
    function exitCurtains() {
      if (curtainsExiting) return;
      curtainsExiting = true;
      if (video) video.classList.add("fading");
      fadeTimer = setTimeout(function () { revealInvitation(); scheduleSettleNames(); }, INTRO_VIDEO_FADE_MS);
      cleanupTimer = setTimeout(finishIntro, INTRO_VIDEO_FADE_MS + INTRO_NAMES_CENTER_HOLD_MS + INTRO_FONT_LAYOUT_WAIT_MS + INTRO_NAMES_TRAVEL_MS + 420);
    }
    function finishIntro() {
      if (!video || video.classList.contains("done")) { document.body.style.overflow = ""; if (enterScreen) enterScreen.remove(); return; }
      clearTimeout(curtainExitTimer); clearTimeout(fadeTimer); clearTimeout(restTimer); clearTimeout(cleanupTimer);
      document.body.style.overflow = "";
      video.classList.add("done"); video.pause(); video.remove();
      if (enterScreen) enterScreen.remove();
    }
    function begin(e) {
      if (e) e.preventDefault();
      if (introStarted) return;
      introStarted = true;
      primeMedia();
      document.body.style.overflow = "hidden";
      enterScreen.classList.add("gone");
      if (calm) { paint(); document.documentElement.classList.add("intro-revealed", "intro-name-settled"); revealRest(); finishIntro(); return; }
      video.classList.add("rolling");
      paint();
      curtainExitTimer = setTimeout(exitCurtains, INTRO_CURTAIN_FALLBACK_MS);
      video.addEventListener("timeupdate", revealNamesOnCue);
      video.addEventListener("ended", exitCurtains);
      video.addEventListener("error", exitCurtains, { once: true });
      var pv = video.play();
      if (pv && pv.catch) pv.catch(function () { setTimeout(exitCurtains, 300); });
    }
    function revealPreviewState() {
      document.body.style.overflow = "";
      document.documentElement.classList.add("intro-revealed", "intro-name-settled", "intro-rest-revealed", "painted", "paint-done");
      if (enterScreen) enterScreen.remove();
      if (video) { video.pause(); video.remove(); }
    }
    if (previewMode) revealPreviewState();
    else if (enterScreen) {
      enterScreen.addEventListener("pointerdown", primeMedia, { once: true, passive: true });
      enterScreen.addEventListener("touchstart", primeMedia, { once: true, passive: true });
      enterScreen.addEventListener("click", begin);
    }
  }

  /* ── 6. Défilement par page ────────────────────────────── */
  function initPagedScroll(theme) {
    if (theme && theme.pagedScroll === false) { document.documentElement.classList.add("no-paged-scroll"); return; }
    var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pagedScrollMedia = matchMedia("(min-height: 520px)");
    var pagedPanels = $$(".page > header.hero, .page > section, .page > footer.footer");
    var pagedScrollLock = false, pagedScrollTimer = 0, pagedSettleTimer = 0, wheelIntent = 0, wheelResetTimer = 0, touchStart = null, currentIndex = 0;
    var scrollCue = $("#scroll-cue");

    function hasOpenModal() { return Boolean($('.overlay[data-open="true"]')); }
    function isNativeScrollTarget(t) { return Boolean(t && t.closest && t.closest("input, textarea, select, [contenteditable='true'], .modal, .overlay")); }
    function isKeyboardTarget(t) { return Boolean(t && t.closest && t.closest("input, textarea, select, button, a, [contenteditable='true'], .modal, .overlay")); }
    function pagedScrollEnabled() {
      return !calm && pagedScrollMedia.matches && pagedPanels.length > 1 && document.documentElement.classList.contains("intro-revealed") && !hasOpenModal();
    }
    function maxScrollTop() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    function panelTop(panel) { return Math.min(maxScrollTop(), Math.max(0, window.scrollY + panel.getBoundingClientRect().top)); }
    function currentPanelIndex() {
      var viewportCenter = window.scrollY + window.innerHeight / 2, bestIndex = 0, bestDistance = Infinity;
      pagedPanels.forEach(function (panel, index) {
        var distance = Math.abs(panelTop(panel) + panel.offsetHeight / 2 - viewportCenter);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
      });
      return bestIndex;
    }
    function setCurrentPanel(index) {
      pagedPanels.forEach(function (panel, i) { panel.classList.toggle("is-current", i === index); });
      if (!scrollCue) return;
      var atEnd = index >= pagedPanels.length - 1;
      scrollCue.classList.toggle("is-up", atEnd);
      scrollCue.setAttribute("aria-label", atEnd ? "Back to the top" : "Scroll to the next section");
    }
    function scrollToPanel(index) {
      index = Math.max(0, Math.min(pagedPanels.length - 1, index));
      var panel = pagedPanels[index];
      if (!panel) return;
      currentIndex = index; pagedScrollLock = true;
      setCurrentPanel(index);
      window.scrollTo({ top: panelTop(panel), behavior: "smooth" });
      clearTimeout(pagedScrollTimer);
      pagedScrollTimer = setTimeout(function () { pagedScrollLock = false; wheelIntent = 0; }, 620);
    }
    function pageBy(d) { scrollToPanel(currentIndex + d); }
    function wheelPixels(e) { if (e.deltaMode === 1) return e.deltaY * 16; if (e.deltaMode === 2) return e.deltaY * window.innerHeight; return e.deltaY; }

    window.addEventListener("wheel", function (e) {
      if (!pagedScrollEnabled() || e.ctrlKey || e.metaKey || isNativeScrollTarget(e.target)) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (pagedScrollLock) return;
      var delta = wheelPixels(e);
      if (wheelIntent && (wheelIntent > 0) !== (delta > 0)) wheelIntent = 0;
      wheelIntent += delta;
      clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(function () { wheelIntent = 0; }, 140);
      if (Math.abs(wheelIntent) < 28) return;
      pageBy(wheelIntent > 0 ? 1 : -1);
      wheelIntent = 0;
    }, { passive: false });
    document.addEventListener("keydown", function (e) {
      if (!pagedScrollEnabled() || isKeyboardTarget(e.target)) return;
      if (e.key === "Home") { e.preventDefault(); if (!pagedScrollLock) scrollToPanel(0); return; }
      if (e.key === "End") { e.preventDefault(); if (!pagedScrollLock) scrollToPanel(pagedPanels.length - 1); return; }
      var direction = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) direction = 1;
      if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) direction = -1;
      if (!direction) return;
      e.preventDefault();
      if (!pagedScrollLock) pageBy(direction);
    });
    window.addEventListener("touchstart", function (e) {
      if (!pagedScrollEnabled() || e.touches.length !== 1 || isNativeScrollTarget(e.target)) { touchStart = null; return; }
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (!touchStart || !pagedScrollEnabled() || e.touches.length !== 1) return;
      var dx = touchStart.x - e.touches[0].clientX, dy = touchStart.y - e.touches[0].clientY;
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) e.preventDefault();
    }, { passive: false });
    window.addEventListener("touchend", function (e) {
      if (!touchStart || !pagedScrollEnabled() || !e.changedTouches.length) { touchStart = null; return; }
      var dx = touchStart.x - e.changedTouches[0].clientX, dy = touchStart.y - e.changedTouches[0].clientY;
      touchStart = null;
      if (Math.abs(dy) < 46 || Math.abs(dy) < Math.abs(dx) * 1.15) return;
      e.preventDefault();
      if (!pagedScrollLock) pageBy(dy > 0 ? 1 : -1);
    }, { passive: false });
    window.addEventListener("scroll", function () {
      if (pagedScrollLock) return;
      clearTimeout(pagedSettleTimer);
      pagedSettleTimer = setTimeout(function () { currentIndex = currentPanelIndex(); setCurrentPanel(currentIndex); }, 140);
    }, { passive: true });
    if (scrollCue) scrollCue.addEventListener("click", function () {
      if (pagedScrollLock) return;
      if (currentIndex >= pagedPanels.length - 1) scrollToPanel(0); else scrollToPanel(currentIndex + 1);
    });
    currentIndex = currentPanelIndex();
    setCurrentPanel(currentIndex);
  }

  function initReveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ── Démarrage ─────────────────────────────────────────── */
  /* Variante de design : ?v=N (ou theme.variant dans site.json) charge assets/themes/vN/theme.css
     et assets/themes/vN/theme.js, qui peut définir window.WEDDING_THEME = { intro, decorate, pagedScroll } */
  function loadVariant(c) {
    var q = new URLSearchParams(window.location.search).get("v");
    var n = q != null && q !== "" ? parseInt(q, 10) : parseInt((c.theme || {}).variant, 10);
    if (!n || isNaN(n) || n < 1) return Promise.resolve(null);
    document.documentElement.classList.add("theme-v" + n, "has-theme");
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "assets/themes/v" + n + "/theme.css";
    document.head.appendChild(link);
    return new Promise(function (resolve) {
      var sc = document.createElement("script");
      sc.src = "assets/themes/v" + n + "/theme.js";
      sc.onload = function () { resolve(window.WEDDING_THEME || {}); };
      sc.onerror = function () { resolve({}); };
      document.head.appendChild(sc);
    });
  }

  /* Révélation utilisée par les intros de thème (remplace la vidéo du rideau) */
  function themeReveal() {
    var h = document.documentElement;
    document.body.style.overflow = "";
    var video = $("#curtain-video"); if (video) { video.pause(); video.remove(); }
    h.classList.add("intro-revealed", "intro-name-settled");
    requestAnimationFrame(function () {
      h.classList.add("intro-rest-revealed", "painted");
      setTimeout(function () { h.classList.add("paint-done"); }, 4600);
    });
    var enter = $("#enter");
    if (enter) { enter.classList.add("gone"); setTimeout(function () { enter.remove(); }, 900); }
  }

  function boot() {
    fetch("content/site.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("site.json " + r.status); return r.json(); })
      .then(function (c) {
        return loadVariant(c).then(function (theme) {
          if (!theme) applyTheme(c.theme);
          setMeta(c);
          fillText(c);
          renderContent(c);
          if (theme && typeof theme.decorate === "function") {
            theme.decorate(c, {
              $: $, $$: $$, escapeHtml: escapeHtml,
              swap: function (sel, src) { $$(sel).forEach(function (img) { if (src) img.src = src; else img.remove(); }); },
              hide: function (sel) { $$(sel).forEach(function (el) { el.remove(); }); }
            });
          }
          initCountdown(c);
          initVenueLinks(c);
          initModals(c);
          initIntro(c, theme);
          initPagedScroll(theme);
          initReveal();
        });
      })
      .catch(function (err) {
        console.error(err);
        var enter = $("#enter"); if (enter) enter.remove();
        var v = $("#curtain-video"); if (v) v.remove();
        document.documentElement.classList.add("intro-revealed", "intro-name-settled", "intro-rest-revealed", "painted", "paint-done");
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
