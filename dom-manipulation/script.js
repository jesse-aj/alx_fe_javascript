let quotes = [
    {text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    {text: "Dont let yesterday take up too much of today.", category:"Wisdom" },
    {text: "t’s not whether you get knocked down, it’s whether you get up.",category: "Resilience"}
];


//these allows us to manipulate the HTML page using JavaScript
const quoteDisplay = document.getElementById("qouteDisplay");
const qouteDisplay = document.getElementById("newQuote");

// Function to show random Qoute
function showRandomQuote() {
    // Math.random() gives a random decimal between 0 and 1 and Multiply it by the length of quotes array to get a random 
    let randomIndex = Math.floor(Math.random() * quotes.lenght);

    //select the random quote from the array
    let randomQuote = quotes[randomIndex];

  // Display the quote in the quoteDisplay div
    quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p><strong>Category:</strong> ${randomQuote.category}</p>
  `;
}