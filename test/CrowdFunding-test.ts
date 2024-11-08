import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, } from "hardhat"
import {
    time,
  } from "@nomicfoundation/hardhat-network-helpers";



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


		return {
			factoryContract,
			contractAddress: await factoryContract.getAddress(),
			deployer: signers.deployer,
			accounts: await ethers.getSigners(),
		}
	})

	it("Should Deploy a Crowd Funding Contract", async () => {
		const { factoryContract, accounts } = await setupFixture();
        const fundingDetailsId = "ipfs://dadadadaddadad";
        const amount = ethers.parseEther("1");
        const duration = (await time.latest()) + ONE_DAY_IN_SECS;
        const amountToDeposit = ethers.parseEther("0.001");
       
        const txn = await factoryContract.connect(accounts[0]).createNewCrowdFundingContract(
            fundingDetailsId, amount, duration, {value: amountToDeposit}
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

	// describe("Minting Functionality", () => {
	// 	it("Should Increase Total Supply and User Supply When Minting", async () => {
	// 		const { contract, accounts } = await setupFixture()

	// 		expect(await contract.totalSupply()).to.equal(0)

	// 		await contract.mint(accounts[0].address, 1000)
	// 		await contract.mint(accounts[1].address, 2000)

	// 		expect(await contract.totalSupply()).to.equal(3000)
	// 		expect(await contract.balanceOf(accounts[0].address)).to.equal(1000)
	// 		expect(await contract.balanceOf(accounts[1].address)).to.equal(2000)
	// 	})

	// 	it("Should Allow Only Owner to Mint Tokens", async () => {
	// 		const { contract, accounts } = await setupFixture()

	// 		await expect(contract.connect(accounts[1]).mint(accounts[1].address, 1000))
	// 			.to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
	// 			.withArgs(await accounts[1].getAddress())
	// 	})
	// })
})


    
  
  
    
   
//     args: Result(4) [
//       '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
//       1000000000000000n,
//       '0x856e4424f806D16E8CBC702B3c0F2ede5468eae5',
//       'ipfs://dadadadaddadad'
//     ]
//   }