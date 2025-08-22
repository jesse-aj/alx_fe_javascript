let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];


 //this loads saved quotes from local storage if any
function saveQuotes() {
 localStorage.setItem("quotes", JSON.stringify(quotes));
}


//a function that lets you read files the user exprt JSON in the browser
 function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quoutes.json";
    a.click();
    URL.revokeObjectURL(url);
 }

 //function to import JSONfile
 function importFromJsonFile(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            quotes.push(...importedQuotes);
            saveQuotes();
            alert("Quotes imported Succesfully");
        } catch (err) {
            alert("Invalid JSON fie.");
            console.error(err);
        }
    };
    reader.readAsText(file);
 }
































// this functions add a new quote
function addQuote (text, category) {
    quotes.push({text, category});
    saveQuotes();
}


// this stores the last viewed quote temporarily
function saveLastViewedQuote(quote) {
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function getLastViewedQuote(){
    return JSON.parse(sessionStorage.getItem("lastQuote"));
}


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
    // this merges the first function with the other one
    saveQuotes();

    alert("New quote added successfully!");

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    // Show the new random quote
    showRandomQuote();
}

// Function to create the add quote form (outside addQuote)
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

// Attach event listener
newQuoteButton.addEventListener("click", showRandomQuote);

// Call form creation once (so it appears on page load)
createAddQuoteForm();
