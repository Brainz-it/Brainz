/* V8 · Caftan & broderie — intro : les pans brodés du caftan s'écartent */
window.WEDDING_THEME = {
  name: "Caftan & broderie",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    enter.innerHTML = '<span class="t8-pan t8-pan--l"></span><span class="t8-pan t8-pan--r"></span><span class="t8-shine"></span>' +
      '<span class="t8-center"><img src="assets/themes/v8/art/khamsa.svg" alt="" aria-hidden="true"><span class="t8-copy">' + ctx.escapeHtml(prompt) + '</span></span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t8-shimmer");
      setTimeout(function () { enter.classList.add("t8-open"); }, 600);
      setTimeout(ctx.reveal, 1900);
    });
  },
  decorate: function (c, h) {
    h.photo(".venue-art", "assets/themes/v8/photos/caftan.jpg");
    h.swap(".candle-l", "assets/themes/v8/art/mandala.svg");
    h.swap(".candle-r", "assets/themes/v8/art/mandala.svg");
    h.swap(".lights-l", "assets/themes/v8/art/sfifa.svg");
    h.swap(".lights-r", "assets/themes/v8/art/sfifa.svg");
    h.swap(".orn-divider", "assets/themes/v8/art/sfifa.svg");
    h.swap(".orn-sprig", "assets/themes/v8/art/mandala.svg");
    h.swap(".curtain.left", "assets/themes/v8/art/panel.svg");
    h.swap(".curtain.right", "assets/themes/v8/art/panel.svg");
    h.swap(".lantern", "assets/themes/v8/art/khamsa.svg");
  }
};
