document.addEventListener('DOMContentLoaded', () => {
    // Initialize chess.js
    const chess = new Chess();
    
    // DOM elements
    const chessboard = document.getElementById('chessboard');
    const gameStatus = document.getElementById('gameStatus');
    const moveHistory = document.getElementById('moveHistory');
    const promotionModal = document.getElementById('promotionModal');
    
    // Game state variables
    let selectedSquare = null;
    let lastMove = null;
    let boardFlipped = false;
    let gameMode = 'local'; // 'local' or 'computer'
    let pendingPromotion = null;
    
    // Chess piece Unicode characters
    const pieces = {
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
    };
    
    // Files and ranks for board notation
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    // Initialize the board
    function createBoard() {
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Adjust for board flipping
                const displayRow = boardFlipped ? 7 - row : row;
                const displayCol = boardFlipped ? 7 - col : col;
                
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                
                // Add rank and file labels
                if (displayCol === 0) {
                    const rankLabel = document.createElement('div');
                    rankLabel.classList.add('rank-label');
                    rankLabel.textContent = ranks[displayRow];
                    square.appendChild(rankLabel);
                }
                
                if (displayRow === 7) {
                    const fileLabel = document.createElement('div');
                    fileLabel.classList.add('file-label');
                    fileLabel.textContent = files[displayCol];
                    square.appendChild(fileLabel);
                }
                
                // Set data attributes for position
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.pos = files[displayCol] + ranks[displayRow];
                
                // Add event listeners
                square.addEventListener('click', handleSquareClick);
                
                chessboard.appendChild(square);
            }
        }
        
        updateBoard();
    }
    
    // Update the board based on the current game state
    function updateBoard() {
        // Clear all pieces
        document.querySelectorAll('.square').forEach(square => {
            square.textContent = '';
            square.classList.remove('selected', 'last-move');
            
            // Re-add rank and file labels
            const pos = square.dataset.pos;
            if (pos[0] === 'a') {
                const rankLabel = document.createElement('div');
                rankLabel.classList.add('rank-label');
                rankLabel.textContent = pos[1];
                square.appendChild(rankLabel);
            }
            
            if (pos[1] === '1') {
                const fileLabel = document.createElement('div');
                fileLabel.classList.add('file-label');
                fileLabel.textContent = pos[0];
                square.appendChild(fileLabel);
            }
        });
        
        // Place pieces based on chess.js board state
        const board = chess.board();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = boardFlipped ? 7 - row : row;
                const displayCol = boardFlipped ? 7 - col : col;
                
                const piece = board[row][col];
                if (piece) {
                    const squarePos = files[displayCol] + ranks[displayRow];
                    const square = document.querySelector(`.square[data-pos="${squarePos}"]`);
                    
                    if (square) {
                        square.textContent = pieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
                    }
                }
            }
        }
        
        // Highlight selected square
        if (selectedSquare) {
            const square = document.querySelector(`.square[data-pos="${selectedSquare}"]`);
            if (square) {
                square.classList.add('selected');
            }
        }
        
        // Highlight last move
        if (lastMove) {
            const fromSquare = document.querySelector(`.square[data-pos="${lastMove.from}"]`);
            const toSquare = document.querySelector(`.square[data-pos="${lastMove.to}"]`);
            
            if (fromSquare) fromSquare.classList.add('last-move');
            if (toSquare) toSquare.classList.add('last-move');
        }
        
        // Update game status
        updateStatus();
        
        // Update move history
        updateMoveHistory();
    }
    
    // Handle square click
    function handleSquareClick(event) {
        const square = event.currentTarget;
        const pos = square.dataset.pos;
        
        // If a promotion is pending, ignore clicks
        if (pendingPromotion) return;
        
        // If a square is already selected
        if (selectedSquare) {
            // Try to make a move
            const move = {
                from: selectedSquare,
                to: pos,
            };
            
            // Check if this is a pawn promotion move
            if (isPawnPromotion(move)) {
                pendingPromotion = move;
                showPromotionDialog();
                return;
            }
            
            const result = makeMove(move);
            
            // If move is legal, clear selection and update board
            if (result) {
                selectedSquare = null;
                updateBoard();
                
                // If playing against computer, make computer move
                if (gameMode === 'computer' && !chess.game_over()) {
                    setTimeout(makeComputerMove, 500);
                }
            } 
            // If move is not legal but user clicked on their own piece, select that piece instead
            else {
                const piece = chess.get(pos);
                if (piece && piece.color === (chess.turn() === 'w' ? 'w' : 'b')) {
                    selectedSquare = pos;
                    updateBoard();
                }
            }
        } 
        // If no square is selected, select this square if it has a piece of the current turn
        else {
            const piece = chess.get(pos);
            if (piece && piece.color === (chess.turn() === 'w' ? 'w' : 'b')) {
                selectedSquare = pos;
                updateBoard();
            }
        }
    }
    
    // Check if a move would be a pawn promotion
    function isPawnPromotion(move) {
        const piece = chess.get(move.from);
        if (!piece || piece.type !== 'p') return false;
        
        const toRank = move.to.charAt(1);
        return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
    }
    
    // Show promotion dialog
    function showPromotionDialog() {
        promotionModal.style.display = 'flex';
        
        const promotionOptions = document.querySelectorAll('.promotion-option');
        promotionOptions.forEach(option => {
            option.addEventListener('click', handlePromotionChoice);
        });
    }
    
    // Handle promotion piece choice
    function handlePromotionChoice(event) {
        const piece = event.currentTarget.dataset.piece;
        
        if (pendingPromotion) {
            pendingPromotion.promotion = piece;
            makeMove(pendingPromotion);
            pendingPromotion = null;
            hidePromotionDialog();
            updateBoard();
            
            // If playing against computer, make computer move
            if (gameMode === 'computer' && !chess.game_over()) {
                setTimeout(makeComputerMove, 500);
            }
        }
    }
    
    // Hide promotion dialog
    function hidePromotionDialog() {
        promotionModal.style.display = 'none';
        
        const promotionOptions = document.querySelectorAll('.promotion-option');
        promotionOptions.forEach(option => {
            option.removeEventListener('click', handlePromotionChoice);
        });
    }
    
    // Make a move
    function makeMove(move) {
        try {
            const result = chess.move(move);
            if (result) {
                lastMove = { from: result.from, to: result.to };
                return true;
            }
            return false;
        } catch (e) {
            console.error('Invalid move:', e);
            return false;
        }
    }
    
    // Make a computer move
    function makeComputerMove() {
        if (chess.game_over()) return;
        
        // Get all legal moves
        const moves = chess.moves({ verbose: true });
        
        // Basic AI: prioritize captures and checks
        let bestMoves = [];
        let bestScore = -Infinity;
        
        for (const move of moves) {
            let score = 0;
            
            // Try the move
            chess.move(move);
            
            // Check if this move puts opponent in check
            if (chess.in_check()) {
                score += 5;
            }
            
            // Check if this move is a capture
            if (move.captured) {
                const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
                score += pieceValues[move.captured] || 0;
            }
            
            // Undo the move
            chess.undo();
            
            // Track best moves
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        
        // If no good moves found, pick random move
        if (bestMoves.length === 0) {
            bestMoves = moves;
        }
        
        // Choose a random move from best moves
        const randomMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        
        // Make the move
        if (randomMove) {
            chess.move(randomMove);
            lastMove = { from: randomMove.from, to: randomMove.to };
            updateBoard();
        }
    }
    
    // Update game status
    function updateStatus() {
        let status = '';
        
        if (chess.in_checkmate()) {
            status = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins`;
            // TODO: #1 create a win screen
        } else if (chess.in_draw()) {
            status = 'Draw!';
            if (chess.in_stalemate()) {
                status += ' (Stalemate)';
            } else if (chess.in_threefold_repetition()) {
                status += ' (Threefold Repetition)';
            } else if (chess.insufficient_material()) {
                status += ' (Insufficient Material)';
            }
        } else {
            status = `${chess.turn() === 'w' ? 'White' : 'Black'} to move`;
            if (chess.in_check()) {
                status += ' (Check!)';
            }
        }
        
        gameStatus.textContent = status;
    }
    
    // Update move history
    function updateMoveHistory() {
        moveHistory.innerHTML = '';
        
        const history = chess.history({ verbose: true });
        
        for (let i = 0; i < history.length; i += 2) {
            const moveRow = document.createElement('div');
            moveRow.classList.add('move-row');
            
            const moveNumber = document.createElement('div');
            moveNumber.classList.add('move-number');
            moveNumber.textContent = Math.floor(i / 2) + 1 + '.';
            
            const whiteMove = document.createElement('div');
            whiteMove.classList.add('move-white');
            whiteMove.textContent = history[i].san;
            
            const blackMove = document.createElement('div');
            blackMove.classList.add('move-black');
            if (history[i + 1]) {
                blackMove.textContent = history[i + 1].san;
            }
            
            moveRow.appendChild(moveNumber);
            moveRow.appendChild(whiteMove);
            moveRow.appendChild(blackMove);
            
            moveHistory.appendChild(moveRow);
        }
        
        // Scroll to bottom
        moveHistory.scrollTop = moveHistory.scrollHeight;
    }
    
    // Event listeners for buttons
    // Event listener for new game button
    document.getElementById('newGame').addEventListener('click', () => {
        chess.reset();
        selectedSquare = null;
        lastMove = null;
        updateBoard();
    });
    
    // Event listener for undo move button
    document.getElementById('undoMove').addEventListener('click', () => {
        if (gameMode === 'computer') {
            // Undo both computer's move and player's move
            chess.undo();
            chess.undo();
        } else {
            chess.undo();
        }
        
        selectedSquare = null;
        const history = chess.history({ verbose: true });
        lastMove = history.length > 0 ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null;
        updateBoard();
    });
    
    // Event listener for flip board button
    document.getElementById('flipBoard').addEventListener('click', () => {
        boardFlipped = !boardFlipped;
        createBoard();
    });
    
    // Event listeners for radio buttons
    document.getElementById('playComputer').addEventListener('click', () => {
        chess.reset();
        selectedSquare = null;
        lastMove = null;
        gameMode = 'computer';
        document.getElementById('playLocal').classList.add('secondary');
        document.getElementById('playComputer').classList.remove();
        updateBoard();
    });
    
    document.getElementById('playLocal').addEventListener('click', () => {
        chess.reset();
        selectedSquare = null;
        lastMove = null;
        gameMode = 'local';
        document.getElementById('playComputer').classList.add('secondary');
        document.getElementById('playLocal').classList.remove();
        updateBoard();
    });
    
    // Initialize the board
    createBoard();
});