/* V6 · Nuit du désert — intro : faire un vœu, l'étoile file et l'aube se lève */
window.WEDDING_THEME = {
  name: "Nuit du désert",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    enter.innerHTML = '<span class="t6-sky"></span><span class="t6-dawn"></span><span class="t6-star"></span>' +
      '<img class="t6-dunes" src="assets/themes/v6/art/dunes.svg" alt="" aria-hidden="true">' +
      '<img class="t6-moon" src="assets/themes/v6/art/crescent.svg" alt="" aria-hidden="true">' +
      '<span class="t6-copy">' + ctx.escapeHtml(prompt) + '</span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t6-wish");
      setTimeout(function () { enter.classList.add("t6-rise"); }, 700);
      setTimeout(ctx.reveal, 2100);
    });
  },
  decorate: function (c, h) {
    h.hide(".candle-l"); h.hide(".candle-r"); h.hide(".orn-feet");
    h.swap(".lights-l", "assets/themes/v6/art/constellation.svg");
    h.swap(".lights-r", "assets/themes/v6/art/constellation.svg");
    h.swap(".curtain.left", "assets/themes/v6/art/palm.svg");
    h.swap(".curtain.right", "assets/themes/v6/art/palm.svg");
    h.swap(".orn-divider", "assets/themes/v6/art/constellation.svg");
    h.swap(".lantern", "assets/themes/v6/art/crescent.svg");
  }
};
