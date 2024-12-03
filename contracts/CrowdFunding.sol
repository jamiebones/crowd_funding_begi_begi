// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./CrowdFundingFactory.sol";
import "hardhat/console.sol";

contract CrowdFundingContractForBegiBegi is Initializable {
	//error
	error CamPaignEndedErrorNoLongerAcceptingDonations();
	error InsufficientFunds();
	error YouAreNotTheOwnerOfTheCampaign();
	error YouHaveAPendingMileStone();
	error TheMaximumMilestoneHaveBeenCreated();
	error YouDidNotDonateToThisCampaign();
	error CantWithdrawFundsCampaignEnded(address _donorAddress);
	error WithdrawalFailed(uint256 amount);
	error CanNotVoteOnMileStone(address _address);
	error YouHaveVotedForThisMilestoneAlready(address _address);
	error MileStoneVotingHasElapsed();
	error MileStoneVotingPeriodHasNotElapsed();
	error MilestoneHasEnded();
	error MaximumNumberofWithdrawalExceeded();
	error CampaignStillRunning();
	error NewDurationSmallerThanPreviousDuration();

	//events
	event MilestoneCreated(
		address indexed owner,
		uint256 datecreated,
		uint256 period,
		string milestoneCID
	);
	event DonatedToProject(
		address indexed donor,
		uint256 amount,
		address indexed project,
		uint256 date
	);
	event VotedOnMileStone(
		address indexed voter,
		address indexed project,
		bool vote,
		uint256 date
	);
	event MileStoneRejected(
		address indexed project,
		string milestoneCID,
		uint256 date
	);
	event MileStoneApproval(
		address indexed project,
		string milestoneCID,
		uint256 date
	);
	event MilestoneWithdrawal(
		address indexed owner,
		uint256 amount,
		uint256 date
	);
	event CampaignEnded(address indexed project, uint256 data);
	event DonationRetrievedByDonor(
		address indexed project,
		address indexed donor,
		uint256 amountReceived,
		uint256 amountDonated,
		uint256 date
	);

	bool public campaignEnded;
	address payable private _campaignOwner;
	string private category;
	string private fundingDetailsId;
	uint256 private targetAmount;
	uint256 private campaignDuration;
	uint256 private _amountDonated;
	uint256 private _numberOfDonors;
	uint256 private _milestoneCounter;
	uint256 private _approvedMilestone;
	uint256 private _numberOfWithdrawal;
	uint256 private amountRecalledByDonor;
	uint256 constant _baseNumber = 10 ** 18;
	uint256 constant _taxOnWithdrawingDonation = 20; //20% tax on withdrawing your donation

	address private factoryContractAddress;

	//struct
	struct Donors {
		address donor;
		uint amount;
	}

	struct MilestoneVote {
		address donorAddress;
		bool vote;
	}

	struct Milestone {
		string milestoneCID;
		bool approved;
		uint256 votingPeriod;
		MilestoneStatus status;
		uint256 supportVote;
		uint256 againstVote;
		//address[] forAddress;
		mapping(address => bool) hasVoted;
	}

	modifier campaignOwner(address _address) {
		if (_address != _campaignOwner) {
			revert YouAreNotTheOwnerOfTheCampaign();
		}
		_;
	}

	//enum
	enum FundingCategory {
		Sports,
		General,
		Education
	}

	enum MilestoneStatus {
		Default,
		Pending,
		Approved,
		Declined
	}

	mapping(address => uint256) public donors;
	mapping(uint256 => Milestone) public milestones;

	//function to initilize the contract:
	function initialize(
		string calldata _fundingCId,
		uint256 _amount,
		uint256 _duration,
		address _factoryAddress,
		string calldata _category
	) external initializer {
		_campaignOwner = payable(tx.origin);
		fundingDetailsId = _fundingCId;
		targetAmount = _amount;
		campaignDuration = _duration;
		factoryContractAddress = _factoryAddress;
		category = _category;
	}

	function giveDonationToCause() public payable {
		uint256 funds = msg.value;
		if (campaignEnded) {
			revert CamPaignEndedErrorNoLongerAcceptingDonations();
		}
		if (funds == 0) {
			revert InsufficientFunds();
		}
		if (_numberOfWithdrawal == 3) {
			revert CamPaignEndedErrorNoLongerAcceptingDonations();
		}
		if (donors[msg.sender] == 0) {
			_numberOfDonors += 1;
		}
		donors[msg.sender] += funds;
		_amountDonated += funds;
		emit DonatedToProject(
			msg.sender,
			funds,
			address(this),
			block.timestamp
		);
	}

	function creatNewMilestone(
		string memory milestoneCID
	) public campaignOwner(msg.sender) {
		//check if we have a pending milestone or no milestone at all
		if (milestones[_milestoneCounter].status == MilestoneStatus.Pending) {
			revert YouHaveAPendingMileStone();
		}

		if (_numberOfWithdrawal == 3) {
			revert TheMaximumMilestoneHaveBeenCreated();
		}
		//create a new milestone increment the milestonecounter ( 1-2-3 )
		_milestoneCounter++;
		//voting period for a minimum of 2 weeks before the proposal fails or passes
		Milestone storage newmilestone = milestones[_milestoneCounter];
		newmilestone.status = MilestoneStatus.Pending;
		newmilestone.milestoneCID = milestoneCID;
		newmilestone.approved = false;
		newmilestone.votingPeriod = block.timestamp + 14 * 1 days;
		emit MilestoneCreated(
			msg.sender,
			block.timestamp,
			block.timestamp + 14 * 1 days,
			milestoneCID
		);
	}

	function retrieveDonatedAmount() public payable {
		uint256 amountDonated = donors[msg.sender];
		if (amountDonated == 0) {
			revert YouDidNotDonateToThisCampaign();
		}
		//check the milestone
		uint256 donationDivider = 0;
		if (_approvedMilestone == 0) {
			//get your full money
			donationDivider = _baseNumber;
		}
		if (_approvedMilestone == 1) {
			//get 2/3 of your money
			donationDivider = (2 * _baseNumber) / 3;
		}

		if (_approvedMilestone == 2) {
			//get 1/3 of your donation
			donationDivider = _baseNumber / 3;
		}

		if (_approvedMilestone == 3) {
			//you get nothing
			revert CantWithdrawFundsCampaignEnded(msg.sender);
		}

		//there's a tax of 20% of your remaining amount if you are withdrawing your donation
		//eg 80 * 20 / 100 = 16. 80 - 16 = 64

		uint256 taxOnWithdrawal = (amountDonated *
			donationDivider *
			_taxOnWithdrawingDonation) / (_baseNumber * 100);
		uint256 amountToCollect = (amountDonated *
			donationDivider *
			(100 - _taxOnWithdrawingDonation)) / (_baseNumber * 100);
		donors[msg.sender] = 0;
		_numberOfDonors--; //reduce the number of donors
		amountRecalledByDonor += taxOnWithdrawal + amountToCollect;

		(bool success, ) = payable(msg.sender).call{ value: amountToCollect }(
			""
		);
		(bool successTwo, ) = payable(factoryContractAddress).call{
			value: taxOnWithdrawal
		}("");
		if (!success) {
			revert WithdrawalFailed(amountToCollect);
		}
		if (!successTwo) {
			revert WithdrawalFailed(taxOnWithdrawal);
		}
		emit DonationRetrievedByDonor(
			address(this),
			msg.sender,
			amountToCollect,
			amountDonated,
			block.timestamp
		);
	}

	function voteOnMilestone(bool vote) public {
		//check if the milestone is pending which means we can vote
		Milestone storage milestone = milestones[_milestoneCounter];
		//check milestone duration if it has expired
		if (block.timestamp > milestone.votingPeriod) {
			revert MileStoneVotingHasElapsed();
		}

		if (milestone.status != MilestoneStatus.Pending) {
			revert CanNotVoteOnMileStone(msg.sender);
		}
		//check if this person is a donor to the cause
		if (donors[msg.sender] == 0) {
			revert YouDidNotDonateToThisCampaign();
		}

		//check if the person has voted already
		if (milestone.hasVoted[msg.sender]) {
			revert YouHaveVotedForThisMilestoneAlready(msg.sender);
		}

		milestone.hasVoted[msg.sender] = true;

		if (vote == true) {
			milestone.supportVote += 1;
		} else {
			milestone.againstVote += 1;
		}
		emit VotedOnMileStone(msg.sender, address(this), vote, block.timestamp);
	}

	function withdrawMilestone() public campaignOwner(msg.sender) {
		if (_numberOfWithdrawal == 3) {
			revert MaximumNumberofWithdrawalExceeded();
		}
		if (block.timestamp < campaignDuration) {
			revert CampaignStillRunning();
		}
		uint256 bal = contractBalance();
		Milestone storage milestone = milestones[_milestoneCounter];
		uint256 totalVotes = milestone.againstVote + milestone.supportVote;

		// Allow withdrawal without voting in the first milestone //current time less
		// than the duration for the first withdrawal

		if (_numberOfWithdrawal == 0 && _milestoneCounter == 1) {
			//withdrawing 1/3 of the available balance
			processWithdrawal(
				(1 * bal * _baseNumber) / (3 * _baseNumber),
				false
			);
			milestone.approved = true;
			_approvedMilestone++;
			milestone.status = MilestoneStatus.Approved;
			_numberOfWithdrawal = 1;
			return;
		}

		checkMilestoneStatus(milestone);

		if (milestone.againstVote == 0 && milestone.supportVote == 0) {
			approveMilestone(milestone);
		} else if (
			milestone.supportVote * _baseNumber >=
			((2 * totalVotes * _baseNumber) / 3)
		) {
			//looking for 2/3 of the votes
			approveMilestone(milestone);
		} else {
			rejectMilestone(milestone);
			return;
		}

		uint256 amountToWithdraw;
		uint256 withdrawalTax;
		bool isFinalWithdrawal = (_numberOfWithdrawal == 2);

		if (_numberOfWithdrawal == 1) {
			amountToWithdraw = (2 * bal * _baseNumber) / (3 * _baseNumber);
		} else if (isFinalWithdrawal) {
			withdrawalTax = (1 * _baseNumber * bal) / (_baseNumber * 100); // 1% tax
			amountToWithdraw = bal - withdrawalTax;
			emit CampaignEnded(address(this), block.timestamp);
		}

		_numberOfWithdrawal += 1;
		// Process tax payment if it's the final withdrawal
		if (isFinalWithdrawal) {
			processWithdrawal(withdrawalTax, true);
		}

		// Process milestone withdrawal
		processWithdrawal(amountToWithdraw, false);
	}

	function checkMilestoneStatus(Milestone storage milestone) internal {
		if (block.timestamp < milestone.votingPeriod) {
			revert MileStoneVotingPeriodHasNotElapsed();
		}
		if (milestone.status != MilestoneStatus.Pending) {
			revert MilestoneHasEnded();
		}
		if (milestone.againstVote >= milestone.supportVote) {
			rejectMilestone(milestone);
		}
	}

	function approveMilestone(Milestone storage milestone) internal {
		milestone.status = MilestoneStatus.Approved;
		milestone.approved = true;
		_approvedMilestone++;
		emit MileStoneApproval(
			address(this),
			milestone.milestoneCID,
			block.timestamp
		);
	}

	function rejectMilestone(Milestone storage milestone) internal {
		milestone.status = MilestoneStatus.Declined;
		milestone.approved = false;
		emit MileStoneRejected(
			address(this),
			milestone.milestoneCID,
			block.timestamp
		);
	}

	function processWithdrawal(uint256 amount, bool isTaxPayment) internal {
		address recipient = isTaxPayment ? factoryContractAddress : msg.sender;
		(bool success, ) = payable(recipient).call{ value: amount }("");
		if (!success) {
			revert WithdrawalFailed(amount);
		}
		if (recipient == msg.sender) {
			emit MilestoneWithdrawal(msg.sender, amount, block.timestamp);
		}
	}

	function contractBalance() public view returns (uint256) {
		return address(this).balance;
	}

	function getFundingDetails()
		public
		view
		returns (address, uint256, uint256)
	{
		return (_campaignOwner, campaignDuration, targetAmount);
	}

	function hasVotedOnMilestone(address _donorAddress) public view returns (bool) {
		Milestone storage milestone = milestones[_milestoneCounter];
		if (milestone.hasVoted[_donorAddress]) {
			return true;
		}
		return false;
	}

	function totalVotesOnMilestone() public view returns (uint256, uint256) {
		Milestone storage milestone = milestones[_milestoneCounter];
		return (milestone.supportVote, milestone.againstVote);
	}

	function increaseCampaignPeriod(
		uint256 newPeriod
	) public campaignOwner(msg.sender) {
		if (newPeriod <= campaignDuration) {
			revert NewDurationSmallerThanPreviousDuration();
		}
		campaignDuration = newPeriod;
	}

	receive() external payable {}

	//a user creates a project seeking for funds
	//donors donate to the project
	//donors can withdraw their balance before the project is executed, no longer interested on the project
	//vote to approve a milestone
	//owner can create different milestone maximum milestone is 3:
	//owner can withdraw funds in three batches. The first withdrawal does not need a vote
	//a donor not voting is assume to have voted when the voting time lasped
	//how do we notify a donor that a milestone have been created
	//collect their email at the backend to send them messages if a milestone is created
	//NOdeJS server
	//ablity to hop in and receive a message from the backend
	//if the milestone is created at etherscan that defeats the purpose ( chainlink function that triggers and calls
	// an API to send the message to donors )
}
