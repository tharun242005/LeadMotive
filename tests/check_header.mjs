import fs from "node:fs";

async function main() {
  const res = await fetch("http://localhost:9222/json/list");
  const pages = await res.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("localhost:3000")) || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === cur) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

  await send("Page.navigate", { url: "http://localhost:3000/workspace" });
  await new Promise((r) => setTimeout(r, 2000));

  const rects = await send("Runtime.evaluate", {
    expression: `(() => {
      const badges = Array.from(document.querySelectorAll('button[title*="Act Now"], button[title*="Follow Up"], button[title*="Nurture"]'));
      return badges.map(b => ({
        text: b.innerText.trim(),
        width: Math.round(b.getBoundingClientRect().width),
        height: Math.round(b.getBoundingClientRect().height)
      }));
    })()`,
    returnByValue: true,
  });

  console.log("Badge dimensions:", JSON.stringify(rects.result?.value, null, 2));

  // Capture screenshot of the queue header
  const clip = await send("Runtime.evaluate", {
    expression: `(() => {
      const header = document.querySelector('h2');
      const box = header.closest('.border-b').getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 };
    })()`,
    returnByValue: true,
  });

  console.log("Clip bounds:", clip.result?.value);
  if (clip.result?.value) {
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      clip: clip.result.value,
    });
    fs.writeFileSync("docs/qa/lead_queue_header_day.png", Buffer.from(shot.data, "base64"));
    console.log("Saved cropped header screenshot to docs/qa/lead_queue_header_day.png");
  }

  // Switch to Night Mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('leadmotive_theme', 'dark');
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  if (clip.result?.value) {
    const shotDark = await send("Page.captureScreenshot", {
      format: "png",
      clip: clip.result.value,
    });
    fs.writeFileSync("docs/qa/lead_queue_header_night.png", Buffer.from(shotDark.data, "base64"));
    console.log("Saved cropped night header screenshot to docs/qa/lead_queue_header_night.png");
  }

  // Switch back to Day Mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('leadmotive_theme', 'light');
    })()`,
  });

  // Also update full workspace screenshots for qa evidence
  const fullShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("docs/qa/01_workspace_day_mode_badges.png", Buffer.from(fullShot.data, "base64"));

  ws.close();
}

main().catch(console.error);
