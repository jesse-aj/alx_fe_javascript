let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Select elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuoteBtn");

// Function to show random Quote
function showRandomQuote() {
    let randomIndex = Math.floor(Math.random() * quotes.length);
    let randomQuote = quotes[randomIndex];

    quoteDisplay.innerHTML = `
        <p>"${randomQuote.text}"</p>
        <p><strong>Category:</strong> ${randomQuote.category}</p>
    `;
}

// Function to add new quote
function addQuote() {
    let quoteText = document.getElementById("newQuoteText").value.trim();
    let quoteCategory = document.getElementById("newQuoteCategory").value.trim();

    if (quoteText === "" || quoteCategory === "") {
        alert("Please enter a quote and category.");
        return;
    }

    // Create new quote object and add it to array
    let newQuote = { text: quoteText, category: quoteCategory };
    quotes.push(newQuote);

    alert("New quote added successfully!");

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    // Show the new random quote
    showRandomQuote();
}

// Attach event listener
newQuoteButton.addEventListener("click", showRandomQuote);