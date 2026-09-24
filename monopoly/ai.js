/**
 * Digital Monopoly Board Game - AI Strategy Engine
 * Intelligent bot decision making for:
 * - Property Acquisition & Valuation
 * - Dynamic Transparent Auction Bidding
 * - Optimal House & Hotel Development
 * - Jail Exit Strategy (Early vs Late game)
 * - Emergency Debt Liquidation (House sales & Mortgages)
 * - Bilateral Trade Evaluation & Generation
 */

class MonopolyAI {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty; // 'easy', 'normal', 'master'
  }

  // Evaluate whether to buy an unowned property when landing on it
  shouldBuyProperty(player, tile, engine) {
    if (player.money < tile.price) return false;

    const remainingCash = player.money - tile.price;
    const safetyBuffer = this.difficulty === "easy" ? 50 : (this.difficulty === "master" ? 180 : 120);

    // If it completes a color group monopoly for this AI, always buy if we have the cash!
    if (this.willCompleteMonopoly(player, tile, engine)) {
      return true;
    }

    // If it blocks an opponent from completing a monopoly, prioritize buying!
    if (this.willBlockOpponentMonopoly(player, tile, engine)) {
      return remainingCash >= 40;
    }

    // Railroads & Utilities are great early game earners
    if (tile.type === "railroad" || tile.type === "utility") {
      return remainingCash >= safetyBuffer;
    }

    // Standard properties
    return remainingCash >= safetyBuffer;
  }

  // Calculate maximum bid AI is willing to place on a property in an auction
  getMaxAuctionBid(player, tile, engine) {
    let baseVal = tile.price;

    if (this.willCompleteMonopoly(player, tile, engine)) {
      baseVal = Math.floor(tile.price * (this.difficulty === "master" ? 1.6 : 1.35));
    } else if (this.willBlockOpponentMonopoly(player, tile, engine)) {
      baseVal = Math.floor(tile.price * (this.difficulty === "master" ? 1.3 : 1.15));
    } else {
      baseVal = Math.floor(tile.price * 0.9);
    }

    // Cannot bid more than available cash minus tiny cushion
    const cushion = this.difficulty === "easy" ? 20 : 60;
    const maxAffordable = Math.max(0, player.money - cushion);
    return Math.min(baseVal, maxAffordable);
  }

  // Decide next bid in active auction
  decideAuctionBid(player, tile, currentBid, minIncrement, engine) {
    const maxBid = this.getMaxAuctionBid(player, tile, engine);
    const targetBid = currentBid + minIncrement;

    if (targetBid <= maxBid && targetBid <= player.money) {
      return targetBid;
    }
    return null; // Fold / Pass
  }

  // Check if acquiring this tile completes a color group for player
  willCompleteMonopoly(player, tile, engine) {
    if (!tile.group || tile.group === "special" || tile.group === "railroad" || tile.group === "utility") {
      return false;
    }
    const groupDef = COLOR_GROUPS[tile.group];
    if (!groupDef) return false;

    // Check if player owns all other tiles in group
    for (const tId of groupDef.tiles) {
      if (tId === tile.id) continue;
      const owner = engine.getPropertyOwner(tId);
      if (!owner || owner.id !== player.id) {
        return false;
      }
    }
    return true;
  }

  // Check if any active opponent is 1 tile away from monopoly on this group
  willBlockOpponentMonopoly(player, tile, engine) {
    if (!tile.group || tile.group === "special") return false;
    const groupDef = COLOR_GROUPS[tile.group];
    if (!groupDef) return false;

    for (const opp of engine.players) {
      if (opp.id === player.id || opp.bankrupt) continue;
      let oppOwns = 0;
      for (const tId of groupDef.tiles) {
        const owner = engine.getPropertyOwner(tId);
        if (owner && owner.id === opp.id) oppOwns++;
      }
      if (oppOwns === groupDef.tiles.length - 1) {
        return true;
      }
    }
    return false;
  }

  // Decide how to handle Jail turn
  decideJailAction(player, engine) {
    const unownedCount = engine.board.filter(t => t.price && !engine.propertyOwners[t.id]).length;
    const isEarlyGame = unownedCount > 8;

    // If has get out of jail free card
    if (player.jailCards > 0) {
      if (isEarlyGame || player.money > 500) {
        return "card";
      }
    }

    // In early game, mobility is crucial to buy properties
    if (isEarlyGame && player.money >= 150) {
      return "pay";
    }

    // In late game with dangerous boards, staying in jail is safe
    if (!isEarlyGame && player.jailTurns < 3) {
      return "roll";
    }

    // Fallback: if cash is decent, pay fine
    if (player.money >= 100) {
      return "pay";
    }

    return "roll";
  }

  // Select properties to build houses on (returns tileId or null)
  findBestHouseToBuild(player, engine) {
    const buffer = this.difficulty === "master" ? 180 : 100;
    if (player.money < 150 + buffer) return null;

    const monopolies = engine.getPlayerMonopolies(player.id);
    if (!monopolies.length) return null;

    // Sort monopolies by rent potential (high cost groups first)
    monopolies.sort((a, b) => COLOR_GROUPS[b].houseCost - COLOR_GROUPS[a].houseCost);

    for (const grp of monopolies) {
      const gDef = COLOR_GROUPS[grp];
      if (player.money < gDef.houseCost + buffer) continue;

      // Find lowest house count in this group (even building rule)
      let minHouses = 5;
      let eligibleTiles = [];

      for (const tId of gDef.tiles) {
        const count = engine.houses[tId] || 0;
        if (count < minHouses) {
          minHouses = count;
        }
      }

      if (minHouses >= 5) continue; // Group is already fully developed with Hotels

      for (const tId of gDef.tiles) {
        const count = engine.houses[tId] || 0;
        if (count === minHouses) {
          eligibleTiles.push(tId);
        }
      }

      if (eligibleTiles.length > 0) {
        return eligibleTiles[0];
      }
    }

    return null;
  }

  // Handle debt emergency when player has insufficient cash
  liquidateToCoverDebt(player, debtAmount, engine) {
    let raised = 0;
    const actions = [];

    // 1. Sell houses starting from least profitable groups (50% refund)
    const monopolies = engine.getPlayerMonopolies(player.id);
    // Sort ascending by house cost
    monopolies.sort((a, b) => COLOR_GROUPS[a].houseCost - COLOR_GROUPS[b].houseCost);

    for (const grp of monopolies) {
      const gDef = COLOR_GROUPS[grp];
      while (player.money + raised < debtAmount) {
        // Find highest house count in group to follow even selling rule
        let maxHouses = 0;
        let candidateId = null;
        for (const tId of gDef.tiles) {
          const h = engine.houses[tId] || 0;
          if (h > maxHouses) {
            maxHouses = h;
            candidateId = tId;
          }
        }
        if (maxHouses === 0 || !candidateId) break;

        actions.push({ type: "sell_house", tileId: candidateId });
        raised += Math.floor(gDef.houseCost / 2);
      }
      if (player.money + raised >= debtAmount) break;
    }

    // 2. Mortgage properties if still short
    if (player.money + raised < debtAmount) {
      // Find properties with 0 houses across whole color group
      const owned = engine.getPlayerProperties(player.id);
      // Prioritize single utilities, then single railroads, then single streets
      owned.sort((a, b) => {
        const aTile = engine.board[a];
        const bTile = engine.board[b];
        return aTile.mortgage - bTile.mortgage;
      });

      for (const tId of owned) {
        if (engine.isMortgaged(tId)) continue;
        if (engine.hasHousesInGroup(tId)) continue;

        const tile = engine.board[tId];
        actions.push({ type: "mortgage", tileId: tId });
        raised += tile.mortgage;

        if (player.money + raised >= debtAmount) break;
      }
    }

    return actions;
  }

  // Evaluate bilateral trade proposal
  evaluateTrade(player, proposal, engine) {
    // proposal = { offerMoney, offerProps: [], offerCards, requestMoney, requestProps: [], requestCards }
    let myGain = proposal.offerMoney || 0;
    let myLoss = proposal.requestMoney || 0;

    // Value cards
    if (proposal.offerCards) myGain += proposal.offerCards * 50;
    if (proposal.requestCards) myLoss += proposal.requestCards * 50;

    // Value offered properties
    for (const tId of proposal.offerProps) {
      const tile = engine.board[tId];
      let val = tile.price;
      if (this.willCompleteMonopoly(player, tile, engine)) {
        val *= 2.0;
      }
      myGain += val;
    }

    // Value requested properties
    for (const tId of proposal.requestProps) {
      const tile = engine.board[tId];
      let val = tile.price;
      // If giving away a tile in a completed monopoly, value is huge!
      if (engine.isMonopolyComplete(tile.group)) {
        val *= 2.8;
      } else if (this.willCompleteMonopoly(player, tile, engine)) {
        val *= 2.0;
      }
      myLoss += val;
    }

    // Strictness based on AI difficulty
    const threshold = this.difficulty === "master" ? 1.15 : (this.difficulty === "normal" ? 0.95 : 0.8);
    return myGain >= myLoss * threshold;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MonopolyAI };
}
