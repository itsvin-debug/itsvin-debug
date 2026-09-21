// Vin's Cyber Chess Arena - Professional Real-Time Chess Engine & Interface

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Chess Engine from local or global instance
  const ChessEngine = window.Chess;
  if (!ChessEngine) {
    console.error('Chess library not available');
    return;
  }

  const game = new ChessEngine();
  
  // Game State
  let selectedSquare = null;
  let legalMoves = [];
  let boardFlipped = false;
  let gameMode = 'ai'; // 'ai' or 'pvp'
  let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
  let autoFlipPvP = false;
  let soundEnabled = true;
  let moveHistory = [];
  let pendingPromotion = null;
  let isAiThinking = false;
  
  // Timers
  let timeLimit = 600; // default 10 minutes in seconds (0 = unlimited)
  let whiteTime = 600;
  let blackTime = 600;
  let timerInterval = null;
  let lastMoveSquares = [];

  // Piece evaluation values for AI
  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Positional Piece-Square Tables (PST)
  const PAWN_PST = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ];

  const KNIGHT_PST = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  const BISHOP_PST = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ];

  // DOM Elements
  const boardEl = document.getElementById('chessboard');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const modeAiBtn = document.getElementById('modeAiBtn');
  const modePvpBtn = document.getElementById('modePvpBtn');
  const aiDifficultyGroup = document.getElementById('aiDifficultyGroup');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const timeSelect = document.getElementById('timeSelect');
  const newGameBtn = document.getElementById('newGameBtn');
  const undoMoveBtn = document.getElementById('undoMoveBtn');
  const flipBoardBtn = document.getElementById('flipBoardBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const evalBar = document.getElementById('evalBar');
  const moveHistoryEl = document.getElementById('moveHistory');
  const whiteTimerEl = document.getElementById('whiteTimer');
  const blackTimerEl = document.getElementById('blackTimer');
  const whitePlayerCard = document.getElementById('whitePlayerCard');
  const blackPlayerCard = document.getElementById('blackPlayerCard');
  const whiteCapturedEl = document.getElementById('whiteCaptured');
  const blackCapturedEl = document.getElementById('blackCaptured');
  const blackNameEl = document.getElementById('blackName');
  const blackAvatarEl = document.getElementById('blackAvatar');
  const blackBadgeEl = document.getElementById('blackBadge');
  const promotionModal = document.getElementById('promotionModal');
  const promotionChoices = document.getElementById('promotionChoices');
  const gameOverModal = document.getElementById('gameOverModal');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverDesc = document.getElementById('gameOverDesc');
  const gameOverIcon = document.getElementById('gameOverIcon');
  const modalNewGameBtn = document.getElementById('modalNewGameBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // Web Audio Synthesizer (Realistic Sound Effects)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === 'move') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'capture') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'check') {
        [540, 680].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.3, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.12);
        });
      } else if (type === 'gameover') {
        [392, 493, 587, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.25, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.25);
        });
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  }

  // Render Chessboard
  function renderBoard() {
    boardEl.innerHTML = '';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const displayRanks = boardFlipped ? ranks.slice().reverse() : ranks;
    const displayFiles = boardFlipped ? files.slice().reverse() : files;

    displayRanks.forEach((rank, rIdx) => {
      displayFiles.forEach((file, fIdx) => {
        const square = file + rank;
        const squareEl = document.createElement('div');
        squareEl.className = 'square';
        squareEl.dataset.square = square;

        // Algebraic rank & file indices
        const fileNum = file.charCodeAt(0) - 97;
        const rankNum = parseInt(rank, 10);
        const isLight = (fileNum + rankNum) % 2 !== 0;
        squareEl.classList.add(isLight ? 'light' : 'dark');

        // Last move highlight
        if (lastMoveSquares.includes(square)) {
          squareEl.classList.add('last-move');
        }

        // Selected square highlight
        if (selectedSquare === square) {
          squareEl.classList.add('selected');
        }

        // Piece rendering
        const piece = game.get(square);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
          pieceEl.style.backgroundImage = `url('pieces/${pieceKey}.svg')`;

          // King in check red radial highlight
          if (piece.type === 'k' && piece.color === game.turn() && game.in_check()) {
            squareEl.classList.add('in-check');
          }

          squareEl.appendChild(pieceEl);
        }

        // Legal move indicators
        const isLegal = legalMoves.find(m => m.to === square);
        if (isLegal) {
          const hint = document.createElement('div');
          hint.className = piece ? 'legal-capture' : 'legal-dot';
          squareEl.appendChild(hint);
        }

        // Rank coordinates (left edge)
        if (fIdx === 0) {
          const rankCoord = document.createElement('span');
          rankCoord.className = 'coord coord-rank';
          rankCoord.textContent = rank;
          squareEl.appendChild(rankCoord);
        }
        // File coordinates (bottom edge)
        if (rIdx === 7) {
          const fileCoord = document.createElement('span');
          fileCoord.className = 'coord coord-file';
          fileCoord.textContent = file;
          squareEl.appendChild(fileCoord);
        }

        // Click Handler
        squareEl.addEventListener('click', () => handleSquareClick(square));

        boardEl.appendChild(squareEl);
      });
    });

    updateUI();
  }

  // Handle Square Click
  function handleSquareClick(square) {
    if (game.game_over()) return;

    // In AI mode, block user clicks when AI is thinking
    if (gameMode === 'ai' && (game.turn() === 'b' || isAiThinking)) return;

    const piece = game.get(square);

    // If a piece is already selected and user clicked a legal destination
    if (selectedSquare) {
      const move = legalMoves.find(m => m.to === square);

      if (move) {
        const movingPiece = game.get(selectedSquare);
        // Check for Pawn Promotion (rank 8 for white, rank 1 for black)
        if (movingPiece && movingPiece.type === 'p' && (square[1] === '8' || square[1] === '1')) {
          pendingPromotion = { from: selectedSquare, to: square };
          showPromotionModal(movingPiece.color);
          return;
        }

        executeMove({ from: selectedSquare, to: square });
        selectedSquare = null;
        legalMoves = [];
        renderBoard();
        return;
      }
    }

    // Selecting own piece for current turn
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      legalMoves = game.moves({ square: square, verbose: true });
    } else {
      selectedSquare = null;
      legalMoves = [];
    }

    renderBoard();
  }

  // Execute Move
  function executeMove(moveObj) {
    const isCapture = game.get(moveObj.to) !== null;
    const result = game.move(moveObj);

    if (result) {
      lastMoveSquares = [result.from, result.to];
      moveHistory.push(result.san);

      if (game.in_check()) {
        playSound('check');
      } else if (isCapture || result.captured) {
        playSound('capture');
      } else {
        playSound('move');
      }

      startTimer();

      // Check Game Over
      if (game.game_over()) {
        stopTimer();
        playSound('gameover');
        renderBoard();
        handleGameOver();
        return;
      }

      // Auto-flip in 2-player mode if requested
      if (gameMode === 'pvp' && autoFlipPvP) {
        boardFlipped = game.turn() === 'b';
      }

      renderBoard();

      // AI Turn Trigger
      if (gameMode === 'ai' && game.turn() === 'b') {
        isAiThinking = true;
        statusIndicator.textContent = '🤖 AI Sedang Berpikir...';
        statusIndicator.style.color = 'var(--accent-cyan)';
        
        // Natural thinking delay (350ms - 550ms)
        const delay = aiDifficulty === 'hard' ? 450 : 350;
        setTimeout(() => {
          makeAiMove();
          isAiThinking = false;
        }, delay);
      }
    }
  }

  // Promotion Modal
  function showPromotionModal(color) {
    promotionChoices.innerHTML = '';
    const choices = [
      { type: 'q', label: 'Ratu' },
      { type: 'r', label: 'Benteng' },
      { type: 'b', label: 'Gajah' },
      { type: 'n', label: 'Kuda' }
    ];

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      btn.title = choice.label;
      const pieceKey = `${color}${choice.type.toUpperCase()}`;
      btn.innerHTML = `<img src="pieces/${pieceKey}.svg" alt="${choice.label}" />`;
      btn.addEventListener('click', () => {
        promotionModal.classList.add('hidden');
        if (pendingPromotion) {
          executeMove({
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            promotion: choice.type
          });
          pendingPromotion = null;
          selectedSquare = null;
          legalMoves = [];
          renderBoard();
        }
      });
      promotionChoices.appendChild(btn);
    });

    promotionModal.classList.remove('hidden');
  }

  // AI Decision Engine
  function makeAiMove() {
    if (game.game_over()) return;

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    let chosenMove = null;

    if (aiDifficulty === 'easy') {
      // Easy (Santai): 40% random, otherwise depth 1 basic capture
      if (Math.random() < 0.4) {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      } else {
        chosenMove = getBestMove(1);
      }
    } else if (aiDifficulty === 'medium') {
      // Medium (Sedang): Depth 2 Minimax with PST
      chosenMove = getBestMove(2);
    } else {
      // Master (Hard): Depth 3 Minimax with Alpha-Beta Pruning
      chosenMove = getBestMove(3);
    }

    if (chosenMove) {
      executeMove(chosenMove);
    }
  }

  function getBestMove(depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    const moves = game.moves({ verbose: true });

    // Prioritize captures and checks to optimize alpha-beta pruning
    moves.sort((a, b) => {
      let scoreA = a.captured ? PIECE_VALUES[a.captured] : 0;
      let scoreB = b.captured ? PIECE_VALUES[b.captured] : 0;
      return scoreB - scoreA;
    });

    for (const move of moves) {
      game.move(move);
      // For Black (AI): higher score in evaluateBoard means better for Black.
      // After Black moves, it is White's turn (minimizing player).
      const score = minimax(depth - 1, -Infinity, Infinity, false);
      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || moves[0];
  }

  function minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.game_over()) {
      return evaluateBoard();
    }

    const moves = game.moves({ verbose: true });

    if (isMaximizing) {
      // Black's perspective: maximize score
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evalScore = minimax(depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      // White's perspective: minimize score
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evalScore = minimax(depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Board Evaluator (Positive = Black winning, Negative = White winning)
  function evaluateBoard() {
    if (game.in_checkmate()) {
      return game.turn() === 'w' ? 100000 : -100000;
    }
    if (game.in_draw()) {
      return 0;
    }

    let totalScore = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type] || 0;
          let pstBonus = 0;

          const squareIdx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

          if (piece.type === 'p') pstBonus = PAWN_PST[squareIdx];
          else if (piece.type === 'n') pstBonus = KNIGHT_PST[squareIdx];
          else if (piece.type === 'b') pstBonus = BISHOP_PST[squareIdx];

          const pieceScore = val + pstBonus;
          totalScore += piece.color === 'b' ? pieceScore : -pieceScore;
        }
      }
    }

    return totalScore;
  }

  // UI Updates & Evaluation Bar
  function updateUI() {
    const turn = game.turn();

    // Turn Indicators
    if (turn === 'w') {
      whitePlayerCard.classList.add('active-turn');
      blackPlayerCard.classList.remove('active-turn');
      statusIndicator.textContent = gameMode === 'ai' ? 'Giliranmu (Putih)' : 'Giliran Pemain 1 (Putih)';
      statusIndicator.style.color = 'var(--accent-emerald)';
    } else {
      whitePlayerCard.classList.remove('active-turn');
      blackPlayerCard.classList.add('active-turn');
      statusIndicator.textContent = gameMode === 'ai' ? 'Giliran AI (Hitam)' : 'Giliran Pemain 2 (Hitam)';
      statusIndicator.style.color = 'var(--accent-cyan)';
    }

    if (game.in_check()) {
      statusIndicator.textContent = `⚠️ SKAK! Raja ${turn === 'w' ? 'Putih' : 'Hitam'} Terancam!`;
      statusIndicator.style.color = 'var(--accent-rose)';
    }

    // Update Captured Pieces and Material Difference
    updateCapturedPieces();

    // Update History Table
    updateMoveHistoryUI();
  }

  function updateCapturedPieces() {
    const history = game.history({ verbose: true });
    const whiteCaptured = [];
    const blackCaptured = [];
    let whiteScore = 0;
    let blackScore = 0;

    history.forEach(m => {
      if (m.captured) {
        if (m.color === 'w') {
          // White captured a black piece
          blackCaptured.push(`b${m.captured.toUpperCase()}`);
          whiteScore += PIECE_VALUES[m.captured];
        } else {
          // Black captured a white piece
          whiteCaptured.push(`w${m.captured.toUpperCase()}`);
          blackScore += PIECE_VALUES[m.captured];
        }
      }
    });

    whiteCapturedEl.innerHTML = whiteCaptured.map(p => `<img src="pieces/${p}.svg" alt="${p}" />`).join('');
    blackCapturedEl.innerHTML = blackCaptured.map(p => `<img src="pieces/${p}.svg" alt="${p}" />`).join('');

    const diff = whiteScore - blackScore;
    if (diff > 0) {
      whiteCapturedEl.innerHTML += `<span class="material-diff">+${Math.round(diff / 100)}</span>`;
    } else if (diff < 0) {
      blackCapturedEl.innerHTML += `<span class="material-diff">+${Math.round(Math.abs(diff) / 100)}</span>`;
    }

    // Evaluation Bar: 50% is even, higher means White advantage
    const evalPercent = Math.max(10, Math.min(90, 50 + diff / 25));
    evalBar.style.width = `${evalPercent}%`;
  }

  function updateMoveHistoryUI() {
    if (moveHistory.length === 0) {
      moveHistoryEl.innerHTML = '<div class="history-empty">Belum ada langkah yang dimainkan.</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1] || '';
      html += `
        <div class="history-row">
          <span class="history-num">${moveNum}.</span>
          <span class="history-move">${whiteMove}</span>
          <span class="history-move">${blackMove}</span>
        </div>
      `;
    }

    moveHistoryEl.innerHTML = html;
    moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
  }

  // Timers Implementation
  function startTimer() {
    if (timeLimit === 0) return;
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (game.game_over()) {
        clearInterval(timerInterval);
        return;
      }

      if (game.turn() === 'w') {
        whiteTime--;
        if (whiteTime <= 0) {
          whiteTime = 0;
          clearInterval(timerInterval);
          handleTimeOut('w');
        }
      } else {
        blackTime--;
        if (blackTime <= 0) {
          blackTime = 0;
          clearInterval(timerInterval);
          handleTimeOut('b');
        }
      }

      renderTimers();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
  }

  function renderTimers() {
    const formatTime = sec => {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    whiteTimerEl.textContent = timeLimit === 0 ? '∞' : formatTime(whiteTime);
    blackTimerEl.textContent = timeLimit === 0 ? '∞' : formatTime(blackTime);
  }

  function handleTimeOut(color) {
    const winner = color === 'w' ? 'Hitam' : 'Putih';
    gameOverIcon.textContent = '⌛';
    gameOverTitle.textContent = 'Waktu Habis!';
    gameOverDesc.textContent = `${winner} menang karena lawan kehabisan waktu.`;
    gameOverModal.classList.remove('hidden');
    playSound('gameover');
  }

  // Game Over Handling
  function handleGameOver() {
    let title = 'Permainan Berakhir!';
    let desc = '';
    let icon = '🤝';

    if (game.in_checkmate()) {
      const winner = game.turn() === 'w' ? 'Hitam' : 'Putih';
      title = 'Skakmat! 🏆';
      desc = `${winner} memenangkan pertandingan!`;
      icon = winner === 'Putih' ? '👑' : '💀';
    } else if (game.in_draw()) {
      title = 'Remis (Draw) 🤝';
      if (game.in_stalemate()) desc = 'Permainan berakhir secara Stalemate (Pat).';
      else if (game.in_threefold_repetition()) desc = 'Remis karena pengulangan posisi 3 kali.';
      else if (game.insufficient_material()) desc = 'Remis karena sisa bidak tidak cukup untuk skakmat.';
      else desc = 'Permainan berakhir dengan hasil imbang.';
    }

    gameOverIcon.textContent = icon;
    gameOverTitle.textContent = title;
    gameOverDesc.textContent = desc;
    gameOverModal.classList.remove('hidden');
  }

  // Reset / New Game
  function resetGame() {
    stopTimer();
    game.reset();
    selectedSquare = null;
    legalMoves = [];
    moveHistory = [];
    lastMoveSquares = [];
    pendingPromotion = null;
    isAiThinking = false;
    whiteTime = timeLimit;
    blackTime = timeLimit;
    boardFlipped = false;
    renderTimers();
    gameOverModal.classList.add('hidden');
    promotionModal.classList.add('hidden');
    renderBoard();
  }

  // Event Listeners
  newGameBtn.addEventListener('click', resetGame);
  modalNewGameBtn.addEventListener('click', resetGame);
  modalCloseBtn.addEventListener('click', () => gameOverModal.classList.add('hidden'));

  undoMoveBtn.addEventListener('click', () => {
    if (game.history().length === 0 || isAiThinking) return;
    
    // In AI mode, undo 2 moves (AI move and user move)
    if (gameMode === 'ai') {
      game.undo();
      if (game.turn() === 'b') {
        game.undo();
      }
      moveHistory = game.history();
    } else {
      game.undo();
      moveHistory.pop();
    }

    selectedSquare = null;
    legalMoves = [];
    lastMoveSquares = [];
    renderBoard();
  });

  flipBoardBtn.addEventListener('click', () => {
    boardFlipped = !boardFlipped;
    renderBoard();
  });

  // Mode Selection
  modeAiBtn.addEventListener('click', () => {
    modeAiBtn.classList.add('active');
    modePvpBtn.classList.remove('active');
    aiDifficultyGroup.style.display = 'block';
    gameMode = 'ai';
    blackNameEl.textContent = 'Stockfish Lite (AI)';
    blackAvatarEl.textContent = '🤖';
    blackBadgeEl.textContent = `Level: ${aiDifficulty.toUpperCase()}`;
    resetGame();
  });

  modePvpBtn.addEventListener('click', () => {
    modePvpBtn.classList.add('active');
    modeAiBtn.classList.remove('active');
    aiDifficultyGroup.style.display = 'none';
    gameMode = 'pvp';
    blackNameEl.textContent = 'Player 2 (Hitam)';
    blackAvatarEl.textContent = '👤';
    blackBadgeEl.textContent = '2-Pemain (PvP)';
    resetGame();
  });

  // Difficulty Selection
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aiDifficulty = btn.dataset.diff;
      blackBadgeEl.textContent = `Level: ${aiDifficulty.toUpperCase()}`;
    });
  });

  // Time Control Selection
  timeSelect.addEventListener('change', (e) => {
    timeLimit = parseInt(e.target.value, 10);
    whiteTime = timeLimit;
    blackTime = timeLimit;
    renderTimers();
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
  });

  // Start Initial Game
  renderTimers();
  renderBoard();
});
