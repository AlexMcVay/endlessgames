"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Phase 10 Game Logic
var Phase10Game =
/*#__PURE__*/
function () {
  function Phase10Game() {
    _classCallCheck(this, Phase10Game);

    this.players = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.deck = [];
    this.discardPile = [];
    this.gamePhases = [{
      id: 1,
      description: "2 sets of 3",
      sets: [3, 3],
      runs: []
    }, {
      id: 2,
      description: "1 set of 3 + 1 run of 4",
      sets: [3],
      runs: [4]
    }, {
      id: 3,
      description: "1 set of 4 + 1 run of 4",
      sets: [4],
      runs: [4]
    }, {
      id: 4,
      description: "1 run of 7",
      sets: [],
      runs: [7]
    }, {
      id: 5,
      description: "1 run of 8",
      sets: [],
      runs: [8]
    }, {
      id: 6,
      description: "1 run of 9",
      sets: [],
      runs: [9]
    }, {
      id: 7,
      description: "2 sets of 4",
      sets: [4, 4],
      runs: []
    }, {
      id: 8,
      description: "7 cards of one color",
      sets: [],
      runs: [],
      special: "color"
    }, {
      id: 9,
      description: "1 set of 5 + 1 set of 2",
      sets: [5, 2],
      runs: []
    }, {
      id: 10,
      description: "1 set of 5 + 1 set of 3",
      sets: [5, 3],
      runs: []
    }];
    this.selectedCards = [];
    this.phaseBuilder = {
      group1: [],
      group2: []
    };
    this.completedPhases = [];
    this.gameOver = false;
    this.isHumanPlayer = true; // Track if current player is human

    this.isSinglePlayer = false; // Track if this is single player mode

    this.initializeEventListeners();
  }

  _createClass(Phase10Game, [{
    key: "initializeEventListeners",
    value: function initializeEventListeners() {
      var _this = this;

      // Setup screen events
      document.getElementById('playerCount').addEventListener('change', function (e) {
        _this.updatePlayerInputs(parseInt(e.target.value));
      });
      document.getElementById('startGameBtn').addEventListener('click', function () {
        _this.startGame();
      }); // Help modal events

      var helpBtn = document.getElementById('helpBtn');
      var helpModal = document.getElementById('helpModal');
      var closeBtn = document.querySelector('.close');
      helpBtn.addEventListener('click', function () {
        helpModal.style.display = 'block';
      });
      closeBtn.addEventListener('click', function () {
        helpModal.style.display = 'none';
      });
      window.addEventListener('click', function (e) {
        if (e.target === helpModal) {
          helpModal.style.display = 'none';
        }
      }); // Game action events

      document.getElementById('drawPile').addEventListener('click', function () {
        _this.drawCard('deck');
      });
      document.getElementById('completePhaseBtn').addEventListener('click', function () {
        _this.completePhase();
      });
      document.getElementById('skipTurnBtn').addEventListener('click', function () {
        _this.skipTurn();
      }); // Game over events

      document.getElementById('playAgainBtn').addEventListener('click', function () {
        _this.resetGame();
      });
      document.getElementById('backToMenuBtn').addEventListener('click', function () {
        window.location.href = '../index.html';
      });
    }
  }, {
    key: "updatePlayerInputs",
    value: function updatePlayerInputs(playerCount) {
      var player3Input = document.getElementById('player3Input');
      var player4Input = document.getElementById('player4Input');
      player3Input.style.display = playerCount >= 3 ? 'block' : 'none';
      player4Input.style.display = playerCount >= 4 ? 'block' : 'none';
    }
  }, {
    key: "startGame",
    value: function startGame() {
      var playerCount = parseInt(document.getElementById('playerCount').value);
      this.players = [];

      for (var i = 1; i <= playerCount; i++) {
        var nameInput = document.getElementById("player".concat(i, "Name"));
        this.players.push({
          id: i,
          name: nameInput.value || "Player ".concat(i),
          hand: [],
          currentPhase: 1,
          completedPhases: [],
          score: 0,
          hasCompletedPhase: false
        });
      }

      this.initializeDeck();
      this.dealCards();
      this.showScreen('gameScreen');
      this.updateGameDisplay();
    }
  }, {
    key: "initializeDeck",
    value: function initializeDeck() {
      this.deck = [];
      var colors = ['red', 'blue', 'green', 'yellow']; // Add numbered cards (1-12) for each color, 2 of each

      for (var _i = 0, _colors = colors; _i < _colors.length; _i++) {
        var color = _colors[_i];

        for (var number = 1; number <= 12; number++) {
          for (var copy = 0; copy < 2; copy++) {
            this.deck.push({
              type: 'number',
              number: number,
              color: color,
              id: "".concat(color, "-").concat(number, "-").concat(copy)
            });
          }
        }
      } // Add Wild cards (8 total)


      for (var i = 0; i < 8; i++) {
        this.deck.push({
          type: 'wild',
          number: 0,
          color: 'wild',
          id: "wild-".concat(i)
        });
      } // Add Skip cards (4 total)


      for (var _i2 = 0; _i2 < 4; _i2++) {
        this.deck.push({
          type: 'skip',
          number: 0,
          color: 'skip',
          id: "skip-".concat(_i2)
        });
      }

      this.shuffleDeck();
    }
  }, {
    key: "shuffleDeck",
    value: function shuffleDeck() {
      for (var i = this.deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var _ref = [this.deck[j], this.deck[i]];
        this.deck[i] = _ref[0];
        this.deck[j] = _ref[1];
      }
    }
  }, {
    key: "dealCards",
    value: function dealCards() {
      // Deal 10 cards to each player
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var player = _step.value;
          player.hand = [];

          for (var i = 0; i < 10; i++) {
            player.hand.push(this.deck.pop());
          }
        } // Start discard pile with one card

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

      this.discardPile = [this.deck.pop()];
    }
  }, {
    key: "drawCard",
    value: function drawCard(source) {
      var currentPlayer = this.players[this.currentPlayerIndex];

      if (source === 'deck') {
        if (this.deck.length === 0) {
          this.reshuffleDeck();
        }

        currentPlayer.hand.push(this.deck.pop());
      } else if (source === 'discard' && this.discardPile.length > 0) {
        currentPlayer.hand.push(this.discardPile.pop());
      }

      this.updateGameDisplay();
      this.enableDiscardPhase();
    }
  }, {
    key: "reshuffleDeck",
    value: function reshuffleDeck() {
      if (this.discardPile.length <= 1) return;
      var topCard = this.discardPile.pop();
      this.deck = _toConsumableArray(this.discardPile);
      this.discardPile = [topCard];
      this.shuffleDeck();
    }
  }, {
    key: "enableDiscardPhase",
    value: function enableDiscardPhase() {
      // Enable card selection for discarding
      document.getElementById('skipTurnBtn').disabled = false;
    }
  }, {
    key: "discardCard",
    value: function discardCard(cardIndex) {
      var currentPlayer = this.players[this.currentPlayerIndex];
      var discardedCard = currentPlayer.hand.splice(cardIndex, 1)[0];
      this.discardPile.push(discardedCard); // Check if player has no cards left (went out)

      if (currentPlayer.hand.length === 0 && currentPlayer.hasCompletedPhase) {
        this.endRound();
      } else {
        this.nextPlayer();
      }

      this.updateGameDisplay();
    }
  }, {
    key: "selectCard",
    value: function selectCard(cardIndex) {
      var cardElement = document.querySelector("[data-card-index=\"".concat(cardIndex, "\"]"));

      if (this.selectedCards.includes(cardIndex)) {
        this.selectedCards = this.selectedCards.filter(function (i) {
          return i !== cardIndex;
        });
        cardElement.classList.remove('selected');
      } else {
        this.selectedCards.push(cardIndex);
        cardElement.classList.add('selected');
      }

      this.updatePhaseBuilderButtons();
    }
  }, {
    key: "updatePhaseBuilderButtons",
    value: function updatePhaseBuilderButtons() {
      var completeBtn = document.getElementById('completePhaseBtn');
      var currentPlayer = this.players[this.currentPlayerIndex];
      var currentPhase = this.gamePhases[currentPlayer.currentPhase - 1]; // Enable complete phase button if player has built valid phase

      var canComplete = this.canCompletePhase(currentPhase);
      completeBtn.disabled = !canComplete;
    }
  }, {
    key: "canCompletePhase",
    value: function canCompletePhase(phase) {
      var currentPlayer = this.players[this.currentPlayerIndex];
      if (currentPlayer.hasCompletedPhase) return false;
      var group1 = this.phaseBuilder.group1;
      var group2 = this.phaseBuilder.group2;

      if (phase.special === 'color') {
        // Phase 8: 7 cards of one color
        var allCards = [].concat(_toConsumableArray(group1), _toConsumableArray(group2));
        if (allCards.length < 7) return false;
        var colors = allCards.map(function (card) {
          return card.color;
        }).filter(function (color) {
          return color !== 'wild';
        });

        var uniqueColors = _toConsumableArray(new Set(colors));

        return uniqueColors.length === 1 && allCards.length >= 7;
      } // Check sets and runs


      var setsValid = true;
      var runsValid = true;

      if (phase.sets.length > 0) {
        setsValid = this.validateSets(group1, phase.sets[0]) && (phase.sets.length === 1 || this.validateSets(group2, phase.sets[1]));
      }

      if (phase.runs.length > 0) {
        var targetGroup = phase.sets.length > 0 ? group2 : group1;
        runsValid = this.validateRun(targetGroup, phase.runs[0]);
      }

      return setsValid && runsValid;
    }
  }, {
    key: "validateSets",
    value: function validateSets(cards, setSize) {
      if (cards.length < setSize) return false;
      var numbers = cards.map(function (card) {
        return card.type === 'wild' ? 'wild' : card.number;
      });
      var uniqueNumbers = numbers.filter(function (num) {
        return num !== 'wild';
      }); // All non-wild cards must be the same number

      var mainNumber = uniqueNumbers[0];
      return uniqueNumbers.every(function (num) {
        return num === mainNumber;
      }) && cards.length >= setSize;
    }
  }, {
    key: "validateRun",
    value: function validateRun(cards, runSize) {
      if (cards.length < runSize) return false; // Sort non-wild cards

      var nonWildCards = cards.filter(function (card) {
        return card.type !== 'wild';
      });
      var wildCount = cards.length - nonWildCards.length;
      if (nonWildCards.length === 0) return wildCount >= runSize;
      var numbers = nonWildCards.map(function (card) {
        return card.number;
      }).sort(function (a, b) {
        return a - b;
      }); // Remove duplicates

      var uniqueNumbers = _toConsumableArray(new Set(numbers)); // Check if we can form a consecutive sequence with wilds filling gaps


      for (var start = 0; start <= uniqueNumbers.length - 1; start++) {
        var startNum = uniqueNumbers[start];
        var consecutiveCount = 1;
        var wildsUsed = 0;

        for (var i = startNum + 1; i < startNum + runSize; i++) {
          if (uniqueNumbers.includes(i)) {
            consecutiveCount++;
          } else if (wildsUsed < wildCount) {
            wildsUsed++;
            consecutiveCount++;
          } else {
            break;
          }
        }

        if (consecutiveCount >= runSize) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: "completePhase",
    value: function completePhase() {
      var currentPlayer = this.players[this.currentPlayerIndex];
      currentPlayer.hasCompletedPhase = true;
      currentPlayer.completedPhases.push(currentPlayer.currentPhase); // Move cards from phase builder to completed phases

      this.completedPhases.push({
        player: currentPlayer.name,
        phase: currentPlayer.currentPhase,
        cards: [].concat(_toConsumableArray(this.phaseBuilder.group1), _toConsumableArray(this.phaseBuilder.group2))
      }); // Remove cards from player's hand

      var allPhaseCards = [].concat(_toConsumableArray(this.phaseBuilder.group1), _toConsumableArray(this.phaseBuilder.group2));
      allPhaseCards.forEach(function (phaseCard) {
        var handIndex = currentPlayer.hand.findIndex(function (handCard) {
          return handCard.id === phaseCard.id;
        });

        if (handIndex !== -1) {
          currentPlayer.hand.splice(handIndex, 1);
        }
      }); // Clear phase builder

      this.phaseBuilder = {
        group1: [],
        group2: []
      };
      this.selectedCards = [];
      this.updateGameDisplay();
    }
  }, {
    key: "skipTurn",
    value: function skipTurn() {
      // Force player to discard a card to end turn
      if (this.selectedCards.length === 1) {
        this.discardCard(this.selectedCards[0]);
        this.selectedCards = [];
      }
    }
  }, {
    key: "nextPlayer",
    value: function nextPlayer() {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      document.getElementById('skipTurnBtn').disabled = true;
      this.updateGameDisplay();
    }
  }, {
    key: "endRound",
    value: function endRound() {
      // Calculate scores for the round
      this.players.forEach(function (player) {
        var roundScore = 0;
        player.hand.forEach(function (card) {
          if (card.type === 'number') {
            roundScore += card.number <= 9 ? 5 : 10;
          } else if (card.type === 'wild') {
            roundScore += 25;
          } else if (card.type === 'skip') {
            roundScore += 15;
          }
        });
        player.score += roundScore; // Advance phase for players who completed their phase

        if (player.hasCompletedPhase) {
          player.currentPhase++;
          player.hasCompletedPhase = false;
        }
      }); // Check if any player completed all 10 phases

      var winner = this.players.find(function (player) {
        return player.currentPhase > 10;
      });

      if (winner) {
        this.endGame(winner);
        return;
      } // Start next round


      this.round++;
      this.currentPlayerIndex = 0;
      this.initializeDeck();
      this.dealCards();
      this.completedPhases = [];
      this.updateGameDisplay();
    }
  }, {
    key: "endGame",
    value: function endGame(winner) {
      this.gameOver = true;
      this.showGameOverScreen(winner);
    }
  }, {
    key: "showGameOverScreen",
    value: function showGameOverScreen(winner) {
      var finalScores = document.getElementById('finalScores');
      finalScores.innerHTML = ''; // Sort players by phase completed (descending) then by score (ascending)

      var sortedPlayers = _toConsumableArray(this.players).sort(function (a, b) {
        if (a.currentPhase !== b.currentPhase) {
          return b.currentPhase - a.currentPhase;
        }

        return a.score - b.score;
      });

      sortedPlayers.forEach(function (player, index) {
        var scoreEntry = document.createElement('div');
        scoreEntry.className = "score-entry ".concat(index === 0 ? 'winner' : '');
        scoreEntry.innerHTML = "\n                <span><strong>".concat(player.name, "</strong></span>\n                <span>Phase ").concat(player.currentPhase - 1, "/10 - ").concat(player.score, " points</span>\n            ");
        finalScores.appendChild(scoreEntry);
      });
      this.showScreen('gameOverScreen');
    }
  }, {
    key: "updateGameDisplay",
    value: function updateGameDisplay() {
      this.updatePlayerStatus();
      this.updateGameInfo();
      this.updatePlayerHand();
      this.updateDiscardPile();
      this.updateCompletedPhases();
      this.updatePhaseBuilder();
      this.setupDropZones();
    }
  }, {
    key: "updateGameInfo",
    value: function updateGameInfo() {
      document.getElementById('currentRound').textContent = "Round ".concat(this.round);
      var currentPlayer = this.players[this.currentPlayerIndex];
      var currentPhase = this.gamePhases[currentPlayer.currentPhase - 1];
      document.getElementById('currentPhaseText').textContent = "Phase ".concat(currentPlayer.currentPhase, ": ").concat(currentPhase.description);
      document.getElementById('currentPlayerText').textContent = "".concat(currentPlayer.name, "'s Turn");
    }
  }, {
    key: "updatePlayerStatus",
    value: function updatePlayerStatus() {
      var _this2 = this;

      var container = document.getElementById('playersContainer');
      container.innerHTML = '';
      this.players.forEach(function (player, index) {
        var playerDiv = document.createElement('div');
        playerDiv.className = "player-status ".concat(index === _this2.currentPlayerIndex ? 'active' : '');
        playerDiv.innerHTML = "\n                <h4>".concat(player.name, "</h4>\n                <div class=\"player-phase\">Phase ").concat(player.currentPhase, "/10</div>\n                <div class=\"player-cards\">").concat(player.hand.length, " cards</div>\n                <div class=\"player-score\">Score: ").concat(player.score, "</div>\n            ");
        container.appendChild(playerDiv);
      });
    }
  }, {
    key: "updatePlayerHand",
    value: function updatePlayerHand() {
      var _this3 = this;

      var handContainer = document.getElementById('playerHand');
      handContainer.innerHTML = '';
      var currentPlayer = this.players[this.currentPlayerIndex];
      currentPlayer.hand.forEach(function (card, index) {
        var cardElement = _this3.createCardElement(card, index);

        cardElement.addEventListener('click', function () {
          return _this3.selectCard(index);
        });
        handContainer.appendChild(cardElement);
      });
    }
  }, {
    key: "updateDiscardPile",
    value: function updateDiscardPile() {
      var _this4 = this;

      var discardContainer = document.getElementById('discardPile');
      discardContainer.innerHTML = '';

      if (this.discardPile.length > 0) {
        var topCard = this.discardPile[this.discardPile.length - 1];
        var cardElement = this.createCardElement(topCard);
        cardElement.addEventListener('click', function () {
          return _this4.drawCard('discard');
        });
        discardContainer.appendChild(cardElement);
      } else {
        discardContainer.innerHTML = '<div class="empty-pile">Empty</div>';
      }
    }
  }, {
    key: "updateCompletedPhases",
    value: function updateCompletedPhases() {
      var _this5 = this;

      var container = document.getElementById('completedPhases');
      container.innerHTML = '';

      if (this.completedPhases.length === 0) {
        container.innerHTML = '<div class="no-phases">No phases completed yet</div>';
        return;
      }

      this.completedPhases.forEach(function (phase) {
        var phaseDiv = document.createElement('div');
        phaseDiv.className = 'completed-phase';
        phaseDiv.innerHTML = "\n                <h4>".concat(phase.player, " - Phase ").concat(phase.phase, "</h4>\n                <div class=\"phase-cards\">\n                    ").concat(phase.cards.map(function (card) {
          return "<span class=\"mini-card ".concat(card.color, "\">").concat(_this5.getCardDisplay(card), "</span>");
        }).join(''), "\n                </div>\n            ");
        container.appendChild(phaseDiv);
      });
    }
  }, {
    key: "createCardElement",
    value: function createCardElement(card) {
      var _this6 = this;

      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var cardDiv = document.createElement('div');
      cardDiv.className = "card ".concat(card.color);

      if (index !== null) {
        cardDiv.setAttribute('data-card-index', index);
        cardDiv.draggable = true;
        cardDiv.addEventListener('dragstart', function (e) {
          return _this6.handleDragStart(e, index);
        });
      }

      var display = this.getCardDisplay(card);
      cardDiv.innerHTML = "<div class=\"card-number\">".concat(display, "</div>");
      return cardDiv;
    }
  }, {
    key: "getCardDisplay",
    value: function getCardDisplay(card) {
      if (card.type === 'wild') {
        return 'W';
      } else if (card.type === 'skip') {
        return 'S';
      } else {
        return card.number.toString();
      }
    }
  }, {
    key: "showScreen",
    value: function showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(function (screen) {
        screen.classList.remove('active');
      });
      document.getElementById(screenId).classList.add('active');
    }
  }, {
    key: "resetGame",
    value: function resetGame() {
      this.players = [];
      this.currentPlayerIndex = 0;
      this.round = 1;
      this.deck = [];
      this.discardPile = [];
      this.selectedCards = [];
      this.phaseBuilder = {
        group1: [],
        group2: []
      };
      this.completedPhases = [];
      this.gameOver = false;
      this.showScreen('setupScreen');
    }
  }, {
    key: "handleDragStart",
    value: function handleDragStart(e, cardIndex) {
      e.dataTransfer.setData('text/plain', cardIndex);
      e.dataTransfer.effectAllowed = 'move';
    }
  }, {
    key: "setupDropZones",
    value: function setupDropZones() {
      var _this7 = this;

      var dropZones = document.querySelectorAll('.drop-zone');
      dropZones.forEach(function (zone) {
        zone.addEventListener('dragover', function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function (e) {
          if (!zone.contains(e.relatedTarget)) {
            zone.classList.remove('drag-over');
          }
        });
        zone.addEventListener('drop', function (e) {
          e.preventDefault();
          zone.classList.remove('drag-over');
          var cardIndex = parseInt(e.dataTransfer.getData('text/plain'));
          var groupNumber = zone.closest('.phase-group').dataset.group;

          _this7.addCardToPhaseBuilder(cardIndex, groupNumber);
        });
      });
    }
  }, {
    key: "addCardToPhaseBuilder",
    value: function addCardToPhaseBuilder(cardIndex, groupNumber) {
      var currentPlayer = this.players[this.currentPlayerIndex];
      var card = currentPlayer.hand[cardIndex];
      if (!card) return;
      var groupKey = "group".concat(groupNumber); // Add card to phase builder

      this.phaseBuilder[groupKey].push(card); // Remove from player hand

      currentPlayer.hand.splice(cardIndex, 1);
      this.updateGameDisplay();
      this.updatePhaseBuilder();
      this.updatePhaseBuilderButtons();
    }
  }, {
    key: "updatePhaseBuilder",
    value: function updatePhaseBuilder() {
      var _this8 = this;

      var group1Zone = document.querySelector('[data-group="1"] .drop-zone');
      var group2Zone = document.querySelector('[data-group="2"] .drop-zone'); // Clear existing cards

      group1Zone.innerHTML = '';
      group2Zone.innerHTML = ''; // Add cards to group 1

      this.phaseBuilder.group1.forEach(function (card, index) {
        var cardElement = _this8.createCardElement(card);

        cardElement.addEventListener('click', function () {
          return _this8.removeCardFromPhaseBuilder(index, 'group1');
        });
        group1Zone.appendChild(cardElement);
      }); // Add cards to group 2

      this.phaseBuilder.group2.forEach(function (card, index) {
        var cardElement = _this8.createCardElement(card);

        cardElement.addEventListener('click', function () {
          return _this8.removeCardFromPhaseBuilder(index, 'group2');
        });
        group2Zone.appendChild(cardElement);
      }); // Update phase hint

      this.updatePhaseHint();
    }
  }, {
    key: "updatePhaseHint",
    value: function updatePhaseHint() {
      var currentPlayer = this.players[this.currentPlayerIndex];
      var currentPhase = this.gamePhases[currentPlayer.currentPhase - 1];
      var hintElement = document.getElementById('phaseHint');

      if (currentPlayer.hasCompletedPhase) {
        hintElement.textContent = 'Phase completed! Discard cards to go out or add to other phases.';
        return;
      }

      var hint = "Phase ".concat(currentPlayer.currentPhase, ": ").concat(currentPhase.description);

      if (currentPhase.special === 'color') {
        hint += ' (All cards must be the same color)';
      } else {
        if (currentPhase.sets.length > 0) {
          hint += " | Sets: ".concat(currentPhase.sets.join(', '), " cards each");
        }

        if (currentPhase.runs.length > 0) {
          hint += " | Runs: ".concat(currentPhase.runs.join(', '), " consecutive cards");
        }
      }

      hintElement.textContent = hint;
    }
  }]);

  return Phase10Game;
}(); // Initialize the game when the page loads


document.addEventListener('DOMContentLoaded', function () {
  var game = new Phase10Game();
});