/** Site pages. scripts/build-pages.mjs writes each `file`; vite.config.js builds them all. */
export const routes = [
  { id: "home", path: "/", file: "index.html", nav: "Overview" },
  { id: "projects", path: "/projects/", file: "projects/index.html", nav: "Projects" },
  { id: "timeline", path: "/timeline/", file: "timeline/index.html", nav: "Timeline" },
  { id: "villages", path: "/villages/", file: "villages/index.html", nav: "Villages" },
  { id: "invest", path: "/invest/", file: "invest/index.html", nav: "Invest" },
  { id: "faq", path: "/faq/", file: "faq/index.html", nav: "FAQ" },
  { id: "sources", path: "/sources/", file: "sources/index.html", nav: "Sources" },
  { id: "about", path: "/about/", file: "about/index.html" },
  { id: "notfound", path: "/404.html", file: "404.html", noindex: true },
];

/** Hand-written page (the 3D model). Built, but not generated. */
export const explore = { id: "explore", path: "/explore/", file: "explore/index.html", nav: "Explore in 3D" };
