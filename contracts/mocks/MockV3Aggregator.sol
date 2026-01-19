// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Minimal mock for Chainlink AggregatorV3Interface.
 * PriceOracle only needs latestRoundData() (and the interface also defines decimals()).
 */
contract MockV3Aggregator {
    uint8 public decimals;
    int256 public answer;

    constructor(uint8 _decimals, int256 _answer) {
        decimals = _decimals;
        answer = _answer;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 _answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, answer, 0, block.timestamp, 0);
    }

    function updateAnswer(int256 _answer) external {
        answer = _answer;
    }
}
