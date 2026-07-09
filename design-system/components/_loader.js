/* Borednotes DS — demo-card loader.
   Lets a *.card.html preview mount the real component source without depending
   on any build step: it fetches each .jsx, strips the `import React` line
   (React/ReactDOM are expected as globals), transpiles JSX with Babel
   standalone, and collects every `export function`/`export const` onto a
   returned namespace object.

   Usage inside a card (after react, react-dom, and @babel/standalone loaded):
     const { Button } = await window.loadDS(["../buttons/Button.jsx"]);
*/
(function () {
  async function loadOne(url, ns) {
    let src = await (await fetch(url)).text();
    // Drop React imports — React is a global here.
    src = src.replace(/^\s*import\s+[^;]*?from\s*["']react["'];?\s*$/gm, "");
    src = src.replace(/^\s*import\s+[^;]*?from\s*["']react-dom["'];?\s*$/gm, "");
    // Rewrite local relative imports to read from the shared namespace object.
    src = src.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']\.\/[^"']+["'];?/g,
      (_m, names) => names.split(",").map(function (n) {
        n = n.trim();
        return "const " + n + " = __ns." + n + ";";
      }).join(" ")
    );
    // Turn `export function X`/`export const X` into namespace assignments.
    src = src.replace(/export\s+function\s+([A-Za-z0-9_]+)/g, "__ns.$1 = function $1");
    src = src.replace(/export\s+const\s+([A-Za-z0-9_]+)/g, "__ns.$1 = ");
    const out = Babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;
    // eslint-disable-next-line no-new-func
    new Function("React", "ReactDOM", "__ns", out)(window.React, window.ReactDOM, ns);
  }

  window.loadDS = async function (urls) {
    const ns = {};
    for (const u of urls) await loadOne(u, ns);
    return ns;
  };

  // Auto-runner: any <script type="text/x-demo" data-deps="a.jsx,b.jsx"> is
  // loaded after its deps, with each exported name destructured into scope and
  // JSX compiled with the classic runtime (React.createElement).
  async function runDemos() {
    const blocks = document.querySelectorAll('script[type="text/x-demo"]');
    for (const block of blocks) {
      const deps = (block.dataset.deps || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      const ns = await window.loadDS(deps);
      const names = Object.keys(ns);
      const header = names.map(function (n) { return "const " + n + " = __ns." + n + ";"; }).join("\n");
      const out = Babel.transform(header + "\n" + block.textContent, { presets: [["react", { runtime: "classic" }]] }).code;
      // eslint-disable-next-line no-new-func
      new Function("React", "ReactDOM", "__ns", out)(window.React, window.ReactDOM, ns);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runDemos);
  } else {
    runDemos();
  }
})();
