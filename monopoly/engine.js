/**
 * Digital Monopoly Board Game - Core Engine
 * Full implementation of Classic Standard Monopoly Rules
 */

class MonopolyEngine {
  constructor(boardData, colorGroups, chanceCards, commCards) {
    this.board = boardData;
    this.colorGroups = colorGroups;
    this.allChanceCards = chanceCards;
    this.allCommCards = commCards;

    this.players = [];
    this.turnIndex = 0;
    this.phase = "READY_TO_ROLL"; // READY_TO_ROLL, ROLLED, BUY_PROMPT, AUCTION, DEBT, GAME_OVER
    this.dice = [1, 1];
    this.doublesCount = 0;
    this.extraTurn = false;
    this.diceRolledThisTurn = false;

    this.propertyOwners = {}; // tileId -> playerId
    this.houses = {};         // tileId -> 0..5 (5 = Hotel)
    this.mortgages = {};      // tileId -> boolean

    this.chanceDeck = [];
    this.commDeck = [];
    this.chanceIndex = 0;
    this.commIndex = 0;

    this.jackpotPool = 0;
    this.freeParkingJackpot = false;

    this.auctionState = null;
    this.tradeState = null;
    this.pendingDebt = null;

    this.eventListeners = {};
    this.aiEngine = new MonopolyAI("normal");
  }

  // Event Subscription
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  }

  // Setup New Game
  startNewGame(playerConfigs, options = {}) {
    this.players = playerConfigs.map((cfg, idx) => ({
      id: idx,
      name: cfg.name || `Pemain ${idx + 1}`,
      token: cfg.token || TOKEN_OPTIONS[idx % TOKEN_OPTIONS.length].icon,
      tokenName: cfg.tokenName || TOKEN_OPTIONS[idx % TOKEN_OPTIONS.length].name,
      metal: cfg.metal || TOKEN_OPTIONS[idx % TOKEN_OPTIONS.length].metal,
      type: cfg.type || "human", // 'human' or 'ai'
      aiDifficulty: cfg.aiDifficulty || "normal",
      money: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      jailCards: 0,
      bankrupt: false,
      bankruptTo: null,
      color: cfg.color || ["#e11d48", "#2563eb", "#16a34a", "#d97706"][idx % 4]
    }));

    this.freeParkingJackpot = !!options.freeParkingJackpot;
    this.jackpotPool = 0;

    this.turnIndex = 0;
    this.phase = "READY_TO_ROLL";
    this.dice = [1, 1];
    this.doublesCount = 0;
    this.extraTurn = false;
    this.diceRolledThisTurn = false;
    this.propertyOwners = {};
    this.houses = {};
    this.mortgages = {};

    this.shuffleDecks();

    this.emit("gameStarted", { players: this.players, currentTurn: this.getCurrentPlayer() });
    this.emit("log", { text: `🎲 Permainan dimulai! ${this.players.length} pemain siap berlaga di atas papan fisik klasik.` });
  }

  shuffleDecks() {
    this.chanceDeck = [...this.allChanceCards].sort(() => Math.random() - 0.5);
    this.commDeck = [...this.allCommCards].sort(() => Math.random() - 0.5);
    this.chanceIndex = 0;
    this.commIndex = 0;
  }

  getCurrentPlayer() {
    return this.players[this.turnIndex];
  }

  getActivePlayers() {
    return this.players.filter(p => !p.bankrupt);
  }

  getPropertyOwner(tileId) {
    const pId = this.propertyOwners[tileId];
    if (pId !== undefined && pId !== null) {
      return this.players.find(p => p.id === pId) || null;
    }
    return null;
  }

  isMortgaged(tileId) {
    return !!this.mortgages[tileId];
  }

  getPlayerProperties(playerId) {
    const list = [];
    for (const [tId, pId] of Object.entries(this.propertyOwners)) {
      if (pId === playerId) list.push(parseInt(tId, 10));
    }
    return list;
  }

  // Calculate Net Worth: Cash + Unmortgaged Properties + Mortgaged Properties (50%) + Houses (100% cost)
  getPlayerNetWorth(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.bankrupt) return 0;

    let net = player.money;
    for (const tId of this.getPlayerProperties(playerId)) {
      const tile = this.board[tId];
      if (this.isMortgaged(tId)) {
        net += tile.mortgage;
      } else {
        net += tile.price;
      }
      const hCount = this.houses[tId] || 0;
      if (hCount > 0 && tile.houseCost) {
        net += hCount * tile.houseCost;
      }
    }
    return net;
  }

  // Check if player owns entire color group
  isMonopolyComplete(groupKey) {
    const groupDef = this.colorGroups[groupKey];
    if (!groupDef) return false;

    let firstOwner = null;
    for (const tId of groupDef.tiles) {
      const owner = this.propertyOwners[tId];
      if (owner === undefined || owner === null) return false;
      if (firstOwner === null) firstOwner = owner;
      else if (firstOwner !== owner) return false;
    }
    return true;
  }

  getPlayerMonopolies(playerId) {
    const complete = [];
    for (const [grpKey, grpDef] of Object.entries(this.colorGroups)) {
      if (grpKey === "railroad" || grpKey === "utility" || grpKey === "special") continue;
      let ownsAll = true;
      for (const tId of grpDef.tiles) {
        if (this.propertyOwners[tId] !== playerId) {
          ownsAll = false;
          break;
        }
      }
      if (ownsAll) complete.push(grpKey);
    }
    return complete;
  }

  hasHousesInGroup(tileId) {
    const tile = this.board[tileId];
    if (!tile.group || !this.colorGroups[tile.group]) return false;
    for (const tId of this.colorGroups[tile.group].tiles) {
      if ((this.houses[tId] || 0) > 0) return true;
    }
    return false;
  }

  // Roll Dice Action
  rollDice() {
    const player = this.getCurrentPlayer();
    if (this.phase !== "READY_TO_ROLL" || player.bankrupt) {
      return null;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    this.dice = [d1, d2];
    this.diceRolledThisTurn = true;
    const isDouble = d1 === d2;

    this.emit("diceRolled", { dice: [d1, d2], isDouble, player });
    this.emit("log", { text: `🎲 ${player.name} melempar dadu: [${d1}] & [${d2}] = ${d1 + d2}${isDouble ? ' (DOUBLES! Angka Kembar)' : ''}.` });

    // In Jail handling
    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.doublesCount = 0;
        this.extraTurn = false; // Escaping jail with double does not grant extra turn
        this.emit("log", { text: `🔓 ${player.name} berhasil melempar angka kembar dan BEBAS dari penjara!` });
        this.movePlayer(d1 + d2);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          this.emit("log", { text: `⚖️ ${player.name} telah 3 putaran di penjara tanpa angka kembar. Wajib bayar denda $50.` });
          this.chargeDebt(player, 50, null, () => {
            player.inJail = false;
            player.jailTurns = 0;
            this.movePlayer(d1 + d2);
          });
        } else {
          this.emit("log", { text: `🔒 ${player.name} gagal melempar angka kembar (Percobaan ke-${player.jailTurns}/3). Tetap di penjara.` });
          this.phase = "ROLLED";
          this.emit("stateChanged", { phase: this.phase });
        }
      }
      return [d1, d2];
    }

    // Standard turn
    if (isDouble) {
      this.doublesCount++;
      if (this.doublesCount === 3) {
        this.emit("log", { text: `🚨 ${player.name} melempar angka kembar 3x berturut-turut! Langsung dijebloskan ke PENJARA!` });
        this.sendToJail(player);
        this.phase = "ROLLED";
        this.emit("stateChanged", { phase: this.phase });
        return [d1, d2];
      } else {
        this.extraTurn = true;
      }
    } else {
      this.extraTurn = false;
      this.doublesCount = 0;
    }

    this.movePlayer(d1 + d2);
    return [d1, d2];
  }

  // Pay $50 to exit jail
  payJailFine() {
    const player = this.getCurrentPlayer();
    if (!player.inJail || this.phase !== "READY_TO_ROLL") return false;

    if (player.money < 50) {
      this.emit("log", { text: `❌ ${player.name} tidak memiliki cukup uang untuk membayar denda $50.` });
      return false;
    }

    player.money -= 50;
    if (this.freeParkingJackpot) this.jackpotPool += 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.emit("log", { text: `💵 ${player.name} membayar denda $50 ke Bank dan bebas dari Penjara!` });
    this.emit("playerUpdated", player);
    return true;
  }

  // Use Get Out of Jail Free card
  useJailCard() {
    const player = this.getCurrentPlayer();
    if (!player.inJail || player.jailCards <= 0 || this.phase !== "READY_TO_ROLL") return false;

    player.jailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.emit("log", { text: `🎟️ ${player.name} menggunakan Kartu Bebas Penjara dan keluar dari Penjara!` });
    this.emit("playerUpdated", player);
    return true;
  }

  // Move player along 40 tiles
  movePlayer(steps, options = {}) {
    const player = this.getCurrentPlayer();
    const oldPos = player.position;
    let newPos = (oldPos + steps) % 40;
    if (newPos < 0) newPos += 40;

    // Check pass GO (collect $200)
    if (!options.teleport && (newPos < oldPos || newPos === 0)) {
      player.money += 200;
      this.emit("log", { text: `🚩 ${player.name} melewati/mendarat di GO! Menerima $200 dari Bank.` });
      this.emit("cashCollected", { player, amount: 200 });
    }

    player.position = newPos;
    const tile = this.board[newPos];

    this.emit("playerMoved", { player, oldPos, newPos, tile });
    this.handleTileLanding(player, tile);
  }

  // Advance to specific tile
  teleportToTile(tileIndex, collectPassGo = false) {
    const player = this.getCurrentPlayer();
    const oldPos = player.position;
    if (collectPassGo && tileIndex < oldPos) {
      player.money += 200;
      this.emit("log", { text: `🚩 ${player.name} melewati GO dalam perjalanan! Menerima $200.` });
      this.emit("cashCollected", { player, amount: 200 });
    }
    player.position = tileIndex;
    const tile = this.board[tileIndex];
    this.emit("playerMoved", { player, oldPos, newPos: tileIndex, tile });
    this.handleTileLanding(player, tile);
  }

  // Handle tile landed on
  handleTileLanding(player, tile) {
    this.emit("log", { text: `📍 ${player.name} mendarat di [${tile.id}] ${tile.name}.` });

    switch (tile.type) {
      case "property":
      case "railroad":
      case "utility":
        this.handleRealEstateLanding(player, tile);
        break;

      case "tax":
        this.emit("log", { text: `💸 ${player.name} wajib membayar ${tile.name} sebesar $${tile.price}.` });
        this.chargeDebt(player, tile.price, null, () => {
          if (this.freeParkingJackpot) this.jackpotPool += tile.price;
          this.endTurnActionCheck();
        });
        break;

      case "chance":
        this.drawChanceCard(player);
        break;

      case "chest":
        this.drawCommunityChestCard(player);
        break;

      case "go-to-jail":
        this.emit("log", { text: `🚨 ${player.name} mendarat di 'Go to Jail'! Ditangkap Polisi & Masuk Penjara.` });
        this.sendToJail(player);
        this.phase = "ROLLED";
        this.emit("stateChanged", { phase: this.phase });
        break;

      case "parking":
        if (this.freeParkingJackpot && this.jackpotPool > 0) {
          const won = this.jackpotPool;
          this.jackpotPool = 0;
          player.money += won;
          this.emit("log", { text: `🏆 REZEKI NOMPLOK! ${player.name} mendarat di Free Parking dan memenangkan Jackpot sebesar $${won}!` });
          this.emit("playerUpdated", player);
        } else {
          this.emit("log", { text: `☕ ${player.name} beristirahat di Free Parking tanpa terkena biaya.` });
        }
        this.endTurnActionCheck();
        break;

      case "jail":
        this.emit("log", { text: `👮 ${player.name} hanya singgah berkunjung di Penjara (Just Visiting).` });
        this.endTurnActionCheck();
        break;

      case "special": // GO
      default:
        this.endTurnActionCheck();
        break;
    }
  }

  // Real estate landing (unowned vs owned)
  handleRealEstateLanding(player, tile) {
    const owner = this.getPropertyOwner(tile.id);

    // Unowned property -> Can buy or auction!
    if (!owner) {
      this.phase = "BUY_PROMPT";
      this.emit("buyPrompt", { player, tile });
      return;
    }

    // Owned by self
    if (owner.id === player.id) {
      this.emit("log", { text: `🏡 ${player.name} singgah di properti miliknya sendiri (${tile.name}). Tidak ada sewa.` });
      this.endTurnActionCheck();
      return;
    }

    // Mortgaged property -> No rent!
    if (this.isMortgaged(tile.id)) {
      this.emit("log", { text: `📜 Properti ${tile.name} sedang digadaikan (Hipotek) oleh ${owner.name}. Bebas sewa!` });
      this.endTurnActionCheck();
      return;
    }

    // Calculate rent
    let rentAmount = this.calculateRent(tile);
    this.emit("log", { text: `🏠 ${tile.name} dimiliki oleh ${owner.name}. ${player.name} wajib bayar sewa $${rentAmount}!` });

    this.chargeDebt(player, rentAmount, owner, () => {
      this.endTurnActionCheck();
    });
  }

  // Calculate rent according to classic rules
  calculateRent(tile, diceOverride = null) {
    const ownerId = this.propertyOwners[tile.id];
    if (ownerId === undefined || ownerId === null || this.isMortgaged(tile.id)) return 0;

    // Street Property
    if (tile.type === "property") {
      const hCount = this.houses[tile.id] || 0;
      if (hCount > 0) {
        return tile.rent[hCount];
      }
      // If unimproved but owner has full monopoly: double rent!
      if (this.isMonopolyComplete(tile.group)) {
        return tile.rent[0] * 2;
      }
      return tile.rent[0];
    }

    // Railroad: 25, 50, 100, 200 based on count of owned railroads
    if (tile.type === "railroad") {
      const rrGroup = this.colorGroups["railroad"].tiles;
      let count = 0;
      for (const tId of rrGroup) {
        if (this.propertyOwners[tId] === ownerId) count++;
      }
      return tile.rent[Math.max(0, Math.min(3, count - 1))];
    }

    // Utility: 4x or 10x dice roll
    if (tile.type === "utility") {
      const utilGroup = this.colorGroups["utility"].tiles;
      let count = 0;
      for (const tId of utilGroup) {
        if (this.propertyOwners[tId] === ownerId) count++;
      }
      const rollTotal = diceOverride || (this.dice[0] + this.dice[1]) || 7;
      const multiplier = count >= 2 ? 10 : 4;
      return rollTotal * multiplier;
    }

    return 0;
  }

  // Buy current property
  buyCurrentProperty() {
    const player = this.getCurrentPlayer();
    const tile = this.board[player.position];

    if (this.phase !== "BUY_PROMPT" || this.propertyOwners[tile.id] !== undefined) {
      return false;
    }

    if (player.money < tile.price) {
      this.emit("log", { text: `❌ ${player.name} tidak memiliki cukup uang untuk membeli ${tile.name} ($${tile.price}).` });
      this.startAuction(tile.id);
      return false;
    }

    player.money -= tile.price;
    this.propertyOwners[tile.id] = player.id;
    this.emit("log", { text: `💼 ${player.name} MEMBELI ${tile.name} seharga $${tile.price}!` });
    this.emit("propertyBought", { player, tile });
    this.emit("playerUpdated", player);

    this.endTurnActionCheck();
    return true;
  }

  // Decline property -> Triggers standard transparent Auction
  declineProperty() {
    const player = this.getCurrentPlayer();
    const tile = this.board[player.position];

    if (this.phase !== "BUY_PROMPT") return;

    this.emit("log", { text: `📢 ${player.name} menolak membeli ${tile.name}. Sistem membuka LELANG resmi untuk semua pemain!` });
    this.startAuction(tile.id);
  }

  // Start Auction for a property
  startAuction(tileId) {
    const tile = this.board[tileId];
    const active = this.getActivePlayers().map(p => p.id);

    this.phase = "AUCTION";
    this.auctionState = {
      tileId,
      tile,
      currentBid: 0,
      highestBidderId: null,
      highestBidderName: "Belum Ada",
      activeParticipants: active,
      minIncrement: 10
    };

    this.emit("auctionStarted", this.auctionState);
    this.emit("log", { text: `🔨 LELANG DIMULAI untuk properti [${tile.name}]! Penawaran awal dibuka.` });

    this.processAuctionStep();
  }

  // Process next step in auction (handles AI bids)
  processAuctionStep() {
    if (!this.auctionState) return;

    // If only 1 participant left and has bid
    if (this.auctionState.activeParticipants.length === 1 && this.auctionState.highestBidderId !== null) {
      this.finalizeAuction();
      return;
    }

    // If no participants left without bids
    if (this.auctionState.activeParticipants.length === 0) {
      this.finalizeAuction();
      return;
    }

    // Check if any AI wants to bid
    const eligibleAIs = this.auctionState.activeParticipants
      .map(id => this.players.find(p => p.id === id))
      .filter(p => p && p.type === "ai" && p.id !== this.auctionState.highestBidderId);

    if (eligibleAIs.length > 0) {
      const aiPlayer = eligibleAIs[0];
      const bid = this.aiEngine.decideAuctionBid(
        aiPlayer,
        this.auctionState.tile,
        this.auctionState.currentBid,
        this.auctionState.minIncrement,
        this
      );

      if (bid !== null) {
        setTimeout(() => {
          if (!this.auctionState) return;
          this.placeBid(aiPlayer.id, bid);
        }, 800);
      } else {
        // AI folds
        setTimeout(() => {
          if (!this.auctionState) return;
          this.foldAuction(aiPlayer.id);
        }, 500);
      }
    }
  }

  // Player places bid in auction
  placeBid(playerId, bidAmount) {
    if (!this.auctionState) return false;
    const player = this.players.find(p => p.id === playerId);

    if (!player || player.money < bidAmount || bidAmount <= this.auctionState.currentBid) {
      return false;
    }

    this.auctionState.currentBid = bidAmount;
    this.auctionState.highestBidderId = playerId;
    this.auctionState.highestBidderName = player.name;

    this.emit("auctionBid", { player, amount: bidAmount, auction: this.auctionState });
    this.emit("log", { text: `🔨 ${player.name} mengajukan penawaran lelang: $${bidAmount}!` });

    this.processAuctionStep();
    return true;
  }

  // Player folds/passes on auction
  foldAuction(playerId) {
    if (!this.auctionState) return;
    const player = this.players.find(p => p.id === playerId);

    this.auctionState.activeParticipants = this.auctionState.activeParticipants.filter(id => id !== playerId);
    this.emit("log", { text: `🏳️ ${player ? player.name : 'Pemain'} mundur dari lelang.` });
    this.emit("auctionFold", { playerId, auction: this.auctionState });

    this.processAuctionStep();
  }

  // Finalize auction
  finalizeAuction() {
    if (!this.auctionState) return;
    const { tile, highestBidderId, currentBid } = this.auctionState;

    if (highestBidderId !== null && currentBid > 0) {
      const winner = this.players.find(p => p.id === highestBidderId);
      winner.money -= currentBid;
      this.propertyOwners[tile.id] = winner.id;
      this.emit("log", { text: `🎉 LELANG SELESAI! ${winner.name} memenangkan ${tile.name} dengan harga $${currentBid}!` });
      this.emit("propertyBought", { player: winner, tile });
      this.emit("playerUpdated", winner);
    } else {
      this.emit("log", { text: `❌ Lelang berakhir tanpa pemenang. ${tile.name} tetap menjadi milik Bank.` });
    }

    this.auctionState = null;
    this.emit("auctionEnded");
    this.endTurnActionCheck();
  }

  // Send player to jail
  sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.doublesCount = 0;
    this.extraTurn = false;
    this.emit("playerJailed", player);
  }

  // Draw Chance Card
  drawChanceCard(player) {
    const card = this.chanceDeck[this.chanceIndex % this.chanceDeck.length];
    this.chanceIndex++;
    this.emit("cardDrawn", { type: "chance", card, player });
    this.emit("log", { text: `🎴 [KARTU KESEMPATAN] ${player.name} menarik: "${card.title}" - ${card.desc}` });

    this.executeCardAction(player, card, "chance");
  }

  // Draw Community Chest Card
  drawCommunityChestCard(player) {
    const card = this.commDeck[this.commIndex % this.commDeck.length];
    this.commIndex++;
    this.emit("cardDrawn", { type: "chest", card, player });
    this.emit("log", { text: `📦 [DANA UMUM] ${player.name} menarik: "${card.title}" - ${card.desc}` });

    this.executeCardAction(player, card, "chest");
  }

  // Execute card actions
  executeCardAction(player, card, deckType) {
    switch (card.action) {
      case "move_to":
        setTimeout(() => this.teleportToTile(card.target, card.collectPassGo), 1200);
        break;

      case "move_steps":
        setTimeout(() => this.movePlayer(card.steps), 1200);
        break;

      case "nearest_railroad": {
        const rrTiles = [5, 15, 25, 35];
        let nextRR = rrTiles.find(t => t > player.position);
        if (!nextRR) nextRR = 5;
        setTimeout(() => {
          this.teleportToTile(nextRR, true);
        }, 1200);
        break;
      }

      case "nearest_utility": {
        const utilTiles = [12, 28];
        let nextUtil = utilTiles.find(t => t > player.position);
        if (!nextUtil) nextUtil = 12;
        setTimeout(() => {
          this.teleportToTile(nextUtil, true);
        }, 1200);
        break;
      }

      case "earn_bank":
        player.money += card.amount;
        this.emit("playerUpdated", player);
        this.endTurnActionCheck();
        break;

      case "pay_bank":
        this.chargeDebt(player, card.amount, null, () => {
          if (this.freeParkingJackpot) this.jackpotPool += card.amount;
          this.endTurnActionCheck();
        });
        break;

      case "jail_free":
        player.jailCards++;
        this.emit("playerUpdated", player);
        this.endTurnActionCheck();
        break;

      case "go_to_jail":
        this.sendToJail(player);
        this.phase = "ROLLED";
        this.emit("stateChanged", { phase: this.phase });
        break;

      case "repairs": {
        let totalHouses = 0;
        let totalHotels = 0;
        for (const tId of this.getPlayerProperties(player.id)) {
          const h = this.houses[tId] || 0;
          if (h === 5) totalHotels++;
          else totalHouses += h;
        }
        const repairCost = (totalHouses * card.perHouse) + (totalHotels * card.perHotel);
        this.emit("log", { text: `🛠️ Biaya perbaikan properti (${totalHouses} rumah, ${totalHotels} hotel): $${repairCost}` });
        this.chargeDebt(player, repairCost, null, () => {
          if (this.freeParkingJackpot) this.jackpotPool += repairCost;
          this.endTurnActionCheck();
        });
        break;
      }

      case "collect_from_all": {
        const activeOpps = this.getActivePlayers().filter(p => p.id !== player.id);
        let collected = 0;
        activeOpps.forEach(opp => {
          const pay = Math.min(opp.money, card.amount);
          opp.money -= pay;
          collected += pay;
          this.emit("playerUpdated", opp);
        });
        player.money += collected;
        this.emit("playerUpdated", player);
        this.emit("log", { text: `🎁 ${player.name} mengumpulkan total $${collected} dari para pemain.` });
        this.endTurnActionCheck();
        break;
      }

      case "pay_all_players": {
        const activeOpps = this.getActivePlayers().filter(p => p.id !== player.id);
        const totalNeeded = card.amount * activeOpps.length;
        this.chargeDebt(player, totalNeeded, null, () => {
          activeOpps.forEach(opp => {
            opp.money += card.amount;
            this.emit("playerUpdated", opp);
          });
          this.endTurnActionCheck();
        });
        break;
      }

      default:
        this.endTurnActionCheck();
        break;
    }
  }

  // House & Hotel Construction
  buildHouse(tileId) {
    const player = this.getCurrentPlayer();
    const tile = this.board[tileId];

    if (!tile || tile.type !== "property" || this.propertyOwners[tileId] !== player.id) {
      return { success: false, msg: "Anda tidak memiliki properti ini." };
    }

    if (!this.isMonopolyComplete(tile.group)) {
      return { success: false, msg: "Wajib memiliki seluruh komplek warna untuk membangun rumah!" };
    }

    // Check if any property in group is mortgaged
    for (const tId of this.colorGroups[tile.group].tiles) {
      if (this.isMortgaged(tId)) {
        return { success: false, msg: "Tidak dapat membangun rumah jika ada properti di komplek ini yang dihipotekkan!" };
      }
    }

    const currentHouses = this.houses[tileId] || 0;
    if (currentHouses >= 5) {
      return { success: false, msg: "Properti ini telah memiliki Hotel maksimal!" };
    }

    // Even Building Rule: cannot build on tile if it has more houses than another property in the group
    for (const tId of this.colorGroups[tile.group].tiles) {
      const otherHouses = this.houses[tId] || 0;
      if (currentHouses > otherHouses) {
        return { success: false, msg: "Aturan Pembangunan Merata: Bangun rumah di properti lain dalam komplek terlebih dahulu!" };
      }
    }

    const cost = tile.houseCost;
    if (player.money < cost) {
      return { success: false, msg: `Saldo tunai tidak mencukupi ($${cost} diperlukan).` };
    }

    player.money -= cost;
    this.houses[tileId] = currentHouses + 1;

    const isHotel = this.houses[tileId] === 5;
    this.emit("houseBuilt", { player, tile, count: this.houses[tileId], isHotel });
    this.emit("log", {
      text: isHotel
        ? `🏨 ${player.name} mengonversi 4 rumah menjadi 1 HOTEL di ${tile.name} seharga $${cost}!`
        : `🏡 ${player.name} membangun rumah ke-${this.houses[tileId]} di ${tile.name} seharga $${cost}.`
    });
    this.emit("playerUpdated", player);

    return { success: true };
  }

  // Sell House (50% refund, even selling rule)
  sellHouse(tileId) {
    const player = this.getCurrentPlayer();
    const tile = this.board[tileId];

    if (!tile || this.propertyOwners[tileId] !== player.id) {
      return { success: false, msg: "Bukan properti Anda." };
    }

    const currentHouses = this.houses[tileId] || 0;
    if (currentHouses <= 0) {
      return { success: false, msg: "Tidak ada bangunan di properti ini." };
    }

    // Even Selling Rule: cannot sell from a property if another in the group has more
    for (const tId of this.colorGroups[tile.group].tiles) {
      const otherHouses = this.houses[tId] || 0;
      if (otherHouses > currentHouses) {
        return { success: false, msg: "Aturan Penjualan Merata: Jual rumah dari properti yang memiliki bangunan lebih banyak terlebih dahulu!" };
      }
    }

    const refund = Math.floor(tile.houseCost / 2);
    this.houses[tileId] = currentHouses - 1;
    player.money += refund;

    this.emit("houseSold", { player, tile, count: this.houses[tileId], refund });
    this.emit("log", { text: `🔨 ${player.name} menjual 1 bangunan di ${tile.name} dan menerima $${refund} dari Bank.` });
    this.emit("playerUpdated", player);

    return { success: true, refund };
  }

  // Mortgage property (receive 50% price)
  mortgageProperty(tileId) {
    const player = this.getCurrentPlayer();
    const tile = this.board[tileId];

    if (!tile || this.propertyOwners[tileId] !== player.id) {
      return { success: false, msg: "Bukan properti Anda." };
    }

    if (this.isMortgaged(tileId)) {
      return { success: false, msg: "Properti ini sudah dalam kondisi hipotek." };
    }

    if (this.hasHousesInGroup(tileId)) {
      return { success: false, msg: "Wajib menjual seluruh rumah pada satu komplek warna sebelum menggadaikan properti!" };
    }

    this.mortgages[tileId] = true;
    player.money += tile.mortgage;

    this.emit("propertyMortgaged", { player, tile, amount: tile.mortgage });
    this.emit("log", { text: `📜 ${player.name} MENGGADAIKAN (Hipotek) ${tile.name} dan menerima $${tile.mortgage} dari Bank.` });
    this.emit("playerUpdated", player);

    return { success: true, amount: tile.mortgage };
  }

  // Unmortgage property (pay 50% + 10% interest = 55% of price)
  unmortgageProperty(tileId) {
    const player = this.getCurrentPlayer();
    const tile = this.board[tileId];

    if (!tile || this.propertyOwners[tileId] !== player.id) {
      return { success: false, msg: "Bukan properti Anda." };
    }

    if (!this.isMortgaged(tileId)) {
      return { success: false, msg: "Properti ini tidak sedang dihipotekkan." };
    }

    const cost = Math.floor(tile.mortgage * 1.1);
    if (player.money < cost) {
      return { success: false, msg: `Saldo tunai tidak cukup untuk menebus ($${cost} diperlukan).` };
    }

    player.money -= cost;
    this.mortgages[tileId] = false;

    this.emit("propertyUnmortgaged", { player, tile, cost });
    this.emit("log", { text: `✨ ${player.name} MENEBUS hipotek ${tile.name} seharga $${cost} (pokok + 10% bunga).` });
    this.emit("playerUpdated", player);

    return { success: true, cost };
  }

  // Charge Debt / Payment handling with Bankruptcy Protection
  chargeDebt(debtor, amount, creditor, onComplete) {
    if (debtor.money >= amount) {
      debtor.money -= amount;
      if (creditor) {
        creditor.money += amount;
        this.emit("playerUpdated", creditor);
      }
      this.emit("playerUpdated", debtor);
      onComplete();
      return;
    }

    // Check if debtor can raise enough cash by selling houses + mortgaging
    const maxRaisable = this.calculateMaxRaisable(debtor.id);
    if (debtor.money + maxRaisable < amount) {
      // Complete Bankruptcy!
      this.declareBankruptcy(debtor, creditor, amount);
      return;
    }

    // Debt emergency phase
    this.phase = "DEBT";
    this.pendingDebt = { debtor, amount, creditor, onComplete };
    this.emit("debtEmergency", { debtor, amount, creditor, short: amount - debtor.money });

    // If debtor is AI, auto-liquidate
    if (debtor.type === "ai") {
      setTimeout(() => {
        const actions = this.aiEngine.liquidateToCoverDebt(debtor, amount, this);
        actions.forEach(act => {
          if (act.type === "sell_house") this.sellHouse(act.tileId);
          if (act.type === "mortgage") this.mortgageProperty(act.tileId);
        });

        if (debtor.money >= amount) {
          debtor.money -= amount;
          if (creditor) creditor.money += amount;
          this.emit("playerUpdated", debtor);
          if (creditor) this.emit("playerUpdated", creditor);
          this.phase = "ROLLED";
          this.pendingDebt = null;
          onComplete();
        } else {
          this.declareBankruptcy(debtor, creditor, amount);
        }
      }, 1000);
    }
  }

  // Calculate maximum cash a player can raise
  calculateMaxRaisable(playerId) {
    let raisable = 0;
    for (const tId of this.getPlayerProperties(playerId)) {
      const tile = this.board[tId];
      const hCount = this.houses[tId] || 0;
      if (hCount > 0 && tile.houseCost) {
        raisable += hCount * Math.floor(tile.houseCost / 2);
      }
      if (!this.isMortgaged(tId)) {
        raisable += tile.mortgage;
      }
    }
    return raisable;
  }

  // Declare Bankruptcy
  declareBankruptcy(debtor, creditor, debtAmount) {
    debtor.bankrupt = true;
    debtor.bankruptTo = creditor ? creditor.id : "bank";

    this.emit("log", {
      text: creditor
        ? `☠️ KEBANGKRUTAN! ${debtor.name} tidak mampu membayar utang $${debtAmount} kepada ${creditor.name} dan DINYATAKAN BANGKRUT!`
        : `☠️ KEBANGKRUTAN! ${debtor.name} bangkrut ke Bank!`
    });

    const debtorProps = this.getPlayerProperties(debtor.id);

    if (creditor) {
      // Transfer all remaining cash, cards, and properties to creditor
      creditor.money += Math.max(0, debtor.money);
      debtor.money = 0;
      creditor.jailCards += debtor.jailCards;
      debtor.jailCards = 0;

      debtorProps.forEach(tId => {
        this.propertyOwners[tId] = creditor.id;
        // Buildings were already liquidated or are removed
        this.houses[tId] = 0;
      });

      this.emit("log", { text: `📜 Seluruh aset ${debtor.name} diserahkan sepenuhnya kepada ${creditor.name}.` });
      this.emit("playerUpdated", creditor);
    } else {
      // Bankrupt to Bank: properties become unowned & mortgaged status cleared
      debtorProps.forEach(tId => {
        delete this.propertyOwners[tId];
        delete this.mortgages[tId];
        delete this.houses[tId];
      });
      this.emit("log", { text: `🏦 Seluruh properti ${debtor.name} disita oleh Bank dan kembali dibuka untuk dibeli/dilelang.` });
    }

    this.emit("playerBankrupt", { debtor, creditor });
    this.emit("playerUpdated", debtor);

    // Check Win Condition
    const survivors = this.getActivePlayers();
    if (survivors.length <= 1) {
      this.declareVictory(survivors[0]);
    } else {
      this.endTurn();
    }
  }

  // Check victory
  declareVictory(winner) {
    this.phase = "GAME_OVER";
    this.emit("log", { text: `👑 PERMAINAN SELESAI! Selamat kepada ${winner.name} sebagai MONOPOLIS TERAKHIR (PEMENANG)!` });
    this.emit("gameOver", { winner });
  }

  // Propose Trade
  proposeTrade(initiatorId, recipientId, proposal) {
    // proposal = { offerMoney, offerProps: [], offerCards, requestMoney, requestProps: [], requestCards }
    const initiator = this.players.find(p => p.id === initiatorId);
    const recipient = this.players.find(p => p.id === recipientId);

    if (!initiator || !recipient || initiator.bankrupt || recipient.bankrupt) {
      return { success: false, msg: "Pemain tidak valid." };
    }

    this.tradeState = { initiatorId, recipientId, proposal };
    this.emit("tradeProposed", { initiator, recipient, proposal });
    this.emit("log", { text: `🤝 ${initiator.name} menawarkan pertukaran aset kepada ${recipient.name}.` });

    // If recipient is AI, auto-evaluate
    if (recipient.type === "ai") {
      setTimeout(() => {
        const accept = this.aiEngine.evaluateTrade(recipient, proposal, this);
        if (accept) {
          this.acceptTrade();
        } else {
          this.rejectTrade();
        }
      }, 1000);
    }

    return { success: true };
  }

  // Accept Trade
  acceptTrade() {
    if (!this.tradeState) return;
    const { initiatorId, recipientId, proposal } = this.tradeState;
    const p1 = this.players.find(p => p.id === initiatorId);
    const p2 = this.players.find(p => p.id === recipientId);

    // Swap money
    p1.money = p1.money - proposal.offerMoney + proposal.requestMoney;
    p2.money = p2.money + proposal.offerMoney - proposal.requestMoney;

    // Swap cards
    p1.jailCards = p1.jailCards - proposal.offerCards + proposal.requestCards;
    p2.jailCards = p2.jailCards + proposal.offerCards - proposal.requestCards;

    // Swap properties
    proposal.offerProps.forEach(tId => {
      this.propertyOwners[tId] = p2.id;
    });
    proposal.requestProps.forEach(tId => {
      this.propertyOwners[tId] = p1.id;
    });

    this.emit("log", { text: `🤝 KESEPAKATAN DITERIMA! Transaksi pertukaran antara ${p1.name} dan ${p2.name} berhasil terlaksana.` });
    this.emit("tradeCompleted", { p1, p2, proposal });
    this.emit("playerUpdated", p1);
    this.emit("playerUpdated", p2);

    this.tradeState = null;
  }

  // Reject Trade
  rejectTrade() {
    if (!this.tradeState) return;
    const p2 = this.players.find(p => p.id === this.tradeState.recipientId);
    this.emit("log", { text: `❌ Penawaran pertukaran ditolak oleh ${p2 ? p2.name : 'pemain'}.` });
    this.emit("tradeRejected", this.tradeState);
    this.tradeState = null;
  }

  // Check if player has rolled and can finish turn
  endTurnActionCheck() {
    this.phase = "ROLLED";
    this.emit("stateChanged", { phase: this.phase, extraTurn: this.extraTurn });

    const player = this.getCurrentPlayer();
    // If AI's turn, auto build and proceed
    if (player.type === "ai" && !player.bankrupt) {
      setTimeout(() => {
        // AI checks if it can build any houses
        const bestHouse = this.aiEngine.findBestHouseToBuild(player, this);
        if (bestHouse !== null) {
          this.buildHouse(bestHouse);
        }

        setTimeout(() => {
          this.endTurn();
        }, 1000);
      }, 800);
    }
  }

  // End Turn
  endTurn() {
    if (this.phase === "GAME_OVER") return;

    const currentPlayer = this.getCurrentPlayer();

    // If extra turn due to doubles
    if (this.extraTurn && !currentPlayer.bankrupt && !currentPlayer.inJail) {
      this.phase = "READY_TO_ROLL";
      this.extraTurn = false;
      this.emit("log", { text: `✨ Giliran Ekstra untuk ${currentPlayer.name} karena melempar angka kembar (Doubles)!` });
      this.emit("stateChanged", { phase: this.phase, currentTurn: currentPlayer });

      if (currentPlayer.type === "ai") {
        setTimeout(() => this.rollDice(), 1000);
      }
      return;
    }

    // Advance to next active player
    this.doublesCount = 0;
    this.extraTurn = false;
    let nextIdx = (this.turnIndex + 1) % this.players.length;
    let tries = 0;
    while (this.players[nextIdx].bankrupt && tries < this.players.length) {
      nextIdx = (nextIdx + 1) % this.players.length;
      tries++;
    }

    this.turnIndex = nextIdx;
    this.phase = "READY_TO_ROLL";
    const nextPlayer = this.getCurrentPlayer();

    this.emit("turnChanged", { player: nextPlayer });
    this.emit("log", { text: `➡️ Sekarang giliran ${nextPlayer.name}.` });

    // If next player is AI, trigger AI turn actions
    if (nextPlayer.type === "ai") {
      setTimeout(() => {
        this.processAiTurn(nextPlayer);
      }, 1200);
    }
  }

  // Automated AI Turn handler
  processAiTurn(aiPlayer) {
    if (aiPlayer.bankrupt || this.phase !== "READY_TO_ROLL") return;

    if (aiPlayer.inJail) {
      const jailAction = this.aiEngine.decideJailAction(aiPlayer, this);
      if (jailAction === "card") {
        this.useJailCard();
      } else if (jailAction === "pay") {
        this.payJailFine();
      }
    }

    setTimeout(() => {
      this.rollDice();
    }, 600);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MonopolyEngine };
}
