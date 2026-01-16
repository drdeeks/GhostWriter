// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

/**
 * @title PriceOracle
 * @dev Converts USD amounts to ETH using Chainlink price feeds
 */
contract PriceOracle is Ownable {
    AggregatorV3Interface public priceFeed;
    
    // Fallback price in case oracle fails (in USD per ETH, 8 decimals)
    int256 public fallbackPrice = 3000_00000000; // $3000
    uint256 public priceValidityDuration = 15 minutes;
    uint256 public maxPriceDeviation = 20; // 20% max deviation from fallback
    
    event PriceFeedUpdated(address indexed newFeed);
    event FallbackPriceUpdated(int256 newPrice);
    event PriceValidityDurationUpdated(uint256 newDuration);
    event MaxPriceDeviationUpdated(uint256 newDeviation);
    
    constructor(address _priceFeed) Ownable(msg.sender) {
        require(_priceFeed != address(0), "Invalid price feed");
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    /**
     * @dev Get current ETH price in USD (8 decimals)
     */
    function getLatestPrice() public view returns (int256) {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            require(price > 0, "Invalid price");
            require(block.timestamp - updatedAt < priceValidityDuration, "Stale price");
            
            // Circuit breaker: check deviation from fallback
            int256 deviation = (price > fallbackPrice) 
                ? ((price - fallbackPrice) * 100) / fallbackPrice
                : ((fallbackPrice - price) * 100) / fallbackPrice;
            
            if (uint256(deviation) > maxPriceDeviation) {
                return fallbackPrice; // Use fallback if deviation too high
            }
            
            return price;
        } catch {
            return fallbackPrice;
        }
    }
    
    /**
     * @dev Convert USD cents to ETH wei
     * @param usdCents Amount in USD cents (e.g., 5 = $0.05)
     */
    function usdToEth(uint256 usdCents) public view returns (uint256) {
        int256 ethPrice = getLatestPrice(); // 8 decimals
        require(ethPrice > 0, "Invalid ETH price");
        
        // Convert: (usdCents * 10^18) / (ethPrice * 10^2)
        // usdCents in cents, ethPrice in USD with 8 decimals
        // Result in wei (18 decimals)
        // Multiply first to avoid precision loss
        uint256 ethAmount = (usdCents * 1e18) / (uint256(ethPrice) * 1e2);
        
        // Ensure minimum fee of 1 wei
        require(ethAmount > 0, "Fee too small");
        
        return ethAmount;
    }
    
    /**
     * @dev Update price feed address
     */
    function updatePriceFeed(address _priceFeed) external onlyOwner {
        require(_priceFeed != address(0), "Invalid price feed");
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }
    
    /**
     * @dev Update fallback price
     */
    function updateFallbackPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        fallbackPrice = _price;
        emit FallbackPriceUpdated(_price);
    }
    
    /**
     * @dev Update price validity duration
     */
    function updatePriceValidityDuration(uint256 _duration) external onlyOwner {
        require(_duration > 0, "Invalid duration");
        require(_duration <= 1 hours, "Duration too long");
        priceValidityDuration = _duration;
        emit PriceValidityDurationUpdated(_duration);
    }
    
    /**
     * @dev Update max price deviation
     */
    function updateMaxPriceDeviation(uint256 _deviation) external onlyOwner {
        require(_deviation > 0 && _deviation <= 50, "Invalid deviation");
        maxPriceDeviation = _deviation;
        emit MaxPriceDeviationUpdated(_deviation);
    }
}
