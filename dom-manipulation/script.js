/* ==========================================
   Dynamic Quote Generator - script.js
   Covers:
   - Advanced DOM Manipulation
   - Web Storage (local/session)
   - JSON Import/Export
   - Filtering System
   - Server Sync Simulation & Conflict Resolution
   ========================================== */

// Global array of quotes (loaded from localStorage or default)
let quotes = loadQuotes();

// Load last selected filter from localStorage
let lastSelectedCategory = localStorage.getItem("lastCategory") || "all";

/* =============================
   Utility Functions for Storage
   ============================= */

// Save quotes array into localStorage as JSON
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Load quotes from localStorage (if available), else use defaults
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    return JSON.parse(storedQuotes);
  }
  // Default seed data
  return [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
  ];
}

/* =============================
   Quote Display and Interaction
   ============================= */

// Display a random quote (filtered by category if selected)
function showRandomQuote() {
  const category = document.getElementById("categoryFilter").value;

  // Filter quotes based on selected category
  let filteredQuotes = category === "all"
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === category.toLowerCase());

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes available for this category.";
    return;
  }

  // Pick a random quote
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  // Display it
  document.getElementById("quoteDisplay").innerText = `"${randomQuote.text}" - ${randomQuote.category}`;

  // Save last viewed quote in sessionStorage
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

// Add new quote from input form
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text === "" || category === "") {
    alert("Please enter both quote text and category.");
    return;
  }

  // Add new quote to array
  quotes.push({ text, category });

  // Save to localStorage
  saveQuotes();

  // Update categories dropdown
  populateCategories();

  // Clear input fields
  textInput.value = "";
  categoryInput.value = "";

  alert("Quote added successfully!");
}

/* =============================
   Category Filtering
   ============================= */

// Populate category dropdown dynamically
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");

  // Reset dropdown (keep 'all' option)
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Add categories as options
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category if exists
  categoryFilter.value = lastSelectedCategory;
}

// Filter quotes based on category
function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;

  // Save selected category in localStorage
  localStorage.setItem("lastCategory", category);
  lastSelectedCategory = category;

  // Show a random quote from that category
  showRandomQuote();
}

/* =============================
   JSON Import/Export
   ============================= */

// Export quotes to a downloadable JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2); // formatted JSON
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid format");

      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing JSON: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

/* =============================
   Server Sync Simulation
   ============================= */

// Simulated server endpoint (JSONPlaceholder test API)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Periodically sync with server
function syncWithServer() {
  // Fetch "server quotes"
  fetch(SERVER_URL)
    .then(res => res.json())
    .then(data => {
      // Simulate: server provides only first 3 items
      const serverQuotes = data.slice(0, 3).map((item, index) => ({
        text: item.title,
        category: "Server"
      }));

      // Conflict resolution: server takes precedence
      quotes = [...quotes, ...serverQuotes];
      quotes = quotes.filter((q, index, self) =>
        index === self.findIndex(t => t.text === q.text) // remove duplicates
      );

      saveQuotes();
      populateCategories();

      document.getElementById("notification").innerText =
        "Quotes synced with server. Server data took precedence in conflicts.";
    })
    .catch(err => {
      console.error("Server sync failed:", err);
    });
}

// Run sync every 30 seconds
setInterval(syncWithServer, 30000);

/* =============================
   Initialization
   ============================= */

// Attach event listeners and initialize app
window.onload = function() {
  // Setup categories
  populateCategories();

  // Show last viewed quote if available
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerText = `"${q.text}" - ${q.category}`;
  } else {
    showRandomQuote();
  }

  // Button for new random quote
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);

  // Initial server sync
  syncWithServer();
};
