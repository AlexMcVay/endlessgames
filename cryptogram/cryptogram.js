document.addEventListener('DOMContentLoaded', () => {
    const cryptogramBoard = document.getElementById('cryptogramBoard');
    const newGameBtn = document.getElementById('newGame');
    const showHintBtn = document.getElementById('showHint');

    const phrases = [
        { phrase: "Bravery is action in spite of fear, not in the absence of it.", author: "Jennifer Lynn Alvarez" },
        { phrase: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { phrase: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { phrase: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { phrase: "The best way to predict the future is to create it.", author: "Peter Drucker"},
        { phrase: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
        { phrase: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
        { phrase: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
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
                cell.classList.add('cryptogram-cell');                const input = document.createElement('input');
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
                const staticChar = document.createElement('div');
                staticChar.classList.add('cryptogram-static');
                staticChar.textContent = char;
                cellContainer.appendChild(staticChar);
            }

            cryptogramContainer.appendChild(cellContainer);
        });

        cryptogramBoard.appendChild(cryptogramContainer);
    }    // Handle input in the cryptogram cells
    function handleInput(event) {
        const index = event.target.dataset.index;
        const value = event.target.value.toUpperCase();
        const correctLetter = currentPhrase[index];

        // Accept only alphabetic inputs
        if (value.match(/^[A-Z]$/)) {
            playerGuesses[index] = value;
            
            if (value === correctLetter) {
                // Correct letter - green styling
                event.target.style.backgroundColor = '#d4edda'; // Light green background for correct
                event.target.style.color = '#155724'; // Dark green text
                
                // Move focus to next empty input
                const nextInput = findNextEmptyInput(index);
                if (nextInput) {
                    setTimeout(() => nextInput.focus(), 100);
                }
            } else {
                // Incorrect letter - neutral styling (player can see their guess)
                event.target.style.backgroundColor = '#fff3cd'; // Light yellow background for incorrect
                event.target.style.color = '#856404'; // Dark yellow text
            }
        } else {
            // Invalid input - clear it
            event.target.value = '';
            delete playerGuesses[index];
            event.target.style.backgroundColor = '';
            event.target.style.color = '';
        }

        checkWinCondition();
    }// Helper function to find the next empty input field
    function findNextEmptyInput(currentIndex) {
        const inputs = document.querySelectorAll('.cryptogram-cell input');
        const currentIndexNum = parseInt(currentIndex);
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const inputIndex = parseInt(input.dataset.index);
            
            if (inputIndex > currentIndexNum && input.value === '') {
                return input;
            }
        }
        return null;
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

    // Handle keyboard navigation
    function handleKeyDown(event) {
        const currentIndex = parseInt(event.target.dataset.index);
        const inputs = document.querySelectorAll('.cryptogram-cell input');
        
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                findPreviousInput(currentIndex)?.focus();
                break;
            case 'ArrowRight':
                event.preventDefault();
                findNextInput(currentIndex)?.focus();
                break;
            case 'Backspace':
                if (event.target.value === '') {
                    event.preventDefault();
                    const prevInput = findPreviousInput(currentIndex);
                    if (prevInput) {
                        prevInput.value = '';
                        delete playerGuesses[prevInput.dataset.index];
                        prevInput.style.backgroundColor = '';
                        prevInput.style.color = '';
                        prevInput.focus();
                    }
                }
                break;
        }
    }

    // Helper function to find the previous input field
    function findPreviousInput(currentIndex) {
        const inputs = document.querySelectorAll('.cryptogram-cell input');
        let previousInput = null;
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const inputIndex = parseInt(input.dataset.index);
            
            if (inputIndex < currentIndex) {
                previousInput = input;
            } else {
                break;
            }
        }
        return previousInput;
    }

    // Helper function to find the next input field (for arrow navigation)
    function findNextInput(currentIndex) {
        const inputs = document.querySelectorAll('.cryptogram-cell input');
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const inputIndex = parseInt(input.dataset.index);
            
            if (inputIndex > currentIndex) {
                return input;
            }
        }
        return null;
    }

    // Event listeners
    newGameBtn.addEventListener('click', startNewGame);
    showHintBtn.addEventListener('click', () => {
        alert(`Hint: The phrase starts with "${currentPhrase[0]}"`);
    });

    // Start the first game
    startNewGame();
});