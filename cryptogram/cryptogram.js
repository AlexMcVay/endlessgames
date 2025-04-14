document.addEventListener('DOMContentLoaded', () => {
    const cryptogramBoard = document.getElementById('cryptogramBoard');
    const newGameBtn = document.getElementById('newGame');
    const showHintBtn = document.getElementById('showHint');

    const phrases = [
        { phrase: "Test", author: "me" }
    ];

    let currentPhrase = '';
    let currentAuthor = '';
    let encryptedPhrase = '';
    let playerGuesses = {};
    let letterToNumberMap = {}; // Map to store random numbers for each letter

    // Function to start a new game
    function startNewGame() {
        const selected = phrases[Math.floor(Math.random() * phrases.length)];
        currentPhrase = selected.phrase.toUpperCase();
        currentAuthor = selected.author;
        encryptedPhrase = encryptPhrase(currentPhrase);
        playerGuesses = {};
        renderBoard();
    }

    // Function to encrypt the phrase and assign random numbers to letters
    function encryptPhrase(phrase) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const shuffled = alphabet.split('').sort(() => Math.random() - 0.5).join('');
        const cipher = {};
        alphabet.split('').forEach((letter, index) => {
            cipher[letter] = shuffled[index];
        });

        // Assign random numbers to each letter
        letterToNumberMap = {};
        const availableNumbers = Array.from({ length: 26 }, (_, i) => i + 1).sort(() => Math.random() - 0.5); // Shuffle numbers 1-26
        phrase.split('').forEach(char => {
            if (char.match(/[A-Z]/) && !letterToNumberMap[char]) {
                letterToNumberMap[char] = availableNumbers.pop(); // Assign a random number from the shuffled list
            }
        });

        return phrase.split('').map(char => (cipher[char] || char)).join('');
    }

    // Function to render the cryptogram board
    function renderBoard() {
        cryptogramBoard.innerHTML = '';

        // Create a container for the cryptogram
        const cryptogramContainer = document.createElement('div');
        cryptogramContainer.classList.add('cryptogram-container');

        encryptedPhrase.split('').forEach((char, index) => {
            const cellContainer = document.createElement('div');
            cellContainer.classList.add('cryptogram-cell-container');

            // Add number above the input or character
            const numberCell = document.createElement('div');
            numberCell.classList.add('cryptogram-number');
            numberCell.textContent = char.match(/[A-Z]/) ? letterToNumberMap[currentPhrase[index]] : ''; // Use the same number for the same letter
            cellContainer.appendChild(numberCell);

            // Add input box for letters or static character for spaces/punctuation
            if (char.match(/[A-Z]/)) {
                const cell = document.createElement('div');
                cell.classList.add('cryptogram-cell');

                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.index = index;
                input.value = playerGuesses[index] || '';
                input.addEventListener('input', handleInput);
                cell.appendChild(input);

                cellContainer.appendChild(cell);
            } else {
                // Add static character outside of the cell
                const staticChar = document.createElement('div');
                staticChar.classList.add('cryptogram-static');
                staticChar.textContent = char;
                cellContainer.appendChild(staticChar);
            }

            cryptogramContainer.appendChild(cellContainer);
        });

        cryptogramBoard.appendChild(cryptogramContainer);
    }

    // Handle input in the cryptogram cells
    function handleInput(event) {
        const index = event.target.dataset.index;
        const value = event.target.value.toUpperCase();

        // Accept only valid alphabetic inputs
        if (value.match(/^[A-Z]$/)) {
            playerGuesses[index] = value;
        } else {
            event.target.value = ''; // Clear invalid input
            delete playerGuesses[index];
        }

        checkWinCondition();
    }

    // Check if the player has won
    function checkWinCondition() {
        const guessedPhrase = encryptedPhrase.split('').map((char, index) => {
            return char.match(/[A-Z]/) ? (playerGuesses[index] || '') : char;
        }).join('');

        if (guessedPhrase === currentPhrase) {
            handleGameOver();
        }
    }

    // Handle game over
    function handleGameOver() {
        const message = `Congratulations! You solved the cryptogram:<br><br>"<strong>${currentPhrase}</strong>"<br><br>- ${currentAuthor}`;
        createSoloGameOverlay(
            message,
            () => window.open('https://buymeacoffee.com/alexandramcvay', '_blank'), // Donate button
            () => location.reload(), // Replay button reloads the page
            () => window.location.href = '../index.html', // Home button redirects to index.html
            { accentColor: 'var(--primary-color)' } // Use the accent color from styles.css
        );
    }

    // Event listeners
    newGameBtn.addEventListener('click', startNewGame);
    showHintBtn.addEventListener('click', () => {
        alert(`Hint: The phrase starts with "${currentPhrase[0]}"`);
    });

    // Start the first game
    startNewGame();
});