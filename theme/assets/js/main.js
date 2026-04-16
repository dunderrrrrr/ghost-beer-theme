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

// htmx for navigation since ghost is ghost
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".gh-head-menu a[href]").forEach(function (a) {
    var url = new URL(a.getAttribute("href"));
    var pathname = url.pathname;
    a.setAttribute("hx-get", pathname);
    a.setAttribute("hx-target", "main");
    a.setAttribute("hx-swap", "innerHTML");
    a.setAttribute("hx-select", "main");
    a.setAttribute("hx-push-url", "true");
    a.removeAttribute("href");
    htmx.process(a);

    document.addEventListener("htmx:afterSettle", function () {
      document.body.classList.remove("is-head-open");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  updateNavCurrent();
});

function updateNavCurrent() {
  document.querySelectorAll(".gh-head-menu li").forEach(function (li) {
    var a = li.querySelector("a[hx-get]");
    if (a) {
      li.classList.toggle(
        "nav-current",
        a.getAttribute("hx-get") === window.location.pathname,
      );
    }
  });
}

document.addEventListener("htmx:pushedIntoHistory", updateNavCurrent);

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

// htmx loading indicator
(function () {
  var bar = document.getElementById("htmx-loading");
  if (!bar) return;
  var minDuration = 300;
  var startTime;
  var completeTimer;

  document.addEventListener("htmx:beforeRequest", function () {
    clearTimeout(completeTimer);
    bar.className = "reset";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        startTime = Date.now();
        bar.className = "active";
      });
    });
  });

  document.addEventListener("htmx:afterSettle", function () {
    var elapsed = Date.now() - startTime;
    var remaining = Math.max(0, minDuration - elapsed);
    completeTimer = setTimeout(function () {
      bar.className = "complete";
      setTimeout(function () {
        bar.className = "reset";
      }, 200);
    }, remaining);
  });
})();
