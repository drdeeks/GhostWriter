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
    uint256 public constant MAX_SUPPLY = 50_000_000 * 10 ** 18;

    // Keep buckets simple + on-chain enforced.
    // The UI can label these however you want.
    enum Bucket {
        COMMUNITY,
        REWARDS,
        LIQUIDITY,
        TREASURY,
        TEAM,
        PARTNERS,
        RESERVED
    }

    uint8 public constant BUCKET_COUNT = 7;

    mapping(uint8 => uint256) public bucketCaps;
    mapping(uint8 => uint256) public bucketMinted;

    event BucketCapUpdated(uint8 indexed bucket, uint256 cap);
    event BucketMinted(uint8 indexed bucket, address indexed to, uint256 amount);

    constructor() ERC20("GhostWriter Token", "GWT") Ownable(msg.sender) {}

    function totalBucketCaps() public view returns (uint256 sum) {
        for (uint8 i = 0; i < BUCKET_COUNT; i++) {
            sum += bucketCaps[i];
        }
    }

    function setBucketCap(uint8 bucket, uint256 cap) external onlyOwner {
        require(bucket < BUCKET_COUNT, "Invalid bucket");
        require(cap >= bucketMinted[bucket], "Cap < minted");

        bucketCaps[bucket] = cap;

        // Ensure the configured caps never exceed the global max supply.
        require(totalBucketCaps() <= MAX_SUPPLY, "Caps exceed max");

        emit BucketCapUpdated(bucket, cap);
    }

    function getBucketInfo(uint8 bucket) external view returns (uint256 cap, uint256 minted, uint256 remaining) {
        require(bucket < BUCKET_COUNT, "Invalid bucket");
        cap = bucketCaps[bucket];
        minted = bucketMinted[bucket];
        remaining = cap > minted ? (cap - minted) : 0;
    }

    function mintFromBucket(uint8 bucket, address to, uint256 amount) public onlyOwner {
        require(bucket < BUCKET_COUNT, "Invalid bucket");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 cap = bucketCaps[bucket];
        require(bucketMinted[bucket] + amount <= cap, "Bucket cap exceeded");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");

        bucketMinted[bucket] += amount;
        _mint(to, amount);

        emit BucketMinted(bucket, to, amount);
    }

    function airdropFromBucket(
        uint8 bucket,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) public onlyOwner {
        require(recipients.length == amounts.length, "Mismatched arrays");
        require(recipients.length > 0, "No recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            mintFromBucket(bucket, recipients[i], amounts[i]);
        }
    }

    // Backwards compatible owner ops (use RESERVED bucket by default)
    function mint(address to, uint256 amount) external onlyOwner {
        mintFromBucket(uint8(Bucket.RESERVED), to, amount);
    }

    function airdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        airdropFromBucket(uint8(Bucket.RESERVED), recipients, amounts);
    }
}
