(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const isInVisiblePanel = (video) => !video.closest("[hidden]");

  const labelForToggle = (button, paused) => {
    const current = button.getAttribute("aria-label") || "video";
    const subject = current.replace(/^(Play|Pause)\s+/i, "");
    button.setAttribute("aria-label", `${paused ? "Play" : "Pause"} ${subject}`);
    const icon = button.querySelector("span");
    if (icon) {
      icon.textContent = paused ? "▶" : "Ⅱ";
    }
  };

  const toggleForVideo = (video) =>
    document.querySelector(`[data-video="${CSS.escape(video.id)}"]`);

  const playAmbientVideo = (video) => {
    if (
      reduceMotion ||
      video.dataset.userPaused === "true" ||
      !isInVisiblePanel(video) ||
      !isInViewport(video)
    ) {
      return;
    }

    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        const button = toggleForVideo(video);
        if (button) labelForToggle(button, true);
      });
    }
  };

  const ambientVideos = [...document.querySelectorAll("video[data-autoplay]")];

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.22) {
            playAmbientVideo(video);
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.22, 0.55] }
    );

    ambientVideos.forEach((video) => videoObserver.observe(video));
  } else {
    ambientVideos.forEach(playAmbientVideo);
  }

  document.querySelectorAll(".clip-toggle[data-video]").forEach((button) => {
    const video = document.getElementById(button.dataset.video);
    if (!video) return;

    labelForToggle(button, video.paused);

    button.addEventListener("click", () => {
      if (video.paused) {
        video.dataset.userPaused = "false";
        const attempt = video.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(() => labelForToggle(button, true));
        }
      } else {
        video.dataset.userPaused = "true";
        video.pause();
      }
    });

    video.addEventListener("play", () => labelForToggle(button, false));
    video.addEventListener("pause", () => labelForToggle(button, true));
  });

  const mainVideo = document.getElementById("research-video");
  const mainPlayer = document.getElementById("main-player");
  const mainPlay = document.getElementById("main-play");
  const chapters = [...document.querySelectorAll(".chapter[data-time]")];

  if (mainVideo && mainPlayer) {
    const playMainVideo = () => {
      const attempt = mainVideo.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => mainPlayer.classList.remove("is-playing"));
      }
    };

    mainPlay?.addEventListener("click", playMainVideo);
    mainVideo.addEventListener("play", () => mainPlayer.classList.add("is-playing"));
    mainVideo.addEventListener("pause", () => mainPlayer.classList.remove("is-playing"));
    mainVideo.addEventListener("ended", () => mainPlayer.classList.remove("is-playing"));

    chapters.forEach((chapter) => {
      chapter.addEventListener("click", () => {
        mainVideo.currentTime = Number(chapter.dataset.time);
        playMainVideo();
      });
    });

    mainVideo.addEventListener("timeupdate", () => {
      let activeChapter = chapters[0];
      chapters.forEach((chapter) => {
        if (mainVideo.currentTime >= Number(chapter.dataset.time)) {
          activeChapter = chapter;
        }
      });
      chapters.forEach((chapter) => {
        chapter.classList.toggle("is-active", chapter === activeChapter);
      });
    });
  }

  const comparisonChart = document.getElementById("comparison-chart");
  const metricButtons = [...document.querySelectorAll("[data-chart-metric]")];
  const comparisonBars = comparisonChart
    ? [...comparisonChart.querySelectorAll(".comparison-bar")]
    : [];

  const setChartMetric = (metric, animate = false) => {
    metricButtons.forEach((button) => {
      const active = button.dataset.chartMetric === metric;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const applyValues = () => {
      comparisonBars.forEach((bar) => {
        const fill = bar.querySelector("i");
        const label = bar.querySelector("span");
        const value = fill?.dataset[metric] || "0";
        if (fill) fill.style.setProperty("--bar-value", value);
        if (label) label.textContent = `${value}%`;
      });
    };

    if (animate && comparisonChart?.classList.contains("is-visible")) {
      comparisonBars.forEach((bar) => {
        bar.querySelector("i")?.style.setProperty("--bar-value", "0");
      });
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyValues));
    } else {
      applyValues();
    }
  };

  setChartMetric("policy");

  metricButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setChartMetric(button.dataset.chartMetric, true);
    });
  });

  const revealTargets = [
    ...document.querySelectorAll(
      "[data-reveal], [data-animate-bars], [data-animate-horizontal]"
    ),
  ];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -4% 0px" }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  const benchmarkRail = document.getElementById("benchmark-rail");
  document.querySelectorAll("[data-rail-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!benchmarkRail) return;
      benchmarkRail.scrollBy({
        left: Number(button.dataset.railDirection) * benchmarkRail.clientWidth * 0.78,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  });
})();
