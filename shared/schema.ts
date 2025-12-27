import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(), // Optional: allows both email and username login
  password: text("password").notNull(),
  isOwner: text("is_owner").notNull().default("false"),
  demoBalance: text("demo_balance").default("50.00"), // $50 demo money for new users
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  autoLoginEnabled: text("auto_login_enabled").notNull().default("false"),
  autoConnectEnabled: text("auto_connect_enabled").notNull().default("false"),
  lastWalletId: text("last_wallet_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("user_preferences_user_idx").on(table.userId),
}));

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  balance: text("balance").default("0"), // Store as wei (string to avoid precision loss)
  network: text("network").notNull().default("mainnet"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  addressLowerIdx: index("wallets_address_lower_idx").on(sql`lower(${table.address})`),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hash: text("hash").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: text("amount").notNull(), // Store as wei (string to avoid precision loss)
  gasPrice: text("gas_price"), // Store as wei string
  gasUsed: text("gas_used"), // Store as gas units string
  fee: text("fee"), // Store as wei string
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  network: text("network").notNull().default("mainnet"),
  blockNumber: text("block_number"), // Store as string to avoid overflow
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => ({
  fromAddressLowerIdx: index("transactions_from_address_lower_idx").on(sql`lower(${table.fromAddress})`),
  toAddressLowerIdx: index("transactions_to_address_lower_idx").on(sql`lower(${table.toAddress})`),
  timestampIdx: index("transactions_timestamp_idx").on(table.timestamp),
}));

export const networkInfo = pgTable("network_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull().unique(),
  name: text("name").notNull(),
  rpcUrl: text("rpc_url").notNull(),
  blockExplorerUrl: text("block_explorer_url"),
  symbol: text("symbol").notNull().default("ETH"),
  decimals: text("decimals").notNull().default("18"), // Store as string
  isTestnet: text("is_testnet").notNull().default("false"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// PLATFORM REVENUE TRACKING
// ============================================================================

export const platformRevenue = pgTable("platform_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  revenueType: text("revenue_type").notNull(), // dex, codexPay, nft, subscription, trading, launchpad, bridge
  amount: text("amount").notNull(), // Total transaction amount
  feeAmount: text("fee_amount").notNull(), // Platform fee collected
  netAmount: text("net_amount").notNull(), // Amount after fees
  currency: text("currency").notNull().default("USD"),
  walletAddress: text("wallet_address").notNull(), // Platform wallet that received fees
  txHash: text("tx_hash"), // Blockchain transaction hash (if applicable)
  merchantId: varchar("merchant_id"), // For CODEX Pay transactions
  customerId: text("customer_id"), // For subscription/payment tracking
  metadata: jsonb("metadata"), // Additional details
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("platform_revenue_type_idx").on(table.revenueType),
  walletIdx: index("platform_revenue_wallet_idx").on(sql`lower(${table.walletAddress})`),
  createdAtIdx: index("platform_revenue_created_at_idx").on(table.createdAt),
  txHashIdx: index("platform_revenue_tx_hash_idx").on(table.txHash),
}));

export const insertPlatformRevenueSchema = createInsertSchema(platformRevenue).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformRevenue = z.infer<typeof insertPlatformRevenueSchema>;
export type PlatformRevenue = typeof platformRevenue.$inferSelect;

// ============================================================================
// INSTANT SETTLEMENTS - Beats Coinbase 24-48h delays
// ============================================================================

export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  crypto: text("crypto").notNull(), // ETH, BTC, SOL, etc.
  amount: text("amount").notNull(), // Settlement amount
  destination: text("destination").notNull(), // Destination address
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  txHash: text("tx_hash"), // Blockchain transaction hash
  settlementTime: text("settlement_time"), // Time taken in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  walletAddressIdx: index("settlements_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("settlements_status_idx").on(table.status),
  createdAtIdx: index("settlements_created_at_idx").on(table.createdAt),
}));

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").notNull(),
  chainId: text("chain_id").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: text("decimals").notNull().default("18"), // Store as string
  logoUrl: text("logo_url"),
  isVerified: text("is_verified").notNull().default("false"),
  totalSupply: text("total_supply"), // Store as string to avoid precision loss
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractChainIdx: index("tokens_contract_chain_idx").on(table.contractAddress, table.chainId),
  contractLowerIdx: index("tokens_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  symbolIdx: index("tokens_symbol_idx").on(table.symbol),
  chainIdx: index("tokens_chain_idx").on(table.chainId),
}));

export const tokenBalances = pgTable("token_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  balance: text("balance").notNull().default("0"), // Store as string to avoid precision loss
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  walletTokenIdx: index("token_balances_wallet_token_idx").on(table.walletAddress, table.tokenId),
  walletLowerIdx: index("token_balances_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  lastUpdatedIdx: index("token_balances_last_updated_idx").on(table.lastUpdated),
}));

export const userTokens = pgTable("user_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  isHidden: text("is_hidden").notNull().default("false"),
  sortOrder: text("sort_order").default("0"), // For custom ordering
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  userWalletTokenIdx: index("user_tokens_user_wallet_token_idx").on(table.userId, table.walletAddress, table.tokenId),
  userWalletIdx: index("user_tokens_user_wallet_idx").on(table.userId, table.walletAddress),
  walletLowerIdx: index("user_tokens_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
}));

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  chainId: text("chain_id").notNull(),
  name: text("name").notNull(),
  abi: jsonb("abi").notNull(), // Store the contract ABI as JSON
  tags: text("tags").array().default(sql`'{}'::text[]`), // Contract categories/tags
  description: text("description"),
  isVerified: text("is_verified").notNull().default("false"),
  sourceCode: text("source_code"), // Optional verified source code
  compiler: text("compiler"), // Compiler version used
  userId: varchar("user_id").references(() => users.id), // User who added this contract
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  addressChainIdx: index("contracts_address_chain_idx").on(table.address, table.chainId),
  addressLowerIdx: index("contracts_address_lower_idx").on(sql`lower(${table.address})`),
  chainIdx: index("contracts_chain_idx").on(table.chainId),
  userIdx: index("contracts_user_idx").on(table.userId),
  tagsIdx: index("contracts_tags_idx").on(table.tags),
}));

export const contractCalls = pgTable("contract_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  functionName: text("function_name").notNull(),
  functionSelector: text("function_selector"), // 4-byte function selector
  args: jsonb("args"), // Function arguments as JSON
  fromAddress: text("from_address").notNull(), // Who called the function
  toAddress: text("to_address").notNull(), // Contract address
  txHash: text("tx_hash").unique(), // Transaction hash if it's a write call
  status: text("status").notNull().default("pending"), // pending, confirmed, failed, reverted
  blockNumber: text("block_number"), // Block number if confirmed
  gasUsed: text("gas_used"), // Gas used for the transaction
  gasPrice: text("gas_price"), // Gas price paid
  value: text("value").default("0"), // ETH/native token value sent
  returnData: jsonb("return_data"), // Decoded return data for read calls
  error: text("error"), // Error message if failed
  chainId: text("chain_id").notNull(),
  callType: text("call_type").notNull().default("read"), // read, write, estimate
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_calls_contract_idx").on(table.contractId),
  fromAddressLowerIdx: index("contract_calls_from_address_lower_idx").on(sql`lower(${table.fromAddress})`),
  txHashIdx: index("contract_calls_tx_hash_idx").on(table.txHash),
  statusIdx: index("contract_calls_status_idx").on(table.status),
  chainIdx: index("contract_calls_chain_idx").on(table.chainId),
  createdAtIdx: index("contract_calls_created_at_idx").on(table.createdAt),
  functionIdx: index("contract_calls_function_idx").on(table.functionName),
}));

export const contractEventSubs = pgTable("contract_event_subs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  eventName: text("event_name").notNull(),
  eventSignature: text("event_signature"), // Event signature hash
  indexedFilters: jsonb("indexed_filters"), // Filters for indexed parameters
  fromBlock: text("from_block").default("latest"), // Starting block for monitoring
  toBlock: text("to_block"), // Ending block (null for ongoing)
  isActive: text("is_active").notNull().default("true"),
  userId: varchar("user_id").references(() => users.id), // User who created this subscription
  webhookUrl: text("webhook_url"), // Optional webhook for notifications
  lastProcessedBlock: text("last_processed_block"), // Track processed blocks
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_event_subs_contract_idx").on(table.contractId),
  eventIdx: index("contract_event_subs_event_idx").on(table.eventName),
  activeIdx: index("contract_event_subs_active_idx").on(table.isActive),
  userIdx: index("contract_event_subs_user_idx").on(table.userId),
  lastBlockIdx: index("contract_event_subs_last_block_idx").on(table.lastProcessedBlock),
}));

export const contractEvents = pgTable("contract_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  subscriptionId: varchar("subscription_id").references(() => contractEventSubs.id),
  eventName: text("event_name").notNull(),
  eventSignature: text("event_signature"),
  args: jsonb("args").notNull(), // Decoded event arguments
  txHash: text("tx_hash").notNull(),
  blockNumber: text("block_number").notNull(),
  blockHash: text("block_hash"),
  logIndex: text("log_index").notNull(), // Position of log in block
  chainId: text("chain_id").notNull(),
  fromAddress: text("from_address"), // Transaction sender
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_events_contract_idx").on(table.contractId),
  subscriptionIdx: index("contract_events_subscription_idx").on(table.subscriptionId),
  txHashIdx: index("contract_events_tx_hash_idx").on(table.txHash),
  blockIdx: index("contract_events_block_idx").on(table.blockNumber),
  chainIdx: index("contract_events_chain_idx").on(table.chainId),
  timestampIdx: index("contract_events_timestamp_idx").on(table.timestamp),
  eventIdx: index("contract_events_event_idx").on(table.eventName),
}));

export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  name: text("name").notNull(),
  slug: text("slug"),
  symbol: text("symbol"),
  imageUrl: text("image_url"),
  bannerImageUrl: text("banner_image_url"),
  description: text("description"),
  externalUrl: text("external_url"),
  isVerified: text("is_verified").notNull().default("false"),
  totalSupply: text("total_supply"),
  floorPrice: text("floor_price"), // Store as string to avoid precision loss
  openseaSlug: text("opensea_slug"),
  contractStandard: text("contract_standard").notNull().default("ERC721"), // ERC721, ERC1155
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractChainIdx: index("nft_collections_contract_chain_idx").on(table.contractAddress, table.chainId),
  contractLowerIdx: index("nft_collections_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  chainIdx: index("nft_collections_chain_idx").on(table.chainId),
  slugIdx: index("nft_collections_slug_idx").on(table.slug),
  verifiedIdx: index("nft_collections_verified_idx").on(table.isVerified),
  standardIdx: index("nft_collections_standard_idx").on(table.contractStandard),
}));

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(), // Store as string to handle large numbers
  standard: text("standard").notNull().default("ERC721"), // ERC721, ERC1155
  name: text("name"),
  description: text("description"),
  imageUrl: text("image_url"),
  imageThumbnailUrl: text("image_thumbnail_url"),
  animationUrl: text("animation_url"),
  externalUrl: text("external_url"),
  attributes: jsonb("attributes"), // Array of trait objects
  metadata: jsonb("metadata"), // Full metadata from tokenURI
  tokenUri: text("token_uri"),
  collectionId: varchar("collection_id").references(() => nftCollections.id),
  rarity: text("rarity"), // Common, Uncommon, Rare, Epic, Legendary
  rarityRank: text("rarity_rank"), // Numeric rank as string
  lastRefreshed: timestamp("last_refreshed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractTokenIdx: index("nfts_contract_token_idx").on(table.contractAddress, table.tokenId, table.chainId),
  contractLowerIdx: index("nfts_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  chainIdx: index("nfts_chain_idx").on(table.chainId),
  collectionIdx: index("nfts_collection_idx").on(table.collectionId),
  nameIdx: index("nfts_name_idx").on(table.name),
  standardIdx: index("nfts_standard_idx").on(table.standard),
  rarityIdx: index("nfts_rarity_idx").on(table.rarity),
  lastRefreshedIdx: index("nfts_last_refreshed_idx").on(table.lastRefreshed),
}));

export const nftOwnerships = pgTable("nft_ownerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  nftId: varchar("nft_id").notNull().references(() => nfts.id),
  balance: text("balance").notNull().default("1"), // For ERC1155 support, store as string
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  isHidden: text("is_hidden").notNull().default("false"),
  acquisitionDate: timestamp("acquisition_date"),
  acquisitionPrice: text("acquisition_price"), // Store as wei string
  acquisitionCurrency: text("acquisition_currency"), // ETH, MATIC, etc.
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  walletNftIdx: index("nft_ownerships_wallet_nft_idx").on(table.walletAddress, table.nftId),
  walletLowerIdx: index("nft_ownerships_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  chainIdx: index("nft_ownerships_chain_idx").on(table.chainId),
  contractTokenIdx: index("nft_ownerships_contract_token_idx").on(table.contractAddress, table.tokenId),
  lastUpdatedIdx: index("nft_ownerships_last_updated_idx").on(table.lastUpdated),
  hiddenIdx: index("nft_ownerships_hidden_idx").on(table.isHidden),
}));

export const insertNftCollectionSchema = createInsertSchema(nftCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRefreshed: true,
});

export const insertNftOwnershipSchema = createInsertSchema(nftOwnerships).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkInfoSchema = createInsertSchema(networkInfo).omit({
  id: true,
  updatedAt: true,
});

export const insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenBalanceSchema = createInsertSchema(tokenBalances).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserTokenSchema = createInsertSchema(userTokens).omit({
  id: true,
  addedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractCallSchema = createInsertSchema(contractCalls).omit({
  id: true,
  createdAt: true,
});

export const insertContractEventSubSchema = createInsertSchema(contractEventSubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractEventSchema = createInsertSchema(contractEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertNetworkInfo = z.infer<typeof insertNetworkInfoSchema>;
export type NetworkInfo = typeof networkInfo.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Settlement = typeof settlements.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;
export type InsertTokenBalance = z.infer<typeof insertTokenBalanceSchema>;
export type TokenBalance = typeof tokenBalances.$inferSelect;
export type InsertUserToken = z.infer<typeof insertUserTokenSchema>;
export type UserToken = typeof userTokens.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContractCall = z.infer<typeof insertContractCallSchema>;
export type ContractCall = typeof contractCalls.$inferSelect;
export type InsertContractEventSub = z.infer<typeof insertContractEventSubSchema>;
export type ContractEventSub = typeof contractEventSubs.$inferSelect;
export type InsertContractEvent = z.infer<typeof insertContractEventSchema>;
export type ContractEvent = typeof contractEvents.$inferSelect;
export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type NftCollection = typeof nftCollections.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertNftOwnership = z.infer<typeof insertNftOwnershipSchema>;
export type NftOwnership = typeof nftOwnerships.$inferSelect;

export const botStrategies = pgTable("bot_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  strategyType: text("strategy_type").notNull(), // trend, momentum, arbitrage, grid, dca
  icon: text("icon").notNull().default("🤖"),
  isActive: text("is_active").notNull().default("true"),
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high
  minInvestment: text("min_investment").notNull().default("100"),
  expectedReturn: text("expected_return").default("0"),
  config: jsonb("config").notNull(), // Strategy-specific parameters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("bot_strategies_type_idx").on(table.strategyType),
  activeIdx: index("bot_strategies_active_idx").on(table.isActive),
}));

export const botSubscriptions = pgTable("bot_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  planType: text("plan_type").notNull(), // starter, pro, elite
  status: text("status").notNull().default("active"), // active, paused, cancelled, expired
  startDate: timestamp("start_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentTxHash: text("payment_tx_hash"), // Crypto payment transaction hash
  maxActiveStrategies: text("max_active_strategies").notNull().default("1"),
  maxDailyTrades: text("max_daily_trades").notNull().default("10"),
  features: jsonb("features").notNull(), // List of enabled features
  autoRenew: text("auto_renew").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_subscriptions_user_idx").on(table.userId),
  statusIdx: index("bot_subscriptions_status_idx").on(table.status),
  expiryIdx: index("bot_subscriptions_expiry_idx").on(table.expiryDate),
}));

export const botUserConfigs = pgTable("bot_user_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").notNull().references(() => botSubscriptions.id),
  coinbaseApiKey: text("coinbase_api_key"), // Encrypted
  coinbaseApiSecret: text("coinbase_api_secret"), // Encrypted
  coinbasePassphrase: text("coinbase_passphrase"), // Encrypted
  isConnected: text("is_connected").notNull().default("false"),
  maxPositionSize: text("max_position_size").notNull().default("1000"), // Max USD per trade
  maxDailyLoss: text("max_daily_loss").notNull().default("100"), // Max daily loss in USD
  stopLossPercent: text("stop_loss_percent").notNull().default("5"), // Percentage
  takeProfitPercent: text("take_profit_percent").notNull().default("10"), // Percentage
  enableNotifications: text("enable_notifications").notNull().default("true"),
  notificationEmail: text("notification_email"),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_user_configs_user_idx").on(table.userId),
  subscriptionIdx: index("bot_user_configs_subscription_idx").on(table.subscriptionId),
  connectedIdx: index("bot_user_configs_connected_idx").on(table.isConnected),
}));

export const botActiveStrategies = pgTable("bot_active_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  strategyId: varchar("strategy_id").notNull().references(() => botStrategies.id),
  configId: varchar("config_id").notNull().references(() => botUserConfigs.id),
  status: text("status").notNull().default("active"), // active, paused, stopped
  tradingPairs: text("trading_pairs").array().notNull(), // ["BTC-USD", "ETH-USD"]
  allocatedCapital: text("allocated_capital").notNull(), // USD amount allocated
  currentProfit: text("current_profit").notNull().default("0"),
  totalTrades: text("total_trades").notNull().default("0"),
  winRate: text("win_rate").notNull().default("0"),
  customConfig: jsonb("custom_config"), // User overrides for strategy params
  startedAt: timestamp("started_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  stoppedAt: timestamp("stopped_at"),
  lastTradeAt: timestamp("last_trade_at"),
}, (table) => ({
  userIdx: index("bot_active_strategies_user_idx").on(table.userId),
  strategyIdx: index("bot_active_strategies_strategy_idx").on(table.strategyId),
  statusIdx: index("bot_active_strategies_status_idx").on(table.status),
  lastTradeIdx: index("bot_active_strategies_last_trade_idx").on(table.lastTradeAt),
}));

export const botTrades = pgTable("bot_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activeStrategyId: varchar("active_strategy_id").notNull().references(() => botActiveStrategies.id),
  strategyId: varchar("strategy_id").notNull().references(() => botStrategies.id),
  tradingPair: text("trading_pair").notNull(), // BTC-USD
  side: text("side").notNull(), // buy, sell
  orderType: text("order_type").notNull(), // market, limit
  price: text("price").notNull(), // Execution price
  amount: text("amount").notNull(), // Crypto amount
  total: text("total").notNull(), // Total USD value
  fee: text("fee").notNull().default("0"),
  profit: text("profit"), // Realized profit/loss (for sell orders)
  profitClaimed: text("profit_claimed").notNull().default("false"), // Whether profit has been claimed
  claimedAt: timestamp("claimed_at"), // When profit was claimed
  status: text("status").notNull().default("pending"), // pending, filled, cancelled, failed
  coinbaseOrderId: text("coinbase_order_id").unique(),
  reason: text("reason"), // Why the trade was made
  metadata: jsonb("metadata"), // Additional trade data
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_trades_user_idx").on(table.userId),
  activeStrategyIdx: index("bot_trades_active_strategy_idx").on(table.activeStrategyId),
  strategyIdx: index("bot_trades_strategy_idx").on(table.strategyId),
  statusIdx: index("bot_trades_status_idx").on(table.status),
  pairIdx: index("bot_trades_pair_idx").on(table.tradingPair),
  createdAtIdx: index("bot_trades_created_at_idx").on(table.createdAt),
  executedAtIdx: index("bot_trades_executed_at_idx").on(table.executedAt),
}));

export const insertBotStrategySchema = createInsertSchema(botStrategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotSubscriptionSchema = createInsertSchema(botSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotUserConfigSchema = createInsertSchema(botUserConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotActiveStrategySchema = createInsertSchema(botActiveStrategies).omit({
  id: true,
  startedAt: true,
});

export const insertBotTradeSchema = createInsertSchema(botTrades).omit({
  id: true,
  createdAt: true,
});

export type InsertBotStrategy = z.infer<typeof insertBotStrategySchema>;
export type BotStrategy = typeof botStrategies.$inferSelect;
export type InsertBotSubscription = z.infer<typeof insertBotSubscriptionSchema>;
export type BotSubscription = typeof botSubscriptions.$inferSelect;
export type InsertBotUserConfig = z.infer<typeof insertBotUserConfigSchema>;
export type BotUserConfig = typeof botUserConfigs.$inferSelect;
export type InsertBotActiveStrategy = z.infer<typeof insertBotActiveStrategySchema>;
export type BotActiveStrategy = typeof botActiveStrategies.$inferSelect;
export type InsertBotTrade = z.infer<typeof insertBotTradeSchema>;
export type BotTrade = typeof botTrades.$inferSelect;

// Copy Trading System - Viral Growth Engine
export const traderProfiles = pgTable("trader_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isPublic: text("is_public").notNull().default("false"), // Can others copy?
  isVerified: text("is_verified").notNull().default("false"), // Verified trader badge
  totalReturn: text("total_return").notNull().default("0"), // Lifetime ROI %
  totalProfit: text("total_profit").notNull().default("0"), // Total profit in USD
  totalTrades: text("total_trades").notNull().default("0"),
  winRate: text("win_rate").notNull().default("0"), // Win percentage
  avgHoldTime: text("avg_hold_time").default("0"), // Average trade duration in hours
  riskScore: text("risk_score").notNull().default("5"), // 1-10 (1=conservative, 10=aggressive)
  totalFollowers: text("total_followers").notNull().default("0"),
  totalCopiedVolume: text("total_copied_volume").notNull().default("0"), // Total $ copied
  followerEarnings: text("follower_earnings").notNull().default("0"), // Earnings followers made
  revenueShare: text("revenue_share").notNull().default("0"), // Total earned from followers (10%)
  featuredStrategy: text("featured_strategy"), // Primary strategy name
  tradingPairs: text("trading_pairs").array().default(sql`ARRAY[]::text[]`), // Preferred pairs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastTradeAt: timestamp("last_trade_at"),
}, (table) => ({
  userIdx: index("trader_profiles_user_idx").on(table.userId),
  publicIdx: index("trader_profiles_public_idx").on(table.isPublic),
  verifiedIdx: index("trader_profiles_verified_idx").on(table.isVerified),
  returnIdx: index("trader_profiles_return_idx").on(table.totalReturn),
  followersIdx: index("trader_profiles_followers_idx").on(table.totalFollowers),
  updatedAtIdx: index("trader_profiles_updated_at_idx").on(table.updatedAt),
}));

export const copyRelationships = pgTable("copy_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  traderId: varchar("trader_id").notNull().references(() => users.id),
  traderProfileId: varchar("trader_profile_id").notNull().references(() => traderProfiles.id),
  status: text("status").notNull().default("active"), // active, paused, stopped
  copyAmount: text("copy_amount").notNull(), // USD amount to allocate per trade
  copyPercentage: text("copy_percentage").default("100"), // % of trader's position to copy (1-100)
  maxDailyCopies: text("max_daily_copies").default("10"), // Limit copies per day
  copiedTrades: text("copied_trades").notNull().default("0"),
  totalProfit: text("total_profit").notNull().default("0"), // Follower's profit from this trader
  totalVolume: text("total_volume").notNull().default("0"), // Total volume copied
  revenueShared: text("revenue_shared").notNull().default("0"), // Amount paid to trader (10%)
  startedAt: timestamp("started_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  stoppedAt: timestamp("stopped_at"),
  lastCopyAt: timestamp("last_copy_at"),
}, (table) => ({
  followerIdx: index("copy_relationships_follower_idx").on(table.followerId),
  traderIdx: index("copy_relationships_trader_idx").on(table.traderId),
  statusIdx: index("copy_relationships_status_idx").on(table.status),
  profitIdx: index("copy_relationships_profit_idx").on(table.totalProfit),
  uniqueCopy: index("copy_relationships_unique").on(table.followerId, table.traderId),
}));

export const copyTrades = pgTable("copy_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relationshipId: varchar("relationship_id").notNull().references(() => copyRelationships.id),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  traderId: varchar("trader_id").notNull().references(() => users.id),
  originalTradeId: varchar("original_trade_id").notNull().references(() => botTrades.id), // Trader's original trade
  followerTradeId: varchar("follower_trade_id").references(() => botTrades.id), // Follower's executed trade
  tradingPair: text("trading_pair").notNull(),
  side: text("side").notNull(), // buy, sell
  traderAmount: text("trader_amount").notNull(), // Trader's position size
  followerAmount: text("follower_amount").notNull(), // Follower's position size (scaled)
  traderPrice: text("trader_price").notNull(),
  followerPrice: text("follower_price"), // May differ slightly due to execution time
  followerProfit: text("follower_profit").default("0"), // Follower's P&L
  traderShare: text("trader_share").default("0"), // 10% of follower profit to trader
  platformFee: text("platform_fee").default("0"), // 5% platform fee
  copyPercentage: text("copy_percentage").notNull(), // % copied (for reference)
  status: text("status").notNull().default("pending"), // pending, executed, failed
  failureReason: text("failure_reason"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  relationshipIdx: index("copy_trades_relationship_idx").on(table.relationshipId),
  followerIdx: index("copy_trades_follower_idx").on(table.followerId),
  traderIdx: index("copy_trades_trader_idx").on(table.traderId),
  originalIdx: index("copy_trades_original_idx").on(table.originalTradeId),
  statusIdx: index("copy_trades_status_idx").on(table.status),
  createdAtIdx: index("copy_trades_created_at_idx").on(table.createdAt),
}));

// Futures/Margin Trading System
export const marginPositions = pgTable("margin_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tradingPair: text("trading_pair").notNull(), // BTC/USDT, ETH/USDT, etc.
  side: text("side").notNull(), // long, short
  leverage: text("leverage").notNull(), // 5, 10, 20
  entryPrice: text("entry_price").notNull(),
  currentPrice: text("current_price").notNull(),
  positionSize: text("position_size").notNull(), // Amount in base currency
  collateral: text("collateral").notNull(), // Margin posted
  liquidationPrice: text("liquidation_price").notNull(), // Auto-close price
  unrealizedPnl: text("unrealized_pnl").notNull().default("0"),
  realizedPnl: text("realized_pnl").default("0"),
  fees: text("fees").notNull().default("0"),
  status: text("status").notNull().default("open"), // open, closed, liquidated
  marginType: text("margin_type").notNull().default("isolated"), // isolated, cross
  stopLoss: text("stop_loss"), // Optional SL price
  takeProfit: text("take_profit"), // Optional TP price
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("margin_positions_user_idx").on(table.userId),
  pairIdx: index("margin_positions_pair_idx").on(table.tradingPair),
  statusIdx: index("margin_positions_status_idx").on(table.status),
  openedAtIdx: index("margin_positions_opened_at_idx").on(table.openedAt),
}));

export const leverageSettings = pgTable("leverage_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  maxLeverage: text("max_leverage").notNull().default("20"), // Max allowed leverage
  preferredLeverage: text("preferred_leverage").notNull().default("10"),
  marginMode: text("margin_mode").notNull().default("isolated"), // isolated, cross
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high
  autoDeleverageEnabled: text("auto_deleverage_enabled").notNull().default("true"),
  liquidationWarningEnabled: text("liquidation_warning_enabled").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("leverage_settings_user_idx").on(table.userId),
}));

export const liquidationHistory = pgTable("liquidation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => marginPositions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  tradingPair: text("trading_pair").notNull(),
  side: text("side").notNull(),
  leverage: text("leverage").notNull(),
  entryPrice: text("entry_price").notNull(),
  liquidationPrice: text("liquidation_price").notNull(),
  positionSize: text("position_size").notNull(),
  lossAmount: text("loss_amount").notNull(), // Total loss including collateral
  remainingCollateral: text("remaining_collateral").default("0"),
  liquidationType: text("liquidation_type").notNull().default("auto"), // auto, forced, manual
  liquidatedAt: timestamp("liquidated_at").defaultNow(),
}, (table) => ({
  userIdx: index("liquidation_history_user_idx").on(table.userId),
  positionIdx: index("liquidation_history_position_idx").on(table.positionId),
  liquidatedAtIdx: index("liquidation_history_liquidated_at_idx").on(table.liquidatedAt),
}));

export const insertTraderProfileSchema = createInsertSchema(traderProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTradeAt: true,
});

export const insertCopyRelationshipSchema = createInsertSchema(copyRelationships).omit({
  id: true,
  startedAt: true,
});

export const insertCopyTradeSchema = createInsertSchema(copyTrades).omit({
  id: true,
  createdAt: true,
});

export type InsertTraderProfile = z.infer<typeof insertTraderProfileSchema>;
export type TraderProfile = typeof traderProfiles.$inferSelect;
export type InsertCopyRelationship = z.infer<typeof insertCopyRelationshipSchema>;
export type CopyRelationship = typeof copyRelationships.$inferSelect;
export type InsertCopyTrade = z.infer<typeof insertCopyTradeSchema>;
export type CopyTrade = typeof copyTrades.$inferSelect;

// House Vaults - Player-Owned Liquidity System
export const houseVaults = pgTable("house_vaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tier: text("tier").notNull().default("standard"), // standard, premium, elite
  minStake: text("min_stake").notNull().default("0.1"), // Minimum ETH to stake
  apy: text("apy").notNull().default("15"), // Expected annual percentage yield
  totalStaked: text("total_staked").notNull().default("0"), // Total ETH staked
  totalEarnings: text("total_earnings").notNull().default("0"), // Total profit earned
  activePositions: text("active_positions").notNull().default("0"), // Number of active stakers
  status: text("status").notNull().default("active"), // active, paused, closed
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high
  lockPeriod: text("lock_period").default("0"), // Days before withdrawal allowed (0 = no lock)
  performanceFee: text("performance_fee").notNull().default("10"), // Percentage of profits taken as fee
  vaultAddress: text("vault_address").notNull(), // Ethereum address where ETH is sent
  chainId: text("chain_id").notNull().default("0x1"), // Network chain ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tierIdx: index("house_vaults_tier_idx").on(table.tier),
  statusIdx: index("house_vaults_status_idx").on(table.status),
  vaultAddressIdx: index("house_vaults_vault_address_idx").on(sql`lower(${table.vaultAddress})`),
}));

export const housePositions = pgTable("house_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id").notNull().references(() => houseVaults.id),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  stakedAmount: text("staked_amount").notNull(), // ETH amount staked
  shares: text("shares").notNull(), // Vault shares owned
  entryPrice: text("entry_price").notNull(), // Share price at entry
  currentValue: text("current_value").notNull().default("0"), // Current position value
  totalEarnings: text("total_earnings").notNull().default("0"), // Total earned
  claimedEarnings: text("claimed_earnings").notNull().default("0"), // Already claimed
  pendingEarnings: text("pending_earnings").notNull().default("0"), // Ready to claim
  status: text("status").notNull().default("active"), // active, withdrawn, locked, pending
  stakeTxHash: text("stake_tx_hash"), // Transaction hash for stake
  unstakeTxHash: text("unstake_tx_hash"), // Transaction hash for unstake
  stakedAt: timestamp("staked_at").notNull().defaultNow(),
  unlocksAt: timestamp("unlocks_at"), // When position can be withdrawn
  lastClaimAt: timestamp("last_claim_at"),
  withdrawnAt: timestamp("withdrawn_at"),
}, (table) => ({
  vaultIdx: index("house_positions_vault_idx").on(table.vaultId),
  walletIdx: index("house_positions_wallet_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("house_positions_user_idx").on(table.userId),
  statusIdx: index("house_positions_status_idx").on(table.status),
  stakedAtIdx: index("house_positions_staked_at_idx").on(table.stakedAt),
  stakeTxHashIdx: index("house_positions_stake_tx_hash_idx").on(table.stakeTxHash),
}));

export const houseDistributions = pgTable("house_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id").notNull().references(() => houseVaults.id),
  profitAmount: text("profit_amount").notNull(), // Total profit to distribute
  performanceFee: text("performance_fee").notNull(), // Fee amount taken
  netProfit: text("net_profit").notNull(), // Profit after fees
  totalShares: text("total_shares").notNull(), // Total shares at distribution time
  pricePerShare: text("price_per_share").notNull(), // Profit per share
  source: text("source").notNull(), // trading_profits, staking_rewards, etc
  positionsAffected: text("positions_affected").notNull().default("0"),
  distributedAt: timestamp("distributed_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional distribution details
}, (table) => ({
  vaultIdx: index("house_distributions_vault_idx").on(table.vaultId),
  distributedAtIdx: index("house_distributions_distributed_at_idx").on(table.distributedAt),
  sourceIdx: index("house_distributions_source_idx").on(table.source),
}));

export const houseEarnings = pgTable("house_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => housePositions.id),
  distributionId: varchar("distribution_id").notNull().references(() => houseDistributions.id),
  walletAddress: text("wallet_address").notNull(),
  earningAmount: text("earning_amount").notNull(), // Amount earned from this distribution
  shares: text("shares").notNull(), // Shares owned at distribution time
  status: text("status").notNull().default("pending"), // pending, claimed
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  positionIdx: index("house_earnings_position_idx").on(table.positionId),
  distributionIdx: index("house_earnings_distribution_idx").on(table.distributionId),
  walletIdx: index("house_earnings_wallet_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("house_earnings_status_idx").on(table.status),
  createdAtIdx: index("house_earnings_created_at_idx").on(table.createdAt),
}));

export const insertHouseVaultSchema = createInsertSchema(houseVaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHousePositionSchema = createInsertSchema(housePositions).omit({
  id: true,
  stakedAt: true,
});

export const insertHouseDistributionSchema = createInsertSchema(houseDistributions).omit({
  id: true,
  distributedAt: true,
});

export const insertHouseEarningSchema = createInsertSchema(houseEarnings).omit({
  id: true,
  createdAt: true,
});

export type InsertHouseVault = z.infer<typeof insertHouseVaultSchema>;
export type HouseVault = typeof houseVaults.$inferSelect;
export type InsertHousePosition = z.infer<typeof insertHousePositionSchema>;
export type HousePosition = typeof housePositions.$inferSelect;
export type InsertHouseDistribution = z.infer<typeof insertHouseDistributionSchema>;
export type HouseDistribution = typeof houseDistributions.$inferSelect;
export type InsertHouseEarning = z.infer<typeof insertHouseEarningSchema>;
export type HouseEarning = typeof houseEarnings.$inferSelect;

// Auto-Compounding Staking System
export const autoCompoundPools = pgTable("auto_compound_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tokenSymbol: text("token_symbol").notNull().default("ETH"),
  baseApy: text("base_apy").notNull(), // Base APY (e.g., "45.5" for 45.5%)
  compoundFrequency: text("compound_frequency").notNull().default("hourly"), // hourly, daily, weekly
  totalStaked: text("total_staked").notNull().default("0"),
  totalStakers: text("total_stakers").notNull().default("0"),
  minStake: text("min_stake").notNull().default("0.01"),
  maxStake: text("max_stake"), // null for unlimited
  earlyWithdrawPenalty: text("early_withdraw_penalty").notNull().default("2"), // % penalty
  lockPeriod: text("lock_period").notNull().default("0"), // Days, 0 for no lock
  status: text("status").notNull().default("active"), // active, paused, closed
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("auto_compound_pools_status_idx").on(table.status),
  tokenIdx: index("auto_compound_pools_token_idx").on(table.tokenSymbol),
}));

export const autoCompoundStakes = pgTable("auto_compound_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => autoCompoundPools.id),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  initialStake: text("initial_stake").notNull(), // Original stake amount
  currentBalance: text("current_balance").notNull(), // Current value with compounds
  totalEarned: text("total_earned").notNull().default("0"), // Total earnings
  compoundCount: text("compound_count").notNull().default("0"), // Number of compounds
  lastCompoundAt: timestamp("last_compound_at"),
  effectiveApy: text("effective_apy").notNull(), // Actual APY with compounds
  status: text("status").notNull().default("active"), // active, withdrawn
  stakedAt: timestamp("staked_at").notNull().defaultNow(),
  unlocksAt: timestamp("unlocks_at"), // When can withdraw without penalty
  withdrawnAt: timestamp("withdrawn_at"),
  withdrawnAmount: text("withdrawn_amount"),
}, (table) => ({
  poolIdx: index("auto_compound_stakes_pool_idx").on(table.poolId),
  walletIdx: index("auto_compound_stakes_wallet_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("auto_compound_stakes_user_idx").on(table.userId),
  statusIdx: index("auto_compound_stakes_status_idx").on(table.status),
  stakedAtIdx: index("auto_compound_stakes_staked_at_idx").on(table.stakedAt),
}));

export const compoundEvents = pgTable("compound_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stakeId: varchar("stake_id").notNull().references(() => autoCompoundStakes.id),
  poolId: varchar("pool_id").notNull().references(() => autoCompoundPools.id),
  walletAddress: text("wallet_address").notNull(),
  balanceBefore: text("balance_before").notNull(),
  balanceAfter: text("balance_after").notNull(),
  rewardAmount: text("reward_amount").notNull(), // Net amount compounded (after fee)
  platformFee: text("platform_fee").default("0"), // Platform performance fee collected
  apyAtCompound: text("apy_at_compound").notNull(), // APY rate at time of compound
  compoundedAt: timestamp("compounded_at").notNull().defaultNow(),
}, (table) => ({
  stakeIdx: index("compound_events_stake_idx").on(table.stakeId),
  poolIdx: index("compound_events_pool_idx").on(table.poolId),
  walletIdx: index("compound_events_wallet_idx").on(sql`lower(${table.walletAddress})`),
  compoundedAtIdx: index("compound_events_compounded_at_idx").on(table.compoundedAt),
}));

export const insertAutoCompoundPoolSchema = createInsertSchema(autoCompoundPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutoCompoundStakeSchema = createInsertSchema(autoCompoundStakes).omit({
  id: true,
  stakedAt: true,
});

export const insertCompoundEventSchema = createInsertSchema(compoundEvents).omit({
  id: true,
  compoundedAt: true,
});

export type InsertAutoCompoundPool = z.infer<typeof insertAutoCompoundPoolSchema>;
export type AutoCompoundPool = typeof autoCompoundPools.$inferSelect;
export type InsertAutoCompoundStake = z.infer<typeof insertAutoCompoundStakeSchema>;
export type AutoCompoundStake = typeof autoCompoundStakes.$inferSelect;
export type InsertCompoundEvent = z.infer<typeof insertCompoundEventSchema>;
export type CompoundEvent = typeof compoundEvents.$inferSelect;

// Yield Farming System
export const yieldFarmPools = pgTable("yield_farm_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  token0: text("token0").notNull(), // First token in LP pair
  token1: text("token1").notNull(), // Second token in LP pair
  apy: text("apy").notNull(), // Annual Percentage Yield
  tvl: text("tvl").notNull().default("0"), // Total Value Locked
  rewardToken: text("reward_token").notNull(), // Token rewarded
  lockPeriod: text("lock_period").notNull().default("0"), // Days
  status: text("status").notNull().default("active"), // active, ended
  multiplier: text("multiplier").notNull().default("1"), // Reward multiplier
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("yield_farm_pools_status_idx").on(table.status),
}));

export const yieldFarmPositions = pgTable("yield_farm_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => yieldFarmPools.id),
  user: text("user").notNull(), // Wallet address
  amount: text("amount").notNull(), // LP tokens deposited
  rewards: text("rewards").notNull().default("0"), // Pending rewards
  depositDate: timestamp("deposit_date").notNull().defaultNow(),
  autoCompound: text("auto_compound").notNull().default("false"), // Auto-compound enabled
  harvestCount: text("harvest_count").notNull().default("0"), // Number of harvests
  totalRewardsEarned: text("total_rewards_earned").notNull().default("0"), // Total earned
  lastRewardUpdate: timestamp("last_reward_update").defaultNow(),
}, (table) => ({
  poolIdx: index("yield_farm_positions_pool_idx").on(table.poolId),
  userLowerIdx: index("yield_farm_positions_user_lower_idx").on(sql`lower(${table.user})`),
}));

export const insertYieldFarmPoolSchema = createInsertSchema(yieldFarmPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertYieldFarmPositionSchema = createInsertSchema(yieldFarmPositions).omit({
  id: true,
  depositDate: true,
  lastRewardUpdate: true,
});

export type InsertYieldFarmPool = z.infer<typeof insertYieldFarmPoolSchema>;
export type YieldFarmPool = typeof yieldFarmPools.$inferSelect;
export type InsertYieldFarmPosition = z.infer<typeof insertYieldFarmPositionSchema>;
export type YieldFarmPosition = typeof yieldFarmPositions.$inferSelect;

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  accessTokenSecret: text("access_token_secret"),
  isActive: text("is_active").notNull().default("true"),
  lastPostedAt: timestamp("last_posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("social_accounts_user_idx").on(table.userId),
  platformIdx: index("social_accounts_platform_idx").on(table.platform),
  activeIdx: index("social_accounts_active_idx").on(table.isActive),
}));

export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accountId: varchar("account_id").references(() => socialAccounts.id),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array().default(sql`'{}'::text[]`),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"),
  postType: text("post_type").notNull().default("auto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("scheduled_posts_user_idx").on(table.userId),
  accountIdx: index("scheduled_posts_account_idx").on(table.accountId),
  statusIdx: index("scheduled_posts_status_idx").on(table.status),
  scheduledForIdx: index("scheduled_posts_scheduled_for_idx").on(table.scheduledFor),
}));

export const postHistory = pgTable("post_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accountId: varchar("account_id").references(() => socialAccounts.id),
  scheduledPostId: varchar("scheduled_post_id").references(() => scheduledPosts.id),
  content: text("content").notNull(),
  platform: text("platform").notNull(),
  postUrl: text("post_url"),
  externalPostId: text("external_post_id"),
  status: text("status").notNull().default("success"),
  error: text("error"),
  engagement: jsonb("engagement"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("post_history_user_idx").on(table.userId),
  accountIdx: index("post_history_account_idx").on(table.accountId),
  platformIdx: index("post_history_platform_idx").on(table.platform),
  postedAtIdx: index("post_history_posted_at_idx").on(table.postedAt),
}));

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostHistorySchema = createInsertSchema(postHistory).omit({
  id: true,
  postedAt: true,
});

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertPostHistory = z.infer<typeof insertPostHistorySchema>;
export type PostHistory = typeof postHistory.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("digital"),
  category: text("category"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  cryptoPrices: jsonb("crypto_prices"),
  isActive: text("is_active").notNull().default("true"),
  stock: text("stock"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.category),
  activeIdx: index("products_active_idx").on(table.isActive),
  typeIdx: index("products_type_idx").on(table.type),
}));

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email"),
  customerWallet: text("customer_wallet"),
  status: text("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  shippingInfo: jsonb("shipping_info"),
  metadata: jsonb("metadata"),
  expectedCryptoAmount: text("expected_crypto_amount"),
  expectedChainId: text("expected_chain_id"),
  fxRateLocked: text("fx_rate_locked"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("orders_user_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  customerEmailIdx: index("orders_customer_email_idx").on(table.customerEmail),
  customerWalletLowerIdx: index("orders_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  paymentMethodIdx: index("orders_payment_method_idx").on(table.paymentMethod),
}));

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  paymentMethod: text("payment_method").notNull(),
  provider: text("provider").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  providerPaymentId: text("provider_payment_id"),
  providerResponse: jsonb("provider_response"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  confirmations: text("confirmations").default("0"),
  errorMessage: text("error_message"),
  paidAt: timestamp("paid_at"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("payments_order_idx").on(table.orderId),
  statusIdx: index("payments_status_idx").on(table.status),
  txHashIdx: index("payments_tx_hash_idx").on(table.txHash),
  providerPaymentIdIdx: index("payments_provider_payment_id_idx").on(table.providerPaymentId),
  methodIdx: index("payments_method_idx").on(table.paymentMethod),
  providerIdx: index("payments_provider_idx").on(table.provider),
  createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
}));

export const paymentWebhooks = pgTable("payment_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  eventType: text("event_type").notNull(),
  paymentId: varchar("payment_id").references(() => payments.id),
  payload: jsonb("payload").notNull(),
  signature: text("signature"),
  processed: text("processed").notNull().default("false"),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  providerIdx: index("payment_webhooks_provider_idx").on(table.provider),
  processedIdx: index("payment_webhooks_processed_idx").on(table.processed),
  paymentIdx: index("payment_webhooks_payment_idx").on(table.paymentId),
  createdAtIdx: index("payment_webhooks_created_at_idx").on(table.createdAt),
}));

// Supported Cryptocurrencies per Chain
export const supportedCurrencies = pgTable("supported_currencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // USDC, DAI, ETH, USDT
  name: text("name").notNull(),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address"), // null for native tokens
  decimals: text("decimals").notNull().default("18"),
  isStablecoin: text("is_stablecoin").notNull().default("false"),
  isActive: text("is_active").notNull().default("true"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  symbolChainIdx: index("supported_currencies_symbol_chain_idx").on(table.symbol, table.chainId),
  activeIdx: index("supported_currencies_active_idx").on(table.isActive),
}));

// Discount Codes
export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage, fixed
  value: decimal("value", { precision: 20, scale: 8 }).notNull(),
  minPurchase: decimal("min_purchase", { precision: 20, scale: 8 }),
  maxDiscount: decimal("max_discount", { precision: 20, scale: 8 }),
  usageLimit: text("usage_limit"), // null for unlimited
  usageCount: text("usage_count").notNull().default("0"),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: text("is_active").notNull().default("true"),
  applicableProducts: text("applicable_products").array(), // null for all products
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("discount_codes_code_idx").on(table.code),
  activeIdx: index("discount_codes_active_idx").on(table.isActive),
}));

// Gift Cards
export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  initialValue: decimal("initial_value", { precision: 20, scale: 8 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  purchasedBy: text("purchased_by"), // wallet address
  purchaseTxHash: text("purchase_tx_hash"),
  recipientEmail: text("recipient_email"),
  recipientWallet: text("recipient_wallet"),
  message: text("message"),
  status: text("status").notNull().default("active"), // active, redeemed, expired, cancelled
  expiresAt: timestamp("expires_at"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("gift_cards_code_idx").on(table.code),
  purchasedByLowerIdx: index("gift_cards_purchased_by_lower_idx").on(sql`lower(${table.purchasedBy})`),
  statusIdx: index("gift_cards_status_idx").on(table.status),
}));

// Gift Card Usage History
export const giftCardUsage = pgTable("gift_card_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  amountUsed: decimal("amount_used", { precision: 20, scale: 8 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 20, scale: 8 }).notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (table) => ({
  giftCardIdx: index("gift_card_usage_gift_card_idx").on(table.giftCardId),
  orderIdx: index("gift_card_usage_order_idx").on(table.orderId),
}));

// Loyalty Points System
export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  totalPoints: text("total_points").notNull().default("0"),
  availablePoints: text("available_points").notNull().default("0"),
  lifetimePoints: text("lifetime_points").notNull().default("0"),
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  tierNftMinted: text("tier_nft_minted").notNull().default("false"),
  tierNftTokenId: text("tier_nft_token_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("loyalty_accounts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  tierIdx: index("loyalty_accounts_tier_idx").on(table.tier),
}));

// Loyalty Transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => loyaltyAccounts.id),
  type: text("type").notNull(), // earned, redeemed, expired, bonus
  points: text("points").notNull(),
  balanceAfter: text("balance_after").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  description: text("description").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  accountIdx: index("loyalty_transactions_account_idx").on(table.accountId),
  orderIdx: index("loyalty_transactions_order_idx").on(table.orderId),
  typeIdx: index("loyalty_transactions_type_idx").on(table.type),
}));

// Customer Reviews (Blockchain-Verified Purchases)
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  walletAddress: text("wallet_address").notNull(),
  rating: text("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  verifiedPurchase: text("verified_purchase").notNull().default("true"),
  purchaseTxHash: text("purchase_tx_hash"),
  helpfulCount: text("helpful_count").notNull().default("0"),
  isApproved: text("is_approved").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_reviews_product_idx").on(table.productId),
  orderIdx: index("product_reviews_order_idx").on(table.orderId),
  walletLowerIdx: index("product_reviews_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  ratingIdx: index("product_reviews_rating_idx").on(table.rating),
}));

// Wishlists
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  walletProductIdx: index("wishlists_wallet_product_idx").on(table.walletAddress, table.productId),
  walletLowerIdx: index("wishlists_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  productIdx: index("wishlists_product_idx").on(table.productId),
}));

// Invoices / Payment Links
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  merchantWallet: text("merchant_wallet").notNull(),
  customerEmail: text("customer_email"),
  customerWallet: text("customer_wallet"),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 20, scale: 8 }).notNull(),
  tax: decimal("tax", { precision: 20, scale: 8 }).default("0"),
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  acceptedCurrencies: text("accepted_currencies").array(), // null for all
  status: text("status").notNull().default("unpaid"), // unpaid, paid, cancelled, expired
  orderId: varchar("order_id").references(() => orders.id),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
  merchantWalletLowerIdx: index("invoices_merchant_wallet_lower_idx").on(sql`lower(${table.merchantWallet})`),
  customerWalletLowerIdx: index("invoices_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("invoices_status_idx").on(table.status),
}));

// On-Chain NFT Receipts
export const nftReceipts = pgTable("nft_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  walletAddress: text("wallet_address").notNull(),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  tokenUri: text("token_uri"),
  mintTxHash: text("mint_tx_hash").notNull(),
  receiptData: jsonb("receipt_data").notNull(), // order details stored on-chain
  status: text("status").notNull().default("minting"), // minting, minted, failed
  mintedAt: timestamp("minted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("nft_receipts_order_idx").on(table.orderId),
  walletLowerIdx: index("nft_receipts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  mintTxHashIdx: index("nft_receipts_mint_tx_hash_idx").on(table.mintTxHash),
}));

// Refunds
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  refundTxHash: text("refund_tx_hash"),
  refundedTo: text("refunded_to"),
  processedBy: text("processed_by"), // admin wallet
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  orderIdx: index("refunds_order_idx").on(table.orderId),
  paymentIdx: index("refunds_payment_idx").on(table.paymentId),
  statusIdx: index("refunds_status_idx").on(table.status),
}));

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  billingInterval: text("billing_interval").notNull(), // daily, weekly, monthly, yearly
  trialDays: text("trial_days").default("0"),
  features: text("features").array(),
  maxSubscribers: text("max_subscribers"),
  isActive: text("is_active").notNull().default("true"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("subscription_plans_active_idx").on(table.isActive),
}));

// Customer Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  customerWallet: text("customer_wallet").notNull(),
  status: text("status").notNull().default("active"), // active, cancelled, expired, paused
  startDate: timestamp("start_date").notNull().defaultNow(),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  pausedAt: timestamp("paused_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("subscriptions_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("subscriptions_status_idx").on(table.status),
  nextBillingIdx: index("subscriptions_next_billing_idx").on(table.nextBillingDate),
}));

// Subscription Billing History
export const subscriptionBillings = pgTable("subscription_billings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, refunded
  txHash: text("tx_hash"),
  paymentMethod: text("payment_method"),
  billingDate: timestamp("billing_date").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  subscriptionIdx: index("subscription_billings_subscription_idx").on(table.subscriptionId),
  statusIdx: index("subscription_billings_status_idx").on(table.status),
}));

// Affiliate Program
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"), // percentage
  totalEarned: decimal("total_earned", { precision: 20, scale: 8 }).notNull().default("0"),
  pendingEarnings: decimal("pending_earnings", { precision: 20, scale: 8 }).notNull().default("0"),
  totalReferrals: text("total_referrals").notNull().default("0"),
  status: text("status").notNull().default("active"), // active, suspended, banned
  payoutWallet: text("payout_wallet"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("affiliates_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  referralCodeIdx: index("affiliates_referral_code_idx").on(table.referralCode),
  statusIdx: index("affiliates_status_idx").on(table.status),
}));

// Affiliate Referrals & Commissions
export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  referredWallet: text("referred_wallet").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  commissionAmount: decimal("commission_amount", { precision: 20, scale: 8 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  orderAmount: decimal("order_amount", { precision: 20, scale: 8 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, cancelled
  paidAt: timestamp("paid_at"),
  paidTxHash: text("paid_tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  affiliateIdx: index("affiliate_referrals_affiliate_idx").on(table.affiliateId),
  referredWalletLowerIdx: index("affiliate_referrals_referred_wallet_lower_idx").on(sql`lower(${table.referredWallet})`),
  statusIdx: index("affiliate_referrals_status_idx").on(table.status),
}));

// Product Variants (Size, Color, etc.)
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(), // e.g., "Large / Red"
  attributes: jsonb("attributes").notNull(), // { size: "L", color: "red" }
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 20, scale: 8 }),
  stock: text("stock").notNull().default("0"),
  lowStockThreshold: text("low_stock_threshold").default("5"),
  image: text("image"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_variants_product_idx").on(table.productId),
  skuIdx: index("product_variants_sku_idx").on(table.sku),
  activeIdx: index("product_variants_active_idx").on(table.isActive),
}));

// ============================================================================
// CHAOS PAY - Payment Processing System (100x Better Than Stripe)
// ============================================================================

// Merchant Accounts - Let users become payment processors
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  businessName: text("business_name").notNull(),
  businessEmail: text("business_email").notNull(),
  businessWebsite: text("business_website"),
  settlementWallet: varchar("settlement_wallet").notNull(), // Where merchant gets paid (99.5% after 0.5% fee)
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull().default("0.50"), // 0.5% (100x cheaper than Stripe's 2.9%)
  publishableKey: text("publishable_key"), // Hashed publishable API key (pk_live_...)
  secretKey: text("secret_key"), // Hashed secret API key (sk_live_...) - used for Bearer auth
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, rejected
  isActive: text("is_active").default("true"), // true or false as text
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("merchants_user_idx").on(table.userId),
  emailIdx: index("merchants_email_idx").on(table.businessEmail),
}));

// Beta Program Signups - Track merchant beta applications
export const codexPayBetaSignups = pgTable("codex_pay_beta_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  monthlyVolume: text("monthly_volume").notNull(),
  businessType: text("business_type").notNull(),
  useCase: text("use_case").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, converted
  notes: text("notes"), // Admin notes
  approvedAt: timestamp("approved_at"),
  convertedToMerchantId: varchar("converted_to_merchant_id").references(() => merchants.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("codex_pay_beta_signups_email_idx").on(table.email),
  statusIdx: index("codex_pay_beta_signups_status_idx").on(table.status),
  createdAtIdx: index("codex_pay_beta_signups_created_at_idx").on(table.createdAt),
}));

// API Keys - Developers integrate CODEX Pay
export const merchantApiKeys = pgTable("merchant_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  keyType: text("key_type").notNull(), // publishable, secret
  keyPrefix: text("key_prefix").notNull(), // pk_live_, sk_live_, pk_test_, sk_test_
  keyHash: text("key_hash").notNull().unique(), // Hashed API key
  environment: text("environment").notNull(), // test, live
  name: text("name"), // Optional name for organization
  permissions: text("permissions").array(), // read, write, refund, etc.
  isActive: text("is_active").notNull().default("true"),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  merchantIdx: index("merchant_api_keys_merchant_idx").on(table.merchantId),
  keyHashIdx: index("merchant_api_keys_key_hash_idx").on(table.keyHash),
  activeIdx: index("merchant_api_keys_active_idx").on(table.isActive),
}));

// Payment Intents - MVP version for rapid revenue generation
export const paymentIntents = pgTable("payment_intents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  checkoutUrl: text("checkout_url"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  merchantIdx: index("payment_intents_merchant_idx").on(table.merchantId),
  statusIdx: index("payment_intents_status_idx").on(table.status),
}));

// CODEX Pay Merchant Settlements - Track merchant payouts (99.5% after 0.5% fee)
export const codexPaySettlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  paymentIntentId: varchar("payment_intent_id").references(() => paymentIntents.id),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  merchantIdx: index("settlements_merchant_idx").on(table.merchantId),
  paymentIntentIdx: index("settlements_payment_intent_idx").on(table.paymentIntentId),
}));

// Merchant Customers - Saved customer data
export const merchantCustomers = pgTable("merchant_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  customerId: text("customer_id").notNull().unique(), // cus_xxxxxxxx
  email: text("email"),
  walletAddress: text("wallet_address"),
  name: text("name"),
  phone: text("phone"),
  defaultPaymentMethod: text("default_payment_method"), // crypto, card
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  merchantCustomerIdx: index("merchant_customers_merchant_customer_idx").on(table.merchantId, table.customerId),
  walletLowerIdx: index("merchant_customers_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  emailIdx: index("merchant_customers_email_idx").on(table.email),
}));

// Merchant Payouts - Instant settlements to merchants
export const merchantPayouts = pgTable("merchant_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  payoutId: text("payout_id").notNull().unique(), // po_xxxxxxxx
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  destination: text("destination").notNull(), // Wallet or bank account
  destinationType: text("destination_type").notNull(), // wallet, bank_account
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  txHash: text("tx_hash"), // On-chain settlement transaction
  failureReason: text("failure_reason"),
  method: text("method").notNull().default("instant"), // instant (crypto), standard (fiat)
  arrivalDate: timestamp("arrival_date"), // Instant for crypto, T+1 for fiat
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  merchantIdx: index("merchant_payouts_merchant_idx").on(table.merchantId),
  payoutIdIdx: index("merchant_payouts_payout_id_idx").on(table.payoutId),
  statusIdx: index("merchant_payouts_status_idx").on(table.status),
  createdAtIdx: index("merchant_payouts_created_at_idx").on(table.createdAt),
}));

// Merchant Analytics - Real-time insights
export const merchantAnalytics = pgTable("merchant_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  date: timestamp("date").notNull(),
  totalTransactions: text("total_transactions").notNull().default("0"),
  successfulTransactions: text("successful_transactions").notNull().default("0"),
  failedTransactions: text("failed_transactions").notNull().default("0"),
  totalVolume: text("total_volume").notNull().default("0"),
  currency: text("currency").notNull(),
  avgTransactionValue: text("avg_transaction_value").default("0"),
  totalFees: text("total_fees").notNull().default("0"),
  netRevenue: text("net_revenue").notNull().default("0"), // Volume - Fees
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  topPaymentMethod: text("top_payment_method"),
  uniqueCustomers: text("unique_customers").notNull().default("0"),
  metadata: jsonb("metadata"),
}, (table) => ({
  merchantDateIdx: index("merchant_analytics_merchant_date_idx").on(table.merchantId, table.date),
  dateIdx: index("merchant_analytics_date_idx").on(table.date),
}));

// Payment Links - Shareable payment pages (like Stripe Payment Links)
export const paymentLinks = pgTable("payment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id),
  linkId: text("link_id").notNull().unique(), // pl_xxxxxxxx
  slug: text("slug").notNull().unique(), // chaos.pay/pay/your-custom-slug
  name: text("name").notNull(),
  description: text("description"),
  amount: text("amount"), // null for customer-chooses-amount
  minAmount: text("min_amount"),
  maxAmount: text("max_amount"),
  currency: text("currency").notNull().default("USD"),
  acceptedCryptos: text("accepted_cryptos").array(),
  requireEmail: text("require_email").notNull().default("false"),
  requireShipping: text("require_shipping").notNull().default("false"),
  customFields: jsonb("custom_fields"), // Custom form fields
  successMessage: text("success_message"),
  redirectUrl: text("redirect_url"),
  isActive: text("is_active").notNull().default("true"),
  clickCount: text("click_count").notNull().default("0"),
  successCount: text("success_count").notNull().default("0"),
  totalRevenue: text("total_revenue").notNull().default("0"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  merchantIdx: index("payment_links_merchant_idx").on(table.merchantId),
  slugIdx: index("payment_links_slug_idx").on(table.slug),
  activeIdx: index("payment_links_active_idx").on(table.isActive),
}));

// ============================================================================
// EMPIRE API PLATFORM - Complete Developer API System
// ============================================================================

// Developer Accounts - Register as API developer (different from merchants)
export const developerAccounts = pgTable("developer_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  companyName: text("company_name"),
  website: text("website"),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, suspended, banned
  tier: text("tier").notNull().default("free"), // free, pro, enterprise
  monthlyRequestQuota: integer("monthly_request_quota").notNull().default(10000),
  requestsThisMonth: integer("requests_this_month").notNull().default(0),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("developer_accounts_email_idx").on(table.email),
  statusIdx: index("developer_accounts_status_idx").on(table.status),
  tierIdx: index("developer_accounts_tier_idx").on(table.tier),
}));

// API Keys - Platform-wide API access (wallets, trading, NFTs, staking, etc.)
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").notNull().references(() => developerAccounts.id, { onDelete: "cascade" }),
  keyType: text("key_type").notNull(), // publishable, secret
  keyPrefix: text("key_prefix").notNull(), // emp_pk_live_, emp_sk_live_, emp_pk_test_, emp_sk_test_
  keyHash: text("key_hash").notNull().unique(), // Hashed with bcrypt
  environment: text("environment").notNull(), // test, live
  name: text("name"), // User-friendly name
  permissions: text("permissions").array(), // wallets:read, wallets:write, trading:execute, nfts:buy, staking:create, etc.
  scopes: text("scopes").array(), // Specific feature scopes: read_wallets, write_transactions, execute_trades
  rateLimitTier: text("rate_limit_tier").notNull().default("standard"), // standard, premium, enterprise
  requestsPerMinute: integer("requests_per_minute").notNull().default(60),
  requestsPerDay: integer("requests_per_day").notNull().default(10000),
  requestsToday: integer("requests_today").notNull().default(0),
  isActive: text("is_active").notNull().default("true"),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  developerIdx: index("api_keys_developer_idx").on(table.developerId),
  keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash),
  activeIdx: index("api_keys_active_idx").on(table.isActive),
  environmentIdx: index("api_keys_environment_idx").on(table.environment),
}));

// Webhook Endpoints - Configure webhook URLs for all platform events
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").notNull().references(() => developerAccounts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  description: text("description"),
  secret: text("secret").notNull(), // For HMAC signature verification
  enabledEvents: text("enabled_events").array(), // wallet.created, transaction.completed, trade.executed, nft.purchased, etc.
  isActive: text("is_active").notNull().default("true"),
  version: text("version").notNull().default("v1"), // API version
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  developerIdx: index("webhook_endpoints_developer_idx").on(table.developerId),
  activeIdx: index("webhook_endpoints_active_idx").on(table.isActive),
}));

// Webhook Deliveries - Log of all webhook attempts
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  endpointId: varchar("endpoint_id").notNull().references(() => webhookEndpoints.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // wallet.created, transaction.completed, etc.
  eventId: text("event_id").notNull(), // UUID of the event
  payload: jsonb("payload").notNull(),
  signature: text("signature").notNull(), // HMAC signature
  status: text("status").notNull().default("pending"), // pending, delivered, failed
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  attemptCount: integer("attempt_count").notNull().default(1),
  maxAttempts: integer("max_attempts").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  endpointIdx: index("webhook_deliveries_endpoint_idx").on(table.endpointId),
  statusIdx: index("webhook_deliveries_status_idx").on(table.status),
  eventTypeIdx: index("webhook_deliveries_event_type_idx").on(table.eventType),
  createdAtIdx: index("webhook_deliveries_created_at_idx").on(table.createdAt),
}));

// API Usage Logs - Track all API requests for analytics
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  developerId: varchar("developer_id").notNull().references(() => developerAccounts.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(), // /api/v1/wallets, /api/v1/transactions, etc.
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  // 🔒 Enhanced Security Features - Office Location Tracking
  officeCity: text("office_city"), // Detected city from IP
  officeCountry: text("office_country"), // Detected country from IP
  officeRegion: text("office_region"), // Detected region/state from IP
  officeLatitude: decimal("office_latitude", { precision: 10, scale: 7 }), // Location coordinates
  officeLongitude: decimal("office_longitude", { precision: 10, scale: 7 }), // Location coordinates
  officeTimezone: text("office_timezone"), // Detected timezone
  // 🔒 Enhanced Security Features - Rate Timing Analytics
  requestHour: integer("request_hour"), // Hour of day (0-23) for timing patterns
  requestDayOfWeek: integer("request_day_of_week"), // Day of week (0-6) for pattern analysis
  requestTimingPattern: text("request_timing_pattern"), // business_hours, after_hours, weekend, night
  secondsSinceLastRequest: integer("seconds_since_last_request"), // Time delta for burst detection
  requestBurst: text("request_burst"), // normal, burst, suspicious (>10 req/sec)
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  apiKeyIdx: index("api_usage_logs_api_key_idx").on(table.apiKeyId),
  developerIdx: index("api_usage_logs_developer_idx").on(table.developerId),
  timestampIdx: index("api_usage_logs_timestamp_idx").on(table.timestamp),
  endpointIdx: index("api_usage_logs_endpoint_idx").on(table.endpoint),
  statusCodeIdx: index("api_usage_logs_status_code_idx").on(table.statusCode),
  officeCountryIdx: index("api_usage_logs_office_country_idx").on(table.officeCountry),
  requestTimingIdx: index("api_usage_logs_request_timing_idx").on(table.requestTimingPattern),
}));

// API Rate Limits - Track rate limiting per API key
export const apiRateLimits = pgTable("api_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  window: text("window").notNull(), // minute, hour, day
  requestCount: integer("request_count").notNull().default(0),
  limit: integer("limit").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  apiKeyWindowIdx: index("api_rate_limits_api_key_window_idx").on(table.apiKeyId, table.window),
  resetAtIdx: index("api_rate_limits_reset_at_idx").on(table.resetAt),
}));

// ============================================================================

// Flash Sales
export const flashSales = pgTable("flash_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 20, scale: 8 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxQuantity: text("max_quantity"), // total items available in sale
  soldQuantity: text("sold_quantity").notNull().default("0"),
  applicableProducts: text("applicable_products").array(), // product IDs
  status: text("status").notNull().default("scheduled"), // scheduled, active, ended, cancelled
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("flash_sales_status_idx").on(table.status),
  startTimeIdx: index("flash_sales_start_time_idx").on(table.startTime),
  endTimeIdx: index("flash_sales_end_time_idx").on(table.endTime),
}));

// Shopping Carts
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  customerWallet: text("customer_wallet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("carts_session_idx").on(table.sessionId),
  customerWalletLowerIdx: index("carts_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
}));

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  cartIdx: index("cart_items_cart_idx").on(table.cartId),
  productIdx: index("cart_items_product_idx").on(table.productId),
}));

// Abandoned Carts
export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  items: jsonb("items").notNull(), // array of { productId, quantity, price }
  subtotal: decimal("subtotal", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  recoveryEmailSent: text("recovery_email_sent").notNull().default("false"),
  recoveryEmailSentAt: timestamp("recovery_email_sent_at"),
  converted: text("converted").notNull().default("false"),
  convertedOrderId: varchar("converted_order_id").references(() => orders.id),
  convertedAt: timestamp("converted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("abandoned_carts_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  convertedIdx: index("abandoned_carts_converted_idx").on(table.converted),
  expiresAtIdx: index("abandoned_carts_expires_at_idx").on(table.expiresAt),
}));

// Customer Tiers (VIP, Wholesale, etc.)
export const customerTiers = pgTable("customer_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 20, scale: 8 }),
  benefits: text("benefits").array(),
  color: text("color").default("#3b82f6"),
  icon: text("icon"),
  priority: text("priority").notNull().default("0"), // higher = better tier
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("customer_tiers_active_idx").on(table.isActive),
  priorityIdx: index("customer_tiers_priority_idx").on(table.priority),
}));

// Customer Tier Assignments
export const customerTierAssignments = pgTable("customer_tier_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  tierId: varchar("tier_id").notNull().references(() => customerTiers.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  assignedBy: text("assigned_by"), // admin wallet or "auto"
  metadata: jsonb("metadata"),
}, (table) => ({
  customerWalletLowerIdx: index("customer_tier_assignments_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  tierIdx: index("customer_tier_assignments_tier_idx").on(table.tierId),
}));

// Product Recommendations
export const productRecommendations = pgTable("product_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  recommendedProductId: varchar("recommended_product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // cross_sell, upsell, related, bundle
  score: decimal("score", { precision: 5, scale: 2 }).default("1.0"), // relevance score
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_recommendations_product_idx").on(table.productId),
  typeIdx: index("product_recommendations_type_idx").on(table.type),
  activeIdx: index("product_recommendations_active_idx").on(table.isActive),
}));

// Pre-orders
export const preOrders = pgTable("pre_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  customerWallet: text("customer_wallet").notNull(),
  quantity: text("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  depositAmount: decimal("deposit_amount", { precision: 20, scale: 8 }), // partial payment
  depositPaid: text("deposit_paid").notNull().default("false"),
  depositTxHash: text("deposit_tx_hash"),
  status: text("status").notNull().default("pending"), // pending, confirmed, fulfilled, cancelled
  expectedReleaseDate: timestamp("expected_release_date"),
  fulfilledAt: timestamp("fulfilled_at"),
  orderId: varchar("order_id").references(() => orders.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("pre_orders_product_idx").on(table.productId),
  customerWalletLowerIdx: index("pre_orders_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("pre_orders_status_idx").on(table.status),
}));

// Recently Viewed Products
export const recentlyViewed = pgTable("recently_viewed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("recently_viewed_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  productIdx: index("recently_viewed_product_idx").on(table.productId),
  viewedAtIdx: index("recently_viewed_viewed_at_idx").on(table.viewedAt),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentWebhookSchema = createInsertSchema(paymentWebhooks).omit({
  id: true,
  createdAt: true,
});

export const insertSupportedCurrencySchema = createInsertSchema(supportedCurrencies).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardUsageSchema = createInsertSchema(giftCardUsage).omit({
  id: true,
  usedAt: true,
});

export const insertLoyaltyAccountSchema = createInsertSchema(loyaltyAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  addedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertNftReceiptSchema = createInsertSchema(nftReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPaymentWebhook = z.infer<typeof insertPaymentWebhookSchema>;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;

export type InsertSupportedCurrency = z.infer<typeof insertSupportedCurrencySchema>;
export type SupportedCurrency = typeof supportedCurrencies.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCardUsage = z.infer<typeof insertGiftCardUsageSchema>;
export type GiftCardUsage = typeof giftCardUsage.$inferSelect;
export type InsertLoyaltyAccount = z.infer<typeof insertLoyaltyAccountSchema>;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertNftReceipt = z.infer<typeof insertNftReceiptSchema>;
export type NftReceipt = typeof nftReceipts.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

// CODEX Pay Insert Schemas
export const insertCodexPayBetaSignupSchema = createInsertSchema(codexPayBetaSignups).omit({
  id: true,
  status: true,
  notes: true,
  approvedAt: true,
  convertedToMerchantId: true,
  createdAt: true,
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantApiKeySchema = createInsertSchema(merchantApiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentIntentSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantCustomerSchema = createInsertSchema(merchantCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantPayoutSchema = createInsertSchema(merchantPayouts).omit({
  id: true,
  createdAt: true,
});

export const insertMerchantAnalyticsSchema = createInsertSchema(merchantAnalytics).omit({
  id: true,
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CODEX Pay Types
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type MerchantApiKey = typeof merchantApiKeys.$inferSelect;
export type InsertMerchantApiKey = z.infer<typeof insertMerchantApiKeySchema>;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type MerchantCustomer = typeof merchantCustomers.$inferSelect;
export type InsertMerchantCustomer = z.infer<typeof insertMerchantCustomerSchema>;
export type MerchantPayout = typeof merchantPayouts.$inferSelect;
export type InsertMerchantPayout = z.infer<typeof insertMerchantPayoutSchema>;
export type MerchantAnalytics = typeof merchantAnalytics.$inferSelect;
export type InsertMerchantAnalytics = z.infer<typeof insertMerchantAnalyticsSchema>;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;

// Empire API Platform Insert Schemas
export const insertDeveloperAccountSchema = createInsertSchema(developerAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({
  id: true,
  createdAt: true,
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  timestamp: true,
});

export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits).omit({
  id: true,
  createdAt: true,
});

// Empire API Platform Types
export type DeveloperAccount = typeof developerAccounts.$inferSelect;
export type InsertDeveloperAccount = z.infer<typeof insertDeveloperAccountSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type InsertApiRateLimit = z.infer<typeof insertApiRateLimitSchema>;

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionBillingSchema = createInsertSchema(subscriptionBillings).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export const insertFlashSaleSchema = createInsertSchema(flashSales).omit({
  id: true,
  createdAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerTierSchema = createInsertSchema(customerTiers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerTierAssignmentSchema = createInsertSchema(customerTierAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertProductRecommendationSchema = createInsertSchema(productRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertPreOrderSchema = createInsertSchema(preOrders).omit({
  id: true,
  createdAt: true,
});

export const insertRecentlyViewedSchema = createInsertSchema(recentlyViewed).omit({
  id: true,
  viewedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscriptionBilling = z.infer<typeof insertSubscriptionBillingSchema>;
export type SubscriptionBilling = typeof subscriptionBillings.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliateReferral = z.infer<typeof insertAffiliateReferralSchema>;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertFlashSale = z.infer<typeof insertFlashSaleSchema>;
export type FlashSale = typeof flashSales.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;
export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type InsertCustomerTier = z.infer<typeof insertCustomerTierSchema>;
export type CustomerTier = typeof customerTiers.$inferSelect;
export type InsertCustomerTierAssignment = z.infer<typeof insertCustomerTierAssignmentSchema>;
export type CustomerTierAssignment = typeof customerTierAssignments.$inferSelect;
export type InsertProductRecommendation = z.infer<typeof insertProductRecommendationSchema>;
export type ProductRecommendation = typeof productRecommendations.$inferSelect;
export type InsertPreOrder = z.infer<typeof insertPreOrderSchema>;
export type PreOrder = typeof preOrders.$inferSelect;
export type InsertRecentlyViewed = z.infer<typeof insertRecentlyViewedSchema>;
export type RecentlyViewed = typeof recentlyViewed.$inferSelect;

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // social, email, paid_ads, content, influencer, partnership
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  budget: text("budget").notNull().default("0"), // Total budget
  spent: text("spent").notNull().default("0"), // Amount spent
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: text("target_audience"),
  channels: text("channels").array().default(sql`'{}'::text[]`), // twitter, telegram, discord, etc
  goals: jsonb("goals"), // {impressions: 10000, clicks: 500, conversions: 50}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignMetrics = pgTable("campaign_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id),
  impressions: text("impressions").notNull().default("0"),
  clicks: text("clicks").notNull().default("0"),
  conversions: text("conversions").notNull().default("0"),
  revenue: text("revenue").notNull().default("0"),
  ctr: text("ctr").notNull().default("0"), // Click-through rate
  conversionRate: text("conversion_rate").notNull().default("0"),
  roi: text("roi").notNull().default("0"), // Return on investment
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata"), // Additional platform-specific metrics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignIdx: index("campaign_metrics_campaign_idx").on(table.campaignId),
  dateIdx: index("campaign_metrics_date_idx").on(table.date),
}));

export const marketingBudgets = pgTable("marketing_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id),
  channel: text("channel").notNull(), // specific channel within campaign
  allocated: text("allocated").notNull().default("0"),
  spent: text("spent").notNull().default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignChannelIdx: index("marketing_budgets_campaign_channel_idx").on(table.campaignId, table.channel),
}));

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMetricSchema = createInsertSchema(campaignMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingBudgetSchema = createInsertSchema(marketingBudgets).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertCampaignMetric = z.infer<typeof insertCampaignMetricSchema>;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type InsertMarketingBudget = z.infer<typeof insertMarketingBudgetSchema>;
export type MarketingBudget = typeof marketingBudgets.$inferSelect;

// ===== WALLET SECURITY TABLES =====

export const walletSecurityPolicies = pgTable("wallet_security_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  multiSigEnabled: text("multi_sig_enabled").notNull().default("false"),
  hardwareWalletEnabled: text("hardware_wallet_enabled").notNull().default("false"),
  txSimulationEnabled: text("tx_simulation_enabled").notNull().default("true"),
  aiSentinelEnabled: text("ai_sentinel_enabled").notNull().default("true"),
  dailySpendingLimit: text("daily_spending_limit").default("10"), // In ETH
  requireApprovalAbove: text("require_approval_above").default("5"), // In ETH
  sessionTimeout: text("session_timeout").default("3600"), // In seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  walletLowerIdx: index("wallet_security_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("wallet_security_user_idx").on(table.userId),
}));

export const trustedAddresses = pgTable("trusted_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  trustedAddress: text("trusted_address").notNull(),
  label: text("label"), // Optional label for the address
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  walletTrustedIdx: index("trusted_addresses_wallet_trusted_idx").on(table.walletAddress, table.trustedAddress),
  walletLowerIdx: index("trusted_addresses_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  trustedLowerIdx: index("trusted_addresses_trusted_lower_idx").on(sql`lower(${table.trustedAddress})`),
}));

export const blockedAddresses = pgTable("blocked_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  blockedAddress: text("blocked_address").notNull(),
  reason: text("reason"), // Why was it blocked
  blockedAt: timestamp("blocked_at").defaultNow(),
}, (table) => ({
  walletBlockedIdx: index("blocked_addresses_wallet_blocked_idx").on(table.walletAddress, table.blockedAddress),
  walletLowerIdx: index("blocked_addresses_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  blockedLowerIdx: index("blocked_addresses_blocked_lower_idx").on(sql`lower(${table.blockedAddress})`),
}));

export const securityAlerts = pgTable("security_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(), // spending_limit, suspicious_tx, blocked_address, unusual_pattern
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional context
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  walletIdx: index("security_alerts_wallet_idx").on(table.walletAddress),
  walletLowerIdx: index("security_alerts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  typeIdx: index("security_alerts_type_idx").on(table.type),
  severityIdx: index("security_alerts_severity_idx").on(table.severity),
  createdAtIdx: index("security_alerts_created_at_idx").on(table.createdAt),
}));

export const transactionLimits = pgTable("transaction_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalSpent: text("total_spent").notNull().default("0"), // In ETH
  transactionCount: text("transaction_count").notNull().default("0"),
  limitReached: text("limit_reached").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  walletPeriodIdx: index("transaction_limits_wallet_period_idx").on(table.walletAddress, table.periodStart),
  walletLowerIdx: index("transaction_limits_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
}));

export const platformAddresses = pgTable("platform_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  label: text("label").notNull(),
  category: text("category").notNull(), // staking_pool, marketplace, vault, nft_collection
  description: text("description"),
  isActive: text("is_active").notNull().default("true"),
  addedBy: varchar("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  addressLowerIdx: index("platform_addresses_address_lower_idx").on(sql`lower(${table.address})`),
  categoryIdx: index("platform_addresses_category_idx").on(table.category),
  activeIdx: index("platform_addresses_active_idx").on(table.isActive),
}));

// Insert schemas
export const insertWalletSecurityPolicySchema = createInsertSchema(walletSecurityPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrustedAddressSchema = createInsertSchema(trustedAddresses).omit({
  id: true,
  addedAt: true,
});

export const insertBlockedAddressSchema = createInsertSchema(blockedAddresses).omit({
  id: true,
  blockedAt: true,
});

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionLimitSchema = createInsertSchema(transactionLimits).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformAddressSchema = createInsertSchema(platformAddresses).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertWalletSecurityPolicy = z.infer<typeof insertWalletSecurityPolicySchema>;
export type WalletSecurityPolicy = typeof walletSecurityPolicies.$inferSelect;
export type InsertTrustedAddress = z.infer<typeof insertTrustedAddressSchema>;
export type TrustedAddress = typeof trustedAddresses.$inferSelect;
export type InsertBlockedAddress = z.infer<typeof insertBlockedAddressSchema>;
export type BlockedAddress = typeof blockedAddresses.$inferSelect;
export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertTransactionLimit = z.infer<typeof insertTransactionLimitSchema>;
export type TransactionLimit = typeof transactionLimits.$inferSelect;
export type InsertPlatformAddress = z.infer<typeof insertPlatformAddressSchema>;
export type PlatformAddress = typeof platformAddresses.$inferSelect;

// ===== CODEX PLATFORM TOKEN & NFT ECOSYSTEM =====

// Platform Token (CODEX) - ERC-20 Governance & Utility Token
export const platformToken = pgTable("platform_token", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("CODEX"),
  symbol: text("symbol").notNull().default("CDX"),
  totalSupply: text("total_supply").notNull().default("1000000000"), // 1 billion tokens
  decimals: text("decimals").notNull().default("18"),
  contractAddress: text("contract_address"),
  chainId: text("chain_id").notNull().default("0x1"), // Ethereum mainnet
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Token Holdings - Track user balances
export const tokenHoldings = pgTable("token_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  balance: text("balance").notNull().default("0"),
  stakedBalance: text("staked_balance").notNull().default("0"),
  rewardsEarned: text("rewards_earned").notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("token_holdings_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  balanceIdx: index("token_holdings_balance_idx").on(table.balance),
}));

// Platform NFT Collections
export const platformNftCollections = pgTable("platform_nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  type: text("type").notNull(), // founder, elite, genesis, achievement
  contractAddress: text("contract_address"),
  chainId: text("chain_id").notNull().default("0x1"),
  totalSupply: text("total_supply").notNull(),
  maxSupply: text("max_supply"),
  baseUri: text("base_uri"),
  royaltyPercentage: text("royalty_percentage").default("5"), // 5%
  isDynamic: text("is_dynamic").notNull().default("false"), // Can evolve
  isTransferable: text("is_transferable").notNull().default("true"), // Soulbound if false
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  typeIdx: index("platform_nft_collections_type_idx").on(table.type),
  contractIdx: index("platform_nft_collections_contract_idx").on(table.contractAddress),
}));

// User NFTs - Individual token ownership
export const platformUserNfts = pgTable("platform_user_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => platformNftCollections.id),
  walletAddress: text("wallet_address").notNull(),
  tokenId: text("token_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  animationUrl: text("animation_url"),
  externalUrl: text("external_url"),
  attributes: jsonb("attributes"), // Standard NFT metadata attributes
  dynamicAttributes: jsonb("dynamic_attributes"), // AI-powered evolving attributes
  level: text("level").notNull().default("1"),
  experience: text("experience").notNull().default("0"),
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary, mythic
  powerScore: text("power_score").notNull().default("0"), // Overall NFT strength
  lastEvolutionAt: timestamp("last_evolution_at"),
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  collectionIdx: index("platform_user_nfts_collection_idx").on(table.collectionId),
  walletLowerIdx: index("platform_user_nfts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  tokenIdx: index("platform_user_nfts_token_idx").on(table.collectionId, table.tokenId),
  rarityIdx: index("platform_user_nfts_rarity_idx").on(table.rarity),
  levelIdx: index("platform_user_nfts_level_idx").on(table.level),
}));

// Memory of the Many - Relic Definitions
export const relicDefinitions = pgTable("relic_definitions", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  rarity: text("rarity").notNull(), // legendary, epic, rare, uncommon, common
  priceEth: text("price_eth").notNull(),
  maxSupply: text("max_supply").notNull(),
  currentSupply: text("current_supply").notNull().default("0"),
  attributes: jsonb("attributes").notNull(),
  collectionId: varchar("collection_id").references(() => platformNftCollections.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  rarityIdx: index("relic_definitions_rarity_idx").on(table.rarity),
  collectionIdx: index("relic_definitions_collection_idx").on(table.collectionId),
}));

// Memory of the Many - Relic Mints (tracks who minted what)
export const relicMints = pgTable("relic_mints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => relicDefinitions.id),
  userId: varchar("user_id").references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  tokenId: text("token_id").notNull(),
  status: text("status").notNull().default("simulated"), // simulated, onchain, failed
  txHash: text("tx_hash"),
  priceEthPaid: text("price_eth_paid").notNull(),
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
}, (table) => ({
  relicIdx: index("relic_mints_relic_idx").on(table.relicId),
  walletIdx: index("relic_mints_wallet_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("relic_mints_user_idx").on(table.userId),
  statusIdx: index("relic_mints_status_idx").on(table.status),
  uniqueWalletRelic: index("relic_mints_wallet_relic_unique").on(table.walletAddress, table.relicId),
}));

// Living Achievement System - Revolutionary dynamic NFTs
export const platformAchievements = pgTable("platform_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // trading, staking, gaming, social, governance
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  requiredActions: jsonb("required_actions").notNull(), // Conditions to unlock
  rewards: jsonb("rewards"), // Token rewards, power boosts, exclusive access
  imageUrl: text("image_url"),
  isActive: text("is_active").notNull().default("true"),
  unlockCount: text("unlock_count").notNull().default("0"), // How many users unlocked
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("platform_achievements_category_idx").on(table.category),
  tierIdx: index("platform_achievements_tier_idx").on(table.tier),
  activeIdx: index("platform_achievements_active_idx").on(table.isActive),
}));

// User Achievement Progress
export const platformUserAchievements = pgTable("platform_user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  achievementId: varchar("achievement_id").notNull().references(() => platformAchievements.id),
  nftId: varchar("nft_id").references(() => platformUserNfts.id), // Linked Living Achievement NFT
  progress: jsonb("progress").notNull().default('{}'), // Current progress toward completion
  isCompleted: text("is_completed").notNull().default("false"),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletAchievementIdx: index("platform_user_achievements_wallet_achievement_idx").on(table.walletAddress, table.achievementId),
  walletLowerIdx: index("platform_user_achievements_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  completedIdx: index("platform_user_achievements_completed_idx").on(table.isCompleted),
  nftIdx: index("platform_user_achievements_nft_idx").on(table.nftId),
}));

// NFT Evolution Log - Track how NFTs change over time
export const platformNftEvolutionLog = pgTable("platform_nft_evolution_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => platformUserNfts.id),
  evolutionType: text("evolution_type").notNull(), // level_up, attribute_boost, rarity_upgrade, achievement_unlock
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  trigger: text("trigger"), // What caused the evolution
  aiAnalysis: text("ai_analysis"), // AI-generated insights
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  nftIdx: index("platform_nft_evolution_log_nft_idx").on(table.nftId),
  typeIdx: index("platform_nft_evolution_log_type_idx").on(table.evolutionType),
  createdAtIdx: index("platform_nft_evolution_log_created_at_idx").on(table.createdAt),
}));

// Staking Pools for CODEX Token
export const codexStakingPools = pgTable("codex_staking_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  apr: text("apr").notNull(), // Annual Percentage Rate
  lockPeriod: text("lock_period").notNull(), // In seconds
  minStake: text("min_stake").notNull().default("100"),
  maxStake: text("max_stake"),
  totalStaked: text("total_staked").notNull().default("0"),
  rewardsPool: text("rewards_pool").notNull().default("0"),
  isActive: text("is_active").notNull().default("true"),
  nftBonusMultiplier: text("nft_bonus_multiplier").default("1.0"), // NFT holders get bonus
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("codex_staking_pools_active_idx").on(table.isActive),
  aprIdx: index("codex_staking_pools_apr_idx").on(table.apr),
}));

// User Stakes
export const codexUserStakes = pgTable("codex_user_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  poolId: varchar("pool_id").notNull().references(() => codexStakingPools.id),
  amount: text("amount").notNull(),
  rewardsEarned: text("rewards_earned").notNull().default("0"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  unlockDate: timestamp("unlock_date").notNull(),
  lastClaimDate: timestamp("last_claim_date"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("codex_user_stakes_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  poolIdx: index("codex_user_stakes_pool_idx").on(table.poolId),
  activeIdx: index("codex_user_stakes_active_idx").on(table.isActive),
}));

// Insert Schemas
export const insertPlatformTokenSchema = createInsertSchema(platformToken).omit({
  id: true,
  createdAt: true,
});

export const insertTokenHoldingSchema = createInsertSchema(tokenHoldings).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertPlatformNftCollectionSchema = createInsertSchema(platformNftCollections).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformUserNftSchema = createInsertSchema(platformUserNfts).omit({
  id: true,
  mintedAt: true,
  createdAt: true,
});

export const insertRelicDefinitionSchema = createInsertSchema(relicDefinitions).omit({
  createdAt: true,
});

export const insertRelicMintSchema = createInsertSchema(relicMints).omit({
  id: true,
  mintedAt: true,
});

export const insertPlatformAchievementSchema = createInsertSchema(platformAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformUserAchievementSchema = createInsertSchema(platformUserAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformNftEvolutionLogSchema = createInsertSchema(platformNftEvolutionLog).omit({
  id: true,
  createdAt: true,
});

export const insertCodexStakingPoolSchema = createInsertSchema(codexStakingPools).omit({
  id: true,
  createdAt: true,
});

export const insertCodexUserStakeSchema = createInsertSchema(codexUserStakes).omit({
  id: true,
  createdAt: true,
});

// Types
export type PlatformToken = typeof platformToken.$inferSelect;
export type InsertPlatformToken = z.infer<typeof insertPlatformTokenSchema>;
export type TokenHolding = typeof tokenHoldings.$inferSelect;
export type InsertTokenHolding = z.infer<typeof insertTokenHoldingSchema>;
export type PlatformNftCollection = typeof platformNftCollections.$inferSelect;
export type InsertPlatformNftCollection = z.infer<typeof insertPlatformNftCollectionSchema>;
export type PlatformUserNft = typeof platformUserNfts.$inferSelect;
export type InsertPlatformUserNft = z.infer<typeof insertPlatformUserNftSchema>;
export type RelicDefinition = typeof relicDefinitions.$inferSelect;
export type InsertRelicDefinition = z.infer<typeof insertRelicDefinitionSchema>;
export type RelicMint = typeof relicMints.$inferSelect;
export type InsertRelicMint = z.infer<typeof insertRelicMintSchema>;
export type PlatformAchievement = typeof platformAchievements.$inferSelect;
export type InsertPlatformAchievement = z.infer<typeof insertPlatformAchievementSchema>;
export type PlatformUserAchievement = typeof platformUserAchievements.$inferSelect;
export type InsertPlatformUserAchievement = z.infer<typeof insertPlatformUserAchievementSchema>;
export type PlatformNftEvolutionLog = typeof platformNftEvolutionLog.$inferSelect;
export type InsertPlatformNftEvolutionLog = z.infer<typeof insertPlatformNftEvolutionLogSchema>;
export type CodexStakingPool = typeof codexStakingPools.$inferSelect;
export type InsertCodexStakingPool = z.infer<typeof insertCodexStakingPoolSchema>;
export type CodexUserStake = typeof codexUserStakes.$inferSelect;
export type InsertCodexUserStake = z.infer<typeof insertCodexUserStakeSchema>;

// ===== MARKETPLACE SYSTEM =====
// Peer-to-peer trading of NFTs, Tokens, and Relics

export const marketplaceListings = pgTable("marketplace_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // nft, token, product
  itemId: varchar("item_id").notNull(), // ID of the NFT/token/product being sold
  sellerWallet: varchar("seller_wallet").notNull(),
  buyerWallet: varchar("buyer_wallet"),
  priceEth: varchar("price_eth").notNull(),
  status: varchar("status").notNull().default("active"), // active, sold, cancelled
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata"), // Additional item-specific data
  createdAt: timestamp("created_at").defaultNow(),
  soldAt: timestamp("sold_at"),
}, (table) => ({
  sellerIdx: index("marketplace_listings_seller_idx").on(sql`lower(${table.sellerWallet})`),
  buyerIdx: index("marketplace_listings_buyer_idx").on(sql`lower(${table.buyerWallet})`),
  itemTypeIdx: index("marketplace_listings_item_type_idx").on(table.itemType),
  statusIdx: index("marketplace_listings_status_idx").on(table.status),
}));

// Insert Schema
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
});

// Types
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

// ===== CODEX RELICS SYSTEM =====
// Tiered, soulbound artifacts earned through milestones

// Master Relic Catalog - Defines what relics exist
export const codexRelics = pgTable("codex_relics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  class: text("class").notNull(), // chronicle, catalyst, sentinel
  tier: text("tier").notNull(), // common, rare, epic, legendary, mythic
  imageUrl: text("image_url"),
  effectType: text("effect_type").notNull(), // stake_apy, trading_fee, bot_boost, achievement_unlock
  effectValue: text("effect_value").notNull(), // e.g., "1.2" for 20% boost
  effectDescription: text("effect_description").notNull(),
  acquisitionType: text("acquisition_type").notNull(), // milestone, forge, vault_ritual
  acquisitionRequirements: jsonb("acquisition_requirements").notNull(), // {stakingDays: 30, cdxBurned: 1000, etc}
  maxSupply: text("max_supply").default("0"), // "0" = unlimited
  currentSupply: text("current_supply").default("0"),
  isSoulbound: text("is_soulbound").notNull().default("true"), // Cannot be transferred
  isActive: text("is_active").notNull().default("true"),
  seasonId: text("season_id"), // For seasonal relics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  classIdx: index("codex_relics_class_idx").on(table.class),
  tierIdx: index("codex_relics_tier_idx").on(table.tier),
  effectTypeIdx: index("codex_relics_effect_type_idx").on(table.effectType),
  activeIdx: index("codex_relics_active_idx").on(table.isActive),
  acquisitionIdx: index("codex_relics_acquisition_idx").on(table.acquisitionType),
}));

// User Relic Instances - Who owns what
export const codexRelicInstances = pgTable("codex_relic_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => codexRelics.id),
  walletAddress: text("wallet_address").notNull(),
  isEquipped: text("is_equipped").notNull().default("false"), // Can equip up to 3 relics
  equipSlot: text("equip_slot"), // slot1, slot2, slot3
  level: text("level").notNull().default("1"), // Relics can level up
  experience: text("experience").notNull().default("0"),
  powerScore: text("power_score").notNull().default("100"), // Overall strength
  acquiredAt: timestamp("acquired_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional relic-specific data
}, (table) => ({
  relicIdx: index("codex_relic_instances_relic_idx").on(table.relicId),
  walletLowerIdx: index("codex_relic_instances_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  equippedIdx: index("codex_relic_instances_equipped_idx").on(table.isEquipped),
  walletEquippedIdx: index("codex_relic_instances_wallet_equipped_idx").on(table.walletAddress, table.isEquipped),
  levelIdx: index("codex_relic_instances_level_idx").on(table.level),
}));

// Relic Progress Tracking - Milestone progress for earning relics
export const codexRelicProgress = pgTable("codex_relic_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => codexRelics.id),
  walletAddress: text("wallet_address").notNull(),
  progressType: text("progress_type").notNull(), // staking_time, cdx_burned, trading_volume, vault_contribution
  currentValue: text("current_value").notNull().default("0"),
  requiredValue: text("required_value").notNull(),
  isCompleted: text("is_completed").notNull().default("false"),
  completedAt: timestamp("completed_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  metadata: jsonb("metadata"), // Track specific progress details
}, (table) => ({
  relicWalletIdx: index("codex_relic_progress_relic_wallet_idx").on(table.relicId, table.walletAddress),
  walletLowerIdx: index("codex_relic_progress_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  progressTypeIdx: index("codex_relic_progress_type_idx").on(table.progressType),
  completedIdx: index("codex_relic_progress_completed_idx").on(table.isCompleted),
}));

// Active Relic Effects - Track currently active boosts
export const codexRelicEffects = pgTable("codex_relic_effects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => codexRelicInstances.id),
  walletAddress: text("wallet_address").notNull(),
  effectType: text("effect_type").notNull(), // stake_apy, trading_fee, bot_boost
  effectValue: text("effect_value").notNull(),
  isActive: text("is_active").notNull().default("true"),
  activatedAt: timestamp("activated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // For time-limited effects
}, (table) => ({
  instanceIdx: index("codex_relic_effects_instance_idx").on(table.instanceId),
  walletLowerIdx: index("codex_relic_effects_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  effectTypeIdx: index("codex_relic_effects_type_idx").on(table.effectType),
  activeIdx: index("codex_relic_effects_active_idx").on(table.isActive),
  walletActiveIdx: index("codex_relic_effects_wallet_active_idx").on(table.walletAddress, table.isActive),
}));

// Insert Schemas
export const insertCodexRelicSchema = createInsertSchema(codexRelics).omit({
  id: true,
  createdAt: true,
});

export const insertCodexRelicInstanceSchema = createInsertSchema(codexRelicInstances).omit({
  id: true,
  acquiredAt: true,
});

export const insertCodexRelicProgressSchema = createInsertSchema(codexRelicProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertCodexRelicEffectSchema = createInsertSchema(codexRelicEffects).omit({
  id: true,
  activatedAt: true,
});

// Types
export type CodexRelic = typeof codexRelics.$inferSelect;
export type InsertCodexRelic = z.infer<typeof insertCodexRelicSchema>;
export type CodexRelicInstance = typeof codexRelicInstances.$inferSelect;
export type InsertCodexRelicInstance = z.infer<typeof insertCodexRelicInstanceSchema>;
export type CodexRelicProgress = typeof codexRelicProgress.$inferSelect;
export type InsertCodexRelicProgress = z.infer<typeof insertCodexRelicProgressSchema>;
export type CodexRelicEffect = typeof codexRelicEffects.$inferSelect;
export type InsertCodexRelicEffect = z.infer<typeof insertCodexRelicEffectSchema>;

// ===== FORGE SYSTEM =====
// Craft and upgrade relics using materials and CDX tokens

// Crafting Materials Catalog
export const forgeMaterials = pgTable("forge_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // essence, fragment, crystal, core
  rarity: text("rarity").notNull(), // common, rare, epic, legendary, mythic
  imageUrl: text("image_url"),
  cdxValue: text("cdx_value").notNull(), // CDX equivalent value
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("forge_materials_type_idx").on(table.type),
  rarityIdx: index("forge_materials_rarity_idx").on(table.rarity),
  activeIdx: index("forge_materials_active_idx").on(table.isActive),
}));

// Forge Recipes - How to craft relics
export const forgeRecipes = pgTable("forge_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => codexRelics.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cdxCost: text("cdx_cost").notNull(), // CDX tokens required
  materials: jsonb("materials").notNull(), // [{materialId, quantity}, ...]
  craftingTime: text("crafting_time").notNull().default("3600"), // seconds
  successRate: text("success_rate").notNull().default("100"), // 0-100
  requiredLevel: text("required_level").notNull().default("1"), // User level requirement
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  relicIdx: index("forge_recipes_relic_idx").on(table.relicId),
  activeIdx: index("forge_recipes_active_idx").on(table.isActive),
  levelIdx: index("forge_recipes_level_idx").on(table.requiredLevel),
}));

// User Material Inventory
export const forgeInventory = pgTable("forge_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  materialId: varchar("material_id").notNull().references(() => forgeMaterials.id),
  quantity: text("quantity").notNull().default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  walletLowerIdx: index("forge_inventory_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  materialIdx: index("forge_inventory_material_idx").on(table.materialId),
  walletMaterialIdx: index("forge_inventory_wallet_material_idx").on(table.walletAddress, table.materialId),
}));

// Crafting Sessions - Active and completed crafts
export const forgeCraftingSessions = pgTable("forge_crafting_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  recipeId: varchar("recipe_id").notNull().references(() => forgeRecipes.id),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, failed
  cdxSpent: text("cdx_spent").notNull(),
  materialsUsed: jsonb("materials_used").notNull(), // [{materialId, quantity}, ...]
  resultRelicInstanceId: varchar("result_relic_instance_id").references(() => codexRelicInstances.id),
  startedAt: timestamp("started_at").defaultNow(),
  completesAt: timestamp("completes_at").notNull(),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
}, (table) => ({
  walletLowerIdx: index("forge_crafting_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("forge_crafting_status_idx").on(table.status),
  recipeIdx: index("forge_crafting_recipe_idx").on(table.recipeId),
  walletStatusIdx: index("forge_crafting_wallet_status_idx").on(table.walletAddress, table.status),
}));

// Insert Schemas
export const insertForgeMaterialSchema = createInsertSchema(forgeMaterials).omit({
  id: true,
  createdAt: true,
});

export const insertForgeRecipeSchema = createInsertSchema(forgeRecipes).omit({
  id: true,
  createdAt: true,
});

export const insertForgeInventorySchema = createInsertSchema(forgeInventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertForgeCraftingSessionSchema = createInsertSchema(forgeCraftingSessions).omit({
  id: true,
  startedAt: true,
});

// Types
export type ForgeMaterial = typeof forgeMaterials.$inferSelect;
export type InsertForgeMaterial = z.infer<typeof insertForgeMaterialSchema>;
export type ForgeRecipe = typeof forgeRecipes.$inferSelect;
export type InsertForgeRecipe = z.infer<typeof insertForgeRecipeSchema>;
export type ForgeInventory = typeof forgeInventory.$inferSelect;
export type InsertForgeInventory = z.infer<typeof insertForgeInventorySchema>;
export type ForgeCraftingSession = typeof forgeCraftingSessions.$inferSelect;
export type InsertForgeCraftingSession = z.infer<typeof insertForgeCraftingSessionSchema>;

// ==========================================
// EMPIRE VAULT - DAO TREASURY SYSTEM
// ==========================================

// Main Treasury - Single record tracking vault balance
export const empireVault = pgTable("empire_vault", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalBalance: text("total_balance").notNull().default("0"), // Total ETH/USD in vault
  totalDeposited: text("total_deposited").notNull().default("0"), // Lifetime deposits
  totalDistributed: text("total_distributed").notNull().default("0"), // Lifetime distributions
  treasuryWallet: text("treasury_wallet").notNull(), // Main vault address
  distributionFrequency: text("distribution_frequency").notNull().default("weekly"), // hourly, daily, weekly, monthly
  minDistributionAmount: text("min_distribution_amount").notNull().default("1000"), // Min USD to trigger distribution
  governanceThreshold: text("governance_threshold").notNull().default("10000"), // Min CDX to vote
  status: text("status").notNull().default("active"), // active, paused, emergency_locked
  lastDistributionAt: timestamp("last_distribution_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Revenue Deposits - Track all income flowing into vault
export const empireRevenueDeposits = pgTable("empire_revenue_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: text("amount").notNull(), // Deposit amount
  source: text("source").notNull(), // marketplace, trading_bot, launchpad, ecommerce, staking_fees, subscription
  sourceId: text("source_id"), // Reference ID from source system (trade_id, order_id, etc)
  description: text("description"), // Human-readable description
  txHash: text("tx_hash"), // On-chain transaction hash
  status: text("status").notNull().default("confirmed"), // pending, confirmed, failed
  depositedAt: timestamp("deposited_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional context
}, (table) => ({
  sourceIdx: index("empire_revenue_deposits_source_idx").on(table.source),
  statusIdx: index("empire_revenue_deposits_status_idx").on(table.status),
  depositedAtIdx: index("empire_revenue_deposits_deposited_at_idx").on(table.depositedAt),
  sourceIdIdx: index("empire_revenue_deposits_source_id_idx").on(table.sourceId),
}));

// Distribution Rounds - Periodic profit sharing events
export const empireDistributions = pgTable("empire_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: text("round_number").notNull().unique(), // Sequential round counter
  totalAmount: text("total_amount").notNull(), // Total amount being distributed
  totalCdxStaked: text("total_cdx_staked").notNull(), // Total CDX staked at snapshot
  totalShares: text("total_shares").notNull(), // Total distribution shares (includes NFT boosts)
  amountPerShare: text("amount_per_share").notNull(), // Distribution amount per share
  eligibleWallets: text("eligible_wallets").notNull().default("0"), // Number of eligible wallets
  claimedCount: text("claimed_count").notNull().default("0"), // Number who claimed
  claimedAmount: text("claimed_amount").notNull().default("0"), // Total amount claimed
  unclaimedAmount: text("unclaimed_amount").notNull().default("0"), // Not yet claimed
  snapshotBlockNumber: text("snapshot_block_number"), // Block number for snapshot
  status: text("status").notNull().default("pending"), // pending, active, completed, expired
  expiresAt: timestamp("expires_at"), // Unclaimed rewards expire after 90 days
  distributedAt: timestamp("distributed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
}, (table) => ({
  roundIdx: index("empire_distributions_round_idx").on(table.roundNumber),
  statusIdx: index("empire_distributions_status_idx").on(table.status),
  distributedAtIdx: index("empire_distributions_distributed_at_idx").on(table.distributedAt),
}));

// User Shares - Calculate each user's distribution percentage
export const empireUserShares = pgTable("empire_user_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  distributionId: varchar("distribution_id").notNull().references(() => empireDistributions.id),
  walletAddress: text("wallet_address").notNull(),
  cdxStaked: text("cdx_staked").notNull(), // CDX amount staked at snapshot
  baseShares: text("base_shares").notNull(), // Base shares from CDX stake
  nftBoostMultiplier: text("nft_boost_multiplier").notNull().default("1.0"), // NFT multiplier (1.0 - 3.0)
  relicBoostMultiplier: text("relic_boost_multiplier").notNull().default("1.0"), // Relic multiplier
  totalShares: text("total_shares").notNull(), // Base * NFT boost * Relic boost
  sharePercentage: text("share_percentage").notNull(), // % of total distribution
  rewardAmount: text("reward_amount").notNull(), // Calculated reward
  nftCount: text("nft_count").notNull().default("0"), // Number of NFTs owned
  relicCount: text("relic_count").notNull().default("0"), // Number of relics equipped
  governanceWeight: text("governance_weight").notNull().default("0"), // Voting power
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  distributionWalletIdx: index("empire_user_shares_distribution_wallet_idx").on(table.distributionId, table.walletAddress),
  walletLowerIdx: index("empire_user_shares_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  distributionIdx: index("empire_user_shares_distribution_idx").on(table.distributionId),
}));

// Reward Claims - Track user claims
export const empireRewardClaims = pgTable("empire_reward_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  distributionId: varchar("distribution_id").notNull().references(() => empireDistributions.id),
  userShareId: varchar("user_share_id").notNull().references(() => empireUserShares.id),
  walletAddress: text("wallet_address").notNull(),
  claimAmount: text("claim_amount").notNull(),
  txHash: text("tx_hash"), // Claim transaction hash
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
}, (table) => ({
  distributionWalletIdx: index("empire_reward_claims_distribution_wallet_idx").on(table.distributionId, table.walletAddress),
  walletLowerIdx: index("empire_reward_claims_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("empire_reward_claims_status_idx").on(table.status),
  claimedAtIdx: index("empire_reward_claims_claimed_at_idx").on(table.claimedAt),
}));

// Governance Proposals - DAO voting on vault management
export const empireGovernanceProposals = pgTable("empire_governance_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposerId: varchar("proposer_id").notNull().references(() => users.id),
  proposerWallet: text("proposer_wallet").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposalType: text("proposal_type").notNull(), // change_distribution, adjust_fees, emergency_action, treasury_allocation
  targetValue: text("target_value"), // Proposed value/change
  votesFor: text("votes_for").notNull().default("0"), // Total voting weight FOR
  votesAgainst: text("votes_against").notNull().default("0"), // Total voting weight AGAINST
  totalVoters: text("total_voters").notNull().default("0"),
  quorumRequired: text("quorum_required").notNull().default("10"), // % of total CDX needed to vote
  status: text("status").notNull().default("active"), // active, passed, rejected, executed, expired
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => ({
  proposerIdx: index("empire_governance_proposals_proposer_idx").on(table.proposerId),
  statusIdx: index("empire_governance_proposals_status_idx").on(table.status),
  endsAtIdx: index("empire_governance_proposals_ends_at_idx").on(table.endsAt),
}));

// Governance Votes - Individual votes on proposals
export const empireGovernanceVotes = pgTable("empire_governance_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => empireGovernanceProposals.id),
  voterId: varchar("voter_id").notNull().references(() => users.id),
  voterWallet: text("voter_wallet").notNull(),
  vote: text("vote").notNull(), // for, against, abstain
  votingWeight: text("voting_weight").notNull(), // Based on CDX stake + NFT boosts
  reason: text("reason"), // Optional explanation
  votedAt: timestamp("voted_at").notNull().defaultNow(),
}, (table) => ({
  proposalVoterIdx: index("empire_governance_votes_proposal_voter_idx").on(table.proposalId, table.voterId),
  proposalIdx: index("empire_governance_votes_proposal_idx").on(table.proposalId),
  voterIdx: index("empire_governance_votes_voter_idx").on(table.voterId),
}));

// Insert Schemas
export const insertEmpireRevenueDepositSchema = createInsertSchema(empireRevenueDeposits).omit({
  id: true,
  depositedAt: true,
});

export const insertEmpireDistributionSchema = createInsertSchema(empireDistributions).omit({
  id: true,
  distributedAt: true,
});

export const insertEmpireUserShareSchema = createInsertSchema(empireUserShares).omit({
  id: true,
  createdAt: true,
});

export const insertEmpireRewardClaimSchema = createInsertSchema(empireRewardClaims).omit({
  id: true,
  claimedAt: true,
});

export const insertEmpireGovernanceProposalSchema = createInsertSchema(empireGovernanceProposals).omit({
  id: true,
  createdAt: true,
});

export const insertEmpireGovernanceVoteSchema = createInsertSchema(empireGovernanceVotes).omit({
  id: true,
  votedAt: true,
});

// Types
export type EmpireVault = typeof empireVault.$inferSelect;
export type EmpireRevenueDeposit = typeof empireRevenueDeposits.$inferSelect;
export type InsertEmpireRevenueDeposit = z.infer<typeof insertEmpireRevenueDepositSchema>;
export type EmpireDistribution = typeof empireDistributions.$inferSelect;
export type InsertEmpireDistribution = z.infer<typeof insertEmpireDistributionSchema>;
export type EmpireUserShare = typeof empireUserShares.$inferSelect;
export type InsertEmpireUserShare = z.infer<typeof insertEmpireUserShareSchema>;
export type EmpireRewardClaim = typeof empireRewardClaims.$inferSelect;
export type InsertEmpireRewardClaim = z.infer<typeof insertEmpireRewardClaimSchema>;
export type EmpireGovernanceProposal = typeof empireGovernanceProposals.$inferSelect;
export type InsertEmpireGovernanceProposal = z.infer<typeof insertEmpireGovernanceProposalSchema>;
export type EmpireGovernanceVote = typeof empireGovernanceVotes.$inferSelect;
export type InsertEmpireGovernanceVote = z.infer<typeof insertEmpireGovernanceVoteSchema>;

// Margin Trading Insert Schemas
export const insertMarginPositionSchema = createInsertSchema(marginPositions).omit({
  id: true,
  openedAt: true,
  lastUpdatedAt: true,
});

export const insertLeverageSettingSchema = createInsertSchema(leverageSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiquidationHistorySchema = createInsertSchema(liquidationHistory).omit({
  id: true,
  liquidatedAt: true,
});

// Margin Trading Types
export type MarginPosition = typeof marginPositions.$inferSelect;
export type InsertMarginPosition = z.infer<typeof insertMarginPositionSchema>;
export type LeverageSetting = typeof leverageSettings.$inferSelect;
export type InsertLeverageSetting = z.infer<typeof insertLeverageSettingSchema>;
export type LiquidationHistory = typeof liquidationHistory.$inferSelect;
export type InsertLiquidationHistory = z.infer<typeof insertLiquidationHistorySchema>;

// ============================================================================
// BILLIONAIRE MODE - AUTOPILOT WEALTH SYSTEM
// ============================================================================

// Billionaire Profiles - Track user's billionaire autopilot settings
export const billionaireProfiles = pgTable("billionaire_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  walletAddress: text("wallet_address").notNull(),
  currentAge: text("current_age").notNull(),
  targetAge: text("target_age").notNull().default("50"),
  startingBalance: text("starting_balance").notNull(), // ETH amount
  currentBalance: text("current_balance").notNull(), // ETH amount
  targetWealth: text("target_wealth").notNull().default("1000000000"), // $1 Billion USD
  
  // Layer Activation Status
  layer1Active: text("layer1_active").notNull().default("false"), // Premium Vault
  layer2Active: text("layer2_active").notNull().default("false"), // Leveraged Trading
  layer3Active: text("layer3_active").notNull().default("false"), // Empire Vault
  layer4Active: text("layer4_active").notNull().default("false"), // Copy Trading
  layer5Active: text("layer5_active").notNull().default("false"), // NFT/Relic Boosts
  
  // Layer Allocations
  layer1Allocation: text("layer1_allocation").default("0"), // ETH in Premium Vault
  layer2Allocation: text("layer2_allocation").default("0"), // ETH in Leveraged positions
  layer3CdxStaked: text("layer3_cdx_staked").default("0"), // CDX staked
  layer4Allocation: text("layer4_allocation").default("0"), // ETH in copy trading
  layer5NftCount: text("layer5_nft_count").default("0"), // NFTs owned
  layer5RelicCount: text("layer5_relic_count").default("0"), // Relics equipped
  
  // Performance Metrics
  totalEarned: text("total_earned").default("0"), // Total profits
  effectiveApy: text("effective_apy").default("0"), // Combined APY across all layers
  monthlyPassive: text("monthly_passive").default("0"), // Monthly passive income
  daysToTarget: text("days_to_target").default("0"), // Estimated days to $1B
  
  // Risk Settings
  maxLeverage: text("max_leverage").default("10"), // Max leverage allowed
  stopLossEnabled: text("stop_loss_enabled").notNull().default("true"),
  autoRebalanceEnabled: text("auto_rebalance_enabled").notNull().default("true"),
  
  isActive: text("is_active").notNull().default("true"),
  activatedAt: timestamp("activated_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  userIdIdx: index("billionaire_profiles_user_id_idx").on(table.userId),
  walletIdx: index("billionaire_profiles_wallet_idx").on(table.walletAddress),
}));

// Billionaire Projections - Track wealth projections over time
export const billionaireProjections = pgTable("billionaire_projections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => billionaireProfiles.id, { onDelete: 'cascade' }),
  age: text("age").notNull(),
  year: text("year").notNull(),
  projectedWealth: text("projected_wealth").notNull(), // USD value
  ethHoldings: text("eth_holdings").notNull(),
  monthlyIncome: text("monthly_income").notNull(),
  milestone: text("milestone"), // "Millionaire", "Multi-Millionaire", "Centi-Millionaire", "Billionaire"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  profileIdIdx: index("billionaire_projections_profile_id_idx").on(table.profileId),
  ageIdx: index("billionaire_projections_age_idx").on(table.age),
}));

// Billionaire Milestones - Track achieved wealth milestones
export const billionaireMilestones = pgTable("billionaire_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => billionaireProfiles.id, { onDelete: 'cascade' }),
  milestone: text("milestone").notNull(), // "First $1M", "First $10M", "First $100M", "Billionaire"
  targetAmount: text("target_amount").notNull(),
  achievedAmount: text("achieved_amount"),
  isAchieved: text("is_achieved").notNull().default("false"),
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  profileIdIdx: index("billionaire_milestones_profile_id_idx").on(table.profileId),
  isAchievedIdx: index("billionaire_milestones_is_achieved_idx").on(table.isAchieved),
}));

// Insert Schemas
export const insertBillionaireProfileSchema = createInsertSchema(billionaireProfiles).omit({
  id: true,
  activatedAt: true,
  lastUpdated: true,
});

export const insertBillionaireProjectionSchema = createInsertSchema(billionaireProjections).omit({
  id: true,
  createdAt: true,
});

export const insertBillionaireMilestoneSchema = createInsertSchema(billionaireMilestones).omit({
  id: true,
  createdAt: true,
});

// Types
export type BillionaireProfile = typeof billionaireProfiles.$inferSelect;
export type InsertBillionaireProfile = z.infer<typeof insertBillionaireProfileSchema>;
export type BillionaireProjection = typeof billionaireProjections.$inferSelect;
export type InsertBillionaireProjection = z.infer<typeof insertBillionaireProjectionSchema>;
export type BillionaireMilestone = typeof billionaireMilestones.$inferSelect;
export type InsertBillionaireMilestone = z.infer<typeof insertBillionaireMilestoneSchema>;

// ============================================================================
// VISITOR ANALYTICS & TRACKING
// ============================================================================

// Visitor Sessions - Track unique visitor sessions
export const visitorSessions = pgTable("visitor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(), // Browser-generated session ID
  visitorId: text("visitor_id"), // Persistent visitor ID (cookie-based)
  ipAddress: text("ip_address"), // IP address (anonymized for privacy)
  userAgent: text("user_agent"), // Browser user agent
  referrer: text("referrer"), // Where they came from
  landingPage: text("landing_page"), // First page visited
  exitPage: text("exit_page"), // Last page before leaving
  country: text("country"), // Geographic location
  city: text("city"),
  device: text("device"), // desktop, mobile, tablet
  browser: text("browser"), // Chrome, Firefox, Safari, etc.
  os: text("os"), // Operating system
  pageViewCount: text("page_view_count").notNull().default("0"), // Number of pages viewed in session
  duration: text("duration").default("0"), // Session duration in seconds
  isActive: text("is_active").notNull().default("true"), // Whether session is still active
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => ({
  sessionIdIdx: index("visitor_sessions_session_id_idx").on(table.sessionId),
  visitorIdIdx: index("visitor_sessions_visitor_id_idx").on(table.visitorId),
  startedAtIdx: index("visitor_sessions_started_at_idx").on(table.startedAt),
  isActiveIdx: index("visitor_sessions_is_active_idx").on(table.isActive),
}));

// Page Views - Track individual page views
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => visitorSessions.id, { onDelete: 'cascade' }),
  path: text("path").notNull(), // Page path/URL
  title: text("title"), // Page title
  referrer: text("referrer"), // Previous page
  duration: text("duration").default("0"), // Time spent on page in seconds
  scrollDepth: text("scroll_depth").default("0"), // Percentage of page scrolled
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index("page_views_session_id_idx").on(table.sessionId),
  pathIdx: index("page_views_path_idx").on(table.path),
  viewedAtIdx: index("page_views_viewed_at_idx").on(table.viewedAt),
}));

// Visitor Events - Track custom events and user interactions
export const visitorEvents = pgTable("visitor_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => visitorSessions.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // click, form_submit, purchase, etc.
  eventCategory: text("event_category").notNull(), // button, link, form, etc.
  eventLabel: text("event_label"), // Specific label/name
  eventValue: text("event_value"), // Numeric value if applicable
  path: text("path").notNull(), // Page where event occurred
  metadata: jsonb("metadata"), // Additional event data
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index("visitor_events_session_id_idx").on(table.sessionId),
  eventTypeIdx: index("visitor_events_event_type_idx").on(table.eventType),
  eventCategoryIdx: index("visitor_events_event_category_idx").on(table.eventCategory),
  occurredAtIdx: index("visitor_events_occurred_at_idx").on(table.occurredAt),
}));

// ============================================================================
// DEPRECATED - Reward Spins (kept for migration compatibility only)
// ============================================================================

// @deprecated - No longer used, kept for database migration compatibility
export const casinoSpins = pgTable("casino_spins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  spinResult: text("spin_result").notNull(), // Sector label (e.g., "MEGA JACKPOT")
  winAmount: text("win_amount").notNull().default("0"), // Amount won in ETH
  currency: text("currency").notNull().default("ETH"), // Currency type (ETH, BTC, etc.)
  gameType: text("game_type").notNull().default("Fortune Wheel"), // Game type
  status: text("status").notNull().default("pending"), // pending, completed, failed
  metadata: jsonb("metadata"), // Additional spin metadata (multiplier, icon, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletAddressIdx: index("casino_spins_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
  gameTypeIdx: index("casino_spins_game_type_idx").on(table.gameType),
  statusIdx: index("casino_spins_status_idx").on(table.status),
  createdAtIdx: index("casino_spins_created_at_idx").on(table.createdAt),
}));

// ============================================================================
// ADVANCED SECURITY INFRASTRUCTURE - Enterprise-Grade Protection
// ============================================================================

// Withdrawal Whitelist - Kraken-level security
export const withdrawalWhitelists = pgTable("withdrawal_whitelists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  whitelistedAddress: text("whitelisted_address").notNull(),
  label: text("label"), // User-friendly label for the address
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used"),
}, (table) => ({
  walletAddressIdx: index("withdrawal_whitelists_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
  whitelistedAddressIdx: index("withdrawal_whitelists_whitelisted_address_idx").on(sql`lower(${table.whitelistedAddress})`),
}));

// Anti-Phishing Codes - Prevent social engineering attacks
export const antiPhishingCodes = pgTable("anti_phishing_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  code: text("code").notNull(), // User's custom anti-phishing code
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  walletAddressIdx: index("anti_phishing_codes_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
}));

// Time-Locked Withdrawals - 24-48 hour delays for large amounts
export const timeLockedWithdrawals = pgTable("time_locked_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  amount: text("amount").notNull(), // Amount in wei
  currency: text("currency").notNull().default("ETH"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, executed
  lockUntil: timestamp("lock_until").notNull(), // When the lock expires
  confirmationCode: text("confirmation_code"), // Email/SMS confirmation code
  isConfirmed: text("is_confirmed").notNull().default("false"),
  executedAt: timestamp("executed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional data (IP address, device info, etc.)
}, (table) => ({
  walletAddressIdx: index("time_locked_withdrawals_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("time_locked_withdrawals_status_idx").on(table.status),
  lockUntilIdx: index("time_locked_withdrawals_lock_until_idx").on(table.lockUntil),
}));

// Fraud Detection Logs - AI-powered monitoring
export const fraudDetectionLogs = pgTable("fraud_detection_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  eventType: text("event_type").notNull(), // velocity_limit, unusual_pattern, geo_anomaly, etc.
  riskScore: integer("risk_score").notNull(), // 0-100 risk score
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high, critical
  description: text("description").notNull(),
  action: text("action").notNull().default("logged"), // logged, flagged, blocked, escalated
  metadata: jsonb("metadata"), // Detailed event data
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // Admin/system that resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletAddressIdx: index("fraud_detection_logs_wallet_address_idx").on(sql`lower(${table.walletAddress})`),
  riskLevelIdx: index("fraud_detection_logs_risk_level_idx").on(table.riskLevel),
  eventTypeIdx: index("fraud_detection_logs_event_type_idx").on(table.eventType),
  createdAtIdx: index("fraud_detection_logs_created_at_idx").on(table.createdAt),
}));

// Proof of Reserves - Real-time transparency (Merkle Tree based)
export const proofOfReserves = pgTable("proof_of_reserves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotTime: timestamp("snapshot_time").notNull().defaultNow(),
  totalEthReserves: text("total_eth_reserves").notNull(), // Total ETH in wei
  totalUserBalances: text("total_user_balances").notNull(), // Total user claims in wei
  reserveRatio: text("reserve_ratio").notNull(), // Ratio as decimal string (e.g., "1.05" = 105%)
  merkleRoot: text("merkle_root"), // Merkle tree root for verification
  blockNumber: text("block_number"), // Ethereum block number for snapshot
  chainId: text("chain_id").notNull().default("1"),
  attestationUrl: text("attestation_url"), // URL to third-party attestation
  metadata: jsonb("metadata"), // Additional reserve data (by chain, token, etc.)
}, (table) => ({
  snapshotTimeIdx: index("proof_of_reserves_snapshot_time_idx").on(table.snapshotTime),
  chainIdIdx: index("proof_of_reserves_chain_id_idx").on(table.chainId),
}));

// Security Incidents - Track and respond to threats
export const securityIncidents = pgTable("security_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentType: text("incident_type").notNull(), // unauthorized_access, phishing_attempt, suspicious_withdrawal, etc.
  severity: text("severity").notNull().default("low"), // low, medium, high, critical
  affectedWallet: text("affected_wallet"),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, investigating, mitigated, resolved, false_positive
  actionsTaken: jsonb("actions_taken"), // Array of remediation actions
  detectedBy: text("detected_by").notNull().default("system"), // system, user, admin
  assignedTo: text("assigned_to"), // Admin/team assigned
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // Who resolved the incident
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  incidentTypeIdx: index("security_incidents_incident_type_idx").on(table.incidentType),
  severityIdx: index("security_incidents_severity_idx").on(table.severity),
  statusIdx: index("security_incidents_status_idx").on(table.status),
  affectedWalletIdx: index("security_incidents_affected_wallet_idx").on(sql`lower(${table.affectedWallet})`),
  createdAtIdx: index("security_incidents_created_at_idx").on(table.createdAt),
}));

// API Keys & RPC Configuration - Enterprise infrastructure
export const rpcEndpoints = pgTable("rpc_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // alchemy, infura, quicknode, custom
  chainId: text("chain_id").notNull(),
  endpoint: text("endpoint").notNull(),
  apiKey: text("api_key"), // Encrypted API key
  isPrimary: text("is_primary").notNull().default("false"),
  isActive: text("is_active").notNull().default("true"),
  requestsPerSecond: integer("requests_per_second").default(25),
  monthlyQuota: integer("monthly_quota"), // Monthly request quota
  usageCount: integer("usage_count").default(0),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status").default("unknown"), // healthy, degraded, down, unknown
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerChainIdx: index("rpc_endpoints_provider_chain_idx").on(table.provider, table.chainId),
  chainIdIdx: index("rpc_endpoints_chain_id_idx").on(table.chainId),
  isPrimaryIdx: index("rpc_endpoints_is_primary_idx").on(table.isPrimary),
  isActiveIdx: index("rpc_endpoints_is_active_idx").on(table.isActive),
}));

// Insert Schemas
export const insertVisitorSessionSchema = createInsertSchema(visitorSessions).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  viewedAt: true,
});

export const insertVisitorEventSchema = createInsertSchema(visitorEvents).omit({
  id: true,
  occurredAt: true,
});

// @deprecated - No longer used
const insertCasinoSpinSchema = createInsertSchema(casinoSpins).omit({
  id: true,
  createdAt: true,
});

// Security Infrastructure Insert Schemas
export const insertWithdrawalWhitelistSchema = createInsertSchema(withdrawalWhitelists).omit({
  id: true,
  createdAt: true,
});

export const insertAntiPhishingCodeSchema = createInsertSchema(antiPhishingCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeLockedWithdrawalSchema = createInsertSchema(timeLockedWithdrawals).omit({
  id: true,
  createdAt: true,
});

export const insertFraudDetectionLogSchema = createInsertSchema(fraudDetectionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProofOfReservesSchema = createInsertSchema(proofOfReserves).omit({
  id: true,
  snapshotTime: true,
});

export const insertSecurityIncidentSchema = createInsertSchema(securityIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRpcEndpointSchema = createInsertSchema(rpcEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type VisitorSession = typeof visitorSessions.$inferSelect;
export type InsertVisitorSession = z.infer<typeof insertVisitorSessionSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type VisitorEvent = typeof visitorEvents.$inferSelect;
export type InsertVisitorEvent = z.infer<typeof insertVisitorEventSchema>;
// @deprecated - No longer used
type CasinoSpin = typeof casinoSpins.$inferSelect;
type InsertCasinoSpin = z.infer<typeof insertCasinoSpinSchema>;

// Security Infrastructure Types
export type WithdrawalWhitelist = typeof withdrawalWhitelists.$inferSelect;
export type InsertWithdrawalWhitelist = z.infer<typeof insertWithdrawalWhitelistSchema>;
export type AntiPhishingCode = typeof antiPhishingCodes.$inferSelect;
export type InsertAntiPhishingCode = z.infer<typeof insertAntiPhishingCodeSchema>;
export type TimeLockedWithdrawal = typeof timeLockedWithdrawals.$inferSelect;
export type InsertTimeLockedWithdrawal = z.infer<typeof insertTimeLockedWithdrawalSchema>;
export type FraudDetectionLog = typeof fraudDetectionLogs.$inferSelect;
export type InsertFraudDetectionLog = z.infer<typeof insertFraudDetectionLogSchema>;
export type ProofOfReserves = typeof proofOfReserves.$inferSelect;
export type InsertProofOfReserves = z.infer<typeof insertProofOfReservesSchema>;
export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = z.infer<typeof insertSecurityIncidentSchema>;
export type RpcEndpoint = typeof rpcEndpoints.$inferSelect;
export type InsertRpcEndpoint = z.infer<typeof insertRpcEndpointSchema>;

// ============================================================================
// CODEX ATM - CRYPTO WITHDRAWAL SYSTEM
// ============================================================================

export const codexAtmWithdrawals = pgTable("codex_atm_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cryptoType: text("crypto_type").notNull(), // BTC, ETH, USDT, etc
  cryptoAmount: text("crypto_amount").notNull(), // Amount in crypto
  fiatAmount: text("fiat_amount").notNull(), // USD equivalent
  fiatCurrency: text("fiat_currency").notNull().default("USD"),
  withdrawalMethod: text("withdrawal_method").notNull(), // bank_transfer, debit_card, instant_cash
  destinationAccount: text("destination_account"), // Bank account or card last 4 digits
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  exchangeRate: text("exchange_rate").notNull(), // Crypto to fiat rate at time of withdrawal
  platformFee: text("platform_fee").notNull().default("0"), // ATM fee (e.g., 2% for instant)
  networkFee: text("network_fee").notNull().default("0"), // Blockchain network fee
  totalFiatReceived: text("total_fiat_received"), // Final amount received after fees
  transactionHash: text("transaction_hash"), // Blockchain tx hash
  processorReference: text("processor_reference"), // Payment processor reference ID
  estimatedArrival: timestamp("estimated_arrival"), // When funds will arrive
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("codex_atm_withdrawals_user_idx").on(table.userId),
  statusIdx: index("codex_atm_withdrawals_status_idx").on(table.status),
  createdAtIdx: index("codex_atm_withdrawals_created_at_idx").on(table.createdAt),
}));

export const insertCodexAtmWithdrawalSchema = createInsertSchema(codexAtmWithdrawals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CodexAtmWithdrawal = typeof codexAtmWithdrawals.$inferSelect;
export type InsertCodexAtmWithdrawal = z.infer<typeof insertCodexAtmWithdrawalSchema>;

// ============================================================================
// PRICE ALERTS
// ============================================================================
export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(), // BTC, ETH, SOL, etc
  targetPrice: decimal("target_price", { precision: 20, scale: 8 }).notNull(),
  direction: text("direction").notNull(), // 'above' or 'below'
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  triggered: text("triggered").notNull().default("false"),
  triggeredAt: timestamp("triggered_at"),
  enabled: text("enabled").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("price_alerts_user_idx").on(table.userId),
  symbolIdx: index("price_alerts_symbol_idx").on(table.symbol),
  enabledIdx: index("price_alerts_enabled_idx").on(table.enabled),
}));

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  triggeredAt: true,
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;

// ============================================================================
// TRADING LEADERBOARDS - Real-time rankings
// ============================================================================
export const traderPerformance = pgTable("trader_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletAddress: text("wallet_address"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  totalPnl: text("total_pnl").notNull().default("0"), // Total profit/loss in USD
  totalPnlPercent: text("total_pnl_percent").notNull().default("0"),
  totalTrades: text("total_trades").notNull().default("0"),
  winningTrades: text("winning_trades").notNull().default("0"),
  losingTrades: text("losing_trades").notNull().default("0"),
  winRate: text("win_rate").notNull().default("0"),
  totalVolume: text("total_volume").notNull().default("0"), // Total trading volume
  bestTrade: text("best_trade").notNull().default("0"), // Best single trade profit
  worstTrade: text("worst_trade").notNull().default("0"), // Worst single trade loss
  averageTradeSize: text("average_trade_size").notNull().default("0"),
  tradingStreak: text("trading_streak").notNull().default("0"), // Consecutive profitable days
  rank: text("rank").notNull().default("0"),
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond, elite
  weeklyPnl: text("weekly_pnl").notNull().default("0"),
  monthlyPnl: text("monthly_pnl").notNull().default("0"),
  isPublic: text("is_public").notNull().default("true"),
  lastTradeAt: timestamp("last_trade_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("trader_performance_user_idx").on(table.userId),
  rankIdx: index("trader_performance_rank_idx").on(table.rank),
  tierIdx: index("trader_performance_tier_idx").on(table.tier),
  pnlIdx: index("trader_performance_pnl_idx").on(table.totalPnl),
}));

// ============================================================================
// ACHIEVEMENTS & BADGES SYSTEM
// ============================================================================
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // unique identifier like "first_trade", "whale_hunter"
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // trading, social, staking, nft, exploration
  icon: text("icon").notNull().default("🏆"),
  rarity: text("rarity").notNull().default("common"), // common, uncommon, rare, epic, legendary
  xpReward: text("xp_reward").notNull().default("100"),
  tokenReward: text("token_reward").default("0"), // CDX token reward
  requirement: jsonb("requirement"), // JSON criteria to unlock
  isSecret: text("is_secret").notNull().default("false"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  progress: text("progress").notNull().default("0"), // 0-100 progress percentage
  unlockedAt: timestamp("unlocked_at"),
  claimedAt: timestamp("claimed_at"), // When rewards were claimed
  metadata: jsonb("metadata"),
}, (table) => ({
  userAchievementIdx: index("user_achievements_user_achievement_idx").on(table.userId, table.achievementId),
}));

// ============================================================================
// TRADING COMPETITIONS
// ============================================================================
export const tradingCompetitions = pgTable("trading_competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // pnl, volume, winrate, streak
  entryFee: text("entry_fee").notNull().default("0"),
  prizePool: text("prize_pool").notNull().default("0"),
  prizeDistribution: jsonb("prize_distribution"), // { "1": "50%", "2": "30%", "3": "20%" }
  maxParticipants: text("max_participants"),
  minParticipants: text("min_participants").notNull().default("2"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, active, ended, cancelled
  rules: jsonb("rules"),
  sponsorName: text("sponsor_name"),
  sponsorLogo: text("sponsor_logo"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusIdx: index("trading_competitions_status_idx").on(table.status),
  startTimeIdx: index("trading_competitions_start_time_idx").on(table.startTime),
}));

export const competitionEntries = pgTable("competition_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => tradingCompetitions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletAddress: text("wallet_address"),
  displayName: text("display_name"),
  score: text("score").notNull().default("0"),
  pnl: text("pnl").notNull().default("0"),
  tradesCount: text("trades_count").notNull().default("0"),
  rank: text("rank"),
  prizeWon: text("prize_won"),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastScoreUpdate: timestamp("last_score_update"),
}, (table) => ({
  competitionUserIdx: index("competition_entries_competition_user_idx").on(table.competitionId, table.userId),
  rankIdx: index("competition_entries_rank_idx").on(table.rank),
}));

// ============================================================================
// WHALE MOVEMENT TRACKER
// ============================================================================
export const whaleTracks = pgTable("whale_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  walletLabel: text("wallet_label"), // Known entity name
  chainId: text("chain_id").notNull().default("1"),
  transactionHash: text("transaction_hash"),
  transactionType: text("transaction_type").notNull(), // transfer, swap, stake, unstake, buy, sell
  tokenSymbol: text("token_symbol").notNull(),
  tokenAmount: text("token_amount").notNull(),
  usdValue: text("usd_value").notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  toLabel: text("to_label"), // e.g., "Binance", "Unknown DEX"
  impactScore: text("impact_score").notNull().default("0"), // 0-100 market impact estimate
  isSignificant: text("is_significant").notNull().default("false"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  walletIdx: index("whale_tracks_wallet_idx").on(table.walletAddress),
  tokenIdx: index("whale_tracks_token_idx").on(table.tokenSymbol),
  timestampIdx: index("whale_tracks_timestamp_idx").on(table.timestamp),
  significantIdx: index("whale_tracks_significant_idx").on(table.isSignificant),
}));

export const watchedWhales = pgTable("watched_whales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletAddress: text("wallet_address").notNull(),
  customLabel: text("custom_label"),
  notifyOnActivity: text("notify_on_activity").notNull().default("true"),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  userWalletIdx: index("watched_whales_user_wallet_idx").on(table.userId, table.walletAddress),
}));

// ============================================================================
// AI MARKET SENTIMENT
// ============================================================================
export const aiSentimentSnapshots = pgTable("ai_sentiment_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // BTC, ETH, overall
  sentimentScore: text("sentiment_score").notNull(), // -100 to 100
  sentimentLabel: text("sentiment_label").notNull(), // extreme_fear, fear, neutral, greed, extreme_greed
  twitterSentiment: text("twitter_sentiment"),
  newsSentiment: text("news_sentiment"),
  onchainSentiment: text("onchain_sentiment"),
  fearGreedIndex: text("fear_greed_index"),
  topKeywords: jsonb("top_keywords"), // Trending keywords
  newsHeadlines: jsonb("news_headlines"), // Top relevant headlines
  socialMentions: text("social_mentions"), // 24h mention count
  priceAtSnapshot: text("price_at_snapshot"),
  volumeChange24h: text("volume_change_24h"),
  prediction: text("prediction"), // bullish, bearish, neutral
  confidence: text("confidence"), // 0-100
  snapshotTime: timestamp("snapshot_time").notNull().defaultNow(),
}, (table) => ({
  symbolIdx: index("ai_sentiment_snapshots_symbol_idx").on(table.symbol),
  snapshotTimeIdx: index("ai_sentiment_snapshots_snapshot_time_idx").on(table.snapshotTime),
}));

// ============================================================================
// PLATFORM ACTIVITY FEED
// ============================================================================
export const platformActivity = pgTable("platform_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityType: text("activity_type").notNull(), // trade, swap, stake, nft_mint, nft_buy, achievement, competition_join, whale_alert
  userId: varchar("user_id").references(() => users.id),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  title: text("title").notNull(),
  description: text("description"),
  amount: text("amount"),
  tokenSymbol: text("token_symbol"),
  usdValue: text("usd_value"),
  transactionHash: text("transaction_hash"),
  chainId: text("chain_id"),
  metadata: jsonb("metadata"),
  isHighlight: text("is_highlight").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  typeIdx: index("platform_activity_type_idx").on(table.activityType),
  createdAtIdx: index("platform_activity_created_at_idx").on(table.createdAt),
  highlightIdx: index("platform_activity_highlight_idx").on(table.isHighlight),
}));

// ============================================================================
// PAPER TRADING (SIMULATION)
// ============================================================================
export const paperAccounts = pgTable("paper_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull().default("Practice Account"),
  initialBalance: text("initial_balance").notNull().default("100000"), // Starting balance in USD
  currentBalance: text("current_balance").notNull().default("100000"),
  totalPnl: text("total_pnl").notNull().default("0"),
  totalPnlPercent: text("total_pnl_percent").notNull().default("0"),
  totalTrades: text("total_trades").notNull().default("0"),
  winningTrades: text("winning_trades").notNull().default("0"),
  losingTrades: text("losing_trades").notNull().default("0"),
  holdings: jsonb("holdings").default('{}'), // { "BTC": "0.5", "ETH": "2.0" }
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("paper_accounts_user_idx").on(table.userId),
}));

export const paperTrades = pgTable("paper_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => paperAccounts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // buy, sell
  symbol: text("symbol").notNull(),
  amount: text("amount").notNull(),
  price: text("price").notNull(),
  totalValue: text("total_value").notNull(),
  pnl: text("pnl"),
  pnlPercent: text("pnl_percent"),
  status: text("status").notNull().default("completed"), // pending, completed, cancelled
  executedAt: timestamp("executed_at").defaultNow(),
}, (table) => ({
  accountIdx: index("paper_trades_account_idx").on(table.accountId),
  userIdx: index("paper_trades_user_idx").on(table.userId),
  symbolIdx: index("paper_trades_symbol_idx").on(table.symbol),
}));

// ============================================================================
// SMART TRADE ALERTS
// ============================================================================
export const smartAlerts = pgTable("smart_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  alertType: text("alert_type").notNull(), // whale_move, price_breakout, volume_spike, sentiment_shift, pattern_detected
  symbol: text("symbol"),
  condition: jsonb("condition"), // Alert trigger conditions
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"), // info, warning, critical
  triggered: text("triggered").notNull().default("false"),
  triggeredAt: timestamp("triggered_at"),
  acknowledged: text("acknowledged").notNull().default("false"),
  acknowledgedAt: timestamp("acknowledged_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("smart_alerts_user_idx").on(table.userId),
  typeIdx: index("smart_alerts_type_idx").on(table.alertType),
  triggeredIdx: index("smart_alerts_triggered_idx").on(table.triggered),
}));

// Insert Schemas
export const insertTraderPerformanceSchema = createInsertSchema(traderPerformance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
});

export const insertTradingCompetitionSchema = createInsertSchema(tradingCompetitions).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitionEntrySchema = createInsertSchema(competitionEntries).omit({
  id: true,
  joinedAt: true,
});

export const insertWhaleTrackSchema = createInsertSchema(whaleTracks).omit({
  id: true,
});

export const insertWatchedWhaleSchema = createInsertSchema(watchedWhales).omit({
  id: true,
  addedAt: true,
});

export const insertAiSentimentSnapshotSchema = createInsertSchema(aiSentimentSnapshots).omit({
  id: true,
  snapshotTime: true,
});

export const insertPlatformActivitySchema = createInsertSchema(platformActivity).omit({
  id: true,
  createdAt: true,
});

export const insertPaperAccountSchema = createInsertSchema(paperAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaperTradeSchema = createInsertSchema(paperTrades).omit({
  id: true,
  executedAt: true,
});

export const insertSmartAlertSchema = createInsertSchema(smartAlerts).omit({
  id: true,
  createdAt: true,
  triggeredAt: true,
  acknowledgedAt: true,
});

// Types
export type TraderPerformance = typeof traderPerformance.$inferSelect;
export type InsertTraderPerformance = z.infer<typeof insertTraderPerformanceSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type TradingCompetition = typeof tradingCompetitions.$inferSelect;
export type InsertTradingCompetition = z.infer<typeof insertTradingCompetitionSchema>;
export type CompetitionEntry = typeof competitionEntries.$inferSelect;
export type InsertCompetitionEntry = z.infer<typeof insertCompetitionEntrySchema>;
export type WhaleTrack = typeof whaleTracks.$inferSelect;
export type InsertWhaleTrack = z.infer<typeof insertWhaleTrackSchema>;
export type WatchedWhale = typeof watchedWhales.$inferSelect;
export type InsertWatchedWhale = z.infer<typeof insertWatchedWhaleSchema>;
export type AiSentimentSnapshot = typeof aiSentimentSnapshots.$inferSelect;
export type InsertAiSentimentSnapshot = z.infer<typeof insertAiSentimentSnapshotSchema>;
export type PlatformActivityEvent = typeof platformActivity.$inferSelect;
export type InsertPlatformActivity = z.infer<typeof insertPlatformActivitySchema>;
export type PaperAccount = typeof paperAccounts.$inferSelect;
export type InsertPaperAccount = z.infer<typeof insertPaperAccountSchema>;
export type PaperTrade = typeof paperTrades.$inferSelect;
export type InsertPaperTrade = z.infer<typeof insertPaperTradeSchema>;
export type SmartAlert = typeof smartAlerts.$inferSelect;
export type InsertSmartAlert = z.infer<typeof insertSmartAlertSchema>;
