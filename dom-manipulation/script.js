// ======== Initial Quotes ========
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Load quotes from localStorage if they exist
if (localStorage.getItem("quotes")) {
    quotes = JSON.parse(localStorage.getItem("quotes"));
}

// ======== Select Elements ========
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuoteBtn");
const categoryFilter = document.getElementById("categoryFilter");

// ======== Populate Categories Dropdown ========
function populateCategories() {
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    const categories = [...new Set(quotes.map(q => q.category))];
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category if it exists
    const savedCategory = localStorage.getItem("lastCategory");
    if (savedCategory && categories.includes(savedCategory)) {
        categoryFilter.value = savedCategory;
    }
}

// ======== Save Quotes to Local Storage ========
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ======== Filter Quotes by Category ========
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
        quoteDisplay.innerHTML = `<p>"${quote.text}"</p><p><strong>Category:</strong> ${quote.category}</p>`;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// ======== Show Random Quote ========
function showRandomQuote() {
    const selectedCategory = categoryFilter.value;
    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
        filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const quote = filteredQuotes[randomIndex];
        quoteDisplay.innerHTML = `<p>"${quote.text}"</p><p><strong>Category:</strong> ${quote.category}</p>`;
    } else {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    }
}

// ======== Post Quote to Server ========
function postQuoteToServer(quote) {
    return fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify(quote),
        headers: { "Content-Type": "application/json; charset=UTF-8" } // Correct header
    })
    .then(response => response.json())
    .then(data => console.log("Saved to server:", data))
    .catch(err => console.error("Error posting quote:", err));
}

// ======== Sync Quotes Function ========
async function syncQuotes() {
    try {
        // Fetch quotes from the server
        const response = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await response.json();

        // Map server data to our format
        const serverQuotes = data.map(item => ({ text: item.title, category: "General" }));

        // Check for conflicts (quotes on server not in local)
        const conflicts = serverQuotes.filter(sq =>
            !quotes.some(lq => lq.text === sq.text && lq.category === sq.category)
        );

        if (conflicts.length > 0) {
            // Show notification UI
            const notification = document.getElementById("conflictNotification");
            const message = document.getElementById("conflictMessage");
            notification.style.display = "block";
            message.textContent = `There are ${conflicts.length} new quotes on the server.`;

            // Keep local quotes
            document.getElementById("keepLocalBtn").onclick = () => {
                notification.style.display = "none";
                console.log("User kept local quotes.");
            };

            // Merge server quotes
            document.getElementById("useServerBtn").onclick = () => {
                quotes = [...quotes, ...conflicts]; // Add new server quotes
                saveQuotes();
                populateCategories();
                showRandomQuote();
                notification.style.display = "none";
                console.log("User accepted server quotes.");
            };
        }

        // Automatically merge server quotes that don’t conflict
        const nonConflictingServerQuotes = serverQuotes.filter(sq =>
            !quotes.some(lq => lq.text === sq.text && lq.category === sq.category)
        );
        if (nonConflictingServerQuotes.length > 0) {
            quotes = [...quotes, ...nonConflictingServerQuotes];
            saveQuotes();
            populateCategories();
        }

    } catch (err) {
        console.error("Error fetching quotes:", err);
    }
}

// ======== Add New Quote ========
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

    // Send the new quote to the server
    postQuoteToServer(newQuote);

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("New quote added successfully!");
}

// ======== Create Add Quote Form ========
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

// ======== Initial Setup ========
populateCategories();
showRandomQuote();
createAddQuoteForm();

// Periodically sync quotes every 10 seconds
setInterval(syncQuotes, 10000);

// Button to show new random quote
newQuoteButton.addEventListener("click", showRandomQuote);
