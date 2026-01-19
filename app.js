// 1) After you create the Worker (Step 3), paste its URL here:
const WORKER_ENDPOINT = "https://uk-companies-house-directorship-builder.samarthasrv.workers.dev"; // e.g. https://directorship-proxy.YOURNAME.workers.dev

const form = document.getElementById("form");
const statusBox = document.getElementById("status");
const results = document.getElementById("results");
const tbody = document.getElementById("tbody");
const copyBtn = document.getElementById("copyBtn");

function setStatus(msg, isError=false) {
  statusBox.style.display = "block";
  statusBox.textContent = msg;
  statusBox.className = "status" + (isError ? " error" : "");
}

function clearStatus() {
  statusBox.style.display = "none";
  statusBox.textContent = "";
  statusBox.className = "status";
}

function renderRows(rows) {
  tbody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");

    const td1 = document.createElement("td");
    td1.textContent = r.company;

    const td2 = document.createElement("td");
    td2.textContent = r.appointment;

    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  }
  results.style.display = "block";
}

function tableToTSV() {
  const lines = [];
  lines.push(["Company", "Appointment"].join("\t"));
  for (const tr of tbody.querySelectorAll("tr")) {
    const cells = Array.from(tr.querySelectorAll("td")).map(td =>
      td.innerText.replace(/\s+/g, " ").trim()
    );
    lines.push(cells.join("\t"));
  }
  return lines.join("\n");
}

copyBtn.addEventListener("click", async () => {
  const tsv = tableToTSV();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(tsv);
  } else {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  setStatus("Copied table to clipboard.");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearStatus();
  results.style.display = "none";

  if (!WORKER_ENDPOINT || WORKER_ENDPOINT.includes("PASTE_YOUR_WORKER_URL_HERE")) {
    setStatus("You must paste your Cloudflare Worker URL into app.js first.", true);
    return;
  }

  const url = document.getElementById("url").value.trim();
  const activeOnly = document.getElementById("activeOnly").checked;

  try {
    setStatus("Fetching appointments…");
    const apiUrl = new URL(WORKER_ENDPOINT);
    apiUrl.searchParams.set("url", url);
    if (activeOnly) apiUrl.searchParams.set("active_only", "1");

    const resp = await fetch(apiUrl.toString());
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.error || `Error ${resp.status}`);
    }

    renderRows(data.rows || []);
    setStatus(`Done. ${data.count ?? (data.rows?.length ?? 0)} rows.`);
  } catch (err) {
    setStatus(String(err?.message || err), true);
  }
});
