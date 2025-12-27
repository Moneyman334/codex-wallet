import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import type { Address, Hash } from "viem";

export const STAKING_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export const STAKING_ABI = [
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "getStake",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "unstake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

const sepoliaChainIdHex = "0xaa36a7";

export function isContractConfigured(): boolean {
  return STAKING_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
}

export function getContractAddress(): string {
  return STAKING_CONTRACT_ADDRESS;
}

export async function ensureSepoliaNetwork(): Promise<void> {
  if (!window.ethereum) throw new Error("No wallet provider found");

  const current = await window.ethereum.request({ method: "eth_chainId" });

  if (current === sepoliaChainIdHex) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: sepoliaChainIdHex }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: sepoliaChainIdHex,
            chainName: "Sepolia Testnet",
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
            nativeCurrency: {
              name: "SepoliaETH",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function getConnectedAddress(): Promise<Address> {
  if (!window.ethereum) throw new Error("No wallet provider found");

  const accounts: string[] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || !accounts[0]) {
    throw new Error("No accounts returned from wallet");
  }

  return accounts[0] as Address;
}

export async function getWalletClient() {
  if (!window.ethereum) throw new Error("No wallet provider found");

  const account = await getConnectedAddress();

  return createWalletClient({
    account,
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

export function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org"),
  });
}

export async function stakeFixedAmount(
  amountEth: string = "0.01"
): Promise<Hash> {
  if (!isContractConfigured()) {
    throw new Error("Staking contract not configured. Please deploy the contract and update the address in stakingClient.ts");
  }

  await ensureSepoliaNetwork();

  const walletClient = await getWalletClient();

  const hash = await walletClient.writeContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "stake",
    value: parseEther(amountEth),
  });

  return hash;
}

export async function unstakeETH(amountEth: string): Promise<Hash> {
  if (!isContractConfigured()) {
    throw new Error("Staking contract not configured. Please deploy the contract and update the address in stakingClient.ts");
  }

  await ensureSepoliaNetwork();

  const walletClient = await getWalletClient();

  const hash = await walletClient.writeContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "unstake",
    args: [parseEther(amountEth)],
  });

  return hash;
}

export async function fetchUserStake(user?: string | Address) {
  if (!isContractConfigured()) {
    return { amountEth: 0, lastUpdated: 0 };
  }

  const publicClient = getPublicClient();
  const address = user ? (user as Address) : (await getConnectedAddress());

  const [amount, lastUpdated] = (await publicClient.readContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "getStake",
    args: [address],
  })) as readonly [bigint, bigint];

  return {
    amountEth: Number(formatEther(amount)),
    lastUpdated: Number(lastUpdated),
  };
}

export async function waitForTransaction(hash: Hash): Promise<boolean> {
  const publicClient = getPublicClient();

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
  });

  return receipt.status === "success";
}

export function getSepoliaExplorerUrl(hash: Hash): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export const stakeETH = stakeFixedAmount;
