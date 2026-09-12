/* V2 · Jardin Majorelle — intro : les portes bleues du jardin s'ouvrent */
window.WEDDING_THEME = {
  name: "Jardin Majorelle",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    enter.innerHTML = '<span class="t2-door t2-door--l"><i></i></span><span class="t2-door t2-door--r"><i></i></span>' +
      '<img class="t2-palm t2-palm--l" src="assets/themes/v2/art/palm.svg" alt="" aria-hidden="true">' +
      '<img class="t2-palm t2-palm--r" src="assets/themes/v2/art/palm.svg" alt="" aria-hidden="true">' +
      '<span class="t2-badge"><b>' + ctx.escapeHtml(ctx.config.couple.bride.charAt(0) + "&" + ctx.config.couple.groom.charAt(0)) + '</b><span>' + ctx.escapeHtml(prompt) + '</span></span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t2-open");
      setTimeout(ctx.reveal, 1400);
    });
  },
  decorate: function (c, h) {
    h.photo(".venue-art", "assets/themes/v2/photos/majorelle.jpg");
    h.swap(".candle-l", "assets/themes/v2/art/cactus.svg");
    h.swap(".candle-r", "assets/themes/v2/art/cactus.svg");
    h.swap(".lights-l", "assets/themes/v2/art/leaf-band.svg");
    h.swap(".lights-r", "assets/themes/v2/art/leaf-band.svg");
    h.swap(".orn-divider", "assets/themes/v2/art/sun.svg");
    h.swap(".lantern", "assets/themes/v2/art/palm.svg");
    h.hide(".curtain"); h.hide(".orn-feet");
  }
};
