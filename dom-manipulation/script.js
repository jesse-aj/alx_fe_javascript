// ============================
// INITIAL QUOTES
// ============================
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Load saved quotes from localStorage if they exist
if (localStorage.getItem("quotes")) {
    quotes = JSON.parse(localStorage.getItem("quotes"));
}

// ============================
// SELECT ELEMENTS
// ============================
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuoteBtn");
const categoryFilter = document.getElementById("categoryFilter");
const conflictNotification = document.getElementById("conflictNotification");
const conflictMessage = document.getElementById("conflictMessage");
const keepLocalBtn = document.getElementById("keepLocalBtn");
const useServerBtn = document.getElementById("useServerBtn");

// ============================
// SAVE QUOTES TO LOCALSTORAGE
// ============================
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ============================
// POPULATE CATEGORY DROPDOWN
// ============================
function populateCategories() {
    // Clear old options except "All Categories"
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

    const categories = [...new Set(quotes.map(q => q.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category
    const savedCategory = localStorage.getItem("lastCategory");
    if (savedCategory && categories.includes(savedCategory)) {
        categoryFilter.value = savedCategory;
    }
}

// ============================
// FILTER QUOTES BY CATEGORY
// ============================
function filterQuotes() {
    const selectedCategory = categoryFilter.value;

    // Save selected category
    localStorage.setItem("lastCategory", selectedCategory);

    // Filter quotes based on category
    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
        filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    // Display random quote from filtered list
    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const quote = filteredQuotes[randomIndex];
        quoteDisplay.innerHTML = `
            <p>"${quote.text}"</p>
            <p><strong>Category:</strong> ${quote.category}</p>`;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// ============================
// SHOW RANDOM QUOTE
// ============================
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
            <p><strong>Category:</strong> ${quote.category}</p>`;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// ============================
// FETCH QUOTES FROM SERVER + CONFLICT RESOLUTION
// ============================
function fetchQuotesFromServer() {
    fetch("https://jsonplaceholder.typicode.com/posts")
        .then(response => response.json())
        .then(data => {
            // Convert server data to local format
            const serverQuotes = data.map(item => ({ text: item.title, category: "General" }));

            // Detect conflicts: server quotes not in local
            const conflicts = serverQuotes.filter(sq => 
                !quotes.some(lq => lq.text === sq.text && lq.category === sq.category)
            );

            if (conflicts.length > 0) {
                // Show notification to user
                conflictNotification.style.display = "block";
                conflictMessage.textContent = `There are ${conflicts.length} new quotes on the server.`;

                // User chooses to keep local quotes
                keepLocalBtn.onclick = () => {
                    conflictNotification.style.display = "none";
                    console.log("User kept local quotes.");
                };

                // User chooses to merge server quotes
                useServerBtn.onclick = () => {
                    quotes = [...quotes, ...conflicts]; // merge server quotes
                    saveQuotes(); // update localStorage
                    populateCategories(); // refresh categories
                    showRandomQuote(); // show a quote
                    conflictNotification.style.display = "none";
                    console.log("User accepted server quotes.");
                };
            }
        })
        .catch(err => console.error("Error fetching quotes:", err));
}

// Initial fetch
fetchQuotesFromServer();

// Periodic fetch every 10 seconds
setInterval(fetchQuotesFromServer, 10000);

// ============================
// ADD NEW QUOTE
// ============================
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

    // Post new quote to server
    fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify(newQuote),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
    .then(response => response.json())
    .then(data => console.log("Saved to server:", data))
    .catch(err => console.error("Error posting quote:", err));

    populateCategories();
    alert("New quote added successfully!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    showRandomQuote();
}

// ============================
// IMPORT/EXPORT QUOTES
// ============================
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
            populateCategories();
            alert("Quotes imported successfully!");
        } catch (err) {
            alert("Invalid JSON file.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// ============================
// CREATE ADD QUOTE FORM
// ============================
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

// ============================
// INITIAL SETUP
// ============================
populateCategories();
createAddQuoteForm();
newQuoteButton.addEventListener("click", showRandomQuote);
