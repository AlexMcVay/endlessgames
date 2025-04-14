"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var categoryButtons = document.querySelectorAll(".categories li");
  var gameCards = document.querySelectorAll(".game-card");
  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      categoryButtons.forEach(function (btn) {
        return btn.classList.remove("active");
      }); // Add active class to the clicked button

      button.classList.add("active");
      var category = button.getAttribute("data-category"); // Show/hide game cards based on category

      gameCards.forEach(function (card) {
        var cardCategories = card.getAttribute("data-category");

        if (category === "all" || cardCategories.includes(category)) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}); // Game End

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

function createGameEndOverlay(winnerName, donateCallback, playAgainCallback, homeCallback) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  // Default options
  var config = {
    backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0.8)',
    textColor: options.textColor || '#ffffff',
    accentColor: options.accentColor || '#ff9900'
  }; // Create overlay container

  var overlay = document.createElement('div');
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
  overlay.style.color = config.textColor; // Create winner announcement

  var winnerText = document.createElement('h1');
  winnerText.textContent = 'The Winner is';
  winnerText.style.fontSize = '3rem';
  winnerText.style.marginBottom = '10px';
  winnerText.style.textAlign = 'center'; // Create winner name display

  var winner = document.createElement('h2');
  winner.textContent = winnerName;
  winner.style.fontSize = '4rem';
  winner.style.marginBottom = '40px';
  winner.style.textAlign = 'center';
  winner.style.color = config.accentColor; // Create button container

  var buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '20px';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.maxWidth = '800px';
  buttonContainer.style.margin = '0 auto'; // Helper function to create styled buttons using CSS classes

  function createButton(text, callback) {
    var link = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var button = document.createElement(link ? 'a' : 'button');
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
  } // Create the buttons


  var donateButton = createButton('Donate', 'https://buymeacoffee.com/alexandramcvay', true);
  var playAgainButton = createButton('Play Again', playAgainCallback);
  var homeButton = createButton('Home Screen', homeCallback); // Add buttons to container

  buttonContainer.appendChild(donateButton);
  buttonContainer.appendChild(playAgainButton);
  buttonContainer.appendChild(homeButton); // Assemble overlay

  overlay.appendChild(winnerText);
  overlay.appendChild(winner);
  overlay.appendChild(buttonContainer); // Add to document body

  document.body.appendChild(overlay); // Return the overlay element in case the caller needs to modify it

  return overlay;
}
/**
 * Removes the game end overlay from the DOM
 */


function removeGameEndOverlay() {
  var overlay = document.getElementById('game-end-overlay');

  if (overlay) {
    overlay.remove();
  }
}
/**
 * Creates and displays a solo game overlay showing a message and action buttons
 * @param {string} message - Message to display
 * @param {Function} donateCallback - Function to call when donate button is clicked
 * @param {Function} playAgainCallback - Function to call when play again button is clicked
 * @param {Function} homeCallback - Function to call when home button is clicked
 * @param {Object} options - Optional configuration settings
 * @param {string} options.backgroundColor - Background color of the overlay (default: 'rgba(0, 0, 0, 0.8)')
 * @param {string} options.textColor - Color of the text (default: 'var(--text-primary)')
 * @param {string} options.accentColor - Color for button highlights (default: 'var(--primary-color)')
 * @returns {HTMLElement} - The created overlay element
 */


function createSoloGameOverlay(message, donateCallback, playAgainCallback, homeCallback) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  // Default options
  var config = {
    backgroundColor: options.backgroundColor || 'white',
    textColor: options.textColor || 'var(--primary-color)',
    accentColor: options.accentColor || 'var(--accent-color)'
  }; // Create overlay container

  var overlay = document.createElement('div');
  overlay.id = 'solo-game-overlay';
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
  overlay.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  overlay.style.color = config.textColor;
  overlay.style.textAlign = 'center';
  overlay.style.padding = '20px'; // Create message display

  var messageText = document.createElement('div');
  messageText.innerHTML = message.replace(/\n/g, '<br>'); // Replace newlines with line breaks for proper formatting

  messageText.style.fontSize = '1.5rem';
  messageText.style.marginBottom = '30px';
  messageText.style.lineHeight = '1.8'; // Create button container

  var buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '20px';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.maxWidth = '800px'; // Helper function to create styled buttons

  function createButton(text, callback) {
    var button = document.createElement('button');
    button.textContent = text;
    button.className = 'play-btn'; // Use the button styles from styles.css

    button.style.minWidth = '200px'; // Increase button size

    button.style.padding = '15px 20px'; // Add padding for larger buttons

    button.style.fontSize = '1.2rem'; // Increase font size

    button.style.cursor = 'pointer';
    button.onclick = callback;
    return button;
  } // Create the buttons


  var donateButton = createButton('Donate', donateCallback);
  var playAgainButton = createButton('Play Again', playAgainCallback);
  var homeButton = createButton('Home Screen', homeCallback); // Add buttons to container

  buttonContainer.appendChild(donateButton);
  buttonContainer.appendChild(playAgainButton);
  buttonContainer.appendChild(homeButton); // Assemble overlay

  overlay.appendChild(messageText);
  overlay.appendChild(buttonContainer); // Add to document body

  document.body.appendChild(overlay); // Return the overlay element in case the caller needs to modify it

  return overlay;
} // Example usage:

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