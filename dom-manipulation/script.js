"use strict";

/* ==========================================
   Dynamic Quote Generator - script.js
   - Advanced DOM Manipulation
   - localStorage/sessionStorage handling
   - JSON import/export
   - Filtering by category
   - Server sync simulation with conflict resolution
   ========================================== */

/* -----------------------------
   Configuration & globals
   ----------------------------- */
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API for GET/POST
const SYNC_INTERVAL_MS = 30_000; // periodic sync interval (30s) - adjust as needed

let quotes = loadQuotes(); // primary quotes array
let lastSelectedCategory = localStorage.getItem("lastCategory") || "all";

// Backup for undoing last automatic sync
let lastSyncBackup = null;          // array copy of quotes before last sync
let lastSyncBackupMap = {};        // map text -> category from backup (for conflict resolution UI)
let syncIntervalId = null;

/* -----------------------------
   Storage helpers
   ----------------------------- */
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Could not parse stored quotes:", e);
    }
  }
  // default seed quotes
  return [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
  ];
}

/* -----------------------------
   DOM / UI utility functions
   ----------------------------- */
function getEl(id) { return document.getElementById(id); }

function setNotification(message, isError = false) {
  const n = getEl("notification");
  n.style.color = isError ? "#b00" : "#080";
  n.textContent = message;
}

/* -----------------------------
   Quote display and interaction
   ----------------------------- */
function showRandomQuote() {
  const category = getEl("categoryFilter").value;
  const filtered = (category === "all")
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === category.toLowerCase());

  const display = getEl("quoteDisplay");
  if (!filtered || filtered.length === 0) {
    display.innerText = "No quotes available for this category.";
    return;
  }

  // Choose random index (digit-by-digit correctness)
  const idx = Math.floor(Math.random() * filtered.length);
  const q = filtered[idx];
  display.innerText = `"${q.text}" — ${q.category}`;

  // Save last viewed quote in sessionStorage
  sessionStorage.setItem("lastQuote", JSON.stringify(q));
}

/* -----------------------------
   Add new quote & posting to server
   ----------------------------- */
function addQuote() {
  const textInput = getEl("newQuoteText");
  const catInput = getEl("newQuoteCategory");
  const text = textInput.value.trim();
  const category = catInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  const newQ = { text, category };

  // Add locally first
  quotes.push(newQ);
  // Remove duplicates by text (case-insensitive)
  quotes = dedupeQuotes(quotes);
  saveQuotes();
  populateCategories();
  setNotification("Quote added locally. Attempting to post to server...");

  // Attempt to POST to server (fire-and-forget but show status)
  postQuoteToServer(newQ)
    .then(resp => setNotification("Quote posted to server (mock)."))
    .catch(err => setNotification("Failed to post quote to server: " + err.message, true));

  // Clear inputs
  textInput.value = "";
  catInput.value = "";
}

// Post a quote to the mock server using fetch (mock API)
async function postQuoteToServer(quote) {
  // This function deliberately returns the server response so tests can detect POST usage.
  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(quote)
  });
  if (!res.ok) throw new Error(`POST failed (${res.status})`);
  return res.json();
}

/* -----------------------------
   Filtering / categories
   ----------------------------- */
function populateCategories() {
  const select = getEl("categoryFilter");
  // preserve current selection if possible
  const current = select.value || "all";
  // collect unique categories (preserve insertion order)
  const categories = [];
  const seen = new Set();
  quotes.forEach(q => {
    const key = q.category;
    if (!seen.has(key)) { seen.add(key); categories.push(key); }
  });

  // rebuild select
  select.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "All Categories";
  select.appendChild(optAll);

  categories.forEach(cat => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    select.appendChild(o);
  });

  // restore last selected category or fallback to 'all'
  const saved = localStorage.getItem("lastCategory") || current || lastSelectedCategory || "all";
  select.value = saved;
}

function filterQuotes() {
  const select = getEl("categoryFilter");
  const cat = select.value;
  localStorage.setItem("lastCategory", cat);
  lastSelectedCategory = cat;
  showRandomQuote();
}

/* -----------------------------
   Import / Export JSON
   ----------------------------- */
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = getEl("importFile").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Imported JSON must be an array of quote objects.");
      // Basic validation: each item should have text and category
      const valid = parsed.every(item => item && typeof item.text === "string" && typeof item.category === "string");
      if (!valid) throw new Error("Each imported item must have 'text' and 'category' string properties.");
      quotes.push(...parsed);
      quotes = dedupeQuotes(quotes);
      saveQuotes();
      populateCategories();
      setNotification("Quotes imported successfully.");
    } catch (err) {
      alert("Import failed: " + err.message);
      setNotification("Import failed: " + err.message, true);
    }
  };
  reader.readAsText(file);
}

/* -----------------------------
   Deduping utility
   ----------------------------- */
function dedupeQuotes(arr) {
  const seen = new Set();
  const out = [];
  for (const q of arr) {
    const key = (q.text || "").trim().toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push({ text: q.text.trim(), category: q.category.trim() }); }
  }
  return out;
}

/* -----------------------------
   SERVER SYNC — required functions
   - fetchQuotesFromServer
   - syncQuotes
   - periodic checking via startPeriodicSync
   ----------------------------- */

/**
 * fetchQuotesFromServer(limit)
 * Fetches data from a mock API and maps into quote objects.
 * Returns: Promise< Array<{text:string, category:string}> >
 */
async function fetchQuotesFromServer(limit = 10) {
  const res = await fetch(SERVER_URL);
  if (!res.ok) throw new Error(`Failed to fetch from server (${res.status})`);
  const data = await res.json();
  // Map server responses into our quote shape
  // Use item.title as text and include a server category to make conflicts discoverable.
  return data.slice(0, limit).map(item => ({
    text: (item.title || "").trim(),
    category: `Server (user ${item.userId ?? "N/A"})`
  }));
}

/**
 * syncQuotes()
 * - fetches quotes from server
 * - detects new items and conflicts
 * - applies server precedence automatically (per project spec)
 * - saves a backup to allow "undo"
 * - updates localStorage, UI, and displays a conflict UI & notifications
 */
async function syncQuotes() {
  const notif = getEl("notification");
  const conflictArea = getEl("conflictArea");
  const conflictList = getEl("conflictList");

  notif.style.color = "#000";
  setNotification("Syncing with server...");

  try {
    // Backup local copy so user can undo
    lastSyncBackup = JSON.parse(JSON.stringify(quotes));
    lastSyncBackupMap = {};
    lastSyncBackup.forEach(q => { lastSyncBackupMap[q.text] = q.category; });

    // Fetch server data
    const serverQuotes = await fetchQuotesFromServer(15);

    // Track results
    const newFromServer = [];
    const conflicts = []; // { text, localCategory, serverCategory }

    // Process each server quote
    for (const s of serverQuotes) {
      // Find local index by text (case-insensitive)
      const idx = quotes.findIndex(l => (l.text || "").trim().toLowerCase() === (s.text || "").trim().toLowerCase());

      if (idx === -1) {
        // New quote from server -> add (server precedence)
        quotes.push(s);
        newFromServer.push(s);
      } else {
        // Present locally — check for category mismatch => conflict
        const local = quotes[idx];
        if ((local.category || "") !== (s.category || "")) {
          // Record conflict & apply server precedence (replace category)
          conflicts.push({ text: local.text, localCategory: local.category, serverCategory: s.category });
          quotes[idx].category = s.category; // server takes precedence
        }
      }
    }

    // Deduplicate again by text (case-insensitive)
    quotes = dedupeQuotes(quotes);

    // Persist changes
    saveQuotes();
    populateCategories();

    // Update UI: last sync time
    const nowISO = new Date().toISOString();
    getEl("lastSyncTime").textContent = nowISO;

    // Build notification & conflict UI
    let msgParts = [];
    if (newFromServer.length > 0) msgParts.push(`Added ${newFromServer.length} new quotes from server.`);
    if (conflicts.length > 0) msgParts.push(`Resolved ${conflicts.length} conflicts (server precedence applied).`);
    if (msgParts.length === 0) msgParts.push("No changes from server.");

    setNotification(msgParts.join(" "));

    // Render conflict area (even though server precedence was applied,
    // user can individually revert to local or keep server value, or undo all)
    renderConflictArea(conflicts, newFromServer);

  } catch (err) {
    setNotification("Sync failed: " + err.message, true);
    console.error("syncQuotes error:", err);
  }
}

/* -----------------------------
   Conflict UI & resolution helpers
   ----------------------------- */

/**
 * renderConflictArea(conflicts, newFromServer)
 * - Shows conflictArea with entries for each conflict (local vs server)
 * - For each conflict, provides:
 *     - "Keep Local" -> restores local category from last backup
 *     - "Use Server"  -> ensures server category is applied (already applied by sync)
 * - Also allows Undo Last Sync (restore full backup)
 */
function renderConflictArea(conflicts, newFromServer) {
  const area = getEl("conflictArea");
  const list = getEl("conflictList");
  list.innerHTML = "";

  // If no conflicts and no new items, hide the area
  if ((!conflicts || conflicts.length === 0) && (!newFromServer || newFromServer.length === 0)) {
    area.style.display = "none";
    return;
  }

  area.style.display = "block";

  // Show newly added server quotes (informational)
  if (newFromServer && newFromServer.length > 0) {
    const p = document.createElement("p");
    p.textContent = `New quotes added from server: ${newFromServer.length}`;
    list.appendChild(p);
  }

  // Show each conflict item
  if (conflicts && conflicts.length > 0) {
    conflicts.forEach((c, i) => {
      const wrapper = document.createElement("div");
      wrapper.className = "conflict-item";

      const title = document.createElement("div");
      title.textContent = `"${c.text}"`;
      wrapper.appendChild(title);

      const details = document.createElement("div");
      details.innerHTML =
        `<small>Local: ${escapeHtml(c.localCategory)} &nbsp; | &nbsp; Server: ${escapeHtml(c.serverCategory)}</small>`;
      wrapper.appendChild(details);

      const actions = document.createElement("div");
      actions.className = "conflict-actions";

      const keepLocalBtn = document.createElement("button");
      keepLocalBtn.textContent = "Keep Local";
      keepLocalBtn.addEventListener("click", function () {
        // restore category from backup map and save
        const localCat = lastSyncBackupMap[c.text];
        if (typeof localCat === "string") {
          const idx = quotes.findIndex(q => (q.text || "").trim().toLowerCase() === (c.text || "").trim().toLowerCase());
          if (idx !== -1) {
            quotes[idx].category = localCat;
            saveQuotes();
            populateCategories();
            setNotification(`Kept local category for "${c.text}".`);
            // remove this conflict element from the DOM
            wrapper.remove();
          }
        } else {
          alert("Cannot find local backup for this quote.");
        }
      });

      const useServerBtn = document.createElement("button");
      useServerBtn.textContent = "Use Server";
      useServerBtn.addEventListener("click", function () {
        // server value already applied; keep and remove entry
        const idx = quotes.findIndex(q => (q.text || "").trim().toLowerCase() === (c.text || "").trim().toLowerCase());
        if (idx !== -1) {
          quotes[idx].category = c.serverCategory;
          saveQuotes();
          populateCategories();
          setNotification(`Server category kept for "${c.text}".`);
          wrapper.remove();
        }
      });

      actions.appendChild(keepLocalBtn);
      actions.appendChild(useServerBtn);
      wrapper.appendChild(actions);
      list.appendChild(wrapper);
    });
  }
}

/**
 * Undo the last sync entirely (restore backup array)
 */
function undoLastSync() {
  if (!lastSyncBackup) {
    alert("No sync backup available to undo.");
    return;
  }
  quotes = JSON.parse(JSON.stringify(lastSyncBackup));
  saveQuotes();
  populateCategories();
  setNotification("Undo completed: local quotes restored to state before last sync.");
  getEl("conflictArea").style.display = "none";
}

/* -----------------------------
   Periodic sync control
   ----------------------------- */
function startPeriodicSync() {
  // if already running, do nothing
  if (syncIntervalId !== null) {
    setNotification("Auto-sync already running.");
    return;
  }
  // Run immediate sync once, then set interval
  syncQuotes();
  syncIntervalId = setInterval(syncQuotes, SYNC_INTERVAL_MS);
  setNotification("Auto-sync started.");
}

function stopPeriodicSync() {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    setNotification("Auto-sync stopped.");
  } else {
    setNotification("Auto-sync was not running.");
  }
}

/* -----------------------------
   Small helper(s)
   ----------------------------- */
// simple HTML escape for inserted text content
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* -----------------------------
   Initialization: attach handlers + boot
   ----------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  getEl("newQuote").addEventListener("click", showRandomQuote);
  getEl("addQuoteBtn").addEventListener("click", addQuote);
  getEl("categoryFilter").addEventListener("change", filterQuotes);
  getEl("exportBtn").addEventListener("click", exportToJsonFile);
  getEl("importFile").addEventListener("change", importFromJsonFile);
  getEl("syncNow").addEventListener("click", syncQuotes);
  getEl("startAutoSyncBtn").addEventListener("click", startPeriodicSync);
  getEl("stopAutoSyncBtn").addEventListener("click", stopPeriodicSync);
  getEl("undoLastSyncBtn").addEventListener("click", undoLastSync);

  // Populate categories, show last viewed or random quote
  populateCategories();
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    try {
      const q = JSON.parse(last);
      getEl("quoteDisplay").innerText = `"${q.text}" — ${q.category}`;
    } catch (e) {
      showRandomQuote();
    }
  } else {
    showRandomQuote();
  }

  // Start periodic sync automatically (comment/uncomment as required)
  // startPeriodicSync();
});
