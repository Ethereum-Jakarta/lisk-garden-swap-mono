// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// OpenZeppelin's battle-tested ERC-20 implementation
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SeedToken is ERC20, Ownable {
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant REWARD_RATE = 10 * 10**18; // 10 SEED per action

    // Track rewards given
    mapping(address => uint256) public totalRewardsEarned;

    // Events
    event RewardGiven(address indexed user, uint256 amount, string reason);

    constructor() ERC20("Garden Seed", "SEED") Ownable(msg.sender) {
        // Mint initial supply to contract deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Mint new tokens (only owner - for rewards)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Burn tokens (anyone can burn their own)
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // Reward user for garden actions
    function rewardUser(address user, string memory reason) external onlyOwner {
        _mint(user, REWARD_RATE);
        totalRewardsEarned[user] += REWARD_RATE;
        emit RewardGiven(user, REWARD_RATE, reason);
    }

    // Get token details
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply()
        );
    }
}
