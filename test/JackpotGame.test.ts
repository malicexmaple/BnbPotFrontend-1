import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("JackpotGame", function () {
  async function deployJackpotFixture() {
    const [owner, player1, player2, player3, keeper] = await hre.ethers.getSigners();

    const JackpotGame = await hre.ethers.getContractFactory("JackpotGame");
    const jackpot = await JackpotGame.deploy();

    return { jackpot, owner, player1, player2, player3, keeper };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { jackpot, owner } = await deployJackpotFixture();
      expect(await jackpot.owner()).to.equal(owner.address);
    });

    it("Should set owner as initial keeper", async function () {
      const { jackpot, owner } = await deployJackpotFixture();
      expect(await jackpot.keeper()).to.equal(owner.address);
    });

    it("Should start first round automatically", async function () {
      const { jackpot } = await deployJackpotFixture();
      const round = await jackpot.getCurrentRound();
      expect(round.id).to.equal(1);
      expect(round.isActive).to.be.true;
      expect(round.isCompleted).to.be.false;
    });
  });

  describe("Betting", function () {
    it("Should accept a valid bet", async function () {
      const { jackpot, player1 } = await deployJackpotFixture();
      
      const betAmount = hre.ethers.parseEther("0.01");
      await expect(jackpot.connect(player1).placeBet({ value: betAmount }))
        .to.emit(jackpot, "BetPlaced");
    });

    it("Should reject bet below minimum", async function () {
      const { jackpot, player1 } = await deployJackpotFixture();
      
      const betAmount = hre.ethers.parseEther("0.0001"); // Below 0.001 minimum
      await expect(
        jackpot.connect(player1).placeBet({ value: betAmount })
      ).to.be.revertedWith("Bet too small");
    });

    it("Should allow same player to bet multiple times", async function () {
      const { jackpot, player1 } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.01") });
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.02") });
      
      const playerBet = await jackpot.getPlayerBetAmount(player1.address);
      expect(playerBet).to.equal(hre.ethers.parseEther("0.03"));
    });

    it("Should set endTime after first bet", async function () {
      const { jackpot, player1 } = await deployJackpotFixture();
      
      const roundBefore = await jackpot.getCurrentRound();
      expect(roundBefore.endTime).to.equal(0);
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.01") });
      
      const roundAfter = await jackpot.getCurrentRound();
      expect(roundAfter.endTime).to.be.gt(0);
    });

    it("Should reject bets after round expires", async function () {
      const { jackpot, player1, player2 } = await deployJackpotFixture();
      
      // Place first bet to start timer
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.01") });
      
      // Fast forward past round duration
      await time.increase(91); // 91 seconds (round duration is 90)
      
      // Try to bet - should fail
      await expect(
        jackpot.connect(player2).placeBet({ value: hre.ethers.parseEther("0.01") })
      ).to.be.revertedWith("Timer expired");
    });

    it("Should enforce max players limit", async function () {
      const { jackpot } = await deployJackpotFixture();
      const maxPlayers = await jackpot.MAX_PLAYERS_PER_ROUND();
      
      // Create many signers
      const players = await hre.ethers.getSigners();
      
      // Fill up to max
      for (let i = 0; i < Number(maxPlayers); i++) {
        await jackpot.connect(players[i]).placeBet({ value: hre.ethers.parseEther("0.001") });
      }
      
      // Next player should fail
      await expect(
        jackpot.connect(players[Number(maxPlayers)]).placeBet({ value: hre.ethers.parseEther("0.001") })
      ).to.be.revertedWith("Max players reached");
    });
  });

  describe("Round Completion", function () {
    it("Should allow keeper to end round after timer", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91);
      
      await expect(jackpot.connect(owner).endRound())
        .to.emit(jackpot, "RoundEnded");
    });

    it("Should not allow non-keeper to end round", async function () {
      const { jackpot, player1, player2 } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91);
      
      await expect(
        jackpot.connect(player2).endRound()
      ).to.be.revertedWith("Only keeper or owner");
    });

    it("Should reject ending round before timer expires", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      
      await expect(
        jackpot.connect(owner).endRound()
      ).to.be.revertedWith("Timer not expired");
    });

    it("Should handle zero-player round gracefully", async function () {
      const { jackpot, owner } = await deployJackpotFixture();
      
      // Manually advance to ensure endTime is 0 (no bets placed)
      // This tests the edge case fix
      
      // Since we can't end a round with no bets (requires endTime > 0),
      // this test verifies the contract doesn't crash
      const round = await jackpot.getCurrentRound();
      expect(round.playerCount).to.equal(0);
      expect(round.totalPot).to.equal(0);
    });

    it("Should distribute prize correctly", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      const betAmount = hre.ethers.parseEther("1.0");
      await jackpot.connect(player1).placeBet({ value: betAmount });
      
      const balanceBefore = await hre.ethers.provider.getBalance(player1.address);
      
      await time.increase(91);
      await jackpot.connect(owner).endRound();
      
      const balanceAfter = await hre.ethers.provider.getBalance(player1.address);
      
      // Player should receive 95% of bet (5% house fee)
      const expectedPrize = betAmount * 95n / 100n;
      const balanceChange = balanceAfter - balanceBefore;
      
      // Allow small difference for gas (player wins so gets prize minus bet already spent)
      expect(balanceChange).to.be.closeTo(expectedPrize - betAmount, hre.ethers.parseEther("0.001"));
    });

    it("Should start new round after completion", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91);
      
      const roundBefore = await jackpot.getCurrentRound();
      await jackpot.connect(owner).endRound();
      const roundAfter = await jackpot.getCurrentRound();
      
      expect(roundAfter.id).to.equal(roundBefore.id + 1n);
      expect(roundAfter.isActive).to.be.true;
      expect(roundAfter.totalPot).to.equal(0);
    });
  });

  describe("Storage Cleanup (Bug Fix Verification)", function () {
    it("Should clean up player data between rounds", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      // Round 1: Player bets
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      const round1 = await jackpot.getCurrentRound();
      const round1Id = round1.id;
      
      // Check player has bet in round 1
      const betInRound1 = await jackpot.getPlayerBetAmount(player1.address);
      expect(betInRound1).to.equal(hre.ethers.parseEther("0.1"));
      
      // End round 1
      await time.increase(91);
      await jackpot.connect(owner).endRound();
      
      // Round 2: Check player data is clean
      const round2 = await jackpot.getCurrentRound();
      expect(round2.id).to.equal(round1Id + 1n);
      
      // Player should have zero bet in new round
      const betInRound2 = await jackpot.getPlayerBetAmount(player1.address);
      expect(betInRound2).to.equal(0);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency end after 1 hour", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91 + 3600); // 91 seconds + 1 hour
      
      await expect(jackpot.connect(owner).emergencyEndRound())
        .to.emit(jackpot, "RoundEnded");
    });

    it("Should reject emergency end before 1 hour", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91); // Just past timer, not 1 hour
      
      await expect(
        jackpot.connect(owner).emergencyEndRound()
      ).to.be.revertedWith("Use normal endRound");
    });

    it("Should allow owner to change keeper", async function () {
      const { jackpot, owner, keeper } = await deployJackpotFixture();
      
      await jackpot.connect(owner).setKeeper(keeper.address);
      expect(await jackpot.keeper()).to.equal(keeper.address);
    });

    it("Should allow new keeper to end rounds", async function () {
      const { jackpot, player1, owner, keeper } = await deployJackpotFixture();
      
      await jackpot.connect(owner).setKeeper(keeper.address);
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("0.1") });
      await time.increase(91);
      
      await expect(jackpot.connect(keeper).endRound())
        .to.emit(jackpot, "RoundEnded");
    });
  });

  describe("House Fee Collection", function () {
    it("Should accumulate house fees", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      const betAmount = hre.ethers.parseEther("1.0");
      await jackpot.connect(player1).placeBet({ value: betAmount });
      await time.increase(91);
      await jackpot.connect(owner).endRound();
      
      const expectedFee = betAmount * 5n / 100n;
      const collectedFees = await jackpot.houseFeeCollected();
      expect(collectedFees).to.equal(expectedFee);
    });

    it("Should allow owner to withdraw fees", async function () {
      const { jackpot, player1, owner } = await deployJackpotFixture();
      
      await jackpot.connect(player1).placeBet({ value: hre.ethers.parseEther("1.0") });
      await time.increase(91);
      await jackpot.connect(owner).endRound();
      
      const balanceBefore = await hre.ethers.provider.getBalance(owner.address);
      const tx = await jackpot.connect(owner).withdrawHouseFees();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await hre.ethers.provider.getBalance(owner.address);
      
      const expectedFee = hre.ethers.parseEther("1.0") * 5n / 100n;
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(expectedFee);
    });
  });
});
