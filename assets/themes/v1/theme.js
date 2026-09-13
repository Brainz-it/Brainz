/* V1 · Riad la nuit — intro : allumer la lanterne */
window.WEDDING_THEME = {
  name: "Riad la nuit",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    enter.innerHTML = '<span class="t1-sky"></span><span class="t1-glow"></span>' +
      '<img class="t1-lantern" src="assets/themes/v1/art/lantern.svg" alt="" aria-hidden="true">' +
      '<span class="t1-copy">' + ctx.escapeHtml(prompt) + '</span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t1-lit");
      setTimeout(function () { enter.classList.add("t1-flood"); }, 900);
      setTimeout(ctx.reveal, 1900);
    });
  },
  decorate: function (c, h) {
    h.photo(".venue-art", "assets/themes/v1/photos/riad.jpg");
    h.swap(".candle-l", "assets/themes/v1/art/lantern-small.svg");
    h.swap(".candle-r", "assets/themes/v1/art/lantern-small.svg");
    h.swap(".curtain.left", "assets/themes/v1/art/arch.svg");
    h.swap(".curtain.right", "assets/themes/v1/art/arch.svg");
    h.swap(".lantern", "assets/themes/v1/art/moon.svg");
    h.hide(".orn-feet");
  }
};
