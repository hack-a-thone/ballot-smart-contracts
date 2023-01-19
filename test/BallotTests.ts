import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Ballot", function () {
  async function deployOneYearLockFixture() {
    const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();

    const Ballot = await ethers.getContractFactory("Ballot");
    const ballot = await Ballot.deploy("Referendum");

    return { ballot, owner, voter1, voter2, voter3, voter4 };
  }

  describe("Deployment", function () {
    it("Should set election title", async function () {
      const { ballot, owner, voter1, voter2 } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await ballot.getElectionTitle()).to.equal("Referendum");
    });

    it("Should set the right owner", async function () {
      const { ballot, owner, voter1 } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await ballot.owner()).to.equal(owner.address);
    });
  });

  describe("Voter Registration", function () {
    it("Should register and update a voter with public address", async function () {
      const { ballot, owner, voter1, voter2 } = await loadFixture(
        deployOneYearLockFixture
      );

      const voterID = "SCII/00724/2017";

      await expect(ballot.connect(owner).registerVoter(voter1.address, voterID))
        .not.to.reverted;

      const x = await ballot.getVoter(voterID);
      expect(x.voted).to.false;
      expect(x.delegate).to.equal(voter1.address);

      await expect(ballot.connect(owner).registerVoter(voter2.address, voterID))
        .not.to.reverted;

      const y = await ballot.getVoter(voterID);
      expect(y.voted).to.false;
      expect(y.delegate).to.equal(voter2.address);
    });

    it("Should revert for voter registration using a non owner account", async () => {
      const { ballot, voter1 } = await loadFixture(deployOneYearLockFixture);

      const voterID = "SCII/00724/2017";

      await expect(
        ballot.connect(voter1).registerVoter(voter1.address, voterID)
      ).to.reverted;
    });
  });

  describe("Aspirant Registration", function () {
    it("Should register apirant", async function () {
      const { ballot, owner, voter1, voter2 } = await loadFixture(
        deployOneYearLockFixture
      );

      await expect(ballot.connect(owner).registerProposal("Solidity", "")).not
        .to.reverted;

      let x = await ballot.getResults();

      expect(x[0].length).to.equal(1);
      expect(x[0][0].name).to.equal("Solidity");
      expect(x[0][0].image).to.equal("");
      expect(x[0][0].voteCount).to.equal(0);

      await expect(ballot.connect(owner).registerProposal("Rust", "")).not.to
        .reverted;

      x = await ballot.getResults();
      expect(x[0].length).to.equal(2);
      expect(x[0][1].name).to.equal("Rust");
      expect(x[0][1].image).to.equal("");
      expect(x[0][1].voteCount).to.equal(0);

      await expect(ballot.connect(owner).registerProposal("Web2", "")).not.to
        .reverted;

      x = await ballot.getResults();
      expect(x[0].length).to.equal(3);
      expect(x[0][2].name).to.equal("Web2");
      expect(x[0][2].image).to.equal("");
      expect(x[0][2].voteCount).to.equal(0);
    });

    it("Should revert for aspirant/proposal registration using a non owner account", async () => {
      const { ballot, voter1 } = await loadFixture(deployOneYearLockFixture);

      await expect(ballot.connect(voter1).registerProposal("Solidity", "")).to
        .reverted;
    });
  });

  describe("Voting", function () {
    it("Cast votes and update the tally", async function () {
      const { ballot, owner, voter1, voter2, voter3 } = await loadFixture(
        deployOneYearLockFixture
      );

      const voterID1 = "SCII/00721/2017";
      const voterID2 = "SCII/00722/2017";
      const voterID3 = "SCII/00723/2017";

      // Register aspirants.

      await expect(ballot.connect(owner).registerProposal("Solidity", "")).not
        .to.reverted;

      await expect(ballot.connect(owner).registerProposal("Rust", "")).not.to
        .reverted;

      await expect(ballot.connect(owner).registerProposal("Web2", "")).not.to
        .reverted;

      let proposals = await ballot.getResults();

      // Register voters.
      await expect(
        ballot.connect(owner).registerVoter(voter1.address, voterID1)
      ).not.to.reverted;

      await expect(
        ballot.connect(owner).registerVoter(voter2.address, voterID2)
      ).not.to.reverted;

      await expect(
        ballot.connect(owner).registerVoter(voter3.address, voterID3)
      ).not.to.reverted;

      // Vote
      await expect(
        ballot.connect(voter1).vote(
          voterID1,
          proposals[0].findIndex((item) => item.name === "Solidity")
        )
      ).not.to.reverted;

      let y = await ballot.getVoter(voterID1);
      expect(y.voted).to.true;
      expect(y.delegate).to.equal(voter1.address);

      proposals = await ballot.getResults();
      expect(proposals[1]).to.equal(1);
      expect(proposals[0].length).to.equal(3);
      expect(proposals[0][0].name).to.equal("Solidity");
      expect(proposals[0][0].image).to.equal("");
      expect(proposals[0][0].voteCount).to.equal(1);

      // second vote
      await expect(
        ballot.connect(voter2).vote(
          voterID2,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).not.to.reverted;

      y = await ballot.getVoter(voterID2);
      expect(y.voted).to.true;
      expect(y.delegate).to.equal(voter2.address);

      proposals = await ballot.getResults();
      expect(proposals[1]).to.equal(2);
      expect(proposals[0].length).to.equal(3);
      expect(proposals[0][1].name).to.equal("Rust");
      expect(proposals[0][1].image).to.equal("");
      expect(proposals[0][1].voteCount).to.equal(1);

      // thired vote
      await expect(
        ballot.connect(voter3).vote(
          voterID3,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).not.to.reverted;

      y = await ballot.getVoter(voterID3);
      expect(y.voted).to.true;
      expect(y.delegate).to.equal(voter3.address);

      proposals = await ballot.getResults();
      expect(proposals[1]).to.equal(3);
      expect(proposals[0].length).to.equal(3);
      expect(proposals[0][1].name).to.equal("Rust");
      expect(proposals[0][1].image).to.equal("");
      expect(proposals[0][1].voteCount).to.equal(2);

      // check final tally.
      proposals = await ballot.getResults();
      expect(proposals[1]).to.equal(3);
      expect(proposals[0].length).to.equal(3);

      expect(proposals[0][0].name).to.equal("Solidity");
      expect(proposals[0][0].image).to.equal("");
      expect(proposals[0][0].voteCount).to.equal(1);

      expect(proposals[0][1].name).to.equal("Rust");
      expect(proposals[0][1].image).to.equal("");
      expect(proposals[0][1].voteCount).to.equal(2);

      expect(proposals[0][2].name).to.equal("Web2");
      expect(proposals[0][2].image).to.equal("");
      expect(proposals[0][2].voteCount).to.equal(0);

      expect(await ballot.getWinnerName()).to.equal("Rust");
    });

    it("Should revert for invalid id and public address do not match", async function () {
      const { ballot, owner, voter1, voter2, voter3 } = await loadFixture(
        deployOneYearLockFixture
      );

      const voterID1 = "SCII/00721/2017";
      const voterID2 = "SCII/00722/2017";
      const voterID3 = "SCII/00723/2017";

      // Register aspirants.
      await expect(ballot.connect(owner).registerProposal("Solidity", "")).not
        .to.reverted;

      await expect(ballot.connect(owner).registerProposal("Rust", "")).not.to
        .reverted;

      await expect(ballot.connect(owner).registerProposal("Web2", "")).not.to
        .reverted;

      let proposals = await ballot.getResults();

      // Register voters.
      await expect(
        ballot.connect(owner).registerVoter(voter1.address, voterID1)
      ).not.to.reverted;

      await expect(
        ballot.connect(owner).registerVoter(voter2.address, voterID2)
      ).not.to.reverted;

      // Valid combination
      await expect(
        ballot.connect(voter2).vote(
          voterID2,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).not.to.reverted;

      // Invalid combination.
      await expect(
        ballot.connect(voter1).vote(
          voterID2,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).to.reverted;

      // unregistered student id
      await expect(
        ballot.connect(voter1).vote(
          voterID3,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).to.reverted;

      // unregistered public address
      await expect(
        ballot.connect(voter3).vote(
          voterID1,
          proposals[0].findIndex((item) => item.name === "Rust")
        )
      ).to.reverted;

      // check final tally.
      proposals = await ballot.getResults();
      expect(proposals[1]).to.equal(1);
      expect(proposals[0].length).to.equal(3);

      expect(proposals[0][0].name).to.equal("Solidity");
      expect(proposals[0][0].image).to.equal("");
      expect(proposals[0][0].voteCount).to.equal(0);

      expect(proposals[0][1].name).to.equal("Rust");
      expect(proposals[0][1].image).to.equal("");
      expect(proposals[0][1].voteCount).to.equal(1);

      expect(proposals[0][2].name).to.equal("Web2");
      expect(proposals[0][2].image).to.equal("");
      expect(proposals[0][2].voteCount).to.equal(0);
    });
  });

  it("Should revert if voter already voted", async function () {
    const { ballot, owner, voter1, voter2, voter3 } = await loadFixture(
      deployOneYearLockFixture
    );

    const voterID1 = "SCII/00721/2017";

    // Register aspirant.
    await expect(ballot.connect(owner).registerProposal("Solidity", "")).not.to
      .reverted;

    // Register voter.
    await expect(ballot.connect(owner).registerVoter(voter1.address, voterID1))
      .not.to.reverted;

    // First vote.
    await expect(ballot.connect(voter1).vote(voterID1, 0)).not.to.reverted;

    // Second vote.
    await expect(ballot.connect(voter1).vote(voterID1, 0)).to.revertedWith(
      "You have already voted."
    );
  });
});
