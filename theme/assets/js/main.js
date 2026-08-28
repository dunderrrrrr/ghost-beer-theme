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
    a.setAttribute("hx-target", ".site-content");
    a.setAttribute("hx-swap", "outerHTML");
    a.setAttribute("hx-select", ".site-content");
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
  var onTagPage = /^\/tag\//.test(window.location.pathname);

  document.querySelectorAll(".gh-head-menu li").forEach(function (li, index) {
    var a = li.querySelector("a[hx-get]");
    if (a) {
      var isCurrent = a.getAttribute("hx-get") === window.location.pathname;
      if (index === 0 && onTagPage) isCurrent = true;
      li.classList.toggle("nav-current", isCurrent);
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

// lazy load images
document.querySelectorAll("img").forEach((img) => {
  img.loading = "lazy";
});

// Fade/slide transition between htmx page navigations
(function () {
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) return;

  var skipTransition = false;

  document.body.addEventListener("htmx:beforeRequest", function (e) {
    if (!e.target.closest("[hx-target='.site-content']")) return;
    if (e.target.closest(".tag-filter-link")) {
      skipTransition = true;
      return;
    }
    skipTransition = false;
    var content = document.querySelector(".site-content");
    if (content) content.classList.add("is-transitioning");
  });

  document.body.addEventListener("htmx:afterSwap", function () {
    if (skipTransition) return;
    var content = document.querySelector(".site-content");
    if (!content) return;
    // new node swapped in — it's already faded out via inherited class,
    // flip it back on the next frame so the browser animates the fade-in
    content.classList.add("is-transitioning");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        content.classList.remove("is-transitioning");
      });
    });
  });
})();

// Header backdrop on scroll
(function () {
  var head = document.getElementById("gh-head");
  if (!head) return;

  window.addEventListener(
    "scroll",
    function () {
      head.classList.toggle("is-scrolled", window.scrollY > 8);
    },
    { passive: true },
  );
})();

// Post card tilt + cursor glow
(function () {
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) return;

  var maxTilt = 6;

  function bindCardTilt() {
    document.querySelectorAll(".post-feed article.post").forEach(function (card) {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "true";

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var px = x / rect.width;
        var py = y / rect.height;

        card.style.setProperty("--tilt-x", (px - 0.5) * maxTilt * 2 + "deg");
        card.style.setProperty("--tilt-y", (0.5 - py) * maxTilt * 2 + "deg");
        card.style.setProperty("--glow-x", px * 100 + "%");
        card.style.setProperty("--glow-y", py * 100 + "%");
      });

      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  bindCardTilt();
  document.addEventListener("htmx:afterSettle", bindCardTilt);
})();

// Cards fade/slide in as they scroll into view
(function () {
  if (!("IntersectionObserver" in window)) return;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  function bindReveal() {
    document.querySelectorAll(".post-feed article.post").forEach(function (card) {
      if (card.dataset.revealBound) return;
      card.dataset.revealBound = "true";
      card.classList.add("reveal");
      observer.observe(card);
    });
  }

  bindReveal();
  document.addEventListener("htmx:afterSettle", bindReveal);
})();
