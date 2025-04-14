"use strict";

document.addEventListener('DOMContentLoaded', function () {
  // Initialize chess.js
  var chess = new Chess(); // DOM elements

  var chessboard = document.getElementById('chessboard');
  var gameStatus = document.getElementById('gameStatus');
  var moveHistory = document.getElementById('moveHistory');
  var promotionModal = document.getElementById('promotionModal'); // Game state variables

  var selectedSquare = null;
  var lastMove = null;
  var boardFlipped = false;
  var gameMode = 'local'; // 'local' or 'computer'

  var pendingPromotion = null; // Chess piece Unicode characters

  var pieces = {
    'k': '♚',
    'q': '♛',
    'r': '♜',
    'b': '♝',
    'n': '♞',
    'p': '♟',
    'K': '♔',
    'Q': '♕',
    'R': '♖',
    'B': '♗',
    'N': '♘',
    'P': '♙'
  }; // Files and ranks for board notation

  var files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  var ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // Initialize the board

  function createBoard() {
    chessboard.innerHTML = '';

    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        // Adjust for board flipping
        var displayRow = boardFlipped ? 7 - row : row;
        var displayCol = boardFlipped ? 7 - col : col;
        var square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark'); // Add rank and file labels

        if (displayCol === 0) {
          var rankLabel = document.createElement('div');
          rankLabel.classList.add('rank-label');
          rankLabel.textContent = ranks[displayRow];
          square.appendChild(rankLabel);
        }

        if (displayRow === 7) {
          var fileLabel = document.createElement('div');
          fileLabel.classList.add('file-label');
          fileLabel.textContent = files[displayCol];
          square.appendChild(fileLabel);
        } // Set data attributes for position


        square.dataset.row = row;
        square.dataset.col = col;
        square.dataset.pos = files[displayCol] + ranks[displayRow]; // Add event listeners

        square.addEventListener('click', handleSquareClick);
        chessboard.appendChild(square);
      }
    }

    updateBoard();
  } // Update the board based on the current game state


  function updateBoard() {
    // Clear all pieces
    document.querySelectorAll('.square').forEach(function (square) {
      square.textContent = '';
      square.classList.remove('selected', 'last-move'); // Re-add rank and file labels

      var pos = square.dataset.pos;

      if (pos[0] === 'a') {
        var rankLabel = document.createElement('div');
        rankLabel.classList.add('rank-label');
        rankLabel.textContent = pos[1];
        square.appendChild(rankLabel);
      }

      if (pos[1] === '1') {
        var fileLabel = document.createElement('div');
        fileLabel.classList.add('file-label');
        fileLabel.textContent = pos[0];
        square.appendChild(fileLabel);
      }
    }); // Place pieces based on chess.js board state

    var board = chess.board();

    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var displayRow = boardFlipped ? 7 - row : row;
        var displayCol = boardFlipped ? 7 - col : col;
        var piece = board[row][col];

        if (piece) {
          var squarePos = files[displayCol] + ranks[displayRow];
          var square = document.querySelector(".square[data-pos=\"".concat(squarePos, "\"]"));

          if (square) {
            square.textContent = pieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
          }
        }
      }
    } // Highlight selected square


    if (selectedSquare) {
      var _square = document.querySelector(".square[data-pos=\"".concat(selectedSquare, "\"]"));

      if (_square) {
        _square.classList.add('selected');
      }
    } // Highlight last move


    if (lastMove) {
      var fromSquare = document.querySelector(".square[data-pos=\"".concat(lastMove.from, "\"]"));
      var toSquare = document.querySelector(".square[data-pos=\"".concat(lastMove.to, "\"]"));
      if (fromSquare) fromSquare.classList.add('last-move');
      if (toSquare) toSquare.classList.add('last-move');
    } // Update game status


    updateStatus(); // Update move history

    updateMoveHistory();
  } // Handle square click


  function handleSquareClick(event) {
    var square = event.currentTarget;
    var pos = square.dataset.pos; // If a promotion is pending, ignore clicks

    if (pendingPromotion) return; // If a square is already selected

    if (selectedSquare) {
      // Try to make a move
      var move = {
        from: selectedSquare,
        to: pos
      }; // Check if this is a pawn promotion move

      if (isPawnPromotion(move)) {
        pendingPromotion = move;
        showPromotionDialog();
        return;
      }

      var result = makeMove(move); // If move is legal, clear selection and update board

      if (result) {
        selectedSquare = null;
        updateBoard(); // If playing against computer, make computer move

        if (gameMode === 'computer' && !chess.game_over()) {
          setTimeout(makeComputerMove, 500);
        }
      } // If move is not legal but user clicked on their own piece, select that piece instead
      else {
          var piece = chess.get(pos);

          if (piece && piece.color === (chess.turn() === 'w' ? 'w' : 'b')) {
            selectedSquare = pos;
            updateBoard();
          }
        }
    } // If no square is selected, select this square if it has a piece of the current turn
    else {
        var _piece = chess.get(pos);

        if (_piece && _piece.color === (chess.turn() === 'w' ? 'w' : 'b')) {
          selectedSquare = pos;
          updateBoard();
        }
      }
  } // Check if a move would be a pawn promotion


  function isPawnPromotion(move) {
    var piece = chess.get(move.from);
    if (!piece || piece.type !== 'p') return false;
    var toRank = move.to.charAt(1);
    return piece.color === 'w' && toRank === '8' || piece.color === 'b' && toRank === '1';
  } // Show promotion dialog


  function showPromotionDialog() {
    promotionModal.style.display = 'flex';
    var promotionOptions = document.querySelectorAll('.promotion-option');
    promotionOptions.forEach(function (option) {
      option.addEventListener('click', handlePromotionChoice);
    });
  } // Handle promotion piece choice


  function handlePromotionChoice(event) {
    var piece = event.currentTarget.dataset.piece;

    if (pendingPromotion) {
      pendingPromotion.promotion = piece;
      makeMove(pendingPromotion);
      pendingPromotion = null;
      hidePromotionDialog();
      updateBoard(); // If playing against computer, make computer move

      if (gameMode === 'computer' && !chess.game_over()) {
        setTimeout(makeComputerMove, 500);
      }
    }
  } // Hide promotion dialog


  function hidePromotionDialog() {
    promotionModal.style.display = 'none';
    var promotionOptions = document.querySelectorAll('.promotion-option');
    promotionOptions.forEach(function (option) {
      option.removeEventListener('click', handlePromotionChoice);
    });
  } // Make a move


  function makeMove(move) {
    try {
      var result = chess.move(move);

      if (result) {
        lastMove = {
          from: result.from,
          to: result.to
        };
        return true;
      }

      return false;
    } catch (e) {
      console.error('Invalid move:', e);
      return false;
    }
  } // Make a computer move


  function makeComputerMove() {
    if (chess.game_over()) return; // Get all legal moves

    var moves = chess.moves({
      verbose: true
    }); // Basic AI: prioritize captures and checks

    var bestMoves = [];
    var bestScore = -Infinity;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = moves[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var move = _step.value;
        var score = 0; // Try the move

        chess.move(move); // Check if this move puts opponent in check

        if (chess.in_check()) {
          score += 5;
        } // Check if this move is a capture


        if (move.captured) {
          var pieceValues = {
            p: 1,
            n: 3,
            b: 3,
            r: 5,
            q: 9
          };
          score += pieceValues[move.captured] || 0;
        } // Undo the move


        chess.undo(); // Track best moves

        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      } // If no good moves found, pick random move

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

    if (bestMoves.length === 0) {
      bestMoves = moves;
    } // Choose a random move from best moves


    var randomMove = bestMoves[Math.floor(Math.random() * bestMoves.length)]; // Make the move

    if (randomMove) {
      chess.move(randomMove);
      lastMove = {
        from: randomMove.from,
        to: randomMove.to
      };
      updateBoard();
    }
  } // Update game status


  function updateStatus() {
    var status = '';

    if (chess.in_checkmate()) {
      var winner = chess.turn() === 'w' ? 'Black' : 'White';
      status = "Checkmate! ".concat(winner, " wins"); // Display the game end overlay with the winner

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
    } else if (chess.in_draw()) {
      status = 'Draw!';

      if (chess.in_stalemate()) {
        status += ' (Stalemate)';
      } else if (chess.in_threefold_repetition()) {
        status += ' (Threefold Repetition)';
      } else if (chess.insufficient_material()) {
        status += ' (Insufficient Material)';
      } // Display the game end overlay for a draw


      createGameEndOverlay('Draw', function () {
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
    } else {
      status = "".concat(chess.turn() === 'w' ? 'White' : 'Black', " to move");

      if (chess.in_check()) {
        status += ' (Check!)';
      }
    }

    gameStatus.textContent = status;
  } // Update move history


  function updateMoveHistory() {
    moveHistory.innerHTML = '';
    var history = chess.history({
      verbose: true
    });

    for (var i = 0; i < history.length; i += 2) {
      var moveRow = document.createElement('div');
      moveRow.classList.add('move-row');
      var moveNumber = document.createElement('div');
      moveNumber.classList.add('move-number');
      moveNumber.textContent = Math.floor(i / 2) + 1 + '.';
      var whiteMove = document.createElement('div');
      whiteMove.classList.add('move-white');
      whiteMove.textContent = history[i].san;
      var blackMove = document.createElement('div');
      blackMove.classList.add('move-black');

      if (history[i + 1]) {
        blackMove.textContent = history[i + 1].san;
      }

      moveRow.appendChild(moveNumber);
      moveRow.appendChild(whiteMove);
      moveRow.appendChild(blackMove);
      moveHistory.appendChild(moveRow);
    } // Scroll to bottom


    moveHistory.scrollTop = moveHistory.scrollHeight;
  } // Event listeners for buttons
  // Event listener for new game button


  document.getElementById('newGame').addEventListener('click', function () {
    chess.reset();
    selectedSquare = null;
    lastMove = null;
    updateBoard();
  }); // Event listener for undo move button

  document.getElementById('undoMove').addEventListener('click', function () {
    if (gameMode === 'computer') {
      // Undo both computer's move and player's move
      chess.undo();
      chess.undo();
    } else {
      chess.undo();
    }

    selectedSquare = null;
    var history = chess.history({
      verbose: true
    });
    lastMove = history.length > 0 ? {
      from: history[history.length - 1].from,
      to: history[history.length - 1].to
    } : null;
    updateBoard();
  }); // Event listener for flip board button

  document.getElementById('flipBoard').addEventListener('click', function () {
    boardFlipped = !boardFlipped;
    createBoard();
  }); // Event listeners for radio buttons

  document.getElementById('playComputer').addEventListener('click', function () {
    chess.reset();
    selectedSquare = null;
    lastMove = null;
    gameMode = 'computer';
    document.getElementById('playLocal').classList.add('secondary');
    document.getElementById('playComputer').classList.remove();
    updateBoard();
  });
  document.getElementById('playLocal').addEventListener('click', function () {
    chess.reset();
    selectedSquare = null;
    lastMove = null;
    gameMode = 'local';
    document.getElementById('playComputer').classList.add('secondary');
    document.getElementById('playLocal').classList.remove();
    updateBoard();
  }); // Event listener for the forfeit button

  document.getElementById('forfeitButton').addEventListener('click', function () {
    console.log('Forfeit button clicked');
    var forfeitingPlayer = chess.turn() === 'w' ? 'White' : 'Black';
    var winner = forfeitingPlayer === 'White' ? 'Black' : 'White'; // Display the game end overlay with the winner

    createGameEndOverlay("".concat(winner, " wins by forfeit!"), function () {
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
  }); // Initialize the board

  createBoard();
});