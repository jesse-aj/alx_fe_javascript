// ===============================
// Dynamic Quote Generator with Server Sync + Conflict Resolution
// ===============================

// Grab UI elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteInput = document.getElementById("quoteInput");
const notification = document.getElementById("notification");

// Mock API endpoint (using JSONPlaceholder)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Local storage key
const LOCAL_STORAGE_KEY = "quotes";

// ===============================
// Utility Functions
// ===============================

// Get quotes from local storage or return default
function getLocalQuotes() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [
    { id: 1, text: "The best way to predict the future is to create it." },
    { id: 2, text: "Success is not in what you have, but who you are." }
  ];
}

// Save quotes to local storage
function saveLocalQuotes(quotes) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

// Show notification messages (e.g., sync updates, conflicts)
function showNotification(message) {
  notification.innerText = message;
  notification.style.display = "block";

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// ===============================
// Fetching and Posting with Mock API
// ===============================

// Fetch quotes from server (simulation)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    // Simulate quotes (mock server only returns posts)
    return data.slice(0, 5).map((item, index) => ({
      id: index + 100,
      text: item.title
    }));
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    return [];
  }
}

// Post a new quote to server (simulation)
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(quote),
      headers: { "Content-type": "application/json; charset=UTF-8" }
    });
    return await response.json();
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// ===============================
// Syncing + Conflict Resolution
// ===============================

// Main sync function
async function syncQuotes() {
  const localQuotes = getLocalQuotes();
  const serverQuotes = await fetchQuotesFromServer();

  // Conflict resolution: Server data takes precedence
  let mergedQuotes = [...localQuotes];

  serverQuotes.forEach(serverQuote => {
    const exists = mergedQuotes.find(q => q.id === serverQuote.id);
    if (!exists) {
      mergedQuotes.push(serverQuote);
    }
  });

  // Save merged quotes locally
  saveLocalQuotes(mergedQuotes);

  // Notify user about sync
  showNotification("Quotes synced with server!");
}

// Periodically sync every 15 seconds
setInterval(syncQuotes, 15000);

// ===============================
// UI Logic
// ===============================

// Show random quote
function showRandomQuote() {
  const quotes = getLocalQuotes();
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteDisplay.innerText = quotes[randomIndex].text;
}

// Add a new quote
async function addNewQuote() {
  const newQuoteText = quoteInput.value.trim();
  if (newQuoteText === "") {
    showNotification("Please enter a quote first!");
    return;
  }

  const newQuote = { id: Date.now(), text: newQuoteText };

  // Save locally
  const quotes = getLocalQuotes();
  quotes.push(newQuote);
  saveLocalQuotes(quotes);

  // Post to server (simulation)
  await postQuoteToServer(newQuote);

  quoteInput.value = "";
  showNotification("New quote added and synced!");
}

// ===============================
// Event Listeners
// ===============================
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addNewQuote);

// ===============================
// Initial Setup
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  showRandomQuote();
  syncQuotes(); // Initial sync with server
});
