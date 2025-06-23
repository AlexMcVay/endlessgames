"use strict";

document.addEventListener('DOMContentLoaded', function () {
  // Game state
  var gameState = {
    currentWord: '',
    currentCategory: '',
    guessedLetters: new Set(),
    wrongGuesses: 0,
    maxWrongGuesses: 6,
    score: 0,
    gameOver: false,
    gameWon: false,
    hintsUsed: 0
  }; // Word categories and lists

  var wordCategories = {
    'Animals': [{
      word: 'ELEPHANT',
      hint: 'Large mammal with a trunk'
    }, {
      word: 'GIRAFFE',
      hint: 'Tallest animal in the world'
    }, {
      word: 'PENGUIN',
      hint: 'Black and white bird that cannot fly'
    }, {
      word: 'DOLPHIN',
      hint: 'Intelligent marine mammal'
    }, {
      word: 'BUTTERFLY',
      hint: 'Colorful insect with wings'
    }, {
      word: 'KANGAROO',
      hint: 'Australian animal that hops'
    }, {
      word: 'OCTOPUS',
      hint: 'Sea creature with eight arms'
    }, {
      word: 'CHEETAH',
      hint: 'Fastest land animal'
    }, {
      word: 'RHINOCEROS',
      hint: 'Large animal with a horn'
    }, {
      word: 'FLAMINGO',
      hint: 'Pink bird that stands on one leg'
    }],
    'Countries': [{
      word: 'AUSTRALIA',
      hint: 'Country and continent'
    }, {
      word: 'BRAZIL',
      hint: 'Largest South American country'
    }, {
      word: 'CANADA',
      hint: 'Northern neighbor of the USA'
    }, {
      word: 'JAPAN',
      hint: 'Island nation in Asia'
    }, {
      word: 'EGYPT',
      hint: 'Home of the pyramids'
    }, {
      word: 'FRANCE',
      hint: 'Country known for the Eiffel Tower'
    }, {
      word: 'INDIA',
      hint: 'Second most populous country'
    }, {
      word: 'MEXICO',
      hint: 'Country south of the USA'
    }, {
      word: 'NORWAY',
      hint: 'Scandinavian country'
    }, {
      word: 'SPAIN',
      hint: 'European country known for flamenco'
    }],
    'Food': [{
      word: 'PIZZA',
      hint: 'Italian dish with toppings'
    }, {
      word: 'HAMBURGER',
      hint: 'Popular fast food item'
    }, {
      word: 'CHOCOLATE',
      hint: 'Sweet treat made from cocoa'
    }, {
      word: 'SPAGHETTI',
      hint: 'Long thin pasta'
    }, {
      word: 'SANDWICH',
      hint: 'Food between two slices of bread'
    }, {
      word: 'PANCAKES',
      hint: 'Flat cakes often eaten for breakfast'
    }, {
      word: 'STRAWBERRY',
      hint: 'Red berry with seeds on the outside'
    }, {
      word: 'POPCORN',
      hint: 'Snack made from corn kernels'
    }, {
      word: 'AVOCADO',
      hint: 'Green fruit used in guacamole'
    }, {
      word: 'PINEAPPLE',
      hint: 'Tropical fruit with a crown'
    }],
    'Movies': [{
      word: 'TITANIC',
      hint: 'Movie about a famous ship disaster'
    }, {
      word: 'AVATAR',
      hint: 'Blue aliens on Pandora'
    }, {
      word: 'FROZEN',
      hint: 'Disney movie about two sisters'
    }, {
      word: 'GLADIATOR',
      hint: 'Russell Crowe in ancient Rome'
    }, {
      word: 'INCEPTION',
      hint: 'Movie about dreams within dreams'
    }, {
      word: 'JAWS',
      hint: 'Movie about a great white shark'
    }, {
      word: 'CASABLANCA',
      hint: 'Classic movie set in Morocco'
    }, {
      word: 'BATMAN',
      hint: 'Dark Knight superhero'
    }, {
      word: 'SUPERMAN',
      hint: 'Man of Steel superhero'
    }, {
      word: 'SPIDERMAN',
      hint: 'Web-slinging superhero'
    }],
    'Sports': [{
      word: 'BASKETBALL',
      hint: 'Sport played with hoops'
    }, {
      word: 'FOOTBALL',
      hint: 'Sport with touchdowns'
    }, {
      word: 'BASEBALL',
      hint: 'America\'s pastime'
    }, {
      word: 'TENNIS',
      hint: 'Sport played with rackets'
    }, {
      word: 'GOLF',
      hint: 'Sport played on a course with holes'
    }, {
      word: 'SWIMMING',
      hint: 'Water sport'
    }, {
      word: 'BOXING',
      hint: 'Combat sport with gloves'
    }, {
      word: 'HOCKEY',
      hint: 'Sport played on ice with sticks'
    }, {
      word: 'VOLLEYBALL',
      hint: 'Sport played over a net'
    }, {
      word: 'WRESTLING',
      hint: 'Grappling sport'
    }]
  }; // DOM elements

  var wordContainer = document.getElementById('wordContainer');
  var categoryDisplay = document.getElementById('categoryDisplay');
  var alphabetButtons = document.getElementById('alphabetButtons');
  var wrongGuessesDisplay = document.getElementById('wrongGuesses');
  var scoreDisplay = document.getElementById('score');
  var hangmanParts = document.querySelectorAll('.hangman-parts > div'); // Control buttons

  var newGameBtn = document.getElementById('newGame');
  var showRulesBtn = document.getElementById('showRules');
  var showHintBtn = document.getElementById('showHint'); // Modal elements

  var rulesModal = document.getElementById('rulesModal');
  var closeBtn = document.querySelector('.close-btn'); // Game end overlay elements

  var gameEndOverlay = document.getElementById('gameEndOverlay');
  var winnerText = document.getElementById('winnerText');
  var winnerName = document.getElementById('winnerName');
  var finalScore = document.getElementById('finalScore');
  var wordReveal = document.getElementById('revealedWord');
  var replayButton = document.getElementById('replayButton');
  var homeButton = document.getElementById('homeButton'); // Initialize game

  function initGame() {
    createAlphabetButtons();
    newGame();
    setupEventListeners();
  } // Create alphabet buttons


  function createAlphabetButtons() {
    alphabetButtons.innerHTML = '';

    var _loop = function _loop(i) {
      var letter = String.fromCharCode(i);
      var button = document.createElement('button');
      button.className = 'letter-btn';
      button.textContent = letter;
      button.addEventListener('click', function () {
        return guessLetter(letter);
      });
      alphabetButtons.appendChild(button);
    };

    for (var i = 65; i <= 90; i++) {
      _loop(i);
    }
  } // Start new game


  function newGame() {
    // Reset game state
    gameState = {
      currentWord: '',
      currentCategory: '',
      guessedLetters: new Set(),
      wrongGuesses: 0,
      maxWrongGuesses: 6,
      score: gameState.score,
      // Keep score across games
      gameOver: false,
      gameWon: false,
      hintsUsed: 0
    }; // Choose random word

    var categories = Object.keys(wordCategories);
    var randomCategory = categories[Math.floor(Math.random() * categories.length)];
    var wordsInCategory = wordCategories[randomCategory];
    var randomWord = wordsInCategory[Math.floor(Math.random() * wordsInCategory.length)];
    gameState.currentWord = randomWord.word;
    gameState.currentCategory = randomCategory;
    gameState.currentHint = randomWord.hint; // Reset UI

    resetAlphabetButtons();
    hideAllHangmanParts();
    displayWord();
    displayCategory();
    updateDisplay();
    hideGameEndOverlay();
  } // Display word with blanks


  function displayWord() {
    wordContainer.innerHTML = '';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = gameState.currentWord[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var letter = _step.value;
        var letterBox = document.createElement('div');
        letterBox.className = 'letter-box';

        if (letter === ' ') {
          letterBox.style.border = 'none';
          letterBox.style.width = '20px';
        } else if (gameState.guessedLetters.has(letter)) {
          letterBox.textContent = letter;
          letterBox.classList.add('revealed');
        }

        wordContainer.appendChild(letterBox);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } // Display category


  function displayCategory() {
    categoryDisplay.textContent = "Category: ".concat(gameState.currentCategory);
  } // Guess a letter


  function guessLetter(letter) {
    if (gameState.gameOver || gameState.guessedLetters.has(letter)) {
      return;
    }

    gameState.guessedLetters.add(letter);
    var button = getLetterButton(letter);
    button.disabled = true;

    if (gameState.currentWord.includes(letter)) {
      button.classList.add('correct');
      displayWord();
      checkWin();
    } else {
      button.classList.add('incorrect');
      gameState.wrongGuesses++;
      showHangmanPart();
      checkLoss();
    }

    updateDisplay();
  } // Get letter button by letter


  function getLetterButton(letter) {
    return Array.from(alphabetButtons.children).find(function (btn) {
      return btn.textContent === letter;
    });
  } // Show hangman part


  function showHangmanPart() {
    if (gameState.wrongGuesses <= hangmanParts.length) {
      hangmanParts[gameState.wrongGuesses - 1].style.display = 'block';
    }
  } // Hide all hangman parts


  function hideAllHangmanParts() {
    hangmanParts.forEach(function (part) {
      return part.style.display = 'none';
    });
  } // Check win condition


  function checkWin() {
    var allLettersGuessed = gameState.currentWord.split('').filter(function (_char) {
      return _char !== ' ';
    }).every(function (letter) {
      return gameState.guessedLetters.has(letter);
    });

    if (allLettersGuessed) {
      gameState.gameWon = true;
      gameState.gameOver = true; // Calculate score bonus based on wrong guesses

      var bonus = Math.max(0, (6 - gameState.wrongGuesses) * 50);
      var baseScore = 100;
      var hintPenalty = gameState.hintsUsed * 25;
      var totalScore = baseScore + bonus - hintPenalty;
      gameState.score += Math.max(10, totalScore);
      showGameEnd(true);
    }
  } // Check loss condition


  function checkLoss() {
    if (gameState.wrongGuesses >= gameState.maxWrongGuesses) {
      gameState.gameOver = true;
      showGameEnd(false);
    }
  } // Show game end overlay


  function showGameEnd(won) {
    var message = won ? 'Congratulations!' : 'Game Over!';
    var result = won ? 'You Won!' : 'You Lost!'; // Use the createGameEndOverlay function from script.js

    createGameEndOverlay(result, function () {
      return window.open('https://buymeacoffee.com/alexandramcvay', '_blank');
    }, function () {
      removeGameEndOverlay();
      newGame();
    }, function () {
      return window.location.href = '../index.html';
    }, {
      accentColor: won ? '#4caf50' : '#f44336'
    }); // Update the overlay with game-specific information

    setTimeout(function () {
      var overlay = document.getElementById('game-end-overlay');

      if (overlay) {
        // Add game stats
        var winnerElement = overlay.querySelector('h2');
        winnerElement.textContent = message;
        var statsDiv = document.createElement('div');
        statsDiv.className = 'game-stats';
        statsDiv.innerHTML = "\n                    <p><strong>Final Score:</strong> ".concat(gameState.score, "</p>\n                    <p><strong>The word was:</strong> ").concat(gameState.currentWord, "</p>\n                    <p><strong>Category:</strong> ").concat(gameState.currentCategory, "</p>\n                    <p><strong>Wrong Guesses:</strong> ").concat(gameState.wrongGuesses, "/").concat(gameState.maxWrongGuesses, "</p>\n                ");
        var winnerNameElement = overlay.querySelector('h2').nextElementSibling;
        winnerNameElement.insertAdjacentElement('afterend', statsDiv);
      }
    }, 100);
  } // Show hint


  function showHint() {
    if (gameState.gameOver) return;

    if (confirm("Hint: ".concat(gameState.currentHint, "\n\nUsing a hint will cost you 25 points. Continue?"))) {
      gameState.hintsUsed++;
      gameState.score = Math.max(0, gameState.score - 25);
      updateDisplay();
    }
  } // Update display


  function updateDisplay() {
    wrongGuessesDisplay.textContent = "".concat(gameState.wrongGuesses, " / ").concat(gameState.maxWrongGuesses);
    scoreDisplay.textContent = gameState.score;
  } // Reset alphabet buttons


  function resetAlphabetButtons() {
    Array.from(alphabetButtons.children).forEach(function (button) {
      button.disabled = false;
      button.classList.remove('correct', 'incorrect');
    });
  } // Hide game end overlay


  function hideGameEndOverlay() {
    var overlay = document.getElementById('game-end-overlay');

    if (overlay) {
      overlay.remove();
    }
  } // Setup event listeners


  function setupEventListeners() {
    // Control buttons
    newGameBtn.addEventListener('click', newGame);
    showRulesBtn.addEventListener('click', function () {
      return rulesModal.style.display = 'block';
    });
    showHintBtn.addEventListener('click', showHint); // Modal

    closeBtn.addEventListener('click', function () {
      return rulesModal.style.display = 'none';
    });
    window.addEventListener('click', function (e) {
      if (e.target === rulesModal) {
        rulesModal.style.display = 'none';
      }
    }); // Keyboard support

    document.addEventListener('keydown', function (e) {
      if (gameState.gameOver) return;
      var letter = e.key.toUpperCase();

      if (letter >= 'A' && letter <= 'Z' && !gameState.guessedLetters.has(letter)) {
        guessLetter(letter);
      }
    }); // Escape key to close modal

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rulesModal.style.display === 'block') {
        rulesModal.style.display = 'none';
      }
    });
  } // Initialize the game when the page loads


  initGame();
});