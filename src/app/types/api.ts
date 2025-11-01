/**
 * OnchainKit API template — centralizes SDK configuration, re-exports safe helpers,
 * and exposes utility guards plus a local `buildSendTransaction` implementation that
 * mirrors the documented example from the public package.
 */
import { setOnchainKitConfig } from '@coinbase/onchainkit';
import {
  buildMintTransaction,
  buildPayTransaction,
  buildSwapTransaction,
  getMintDetails,
  getPortfolios,
  getPriceQuote,
  getSwapQuote,
  getTokenDetails,
  getTokens,
  type APIError,
  type BuildMintTransactionParams,
  type BuildMintTransactionResponse,
  type BuildPayTransactionParams,
  type BuildPayTransactionResponse,
  type BuildSwapTransaction,
  type BuildSwapTransactionParams,
  type BuildSwapTransactionResponse,
  type GetMintDetailsParams,
  type GetMintDetailsResponse,
  type GetPortfoliosParams,
  type GetPortfoliosResponse,
  type GetPriceQuoteParams,
  type GetPriceQuoteResponse,
  type GetSwapQuoteParams,
  type GetSwapQuoteResponse,
  type GetTokenDetailsParams,
  type GetTokenDetailsResponse,
  type GetTokensOptions,
  type GetTokensResponse,
  type MintDetails,
  type TokenDetails,
} from '@coinbase/onchainkit/api';
import type {
  Fee,
  QuoteWarning,
  SwapQuoteParams,
  TransactionParams,
} from '@coinbase/onchainkit/swap';
import type { Token } from '@coinbase/onchainkit/token';
import type { Address } from 'viem';
import { encodeFunctionData, erc20Abi } from 'viem';
import { ONCHAINKIT_API_KEY, ONCHAINKIT_PROJECT_ID } from '../config/onchainkit';

setOnchainKitConfig({
  apiKey: ONCHAINKIT_API_KEY,
  projectId: ONCHAINKIT_PROJECT_ID,
});

export const ONCHAINKIT_API_CONFIG = Object.freeze({
  apiKey: ONCHAINKIT_API_KEY,
  projectId: ONCHAINKIT_PROJECT_ID,
});

export const ONCHAINKIT_API_HEADERS = Object.freeze({
  'cb-api-key': ONCHAINKIT_API_KEY,
  'cb-project-id': ONCHAINKIT_PROJECT_ID,
});

export type BuildSendTransactionParams = {
  recipientAddress: Address;
  tokenAddress: Address | null;
  amount: bigint;
};

export type SendTransactionCall = {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
};

export type BuildSendTransactionResponse = SendTransactionCall | APIError;

export function buildSendTransaction({
  recipientAddress,
  tokenAddress,
  amount,
}: BuildSendTransactionParams): BuildSendTransactionResponse {
  if (!tokenAddress) {
    return {
      to: recipientAddress,
      data: '0x',
      value: amount,
    };
  }

  try {
    const transferCallData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, amount],
    });

    return {
      to: tokenAddress,
      data: transferCallData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      code: 'SemBSeTx03',
      error: message,
      message: 'Could not build send transaction',
    };
  }
}

export {
  buildMintTransaction,
  buildPayTransaction,
  buildSwapTransaction,
  getMintDetails,
  getPortfolios,
  getPriceQuote,
  getSwapQuote,
  getTokenDetails,
  getTokens,
};

export type {
  APIError,
  BuildMintTransactionParams,
  BuildMintTransactionResponse,
  BuildPayTransactionParams,
  BuildPayTransactionResponse,
  BuildSwapTransaction,
  BuildSwapTransactionParams,
  BuildSwapTransactionResponse,
  Fee,
  GetMintDetailsParams,
  GetMintDetailsResponse,
  GetPortfoliosParams,
  GetPortfoliosResponse,
  GetPriceQuoteParams,
  GetPriceQuoteResponse,
  GetSwapQuoteParams,
  GetSwapQuoteResponse,
  GetTokenDetailsParams,
  GetTokenDetailsResponse,
  GetTokensOptions,
  GetTokensResponse,
  MintDetails,
  QuoteWarning,
  SwapQuoteParams,
  Token,
  TokenDetails,
  TransactionParams,
};

export type ApiResponse<T> = T | APIError;

export function isApiError(response: unknown): response is APIError {
  return Boolean(
    response &&
      typeof response === 'object' &&
      'error' in (response as Record<string, unknown>) &&
      typeof (response as { error?: unknown }).error === 'string',
  );
}

export function unwrapOnchainKitResponse<T>(response: ApiResponse<T>): T {
  if (isApiError(response)) {
    const detail = response.error || response.message || 'Unexpected OnchainKit API error';
    throw new Error(detail);
  }

  return response;
}
