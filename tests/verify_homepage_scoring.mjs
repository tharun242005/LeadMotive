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

  console.log("Navigating to http://localhost:3000/...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Verify 3 tabs
  const tabs = await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#scoring button'));
      return btns.slice(0, 3).map(b => ({
        name: b.querySelector('.truncate')?.innerText,
        badge: b.querySelector('[class*="badge-priority"]')?.innerText,
        classes: b.querySelector('[class*="badge-priority"]')?.className
      }));
    })()`,
    returnByValue: true,
  });
  console.log("Interactive Showcase Tabs:", JSON.stringify(tabs.result?.value, null, 2));

  // 2. Click "Scoring Model" in top nav
  console.log("Clicking 'Scoring Model' link in navbar...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const link = document.querySelector('header a[href="#scoring"]');
      if (link) link.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const scrollPos = await send("Runtime.evaluate", {
    expression: `(() => {
      const sec = document.querySelector('#scoring');
      const rect = sec.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        sectionTopRelativeToViewport: Math.round(rect.top),
        sectionVisible: rect.top >= -20 && rect.top <= 120
      };
    })()`,
    returnByValue: true,
  });
  console.log("Scroll position after clicking Scoring Model:", scrollPos.result?.value);

  // Capture screenshot of landing view
  const shotLanding = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("docs/qa/homepage_scoring_model_landing.png", Buffer.from(shotLanding.data, "base64"));
  console.log("Saved docs/qa/homepage_scoring_model_landing.png");

  // 3. Click Deepak Gowda tab (Nurture)
  console.log("Clicking Deepak Gowda (Nurture) tab...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#scoring button'));
      const deepakBtn = btns.find(b => b.innerText.includes('Deepak'));
      if (deepakBtn) deepakBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const deepakState = await send("Runtime.evaluate", {
    expression: `(() => {
      const card = document.querySelector('#scoring');
      return {
        activeCustomerMessage: card.querySelector('blockquote')?.innerText,
        scoreTotal: card.querySelector('.font-mono.text-3xl')?.innerText?.trim(),
        scoreBadge: card.querySelector('.font-mono.text-3xl')?.closest('.space-y-4')?.querySelector('[class*="badge-priority"]')?.innerText
      };
    })()`,
    returnByValue: true,
  });
  console.log("Deepak Gowda Active State:", JSON.stringify(deepakState.result?.value, null, 2));

  const shotDeepak = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("docs/qa/homepage_nurture_deepak_active.png", Buffer.from(shotDeepak.data, "base64"));
  console.log("Saved docs/qa/homepage_nurture_deepak_active.png");

  ws.close();
}

main().catch(console.error);
