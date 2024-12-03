import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer, owner } = await hre.getNamedAccounts()

	await hre.deployments.deploy("CrowdFundingContractForBegiBegi", {
		from: deployer,
		log: true,
	})
}

export default func

func.tags = ["funding"]

//0xB553bc7691A7707d5c0F81e36B70B2366EC9d875
