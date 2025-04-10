document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const board = document.getElementById('checkerboard');
    const newGameBtn = document.getElementById('newGame');
    const playTwoPlayerBtn = document.getElementById('playTwoPlayer');
    const playComputerBtn = document.getElementById('playComputer');
    const showRulesBtn = document.getElementById('showRules');
    const rulesModal = document.getElementById('rulesModal');
    const closeBtn = document.querySelector('.close-btn');
    const redTurn = document.getElementById('redTurn');
    const blackTurn = document.getElementById('blackTurn');
    const redPlayer = document.getElementById('redPlayer');
    const blackPlayer = document.getElementById('blackPlayer');

    // Game state
    let gameState = {
        board: [],
        currentPlayer: 'red', // 'red' or 'black'
        selectedPiece: null,
        validMoves: [],
        jumpMoves: [],
        gameMode: 'two-player', // 'two-player' or 'computer'
        gameOver: false,
        redPieces: 12,
        blackPieces: 12
    };

    // Initialize the board
    function initializeBoard() {
        board.innerHTML = '';
        gameState.board = [];
        
        for (let row = 0; row < 8; row++) {
            gameState.board[row] = [];
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add click event for square
                square.addEventListener('click', () => handleSquareClick(row, col));
                
                // Place pieces
                if ((row + col) % 2 === 1) {
                    if (row < 3) {
                        // Black pieces
                        addPiece(square, 'black');
                        gameState.board[row][col] = { type: 'black', isKing: false };
                    } else if (row > 4) {
                        // Red pieces
                        addPiece(square, 'red');
                        gameState.board[row][col] = { type: 'red', isKing: false };
                    } else {
                        // Empty square
                        gameState.board[row][col] = null;
                    }
                } else {
                    // Light squares can't have pieces
                    gameState.board[row][col] = null;
                }
                
                board.appendChild(square);
            }
        }
        
        updateTurnIndicator();
    }

    // Add a piece to a square
    function addPiece(square, type, isKing = false) {
        const piece = document.createElement('div');
        piece.classList.add('piece', type);
        if (isKing) {
            piece.classList.add(`${type}-king`);
        }
        square.appendChild(piece);
    }

    // Handle square click
    function handleSquareClick(row, col) {
        if (gameState.gameOver) return;
        
        // If it's computer's turn and game mode is vs computer, do nothing
        if (gameState.currentPlayer === 'black' && gameState.gameMode === 'computer') return;
        
        const square = gameState.board[row][col];
        
        // If a piece is already selected
        if (gameState.selectedPiece) {
            // Check if clicked on a valid move square
            const moveIndex = gameState.validMoves.findIndex(move => 
                move.toRow === row && move.toCol === col);
            
            if (moveIndex !== -1) {
                // Make the move
                makeMove(gameState.validMoves[moveIndex]);
                return;
            }
            
            // Clear selection if clicked elsewhere
            clearSelection();
            
            // If clicked on own piece, select it
            if (square && square.type === gameState.currentPlayer) {
                selectPiece(row, col);
            }
        } else {
            // No piece selected yet, try to select one
            if (square && square.type === gameState.currentPlayer) {
                selectPiece(row, col);
            }
        }
    }

    // Select a piece
    function selectPiece(row, col) {
        clearSelection();
        
        const piece = gameState.board[row][col];
        if (!piece || piece.type !== gameState.currentPlayer) return;
        
        gameState.selectedPiece = { row, col };
        
        // Highlight the selected piece
        const squareElement = getSquareElement(row, col);
        squareElement.classList.add('highlight');
        
        // Find valid moves
        gameState.validMoves = findValidMoves(row, col);
        
        // Check if there are mandatory jumps
        gameState.jumpMoves = gameState.validMoves.filter(move => move.isJump);
        
        // If there are jump moves, only show those
        const movesToShow = gameState.jumpMoves.length > 0 ? gameState.jumpMoves : gameState.validMoves;
        
        // Highlight valid move squares
        movesToShow.forEach(move => {
            const moveSquare = getSquareElement(move.toRow, move.toCol);
            moveSquare.classList.add('valid-move');
        });
    }

    // Clear all selections and highlights
    function clearSelection() {
        gameState.selectedPiece = null;
        
        // Remove all highlights
        document.querySelectorAll('.highlight, .valid-move').forEach(el => {
            el.classList.remove('highlight', 'valid-move');
        });
        
        gameState.validMoves = [];
        gameState.jumpMoves = [];
    }

    // Find valid moves for a piece
    function findValidMoves(row, col) {
        const piece = gameState.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        const isKing = piece.isKing;
        const directions = isKing ? [-1, 1] : piece.type === 'red' ? [-1] : [1];
        
        // Check for simple moves and jumps in each direction
        directions.forEach(rowDir => {
            [-1, 1].forEach(colDir => {
                // Simple move
                const moveRow = row + rowDir;
                const moveCol = col + colDir;
                
                if (isValidSquare(moveRow, moveCol) && !gameState.board[moveRow][moveCol]) {
                    moves.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: moveRow,
                        toCol: moveCol,
                        isJump: false
                    });
                }
                
                // Jump move
                const jumpRow = row + rowDir * 2;
                const jumpCol = col + colDir * 2;
                
                if (isValidSquare(jumpRow, jumpCol) && !gameState.board[jumpRow][jumpCol]) {
                    const captureRow = row + rowDir;
                    const captureCol = col + colDir;
                    const capturedPiece = gameState.board[captureRow][captureCol];
                    
                    if (capturedPiece && capturedPiece.type !== piece.type) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: jumpRow,
                            toCol: jumpCol,
                            isJump: true,
                            captureRow: captureRow,
                            captureCol: captureCol
                        });
                    }
                }
            });
        });
        
        return moves;
    }

    // Check if a board position is valid
    function isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Get the DOM element for a board square
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    // Make a move
    function makeMove(move) {
        // Get piece information
        const piece = gameState.board[move.fromRow][move.fromCol];
        
        // Remove piece from original position
        gameState.board[move.fromRow][move.fromCol] = null;
        const fromSquare = getSquareElement(move.fromRow, move.fromCol);
        fromSquare.innerHTML = '';
        
        // If it's a jump, remove the captured piece
        if (move.isJump) {
            gameState.board[move.captureRow][move.captureCol] = null;
            const captureSquare = getSquareElement(move.captureRow, move.captureCol);
            captureSquare.innerHTML = '';
            
            // Update piece count
            if (piece.type === 'red') {
                gameState.blackPieces--;
            } else {
                gameState.redPieces--;
            }
        }
        
        // Check for king promotion
        const isKingRow = (piece.type === 'red' && move.toRow === 0) || 
                         (piece.type === 'black' && move.toRow === 7);
        if (isKingRow) {
            piece.isKing = true;
        }
        
        // Place piece in new position
        gameState.board[move.toRow][move.toCol] = piece;
        const toSquare = getSquareElement(move.toRow, move.toCol);
        addPiece(toSquare, piece.type, piece.isKing);
        
        // Clear selections
        clearSelection();
        
        // Check for additional jumps
        let additionalJumps = [];
        if (move.isJump) {
            additionalJumps = findValidMoves(move.toRow, move.toCol).filter(m => m.isJump);
        }
        
        // If there are additional jumps possible, select the piece again
        if (move.isJump && additionalJumps.length > 0) {
            selectPiece(move.toRow, move.toCol);
        } else {
            // End turn
            switchTurn();
        }
        
        // Check for game over
        checkGameOver();
    }

    // Switch turns
    function switchTurn() {
        gameState.currentPlayer = gameState.currentPlayer === 'red' ? 'black' : 'red';
        updateTurnIndicator();
        
        // If it's computer's turn and game mode is vs computer
        if (gameState.currentPlayer === 'black' && gameState.gameMode === 'computer' && !gameState.gameOver) {
            // Wait a bit before computer makes a move
            setTimeout(computerMove, 800);
        }
    }

    // Update turn indicator
    function updateTurnIndicator() {
        if (gameState.currentPlayer === 'red') {
            redTurn.style.display = 'inline';
            blackTurn.style.display = 'none';
        } else {
            redTurn.style.display = 'none';
            blackTurn.style.display = 'inline';
        }
        
        // Update player names based on game mode
        if (gameState.gameMode === 'computer') {
            blackPlayer.textContent = 'Computer (Black)';
        } else {
            blackPlayer.textContent = 'Player 2 (Black)';
        }
    }

    // Computer move logic
    function computerMove() {
        // Find all pieces that can move
        const computerPieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                if (piece && piece.type === 'black') {
                    const moves = findValidMoves(row, col);
                    if (moves.length > 0) {
                        computerPieces.push({ row, col, moves });
                    }
                }
            }
        }
        
        // Check if there are any jump moves
        const piecesWithJumps = computerPieces.filter(p => 
            p.moves.some(m => m.isJump)
        );
        
        let selectedPiece, selectedMove;
        
        // If there are jump moves, prioritize them
        if (piecesWithJumps.length > 0) {
            // Choose a random piece that can jump
            selectedPiece = piecesWithJumps[Math.floor(Math.random() * piecesWithJumps.length)];
            // Get only the jump moves
            const jumpMoves = selectedPiece.moves.filter(m => m.isJump);
            // Choose a random jump move
            selectedMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
        } else {
            // No jumps, choose a random piece and move
            selectedPiece = computerPieces[Math.floor(Math.random() * computerPieces.length)];
            selectedMove = selectedPiece.moves[Math.floor(Math.random() * selectedPiece.moves.length)];
        }
        
        // Simulate selecting the piece (for visual feedback)
        selectPiece(selectedPiece.row, selectedPiece.col);
        
        // Wait a bit and then make the move
        setTimeout(() => {
            makeMove(selectedMove);
        }, 500);
    }

    // Check if the game is over
    function checkGameOver() {
        // Check if a player has no pieces left
        if (gameState.redPieces === 0) {
            endGame('Black wins!');
            return;
        }
        
        if (gameState.blackPieces === 0) {
            endGame('Red wins!');
            return;
        }
        
        // Check if current player can't move
        const canMove = checkCanMove(gameState.currentPlayer);
        if (!canMove) {
            endGame(`${gameState.currentPlayer === 'red' ? 'Black' : 'Red'} wins! ${gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)} has no valid moves.`);
        }
    }

    // Check if a player can make any moves
    function checkCanMove(player) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                if (piece && piece.type === player) {
                    const moves = findValidMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // End the game
    function endGame(message) {
        gameState.gameOver = true;
        setTimeout(() => {
            alert(message);
        }, 200);
    }

    // Reset the game
    function resetGame() {
        gameState.currentPlayer = 'red';
        gameState.selectedPiece = null;
        gameState.validMoves = [];
        gameState.jumpMoves = [];
        gameState.gameOver = false;
        gameState.redPieces = 12;
        gameState.blackPieces = 12;
        
        clearSelection();
        initializeBoard();
    }

    // Event listeners
    newGameBtn.addEventListener('click', resetGame);
    
    playTwoPlayerBtn.addEventListener('click', () => {
        gameState.gameMode = 'two-player';
        resetGame();
    });
    
    playComputerBtn.addEventListener('click', () => {
        gameState.gameMode = 'computer';
        resetGame();

    });
    
    showRulesBtn.addEventListener('click', () => {
        rulesModal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        rulesModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });

    // Initialize the game
    initializeBoard();
});