/* ===== state & helpers ===== */
let db = {
  sheets: [], // income / បច្ច័យបុណ្យ
  cur: null,
  expSheets: [], // expense / ចំណាយ
  expCur: null,
};
let edit = null;
let mode = localStorage.getItem("dr_mode") || "income";

try {
  const saved = JSON.parse(localStorage.getItem("dr_db")) || {};
  db = {
    sheets: saved.sheets || [],
    cur: saved.cur || null,
    expSheets: saved.expSheets || [],
    expCur: saved.expCur || null,
  };
} catch (e) {}

const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const save = () => {
  try {
    localStorage.setItem("dr_db", JSON.stringify(db));
  } catch (e) {}
};

/* how many KHR per 1 USD — used only for the combined total display */
const EXCHANGE_RATE_KHR_PER_USD = 4000;

/* ---- mode-aware accessors ---- */
const isExpense = () => mode === "expense";
const sheetsRef = () => (isExpense() ? db.expSheets : db.sheets);
const curRef = () => (isExpense() ? db.expCur : db.cur);
const setCurRef = (id) => {
  if (isExpense()) db.expCur = id;
  else db.cur = id;
};

const cur = () => sheetsRef().find((s) => s.id === curRef());

const sums = (es) => {
  const t = { KHR: 0, USD: 0 };
  es.forEach((e) => (t[e.cur] = (t[e.cur] || 0) + (+e.amt || 0)));
  return t;
};
const money = (t) =>
  `${(t.KHR || 0).toLocaleString()} ${STR.curKHR} &nbsp;|&nbsp; ${(t.USD || 0).toLocaleString()} ${STR.curUSD}`;

/* combined totals (KHR-only view and USD-only view) */
const grandTotals = (t) => {
  const usdOnly = (t.USD || 0) + (t.KHR || 0) / EXCHANGE_RATE_KHR_PER_USD;
  const khrOnly = (t.KHR || 0) + (t.USD || 0) * EXCHANGE_RATE_KHR_PER_USD;
  return {
    usd: `$${usdOnly.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    khr: `${khrOnly.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${STR.curKHR}`,
  };
};

const th = (a) => a.map((h) => `<th>${esc(h)}</th>`).join("");
const C = STR.cols;

/* unit label + amount cell (shows e.g. 100,000 KHR (10 ម៉ឺន)) */
const unitLabel = (m) => UNITS.find((u) => u.mult === m)?.label || "";
const amtCell = (e) => {
  const curLabel = e.cur === "USD" ? STR.curUSD : STR.curKHR;
  return (
    `${(+e.amt).toLocaleString()} ${curLabel}` +
    (e.unit > 1 && unitLabel(e.unit)
      ? ` <small class="mu">(${e.qty} ${esc(unitLabel(e.unit))})</small>`
      : "")
  );
};

/* Khmer numerals + Khmer date text ("2026-10-05" -> "៥ តុលា ២០២៦") */
const kh = (n) => String(n).replace(/\d/g, (d) => STR.digits[d]);
function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return STR.dateShort(kh(+d), STR.months[+m - 1], kh(y));
}
/* Khmer calendar popup. Hidden input #X holds yyyy-mm-dd, readonly input #X_show shows it in Khmer */
let calId = null,
  calY = 0,
  calM = 0;
function showDate(id) {
  $(id + "_show").value = fmtDate($(id).value);
}
function openDate(id) {
  calId = id;
  [calY, calM] = ($(id).value || today()).split("-").map(Number);
  calM -= 1;
  drawCal();
  const c = $("cal"),
    r = $(id + "_show").getBoundingClientRect();
  c.classList.add("on");
  c.style.top = r.bottom + scrollY + 4 + "px";
  c.style.left =
    Math.max(8, Math.min(r.left + scrollX, innerWidth - c.offsetWidth - 8)) +
    "px";
}
function drawCal() {
  const first = new Date(calY, calM, 1).getDay(),
    days = new Date(calY, calM + 1, 0).getDate();
  const sel = $(calId).value,
    td = today();
  let cells =
    STR.weekdays.map((w) => `<span>${w}</span>`).join("") +
    "<span></span>".repeat(first);
  for (let d = 1; d <= days; d++) {
    const k = `${calY}-${String(calM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells += `<button type="button" class="${k === sel ? "on" : k === td ? "t" : ""}" onclick="calPick('${k}')">${kh(d)}</button>`;
  }
  $("cal").innerHTML =
    `<div class="cal-h"><button onclick="calNav(0,-1)">«</button><button onclick="calNav(-1,0)">‹</button>
    <b>${STR.months[calM]} ${kh(calY)}</b><button onclick="calNav(1,0)">›</button><button onclick="calNav(0,1)">»</button></div>
    <div class="cal-g">${cells}</div>
    <div class="cal-f"><button onclick="calPick('${td}')">${STR.todayBtn}</button></div>`;
}
function calNav(dm, dy) {
  calM += dm;
  calY += dy;
  if (calM < 0) {
    calM = 11;
    calY--;
  }
  if (calM > 11) {
    calM = 0;
    calY++;
  }
  drawCal();
}
function calPick(k) {
  $(calId).value = k;
  showDate(calId);
  closeCal();
}
function closeCal() {
  $("cal").classList.remove("on");
  calId = null;
}

/* ===== MODAL DIALOG CONTROLLER ===== */
function showAlert(message, title = STR.modalTitleWarning) {
  return new Promise((resolve) => {
    $("modalTitle").textContent = title;
    $("modalMsg").textContent = message;
    $("modalIcon").textContent = "!";
    $("modalActions").innerHTML =
      `<button class="p" id="modalOkBtn">${STR.btnOk}</button>`;
    const overlay = $("appModal");
    overlay.classList.add("active");
    $("modalOkBtn").onclick = () => {
      overlay.classList.remove("active");
      resolve();
    };
  });
}
function showConfirm(message, title = STR.modalTitleConfirm) {
  return new Promise((resolve) => {
    $("modalTitle").textContent = title;
    $("modalMsg").textContent = message;
    $("modalIcon").textContent = "?";
    $("modalActions").innerHTML = `
      <button id="modalCancelBtn">${STR.btnCancel}</button>
      <button class="p" id="modalConfirmBtn">${STR.btnConfirm}</button>`;
    const overlay = $("appModal");
    overlay.classList.add("active");
    $("modalCancelBtn").onclick = () => {
      overlay.classList.remove("active");
      resolve(false);
    };
    $("modalConfirmBtn").onclick = () => {
      overlay.classList.remove("active");
      resolve(true);
    };
  });
}

function showPrompt(message, value = "", title = STR.modalTitleConfirm) {
  return new Promise((resolve) => {
    $("modalTitle").textContent = title;
    $("modalMsg").innerHTML =
      `${esc(message)}<input id="modalInput" class="modal-input">`;
    $("modalIcon").textContent = "✎";
    $("modalActions").innerHTML =
      `<button id="modalCancelBtn">${STR.btnCancel}</button><button class="p" id="modalConfirmBtn">${STR.btnConfirm}</button>`;
    const overlay = $("appModal"),
      inp = $("modalInput");
    const done = (v) => {
      overlay.classList.remove("active");
      resolve(v);
    };
    inp.value = value;
    overlay.classList.add("active");
    setTimeout(() => {
      inp.focus();
      inp.select();
    }, 30);
    inp.onkeydown = (e) => {
      if (e.key === "Enter") done(inp.value);
      if (e.key === "Escape") done(null);
    };
    $("modalCancelBtn").onclick = () => done(null);
    $("modalConfirmBtn").onclick = () => done(inp.value);
  });
}

function applyStrings() {
  document.title = STR.title;
  document
    .querySelectorAll("[data-s]")
    .forEach((el) => (el.textContent = STR[el.dataset.s]));
  document
    .querySelectorAll("[data-ph]")
    .forEach((el) => (el.placeholder = STR[el.dataset.ph]));

  // ----- presets (income) -----
  const ip = $("presets");
  if (ip && !ip.dataset.built) {
    PRESETS.forEach((p) => {
      const b = document.createElement("button");
      b.textContent = p;
      b.onclick = () => ($("sn").value = p);
      ip.append(b);
    });
    ip.dataset.built = "1";
  }

  // ----- presets (expense) -----
  const ep = $("presetsExp");
  if (ep && !ep.dataset.built) {
    PRESETS_EXP.forEach((p) => {
      const b = document.createElement("button");
      b.textContent = p;
      b.onclick = () => ($("snExp").value = p);
      ep.append(b);
    });
    ep.dataset.built = "1";
  }

  // ----- currency filter (same both modes) -----
  $("f_cur_filter").innerHTML =
    `<option value="ALL">${esc(STR.filterCur)}</option><option value="KHR">${esc(STR.curKHR)}</option><option value="USD">${esc(STR.curUSD)}</option>`;

  // ----- method filter (per-mode options) -----
  buildMethodFilter();
}

/* rebuild method filter based on current mode, keeping any valid selection */
function buildMethodFilter() {
  const sel = $("f_met_filter");
  if (!sel) return;
  const methods = isExpense() ? METHODS_EXP : METHODS;
  const keep = sel.value;
  sel.innerHTML =
    `<option value="ALL">${esc(STR.filterMet)}</option>` +
    methods.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
  sel.value = methods.includes(keep) ? keep : "ALL";
}

/* ===== MODE SWITCHING ===== */
function setMode(m) {
  if (m !== "income" && m !== "expense") return;
  mode = m;
  localStorage.setItem("dr_mode", m);
  edit = null;
  $("q").value = "";
  $("f_cur_filter").value = "ALL";
  $("f_met_filter").value = "ALL";
  syncModeUI();
  render();
}

function syncModeUI() {
  const exp = isExpense();
  document
    .querySelectorAll(".tabs .tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  const pi = $("panelIncome");
  const pe = $("panelExpense");
  if (pi && pe) {
    pi.hidden = exp;
    pe.hidden = !exp;
  }
  $("q").placeholder = exp
    ? "ស្វែងរក (ឈ្មោះទំនិញ / អ្នកទទួលប្រាក់, កំណត់សម្គាល់...)"
    : STR.search;

  buildMethodFilter();
}

/* ===== sheets ===== */
async function addSheet() {
  const inputId = isExpense() ? "snExp" : "sn";
  const n = $(inputId).value.trim();
  if (!n) return await showAlert(STR.needSheetName);
  const s = { id: uid(), name: n, date: today(), entries: [], tick: false };
  sheetsRef().push(s);
  setCurRef(s.id);
  $(inputId).value = "";
  edit = null;
  save();
  render();
}
async function renameSheet(id) {
  const s = sheetsRef().find((x) => x.id === id);
  const n = await showPrompt(STR.renamePrompt, s.name, STR.renameTitle);
  if (n === null) return;
  if (!n.trim()) return await showAlert(STR.needSheetName);
  s.name = n.trim();
  save();
  render();
}
async function delSheet(id) {
  const s = sheetsRef().find((x) => x.id === id);
  if (!(await showConfirm(STR.delSheetConfirm(s.name, s.entries.length))))
    return;
  const arr = sheetsRef();
  const i = arr.findIndex((x) => x.id === id);
  arr.splice(i, 1);
  if (curRef() === id) setCurRef(arr[0]?.id || null);
  save();
  render();
}
function pick(id) {
  setCurRef(id);
  edit = null;
  $("q").value = "";
  save();
  render();
}
function tick(id, v) {
  sheetsRef().find((s) => s.id === id).tick = v;
  save();
}

/* ===== entries ===== */
/* amount = typed number x unit (ពាន់, ម៉ឺន, លាន...) */
const calcAmt = () =>
  Math.round(
    (parseFloat($("f_amt").value) || 0) * (+$("f_unit").value || 1) * 100,
  ) / 100;
function calc() {
  const v = calcAmt();
  $("f_calc").textContent =
    +$("f_unit").value > 1 && v
      ? `= ${v.toLocaleString()} ${$("f_cur").value === "USD" ? STR.curUSD : STR.curKHR}`
      : "";
}

async function addEntry() {
  const s = cur(),
    g = (id) => $(id).value.trim();
  const e = {
    id: edit || uid(),
    date: g("f_date") || today(),
    name: g("f_name"),
    amt: calcAmt(),
    qty: parseFloat($("f_amt").value) || 0,
    unit: +$("f_unit").value || 1,
    cur: $("f_cur").value,
    method: $("f_met").value,
    note: g("f_note"),
  };
  $("f_name").style.borderColor = "";
  $("f_amt").style.borderColor = "";

  const missing = [];
  if (!e.name) {
    $("f_name").style.borderColor = "red";
    missing.push(STR.needName);
  }
  if (!e.amt) {
    $("f_amt").style.borderColor = "red";
    missing.push(STR.needAmt);
  }
  if (missing.length) {
    await showAlert(missing.join("\n"));
    $(!e.name ? "f_name" : "f_amt").focus();
    return;
  }

  // duplicate-name warning only on the income side (expenses often repeat the same payee)
  if (!edit && !isExpense()) {
    const dup = s.entries.find(
      (x) => x.name.toLowerCase() === e.name.toLowerCase(),
    );
    if (dup && !(await showConfirm(STR.dupConfirm(e.name)))) return;
  }
  if (edit) s.entries = s.entries.map((x) => (x.id === edit ? e : x));
  else s.entries.push(e);
  edit = null;
  save();
  render();
  $("f_name").focus();
}
function editEntry(id) {
  edit = id;
  render();
  const e = cur().entries.find((x) => x.id === id);
  $("f_date").value = e.date;
  showDate("f_date");
  $("f_name").value = e.name;
  const hasU = UNITS.some((u) => u.mult === e.unit);
  $("f_amt").value = hasU ? e.qty : e.amt;
  $("f_unit").value = hasU ? e.unit : 1;
  $("f_cur").value = e.cur;
  $("f_met").value = e.method;
  $("f_note").value = e.note;
  calc();
  $("f_name").focus();
}
async function delEntry(id) {
  if (!(await showConfirm(STR.delEntryConfirm))) return;
  const s = cur();
  s.entries = s.entries.filter((e) => e.id !== id);
  save();
  render();
}

/* ===== screen ===== */
function render() {
  const exp = isExpense();

  // ----- sheet list (left panel, mode-specific container) -----
  const listEl = exp ? $("listExp") : $("list");
  if (listEl) {
    listEl.innerHTML =
      sheetsRef()
        .map(
          (s) => `<div class="sh ${s.id === curRef() ? "on" : ""}">
      <input type="checkbox" ${s.tick ? "checked" : ""} onchange="tick('${s.id}',this.checked)">
      <span onclick="pick('${s.id}')">${esc(s.name)}</span>
      <button class="s" title="${esc(STR.renameBtn)}" onclick="renameSheet('${s.id}')">✎</button>
      <button class="s" onclick="delSheet('${s.id}')">✕</button></div>`,
        )
        .join("") ||
      `<div class="mu">${exp ? STR.expNoEntries : STR.noSheets}</div>`;
  }

  const q = $("q").value.trim().toLowerCase();
  const curFilter = $("f_cur_filter").value;
  const metFilter = $("f_met_filter").value;
  const m = $("main");

  // ----- matching predicate -----
  const matchEntry = (e) =>
    (!q || [e.name, e.note, e.method].join(" ").toLowerCase().includes(q)) &&
    (curFilter === "ALL" || e.cur === curFilter) &&
    (metFilter === "ALL" || e.method === metFilter);

  // ----- global search mode (across all sheets of current mode) -----
  if (q || curFilter !== "ALL" || metFilter !== "ALL") {
    const hits = [];
    sheetsRef().forEach((s) =>
      s.entries.forEach((e) => {
        if (matchEntry(e)) hits.push([s, e]);
      }),
    );
    const ht = sums(hits.map((h) => h[1]));
    const g = grandTotals(ht);
    m.innerHTML = `<div class="card"><h3>${STR.results}: ${kh(hits.length)}</h3>
  <div class="tot-row mb">
    <span class="tot">${STR.total}: ${money(ht)}</span>
    <span class="tot">${STR.grandInKHR}: ${g.khr}</span>
    <span class="tot">${STR.grandInUSD}: ${g.usd}</span>
  </div><div class="wide"><table>
  <tr>${th([C.sheet, C.name, C.amt, C.method, C.note, C.date])}<th></th></tr>
  ${
    hits
      .map(
        ([s, e]) =>
          `<tr><td>${esc(s.name)}</td><td>${esc(e.name)}</td>
    <td>${amtCell(e)}</td><td>${esc(e.method)}</td><td>${esc(e.note)}</td><td>${fmtDate(e.date)}</td>
    <td><button class="s" onclick="pick('${s.id}')">${STR.open}</button></td></tr>`,
      )
      .join("") || `<tr><td colspan="7" class="mu">${STR.noEntries}</td></tr>`
  }
  </table></div></div>`;
    return;
  }

  // ----- single-sheet view -----
  const s = cur();
  if (!s) {
    m.innerHTML = `<div class="card">${exp ? STR.expEmptyMain : STR.emptyMain}</div>`;
    return;
  }

  // labels differ by mode
  const lblAdd = exp ? STR.expAddEntry : STR.addEntry;
  const lblEdit = exp ? STR.expEditEntry : STR.editEntry;
  const lblName = exp ? STR.expPayee : STR.donorName;
  const lblCount = exp ? STR.expDonorCount : STR.donorCount;
  const lblNoEntries = exp ? STR.expNoEntries : STR.noEntries;
  const methods = exp ? METHODS_EXP : METHODS;

  const t = sums(s.entries);
  const g = grandTotals(t);

  m.innerHTML = `<div class="card"><h3>${esc(s.name)} · ${fmtDate(s.date)}</h3>
    <div class="tot-row">
      <span class="tot">${STR.total}: ${money(t)}</span>
      <span class="tot">${lblCount(kh(s.entries.length))}</span>
    </div>
    <hr class="divider">
    <div class="tot-row">
      <span class="tot">${STR.grandInUSD}: ${g.usd}</span>
      <span class="tot">${STR.grandInKHR}: ${g.khr}</span>
    </div>
  </div>

    <div class="card">
      <h3>${edit ? lblEdit : lblAdd}</h3>
      <div class="entry-row-4">
        <input id="f_name" class="expand" placeholder="${esc(lblName)}">
        <input id="f_amt" class="expand" type="number" min="0" step="any" placeholder="${esc(STR.amt)}" oninput="calc()">
                <select id="f_unit" class="compact-unit" onchange="calc()">${UNITS.map((u) => `<option value="${u.mult}">${esc(u.label)}</option>`).join("")}</select>
        <select id="f_cur" class="compact-cur" onchange="calc()">
          <option value="KHR">${esc(STR.curKHR)}</option>
          <option value="USD">${esc(STR.curUSD)}</option>
        </select><select id="f_met" class="compact-met">${methods.map((x) => `<option>${esc(x)}</option>`).join("")}</select>
      </div>
      <div class="calc" id="f_calc"></div>
      <div class="entry-row-4">
        <input id="f_note" class="expand" placeholder="${esc(STR.note)}" onkeydown="if(event.key==='Enter')addEntry()">
        <span class="datebox compact-date">
          <input id="f_date_show" readonly placeholder="${esc(STR.pickDate)}" value="${esc(fmtDate(today()))}" onclick="openDate('f_date')">
          <input id="f_date" type="hidden" value="${today()}">
        </span>
      </div>
      <div class="actions-right">
        ${edit ? `<button onclick="edit=null;render()">${STR.cancel}</button>` : ""}
        <button class="p" onclick="addEntry()">${edit ? STR.update : STR.add}</button>
      </div>
    </div>

    <div class="card wide"><table><tr>${th([C.no, C.name, C.amt, C.method, C.note, C.date])}<th></th></tr>
    ${
      s.entries
        .map(
          (e, i) =>
            `<tr><td>${i + 1}</td><td>${esc(e.name)}</td>
      <td>${amtCell(e)}</td><td>${esc(e.method)}</td><td>${esc(e.note)}</td>
      <td>${fmtDate(e.date)}</td>
      <td><button class="s" onclick="editEntry('${e.id}')">${STR.edit}</button> <button class="s" onclick="delEntry('${e.id}')">✕</button></td></tr>`,
        )
        .join("") || `<tr><td colspan="7" class="mu">${lblNoEntries}</td></tr>`
    }
    </table></div>`;
}

/* ===== Excel export (ExcelJS: lets us set the font; dates stay yyyy-mm-dd so Excel can sort them) ===== */
async function exportX(scope) {
  if (typeof ExcelJS === "undefined") return await showAlert(STR.noXlsx);
  const all = sheetsRef();
  const list =
    scope === "all"
      ? all
      : scope === "sel"
        ? all.filter((s) => s.tick)
        : [cur()].filter(Boolean);
  if (!list.length) return await showAlert(STR.noSheetSel);

  const wb = new ExcelJS.Workbook();
  const used = new Set();

  // plain data row
  const row = (ws, vals, bold) => {
    const r = ws.addRow(vals);
    r.eachCell((c) => (c.font = { name: XL_FONT, size: 11, bold: !!bold }));
    return r;
  };

  // header row: font 14 + bold + grey fill
  const headRow = (ws, vals) => {
    const r = ws.addRow(vals);
    r.eachCell((c) => {
      c.font = { name: XL_FONT, size: 14, bold: true };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }, // light grey
      };
      c.alignment = { vertical: "middle" };
      c.border = {
        top: { style: "thin", color: { argb: "FF999999" } },
        left: { style: "thin", color: { argb: "FF999999" } },
        bottom: { style: "thin", color: { argb: "FF999999" } },
        right: { style: "thin", color: { argb: "FF999999" } },
      };
    });
    return r;
  };

  list.forEach((s) => {
    let n = s.name.replace(/[\\\/?*\[\]:]/g, "-").slice(0, 28);
    let b = n,
      k = 2;
    while (used.has(n.toLowerCase())) n = b + " " + k++;
    used.add(n.toLowerCase());
    const ws = wb.addWorksheet(n);

    // # | name | amt | cur | method | note | date
    ws.columns = [5, 24, 14, 8, 14, 28, 14].map((w) => ({ width: w }));

    // header row
    headRow(ws, [C.no, C.name, C.amt, C.cur, C.method, C.note, C.date]);

    // data rows (date moved to last column)
    s.entries.forEach((e, i) =>
      row(ws, [
        i + 1,
        e.name,
        +e.amt,
        e.cur,
        e.method,
        e.note,
        e.date, // yyyy-mm-dd, Excel sorts fine
      ]),
    );

    // totals
    const t = sums(s.entries);
    const g = grandTotals(t);
    ws.addRow([]);
    row(ws, ["", `${STR.total} ${STR.curKHR}`, t.KHR || 0, STR.curKHR], true);
    row(ws, ["", `${STR.total} ${STR.curUSD}`, t.USD || 0, STR.curUSD], true);
    row(ws, ["", STR.grandInUSD, g.usd], true);
    row(ws, ["", STR.grandInKHR, g.khr], true);
    row(ws, ["", lblCountForMode(s.entries.length)], true);
  });

  const prefix = isExpense() ? "expenses" : "donations";
  const nm =
    scope === "all"
      ? `${prefix}-all-sheets`
      : list.length === 1
        ? list[0].name
        : `${prefix}-selected-sheets`;
  const buf = await wb.xlsx.writeBuffer();
  dl(
    `${nm.replace(/[^\w\u1780-\u17FF-]+/g, "_")}_${today()}.xlsx`,
    buf,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

/* ===== PDF export (html2pdf – renders Khmer via html2canvas) ===== */
async function exportPDF() {
  if (typeof html2pdf === "undefined") return await showAlert(STR.noPdf);
  const list = sheetsRef();
  if (!list.length) return await showAlert(STR.noSheetSel);

  const prefix = isExpense() ? "expenses" : "donations";
  const ROWS_FIRST = 16; // rows on the first page of a sheet (it also holds the title + totals)
  const ROWS_NEXT = 24; // rows on the following pages. Lower both numbers if a page ever overflows

  const thS =
    "border:1px solid #999;padding:6px;text-align:left;color:#111;font-size:13px;";
  const tdS =
    "border:1px solid #ccc;padding:6px;vertical-align:top;color:#111;";
  const head = `<tr style="background:#d9d9d9;font-weight:700;">${[
    C.no,
    C.name,
    C.amt,
    C.method,
    C.note,
    C.date,
  ]
    .map((h) => `<th style="${thS}">${esc(h)}</th>`)
    .join("")}</tr>`;
  const rowHtml = (e, i) =>
    `<tr><td style="${tdS}">${i + 1}</td><td style="${tdS}">${esc(e.name)}</td><td style="${tdS}">${amtCell(e)}</td>` +
    `<td style="${tdS}">${esc(e.method)}</td><td style="${tdS}">${esc(e.note)}</td><td style="${tdS}">${fmtDate(e.date)}</td></tr>`;
  const table = (rows) =>
    `<table style="width:100%;border-collapse:collapse;font-size:12px;">${head}${
      rows ||
      `<tr><td colspan="6" style="${tdS}text-align:center;color:#666;">${esc(STR.noEntries)}</td></tr>`
    }</table>`;

  const pages = []; // one HTML string per PDF page
  list.forEach((s) => {
    const t = sums(s.entries),
      g = grandTotals(t);
    const top = `<h2 style="font-size:18px;margin:0 0 6px;color:#111;">${esc(s.name)} · ${fmtDate(s.date)}</h2>
      <div style="margin:0 0 4px;font-weight:600;color:#111;">${STR.total}: ${(t.KHR || 0).toLocaleString()} ${STR.curKHR} | ${(t.USD || 0).toLocaleString()} ${STR.curUSD}
        &nbsp;·&nbsp; ${lblCountForMode(s.entries.length)}</div>
      <div style="margin:0 0 10px;font-weight:600;color:#111;">${STR.grandInUSD}: ${g.usd} &nbsp;|&nbsp; ${STR.grandInKHR}: ${g.khr}</div>`;
    let start = 0,
      size = ROWS_FIRST,
      k = 0;
    do {
      const rows = s.entries
        .slice(start, start + size)
        .map((e, j) => rowHtml(e, start + j))
        .join("");
      const lead =
        k === 0
          ? top
          : `<div style="font-size:12px;color:#666;margin-bottom:6px;">${esc(s.name)} · ${kh(k + 1)}</div>`;
      pages.push(lead + table(rows));
      start += size;
      size = ROWS_NEXT;
      k++;
    } while (start < s.entries.length);
  });

  const wrap = document.createElement("div");
  wrap.style.cssText = `font-family:'${XL_FONT}','Khmer OS',system-ui,sans-serif;color:#111;background:#fff;`;
  wrap.innerHTML = pages
    .map(
      (p, i) =>
        `<div>${p}</div>${i < pages.length - 1 ? '<div class="html2pdf__page-break"></div>' : ""}`,
    )
    .join("");

  if (document.fonts) await document.fonts.ready;
  await html2pdf()
    .set({
      margin: 10,
      filename:
        `${prefix}-${today()}`.replace(/[^\w\u1780-\u17FF-]+/g, "_") + ".pdf",
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(wrap)
    .save();
}

const lblCountForMode = (n) =>
  isExpense() ? STR.expDonorCount(kh(n)) : STR.donorCount(kh(n));

/* ===== backup / restore ===== */
function dl(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
}
function backup() {
  const tag = isExpense() ? "expenses" : "donations";
  dl(`${tag}-backup_${today()}.json`, JSON.stringify(db), "application/json");
}
function restore(inp) {
  const f = inp.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result);
      if (!Array.isArray(d.sheets)) throw 0;
      if (!(await showConfirm(STR.restoreConfirm))) return;
      db = {
        sheets: d.sheets || [],
        cur: d.cur || null,
        expSheets: d.expSheets || [],
        expCur: d.expCur || null,
      };
      save();
      render();
    } catch (e) {
      await showAlert(STR.badBackup);
    }
  };
  r.readAsText(f);
  inp.value = "";
}

/* ===== calendar open/close ===== */
$("cal").addEventListener("click", (e) => e.stopPropagation());
document.addEventListener("click", (e) => {
  if (calId && !e.target.closest(".datebox")) closeCal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCal();
});

/* ===== start ===== */
applyStrings();
syncModeUI();
render();
