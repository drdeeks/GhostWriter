// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GhostWriterToken
 * @dev Simple ERC20 used for future liquidity provisioning + community airdrops.
 *
 * Notes:
 * - This token is intentionally minimal: owner-only mint + bulk airdrop.
 * - LiquidityPool currently custodies ETH fees; pairing / LP deployment is handled offchain.
 */
contract GhostWriterToken is ERC20, Ownable {
    constructor() ERC20("Ghost Token", "GHOST") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        _mint(to, amount);
    }

    function airdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Mismatched arrays");
        require(recipients.length > 0, "No recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            uint256 amount = amounts[i];
            require(to != address(0), "Invalid recipient");
            require(amount > 0, "Invalid amount");
            _mint(to, amount);
        }
    }
}
