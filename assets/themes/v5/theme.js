/* V5 · Terracotta & raphia — intro : les branches d'olivier se dessinent */
window.WEDDING_THEME = {
  name: "Terracotta & raphia",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    var mono = ctx.escapeHtml(ctx.config.couple.monogram || (ctx.config.couple.bride.charAt(0) + "&" + ctx.config.couple.groom.charAt(0)));
    enter.innerHTML = '<span class="t5-weave"></span>' +
      '<img class="t5-branch t5-branch--l" src="assets/themes/v5/art/olive.svg" alt="" aria-hidden="true">' +
      '<img class="t5-branch t5-branch--r" src="assets/themes/v5/art/olive.svg" alt="" aria-hidden="true">' +
      '<span class="t5-stamp"><b>' + mono + '</b><small>' + ctx.escapeHtml(prompt) + '</small></span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t5-grow");
      setTimeout(function () { enter.classList.add("t5-fade"); }, 1400);
      setTimeout(ctx.reveal, 2000);
    });
  },
  decorate: function (c, h) {
    h.swap(".candle-l", "assets/themes/v5/art/pot.svg");
    h.swap(".candle-r", "assets/themes/v5/art/pot.svg");
    h.swap(".lights-l", "assets/themes/v5/art/olive.svg");
    h.swap(".lights-r", "assets/themes/v5/art/olive.svg");
    h.swap(".orn-divider", "assets/themes/v5/art/blossom.svg");
    h.swap(".orn-sprig", "assets/themes/v5/art/blossom.svg");
    h.swap(".curtain.left", "assets/themes/v5/art/olive.svg");
    h.swap(".curtain.right", "assets/themes/v5/art/olive.svg");
    h.swap(".lantern", "assets/themes/v5/art/orange.svg");
  }
};
