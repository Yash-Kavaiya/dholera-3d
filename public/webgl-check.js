/* Runs before the 3D module: shows a fallback when WebGL is missing. Kept out of the HTML for the CSP. */
(function () {
  try {
    var c = document.createElement("canvas");
    if (c.getContext("webgl2") || c.getContext("webgl")) return;
  } catch (e) {}
  window.__noWebGL = true;
  document.addEventListener("DOMContentLoaded", function () {
    var l = document.getElementById("loader");
    if (l) l.remove();
    var d = document.createElement("div");
    d.id = "webgl-fallback";
    d.innerHTML = "<div><h1>3D is not available here</h1><p>This browser or device does not support WebGL. Everything in the model is also in the guide.</p><p><a href=\"/\">Go to the guide</a> · <a href=\"/projects/\">Project status</a> · <a href=\"/villages/\">Villages map</a></p></div>";
    document.body.append(d);
  });
})();
