// hardhat-types.d.ts
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

declare module "hardhat/config" {
  interface HardhatUserConfig {
    // From @nomicfoundation/hardhat-verify
    etherscan?: {
      apiKey?: string | Record<string, string>;
      customChains?: Array<{
        network: string;
        chainId: number;
        urls: {
          apiURL: string;
          browserURL: string;
        };
      }>;
    };

    // From mocha plugin / toolbox
    mocha?: {
      timeout?: number;
      require?: string[];
      // add other mocha options if used
    };

    // Optional: gasReporter (from hardhat-gas-reporter)
    gasReporter?: {
      enabled?: boolean;
      currency?: string;
      coinmarketcap?: string;
      // other gas reporter options
    };
  }
}
