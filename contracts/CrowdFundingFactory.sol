// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract CrowdFundingFactory is Ownable {
    //Error 
    error FundingForNewContractTooSmall();
    error FailedToCreateFundingContract();
    error WithdrawalFailed();
    error NoFundsToWithdraw();

    //Events
     event NewCrowdFundingContractCreated(
        address indexed owner,
        uint256 amount,
        address cloneAddress,
        string fundingDetailsId
    );
    
     //state variables;
    address immutable private CROWDFUNDING_IMPLEMENTATION;
    address[] public deployedCrowdFundingContracts;
    uint256 public fundingFee = 0.001 ether;

    constructor(address _implementation) Ownable(msg.sender) {
        CROWDFUNDING_IMPLEMENTATION = _implementation;
    }

    function createNewCrowdFundingContract(
        string memory _fundingDetailsId,
        uint256 _amount,
        uint256 _duration
    ) external payable returns (address) {
        if (msg.value < fundingFee ){
            revert FundingForNewContractTooSmall();
        }
        address clone = Clones.clone(CROWDFUNDING_IMPLEMENTATION);
        (bool success, ) = clone.call(
            abi.encodeWithSignature(
                "initialize(string,uint256,uint256,address)",
                _fundingDetailsId,
                _amount,
                _duration,
                address(this)
            )
        );
        if (!success) {
            revert FailedToCreateFundingContract();
        }
        deployedCrowdFundingContracts.push(clone);
        emit NewCrowdFundingContractCreated(msg.sender, fundingFee, clone, _fundingDetailsId);
        return clone;
    }


    function changeFundingFee(uint256 _newFee) public onlyOwner  {
        fundingFee = _newFee;
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        if ( balance == 0 ){
            revert NoFundsToWithdraw();
        }
       (bool success, ) = payable(msg.sender).call{value: balance}("");
       if (!success){
        revert WithdrawalFailed();
       }
    }

    function deployedContracts() public view returns (address[] memory) {
        return deployedCrowdFundingContracts;
    }

    receive() external payable {}
}