// Vin's Cyber Chess Arena - Complete Interactive Engine & UI

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Chess Engine
  if (typeof Chess === 'undefined') {
    console.error('chess.js library not loaded');
    return;
  }

  const game = new Chess();
  
  // Game State
  let selectedSquare = null;
  let legalMoves = [];
  let boardFlipped = false;
  let gameMode = 'ai'; // 'ai' or 'pvp'
  let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
  let soundEnabled = true;
  let moveHistory = [];
  let pendingPromotion = null;
  
  // Timers
  let timeLimit = 600; // default 10 minutes in seconds (0 = unlimited)
  let whiteTime = 600;
  let blackTime = 600;
  let timerInterval = null;
  let lastMoveSquares = [];

  // Piece evaluation values
  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Positional Piece-Square Tables (PST) from White's perspective
  const PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ];

  const KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  const BISHOP_TABLE = [
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

  // Web Audio Synthesizer (Realistic Sound FX)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      if (type === 'move') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'capture') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'check') {
        [540, 680].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.3, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.12);
        });
      } else if (type === 'gameover') {
        [392, 493, 587, 784].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.25, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.25);
        });
      }
    } catch (e) {
      console.log('Audio playback error', e);
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

        // Color alternation
        const isLight = (rIdx + fIdx) % 2 === 0;
        squareEl.classList.add(isLight ? 'light' : 'dark');

        // Last move highlight
        if (lastMoveSquares.includes(square)) {
          squareEl.classList.add('last-move');
        }

        // Selection highlight
        if (selectedSquare === square) {
          squareEl.classList.add('selected');
        }

        // Piece on this square
        const piece = game.get(square);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
          pieceEl.style.backgroundImage = `url('pieces/${pieceKey}.svg')`;

          // King in check indicator
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

        // Coordinates Labels
        if (fIdx === 0) {
          const rankCoord = document.createElement('span');
          rankCoord.className = 'coord coord-rank';
          rankCoord.textContent = rank;
          squareEl.appendChild(rankCoord);
        }
        if (rIdx === 7) {
          const fileCoord = document.createElement('span');
          fileCoord.className = 'coord coord-file';
          fileCoord.textContent = file;
          squareEl.appendChild(fileCoord);
        }

        // Click Event
        squareEl.addEventListener('click', () => handleSquareClick(square));

        boardEl.appendChild(squareEl);
      });
    });

    updateUI();
  }

  // Handle Square Click
  function handleSquareClick(square) {
    if (game.game_over()) return;

    // In AI mode, block input when it's AI's turn
    if (gameMode === 'ai' && game.turn() === 'b') return;

    const piece = game.get(square);

    // If a square is already selected and clicked a legal target
    if (selectedSquare) {
      const move = legalMoves.find(m => m.to === square);

      if (move) {
        // Check for Pawn Promotion
        const movingPiece = game.get(selectedSquare);
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

    // Selecting own piece
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
    const isCapture = game.get(moveObj.to) !== null || (moveObj.promotion && game.get(moveObj.to));
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
      renderBoard();

      // Check Game Over
      if (game.game_over()) {
        stopTimer();
        playSound('gameover');
        handleGameOver();
        return;
      }

      // If playing AI, trigger AI response
      if (gameMode === 'ai' && game.turn() === 'b') {
        statusIndicator.textContent = '🤖 AI Sedang Berpikir...';
        setTimeout(makeAiMove, 300);
      }
    }
  }

  // Show Promotion Modal
  function showPromotionModal(color) {
    promotionChoices.innerHTML = '';
    const choices = ['q', 'r', 'b', 'n'];

    choices.forEach(pType => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      const pieceKey = `${color}${pType.toUpperCase()}`;
      btn.innerHTML = `<img src="pieces/${pieceKey}.svg" alt="${pType}" />`;
      btn.addEventListener('click', () => {
        promotionModal.classList.add('hidden');
        if (pendingPromotion) {
          executeMove({
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            promotion: pType
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

  // AI Decision Engine (Minimax + Positional Evaluation)
  function makeAiMove() {
    if (game.game_over()) return;

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    let chosenMove = null;

    if (aiDifficulty === 'easy') {
      // 60% random, 40% basic capture evaluation
      if (Math.random() < 0.6) {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      } else {
        chosenMove = getBestMove(1);
      }
    } else if (aiDifficulty === 'medium') {
      // Minimax Depth 2 with PST
      chosenMove = getBestMove(2);
    } else {
      // Hard: Minimax Depth 3 with Alpha-Beta Pruning
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

    // Prioritize captures for faster pruning
    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

    for (const move of moves) {
      game.move(move);
      const score = -minimax(depth - 1, -Infinity, Infinity, false);
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

  // Board Evaluator from perspective of current turn
  function evaluateBoard() {
    let totalScore = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type] || 0;
          let pstBonus = 0;
          const squareIdx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

          if (piece.type === 'p') pstBonus = PAWN_TABLE[squareIdx];
          else if (piece.type === 'n') pstBonus = KNIGHT_TABLE[squareIdx];
          else if (piece.type === 'b') pstBonus = BISHOP_TABLE[squareIdx];

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

    // Turn Highlights on Player Cards
    if (turn === 'w') {
      whitePlayerCard.classList.add('active-turn');
      blackPlayerCard.classList.remove('active-turn');
      statusIndicator.textContent = 'Giliran Putih Melangkah';
      statusIndicator.style.color = 'var(--accent-emerald)';
    } else {
      whitePlayerCard.classList.remove('active-turn');
      blackPlayerCard.classList.add('active-turn');
      statusIndicator.textContent = gameMode === 'ai' ? 'Giliran AI (Hitam)' : 'Giliran Hitam Melangkah';
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

    whiteCapturedEl.innerHTML = whiteCaptured.map(p => `<img src="pieces/${p}.svg" />`).join('');
    blackCapturedEl.innerHTML = blackCaptured.map(p => `<img src="pieces/${p}.svg" />`).join('');

    const diff = whiteScore - blackScore;
    if (diff > 0) {
      whiteCapturedEl.innerHTML += `<span class="material-diff">+${Math.round(diff / 100)}</span>`;
    } else if (diff < 0) {
      blackCapturedEl.innerHTML += `<span class="material-diff">+${Math.round(Math.abs(diff) / 100)}</span>`;
    }

    // Update Eval Bar (50% is equal)
    const evalPercent = Math.max(10, Math.min(90, 50 + diff / 30));
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
    whiteTime = timeLimit;
    blackTime = timeLimit;
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
    if (game.history().length === 0) return;
    
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
    blackNameEl.textContent = 'Player 2 (Black)';
    blackAvatarEl.textContent = '👤';
    blackBadgeEl.textContent = '2-Pemain';
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
