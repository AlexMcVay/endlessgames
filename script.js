document.addEventListener("DOMContentLoaded", () => {
    const categoryButtons = document.querySelectorAll(".categories li");
    const gameCards = document.querySelectorAll(".game-card");

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove("active"));
            // Add active class to the clicked button
            button.classList.add("active");

            const category = button.getAttribute("data-category");

            // Show/hide game cards based on category
            gameCards.forEach(card => {
                const cardCategories = card.getAttribute("data-category");
                if (category === "all" || cardCategories.includes(category)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
});

// Game End
/**
 * Creates and displays a game end overlay showing the winner and action buttons
 * @param {string} winnerName - Name of the winner to display
 * @param {Function} donateCallback - Function to call when donate button is clicked
 * @param {Function} playAgainCallback - Function to call when play again button is clicked
 * @param {Function} homeCallback - Function to call when home button is clicked
 * @param {Object} options - Optional configuration settings
 * @param {string} options.backgroundColor - Background color of the overlay (default: 'rgba(0, 0, 0, 0.8)')
 * @param {string} options.textColor - Color of the text (default: '#ffffff')
 * @param {string} options.accentColor - Color for button highlights (default: '#ff9900')
 * @returns {HTMLElement} - The created overlay element
 */
function createGameEndOverlay(winnerName, donateCallback, playAgainCallback, homeCallback, options = {}) {
    // Default options
    const config = {
        backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0.8)',
        textColor: options.textColor || '#ffffff',
        accentColor: options.accentColor || '#ff9900'
    };

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'game-end-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = config.backgroundColor;
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.fontFamily = 'Arial, sans-serif';
    overlay.style.color = config.textColor;

    // Create winner announcement
    const winnerText = document.createElement('h1');
    winnerText.textContent = 'The Winner is';
    winnerText.style.fontSize = '3rem';
    winnerText.style.marginBottom = '10px';
    winnerText.style.textAlign = 'center';

    // Create winner name display
    const winner = document.createElement('h2');
    winner.textContent = winnerName;
    winner.style.fontSize = '4rem';
    winner.style.marginBottom = '40px';
    winner.style.textAlign = 'center';
    winner.style.color = config.accentColor;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.maxWidth = '800px';
    buttonContainer.style.margin = '0 auto';

    // Helper function to create styled buttons using CSS classes
    function createButton(text, callback, link = false) {
        const button = document.createElement(link ? 'a' : 'button');
        button.textContent = text;
        button.className = 'play-btn'; // Use the button styles from styles.css
        button.style.minWidth = '180px';
        button.style.textAlign = 'center';
        button.style.textDecoration = 'none'; // Ensure links look like buttons

        if (link) {
            button.href = callback; // Set the link if it's a button with a URL
            button.target = '_blank'; // Open in a new tab
        } else {
            button.onclick = function () {
                if (typeof callback === 'function') {
                    callback();
                }
            };
        }

        return button;
    }

    // Create the buttons
    const donateButton = createButton('Donate', 'https://buymeacoffee.com/alexandramcvay', true);
    const playAgainButton = createButton('Play Again', playAgainCallback);
    const homeButton = createButton('Home Screen', homeCallback);

    // Add buttons to container
    buttonContainer.appendChild(donateButton);
    buttonContainer.appendChild(playAgainButton);
    buttonContainer.appendChild(homeButton);

    // Assemble overlay
    overlay.appendChild(winnerText);
    overlay.appendChild(winner);
    overlay.appendChild(buttonContainer);

    // Add to document body
    document.body.appendChild(overlay);

    // Return the overlay element in case the caller needs to modify it
    return overlay;
}

/**
 * Removes the game end overlay from the DOM
 */
function removeGameEndOverlay() {
    const overlay = document.getElementById('game-end-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Example usage:
/*
createGameEndOverlay(
    'Player One', 
    () => { console.log('Donate clicked'); window.location.href = '/donate'; },
    () => { console.log('Play Again clicked'); restartGame(); },
    () => { console.log('Home clicked'); window.location.href = '/home'; },
    { accentColor: '#ff5500' }
);

// To remove the overlay later
// removeGameEndOverlay();
*/