import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, } from "hardhat"
import {
    time,
  } from "@nomicfoundation/hardhat-network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";



  const ONE_DAY_IN_SECS = 1 * 24 * 60 * 60;
  const ONE_ETH = 1_000_000_000_000_000_000;

describe("CrowdFundingFactory", () => {
	const setupFixture = deployments.createFixture(async () => {
		await deployments.fixture()
		const signers = await getNamedAccounts()
		const owner = signers.deployer

		const crowdFundingImplementationContract = await ethers.deployContract(
			"CrowdFundingContractForBegiBegi",
			[],
			await ethers.getSigner(signers.deployer)
		)

        const implementationContractAddress = await crowdFundingImplementationContract.getAddress();

        const factoryContract = await ethers.deployContract(
			"CrowdFundingFactory",
			[implementationContractAddress],
			await ethers.getSigner(signers.deployer)
		)

        const fundingDetailsId = "ipfs://dadadadaddadad";
        const category = "Energy";
        const amount = ethers.parseEther("1");
        const duration = (await time.latest()) + ONE_DAY_IN_SECS;
        const amountToDeposit = ethers.parseEther("0.001");

        const accounts = await ethers.getSigners();
       
        const txn = await factoryContract.connect(accounts[0]).createNewCrowdFundingContract(
            fundingDetailsId, amount, duration, category, {value: amountToDeposit}
        );

        const receipt = await txn.wait();

        const cloneAddress = receipt?.logs[1].args[2]

        const instanceOne = await ethers.getContractAt(
            "CrowdFundingContractForBegiBegi",
            cloneAddress,
            accounts[0]
          );

       


		return {
			factoryContract,
			contractAddress: await factoryContract.getAddress(),
			deployer: signers.deployer,
			accounts: await ethers.getSigners(),
            instanceOne,
            instanceOneAddresss: cloneAddress

		}
	})

	it("Should Deploy a Crowd Funding Contract", async () => {
		const { factoryContract, accounts } = await setupFixture();
        const fundingDetailsId = "ipfs://dadadadaddadad";
        const amount = ethers.parseEther("1");
        const duration = (await time.latest()) + ONE_DAY_IN_SECS;
        const amountToDeposit = ethers.parseEther("0.001");
        const category = "Education"
       
        const txn = await factoryContract.connect(accounts[0]).createNewCrowdFundingContract(
            fundingDetailsId, amount, duration, category, {value: amountToDeposit}
        );

        const receipt = await txn.wait();

        const cloneAddress = receipt?.logs[1].args[2]

        let instanceOne = await ethers.getContractAt(
            "CrowdFundingContractForBegiBegi",
            cloneAddress,
            accounts[0]
          );

        const campaignDetails = await instanceOne.getFundingDetails();
        expect(campaignDetails[0]).to.be.equal(await accounts[0].getAddress());
        expect(campaignDetails[2]).to.equal(amount);
        expect(campaignDetails[1]).to.be.above(0);
	})

    describe("Donations", function () {
        it("Should accept donations", async function () {
            const { accounts, instanceOne, instanceOneAddresss } = await setupFixture();
          await expect(() => instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("1") }))
            .to.changeEtherBalances([await accounts[1].getAddress(), instanceOneAddresss], [-ethers.parseEther("1"), ethers.parseEther("1")]);
          expect(await instanceOne.donors(await accounts[1].getAddress())).to.equal(ethers.parseEther("1"));
    });

    })

	describe("Milestone Creation", function () {
        it("Should allow only campaign owner to create a milestone", async function () {
            const { accounts, instanceOne } = await setupFixture();
          await expect(instanceOne.connect(accounts[1]).creatNewMilestone("milestoneCID"))
            .to.be.revertedWithCustomError(instanceOne, "YouAreNotTheOwnerOfTheCampaign");
          await expect(instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID"))
            .to.emit(instanceOne, "MilestoneCreated")
            .withArgs(await accounts[0].getAddress(), anyValue, anyValue, "milestoneCID");
        });
    
        it("Should reject milestone creation if a pending milestone exists", async function () {
            const { accounts, instanceOne } = await setupFixture();
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          await expect(instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID2"))
            .to.be.revertedWithCustomError(instanceOne,"YouHaveAPendingMileStone");
        });
      });

      describe("Voting on Milestone", function () {
    
        it("Should allow donors to vote on milestones", async function () {
            const { accounts, instanceOne, instanceOneAddresss } = await setupFixture();
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("1") });
          await expect(instanceOne.connect(accounts[1]).voteOnMilestone(true))
            .to.emit(instanceOne, "VotedOnMileStone")
            .withArgs(await accounts[1].getAddress(), instanceOneAddresss, true, anyValue);
        });
    
        it("Should revert if non-donor tries to vote", async function () {
            const { accounts, instanceOne } = await setupFixture();
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          await expect(instanceOne.connect(accounts[2]).voteOnMilestone(true)).to.be.revertedWithCustomError(instanceOne,"YouDidNotDonateToThisCampaign");
        });
    
        it("Should revert if donor tries to vote twice", async function () {
          const { accounts, instanceOne } = await setupFixture();
          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("1") });
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          await instanceOne.connect(accounts[1]).voteOnMilestone(true);
          await expect(instanceOne.connect(accounts[1]).voteOnMilestone(true)).to.be.revertedWithCustomError(instanceOne,"YouHaveVotedForThisMilestoneAlready");
        });
      });

      describe("Milestone Withdrawal", function () {
        beforeEach(async function () {
          
        });
    
        it("Should allow owner to withdraw first tranche funds without voting", async function () {
          const { accounts, instanceOne } = await setupFixture();
    
          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("5") });
          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("5") });
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");

          const oneMonth = 30 * 24 * 60 * 60;
          await time.increase(oneMonth);
          const contractBalBefore = await instanceOne.contractBalance()
          await instanceOne.connect(accounts[0]).withdrawMilestone();
          const contractBalAfter = await instanceOne.contractBalance()
          console.log(+contractBalBefore.toString()/1e18, +contractBalAfter.toString()/1e18)
          expect(contractBalBefore).to.be.greaterThan(contractBalAfter);
        });

         it("Should allow withdrawal if milestone is approved withdrawals", async function () {
            const { accounts, instanceOne, factoryContract} = await setupFixture();

          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("5") });
          await instanceOne.connect(accounts[2]).giveDonationToCause({ value: ethers.parseEther("5") });
          await instanceOne.connect(accounts[3]).giveDonationToCause({ value: ethers.parseEther("5") });
          await instanceOne.connect(accounts[4]).giveDonationToCause({ value: ethers.parseEther("5") });

          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");

          const mileOneDate = 15 * 24 * 60 * 60;
          await time.increase(mileOneDate);
          await instanceOne.connect(accounts[0]).withdrawMilestone();

          //milestone 2 creation;
          await time.latest();
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          const mileTwoDate = 30 * 24 * 60 * 60;
          await instanceOne.connect(accounts[1]).voteOnMilestone(false);
          await instanceOne.connect(accounts[2]).voteOnMilestone(true);
          await instanceOne.connect(accounts[3]).voteOnMilestone(true);
          await instanceOne.connect(accounts[4]).voteOnMilestone(true);
          await time.increase(mileTwoDate);
          await instanceOne.connect(accounts[0]).withdrawMilestone();

          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          const mileThreeDate = 30 * 24 * 60 * 60;
          await instanceOne.connect(accounts[1]).voteOnMilestone(false);
          await instanceOne.connect(accounts[2]).voteOnMilestone(true);
          await instanceOne.connect(accounts[3]).voteOnMilestone(true);
          await instanceOne.connect(accounts[4]).voteOnMilestone(true);
          const balBefore = await factoryContract.contractBalance();
          await time.increase(mileThreeDate);
          await instanceOne.connect(accounts[0]).withdrawMilestone();
          const balAfter = await factoryContract.contractBalance();
          expect(balAfter).to.be.greaterThan(balBefore);
        });
    
        it("Should prevent withdrawals if milestone vote is not approved", async function () {
            const { accounts, instanceOne } = await setupFixture();

            await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("5") });
            await instanceOne.connect(accounts[2]).giveDonationToCause({ value: ethers.parseEther("5") });
            await instanceOne.connect(accounts[3]).giveDonationToCause({ value: ethers.parseEther("5") });
            await instanceOne.connect(accounts[4]).giveDonationToCause({ value: ethers.parseEther("5") });
  
            await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
  
            const mileOneDate = 15 * 24 * 60 * 60;
            await time.increase(mileOneDate);
            await instanceOne.connect(accounts[0]).withdrawMilestone();

             //milestone 2 creation;
          await time.latest();
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
          const mileTwoDate = 30 * 24 * 60 * 60;
          await instanceOne.connect(accounts[1]).voteOnMilestone(false);
          await instanceOne.connect(accounts[2]).voteOnMilestone(false);
          await instanceOne.connect(accounts[3]).voteOnMilestone(false);
          await instanceOne.connect(accounts[4]).voteOnMilestone(true);
          const balBefore = await instanceOne.contractBalance();
          await time.increase(mileTwoDate);
          await instanceOne.connect(accounts[0]).withdrawMilestone();
          const balAfter = await instanceOne.contractBalance();
          expect(balAfter).to.be.equal(balBefore);
        });
      });

      describe("Donor Refund", function () {
        it("Should allow donor to withdraw donation under certain conditions", async function () {
          const { accounts, instanceOne, instanceOneAddresss} = await setupFixture();
          await instanceOne.connect(accounts[1]).giveDonationToCause({ value: ethers.parseEther("2") });
          await instanceOne.connect(accounts[0]).creatNewMilestone("milestoneCID");
        
          await expect(() => instanceOne.connect(accounts[1]).retrieveDonatedAmount())
            .to.changeEtherBalances([await accounts[1].getAddress(), instanceOneAddresss], [ethers.parseEther("1.6"), ethers.parseEther("-2.0")]);
        });
    
        it("Should revert if donor has no donation", async function () {
          const { accounts, instanceOne } = await setupFixture();
          await expect(instanceOne.connect(accounts[0]).retrieveDonatedAmount()).to.be.revertedWithCustomError(instanceOne,"YouDidNotDonateToThisCampaign");
        });
      });
	
})


    
  
  
    
   
//     args: Result(4) [
//       '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
//       1000000000000000n,
//       '0x856e4424f806D16E8CBC702B3c0F2ede5468eae5',
//       'ipfs://dadadadaddadad'
//     ]
//   }