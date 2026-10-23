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

  console.log("=== Testing Homepage to Workspace Redirection ===");

  // Test 1: Click Arjun Reddy (Follow Up) on Homepage and launch workspace
  console.log("\n[1/3] Navigating to Homepage...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 1500));

  console.log("Clicking Arjun Reddy tab in showcase...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#scoring button'));
      const arjunBtn = btns.find(b => b.innerText.includes('Arjun'));
      if (arjunBtn) arjunBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  console.log("Clicking 'Open this lead in Workspace' button...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const link = document.querySelector('a[href*="/workspace?leadId="]');
      if (link) link.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const arjunWorkspace = await send("Runtime.evaluate", {
    expression: `(() => {
      return {
        url: window.location.href,
        selectedLeadTitle: document.querySelector('main h1')?.innerText,
        scoreBadge: document.querySelector('main [class*="badge-priority"]')?.innerText
      };
    })()`,
    returnByValue: true,
  });
  console.log("Result after launching Arjun Reddy:", arjunWorkspace.result?.value);

  // Test 2: Click Deepak Gowda (Nurture) on Homepage and launch workspace
  console.log("\n[2/3] Returning to Homepage...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 1500));

  console.log("Clicking Deepak Gowda tab in showcase...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#scoring button'));
      const deepakBtn = btns.find(b => b.innerText.includes('Deepak'));
      if (deepakBtn) deepakBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  console.log("Clicking 'Open this lead in Workspace' button...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const link = document.querySelector('a[href*="/workspace?leadId="]');
      if (link) link.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const deepakWorkspace = await send("Runtime.evaluate", {
    expression: `(() => {
      return {
        url: window.location.href,
        selectedLeadTitle: document.querySelector('main h1')?.innerText,
        scoreBadge: document.querySelector('main [class*="badge-priority"]')?.innerText
      };
    })()`,
    returnByValue: true,
  });
  console.log("Result after launching Deepak Gowda:", deepakWorkspace.result?.value);

  // Test 3: Click Priya Sharma (Act Now) on Homepage and launch workspace
  console.log("\n[3/3] Returning to Homepage...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 1500));

  console.log("Clicking Priya Sharma tab in showcase...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#scoring button'));
      const priyaBtn = btns.find(b => b.innerText.includes('Priya'));
      if (priyaBtn) priyaBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  console.log("Clicking 'Open this lead in Workspace' button...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const link = document.querySelector('a[href*="/workspace?leadId="]');
      if (link) link.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const priyaWorkspace = await send("Runtime.evaluate", {
    expression: `(() => {
      return {
        url: window.location.href,
        selectedLeadTitle: document.querySelector('main h1')?.innerText,
        scoreBadge: document.querySelector('main [class*="badge-priority"]')?.innerText
      };
    })()`,
    returnByValue: true,
  });
  console.log("Result after launching Priya Sharma:", priyaWorkspace.result?.value);

  ws.close();
}

main().catch(console.error);
