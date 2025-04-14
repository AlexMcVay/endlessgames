"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var cryptogramBoard = document.getElementById('cryptogramBoard');
  var newGameBtn = document.getElementById('newGame');
  var showHintBtn = document.getElementById('showHint');
  var phrases = [{
    phrase: "Test",
    author: "me"
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
        input.addEventListener('input', handleInput);
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
    var value = event.target.value.toUpperCase(); // Accept only valid alphabetic inputs

    if (value.match(/^[A-Z]$/)) {
      playerGuesses[index] = value;
    } else {
      event.target.value = ''; // Clear invalid input

      delete playerGuesses[index];
    }

    checkWinCondition();
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