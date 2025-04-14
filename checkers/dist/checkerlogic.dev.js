"use strict";

document.addEventListener('DOMContentLoaded', function () {
  // DOM elements
  var board = document.getElementById('checkerboard');
  var newGameBtn = document.getElementById('newGame');
  var playTwoPlayerBtn = document.getElementById('playTwoPlayer');
  var playComputerBtn = document.getElementById('playComputer');
  var showRulesBtn = document.getElementById('showRules');
  var rulesModal = document.getElementById('rulesModal');
  var closeBtn = document.querySelector('.close-btn');
  var redTurn = document.getElementById('redTurn');
  var blackTurn = document.getElementById('blackTurn');
  var redPlayer = document.getElementById('redPlayer');
  var blackPlayer = document.getElementById('blackPlayer'); // Game state

  var gameState = {
    board: [],
    currentPlayer: 'red',
    // 'red' or 'black'
    selectedPiece: null,
    validMoves: [],
    jumpMoves: [],
    gameMode: 'two-player',
    // 'two-player' or 'computer'
    gameOver: false,
    redPieces: 12,
    blackPieces: 12
  }; // Initialize the board

  function initializeBoard() {
    board.innerHTML = '';
    gameState.board = [];

    var _loop = function _loop(row) {
      gameState.board[row] = [];

      var _loop2 = function _loop2(col) {
        var square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
        square.dataset.row = row;
        square.dataset.col = col; // Add click event for square

        square.addEventListener('click', function () {
          return handleSquareClick(row, col);
        }); // Place pieces

        if ((row + col) % 2 === 1) {
          if (row < 3) {
            // Black pieces
            addPiece(square, 'black');
            gameState.board[row][col] = {
              type: 'black',
              isKing: false
            };
          } else if (row > 4) {
            // Red pieces
            addPiece(square, 'red');
            gameState.board[row][col] = {
              type: 'red',
              isKing: false
            };
          } else {
            // Empty square
            gameState.board[row][col] = null;
          }
        } else {
          // Light squares can't have pieces
          gameState.board[row][col] = null;
        }

        board.appendChild(square);
      };

      for (var col = 0; col < 8; col++) {
        _loop2(col);
      }
    };

    for (var row = 0; row < 8; row++) {
      _loop(row);
    }

    updateTurnIndicator();
  } // Add a piece to a square


  function addPiece(square, type) {
    var isKing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var piece = document.createElement('div');
    piece.classList.add('piece', type);

    if (isKing) {
      piece.classList.add("".concat(type, "-king"));
    }

    square.appendChild(piece);
  } // Handle square click


  function handleSquareClick(row, col) {
    if (gameState.gameOver) return; // If it's computer's turn and game mode is vs computer, do nothing

    if (gameState.currentPlayer === 'black' && gameState.gameMode === 'computer') return;
    var square = gameState.board[row][col]; // If a piece is already selected

    if (gameState.selectedPiece) {
      // Check if clicked on a valid move square
      var moveIndex = gameState.validMoves.findIndex(function (move) {
        return move.toRow === row && move.toCol === col;
      });

      if (moveIndex !== -1) {
        // Make the move
        makeMove(gameState.validMoves[moveIndex]);
        return;
      } // Clear selection if clicked elsewhere


      clearSelection(); // If clicked on own piece, select it

      if (square && square.type === gameState.currentPlayer) {
        selectPiece(row, col);
      }
    } else {
      // No piece selected yet, try to select one
      if (square && square.type === gameState.currentPlayer) {
        selectPiece(row, col);
      }
    }
  } // Select a piece


  function selectPiece(row, col) {
    clearSelection();
    var piece = gameState.board[row][col];
    if (!piece || piece.type !== gameState.currentPlayer) return;
    gameState.selectedPiece = {
      row: row,
      col: col
    }; // Highlight the selected piece

    var squareElement = getSquareElement(row, col);
    squareElement.classList.add('highlight'); // Find valid moves

    gameState.validMoves = findValidMoves(row, col); // Check if there are mandatory jumps

    gameState.jumpMoves = gameState.validMoves.filter(function (move) {
      return move.isJump;
    }); // If there are jump moves, only show those

    var movesToShow = gameState.jumpMoves.length > 0 ? gameState.jumpMoves : gameState.validMoves; // Highlight valid move squares

    movesToShow.forEach(function (move) {
      var moveSquare = getSquareElement(move.toRow, move.toCol);
      moveSquare.classList.add('valid-move');
    });
  } // Clear all selections and highlights


  function clearSelection() {
    gameState.selectedPiece = null; // Remove all highlights

    document.querySelectorAll('.highlight, .valid-move').forEach(function (el) {
      el.classList.remove('highlight', 'valid-move');
    });
    gameState.validMoves = [];
    gameState.jumpMoves = [];
  } // Find valid moves for a piece


  function findValidMoves(row, col) {
    var piece = gameState.board[row][col];
    if (!piece) return [];
    var moves = [];
    var isKing = piece.isKing;
    var directions = isKing ? [-1, 1] : piece.type === 'red' ? [-1] : [1]; // Check for simple moves and jumps in each direction

    directions.forEach(function (rowDir) {
      [-1, 1].forEach(function (colDir) {
        // Simple move
        var moveRow = row + rowDir;
        var moveCol = col + colDir;

        if (isValidSquare(moveRow, moveCol) && !gameState.board[moveRow][moveCol]) {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: moveRow,
            toCol: moveCol,
            isJump: false
          });
        } // Jump move


        var jumpRow = row + rowDir * 2;
        var jumpCol = col + colDir * 2;

        if (isValidSquare(jumpRow, jumpCol) && !gameState.board[jumpRow][jumpCol]) {
          var captureRow = row + rowDir;
          var captureCol = col + colDir;
          var capturedPiece = gameState.board[captureRow][captureCol];

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
  } // Check if a board position is valid


  function isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  } // Get the DOM element for a board square


  function getSquareElement(row, col) {
    return document.querySelector(".square[data-row=\"".concat(row, "\"][data-col=\"").concat(col, "\"]"));
  } // Make a move


  function makeMove(move) {
    // Get piece information
    var piece = gameState.board[move.fromRow][move.fromCol]; // Remove piece from original position

    gameState.board[move.fromRow][move.fromCol] = null;
    var fromSquare = getSquareElement(move.fromRow, move.fromCol);
    fromSquare.innerHTML = ''; // If it's a jump, remove the captured piece

    if (move.isJump) {
      gameState.board[move.captureRow][move.captureCol] = null;
      var captureSquare = getSquareElement(move.captureRow, move.captureCol);
      captureSquare.innerHTML = ''; // Update piece count

      if (piece.type === 'red') {
        gameState.blackPieces--;
      } else {
        gameState.redPieces--;
      }
    } // Check for king promotion


    var isKingRow = piece.type === 'red' && move.toRow === 0 || piece.type === 'black' && move.toRow === 7;

    if (isKingRow) {
      piece.isKing = true;
    } // Place piece in new position


    gameState.board[move.toRow][move.toCol] = piece;
    var toSquare = getSquareElement(move.toRow, move.toCol);
    addPiece(toSquare, piece.type, piece.isKing); // Clear selections

    clearSelection(); // Check for additional jumps

    var additionalJumps = [];

    if (move.isJump) {
      additionalJumps = findValidMoves(move.toRow, move.toCol).filter(function (m) {
        return m.isJump;
      });
    } // If there are additional jumps possible, select the piece again


    if (move.isJump && additionalJumps.length > 0) {
      selectPiece(move.toRow, move.toCol);
    } else {
      // End turn
      switchTurn();
    } // Check for game over


    checkGameOver();
  } // Switch turns


  function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 'red' ? 'black' : 'red';
    updateTurnIndicator(); // If it's computer's turn and game mode is vs computer

    if (gameState.currentPlayer === 'black' && gameState.gameMode === 'computer' && !gameState.gameOver) {
      // Wait a bit before computer makes a move
      setTimeout(computerMove, 800);
    }
  } // Update turn indicator


  function updateTurnIndicator() {
    if (gameState.currentPlayer === 'red') {
      redTurn.style.display = 'inline';
      blackTurn.style.display = 'none';
    } else {
      redTurn.style.display = 'none';
      blackTurn.style.display = 'inline';
    } // Update player names based on game mode


    if (gameState.gameMode === 'computer') {
      blackPlayer.textContent = 'Computer (Black)';
    } else {
      blackPlayer.textContent = 'Player 2 (Black)';
    }
  } // Computer move logic


  function computerMove() {
    // Find all pieces that can move
    var computerPieces = [];

    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var piece = gameState.board[row][col];

        if (piece && piece.type === 'black') {
          var moves = findValidMoves(row, col);

          if (moves.length > 0) {
            computerPieces.push({
              row: row,
              col: col,
              moves: moves
            });
          }
        }
      }
    } // Check if there are any jump moves


    var piecesWithJumps = computerPieces.filter(function (p) {
      return p.moves.some(function (m) {
        return m.isJump;
      });
    });
    var selectedPiece, selectedMove; // If there are jump moves, prioritize them

    if (piecesWithJumps.length > 0) {
      // Choose a random piece that can jump
      selectedPiece = piecesWithJumps[Math.floor(Math.random() * piecesWithJumps.length)]; // Get only the jump moves

      var jumpMoves = selectedPiece.moves.filter(function (m) {
        return m.isJump;
      }); // Choose a random jump move

      selectedMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
    } else {
      // No jumps, choose a random piece and move
      selectedPiece = computerPieces[Math.floor(Math.random() * computerPieces.length)];
      selectedMove = selectedPiece.moves[Math.floor(Math.random() * selectedPiece.moves.length)];
    } // Simulate selecting the piece (for visual feedback)


    selectPiece(selectedPiece.row, selectedPiece.col); // Wait a bit and then make the move

    setTimeout(function () {
      makeMove(selectedMove);
    }, 500);
  } // Function to handle game over


  function handleGameOver(winner) {
    createGameEndOverlay(winner, function () {
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
  } // Check if the game is over


  function checkGameOver() {
    // Check if a player has no pieces left
    if (gameState.redPieces === 0) {
      handleGameOver('Black wins!');
      return;
    }

    if (gameState.blackPieces === 0) {
      handleGameOver('Red wins!');
      return;
    } // Check if current player can't move


    var canMove = checkCanMove(gameState.currentPlayer);

    if (!canMove) {
      var winner = gameState.currentPlayer === 'red' ? 'Black' : 'Red';
      handleGameOver("".concat(winner, " wins! ").concat(gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1), " has no valid moves."));
    }
  } // Check if a player can make any moves


  function checkCanMove(player) {
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var piece = gameState.board[row][col];

        if (piece && piece.type === player) {
          var moves = findValidMoves(row, col);

          if (moves.length > 0) {
            return true;
          }
        }
      }
    }

    return false;
  } // End the game


  function endGame(message) {
    gameState.gameOver = true;
    setTimeout(function () {
      alert(message);
    }, 200);
  } // Reset the game


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
  } // Event listener for the Forfeit button


  document.getElementById('forfeitButton').addEventListener('click', function () {
    var forfeitingPlayer = gameState.currentPlayer === 'red' ? 'Player 1 (Red)' : 'Player 2 (Black)';
    var winner = forfeitingPlayer === 'Player 1 (Red)' ? 'Player 2 (Black)' : 'Player 1 (Red)'; // Display the game end overlay with the winner

    handleGameOver("".concat(winner, " wins by forfeit!"));
  }); // Event listener for the Replay button

  document.getElementById('replayButton').addEventListener('click', function () {
    location.reload(); // Reload the current page
  }); // Event listener for the Home button

  document.getElementById('homeButton').addEventListener('click', function () {
    window.location.href = '../index.html'; // Redirect to index.html
  }); // Event listeners

  newGameBtn.addEventListener('click', resetGame);
  playTwoPlayerBtn.addEventListener('click', function () {
    gameState.gameMode = 'two-player';
    resetGame();
  });
  playComputerBtn.addEventListener('click', function () {
    gameState.gameMode = 'computer';
    resetGame();
  });
  showRulesBtn.addEventListener('click', function () {
    rulesModal.style.display = 'block';
  });
  closeBtn.addEventListener('click', function () {
    rulesModal.style.display = 'none';
  });
  window.addEventListener('click', function (e) {
    if (e.target === rulesModal) {
      rulesModal.style.display = 'none';
    }
  }); // Initialize the game

  initializeBoard();
});