/* V3 · Papeterie — intro : ouvrir l'enveloppe scellée */
window.WEDDING_THEME = {
  name: "Papeterie",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    var names = ctx.escapeHtml(ctx.config.couple.bride + " " + (ctx.config.couple.conjunction || "&") + " " + ctx.config.couple.groom);
    enter.innerHTML = '<span class="t3-env"><span class="t3-card"><em>' + names + '</em><small>' + ctx.escapeHtml(ctx.config.event.dateLabel || "") + '</small></span>' +
      '<span class="t3-back"></span><span class="t3-flap"></span><img class="t3-seal" src="assets/themes/v3/art/seal.svg" alt="" aria-hidden="true"></span>' +
      '<span class="t3-copy">' + ctx.escapeHtml(prompt) + '</span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t3-unseal");
      setTimeout(function () { enter.classList.add("t3-open"); }, 500);
      setTimeout(function () { enter.classList.add("t3-out"); }, 1300);
      setTimeout(ctx.reveal, 2100);
    });
  },
  decorate: function (c, h) {
    h.hide(".candle-l"); h.hide(".candle-r"); h.hide(".curtain");
    h.swap(".lights-l", "assets/themes/v3/art/laurel.svg"); h.hide(".lights-r");
    h.swap(".orn-divider", "assets/themes/v3/art/flourish.svg");
    h.swap(".orn-sprig", "assets/themes/v3/art/flourish.svg");
    h.swap(".lantern", "assets/themes/v3/art/crest.svg");
  }
};
