

# CrowdFunding Factory Contract

This repository contains the `CrowdFundingFactory` smart contract and `CrowdFundingContractForBegiBegi` ,which serves as a factory for creating proxy crowdfunding contracts using the EIP-1167 minimal proxy standard. Each crowdfunding proxy contract is created using a pre-defined implementation contract specified during the factory deployment.

### Features

Proxy Contracts: This factory leverages the OpenZeppelin Clones library to deploy minimal proxy contracts that are linked to the specified implementation contract.


### Smart Contract Details
Factory Contract: CrowdFundingFactory
The CrowdFundingFactory contract provides the following core functionalities:

_Constructor_

`constructor(address _implementation)`
Sets the address of the crowdfunding implementation contract to be used for creating proxy contracts.

### Functions
`createNewCrowdFundingContract`

Deploys a new crowdfunding proxy contract.
Initializes the proxy contract with specific parameters:
`_fundingDetailsId (string)`: A unique identifier for the crowdfunding project.
`_amount (uint256)`: The fundraising goal amount.
`_duration (uint256)`: The duration of the fundraising campaign.
`_category (string)`: The category of the crowdfunding project.

Emits the `NewCrowdFundingContractCreated` event.
`changeFundingFee`: Allows the owner to update the funding fee for creating a new crowdfunding contract.

`withdrawFunds`: Enables the contract owner to withdraw accumulated fees from the factory.

`contractBalance`:Returns the current balance of the factory contract.

`deployedContracts`: Returns the addresses of all crowdfunding proxy contracts created through the factory.

`getContractCreationFee`: Returns the current fee for creating a new crowdfunding contract.

### Events

`NewCrowdFundingContractCreated`
Triggered upon the creation of a new proxy contract.
Includes details such as the owner, clone address, funding details, and more.

### Errors
`FundingForNewContractTooSmall`: Thrown when the sent fee is less than the required funding fee.
`FailedToCreateFundingContract`: Thrown when the initialization of the proxy contract fails.
`NoFundsToWithdraw`: Thrown when there are no funds available for withdrawal.
`WithdrawalFailed`: Thrown when a withdrawal attempt fails.

### Deployment Notes
_Implementation Contract_
The factory requires a pre-deployed crowdfunding implementation contract that contains the logic and storage structure for the proxy contracts.

_Fee Configuration_
The initial fee for creating a proxy contract is set in the factory's state and can be adjusted by the owner.

_Initialization Logic_
Each proxy contract is initialized with data via the initialize function, which must be implemented in the crowdfunding implementation contract.



# CrowdFundingContractForBegiBegi

This Solidity contract, ````CrowdFundingContractForBegiBegi````, is a blockchain-based crowdfunding platform where users can create campaigns, receive donations, and manage funds through milestones. The contract ensures transparency and accountability, allowing donors to vote on milestone approvals and withdraw their donations under certain conditions.

### Features

_Campaign Creation_

* Campaign Owners: Can create a campaign with a funding target, duration, and category.
* Donors: Can contribute to campaigns until the funding target or duration is reached.
  
_Milestone Management_
* Campaign owners can create up to three milestones.
* Milestone voting lasts for 14 days and determines fund disbursement.

_Voting System_
* Donors vote to approve or reject milestones.
* Milestones are approved with at least two-thirds of the votes in favor.
* Non-voters are assumed to have abstained after the voting period ends.

_Fund Withdrawal_

* Funds are withdrawn in three stages:
* First Milestone: 1/3 of funds, no voting required.
* Second Milestone: Requires donor approval.
* Final Milestone: The remainder of funds, subject to a 1% tax.

_Donor Protections_
* Donors can retrieve unspent donations, subject to a 20% tax, based on approved milestones.
* Campaigns automatically end after the third milestone withdrawal.
* 
### Contract Components
_State Variables_

`campaignEnded`: Tracks the campaign status.
`category`: Campaign category (e.g., Sports, Education).
`targetAmount`: Fundraising goal.
`campaignDuration`: Campaign duration in seconds.
`donors`: Mapping of donor addresses to donation amounts.
`milestones`: Tracks milestone details and voting results.

### Key Functions
`initialize`: Initializes a campaign with required details.
`giveDonationToCause`: Allows users to donate.
`creatNewMilestone`: Creates a new milestone for the campaign.
`voteOnMilestone`: Enables donors to vote on milestones.
`withdrawMilestone`: Allows campaign owners to withdraw funds after milestone approval.
`retrieveDonatedAmount`: Enables donors to withdraw their contributions if dissatisfied.
`increaseCampaignPeriod`: Extends the campaign duration.
`contractBalance`: Returns the contract's current balance.

### Events

`MilestoneCreated`: Triggered when a milestone is created.
`DonatedToProject`: Emitted when a donation is made.
`VotedOnMileStone`: Triggered after a donor votes.
`MileStoneApproval`: Emitted when a milestone is approved.
`MileStoneRejected`: Triggered when a milestone is rejected.
`MilestoneWithdrawal`: Emitted after funds are withdrawn.
`CampaignEnded`: Triggered when the campaign concludes.
`DonationRetrievedByDonor`: Emitted when a donor retrieves their funds.

### Installation and Deployment
_Clone the repository_:

`git clone https://github.com/your-repo/CrowdFundingContractForBegiBegi.git`

_Install dependencies_:

`npm install`

_Compile the contract using Hardhat_:
bash

`npx hardhat compile`
_Deploy the contract:_ to Rootstock

`npx hardhat deploy --network rskTestnet tags funding` 