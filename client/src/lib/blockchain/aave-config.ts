import { Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains';

export interface AaveMarket {
  name: string;
  poolAddress: Address;
  poolDataProvider: Address;
  uiPoolDataProvider: Address;
  wethGateway: Address;
}

export const AAVE_V3_MARKETS: Record<number, AaveMarket> = {
  [mainnet.id]: {
    name: 'Ethereum Mainnet',
    poolAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    poolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
    uiPoolDataProvider: '0x91c0eA31b49B69Ea18607702c5d238e697E9ECA8',
    wethGateway: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9',
  },
  [polygon.id]: {
    name: 'Polygon',
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    uiPoolDataProvider: '0xC69728f11E9E6127733751c8410432913123acf1',
    wethGateway: '0x1e4b7A6b903680eab0c5dAbcb8fD429cD2a9598c',
  },
  [arbitrum.id]: {
    name: 'Arbitrum One',
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    uiPoolDataProvider: '0x145dE30c929a065582da84Cf96F88460dB9745A7',
    wethGateway: '0xB5Ee21786D28c5Ba61661550879475976B707099',
  },
  [optimism.id]: {
    name: 'Optimism',
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    uiPoolDataProvider: '0xbd83DdBE37fc91923d59C8c1E0bDe0CccCa332d5',
    wethGateway: '0xe9E52021f4e11DEAD8661812A0A6c8627abA2a54',
  },
  [base.id]: {
    name: 'Base',
    poolAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    poolDataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac',
    uiPoolDataProvider: '0x174446a6741300cD2E7C1b1A636Fee99c8F83502',
    wethGateway: '0x8be473dCfA93132658821E67CbEB684ec8Ea2E74',
  },
  [sepolia.id]: {
    name: 'Sepolia Testnet',
    poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    poolDataProvider: '0x3e9708d80f7B3e43118013075F7e95CE3AB31F31',
    uiPoolDataProvider: '0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE',
    wethGateway: '0x387d311e47e80b498169e6fb51d3193167d89F7D',
  },
};

export const AAVE_POOL_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const AAVE_DATA_PROVIDER_ABI = [
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'unbacked', type: 'uint256' },
      { name: 'accruedToTreasuryScaled', type: 'uint256' },
      { name: 'totalAToken', type: 'uint256' },
      { name: 'totalStableDebt', type: 'uint256' },
      { name: 'totalVariableDebt', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'variableBorrowRate', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'averageStableBorrowRate', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'user', type: 'address' },
    ],
    name: 'getUserReserveData',
    outputs: [
      { name: 'currentATokenBalance', type: 'uint256' },
      { name: 'currentStableDebt', type: 'uint256' },
      { name: 'currentVariableDebt', type: 'uint256' },
      { name: 'principalStableDebt', type: 'uint256' },
      { name: 'scaledVariableDebt', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'stableRateLastUpdated', type: 'uint40' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const WETH_ADDRESS: Record<number, Address> = {
  [mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  [polygon.id]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  [arbitrum.id]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  [optimism.id]: '0x4200000000000000000000000000000000000006',
  [base.id]: '0x4200000000000000000000000000000000000006',
  [sepolia.id]: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
};
