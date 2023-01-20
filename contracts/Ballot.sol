// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Ballot is Ownable {
    /**
     * The election title.
     */
    string electionTitle;

    /**
     * The voters details.
     */
    struct Voter {
        bool voted;
        address delegate;
    }

    /**
     * The proposal/aspirants.
     */
    struct Proposal {
        string name;
        string image;
        uint voteCount;
    }

    /**
     * Event emitted on voter registration.
     */
    event RegisterVoter(Voter voter);

    /**
     * Event emitted on proposal/aspirant registration.
     */
    event RegisterProposal(Proposal[]);

    /**
     * Event emitted on vote casting.
     */
    event VoteCasting(Proposal[]);

    /**
     * The list of voters and their public addresses.
     */
    mapping(string => Voter) public voters;

    /**
     * The list of proposals/aspirants.
     */
    Proposal[] public proposals;

    uint private castVotes = 0;

    /**
     * The smart contracts constructor.
     * @param _electionTitle the name/title of the election.
     */
    constructor(string memory _electionTitle) {
        electionTitle = _electionTitle;
    }

    /**
     * Get the title of the election.
     */
    function getElectionTitle() external view returns (string memory) {
        return electionTitle;
    }

    /**
     * Registers a student public adddress against their school ID.
     * @param _name the proposal/aspirants name.
     * @param _image the base 64 image representation of the proposal/aspirants.
     */
    function registerProposal(
        string calldata _name,
        string calldata _image
    ) external onlyOwner {
        proposals.push(Proposal({name: _name, image: _image, voteCount: 0}));
        emit RegisterProposal(proposals);
    }

    /**
     * Registers a student public adddress against their school ID.
     * @param _voterAddress the voters public address.
     * @param _schoolId the students ID in the school system.
     */
    function registerVoter(
        address _voterAddress,
        string calldata _schoolId
    ) external onlyOwner {
        Voter storage voter = voters[_schoolId];

        voter.delegate = _voterAddress;
        voter.voted = false;
        emit RegisterVoter(voter);
    }

    /**
     * Gets a voter with a certain school id.
     */
    function getVoter(
        string calldata _schoolID
    ) external view returns (Voter memory) {
        return voters[_schoolID];
    }

    /**
     * Cast a vote.
     * @param _schoolID the students school ID.
     * @param proposal the proposal favoured by the student.
     */
    function vote(
        string calldata _schoolID,
        uint proposal
    ) external mustHaveNotVoted(_schoolID) {
        Voter storage voter = voters[_schoolID];

        require(
            voter.delegate == msg.sender,
            "Your school ID does not match the registered public address."
        );
        require(!voter.voted, "Voter has already voted");
        voter.voted = true;
        proposals[proposal].voteCount += 1;
        castVotes += 1;
        emit VoteCasting(proposals);
    }

    /**
     * Get the winning proposal index.
     */
    function getWinningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /**
     * Get the winning proposal.
     */
    function getWinnerName() external view returns (string memory winnerName_) {
        winnerName_ = proposals[getWinningProposal()].name;
    }

    /**
     * Query the results of the voting process.
     */
    function getResults() external view returns (Proposal[] memory, uint) {
        return (proposals, castVotes);
    }

    /**
     * Functions with this modifiers should can only be excecuted
     *  by users who have not voted.
     */
    modifier mustHaveNotVoted(string calldata _studentID) {
        Voter storage voter = voters[_studentID];
        require(!voter.voted, "You have already voted.");
        _;
    }
}
