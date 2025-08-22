// Initial local quotes
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Load saved quotes from local storage if any
if (localStorage.getItem("quotes")) {
    quotes = JSON.parse(localStorage.getItem("quotes"));
}

// =========================
// SERVER SYNC FUNCTIONS
// =========================

// Fetch quotes from server and check for conflicts
async function fetchQuotesFromServer() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await response.json();

        // Map server data to quote format
        const serverQuotes = data.map(item => ({ text: item.title, category: "General" }));

        // Find conflicts: server quotes not in local quotes
        const conflicts = serverQuotes.filter(sq => 
            !quotes.some(lq => lq.text === sq.text && lq.category === sq.category)
        );

        if (conflicts.length > 0) {
            // Show notification to the user
            const notification = document.getElementById("conflictNotification");
            const message = document.getElementById("conflictMessage");
            notification.style.display = "block";
            message.textContent = `There are ${conflicts.length} new quotes on the server.`;

            // User chooses to keep local quotes
            document.getElementById("keepLocalBtn").onclick = () => {
                notification.style.display = "none";
                console.log("User kept local quotes.");
            };

            // User chooses to merge server quotes
            document.getElementById("useServerBtn").onclick = () => {
                quotes = [...quotes, ...conflicts];
                saveQuotes();
                populateCategories();
                showRandomQuote();
                notification.style.display = "none";
                console.log("User accepted server quotes.");
            };
        }

    } catch (err) {
        console.error("Error fetching quotes:", err);
    }
}

// POST a new quote to the server
async function postQuoteToServer(quote) {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            body: JSON.stringify(quote),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        });
        const data = await response.json();
        console.log("Saved to server:", data);
    } catch (err) {
        console.error("Error posting quote:", err);
    }
}

// Initial fetch
fetchQuotesFromServer();

// Periodic fetch every 10 seconds
setInterval(fetchQuotesFromServer, 10000);

// =========================
// CATEGORY AND FILTERING
// =========================
const categoryFilter = document.getElementById("categoryFilter");

function populateCategories() {
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    const categories = [...new Set(quotes.map(q => q.category))];
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    const savedCategory = localStorage.getItem("lastCategory");
    if (savedCategory && categories.includes(savedCategory)) {
        categoryFilter.value = savedCategory;
    }
}

function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    localStorage.setItem("lastCategory", selectedCategory);

    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
        filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const quote = filteredQuotes[randomIndex];
        quoteDisplay.innerHTML = `
            <p>"${quote.text}"</p>
            <p><strong>Category:</strong> ${quote.category}</p>
        `;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// Call once on page load
populateCategories();

// =========================
// LOCAL STORAGE
// =========================
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// =========================
// IMPORT / EXPORT JSON
// =========================
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();
    URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            quotes.push(...importedQuotes);
            saveQuotes();
            alert("Quotes imported successfully");
            populateCategories();
        } catch (err) {
            alert("Invalid JSON file");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// =========================
// RANDOM QUOTE DISPLAY
// =========================
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuoteBtn");

function showRandomQuote() {
    const selectedCategory = categoryFilter.value;
    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
        filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const quote = filteredQuotes[randomIndex];
        quoteDisplay.innerHTML = `
            <p>"${quote.text}"</p>
            <p><strong>Category:</strong> ${quote.category}</p>
        `;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// =========================
// ADD NEW QUOTE
// =========================
function addQuote() {
    const quoteText = document.getElementById("newQuoteText").value.trim();
    const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

    if (!quoteText || !quoteCategory) {
        alert("Please enter a quote and category.");
        return;
    }

    const newQuote = { text: quoteText, category: quoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    showRandomQuote();
    postQuoteToServer(newQuote);

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("New quote added successfully!");
}

// =========================
// CREATE ADD QUOTE FORM
// =========================
function createAddQuoteForm() {
    const formDiv = document.createElement("div");

    const inputText = document.createElement("input");
    inputText.id = "newQuoteText";
    inputText.type = "text";
    inputText.placeholder = "Enter a new quote";

    const inputCategory = document.createElement("input");
    inputCategory.id = "newQuoteCategory";
    inputCategory.type = "text";
    inputCategory.placeholder = "Enter quote category";

    const addButton = document.createElement("button");
    addButton.textContent = "Add Quote";
    addButton.addEventListener("click", addQuote);

    formDiv.appendChild(inputText);
    formDiv.appendChild(inputCategory);
    formDiv.appendChild(addButton);

    document.body.appendChild(formDiv);
}

// Event listeners
newQuoteButton.addEventListener("click", showRandomQuote);

// Initialize form
createAddQuoteForm();
