// Headless browser smoke test against the deployed SPA using the DevTools Protocol.
// Node 24 provides a global WebSocket.
//
// Usage:
//   1. Start a browser with remote debugging (unique profile so it does not
//      attach to an already-running instance):
//        msedge --headless=new --disable-gpu --remote-debugging-port=9223 \
//               --user-data-dir=%TEMP%\cdp-test about:blank
//   2. Run:
//        set SITE=https://verisure-ai.vercel.app
//        set LOGIN_EMAIL=admin@verisure.local
//        set LOGIN_PASSWORD=<admin password>
//        node browser_test.mjs

const PORT = Number(process.env.CDP_PORT || 9223);
const BASE = process.env.SITE || "https://verisure-ai.vercel.app";
const EMAIL = process.env.LOGIN_EMAIL || "";
const PASSWORD = process.env.LOGIN_PASSWORD || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // browser not ready yet
    }
    await sleep(500);
  }
  throw new Error("Could not connect to the browser");
}

function connect(url) {
  const ws = new WebSocket(url);
  let nextId = 1;
  const pending = new Map();
  const events = [];

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  return { ws, ready, send, events };
}

async function main() {
  const target = await getTarget();
  const { ready, send, ws } = connect(target.webSocketDebuggerUrl);
  await ready;

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");

  const consoleErrors = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(msg.params?.exceptionDetails?.text || "exception");
    }
    if (msg.method === "Log.entryAdded" && msg.params?.entry?.level === "error") {
      consoleErrors.push(msg.params.entry.text);
    }
  });

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }
    return result.result.value;
  };

  const navigate = async (url, waitMs = 5000) => {
    await send("Page.navigate", { url });
    await sleep(waitMs);
  };

  const waitForText = async (needle, timeoutMs = 25000) => {
    const deadline = Date.now() + timeoutMs;
    const pattern = needle instanceof RegExp ? needle : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    let text = "";
    while (Date.now() < deadline) {
      text = await evaluate("document.body.innerText");
      if (pattern.test(text)) return text;
      await sleep(750);
    }
    return text;
  };

  const report = [];
  const check = (name, ok, detail = "") => {
    report.push({ name, ok, detail });
    console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` :: ${detail}` : ""}`);
  };

  // 1. Landing page
  await navigate(`${BASE}/`);
  let text = await evaluate("document.body.innerText");
  check("landing renders", text.includes("Trustworthy decisions"), text.slice(0, 80).replace(/\n/g, " "));
  check("landing is public", text.includes("Sign In"));

  // 2. Authenticate through the real API from the page origin
  if (EMAIL && PASSWORD) {
    const token = await evaluate(`
      (async () => {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: ${JSON.stringify(EMAIL)}, password: ${JSON.stringify(PASSWORD)} }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        return data.access_token;
      })()
    `);
    check("api login from browser origin", Boolean(token));

    if (token) {
      await navigate(`${BASE}/dashboard`);
      text = await waitForText(/total submissions/i);
      check("dashboard renders", text.includes("Executive Regulatory Oversight"), text.slice(0, 90).replace(/\n/g, " "));
      check("dashboard shows metrics", /total submissions/i.test(text));
      check(
        "dashboard metrics populated",
        /TOTAL SUBMISSIONS[\s\S]{0,60}?\d/i.test(text),
        (text.match(/TOTAL SUBMISSIONS[\s\S]{0,40}/i) || [""])[0].replace(/\n/g, " ")
      );
      check("sidebar identity loaded", text.includes("admin@verisure.local") || text.includes("Administrator"));

      await navigate(`${BASE}/applications`);
      text = await waitForText("Institutional Applications Registry");
      check("applications registry renders", text.includes("Institutional Applications Registry"));
      check("registry has create action", /new .*application|create/i.test(text));

      // Create an application through the real UI form.
      const orgName = `Browser Test Institute ${Date.now().toString().slice(-6)}`;
      const opened = await evaluate(`(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find((b) => /new institutional application/i.test(b.textContent || ''));
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      check("create dialog opens", opened);
      await sleep(600);

      const filled = await evaluate(`(() => {
        const setValue = (el, value) => {
          const proto = el instanceof HTMLSelectElement
            ? window.HTMLSelectElement.prototype
            : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const form = document.querySelector('form');
        if (!form) return { ok: false, reason: 'no form' };
        const inputs = Array.from(form.querySelectorAll('input'));
        const select = form.querySelector('select');
        if (!select || inputs.length < 3) return { ok: false, reason: 'missing fields' };
        setValue(inputs[0], ${JSON.stringify(orgName)});
        setValue(select, 'New Establishment');
        setValue(inputs[1], 'REG-UI-TEST-001');
        setValue(inputs[2], 'ui.test@institute.edu');
        return { ok: true, values: [inputs[0].value, select.value] };
      })()`);
      check("create dialog fields accept input", Boolean(filled?.ok), JSON.stringify(filled));

      const submitted = await evaluate(`(() => {
        const form = document.querySelector('form');
        if (!form) return false;
        const btn = Array.from(form.querySelectorAll('button'))
          .find((b) => /create application/i.test(b.textContent || ''));
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      check("create dialog submits", submitted);

      text = await waitForText(orgName, 30000);
      check("new application appears in registry", text.includes(orgName), orgName);

      await navigate(`${BASE}/compliance`);
      text = await waitForText("Compliance");
      check("compliance page renders", text.includes("Compliance"));

      await navigate(`${BASE}/settings`);
      text = await waitForText("Storage");
      check("settings renders", text.includes("Settings") || text.includes("Preferences"));
      check("settings shows real storage backend", /PostgreSQL|SQLite/.test(text));

      // Remaining authenticated routes must render without crashing.
      const pages = [
        ["/reports", "Reports & Analytics"],
        ["/notifications", "Notifications"],
        ["/evidence", "Evidence Requests"],
        ["/document-intelligence", "Document Intelligence"],
        ["/document-auth", "Document Authentication"],
        ["/upload", "Document Upload Center"],
        ["/audit", "Audit History"],
        ["/rules", "Rules Engine"],
        ["/profile", "Profile"],
      ];
      for (const [path, heading] of pages) {
        await navigate(`${BASE}${path}`);
        text = await waitForText(heading, 20000);
        check(`${path} renders`, text.includes(heading), text.slice(0, 60).replace(/\n/g, " "));
      }

      // 404 route
      await navigate(`${BASE}/this-page-does-not-exist`);
      text = await waitForText(/404|not found/i, 15000);
      check("unknown route shows 404 page", /404|not found/i.test(text));

      // Deep-link refresh while authenticated
      await navigate(`${BASE}/applications/does-not-exist`);
      text = await waitForText("not found", 15000);
      check("deep link handles missing record", /not found/i.test(text));

      // Logout state
      await evaluate("localStorage.removeItem('token')");
      await navigate(`${BASE}/dashboard`);
      text = await evaluate("document.body.innerText");
      check("guard redirects after logout", text.includes("Sign In") || text.includes("Password"));
    }
  } else {
    // Unauthenticated guard check
    await navigate(`${BASE}/dashboard`);
    text = await evaluate("document.body.innerText");
    check("guard redirects when signed out", text.includes("Sign In") || text.includes("Password"));
  }

  // A missing application is exercised on purpose, so its 404 is expected.
  const fatal = consoleErrors.filter(
    (e) =>
      !/favicon|manifest/i.test(e) &&
      !/does-not-exist/i.test(e) &&
      !/status of 404/i.test(e)
  );
  check("no uncaught JS errors", fatal.length === 0, fatal.slice(0, 2).join(" | "));

  ws.close();
  const passed = report.filter((r) => r.ok).length;
  console.log("\n" + "=".repeat(50));
  console.log(`BROWSER PASS: ${passed}   FAIL: ${report.length - passed}`);
  console.log("=".repeat(50));
  if (passed !== report.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("BROWSER TEST ERROR:", err.message);
  process.exitCode = 1;
});
