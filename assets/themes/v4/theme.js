/* V4 · Cinéma rétro — intro : amorce de film 3-2-1 */
window.WEDDING_THEME = {
  name: "Cinéma rétro",
  pagedScroll: true,
  intro: function (ctx) {
    var enter = ctx.enter, prompt = (ctx.config.intro && ctx.config.intro.prompt) || "Touchez pour continuer";
    var title = ctx.escapeHtml(ctx.config.couple.bride + " " + (ctx.config.couple.conjunction || "&") + " " + ctx.config.couple.groom);
    enter.innerHTML = '<span class="t4-grain"></span><span class="t4-leader"><i></i><b id="t4-num"></b></span>' +
      '<span class="t4-marquee"><img src="assets/themes/v4/art/marquee.svg" alt="" aria-hidden="true"><span class="t4-title">' + title + '</span><span class="t4-copy">' + ctx.escapeHtml(prompt) + '</span></span>';
    var done = false;
    enter.addEventListener("click", function (e) {
      e.preventDefault(); if (done) return; done = true;
      enter.classList.add("t4-roll");
      var num = enter.querySelector("#t4-num"), n = 3;
      num.textContent = n;
      var t = setInterval(function () { n--; if (n <= 0) { clearInterval(t); enter.classList.add("t4-flash"); setTimeout(ctx.reveal, 500); return; } num.textContent = n; enter.querySelector(".t4-leader i").style.animation = "none"; void enter.offsetWidth; enter.querySelector(".t4-leader i").style.animation = ""; }, 700);
    });
  },
  decorate: function (c, h) {
    h.photo(".venue-art", "assets/themes/v4/photos/cinema.jpg");
    h.swap(".candle-l", "assets/themes/v4/art/spotlight.svg");
    h.swap(".candle-r", "assets/themes/v4/art/spotlight.svg");
    h.swap(".lights-l", "assets/themes/v4/art/filmstrip.svg");
    h.swap(".lights-r", "assets/themes/v4/art/filmstrip.svg");
    h.swap(".curtain.left", "assets/themes/v4/art/curtain.svg");
    h.swap(".curtain.right", "assets/themes/v4/art/curtain.svg");
    h.swap(".lantern", "assets/themes/v4/art/ticket.svg");
    h.hide(".orn-feet"); h.hide(".orn-divider");
  }
};
