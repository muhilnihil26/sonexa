import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const clientDir = join(root, ".vercel", "output", "static");
const targetDir = join(root, "build", "capacitor-web");
const assetDir = join(clientDir, "assets");

if (!existsSync(clientDir)) {
  throw new Error("Run npm run build before preparing the Android web bundle.");
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(clientDir, targetDir, { recursive: true });
for (const download of ["sonexa.apk", "sonexa-windows-installer.exe"]) {
  rmSync(join(targetDir, download), { force: true });
}

const assets = readdirSync(assetDir);
const entryScript = assets.find((name) => {
  if (!/^index-.*\.js$/.test(name)) return false;
  return readFileSync(join(assetDir, name), "utf8").includes("hydrateRoot(document");
});
const stylesheet = assets.find((name) => /^styles-.*\.css$/.test(name));

if (!entryScript || !stylesheet) {
  throw new Error("Could not find the generated Sonexa client entry assets.");
}

const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#08080c" />
    <title>Sonexa</title>
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="stylesheet" href="./assets/${stylesheet}" />
  </head>
  <body class="bg-background text-foreground antialiased">
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations?.().then((items) => {
          items.forEach((item) => item.unregister());
        });
      }
      if ("caches" in window) {
        caches.keys?.().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    </script>
    <div id="sonexa-native-boot" style="position:fixed;inset:0;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:system-ui,sans-serif">
      <div style="text-align:center">
        <img src="./logo-icon.png" alt="Sonexa" style="width:72px;height:72px;margin:0 auto 18px;border-radius:18px;background:#fff" />
        <div style="font-size:18px;font-weight:800">Sonexa</div>
        <div style="margin-top:8px;color:#aaa;font-size:13px">Opening music...</div>
      </div>
    </div>
    <script>
      window.addEventListener("error", function (event) {
        var boot = document.getElementById("sonexa-native-boot");
        if (!boot) return;
        boot.innerHTML = '<div style="max-width:320px;text-align:center;padding:24px"><img src="./logo-icon.png" alt="Sonexa" style="width:64px;height:64px;margin:0 auto 18px;border-radius:16px;background:#fff" /><div style="font-size:18px;font-weight:800">Sonexa could not open</div><div style="margin-top:10px;color:#aaa;font-size:13px">Update Android System WebView or connect once to the internet, then reopen the app.</div></div>';
      });
      window.setTimeout(function () {
        var boot = document.getElementById("sonexa-native-boot");
        if (boot && !document.querySelector("#root, [data-router-root], main")) {
          boot.style.display = "grid";
        }
      }, 5000);
    </script>
    <script type="module" src="./assets/${entryScript}"></script>
  </body>
</html>
`;

writeFileSync(join(targetDir, "index.html"), html);

for (const icon of ["logo.png", "logo-icon.png", "favicon.ico", "manifest.webmanifest"]) {
  const source = join(root, "public", icon);
  if (existsSync(source)) copyFileSync(source, join(targetDir, icon));
}
