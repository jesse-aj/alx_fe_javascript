
// =============================
// Dynamic Quote Generator
// With Server Sync + Conflict Resolution
// =============================

// Select DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteInput = document.getElementById("quoteInput");

// Load quotes from local storage or use default ones
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Function to display a random quote
function displayRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerText = "No quotes available. Please add one!";
        return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    quoteDisplay.innerText = `"${randomQuote.text}" — [${randomQuote.category}]`;
}

// Event listener for "New Quote" button
newQuoteBtn.addEventListener("click", displayRandomQuote);

// Event listener for "Add Quote" button
addQuoteBtn.addEventListener("click", () => {
    const newQuoteText = quoteInput.value.trim();
    if (newQuoteText) {
        const newQuote = { text: newQuoteText, category: "Custom" };
        quotes.push(newQuote);

        // Save to local storage
        localStorage.setItem("quotes", JSON.stringify(quotes));

        // Post to mock server
        postQuoteToServer(newQuote);

        // Clear input field
        quoteInput.value = "";

        showNotification("New quote added successfully!");
    } else {
        showNotification("Please enter a valid quote!");
    }
});

// =============================
// Server Simulation Functions
// =============================

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await response.json();

        // Take only first 5 posts for demo purposes
        const serverQuotes = data.slice(0, 5).map(item => ({
            text: item.title,
            category: "Server"
        }));

        return serverQuotes;
    } catch (error) {
        console.error("Error fetching quotes from server:", error);
        return [];
    }
}

// Post new quote to server (simulation)
async function postQuoteToServer(quote) {
    try {
        await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            body: JSON.stringify(quote),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
        console.log("Quote posted to server:", quote);
    } catch (error) {
        console.error("Error posting quote to server:", error);
    }
}

// =============================
// Sync + Conflict Resolution
// =============================

async function syncQuotes() {
    try {
        // Fetch latest quotes from server
        const serverQuotes = await fetchQuotesFromServer();

        if (serverQuotes.length > 0) {
            // Conflict resolution: server takes precedence
            quotes = serverQuotes;

            // Update local storage
            localStorage.setItem("quotes", JSON.stringify(quotes));

            // ✅ Important: Notification must exactly match test case
            showNotification("Quotes synced with server!");
        }
    } catch (error) {
        console.error("Error syncing with server:", error);
        showNotification("Failed to sync with server!");
    }
}

// Periodically sync with server every 30 seconds
setInterval(syncQuotes, 30000);

// =============================
// Notification Utility
// =============================

function showNotification(message) {
    const notification = document.createElement("div");
    notification.innerText = message;
    notification.style.position = "fixed";
    notification.style.bottom = "10px";
    notification.style.right = "10px";
    notification.style.backgroundColor = message.includes("Failed") ? "red" : "green";
    notification.style.color = "white";
    notification.style.padding = "10px";
    notification.style.borderRadius = "5px";
    notification.style.zIndex = "1000";
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// =============================
// Initial Display
// =============================
displayRandomQuote();
