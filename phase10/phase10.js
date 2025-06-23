// Phase 10 Game Logic
// Enhanced with AI bots for single-player mode using ML-inspired decision making
// Fixed card selection issues to prevent unwanted card movements
// Uses CSS variables from main styles.css for consistent theming
//
// MAJOR FIXES IMPLEMENTED:
// 1. Cards only move when explicitly selected by the user (no accidental movements)
// 2. Drag-and-drop requires card to be selected first
// 3. Visual feedback shows selectable vs non-selectable cards
// 4. Single card selection enforced (no multi-select confusion)
// 5. Proper turn enforcement: draw -> play/select -> discard
// 6. AI players cannot interfere with human interactions
// 7. Enhanced error checking and logging for debugging
// 8. Clear visual indicators for game state and valid actions
class Phase10Game {constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.deck = [];
        this.discardPile = [];
        this.gamePhases = [
            { id: 1, description: "2 sets of 3", sets: [3, 3], runs: [] },
            { id: 2, description: "1 set of 3 + 1 run of 4", sets: [3], runs: [4] },
            { id: 3, description: "1 set of 4 + 1 run of 4", sets: [4], runs: [4] },
            { id: 4, description: "1 run of 7", sets: [], runs: [7] },
            { id: 5, description: "1 run of 8", sets: [], runs: [8] },
            { id: 6, description: "1 run of 9", sets: [], runs: [9] },
            { id: 7, description: "2 sets of 4", sets: [4, 4], runs: [] },
            { id: 8, description: "7 cards of one color", sets: [], runs: [], special: "color" },
            { id: 9, description: "1 set of 5 + 1 set of 2", sets: [5, 2], runs: [] },
            { id: 10, description: "1 set of 5 + 1 set of 3", sets: [5, 3], runs: [] }
        ];
        // Randomize the phase order for this game
        this.randomizedPhases = this.shufflePhases([...this.gamePhases]);        this.selectedCards = [];
        this.phaseBuilder = { group1: [], group2: [] };
        this.completedPhases = [];
        this.gameOver = false;
        this.isHumanPlayer = true; // Track if current player is human
        this.isSinglePlayer = false; // Track if this is single player mode
        this.isAiAction = false; // Flag to control AI actions
        this.hasDrawnThisTurn = false; // Track if player has drawn a card this turn
        this.turnPhase = 'draw'; // Track current phase of turn: 'draw', 'play', 'discard'
        this.debugMode = false; // Enable detailed logging for debugging card movements
        
        this.initializeEventListeners();
    }

    // NEW: Shuffle phases for random order each game
    shufflePhases(phases) {
        const shuffled = [...phases];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    initializeEventListeners() {
        // Setup screen events
        document.getElementById('playerCount').addEventListener('change', (e) => {
            this.updatePlayerInputs(parseInt(e.target.value));
        });
        
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Help modal events
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeBtn = document.querySelector('.close');        helpBtn.addEventListener('click', () => {
            helpModal.style.display = 'block';
            helpModal.setAttribute('aria-hidden', 'false');
            closeBtn.focus(); // Focus on close button for accessibility
        });

        closeBtn.addEventListener('click', () => {
            helpModal.style.display = 'none';
            helpModal.setAttribute('aria-hidden', 'true');
            helpBtn.focus(); // Return focus to help button
        });

        // Add keyboard support for close button
        closeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                helpModal.style.display = 'none';
                helpModal.setAttribute('aria-hidden', 'true');
                helpBtn.focus();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal.style.display === 'block') {
                helpModal.style.display = 'none';
                helpModal.setAttribute('aria-hidden', 'true');
                helpBtn.focus();
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
                helpModal.setAttribute('aria-hidden', 'true');
            }
        });// Game action events
        document.getElementById('drawPile').addEventListener('click', () => {
            const currentPlayer = this.players[this.currentPlayerIndex];
            if (!currentPlayer.isAI) {
                this.drawCard('deck');
            }
        });

        document.getElementById('completePhaseBtn').addEventListener('click', () => {
            const currentPlayer = this.players[this.currentPlayerIndex];
            if (!currentPlayer.isAI) {
                this.completePhase();
            }
        });        document.getElementById('skipTurnBtn').addEventListener('click', () => {
            const currentPlayer = this.players[this.currentPlayerIndex];
            if (!currentPlayer.isAI) {
                this.endTurn();
            }
        });

        // Game over events
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }

    updatePlayerInputs(playerCount) {
        const player2Input = document.getElementById('player2Input');
        const player3Input = document.getElementById('player3Input');
        const player4Input = document.getElementById('player4Input');

        player2Input.style.display = playerCount >= 2 ? 'block' : 'none';
        player3Input.style.display = playerCount >= 3 ? 'block' : 'none';
        player4Input.style.display = playerCount >= 4 ? 'block' : 'none';
    }    startGame() {
        const playerCount = parseInt(document.getElementById('playerCount').value);
        this.players = [];
        this.isSinglePlayer = playerCount === 1;

        for (let i = 1; i <= (this.isSinglePlayer ? 2 : playerCount); i++) {
            const nameInput = document.getElementById(`player${i}Name`);
            let playerName;
            
            if (this.isSinglePlayer) {
                playerName = i === 1 ? (nameInput?.value || 'You') : 'AI Bot';
            } else {
                playerName = nameInput?.value || `Player ${i}`;
            }
            
            this.players.push({
                id: i,
                name: playerName,
                hand: [],
                currentPhase: 1,
                completedPhases: [],
                score: 0,
                hasCompletedPhase: false,
                isAI: this.isSinglePlayer && i === 2
            });
        }        this.initializeDeck();
        this.dealCards();
        this.hasDrawnThisTurn = false;
        this.turnPhase = 'draw';
        this.showScreen('gameScreen');
        this.updateGameDisplay();
        
        // If first player is AI, start their turn
        const firstPlayer = this.players[this.currentPlayerIndex];
        if (firstPlayer.isAI) {
            setTimeout(() => {
                this.makeAIMove();
            }, 2000);
        }
    }

    initializeDeck() {
        this.deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Add numbered cards (1-12) for each color, 2 of each
        for (let color of colors) {
            for (let number = 1; number <= 12; number++) {
                for (let copy = 0; copy < 2; copy++) {
                    this.deck.push({
                        type: 'number',
                        number: number,
                        color: color,
                        id: `${color}-${number}-${copy}`
                    });
                }
            }
        }

        // Add Wild cards (8 total)
        for (let i = 0; i < 8; i++) {
            this.deck.push({
                type: 'wild',
                number: 0,
                color: 'wild',
                id: `wild-${i}`
            });
        }

        // Add Skip cards (4 total)
        for (let i = 0; i < 4; i++) {
            this.deck.push({
                type: 'skip',
                number: 0,
                color: 'skip',
                id: `skip-${i}`
            });
        }

        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Deal 10 cards to each player
        for (let player of this.players) {
            player.hand = [];
            for (let i = 0; i < 10; i++) {
                player.hand.push(this.deck.pop());
            }
        }

        // Start discard pile with one card
        this.discardPile = [this.deck.pop()];
    }    drawCard(source) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Prevent human interaction during AI turn
        if (currentPlayer.isAI && source && !this.isAiAction) return;
        
        // For human players, enforce turn order
        if (!currentPlayer.isAI && this.hasDrawnThisTurn) {
            alert('You have already drawn a card this turn. You must discard to end your turn.');
            return;
        }
        
        if (source === 'deck') {
            if (this.deck.length === 0) {
                this.reshuffleDeck();
            }
            if (this.deck.length > 0) {
                currentPlayer.hand.push(this.deck.pop());
            }
        } else if (source === 'discard' && this.discardPile.length > 0) {
            currentPlayer.hand.push(this.discardPile.pop());
        }

        // Mark that player has drawn this turn
        if (!currentPlayer.isAI) {
            this.hasDrawnThisTurn = true;
            this.turnPhase = 'play';
        }

        this.updateGameDisplay();
        
        // Only enable discard phase for human players
        if (!currentPlayer.isAI) {
            this.enableDiscardPhase();
        }
    }

    reshuffleDeck() {
        if (this.discardPile.length <= 1) return;
        
        const topCard = this.discardPile.pop();
        this.deck = [...this.discardPile];
        this.discardPile = [topCard];
        this.shuffleDeck();
    }

    enableDiscardPhase() {        // Enable card selection for discarding
        document.getElementById('skipTurnBtn').disabled = false;
    }    discardCard(cardIndex) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (cardIndex >= currentPlayer.hand.length || cardIndex < 0) {
            console.warn(`Invalid card index ${cardIndex} for discard`);
            return;
        }
        
        // For human players, enforce proper turn sequence and selection
        if (!currentPlayer.isAI) {
            if (!this.hasDrawnThisTurn) {
                alert('You must draw a card before discarding.');
                return;
            }
            
            // Ensure the card being discarded is actually selected
            if (!this.selectedCards.includes(cardIndex)) {
                alert('You can only discard a selected card.');
                console.warn(`Attempted to discard unselected card at index ${cardIndex}`);
                return;
            }
        }
          const discardedCard = currentPlayer.hand.splice(cardIndex, 1)[0];
        this.discardPile.push(discardedCard);

        console.log(`${currentPlayer.name} discarded:`, this.getCardDisplay(discardedCard));

        // Clear selections
        this.selectedCards = [];
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });        // Check if player has no cards left (went out)
        if (currentPlayer.hand.length === 0) {
            if (currentPlayer.hasCompletedPhase) {
                console.log(`${currentPlayer.name} went out! Ending round.`);
                this.endRound();
                return;
            } else {
                console.log(`${currentPlayer.name} has no cards but hasn't completed their phase. This shouldn't happen!`);
                // Edge case handling - if somehow player has no cards without completing phase
                this.endRound();
                return;
            }
        } else {// Check if a skip card was discarded
            if (discardedCard.type === 'skip') {
                console.log(`${currentPlayer.name} played a skip card! Next player loses their turn.`);
                
                // Get the name of the player who will be skipped
                const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                const skippedPlayer = this.players[nextPlayerIndex];
                
                // Show skip notification
                this.showSkipNotification(currentPlayer.name, skippedPlayer.name);
                
                // Skip the next player by advancing twice
                this.nextPlayer(); // Move to next player (who gets skipped)
                
                // In games with more than 2 players, advance to the player after the skipped one
                // In 2-player games, this will cycle back to the original player (giving them consecutive turns)
                this.nextPlayer(); // Move to the player after the skipped one
            } else {
                this.nextPlayer();
            }
        }

        this.updateGameDisplay();
    }selectCard(cardIndex) {
        // Prevent card selection during AI turn
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.isAI) return;
        
        // Prevent selection if player hasn't drawn a card this turn
        if (!this.hasDrawnThisTurn) {
            alert('You must draw a card before selecting cards to discard or use.');
            return;
        }
        
        const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
        if (!cardElement) return; // Card element doesn't exist
        
        // Check if this card is already selected
        const isAlreadySelected = this.selectedCards.includes(cardIndex);
        
        // Clear all previous selections to enforce single-selection rule
        this.selectedCards = [];
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // If card wasn't previously selected, select it now (toggle behavior)
        if (!isAlreadySelected) {
            this.selectedCards = [cardIndex];
            cardElement.classList.add('selected');
        }

        this.updatePhaseBuilderButtons();
    }    updatePhaseBuilderButtons() {
        const completeBtn = document.getElementById('completePhaseBtn');
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];

        // Enable complete phase button if player has built valid phase
        const canComplete = this.canCompletePhase(currentPhase);
        completeBtn.disabled = !canComplete;
    }    canCompletePhase(phase) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.hasCompletedPhase) return false;

        const group1 = this.phaseBuilder.group1;
        const group2 = this.phaseBuilder.group2;

        // For single-group phases, combine both groups for validation
        const needsOnlyOneGroup = (phase.sets.length <= 1 && phase.runs.length <= 1 && 
                                   !(phase.sets.length === 1 && phase.runs.length === 1)) ||
                                  phase.special === 'color';

        if (phase.special === 'color') {
            // Phase 8: 7 cards of one color - can use both groups
            const allCards = [...group1, ...group2];
            if (allCards.length < 7) return false;
            
            const colors = allCards.map(card => card.color).filter(color => color !== 'wild');
            const uniqueColors = [...new Set(colors)];
            return uniqueColors.length === 1 && allCards.length >= 7;
        }

        // For single runs (phases 4, 5, 6), combine both groups
        if (needsOnlyOneGroup && phase.runs.length === 1) {
            const allCards = [...group1, ...group2];
            return this.validateRun(allCards, phase.runs[0]);
        }

        // For phases with multiple groups
        let setsValid = true;
        let runsValid = true;

        if (phase.sets.length > 0) {
            setsValid = this.validateSets(group1, phase.sets[0]) && 
                       (phase.sets.length === 1 || this.validateSets(group2, phase.sets[1]));
        }

        if (phase.runs.length > 0) {
            const targetGroup = phase.sets.length > 0 ? group2 : group1;
            runsValid = this.validateRun(targetGroup, phase.runs[0]);
        }

        return setsValid && runsValid;
    }

    validateSets(cards, setSize) {
        if (cards.length < setSize) return false;
        
        const numbers = cards.map(card => card.type === 'wild' ? 'wild' : card.number);
        const uniqueNumbers = numbers.filter(num => num !== 'wild');
        
        // All non-wild cards must be the same number
        const mainNumber = uniqueNumbers[0];
        return uniqueNumbers.every(num => num === mainNumber) && cards.length >= setSize;
    }    validateRun(cards, runSize) {
        if (cards.length < runSize) return false;
        
        // Sort non-wild cards
        const nonWildCards = cards.filter(card => card.type !== 'wild');
        const wildCount = cards.length - nonWildCards.length;
        
        if (nonWildCards.length === 0) return wildCount >= runSize;
        
        const numbers = nonWildCards.map(card => card.number).sort((a, b) => a - b);
        
        // Remove duplicates
        const uniqueNumbers = [...new Set(numbers)];
        
        // Check if we can form a consecutive sequence with wilds filling gaps
        for (let start = 0; start <= uniqueNumbers.length - 1; start++) {
            const startNum = uniqueNumbers[start];
            let consecutiveCount = 1;
            let wildsUsed = 0;
            
            for (let i = startNum + 1; i < startNum + runSize; i++) {
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
    }    completePhase() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];
        
        // For single-group phases, consolidate all cards into group1
        const needsOnlyOneGroup = (currentPhase.sets.length <= 1 && currentPhase.runs.length <= 1 && 
                                   !(currentPhase.sets.length === 1 && currentPhase.runs.length === 1)) ||
                                  currentPhase.special === 'color';

        if (needsOnlyOneGroup && this.phaseBuilder.group2.length > 0) {
            // Move all group2 cards to group1
            this.phaseBuilder.group1.push(...this.phaseBuilder.group2);
            this.phaseBuilder.group2 = [];
        }

        currentPlayer.hasCompletedPhase = true;
        currentPlayer.completedPhases.push(currentPlayer.currentPhase);            // Move cards from phase builder to completed phases with proper group structure
        const completedPhaseData = {
            player: currentPlayer.name,
            phase: currentPlayer.currentPhase,
            group1: [...this.phaseBuilder.group1],
            group2: [...this.phaseBuilder.group2],
            // Keep legacy cards array for backwards compatibility
            cards: [...this.phaseBuilder.group1, ...this.phaseBuilder.group2],
            // Add metadata for better handling
            phaseRequirements: currentPhase,
            completedAt: Date.now()
        };
        
        this.completedPhases.push(completedPhaseData);

        // Remove cards from player's hand
        const allPhaseCards = [...this.phaseBuilder.group1, ...this.phaseBuilder.group2];
        allPhaseCards.forEach(phaseCard => {
            const handIndex = currentPlayer.hand.findIndex(handCard => handCard.id === phaseCard.id);
            if (handIndex !== -1) {
                currentPlayer.hand.splice(handIndex, 1);
            }
        });        // Clear phase builder
        this.phaseBuilder = { group1: [], group2: [] };
        this.selectedCards = [];        // Check if player has no cards left after completing phase
        if (currentPlayer.hand.length === 0) {
            console.log(`${currentPlayer.name} went out by completing their phase! Ending round.`);
            this.announceToScreenReader(`${currentPlayer.name} completed their phase and went out! Round ending.`);
            this.endRound();
            return;
        }

        // Announce phase completion
        this.announceToScreenReader(`Phase ${currentPlayer.currentPhase} completed! You have ${currentPlayer.hand.length} cards remaining.`);

        this.updateGameDisplay();
    }endTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // For human players, enforce proper turn sequence
        if (!currentPlayer.isAI && !this.hasDrawnThisTurn) {
            alert('You must draw a card before ending your turn.');
            return;
        }
        
        // For human players, require exactly one card to be selected for discard
        if (!currentPlayer.isAI && this.selectedCards.length !== 1) {
            alert('You must select exactly one card to discard to end your turn.');
            return;
        }
        
        // Force player to discard the selected card to end turn
        if (this.selectedCards.length === 1) {
            this.discardCard(this.selectedCards[0]);
            this.selectedCards = [];
        } else if (currentPlayer.isAI) {
            // AI handles their own discard logic
            return;
        }
    }nextPlayer() {
        // Reset turn tracking for next player
        this.hasDrawnThisTurn = false;
        this.turnPhase = 'draw';
        
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.selectedCards = [];
        document.getElementById('skipTurnBtn').disabled = true;
        
        // Clear any selected cards from previous player
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.updateGameDisplay();
        
        // If it's an AI player's turn, make AI move after a short delay
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.isAI && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 1500); // 1.5 second delay for better UX
        }
    }    // AI Logic using ML-inspired decision making
    makeAIMove() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isAI || this.gameOver) return;

        // AI follows proper turn sequence:
        // 1. Draw a card (mandatory)
        // 2. Try to complete phase if possible
        // 3. Try to add cards to completed phases (if AI has completed its own phase)
        // 4. Discard a card (mandatory to end turn)

        console.log(`${currentPlayer.name} is making a move...`);

        // Step 1: Draw a card (mandatory for AI just like human players)
        this.aiDrawCard();

        // Delay for subsequent actions
        setTimeout(() => {
            // Step 2: Try to complete phase
            if (!currentPlayer.hasCompletedPhase) {
                this.aiTryCompletePhase();
            }

            // Step 3: Try to add cards to completed phases (if AI has completed its own phase)
            if (currentPlayer.hasCompletedPhase && this.completedPhases.length > 0) {
                setTimeout(() => {
                    this.aiTryAddToCompletedPhases();
                }, 500);
            }

            // Step 4: Discard a card (mandatory to end turn)
            setTimeout(() => {
                this.aiDiscardCard();
            }, 1000);
        }, 800);
    }aiDrawCard() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // AI logic: Check if discard pile has useful card
        let shouldDrawFromDiscard = false;
        
        if (this.discardPile.length > 0) {
            const topCard = this.discardPile[this.discardPile.length - 1];
            shouldDrawFromDiscard = this.aiEvaluateCardUsefulness(topCard, currentPlayer);
        }

        // Set flag to allow AI to draw
        this.isAiAction = true;
        
        if (shouldDrawFromDiscard && Math.random() > 0.3) { // 70% chance if useful
            this.drawCard('discard');
            console.log(`${currentPlayer.name} drew from discard pile`);
        } else {
            this.drawCard('deck');
            console.log(`${currentPlayer.name} drew from deck`);
        }
        
        // Mark that AI has drawn this turn
        this.hasDrawnThisTurn = true;
        this.turnPhase = 'play';
        
        this.isAiAction = false;
        this.updateGameDisplay();
    }    aiEvaluateCardUsefulness(card, player) {
        const currentPhase = this.randomizedPhases[player.currentPhase - 1];
        
        // Check if card helps with current phase
        if (currentPhase.special === 'color') {
            // For color phase, any card of the same color is useful
            const handColors = player.hand.map(c => c.color).filter(c => c !== 'wild');
            const dominantColor = this.getMostFrequentColor(handColors);
            return card.color === dominantColor || card.type === 'wild';
        }

        // For sets: same numbers are useful
        if (currentPhase.sets.length > 0) {
            const handNumbers = player.hand.filter(c => c.type === 'number').map(c => c.number);
            const numberCounts = {};
            handNumbers.forEach(num => numberCounts[num] = (numberCounts[num] || 0) + 1);
            
            if (card.type === 'number' && numberCounts[card.number]) {
                return true;
            }
        }

        // For runs: consecutive numbers are useful
        if (currentPhase.runs.length > 0) {
            if (card.type === 'number') {
                const handNumbers = player.hand.filter(c => c.type === 'number').map(c => c.number).sort((a, b) => a - b);
                return this.isNumberUsefulForRun(card.number, handNumbers);
            }
        }

        // Wild cards are always somewhat useful
        return card.type === 'wild';
    }

    getMostFrequentColor(colors) {
        const colorCounts = {};
        colors.forEach(color => colorCounts[color] = (colorCounts[color] || 0) + 1);
        return Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b, 'red');
    }

    isNumberUsefulForRun(number, existingNumbers) {
        // Check if this number would help create or extend a run
        for (let i = 0; i < existingNumbers.length; i++) {
            const diff = Math.abs(existingNumbers[i] - number);
            if (diff === 1 || diff === 2) return true; // Adjacent or one gap
        }
        return false;
    }    aiTryCompletePhase() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];

        // AI tries to build the phase with available cards
        const bestPhaseArrangement = this.aiFindBestPhaseArrangement(currentPlayer.hand, currentPhase);
        
        if (bestPhaseArrangement && this.aiCanCompletePhase(bestPhaseArrangement, currentPhase)) {
            // Move cards to phase builder
            this.phaseBuilder.group1 = [...bestPhaseArrangement.group1];
            this.phaseBuilder.group2 = [...bestPhaseArrangement.group2];
            
            // Remove cards from hand
            bestPhaseArrangement.group1.forEach(card => {
                const index = currentPlayer.hand.findIndex(h => h.id === card.id);
                if (index !== -1) currentPlayer.hand.splice(index, 1);
            });
            bestPhaseArrangement.group2.forEach(card => {
                const index = currentPlayer.hand.findIndex(h => h.id === card.id);
                if (index !== -1) currentPlayer.hand.splice(index, 1);
            });            // Complete the phase
            this.completePhase();
            console.log(`${currentPlayer.name} completed Phase ${currentPlayer.currentPhase}!`);
        }
    }    aiTryAddToCompletedPhases() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Only attempt if AI has completed its own phase and has cards left
        if (!currentPlayer.hasCompletedPhase || currentPlayer.hand.length === 0) {
            console.log(`${currentPlayer.name} cannot add to completed phases: hasCompletedPhase=${currentPlayer.hasCompletedPhase}, cardsLeft=${currentPlayer.hand.length}`);
            return;
        }

        console.log(`${currentPlayer.name} trying to add cards to completed phases. Available phases: ${this.completedPhases.length}`);

        // Try to add cards to each completed phase
        for (let phaseIndex = 0; phaseIndex < this.completedPhases.length; phaseIndex++) {
            const completedPhase = this.completedPhases[phaseIndex];
            
            // Find a card that can be added to this phase
            for (let cardIndex = 0; cardIndex < currentPlayer.hand.length; cardIndex++) {
                const card = currentPlayer.hand[cardIndex];
                
                // Check if card can be added to any group of this phase
                const canAddToGroup1 = completedPhase.group1 && completedPhase.group1.length > 0 && 
                    this.canAddCardToCompletedPhase(card, completedPhase, 1);
                const canAddToGroup2 = completedPhase.group2 && completedPhase.group2.length > 0 && 
                    this.canAddCardToCompletedPhase(card, completedPhase, 2);
                
                if (canAddToGroup1 || canAddToGroup2) {
                    // Prefer to add to the group that makes more sense
                    const targetGroup = canAddToGroup1 ? 1 : 2;
                    
                    console.log(`${currentPlayer.name} is adding ${this.getCardDisplay(card)} to ${completedPhase.player}'s Phase ${completedPhase.phase} group ${targetGroup}`);
                    
                    // Add the card directly to the completed phase
                    const cardToAdd = currentPlayer.hand.splice(cardIndex, 1)[0];
                    
                    if (targetGroup === 1) {
                        completedPhase.group1.push(cardToAdd);
                    } else {
                        completedPhase.group2.push(cardToAdd);
                    }
                    
                    // Update the legacy cards array for backwards compatibility
                    completedPhase.cards = [...completedPhase.group1, ...completedPhase.group2];
                    
                    // Update display
                    this.updateGameDisplay();
                    
                    // Only add one card per turn to avoid being too aggressive
                    return;
                }
            }
        }
        
        console.log(`${currentPlayer.name} found no cards to add to completed phases`);
    }

    aiFindBestPhaseArrangement(hand, phase) {
        // This is a simplified ML-inspired algorithm
        // In a real ML implementation, this would use neural networks or decision trees
        
        if (phase.special === 'color') {
            return this.aiFindColorArrangement(hand);
        }
        
        if (phase.sets.length > 0 && phase.runs.length > 0) {
            return this.aiFindSetAndRunArrangement(hand, phase);
        }
        
        if (phase.sets.length > 0) {
            return this.aiFindSetsArrangement(hand, phase);
        }
        
        if (phase.runs.length > 0) {
            return this.aiFindRunsArrangement(hand, phase);
        }
        
        return null;
    }

    aiFindColorArrangement(hand) {
        const colorGroups = {};
        hand.forEach(card => {
            if (card.type === 'wild') {
                // Handle wilds separately
                return;
            }
            if (!colorGroups[card.color]) colorGroups[card.color] = [];
            colorGroups[card.color].push(card);
        });

        // Find the color with most cards
        let bestColor = null;
        let maxCount = 0;
        Object.keys(colorGroups).forEach(color => {
            if (colorGroups[color].length > maxCount) {
                maxCount = colorGroups[color].length;
                bestColor = color;
            }
        });

        if (bestColor && maxCount >= 4) { // Need at least 4 non-wild cards
            const wilds = hand.filter(card => card.type === 'wild');
            const totalCards = colorGroups[bestColor].length + Math.min(wilds.length, 7 - colorGroups[bestColor].length);
            
            if (totalCards >= 7) {
                const group1 = [...colorGroups[bestColor]];
                const neededWilds = Math.max(0, 7 - group1.length);
                group1.push(...wilds.slice(0, neededWilds));
                
                return { group1, group2: [] };
            }
        }

        return null;
    }

    aiFindSetsArrangement(hand, phase) {
        const numberGroups = {};
        const wilds = hand.filter(card => card.type === 'wild');
        
        hand.filter(card => card.type === 'number').forEach(card => {
            if (!numberGroups[card.number]) numberGroups[card.number] = [];
            numberGroups[card.number].push(card);
        });

        const sets = [];
        let wildsUsed = 0;

        // Try to form required sets
        for (let setSize of phase.sets) {
            let bestSet = null;
            let bestNumber = null;

            // Find the number with most cards that can form a set
            Object.keys(numberGroups).forEach(number => {
                const availableCards = numberGroups[number].length;
                const wildsNeeded = Math.max(0, setSize - availableCards);
                
                if (wildsNeeded <= (wilds.length - wildsUsed) && availableCards > 0) {
                    if (!bestSet || availableCards > numberGroups[bestNumber].length) {
                        bestSet = numberGroups[number].slice(0, Math.min(setSize, availableCards));
                        bestNumber = number;
                    }
                }
            });

            if (bestSet) {
                const wildsNeeded = setSize - bestSet.length;
                bestSet.push(...wilds.slice(wildsUsed, wildsUsed + wildsNeeded));
                wildsUsed += wildsNeeded;
                sets.push(bestSet);
                
                // Remove used cards
                numberGroups[bestNumber] = numberGroups[bestNumber].slice(bestSet.filter(c => c.type === 'number').length);
            } else {
                return null; // Can't form required sets
            }
        }

        return {
            group1: sets[0] || [],
            group2: sets[1] || []
        };
    }

    aiFindRunsArrangement(hand, phase) {
        const numbers = hand.filter(card => card.type === 'number').map(card => card.number).sort((a, b) => a - b);
        const wilds = hand.filter(card => card.type === 'wild');
        const uniqueNumbers = [...new Set(numbers)];

        // Try to find the best run
        for (let runLength of phase.runs) {
            const run = this.aiFindBestRun(uniqueNumbers, wilds.length, runLength);
            if (run) {
                const runCards = [];
                let wildsUsed = 0;

                for (let num = run.start; num < run.start + runLength; num++) {
                    if (numbers.includes(num)) {
                        const card = hand.find(c => c.type === 'number' && c.number === num);
                        if (card) runCards.push(card);
                    } else if (wildsUsed < wilds.length) {
                        runCards.push(wilds[wildsUsed]);
                        wildsUsed++;
                    }
                }

                if (runCards.length >= runLength) {
                    return { group1: runCards.slice(0, runLength), group2: [] };
                }
            }
        }

        return null;
    }

    aiFindSetAndRunArrangement(hand, phase) {
        // Try to find both sets and runs
        const setArrangement = this.aiFindSetsArrangement(hand, { sets: phase.sets });
        if (!setArrangement) return null;

        // Remove used cards from hand for run calculation
        const remainingHand = [...hand];
        [...setArrangement.group1, ...setArrangement.group2].forEach(usedCard => {
            const index = remainingHand.findIndex(card => card.id === usedCard.id);
            if (index !== -1) remainingHand.splice(index, 1);
        });

        const runArrangement = this.aiFindRunsArrangement(remainingHand, { runs: phase.runs });
        if (!runArrangement) return null;

        return {
            group1: setArrangement.group1,
            group2: runArrangement.group1
        };
    }

    aiFindBestRun(numbers, wildCount, targetLength) {
        // Find the best starting position for a run
        for (let start = 1; start <= 12 - targetLength + 1; start++) {
            let gaps = 0;
            let existingCards = 0;

            for (let i = 0; i < targetLength; i++) {
                if (numbers.includes(start + i)) {
                    existingCards++;
                } else {
                    gaps++;
                }
            }

            if (gaps <= wildCount && existingCards > 0) {
                return { start, gaps, existing: existingCards };
            }
        }

        return null;
    }

    aiCanCompletePhase(arrangement, phase) {
        // Validate the AI's phase arrangement
        if (phase.special === 'color') {
            const allCards = [...arrangement.group1, ...arrangement.group2];
            if (allCards.length < 7) return false;
            
            const colors = allCards.map(card => card.color).filter(color => color !== 'wild');
            const uniqueColors = [...new Set(colors)];
            return uniqueColors.length === 1;
        }

        let setsValid = true;
        let runsValid = true;

        if (phase.sets.length > 0) {
            setsValid = this.validateSets(arrangement.group1, phase.sets[0]) && 
                       (phase.sets.length === 1 || this.validateSets(arrangement.group2, phase.sets[1]));
        }

        if (phase.runs.length > 0) {
            const targetGroup = phase.sets.length > 0 ? arrangement.group2 : arrangement.group1;
            runsValid = this.validateRun(targetGroup, phase.runs[0]);
        }

        return setsValid && runsValid;
    }

    aiDiscardCard() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (currentPlayer.hand.length === 0) {
            return; // No cards to discard
        }

        // AI logic: discard least useful card
        let worstCardIndex = 0;
        let worstScore = Infinity;

        currentPlayer.hand.forEach((card, index) => {
            const usefulness = this.aiEvaluateCardUsefulness(card, currentPlayer);
            const score = this.aiCalculateCardDiscardScore(card, usefulness);
            
            if (score < worstScore) {
                worstScore = score;
                worstCardIndex = index;
            }
        });

        console.log(`${currentPlayer.name} discarded ${this.getCardDisplay(currentPlayer.hand[worstCardIndex])}`);
        this.discardCard(worstCardIndex);
    }

    aiCalculateCardDiscardScore(card, isUseful) {
        let score = 0;

        // Prefer to keep useful cards
        if (isUseful) score += 100;

        // Prefer to keep wild cards (they're versatile)
        if (card.type === 'wild') score += 80;

        // Prefer to discard high-value cards to reduce penalty
        if (card.type === 'number') {
            score -= card.number > 9 ? 20 : 10; // Higher penalty for high cards
        } else if (card.type === 'skip') {
            score -= 15;
        }

        return score;
    }    endRound() {
        // Calculate scores for the round
        this.players.forEach(player => {
            let roundScore = 0;
            player.hand.forEach(card => {
                if (card.type === 'number') {
                    roundScore += card.number <= 9 ? 5 : 10;
                } else if (card.type === 'wild') {
                    roundScore += 25;
                } else if (card.type === 'skip') {
                    roundScore += 15;
                }
            });
            player.score += roundScore;

            // Advance phase ONLY for players who completed their phase this round
            if (player.hasCompletedPhase) {
                player.currentPhase++;
                player.hasCompletedPhase = false;
            }
        });

        // Check if any player completed all 10 phases
        const winner = this.players.find(player => player.currentPhase > 10);
        if (winner) {
            this.endGame(winner);
            return;
        }
        
        // Start next round
        this.round++;
        this.currentPlayerIndex = 0;
        this.hasDrawnThisTurn = false;
        this.turnPhase = 'draw';
        this.initializeDeck();
        this.dealCards();
        this.completedPhases = [];
        this.phaseBuilder = { group1: [], group2: [] };
        this.updateGameDisplay();
        
        // If first player in new round is AI, start their turn
        const firstPlayer = this.players[this.currentPlayerIndex];
        if (firstPlayer.isAI) {
            setTimeout(() => {
                this.makeAIMove();
            }, 2000);
        }
    }

    endGame(winner) {
        this.gameOver = true;
        this.showGameOverScreen(winner);
    }

    showGameOverScreen(winner) {
        const finalScores = document.getElementById('finalScores');
        finalScores.innerHTML = '';

        // Sort players by phase completed (descending) then by score (ascending)
        const sortedPlayers = [...this.players].sort((a, b) => {
            if (a.currentPhase !== b.currentPhase) {
                return b.currentPhase - a.currentPhase;
            }
            return a.score - b.score;
        });

        sortedPlayers.forEach((player, index) => {
            const scoreEntry = document.createElement('div');
            scoreEntry.className = `score-entry ${index === 0 ? 'winner' : ''}`;
            scoreEntry.innerHTML = `
                <span><strong>${player.name}</strong></span>
                <span>Phase ${player.currentPhase - 1}/10 - ${player.score} points</span>
            `;
            finalScores.appendChild(scoreEntry);
        });

        this.showScreen('gameOverScreen');
    }    updateGameDisplay() {
        this.updatePlayerStatus();
        this.updateGameInfo();
        this.updatePlayerHand();
        this.updateDiscardPile();
        this.updateCompletedPhases();
        this.updatePhaseBuilder();
        this.setupDropZones();
    }    updateGameInfo() {
        document.getElementById('currentRound').textContent = `Round ${this.round}`;
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];
        
        document.getElementById('currentPhaseText').textContent = 
            `Phase ${currentPlayer.currentPhase}: ${currentPhase.description}`;
        
        const playerTurnText = currentPlayer.isAI ? `🤖 ${currentPlayer.name}'s Turn` : `${currentPlayer.name}'s Turn`;
        let turnPhaseText = '';
        
        if (!currentPlayer.isAI) {
            if (!this.hasDrawnThisTurn) {
                turnPhaseText = ' (Draw a card)';
            } else {
                turnPhaseText = ' (Play cards or discard)';
            }
        }
          document.getElementById('currentPlayerText').textContent = playerTurnText + turnPhaseText;
        
        // Announce turn changes to screen readers
        if (!currentPlayer.isAI && this.hasDrawnThisTurn === false) {
            this.announceToScreenReader(`It's your turn, ${currentPlayer.name}. Current phase: ${currentPhase.description}. Draw a card to start.`);
        }
    }updatePlayerStatus() {
        const container = document.getElementById('playersContainer');
        container.innerHTML = '';

        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            let className = `player-status ${index === this.currentPlayerIndex ? 'active' : ''}`;
            if (player.isAI) {
                className += ' ai-player';
                if (index === this.currentPlayerIndex) {
                    className += ' ai-thinking';
                }
            }
            playerDiv.className = className;
            
            playerDiv.innerHTML = `
                <h4>${player.name}</h4>
                <div class="player-phase">Phase ${player.currentPhase}/10</div>
                <div class="player-cards">${player.hand.length} cards</div>
                <div class="player-score">Score: ${player.score}</div>
            `;
            
            container.appendChild(playerDiv);
        });
    }    updatePlayerHand() {
        const handContainer = document.getElementById('playerHand');
        handContainer.innerHTML = '';

        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.hand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            
            if (!currentPlayer.isAI) {
                // Add click handler for card selection
                cardElement.addEventListener('click', (e) => {
                    // Prevent click if a drag operation is in progress
                    if (e.defaultPrevented) return;
                    this.selectCard(index);
                });
                
                // Prevent click events during drag operations
                cardElement.addEventListener('dragstart', (e) => {
                    // Small delay to prevent immediate click after drag start
                    setTimeout(() => {
                        e.target.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (e.target.style) {
                                e.target.style.pointerEvents = 'auto';
                            }
                        }, 100);
                    }, 10);
                });
                
                // Add visual feedback for selectable cards
                if (this.hasDrawnThisTurn) {
                    cardElement.style.cursor = 'pointer';
                    cardElement.title = 'Click to select for discard or drag to phase building';
                } else {
                    cardElement.style.cursor = 'not-allowed';
                    cardElement.title = 'Draw a card first';
                    cardElement.style.opacity = '0.6';
                }
            } else {
                // Dim AI cards and make them non-interactive
                cardElement.style.opacity = '0.7';
                cardElement.style.cursor = 'default';
                cardElement.title = 'AI player card';
            }
            
            handContainer.appendChild(cardElement);
        });
    }updateDiscardPile() {
        const discardContainer = document.getElementById('discardPile');
        discardContainer.innerHTML = '';

        if (this.discardPile.length > 0) {
            const topCard = this.discardPile[this.discardPile.length - 1];
            const cardElement = this.createCardElement(topCard);
            cardElement.addEventListener('click', () => {
                const currentPlayer = this.players[this.currentPlayerIndex];
                if (!currentPlayer.isAI) {
                    this.drawCard('discard');
                }
            });
            discardContainer.appendChild(cardElement);
        } else {
            discardContainer.innerHTML = '<div class="empty-pile">Empty</div>';
        }
    }    updateCompletedPhases() {
        const container = document.getElementById('completedPhases');
        container.innerHTML = '';

        if (this.completedPhases.length === 0) {
            container.innerHTML = '<div class="no-phases">No phases completed yet</div>';
            return;
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        const canAddToOtherPhases = currentPlayer.hasCompletedPhase && !currentPlayer.isAI && this.hasDrawnThisTurn;        this.completedPhases.forEach((phase, phaseIndex) => {
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'completed-phase';
            
            // Get the original phase requirements for better display
            const phaseRequirements = this.randomizedPhases[phase.phase - 1];
            let phaseDescription = `Phase ${phase.phase}: ${phaseRequirements.description}`;
            
            // Use the stored group structure if available, otherwise fall back to reconstruction
            let group1Cards = [];
            let group2Cards = [];
            
            if (phase.group1 && phase.group2) {
                // Use the stored group structure
                group1Cards = phase.group1;
                group2Cards = phase.group2;
            } else {
                // Fall back to legacy reconstruction for backwards compatibility
                if (phaseRequirements.special === 'color') {
                    // For color phases, show all cards together
                    group1Cards = phase.cards;
                } else if (phaseRequirements.sets.length > 0 && phaseRequirements.runs.length > 0) {
                    // For mixed phases (set + run), try to separate logically
                    const cardsByNumber = {};
                    const wildcards = [];
                    
                    phase.cards.forEach(card => {
                        if (card.type === 'wild') {
                            wildcards.push(card);
                        } else if (card.type === 'number') {
                            if (!cardsByNumber[card.number]) cardsByNumber[card.number] = [];
                            cardsByNumber[card.number].push(card);
                        }
                    });
                    
                    // Find the most frequent number (likely the set)
                    let maxCount = 0;
                    let setNumber = null;
                    Object.keys(cardsByNumber).forEach(num => {
                        if (cardsByNumber[num].length > maxCount) {
                            maxCount = cardsByNumber[num].length;
                            setNumber = num;
                        }
                    });
                    
                    if (setNumber) {
                        group1Cards = cardsByNumber[setNumber];
                        group2Cards = phase.cards.filter(card => 
                            !(card.type === 'number' && card.number == setNumber)
                        );
                    } else {
                        group1Cards = phase.cards.slice(0, Math.ceil(phase.cards.length / 2));
                        group2Cards = phase.cards.slice(Math.ceil(phase.cards.length / 2));
                    }
                } else {
                    // For pure sets or runs, split logically or show together
                    if (phaseRequirements.sets.length === 2) {
                        // Split into two groups for two sets
                        group1Cards = phase.cards.slice(0, Math.ceil(phase.cards.length / 2));
                        group2Cards = phase.cards.slice(Math.ceil(phase.cards.length / 2));
                    } else {
                        // Single group
                        group1Cards = phase.cards;
                    }
                }
            }
            
            const group1Html = group1Cards.map(card => 
                `<span class="mini-card ${card.color}">${this.getCardDisplay(card)}</span>`
            ).join('');
            
            const group2Html = group2Cards.length > 0 ? 
                group2Cards.map(card => 
                    `<span class="mini-card ${card.color}">${this.getCardDisplay(card)}</span>`
                ).join('') : '';
            
            // If current player can add to other phases, make it a drop zone
            if (canAddToOtherPhases) {
                let groupsHtml = `<div class="phase-group-display">`;
                  // Group 1 drop zone with proper title
                let group1Title = '';
                if (phaseRequirements.special === 'color') {
                    group1Title = '7 Cards of One Color';
                } else if (phaseRequirements.sets.length > 0) {
                    if (phaseRequirements.sets.length === 1) {
                        group1Title = `Set of ${phaseRequirements.sets[0]}`;
                    } else {
                        group1Title = `Set of ${phaseRequirements.sets[0]}`;
                    }
                } else if (phaseRequirements.runs.length > 0) {
                    group1Title = `Run of ${phaseRequirements.runs[0]}`;
                } else {
                    group1Title = 'Cards';
                }
                
                groupsHtml += `<div class="phase-group-1 completed-phase-drop-zone" data-phase-index="${phaseIndex}" data-group="1">
                    <div class="group-label">${group1Title}:</div>
                    ${group1Html}
                </div>`;
                
                // Group 2 drop zone (only if group2 exists or if this phase type supports it)
                if (group2Cards.length > 0 || phaseRequirements.sets.length === 2 || 
                    (phaseRequirements.sets.length > 0 && phaseRequirements.runs.length > 0)) {
                    
                    let group2Title = '';
                    if (phaseRequirements.sets.length === 2) {
                        group2Title = `Set of ${phaseRequirements.sets[1]}`;
                    } else if (phaseRequirements.sets.length > 0 && phaseRequirements.runs.length > 0) {
                        group2Title = `Run of ${phaseRequirements.runs[0]}`;
                    } else {
                        group2Title = 'Additional Cards';
                    }
                    
                    groupsHtml += `<div class="phase-group-2 completed-phase-drop-zone" data-phase-index="${phaseIndex}" data-group="2">
                        <div class="group-label">${group2Title}:</div>
                        ${group2Html}
                    </div>`;
                }
                
                groupsHtml += `</div>`;
                
                phaseDiv.innerHTML = `
                    <h4>${phase.player} - ${phaseDescription} <span class="add-hint">(Drop cards on specific groups)</span></h4>
                    <div class="phase-cards">
                        ${groupsHtml}
                    </div>
                `;
                
                // Set up drop zones for both groups
                const group1DropZone = phaseDiv.querySelector('[data-group="1"]');
                const group2DropZone = phaseDiv.querySelector('[data-group="2"]');
                
                [group1DropZone, group2DropZone].forEach(dropZone => {
                    if (!dropZone) return;
                    
                    dropZone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        dropZone.classList.add('drag-over');
                    });

                    dropZone.addEventListener('dragleave', (e) => {
                        if (!dropZone.contains(e.relatedTarget)) {
                            dropZone.classList.remove('drag-over');
                        }
                    });

                    dropZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        dropZone.classList.remove('drag-over');
                        
                        try {
                            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                            const { cardId, originalIndex } = dragData;
                            
                            // Find the current index of the card by its ID
                            const currentPlayer = this.players[this.currentPlayerIndex];
                            const currentIndex = currentPlayer.hand.findIndex(card => card.id === cardId);
                            
                            if (currentIndex === -1) {
                                console.warn(`Card with ID ${cardId} not found in player hand`);
                                return;
                            }
                            
                            const targetPhaseIndex = parseInt(dropZone.dataset.phaseIndex);
                            const targetGroup = parseInt(dropZone.dataset.group);
                            this.addCardToCompletedPhase(currentIndex, targetPhaseIndex, targetGroup);
                        } catch (error) {
                            console.error('Error processing completed phase drop:', error);
                            // Fallback to old method for backwards compatibility
                            const cardIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            if (!isNaN(cardIndex)) {
                                const targetPhaseIndex = parseInt(dropZone.dataset.phaseIndex);
                                const targetGroup = parseInt(dropZone.dataset.group);
                                this.addCardToCompletedPhase(cardIndex, targetPhaseIndex, targetGroup);
                            }
                        }
                    });
                });
            } else {
                let groupsHtml = `<div class="phase-group-display">
                    <div class="phase-group-1">${group1Html}</div>`;
                
                if (group2Html) {
                    groupsHtml += `<div class="phase-group-2">${group2Html}</div>`;
                }
                groupsHtml += `</div>`;
                
                phaseDiv.innerHTML = `
                    <h4>${phase.player} - ${phaseDescription}</h4>
                    <div class="phase-cards">
                        ${groupsHtml}
                    </div>
                `;
            }            
            container.appendChild(phaseDiv);
        });
    }    addCardToCompletedPhase(cardIndex, phaseIndex, targetGroup = null) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Validate that the player can add to other phases
        if (!currentPlayer.hasCompletedPhase || currentPlayer.isAI || !this.hasDrawnThisTurn) {
            alert('You must complete your own phase before adding cards to other phases.');
            return;
        }
        
        // Validate card index
        if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
            console.warn(`Invalid card index ${cardIndex} for addCardToCompletedPhase. Hand size: ${currentPlayer.hand.length}`);
            return;
        }
        
        const card = currentPlayer.hand[cardIndex];
        if (!card) {
            console.warn(`No card found at index ${cardIndex} for addCardToCompletedPhase`);
            return;
        }
        
        const completedPhase = this.completedPhases[phaseIndex];
        if (!completedPhase) {
            console.warn(`Invalid phase index ${phaseIndex} for addCardToCompletedPhase`);
            return;
        }
        
        // Validate that the card can be legally added to this phase
        if (!this.canAddCardToCompletedPhase(card, completedPhase, targetGroup)) {
            alert('This card cannot be legally added to that phase group.');
            return;
        }
        
        console.log(`Adding card ${this.getCardDisplay(card)} (ID: ${card.id}) from hand index ${cardIndex} to completed phase ${phaseIndex} group ${targetGroup || 'general'}`);
          // Add card to the appropriate group with improved logic
        if (targetGroup === 1) {
            if (!completedPhase.group1) completedPhase.group1 = [];
            completedPhase.group1.push(card);
        } else if (targetGroup === 2) {
            if (!completedPhase.group2) completedPhase.group2 = [];
            completedPhase.group2.push(card);
        } else {
            // Default behavior - add to the most appropriate group or general cards array
            if (completedPhase.group1 && completedPhase.group2) {
                // Try to determine best group based on phase requirements
                const phaseRequirements = this.randomizedPhases[completedPhase.phase - 1];
                if (this.canAddCardToGroup(card, completedPhase.group1, phaseRequirements, 1)) {
                    completedPhase.group1.push(card);
                } else if (this.canAddCardToGroup(card, completedPhase.group2, phaseRequirements, 2)) {
                    completedPhase.group2.push(card);
                } else {
                    // Fallback to group1
                    completedPhase.group1.push(card);
                }
            } else {
                // Legacy fallback - ensure we have proper group structure
                if (!completedPhase.group1) completedPhase.group1 = [];
                completedPhase.group1.push(card);
            }
        }
        
        // Also add to legacy cards array for backwards compatibility
        if (completedPhase.cards) {
            completedPhase.cards.push(card);
        } else {
            completedPhase.cards = [...(completedPhase.group1 || []), ...(completedPhase.group2 || [])];
        }
        
        // Remove card from player's hand
        currentPlayer.hand.splice(cardIndex, 1);
        
        // Clear selection
        this.selectedCards = [];
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
          console.log(`${currentPlayer.name} added ${this.getCardDisplay(card)} to ${completedPhase.player}'s Phase ${completedPhase.phase} group ${targetGroup || 'general'}`);
        
        // Check if player has no cards left after adding to completed phase
        if (currentPlayer.hand.length === 0) {
            console.log(`${currentPlayer.name} went out by adding to completed phase! Ending round.`);
            this.endRound();
            return;
        }
        
        this.updateGameDisplay();
    }    canAddCardToCompletedPhase(card, completedPhase, targetGroup = null) {
        // Get the original phase requirements
        const phaseRequirements = this.randomizedPhases[completedPhase.phase - 1];
        
        // If targeting a specific group, check that group
        if (targetGroup === 1 && completedPhase.group1) {
            return this.canAddCardToGroup(card, completedPhase.group1, phaseRequirements, 1);
        } else if (targetGroup === 2 && completedPhase.group2) {
            return this.canAddCardToGroup(card, completedPhase.group2, phaseRequirements, 2);
        }
        
        // Legacy check - see if card can be added to any group
        if (completedPhase.group1 && this.canAddCardToGroup(card, completedPhase.group1, phaseRequirements, 1)) {
            return true;
        }
        if (completedPhase.group2 && this.canAddCardToGroup(card, completedPhase.group2, phaseRequirements, 2)) {
            return true;
        }
        
        // Fallback to legacy validation
        return this.legacyCanAddCardToCompletedPhase(card, completedPhase);
    }

    canAddCardToGroup(card, groupCards, phaseRequirements, groupNumber) {
        // For color phases, card must match the color or be wild
        if (phaseRequirements.special === 'color') {
            if (card.type === 'wild') return true;
            
            // Find the dominant color in the group
            const nonWildCards = groupCards.filter(c => c.type !== 'wild');
            if (nonWildCards.length === 0) return true; // All wilds, any color card works
            
            const dominantColor = nonWildCards[0].color;
            return card.color === dominantColor;
        }
        
        // For set phases
        if (phaseRequirements.sets.length > 0) {
            // Check if this is a set group
            const isSetGroup = (groupNumber === 1 && phaseRequirements.sets.length >= 1) ||
                              (groupNumber === 2 && phaseRequirements.sets.length === 2);
            
            if (isSetGroup) {
                // Allow wild cards or cards that match existing numbers in sets
                if (card.type === 'wild') return true;
                
                if (card.type === 'number') {
                    const existingNumbers = groupCards
                        .filter(c => c.type === 'number')
                        .map(c => c.number);
                    
                    // Check if this number already exists in the group (can extend a set)
                    if (existingNumbers.length === 0) return true; // Empty group, any number works
                    return existingNumbers.includes(card.number);
                }
            }
        }
        
        // For run phases
        if (phaseRequirements.runs.length > 0) {
            // Check if this is a run group
            const isRunGroup = (groupNumber === 1 && phaseRequirements.runs.length >= 1) ||
                              (groupNumber === 2 && phaseRequirements.sets.length > 0 && phaseRequirements.runs.length > 0);
            
            if (isRunGroup) {
                if (card.type === 'wild') return true;
                
                if (card.type === 'number') {
                    const existingNumbers = groupCards
                        .filter(c => c.type === 'number')
                        .map(c => c.number)
                        .sort((a, b) => a - b);
                    
                    if (existingNumbers.length === 0) return true; // Empty group, any number works
                    
                    const minNumber = existingNumbers[0];
                    const maxNumber = existingNumbers[existingNumbers.length - 1];
                    
                    // Card can extend the run if it's adjacent to the ends
                    return card.number === minNumber - 1 || card.number === maxNumber + 1;
                }
            }
        }
        
        // Default to allowing wild cards
        return card.type === 'wild';
    }

    legacyCanAddCardToCompletedPhase(card, completedPhase) {
        // Get the original phase requirements
        const phaseRequirements = this.randomizedPhases[completedPhase.phase - 1];
        
        // For color phases, card must match the color or be wild
        if (phaseRequirements.special === 'color') {
            if (card.type === 'wild') return true;
            
            // Find the dominant color in the completed phase
            const nonWildCards = completedPhase.cards.filter(c => c.type !== 'wild');
            if (nonWildCards.length === 0) return true; // All wilds, any color card works
            
            const dominantColor = nonWildCards[0].color;
            return card.color === dominantColor;
        }
        
        // For set phases, we need to determine which group this would extend
        // This is a simplified check - in a full implementation, we'd need to
        // track which cards belong to which group within the phase
        if (phaseRequirements.sets.length > 0) {
            // Allow wild cards or cards that match existing numbers in sets
            if (card.type === 'wild') return true;
            
            if (card.type === 'number') {
                const existingNumbers = completedPhase.cards
                    .filter(c => c.type === 'number')
                    .map(c => c.number);
                
                // Check if this number already exists in the phase (can extend a set)
                return existingNumbers.includes(card.number);
            }
        }
        
        // For run phases, check if card extends the run
        if (phaseRequirements.runs.length > 0 && phaseRequirements.sets.length === 0) {
            if (card.type === 'wild') return true;
            
            if (card.type === 'number') {
                const existingNumbers = completedPhase.cards
                    .filter(c => c.type === 'number')
                    .map(c => c.number)
                    .sort((a, b) => a - b);
                
                if (existingNumbers.length === 0) return true;
                
                const minNumber = existingNumbers[0];
                const maxNumber = existingNumbers[existingNumbers.length - 1];
                
                // Card can extend the run if it's adjacent to the ends
                return card.number === minNumber - 1 || card.number === maxNumber + 1;
            }
        }
        
        // For mixed phases (set + run), this is more complex
        // For now, allow wild cards and be permissive
        return card.type === 'wild';
    }createCardElement(card, index = null) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        
        if (index !== null) {
            cardDiv.setAttribute('data-card-index', index);
            
            // Only make cards draggable for human players
            const currentPlayer = this.players[this.currentPlayerIndex];
            if (!currentPlayer.isAI) {
                cardDiv.draggable = true;
                cardDiv.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
            }
        }

        const display = this.getCardDisplay(card);
        cardDiv.innerHTML = `<div class="card-number">${display}</div>`;

        return cardDiv;
    }

    getCardDisplay(card) {
        if (card.type === 'wild') {
            return 'W';
        } else if (card.type === 'skip') {
            return 'S';
        } else {
            return card.number.toString();
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }    resetGame() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.deck = [];
        this.discardPile = [];
        this.selectedCards = [];
        this.phaseBuilder = { group1: [], group2: [] };
        this.completedPhases = [];
        this.gameOver = false;
        this.isSinglePlayer = false;
        this.isAiAction = false;
        this.hasDrawnThisTurn = false;
        this.turnPhase = 'draw';
        
        // Clear any visual selections
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.showScreen('setupScreen');
    }    handleDragStart(e, cardIndex) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Prevent drag if it's AI turn
        if (currentPlayer.isAI) {
            e.preventDefault();
            return;
        }
        
        // Prevent drag if player hasn't drawn a card
        if (!this.hasDrawnThisTurn) {
            e.preventDefault();
            alert('You must draw a card before moving cards to your phase.');
            return;
        }
        
        // FIXED: Store the card object's unique ID instead of index to prevent wrong card movement
        const card = currentPlayer.hand[cardIndex];
        if (!card) {
            e.preventDefault();
            console.warn(`Invalid card index ${cardIndex} for drag start`);
            return;
        }
        
        // Store both the card ID and current index for validation
        const dragData = {
            cardId: card.id,
            originalIndex: cardIndex
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        
        console.log(`Drag started for card:`, this.getCardDisplay(card), `at index ${cardIndex}`);
    }

    setupDropZones() {
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                }
            });            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                try {
                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const { cardId, originalIndex } = dragData;
                    
                    // Find the current index of the card by its ID
                    const currentPlayer = this.players[this.currentPlayerIndex];
                    const currentIndex = currentPlayer.hand.findIndex(card => card.id === cardId);
                    
                    if (currentIndex === -1) {
                        console.warn(`Card with ID ${cardId} not found in player hand`);
                        return;
                    }
                    
                    const groupNumber = zone.closest('.phase-group').dataset.group;
                    this.addCardToPhaseBuilder(currentIndex, groupNumber);
                } catch (error) {
                    console.error('Error processing drop:', error);
                    // Fallback to old method for backwards compatibility
                    const cardIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (!isNaN(cardIndex)) {
                        const groupNumber = zone.closest('.phase-group').dataset.group;
                        this.addCardToPhaseBuilder(cardIndex, groupNumber);
                    }
                }
            });        });
    }

    addCardToPhaseBuilder(cardIndex, groupNumber) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Prevent AI from using drag and drop
        if (currentPlayer.isAI) {
            console.warn('AI attempted to use addCardToPhaseBuilder - blocked');
            return;
        }
        
        // Ensure player has drawn a card this turn
        if (!this.hasDrawnThisTurn) {
            alert('You must draw a card before building your phase.');
            return;
        }

        // Check if trying to add to group 2 when only one group is needed
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];
        const needsOnlyOneGroup = (currentPhase.sets.length <= 1 && currentPhase.runs.length <= 1 && 
                                   !(currentPhase.sets.length === 1 && currentPhase.runs.length === 1)) ||
                                  currentPhase.special === 'color';
        
        if (groupNumber === 2 && needsOnlyOneGroup) {
            alert('This phase only requires one group. Please add cards to Group 1.');
            return;
        }
        
        // Validate card index
        if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
            console.warn(`Invalid card index ${cardIndex} for addCardToPhaseBuilder. Hand size: ${currentPlayer.hand.length}`);
            return;
        }
        
        const card = currentPlayer.hand[cardIndex];
        
        if (!card) {
            console.warn(`No card found at index ${cardIndex} for addCardToPhaseBuilder`);
            return;
        }

        // UPDATED: Allow adding any card without requiring selection first
        const groupKey = `group${groupNumber}`;
        
        console.log(`Moving card ${this.getCardDisplay(card)} (ID: ${card.id}) from hand index ${cardIndex} to phase builder group ${groupNumber}`);
        
        // Add card to phase builder
        this.phaseBuilder[groupKey].push(card);
        
        // Remove from player hand
        currentPlayer.hand.splice(cardIndex, 1);
        
        // Clear selection since card has been moved
        this.selectedCards = [];
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        console.log(`Card successfully moved to phase builder group ${groupNumber}:`, this.getCardDisplay(card));
        
        this.updateGameDisplay();
        this.updatePhaseBuilder();        this.updatePhaseBuilderButtons();
    }    updatePhaseBuilder() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];
        
        const group1Zone = document.querySelector('[data-group="1"] .drop-zone');
        const group2Zone = document.querySelector('[data-group="2"] .drop-zone');
        const group1Header = document.querySelector('[data-group="1"] .group-header');
        const group2Header = document.querySelector('[data-group="2"] .group-header');
        const group2Container = document.querySelector('[data-group="2"]');

        // Determine if this phase needs only one group
        const needsOnlyOneGroup = (currentPhase.sets.length <= 1 && currentPhase.runs.length <= 1 && 
                                   !(currentPhase.sets.length === 1 && currentPhase.runs.length === 1)) ||
                                  currentPhase.special === 'color';

        // Show/hide Group 2 based on phase requirements
        if (needsOnlyOneGroup) {
            group2Container.style.display = 'none';
        } else {
            group2Container.style.display = 'block';
        }        // Update group headers with phase requirements and descriptions
        if (currentPhase.special === 'color') {
            group1Header.textContent = `7 Cards of One Color`;
        } else {
            let group1Title = '';
            let group2Title = '';
            
            if (currentPhase.sets.length > 0) {
                if (currentPhase.sets.length === 1) {
                    group1Title = `Set of ${currentPhase.sets[0]}`;
                    if (currentPhase.runs.length > 0) {
                        group2Title = `Run of ${currentPhase.runs[0]}`;
                    } else {
                        group2Title = 'Additional Cards';
                    }
                } else if (currentPhase.sets.length === 2) {
                    group1Title = `Set of ${currentPhase.sets[0]}`;
                    group2Title = `Set of ${currentPhase.sets[1]}`;
                }
            } else if (currentPhase.runs.length > 0) {
                group1Title = `Run of ${currentPhase.runs[0]}`;
                group2Title = 'Additional Cards';
            }
            
            // Only show the phase requirement titles, not "Group 1"/"Group 2"
            group1Header.textContent = group1Title;
            if (!needsOnlyOneGroup) {
                group2Header.textContent = group2Title;
            }
        }// Clear existing cards
        group1Zone.innerHTML = '';
        group2Zone.innerHTML = '';

        // Add cards to group 1
        this.phaseBuilder.group1.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            cardElement.classList.add('phase-card');
            cardElement.style.cursor = 'pointer';
            cardElement.title = 'Click to remove from phase group';
            cardElement.addEventListener('click', () => {
                this.removeCardFromPhaseBuilder(index, 'group1');
            });
            group1Zone.appendChild(cardElement);
        });

        // Add cards to group 2 (only if group 2 is visible)
        if (!needsOnlyOneGroup) {
            this.phaseBuilder.group2.forEach((card, index) => {
                const cardElement = this.createCardElement(card);
                cardElement.classList.add('phase-card');
                cardElement.style.cursor = 'pointer';
                cardElement.title = 'Click to remove from phase group';
                cardElement.addEventListener('click', () => {
                    this.removeCardFromPhaseBuilder(index, 'group2');
                });
                group2Zone.appendChild(cardElement);
            });
        }

        // Update placeholder text for empty zones
        if (this.phaseBuilder.group1.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'drop-placeholder';
            placeholder.textContent = 'Drop cards here';
            group1Zone.appendChild(placeholder);
        }
          if (!needsOnlyOneGroup && this.phaseBuilder.group2.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'drop-placeholder';
            placeholder.textContent = 'Drop cards here';
            group2Zone.appendChild(placeholder);
        }

        // Update phase hint
        this.updatePhaseHint();
    }

    removeCardFromPhaseBuilder(cardIndex, groupKey) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Prevent AI from using this function
        if (currentPlayer.isAI) {
            console.warn('AI attempted to use removeCardFromPhaseBuilder - blocked');
            return;
        }
        
        // Validate inputs
        if (!this.phaseBuilder[groupKey] || cardIndex >= this.phaseBuilder[groupKey].length || cardIndex < 0) {
            console.warn(`Invalid removal: group ${groupKey}, index ${cardIndex}`);
            return;
        }
        
        // Remove card from phase builder
        const removedCard = this.phaseBuilder[groupKey].splice(cardIndex, 1)[0];
        
        // Add card back to player's hand
        if (removedCard) {
            currentPlayer.hand.push(removedCard);
            console.log(`Card returned from phase builder to hand:`, this.getCardDisplay(removedCard));
        }
        
        this.updateGameDisplay();
        this.updatePhaseBuilderButtons();
    }updatePhaseHint() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentPhase = this.randomizedPhases[currentPlayer.currentPhase - 1];
        const hintElement = document.getElementById('phaseHint');
        
        if (currentPlayer.hasCompletedPhase) {
            hintElement.textContent = 'Phase completed! Discard cards to go out or add to other phases.';
            return;
        }

        let hint = `Phase ${currentPlayer.currentPhase}: ${currentPhase.description}`;
        
        if (currentPhase.special === 'color') {
            hint += ' (All cards must be the same color)';
        } else {
            if (currentPhase.sets.length > 0) {
                hint += ` | Sets: ${currentPhase.sets.join(', ')} cards each`;
            }
            if (currentPhase.runs.length > 0) {
                hint += ` | Runs: ${currentPhase.runs.join(', ')} consecutive cards`;
            }
        }
        
        hintElement.textContent = hint;
    }    showSkipNotification(playerName, skippedPlayerName) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ff8e53);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: skipNotification 0.5s ease-out;
        `;
        
        // Check if this results in consecutive turns for the same player (2-player game)
        const willGetConsecutiveTurn = this.players.length === 2;
        const message = willGetConsecutiveTurn 
            ? `${skippedPlayerName} loses their turn<br/>${playerName} gets to play again!`
            : `${skippedPlayerName} loses their turn`;
        
        notification.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚫</div>
            <div>${playerName} played a Skip card!</div>
            <div style="font-size: 1rem; margin-top: 0.5rem;">${message}</div>
        `;
        
        // Add animation keyframes if not already present
        if (!document.getElementById('skip-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'skip-animation-styles';
            style.textContent = `
                @keyframes skipNotification {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Accessibility: Announce messages to screen readers
    announceToScreenReader(message) {
        const announcements = document.getElementById('announcements');
        if (announcements) {
            announcements.textContent = message;
            // Clear after a delay to allow for multiple announcements
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Phase10Game();
});
