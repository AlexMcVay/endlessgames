"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var cryptogramBoard = document.getElementById('cryptogramBoard');
  var newGameBtn = document.getElementById('newGame');
  var showHintBtn = document.getElementById('showHint');
  var phrases = [{
    phrase: "Bravery is action in spite of fear, not in the absence of it.",
    author: "Jennifer Lynn Alvarez"
  }, {
    phrase: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  }, {
    phrase: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  }, {
    phrase: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  }, {
    phrase: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  }, {
    phrase: "In the middle of every difficulty lies opportunity.",
    author: "Albert Einstein"
  }, {
    phrase: "Success is walking from failure to failure with no loss of enthusiasm.",
    author: "Winston Churchill"
  }, {
    phrase: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  }];
  var currentPhrase = '';
  var currentAuthor = '';
  var encryptedPhrase = '';
  var playerGuesses = {};
  var letterToNumberMap = {}; // Map to store random numbers for each letter
  // Function to start a new game

  function startNewGame() {
    var selected = phrases[Math.floor(Math.random() * phrases.length)];
    currentPhrase = selected.phrase.toUpperCase();
    currentAuthor = selected.author;
    encryptedPhrase = encryptPhrase(currentPhrase);
    playerGuesses = {};
    renderBoard();
  } // Function to encrypt the phrase and assign random numbers to letters


  function encryptPhrase(phrase) {
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var shuffled = alphabet.split('').sort(function () {
      return Math.random() - 0.5;
    }).join('');
    var cipher = {};
    alphabet.split('').forEach(function (letter, index) {
      cipher[letter] = shuffled[index];
    }); // Assign random numbers to each letter

    letterToNumberMap = {};
    var availableNumbers = Array.from({
      length: 26
    }, function (_, i) {
      return i + 1;
    }).sort(function () {
      return Math.random() - 0.5;
    }); // Shuffle numbers 1-26

    phrase.split('').forEach(function (_char) {
      if (_char.match(/[A-Z]/) && !letterToNumberMap[_char]) {
        letterToNumberMap[_char] = availableNumbers.pop(); // Assign a random number from the shuffled list
      }
    });
    return phrase.split('').map(function (_char2) {
      return cipher[_char2] || _char2;
    }).join('');
  } // Function to render the cryptogram board


  function renderBoard() {
    cryptogramBoard.innerHTML = ''; // Create a container for the cryptogram

    var cryptogramContainer = document.createElement('div');
    cryptogramContainer.classList.add('cryptogram-container');
    encryptedPhrase.split('').forEach(function (_char3, index) {
      var cellContainer = document.createElement('div');
      cellContainer.classList.add('cryptogram-cell-container'); // Add number above the input or character

      var numberCell = document.createElement('div');
      numberCell.classList.add('cryptogram-number');
      numberCell.textContent = _char3.match(/[A-Z]/) ? letterToNumberMap[currentPhrase[index]] : ''; // Use the same number for the same letter

      cellContainer.appendChild(numberCell); // Add input box for letters or static character for spaces/punctuation

      if (_char3.match(/[A-Z]/)) {
        var cell = document.createElement('div');
        cell.classList.add('cryptogram-cell');
        var input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.dataset.index = index;
        input.value = playerGuesses[index] || '';
        input.style.backgroundColor = ''; // Reset background color

        input.style.color = ''; // Reset text color

        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeyDown);
        cell.appendChild(input);
        cellContainer.appendChild(cell);
      } else {
        // Add static character outside of the cell
        var staticChar = document.createElement('div');
        staticChar.classList.add('cryptogram-static');
        staticChar.textContent = _char3;
        cellContainer.appendChild(staticChar);
      }

      cryptogramContainer.appendChild(cellContainer);
    });
    cryptogramBoard.appendChild(cryptogramContainer);
  } // Handle input in the cryptogram cells


  function handleInput(event) {
    var index = event.target.dataset.index;
    var value = event.target.value.toUpperCase();
    var correctLetter = currentPhrase[index]; // Accept only valid alphabetic inputs and check if it's the correct letter

    if (value.match(/^[A-Z]$/)) {
      if (value === correctLetter) {
        // Correct letter - accept it
        playerGuesses[index] = value;
        event.target.style.backgroundColor = '#d4edda'; // Light green background for correct

        event.target.style.color = '#155724'; // Dark green text
        // Move focus to next empty input

        var nextInput = findNextEmptyInput(index);

        if (nextInput) {
          setTimeout(function () {
            return nextInput.focus();
          }, 100);
        }
      } else {
        // Incorrect letter - reject it with visual feedback
        event.target.value = ''; // Clear invalid input

        event.target.style.backgroundColor = '#f8d7da'; // Light red background for incorrect

        event.target.style.color = '#721c24'; // Dark red text

        event.target.classList.add('shake'); // Add shake animation
        // Reset styles and animation after a short delay

        setTimeout(function () {
          event.target.style.backgroundColor = '';
          event.target.style.color = '';
          event.target.classList.remove('shake');
        }, 500);
        delete playerGuesses[index];
      }
    } else {
      event.target.value = ''; // Clear invalid input

      delete playerGuesses[index];
    }

    checkWinCondition();
  } // Helper function to find the next empty input field


  function findNextEmptyInput(currentIndex) {
    var inputs = document.querySelectorAll('.cryptogram-cell input');
    var currentIndexNum = parseInt(currentIndex);

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var inputIndex = parseInt(input.dataset.index);

      if (inputIndex > currentIndexNum && input.value === '') {
        return input;
      }
    }

    return null;
  } // Check if the player has won


  function checkWinCondition() {
    var guessedPhrase = encryptedPhrase.split('').map(function (_char4, index) {
      return _char4.match(/[A-Z]/) ? playerGuesses[index] || '' : _char4;
    }).join('');

    if (guessedPhrase === currentPhrase) {
      handleGameOver();
    }
  } // Handle game over


  function handleGameOver() {
    var message = "Congratulations! You solved the cryptogram:<br><br>\"<strong>".concat(currentPhrase, "</strong>\"<br><br>- ").concat(currentAuthor);
    createSoloGameOverlay(message, function () {
      return window.open('https://buymeacoffee.com/alexandramcvay', '_blank');
    }, // Donate button
    function () {
      return location.reload();
    }, // Replay button reloads the page
    function () {
      return window.location.href = '../index.html';
    }, // Home button redirects to index.html
    {
      accentColor: 'var(--primary-color)'
    } // Use the accent color from styles.css
    );
  } // Event listeners


  newGameBtn.addEventListener('click', startNewGame);
  showHintBtn.addEventListener('click', function () {
    alert("Hint: The phrase starts with \"".concat(currentPhrase[0], "\""));
  }); // Start the first game

  startNewGame();
});