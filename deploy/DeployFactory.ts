import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("CrowdFundingFactory", {
		from: deployer,
		args: ["0xd0BDE0E8a885cFD44C914bE5bDfa7bfE82a941dE"],
		log: true,
	})
}

export default func

func.tags = ["factory"]

//0xa173f0f31Ec27B94dC56F3D9218148F612e750f7

