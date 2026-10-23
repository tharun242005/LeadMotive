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
  await new Promise((r) => setTimeout(r, 1500));

  const data = await send("Runtime.evaluate", {
    expression: `(() => {
      const stored = JSON.parse(localStorage.getItem('leadmotive_leads_v1') || '[]');
      return stored.map(l => ({
        id: l.id,
        name: l.name,
        score: l.priority.total,
        band: l.priority.band,
        factors: l.priority.factors.map(f => ({ name: f.name, points: f.points }))
      }));
    })()`,
    returnByValue: true,
  });

  console.log("Stored Leads in Workspace:", JSON.stringify(data.result?.value, null, 2));

  ws.close();
}

main().catch(console.error);
