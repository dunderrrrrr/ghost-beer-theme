(function () {
  pagination(true);
})();

(function () {
  var toggles = document.querySelectorAll(".theme-toggle");
  if (!toggles.length) return;

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  });
})();

// Scroll to top button
(function () {
  var btn = document.getElementById("scroll-top");

  window.addEventListener(
    "scroll",
    function () {
      btn.classList.toggle("visible", window.scrollY > 400);
    },
    { passive: true },
  );

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("htmx:afterSettle", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// Reading progress bar
(function () {
  var bar = document.getElementById("reading-progress");
  if (!bar) return;

  window.addEventListener(
    "scroll",
    function () {
      var scrollTop = window.scrollY;
      var docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width =
        (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + "%";
    },
    { passive: true },
  );
})();

// ABV result value fade animation
(function () {
  var origCalc = window.calc;
  if (typeof origCalc !== "function") return;

  window.calc = function () {
    var og = document.getElementById("og");
    var fg = document.getElementById("fg");
    var bothFilled = og && fg && og.value !== "" && fg.value !== "";
    var vals = document.querySelectorAll(".result-value");

    if (bothFilled) {
      vals.forEach(function (el) {
        el.classList.add("updating");
      });
      setTimeout(function () {
        origCalc();
        vals.forEach(function (el) {
          el.classList.remove("updating");
        });
      }, 150);
    } else {
      origCalc();
    }
  };
})();
