/** Entry for /explore. Loads the 3D model only when WebGL is available (see the inline check in explore/index.html). */
if (!window.__noWebGL) import("./main.js");
