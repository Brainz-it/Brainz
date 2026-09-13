/* V7 · Minimal éditorial — intro typographique, page à défilement continu façon magazine */
window.WEDDING_THEME = {
  name: "Minimal éditorial",
  pagedScroll: false,
  intro: function (ctx) {
    var enter = ctx.enter, c = ctx.config, prompt = (c.intro && c.intro.prompt) || "Touchez pour continuer";
    enter.innerHTML = '<span class="t7-block"></span><span class="t7-inner"><span class="t7-kicker">' + ctx.escapeHtml(c.hero.eyebrow || "") + '</span>' +
      '<span class="t7-names"><span>' + ctx.escapeHtml(c.couple.bride) + '</span><span class="t7-amp">' + ctx.escapeHtml(c.couple.conjunction || "&") + '</span><span>' + ctx.escapeHtml(c.couple.groom) + '</span></span>' +
      '<span class="t7-date">' + ctx.escapeHtml((c.event.dateLabel || "") + " — " + (c.event.city || "")) + '</span>' +
      '<span class="t7-copy">' + ctx.escapeHtml(prompt) + ' →</span></span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t7-wipe");
      setTimeout(ctx.reveal, 1100);
    });
  },
  decorate: function (c, h) {
    h.photo(".venue-art", "assets/themes/v7/photos/koutoubia.jpg");
    h.hide(".candle-l"); h.hide(".candle-r"); h.hide(".lights-band"); h.hide(".orn-divider"); h.hide(".orn-feet"); h.hide(".curtain"); h.hide(".lantern");
    // numérotation éditoriale des sections
    h.$$(".page > section").forEach(function (s, i) {
      var t = s.querySelector(".section-title");
      if (t) { var n = document.createElement("span"); n.className = "t7-index"; n.textContent = String(i + 1).padStart(2, "0"); t.parentNode.insertBefore(n, t); }
    });
    // le programme en tableau
    h.$$(".schedule .event").forEach(function (ev) { ev.classList.add("t7-row"); });
  }
};
