/**
 * Digital Monopoly Board Game - Application UI Controller
 * Integrates Engine, AI, Sound, and DOM manipulation for tactile physical tabletop experience.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Engine
  const engine = new MonopolyEngine(BOARD_DATA, COLOR_GROUPS, CHANCE_CARDS, COMMUNITY_CHEST_CARDS);

  // DOM Elements
  const monopolyBoard = document.getElementById("monopolyBoard");
  const playersList = document.getElementById("playersList");
  const activityLog = document.getElementById("activityLog");
  const turnBanner = document.getElementById("turnBanner");
  const turnPlayerName = document.getElementById("turnPlayerName");
  const turnPhaseIndicator = document.getElementById("turnPhaseIndicator");
  const doublesStreakBadge = document.getElementById("doublesStreakBadge");
  const jackpotAmountText = document.getElementById("jackpotAmountText");
  const gameModeBadge = document.getElementById("gameModeBadge");

  // Dice elements
  const diceCube1 = document.getElementById("diceCube1");
  const diceCube2 = document.getElementById("diceCube2");
  const diceTotalDisplay = document.getElementById("diceTotalDisplay");
  const diceUnicode = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  // Action Buttons
  const btnRollDice = document.getElementById("btnRollDice");
  const btnEndTurn = document.getElementById("btnEndTurn");
  const btnManageBuildings = document.getElementById("btnManageBuildings");
  const btnManageMortgage = document.getElementById("btnManageMortgage");
  const btnTrade = document.getElementById("btnTrade");
  const btnClearLog = document.getElementById("btnClearLog");
  const btnSoundToggle = document.getElementById("btnSoundToggle");
  const btnRulesGuide = document.getElementById("btnRulesGuide");
  const btnNewGame = document.getElementById("btnNewGame");

  // Jail actions
  const jailActionsRow = document.getElementById("jailActionsRow");
  const btnPayJailFine = document.getElementById("btnPayJailFine");
  const btnUseJailCard = document.getElementById("btnUseJailCard");

  // Modals
  const buyModal = document.getElementById("buyModal");
  const deedCardContainer = document.getElementById("deedCardContainer");
  const btnConfirmBuy = document.getElementById("btnConfirmBuy");
  const btnDeclineBuy = document.getElementById("btnDeclineBuy");

  const auctionModal = document.getElementById("auctionModal");
  const auctionTileTitle = document.getElementById("auctionTileTitle");
  const auctionHighestBidText = document.getElementById("auctionHighestBidText");
  const auctionHighestBidderText = document.getElementById("auctionHighestBidderText");
  const btnAuctionFold = document.getElementById("btnAuctionFold");

  const cardModal = document.getElementById("cardModal");
  const cardModalTypeTitle = document.getElementById("cardModalTypeTitle");
  const cardContainer = document.getElementById("cardContainer");
  const cardTitleText = document.getElementById("cardTitleText");
  const cardDescText = document.getElementById("cardDescText");
  const btnCardAcknowledge = document.getElementById("btnCardAcknowledge");

  const managementModal = document.getElementById("managementModal");
  const mgmtModalTitle = document.getElementById("mgmtModalTitle");
  const mgmtPropsList = document.getElementById("mgmtPropsList");
  const btnCloseMgmt = document.getElementById("btnCloseMgmt");
  const btnCloseMgmtFooter = document.getElementById("btnCloseMgmtFooter");

  const tradeModal = document.getElementById("tradeModal");
  const tradePartnerSelect = document.getElementById("tradePartnerSelect");
  const tradeMyName = document.getElementById("tradeMyName");
  const tradePartnerName = document.getElementById("tradePartnerName");
  const tradeOfferCash = document.getElementById("tradeOfferCash");
  const tradeRequestCash = document.getElementById("tradeRequestCash");
  const tradeOfferCard = document.getElementById("tradeOfferCard");
  const tradeRequestCard = document.getElementById("tradeRequestCard");
  const tradeMyPropsList = document.getElementById("tradeMyPropsList");
  const tradePartnerPropsList = document.getElementById("tradePartnerPropsList");
  const btnCancelTrade = document.getElementById("btnCancelTrade");
  const btnSubmitTrade = document.getElementById("btnSubmitTrade");
  const btnCloseTrade = document.getElementById("btnCloseTrade");

  const setupModal = document.getElementById("setupModal");
  const playerConfigContainers = document.getElementById("playerConfigContainers");
  const chkJackpotRule = document.getElementById("chkJackpotRule");
  const btnStartConfiguredGame = document.getElementById("btnStartConfiguredGame");

  const rulesModal = document.getElementById("rulesModal");
  const btnCloseRules = document.getElementById("btnCloseRules");
  const btnCloseRulesFooter = document.getElementById("btnCloseRulesFooter");

  const victoryModal = document.getElementById("victoryModal");
  const winnerNameText = document.getElementById("winnerNameText");
  const winnerStatsText = document.getElementById("winnerStatsText");
  const btnVictoryPlayAgain = document.getElementById("btnVictoryPlayAgain");

  let setupPlayerCount = 4;
  let isMovingToken = false;

  // -------------------------------------------------------------
  // 1. BOARD GENERATION (Physical 11x11 Geometry)
  // -------------------------------------------------------------
  function getTileGridCoords(tileId) {
    // 0: GO (11, 11)
    if (tileId === 0) return { col: 11, row: 11, orientation: "bottom", corner: "corner-go" };
    // 1 to 9: Bottom row (10 down to 2, row 11)
    if (tileId >= 1 && tileId <= 9) return { col: 11 - tileId, row: 11, orientation: "bottom" };
    // 10: Jail (1, 11)
    if (tileId === 10) return { col: 1, row: 11, orientation: "left", corner: "corner-jail" };
    // 11 to 19: Left col (col 1, row 10 down to 2)
    if (tileId >= 11 && tileId <= 19) return { col: 1, row: 11 - (tileId - 10), orientation: "left" };
    // 20: Free Parking (1, 1)
    if (tileId === 20) return { col: 1, row: 1, orientation: "top", corner: "corner-parking" };
    // 21 to 29: Top row (col 2 up to 10, row 1)
    if (tileId >= 21 && tileId <= 29) return { col: 2 + (tileId - 21), row: 1, orientation: "top" };
    // 30: Go to Jail (11, 1)
    if (tileId === 30) return { col: 11, row: 1, orientation: "right", corner: "corner-go-to-jail" };
    // 31 to 39: Right col (col 11, row 2 up to 10)
    return { col: 11, row: 2 + (tileId - 31), orientation: "right" };
  }

  function renderBoardTiles() {
    // Remove existing tile elements if any (preserving center)
    const existing = monopolyBoard.querySelectorAll(".tile");
    existing.forEach(el => el.remove());

    BOARD_DATA.forEach(tile => {
      const coords = getTileGridCoords(tile.id);
      const tileEl = document.createElement("div");
      tileEl.id = `tile-${tile.id}`;
      tileEl.className = `tile tile-${coords.orientation} ${coords.corner || ""}`;
      tileEl.style.gridColumn = coords.col;
      tileEl.style.gridRow = coords.row;

      let colorBarHtml = "";
      if (tile.group && COLOR_GROUPS[tile.group] && tile.type === "property") {
        colorBarHtml = `<div class="color-bar" style="background-color: ${COLOR_GROUPS[tile.group].colorHex};"></div>`;
      }

      let iconHtml = "";
      if (tile.type === "railroad") iconHtml = `<span class="tile-icon">🚂</span>`;
      else if (tile.type === "utility") iconHtml = `<span class="tile-icon">${tile.id === 12 ? '💡' : '🚰'}</span>`;
      else if (tile.type === "chance") iconHtml = `<span class="tile-icon">❓</span>`;
      else if (tile.type === "chest") iconHtml = `<span class="tile-icon">📦</span>`;
      else if (tile.type === "tax") iconHtml = `<span class="tile-icon">💸</span>`;
      else if (tile.id === 0) iconHtml = `<span class="tile-icon">🚩</span>`;
      else if (tile.id === 10) iconHtml = `<span class="tile-icon">👮</span>`;
      else if (tile.id === 20) iconHtml = `<span class="tile-icon">🅿️</span>`;
      else if (tile.id === 30) iconHtml = `<span class="tile-icon">🚨</span>`;

      let priceHtml = "";
      if (tile.price) {
        priceHtml = `<div class="tile-price">$${tile.price}</div>`;
      } else if (tile.subtext) {
        priceHtml = `<div class="tile-price" style="font-size: 0.5rem; color: #6b7280;">${tile.subtext}</div>`;
      }

      tileEl.innerHTML = `
        ${colorBarHtml}
        <div class="tile-content">
          <div class="tile-title">${tile.shortName || tile.name}</div>
          ${iconHtml}
          ${priceHtml}
        </div>
        <div class="building-tray" id="tray-${tile.id}"></div>
        <div class="tokens-container" id="tokens-${tile.id}"></div>
      `;

      // Tile click inspector
      tileEl.addEventListener("click", () => {
        showTileDetails(tile.id);
      });

      monopolyBoard.appendChild(tileEl);
    });
  }

  // Show Deed Card details on clicking a tile
  function showTileDetails(tileId) {
    const tile = BOARD_DATA[tileId];
    if (!tile.price) return;
    renderDeedCard(tile);
    btnDeclineBuy.style.display = "none";
    btnConfirmBuy.textContent = "Tutup Kartu";
    btnConfirmBuy.onclick = () => buyModal.classList.remove("active");
    buyModal.classList.add("active");
  }

  // -------------------------------------------------------------
  // 2. SETUP MODAL CONTROLLER
  // -------------------------------------------------------------
  function renderSetupSlots(count) {
    playerConfigContainers.innerHTML = "";
    const defaultNames = ["Vin (Human)", "Stockfish Lite (AI)", "Alpha Tycoon (AI)", "Grand Baron (AI)"];

    for (let i = 0; i < count; i++) {
      const isFirst = i === 0;
      const defaultToken = TOKEN_OPTIONS[i % TOKEN_OPTIONS.length];

      const slot = document.createElement("div");
      slot.className = "player-config-slot";
      slot.style.background = "#fff";
      slot.style.border = "1px solid #d1d5db";
      slot.style.borderRadius = "6px";
      slot.style.padding = "0.6rem 0.85rem";
      slot.style.display = "flex";
      slot.style.alignItems = "center";
      slot.style.gap = "0.75rem";

      slot.innerHTML = `
        <div style="font-weight: 800; font-size: 0.9rem; color: #4b5563;">P${i + 1}</div>
        <input type="text" id="cfgName${i}" value="${defaultNames[i]}" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-weight: 600;" />
        <select id="cfgToken${i}" style="padding: 0.35rem; border: 1px solid #ccc; border-radius: 4px;">
          ${TOKEN_OPTIONS.map((tok, tIdx) => `
            <option value="${tok.id}" ${tIdx === i ? 'selected' : ''}>${tok.icon} ${tok.name}</option>
          `).join("")}
        </select>
        <select id="cfgType${i}" style="padding: 0.35rem; border: 1px solid #ccc; border-radius: 4px; font-weight: 600;">
          <option value="human" ${isFirst ? 'selected' : ''}>👤 Manusia</option>
          <option value="ai-easy" ${!isFirst && i === 1 ? 'selected' : ''}>🤖 AI Santai</option>
          <option value="ai-normal" ${!isFirst && i === 2 ? 'selected' : ''}>🤖 AI Normal</option>
          <option value="ai-master" ${!isFirst && i === 3 ? 'selected' : ''}>🤖 AI Master</option>
        </select>
      `;

      playerConfigContainers.appendChild(slot);
    }
  }

  // Setup Player count buttons
  document.querySelectorAll(".btn-player-count").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-player-count").forEach(b => {
        b.classList.remove("btn-brass", "active");
        b.classList.add("btn-dark");
      });
      btn.classList.remove("btn-dark");
      btn.classList.add("btn-brass", "active");
      setupPlayerCount = parseInt(btn.dataset.count, 10);
      renderSetupSlots(setupPlayerCount);
    });
  });

  btnStartConfiguredGame.addEventListener("click", () => {
    Sound.init();
    const configs = [];
    for (let i = 0; i < setupPlayerCount; i++) {
      const name = document.getElementById(`cfgName${i}`).value.trim() || `Pemain ${i + 1}`;
      const tokenVal = document.getElementById(`cfgToken${i}`).value;
      const tokObj = TOKEN_OPTIONS.find(t => t.id === tokenVal) || TOKEN_OPTIONS[i];
      const typeVal = document.getElementById(`cfgType${i}`).value;

      let type = "human";
      let aiDiff = "normal";
      if (typeVal.startsWith("ai")) {
        type = "ai";
        aiDiff = typeVal.replace("ai-", "");
      }

      configs.push({
        name,
        token: tokObj.icon,
        tokenName: tokObj.name,
        metal: tokObj.metal,
        type,
        aiDifficulty: aiDiff
      });
    }

    setupModal.classList.remove("active");
    gameModeBadge.textContent = `${setupPlayerCount} Pemain`;
    engine.startNewGame(configs, { freeParkingJackpot: chkJackpotRule.checked });
  });

  btnNewGame.addEventListener("click", () => {
    setupModal.classList.add("active");
  });

  // -------------------------------------------------------------
  // 3. UI RENDERING & ENGINE EVENTS
  // -------------------------------------------------------------
  engine.on("gameStarted", ({ players, currentTurn }) => {
    renderBoardTiles();
    renderPlayersRoster(players);
    updateTurnUI(currentTurn);
    updateAllTokensPositions();
  });

  engine.on("turnChanged", ({ player }) => {
    updateTurnUI(player);
    renderPlayersRoster(engine.players);
  });

  engine.on("diceRolled", ({ dice, isDouble, player }) => {
    Sound.playDiceRoll();

    // Trigger visual tumbling
    diceCube1.classList.remove("dice-rolling");
    diceCube2.classList.remove("dice-rolling");
    void diceCube1.offsetWidth; // trigger reflow
    diceCube1.classList.add("dice-rolling");
    diceCube2.classList.add("dice-rolling");

    setTimeout(() => {
      diceCube1.textContent = diceUnicode[dice[0] - 1];
      diceCube2.textContent = diceUnicode[dice[1] - 1];
      diceTotalDisplay.textContent = `Total: ${dice[0] + dice[1]}`;
    }, 250);

    if (isDouble) {
      doublesStreakBadge.textContent = `⚡ DOUBLES (${engine.doublesCount}x)`;
    } else {
      doublesStreakBadge.textContent = "";
    }
  });

  // Step-by-step physical token stepping animation
  engine.on("playerMoved", ({ player, oldPos, newPos }) => {
    animateTokenMovement(player, oldPos, newPos);
  });

  function animateTokenMovement(player, startPos, endPos) {
    isMovingToken = true;
    let current = startPos;
    const path = [];

    let p = startPos;
    while (p !== endPos) {
      p = (p + 1) % 40;
      path.push(p);
    }

    let stepIdx = 0;
    function nextStep() {
      if (stepIdx < path.length) {
        current = path[stepIdx];
        moveTokenToDom(player, current);
        Sound.playTokenStep();
        stepIdx++;
        setTimeout(nextStep, 110);
      } else {
        isMovingToken = false;
        renderPlayersRoster(engine.players);
      }
    }

    nextStep();
  }

  function moveTokenToDom(player, tileId) {
    const existing = document.getElementById(`token-p-${player.id}`);
    if (existing) existing.remove();

    const targetContainer = document.getElementById(`tokens-${tileId}`);
    if (!targetContainer) return;

    const tokenEl = document.createElement("div");
    tokenEl.id = `token-p-${player.id}`;
    tokenEl.className = `player-token ${player.metal || "pewter"} token-jumping`;
    tokenEl.title = `${player.name} (${player.tokenName})`;
    tokenEl.textContent = player.token;

    targetContainer.appendChild(tokenEl);

    setTimeout(() => {
      tokenEl.classList.remove("token-jumping");
    }, 250);
  }

  function updateAllTokensPositions() {
    engine.players.forEach(p => {
      if (!p.bankrupt) {
        moveTokenToDom(p, p.position);
      } else {
        const el = document.getElementById(`token-p-${p.id}`);
        if (el) el.remove();
      }
    });
  }

  // Update Roster Card
  function renderPlayersRoster(players) {
    playersList.innerHTML = "";
    players.forEach(p => {
      const isTurn = p.id === engine.getCurrentPlayer().id;
      const card = document.createElement("div");
      card.className = `player-status-card ${isTurn ? 'active-turn' : ''} ${p.bankrupt ? 'bankrupt' : ''}`;

      // Property dots
      const ownedProps = engine.getPlayerProperties(p.id);
      const propDotsHtml = ownedProps.map(tId => {
        const tile = engine.board[tId];
        const color = (tile.group && COLOR_GROUPS[tile.group]) ? COLOR_GROUPS[tile.group].colorHex : "#374151";
        const isM = engine.isMortgaged(tId);
        return `<div class="prop-dot" title="${tile.name}${isM ? ' (Hipotek)' : ''}" style="background-color: ${color}; ${isM ? 'opacity: 0.4; border-style: dashed;' : ''}"></div>`;
      }).join("");

      card.innerHTML = `
        <div class="player-card-top">
          <div class="player-identity">
            <div class="player-avatar-badge ${p.metal || 'pewter'}">${p.token}</div>
            <div>
              <div class="player-name-text">
                ${p.name}
                <span class="player-type-pill">${p.type === 'human' ? 'Manusia' : `AI ${p.aiDifficulty}`}</span>
              </div>
              <div style="font-size: 0.7rem; color: #9ca3af;">${p.inJail ? '🔒 Di Penjara' : (p.bankrupt ? '☠️ Bangkrut' : '🟢 Aktif')}</div>
            </div>
          </div>
          <div class="player-cash-badge">$${p.money}</div>
        </div>
        <div class="player-card-stats">
          <span>Net Worth: <strong>$${engine.getPlayerNetWorth(p.id)}</strong></span>
          <div class="player-props-dots">${propDotsHtml}</div>
        </div>
      `;

      // Click to view currency breakdown
      card.addEventListener("click", () => {
        alert(`${p.name} - Rincian Saldo:\nUang Tunai: $${p.money}\nKartu Bebas Penjara: ${p.jailCards}\nTotal Aset Properti: ${ownedProps.length} petak\nTotal Kekayaan Bersih: $${engine.getPlayerNetWorth(p.id)}`);
      });

      playersList.appendChild(card);
    });

    // Update center jackpot
    jackpotAmountText.textContent = `$${engine.jackpotPool}`;
  }

  // Update Turn Banner & Buttons
  function updateTurnUI(player) {
    turnPlayerName.textContent = `${player.token} ${player.name}`;
    const isHuman = player.type === "human";

    if (engine.phase === "READY_TO_ROLL") {
      turnPhaseIndicator.textContent = "SIAP LEMPAR DADU";
      btnRollDice.disabled = !isHuman;
      btnEndTurn.disabled = true;
    } else if (engine.phase === "ROLLED") {
      turnPhaseIndicator.textContent = engine.extraTurn ? "ANGKA KEMBAR (LEMPAR LAGI!)" : "SELESAIKAN AKSI";
      btnRollDice.disabled = !(isHuman && engine.extraTurn);
      btnEndTurn.disabled = !isHuman;
    } else {
      turnPhaseIndicator.textContent = engine.phase;
      btnRollDice.disabled = true;
      btnEndTurn.disabled = true;
    }

    // Jail escape row
    if (player.inJail && engine.phase === "READY_TO_ROLL" && isHuman) {
      jailActionsRow.style.display = "flex";
      btnPayJailFine.disabled = player.money < 50;
      btnUseJailCard.disabled = player.jailCards <= 0;
    } else {
      jailActionsRow.style.display = "none";
    }

    btnManageBuildings.disabled = !isHuman || player.bankrupt;
    btnManageMortgage.disabled = !isHuman || player.bankrupt;
    btnTrade.disabled = !isHuman || player.bankrupt || engine.getActivePlayers().length < 2;
  }

  // Log Output
  engine.on("log", ({ text }) => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span style="color: #8b5cf6; font-size: 0.7rem;">[${time}]</span> ${text}`;
    activityLog.prepend(entry);
  });

  btnClearLog.addEventListener("click", () => {
    activityLog.innerHTML = "";
  });

  // Sound Toggle
  btnSoundToggle.addEventListener("click", () => {
    const isMuted = Sound.toggleMute();
    btnSoundToggle.textContent = isMuted ? "🔇" : "🔊";
  });

  // -------------------------------------------------------------
  // 4. BUY PROPERTY MODAL & TITLE DEED CARD
  // -------------------------------------------------------------
  function renderDeedCard(tile) {
    const colorHex = (tile.group && COLOR_GROUPS[tile.group]) ? COLOR_GROUPS[tile.group].colorHex : "#1f2937";

    if (tile.type === "railroad") {
      deedCardContainer.innerHTML = `
        <div class="deed-header" style="background-color: #374151;">
          <div class="deed-title-small">STASIUN KERETA API</div>
          <div class="deed-name">${tile.name}</div>
        </div>
        <table class="deed-rent-table">
          <tr><td>Sewa 1 Stasiun:</td><td>$25</td></tr>
          <tr><td>Sewa 2 Stasiun:</td><td>$50</td></tr>
          <tr><td>Sewa 3 Stasiun:</td><td>$100</td></tr>
          <tr><td>Sewa 4 Stasiun:</td><td>$200</td></tr>
        </table>
        <div class="deed-footer">Nilai Hipotek Bank: $${tile.mortgage}</div>
      `;
      return;
    }

    if (tile.type === "utility") {
      deedCardContainer.innerHTML = `
        <div class="deed-header" style="background-color: #4b5563;">
          <div class="deed-title-small">FASILITAS UMUM</div>
          <div class="deed-name">${tile.name}</div>
        </div>
        <div style="font-size: 0.75rem; text-align: left; padding: 0.4rem;">
          Jika memiliki 1 fasilitas: Sewa adalah 4x angka dadu.<br/>
          Jika memiliki kedua fasilitas: Sewa adalah 10x angka dadu.
        </div>
        <div class="deed-footer">Nilai Hipotek Bank: $${tile.mortgage}</div>
      `;
      return;
    }

    deedCardContainer.innerHTML = `
      <div class="deed-header" style="background-color: ${colorHex};">
        <div class="deed-title-small">SURAT HAK MILIK</div>
        <div class="deed-name">${tile.name}</div>
      </div>
      <table class="deed-rent-table">
        <tr><td>Sewa Tanah Kosong:</td><td>$${tile.rent[0]}</td></tr>
        <tr><td>Dengan 1 Rumah:</td><td>$${tile.rent[1]}</td></tr>
        <tr><td>Dengan 2 Rumah:</td><td>$${tile.rent[2]}</td></tr>
        <tr><td>Dengan 3 Rumah:</td><td>$${tile.rent[3]}</td></tr>
        <tr><td>Dengan 4 Rumah:</td><td>$${tile.rent[4]}</td></tr>
        <tr><td>Dengan 1 HOTEL:</td><td>$${tile.rent[5]}</td></tr>
      </table>
      <div class="deed-footer">
        <div>Biaya Rumah/Hotel: $${tile.houseCost} per unit</div>
        <div>Nilai Hipotek Bank: $${tile.mortgage}</div>
      </div>
    `;
  }

  engine.on("buyPrompt", ({ player, tile }) => {
    // If AI player, evaluate instantly
    if (player.type === "ai") {
      const willBuy = engine.aiEngine.shouldBuyProperty(player, tile, engine);
      setTimeout(() => {
        if (willBuy) {
          engine.buyCurrentProperty();
          Sound.playCash();
        } else {
          engine.declineProperty();
        }
      }, 900);
      return;
    }

    // Human player: show interactive modal
    renderDeedCard(tile);
    btnDeclineBuy.style.display = "inline-flex";
    btnConfirmBuy.textContent = `Beli Properti ($${tile.price})`;
    btnConfirmBuy.onclick = () => {
      buyModal.classList.remove("active");
      const ok = engine.buyCurrentProperty();
      if (ok) Sound.playCash();
    };

    btnDeclineBuy.onclick = () => {
      buyModal.classList.remove("active");
      engine.declineProperty();
    };

    buyModal.classList.add("active");
  });

  // -------------------------------------------------------------
  // 5. AUCTION MODAL & BIDDING CONTROLLER
  // -------------------------------------------------------------
  engine.on("auctionStarted", auction => {
    Sound.playGavel();
    auctionTileTitle.textContent = `${auction.tile.name} (Harga Asli: $${auction.tile.price})`;
    updateAuctionUI(auction);
    auctionModal.classList.add("active");
  });

  engine.on("auctionBid", ({ player, amount, auction }) => {
    Sound.playGavel();
    updateAuctionUI(auction);
  });

  engine.on("auctionFold", ({ auction }) => {
    updateAuctionUI(auction);
  });

  engine.on("auctionEnded", () => {
    auctionModal.classList.remove("active");
    renderPlayersRoster(engine.players);
  });

  function updateAuctionUI(auction) {
    if (!auction) return;
    auctionHighestBidText.textContent = `$${auction.currentBid}`;
    auctionHighestBidderText.textContent = `Penawar Tertinggi: ${auction.highestBidderName}`;

    const currentPlayer = engine.getCurrentPlayer();
    const canBid = auction.activeParticipants.includes(currentPlayer.id);
    btnAuctionFold.disabled = !canBid;
  }

  document.querySelectorAll(".btn-bid").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!engine.auctionState) return;
      const add = parseInt(btn.dataset.add, 10);
      const targetBid = engine.auctionState.currentBid + add;
      const p = engine.getCurrentPlayer();
      engine.placeBid(p.id, targetBid);
    });
  });

  btnAuctionFold.addEventListener("click", () => {
    if (!engine.auctionState) return;
    const p = engine.getCurrentPlayer();
    engine.foldAuction(p.id);
  });

  // -------------------------------------------------------------
  // 6. CARD MODAL (CHANCE & COMMUNITY CHEST)
  // -------------------------------------------------------------
  engine.on("cardDrawn", ({ type, card, player }) => {
    Sound.playCardFlip();
    cardModalTypeTitle.textContent = type === "chance" ? "🎴 KARTU KESEMPATAN" : "📦 KARTU DANA UMUM";
    cardContainer.className = `drawn-card ${type === 'chance' ? 'chance-type' : 'chest-type'}`;
    cardTitleText.textContent = card.title;
    cardDescText.textContent = card.desc;

    // If AI, auto-dismiss
    if (player.type === "ai") {
      cardModal.classList.add("active");
      setTimeout(() => {
        cardModal.classList.remove("active");
      }, 1500);
      return;
    }

    cardModal.classList.add("active");
  });

  btnCardAcknowledge.addEventListener("click", () => {
    cardModal.classList.remove("active");
  });

  // -------------------------------------------------------------
  // 7. BUILDINGS & MORTGAGE RENDERING & MODALS
  // -------------------------------------------------------------
  engine.on("houseBuilt", ({ tile, count, isHotel }) => {
    Sound.playBuild();
    updateBuildingDisplay(tile.id, count, isHotel);
    renderPlayersRoster(engine.players);
  });

  engine.on("houseSold", ({ tile, count }) => {
    updateBuildingDisplay(tile.id, count, false);
    renderPlayersRoster(engine.players);
  });

  engine.on("propertyMortgaged", ({ tile }) => {
    updateMortgageStamp(tile.id, true);
    renderPlayersRoster(engine.players);
  });

  engine.on("propertyUnmortgaged", ({ tile }) => {
    updateMortgageStamp(tile.id, false);
    renderPlayersRoster(engine.players);
  });

  function updateBuildingDisplay(tileId, count, isHotel) {
    const tray = document.getElementById(`tray-${tileId}`);
    if (!tray) return;
    tray.innerHTML = "";

    if (isHotel || count === 5) {
      const hEl = document.createElement("div");
      hEl.className = "hotel-piece";
      hEl.title = "1 Hotel";
      tray.appendChild(hEl);
    } else {
      for (let i = 0; i < count; i++) {
        const hEl = document.createElement("div");
        hEl.className = "house-piece";
        hEl.title = `${count} Rumah`;
        tray.appendChild(hEl);
      }
    }
  }

  function updateMortgageStamp(tileId, isMortgaged) {
    const tileEl = document.getElementById(`tile-${tileId}`);
    if (!tileEl) return;

    let stamp = tileEl.querySelector(".mortgaged-stamp");
    if (isMortgaged) {
      if (!stamp) {
        stamp = document.createElement("div");
        stamp.className = "mortgaged-stamp";
        stamp.textContent = "HIPOTEK";
        tileEl.appendChild(stamp);
      }
    } else {
      if (stamp) stamp.remove();
    }
  }

  // Management Modal (Houses & Mortgage)
  btnManageBuildings.addEventListener("click", () => openManagementModal("buildings"));
  btnManageMortgage.addEventListener("click", () => openManagementModal("mortgage"));

  function openManagementModal(mode) {
    const player = engine.getCurrentPlayer();
    mgmtModalTitle.textContent = mode === "buildings" ? "🏠 BANGUN / JUAL RUMAH" : "📜 HIPOTEK / TEBUS BANK";
    mgmtPropsList.innerHTML = "";

    const owned = engine.getPlayerProperties(player.id);
    if (owned.length === 0) {
      mgmtPropsList.innerHTML = `<div style="text-align: center; color: #6b7280; padding: 1rem;">Anda belum memiliki properti apapun.</div>`;
      managementModal.classList.add("active");
      return;
    }

    owned.forEach(tId => {
      const tile = engine.board[tId];
      const row = document.createElement("div");
      row.className = "manage-prop-row";

      const colorHex = (tile.group && COLOR_GROUPS[tile.group]) ? COLOR_GROUPS[tile.group].colorHex : "#374151";
      const hCount = engine.houses[tId] || 0;
      const isM = engine.isMortgaged(tId);

      let controlsHtml = "";
      if (mode === "buildings" && tile.type === "property") {
        controlsHtml = `
          <button class="btn btn-dark btn-sm btn-sell-h" data-id="${tId}" ${hCount <= 0 ? 'disabled' : ''}>- Jual ($${Math.floor(tile.houseCost/2)})</button>
          <span style="font-weight: 800; font-size: 0.85rem; padding: 0 4px;">${hCount === 5 ? '🏨 Hotel' : `${hCount} 🏠`}</span>
          <button class="btn btn-brass btn-sm btn-build-h" data-id="${tId}" ${hCount >= 5 ? 'disabled' : ''}>+ Bangun ($${tile.houseCost})</button>
        `;
      } else {
        controlsHtml = isM
          ? `<button class="btn btn-brass btn-sm btn-unmortgage" data-id="${tId}">Tebus ($${Math.floor(tile.mortgage * 1.1)})</button>`
          : `<button class="btn btn-dark btn-sm btn-mortgage" data-id="${tId}">Gadaikan (+$${tile.mortgage})</button>`;
      }

      row.innerHTML = `
        <div class="manage-prop-info">
          <div class="color-indicator-swatch" style="background-color: ${colorHex};"></div>
          <div>
            <div style="font-weight: 700; font-size: 0.88rem;">${tile.name}</div>
            <div style="font-size: 0.72rem; color: #6b7280;">${isM ? 'Status: Digadaikan' : (hCount > 0 ? `${hCount === 5 ? '1 Hotel' : `${hCount} Rumah`}` : 'Tanah Kosong')}</div>
          </div>
        </div>
        <div class="manage-prop-actions">${controlsHtml}</div>
      `;

      mgmtPropsList.appendChild(row);
    });

    // Wire up row buttons
    mgmtPropsList.querySelectorAll(".btn-build-h").forEach(b => {
      b.onclick = () => {
        const res = engine.buildHouse(parseInt(b.dataset.id, 10));
        if (!res.success) alert(res.msg);
        openManagementModal("buildings");
      };
    });

    mgmtPropsList.querySelectorAll(".btn-sell-h").forEach(b => {
      b.onclick = () => {
        const res = engine.sellHouse(parseInt(b.dataset.id, 10));
        if (!res.success) alert(res.msg);
        openManagementModal("buildings");
      };
    });

    mgmtPropsList.querySelectorAll(".btn-mortgage").forEach(b => {
      b.onclick = () => {
        const res = engine.mortgageProperty(parseInt(b.dataset.id, 10));
        if (!res.success) alert(res.msg);
        openManagementModal("mortgage");
      };
    });

    mgmtPropsList.querySelectorAll(".btn-unmortgage").forEach(b => {
      b.onclick = () => {
        const res = engine.unmortgageProperty(parseInt(b.dataset.id, 10));
        if (!res.success) alert(res.msg);
        openManagementModal("mortgage");
      };
    });

    managementModal.classList.add("active");
  }

  btnCloseMgmt.onclick = () => managementModal.classList.remove("active");
  btnCloseMgmtFooter.onclick = () => managementModal.classList.remove("active");

  // -------------------------------------------------------------
  // 8. TRADE MODAL & BILATERAL NEGOTIATION
  // -------------------------------------------------------------
  btnTrade.addEventListener("click", () => {
    const me = engine.getCurrentPlayer();
    tradeMyName.textContent = `Aset ${me.name} (Ditawarkan)`;

    const partners = engine.getActivePlayers().filter(p => p.id !== me.id);
    tradePartnerSelect.innerHTML = partners.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

    updateTradeModalPropsLists();
    tradeModal.classList.add("active");
  });

  tradePartnerSelect.addEventListener("change", updateTradeModalPropsLists);

  function updateTradeModalPropsLists() {
    const me = engine.getCurrentPlayer();
    const partnerId = parseInt(tradePartnerSelect.value, 10);
    const partner = engine.players.find(p => p.id === partnerId);
    if (!partner) return;

    tradePartnerName.textContent = `Aset ${partner.name} (Diminta)`;

    // My properties
    const myProps = engine.getPlayerProperties(me.id);
    tradeMyPropsList.innerHTML = myProps.map(tId => {
      const tile = engine.board[tId];
      return `
        <label class="trade-check-item">
          <input type="checkbox" class="chk-my-prop" value="${tId}" />
          ${tile.name} ($${tile.price})
        </label>
      `;
    }).join("") || `<span style="font-size: 0.72rem; color: #9ca3af;">Tidak memiliki properti</span>`;

    // Partner properties
    const partnerProps = engine.getPlayerProperties(partner.id);
    tradePartnerPropsList.innerHTML = partnerProps.map(tId => {
      const tile = engine.board[tId];
      return `
        <label class="trade-check-item">
          <input type="checkbox" class="chk-partner-prop" value="${tId}" />
          ${tile.name} ($${tile.price})
        </label>
      `;
    }).join("") || `<span style="font-size: 0.72rem; color: #9ca3af;">Tidak memiliki properti</span>`;
  }

  btnSubmitTrade.addEventListener("click", () => {
    const me = engine.getCurrentPlayer();
    const partnerId = parseInt(tradePartnerSelect.value, 10);

    const offerMoney = parseInt(tradeOfferCash.value, 10) || 0;
    const requestMoney = parseInt(tradeRequestCash.value, 10) || 0;

    const offerProps = Array.from(document.querySelectorAll(".chk-my-prop:checked")).map(cb => parseInt(cb.value, 10));
    const requestProps = Array.from(document.querySelectorAll(".chk-partner-prop:checked")).map(cb => parseInt(cb.value, 10));

    const offerCards = tradeOfferCard.checked ? 1 : 0;
    const requestCards = tradeRequestCard.checked ? 1 : 0;

    if (offerMoney > me.money) {
      alert("Uang tunai yang Anda tawarkan melebihi saldo kas Anda!");
      return;
    }

    tradeModal.classList.remove("active");
    engine.proposeTrade(me.id, partnerId, {
      offerMoney,
      offerProps,
      offerCards,
      requestMoney,
      requestProps,
      requestCards
    });
  });

  btnCancelTrade.onclick = () => tradeModal.classList.remove("active");
  btnCloseTrade.onclick = () => tradeModal.classList.remove("active");

  // -------------------------------------------------------------
  // 9. JAIL & TURN ACTION BUTTONS
  // -------------------------------------------------------------
  btnRollDice.addEventListener("click", () => {
    Sound.init();
    engine.rollDice();
  });

  btnEndTurn.addEventListener("click", () => {
    engine.endTurn();
  });

  btnPayJailFine.addEventListener("click", () => {
    engine.payJailFine();
  });

  btnUseJailCard.addEventListener("click", () => {
    engine.useJailCard();
  });

  // Rules Guide Modal
  btnRulesGuide.addEventListener("click", () => rulesModal.classList.add("active"));
  btnCloseRules.onclick = () => rulesModal.classList.remove("active");
  btnCloseRulesFooter.onclick = () => rulesModal.classList.remove("active");

  // Victory Modal
  engine.on("gameOver", ({ winner }) => {
    Sound.playVictory();
    winnerNameText.textContent = `${winner.token} ${winner.name} MENANG!`;
    winnerStatsText.textContent = `Saldo Kas Akhir: $${winner.money} | Total Nilai Aset: $${engine.getPlayerNetWorth(winner.id)}`;
    victoryModal.classList.add("active");
  });

  btnVictoryPlayAgain.addEventListener("click", () => {
    victoryModal.classList.remove("active");
    setupModal.classList.add("active");
  });

  const btnCloseBuy = document.getElementById("btnCloseBuy");
  if (btnCloseBuy) btnCloseBuy.onclick = () => buyModal.classList.remove("active");

  const btnCloseAuction = document.getElementById("btnCloseAuction");
  if (btnCloseAuction) btnCloseAuction.onclick = () => auctionModal.classList.remove("active");

  const btnCloseCard = document.getElementById("btnCloseCard");
  if (btnCloseCard) btnCloseCard.onclick = () => cardModal.classList.remove("active");

  const btnCloseSetup = document.getElementById("btnCloseSetup");
  if (btnCloseSetup) btnCloseSetup.onclick = () => setupModal.classList.remove("active");

  // Initial render of setup slots & auto-start 4-player game
  renderSetupSlots(setupPlayerCount);
  renderBoardTiles();

  const defaultPlayers = [
    { name: "Vin (Human)", token: "🎩", tokenName: "Top Hat", metal: "pewter", type: "human" },
    { name: "Stockfish Lite (AI)", token: "🚗", tokenName: "Roadster", metal: "brass", type: "ai", aiDifficulty: "normal" },
    { name: "Alpha Tycoon (AI)", token: "🚢", tokenName: "Battleship", metal: "silver", type: "ai", aiDifficulty: "normal" },
    { name: "Grand Baron (AI)", token: "👞", tokenName: "Boot", metal: "bronze", type: "ai", aiDifficulty: "normal" }
  ];
  engine.startNewGame(defaultPlayers, { freeParkingJackpot: false });
});
