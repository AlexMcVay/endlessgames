document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let gameState = {
        currentWord: '',
        currentCategory: '',
        guessedLetters: new Set(),
        wrongGuesses: 0,
        maxWrongGuesses: 6,
        score: 0,
        gameOver: false,
        gameWon: false,
        hintsUsed: 0
    };

    // Word categories and lists
    const wordCategories = {
        'Animals': [
            { word: 'ELEPHANT', hint: 'Large mammal with a trunk' },
            { word: 'GIRAFFE', hint: 'Tallest animal in the world' },
            { word: 'PENGUIN', hint: 'Black and white bird that cannot fly' },
            { word: 'DOLPHIN', hint: 'Intelligent marine mammal' },
            { word: 'BUTTERFLY', hint: 'Colorful insect with wings' },
            { word: 'KANGAROO', hint: 'Australian animal that hops' },
            { word: 'OCTOPUS', hint: 'Sea creature with eight arms' },
            { word: 'CHEETAH', hint: 'Fastest land animal' },
            { word: 'RHINOCEROS', hint: 'Large animal with a horn' },
            { word: 'FLAMINGO', hint: 'Pink bird that stands on one leg' }
        ],
        'Countries': [
            { word: 'AUSTRALIA', hint: 'Country and continent' },
            { word: 'BRAZIL', hint: 'Largest South American country' },
            { word: 'CANADA', hint: 'Northern neighbor of the USA' },
            { word: 'JAPAN', hint: 'Island nation in Asia' },
            { word: 'EGYPT', hint: 'Home of the pyramids' },
            { word: 'FRANCE', hint: 'Country known for the Eiffel Tower' },
            { word: 'INDIA', hint: 'Second most populous country' },
            { word: 'MEXICO', hint: 'Country south of the USA' },
            { word: 'NORWAY', hint: 'Scandinavian country' },
            { word: 'SPAIN', hint: 'European country known for flamenco' }
        ],
        'Food': [
            { word: 'PIZZA', hint: 'Italian dish with toppings' },
            { word: 'HAMBURGER', hint: 'Popular fast food item' },
            { word: 'CHOCOLATE', hint: 'Sweet treat made from cocoa' },
            { word: 'SPAGHETTI', hint: 'Long thin pasta' },
            { word: 'SANDWICH', hint: 'Food between two slices of bread' },
            { word: 'PANCAKES', hint: 'Flat cakes often eaten for breakfast' },
            { word: 'STRAWBERRY', hint: 'Red berry with seeds on the outside' },
            { word: 'POPCORN', hint: 'Snack made from corn kernels' },
            { word: 'AVOCADO', hint: 'Green fruit used in guacamole' },
            { word: 'PINEAPPLE', hint: 'Tropical fruit with a crown' }
        ],
        'Movies': [
            { word: 'TITANIC', hint: 'Movie about a famous ship disaster' },
            { word: 'AVATAR', hint: 'Blue aliens on Pandora' },
            { word: 'FROZEN', hint: 'Disney movie about two sisters' },
            { word: 'GLADIATOR', hint: 'Russell Crowe in ancient Rome' },
            { word: 'INCEPTION', hint: 'Movie about dreams within dreams' },
            { word: 'JAWS', hint: 'Movie about a great white shark' },
            { word: 'CASABLANCA', hint: 'Classic movie set in Morocco' },
            { word: 'BATMAN', hint: 'Dark Knight superhero' },
            { word: 'SUPERMAN', hint: 'Man of Steel superhero' },
            { word: 'SPIDERMAN', hint: 'Web-slinging superhero' }
        ],
        'Sports': [
            { word: 'BASKETBALL', hint: 'Sport played with hoops' },
            { word: 'FOOTBALL', hint: 'Sport with touchdowns' },
            { word: 'BASEBALL', hint: 'America\'s pastime' },
            { word: 'TENNIS', hint: 'Sport played with rackets' },
            { word: 'GOLF', hint: 'Sport played on a course with holes' },
            { word: 'SWIMMING', hint: 'Water sport' },
            { word: 'BOXING', hint: 'Combat sport with gloves' },
            { word: 'HOCKEY', hint: 'Sport played on ice with sticks' },
            { word: 'VOLLEYBALL', hint: 'Sport played over a net' },
            { word: 'WRESTLING', hint: 'Grappling sport' }
        ]
    };

    // DOM elements
    const wordContainer = document.getElementById('wordContainer');
    const categoryDisplay = document.getElementById('categoryDisplay');
    const alphabetButtons = document.getElementById('alphabetButtons');
    const wrongGuessesDisplay = document.getElementById('wrongGuesses');
    const scoreDisplay = document.getElementById('score');
    const hangmanParts = document.querySelectorAll('.hangman-parts > div');
    
    // Control buttons
    const newGameBtn = document.getElementById('newGame');
    const showRulesBtn = document.getElementById('showRules');
    const showHintBtn = document.getElementById('showHint');
    
    // Modal elements
    const rulesModal = document.getElementById('rulesModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // Game end overlay elements
    const gameEndOverlay = document.getElementById('gameEndOverlay');
    const winnerText = document.getElementById('winnerText');
    const winnerName = document.getElementById('winnerName');
    const finalScore = document.getElementById('finalScore');
    const wordReveal = document.getElementById('revealedWord');
    const replayButton = document.getElementById('replayButton');
    const homeButton = document.getElementById('homeButton');

    // Initialize game
    function initGame() {
        createAlphabetButtons();
        newGame();
        setupEventListeners();
    }

    // Create alphabet buttons
    function createAlphabetButtons() {
        alphabetButtons.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const button = document.createElement('button');
            button.className = 'letter-btn';
            button.textContent = letter;
            button.addEventListener('click', () => guessLetter(letter));
            alphabetButtons.appendChild(button);
        }
    }

    // Start new game
    function newGame() {
        // Reset game state
        gameState = {
            currentWord: '',
            currentCategory: '',
            guessedLetters: new Set(),
            wrongGuesses: 0,
            maxWrongGuesses: 6,
            score: gameState.score, // Keep score across games
            gameOver: false,
            gameWon: false,
            hintsUsed: 0
        };

        // Choose random word
        const categories = Object.keys(wordCategories);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const wordsInCategory = wordCategories[randomCategory];
        const randomWord = wordsInCategory[Math.floor(Math.random() * wordsInCategory.length)];
        
        gameState.currentWord = randomWord.word;
        gameState.currentCategory = randomCategory;
        gameState.currentHint = randomWord.hint;

        // Reset UI
        resetAlphabetButtons();
        hideAllHangmanParts();
        displayWord();
        displayCategory();
        updateDisplay();
        hideGameEndOverlay();
    }

    // Display word with blanks
    function displayWord() {
        wordContainer.innerHTML = '';
        for (let letter of gameState.currentWord) {
            const letterBox = document.createElement('div');
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
    }

    // Display category
    function displayCategory() {
        categoryDisplay.textContent = `Category: ${gameState.currentCategory}`;
    }

    // Guess a letter
    function guessLetter(letter) {
        if (gameState.gameOver || gameState.guessedLetters.has(letter)) {
            return;
        }

        gameState.guessedLetters.add(letter);
        
        const button = getLetterButton(letter);
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
    }

    // Get letter button by letter
    function getLetterButton(letter) {
        return Array.from(alphabetButtons.children).find(btn => btn.textContent === letter);
    }

    // Show hangman part
    function showHangmanPart() {
        if (gameState.wrongGuesses <= hangmanParts.length) {
            hangmanParts[gameState.wrongGuesses - 1].style.display = 'block';
        }
    }

    // Hide all hangman parts
    function hideAllHangmanParts() {
        hangmanParts.forEach(part => part.style.display = 'none');
    }

    // Check win condition
    function checkWin() {
        const allLettersGuessed = gameState.currentWord
            .split('')
            .filter(char => char !== ' ')
            .every(letter => gameState.guessedLetters.has(letter));

        if (allLettersGuessed) {
            gameState.gameWon = true;
            gameState.gameOver = true;
            
            // Calculate score bonus based on wrong guesses
            const bonus = Math.max(0, (6 - gameState.wrongGuesses) * 50);
            const baseScore = 100;
            const hintPenalty = gameState.hintsUsed * 25;
            const totalScore = baseScore + bonus - hintPenalty;
            
            gameState.score += Math.max(10, totalScore);
            
            showGameEnd(true);
        }
    }

    // Check loss condition
    function checkLoss() {
        if (gameState.wrongGuesses >= gameState.maxWrongGuesses) {
            gameState.gameOver = true;
            showGameEnd(false);
        }
    }

    // Show game end overlay
    function showGameEnd(won) {
        const message = won ? 'Congratulations!' : 'Game Over!';
        const result = won ? 'You Won!' : 'You Lost!';
        
        // Use the createGameEndOverlay function from script.js
        createGameEndOverlay(
            result,
            () => window.open('https://buymeacoffee.com/alexandramcvay', '_blank'),
            () => {
                removeGameEndOverlay();
                newGame();
            },
            () => window.location.href = '../index.html',
            { accentColor: won ? '#4caf50' : '#f44336' }
        );

        // Update the overlay with game-specific information
        setTimeout(() => {
            const overlay = document.getElementById('game-end-overlay');
            if (overlay) {
                // Add game stats
                const winnerElement = overlay.querySelector('h2');
                winnerElement.textContent = message;
                
                const statsDiv = document.createElement('div');
                statsDiv.className = 'game-stats';
                statsDiv.innerHTML = `
                    <p><strong>Final Score:</strong> ${gameState.score}</p>
                    <p><strong>The word was:</strong> ${gameState.currentWord}</p>
                    <p><strong>Category:</strong> ${gameState.currentCategory}</p>
                    <p><strong>Wrong Guesses:</strong> ${gameState.wrongGuesses}/${gameState.maxWrongGuesses}</p>
                `;
                
                const winnerNameElement = overlay.querySelector('h2').nextElementSibling;
                winnerNameElement.insertAdjacentElement('afterend', statsDiv);
            }
        }, 100);
    }

    // Show hint
    function showHint() {
        if (gameState.gameOver) return;
        
        if (confirm(`Hint: ${gameState.currentHint}\n\nUsing a hint will cost you 25 points. Continue?`)) {
            gameState.hintsUsed++;
            gameState.score = Math.max(0, gameState.score - 25);
            updateDisplay();
        }
    }

    // Update display
    function updateDisplay() {
        wrongGuessesDisplay.textContent = `${gameState.wrongGuesses} / ${gameState.maxWrongGuesses}`;
        scoreDisplay.textContent = gameState.score;
    }

    // Reset alphabet buttons
    function resetAlphabetButtons() {
        Array.from(alphabetButtons.children).forEach(button => {
            button.disabled = false;
            button.classList.remove('correct', 'incorrect');
        });
    }

    // Hide game end overlay
    function hideGameEndOverlay() {
        const overlay = document.getElementById('game-end-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Control buttons
        newGameBtn.addEventListener('click', newGame);
        showRulesBtn.addEventListener('click', () => rulesModal.style.display = 'block');
        showHintBtn.addEventListener('click', showHint);
        
        // Modal
        closeBtn.addEventListener('click', () => rulesModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (gameState.gameOver) return;
            
            const letter = e.key.toUpperCase();
            if (letter >= 'A' && letter <= 'Z' && !gameState.guessedLetters.has(letter)) {
                guessLetter(letter);
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && rulesModal.style.display === 'block') {
                rulesModal.style.display = 'none';
            }
        });
    }

    // Initialize the game when the page loads
    initGame();
});
