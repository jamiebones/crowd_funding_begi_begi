import { DeployFunction } from "hardhat-deploy/types";

import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, owner } = await hre.getNamedAccounts();

  await hre.deployments.deploy("CrowdFundingFactory", {
    from: deployer,
    args: ["0x6327A3427A88622910226984d289446b6018d222"],
    log: true,
  });
};

export default func;

func.tags = ["factory"];

//0xBaAaBaD74EbB522Bb6f626B8cbBac4B6737C410a


//localhost factory: 0x30b0F7A540193D58F9FeB97b3071686Cd3a389Ae