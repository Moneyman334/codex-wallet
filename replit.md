# Overview
CODEX Wallet is a secure cryptocurrency platform offering production-ready iOS and Android mobile apps. It integrates real DeFi protocols, multi-chain wallet support, and comprehensive transaction protection, adhering to CCSS/SOC 2-grade standards. The platform provides blockchain-native e-commerce, payment processing (Chaos Pay), an NFT marketplace, margin/futures trading, copy trading, social media automation, and competitive social features. It operates with a dual-domain strategy: `getcodexpay.com` for merchant acquisition and payment processing, and the CODEX Hub (`/codex-ecosystem`) as a central command center for accessing over 15 Web3 ecosystem services.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme, interactive elements (hover effects, 3D card tilts, parallax scrolling, custom cursor), and glassmorphism. It uses shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards.

## Technical Implementations

### Frontend
Built with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query v5 for server state management. It includes a `useWeb3` hook for MetaMask integration, React Hook Form with Zod for validation, performance optimizations, and comprehensive error handling. Native iOS features are implemented using Capacitor 7.x, including biometric authentication, haptic feedback, local notifications, and native sharing.

### Backend
An Express.js and TypeScript REST API with modular routes, using PostgreSQL and Drizzle ORM. It offers over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and a Real-Time Price Service. Security measures encompass multi-layer security, transaction fraud detection, hardened CSP, security headers, IPv6-safe rate limiting, input sanitization, CORS hardening, secure error handling, request signing/validation, and an Owner/Admin Protection System.

## Feature Specifications

### Enterprise Security Infrastructure
Implements Multi-Layer Transaction Security Enforcement with Emergency Lockdown, Velocity Limiting, Withdrawal Whitelists, AI-Powered Fraud Detection, Time-Locked Withdrawals, and adheres to CCSS and SOC 2 Type II audit-ready infrastructure. A Tiered Rate Limiting System provides varying API limits based on subscription tiers.

### Web3 & Blockchain
Features a Real Blockchain Staking System integrated with DeFi lending protocols, multi-chain support across 22 networks, Cross-Chain Bridge Integration, and an Auto-Deploy System for ERC-20/ERC-721 tokens. Includes a Codex Wallet Nexus for multi-chain wallet management, a platform token (CDX), NFTs, AI-powered Living Achievements, and an Empire Vault acting as a DAO Treasury. Also offers advanced wallet security, smart contract generators, multi-cryptocurrency support, and a Proof of Reserves System with a public Transparency Hub.

### CHAOS PAY - Payment Processing Platform
A comprehensive payment processing system for merchants, featuring instant auto-approval for beta merchants, email-first security for API key delivery, and a beta landing page (`/chaos-pay/beta`). Core features include a beta program admin dashboard, automated welcome emails, merchant accounts with KYC, settlement wallets, customizable fees, a Payment Intents API for crypto + fiat, API Key Management, Payment Links, Instant Crypto Settlements, Multi-Currency Support, and a Merchant Dashboard with analytics and webhook system.

### CHAOS ATM - Crypto-to-Fiat Withdrawal System
Enables crypto-to-fiat conversion via trusted third-party off-ramp providers, displaying real Web3 wallet balances, and integrating industry-leading off-ramp services for bank/card withdrawals with robust security measures.

### EMPIRE API PLATFORM - Developer Integration System
A platform for third-party integration, ensuring zero race conditions with atomic transaction enforcement. It features bcrypt hashed API keys, enhanced security tracking, tiered rate limiting, Office Location Tracking, Request Timing Analytics, Burst Detection, and HTTPS-Only Webhooks. A Developer Portal provides API key management, interactive documentation, usage analytics, and tier upgrades.

### Trading & Automation
Includes a DEX Aggregator, a Buy & Trade Crypto Platform, an advanced Copy Trading System, a Margin/Futures Trading System, and a sophisticated AI Trading Bot system. Features House Vaults System for player-owned liquidity, a Yield Farming System, and an Instant Settlement System.

### Competitive & Social Features
Includes a Trading Leaderboard, Whale Movement Tracker, AI Market Sentiment Analyzer, Paper Trading, Trading Competitions, and a Live Activity Feed to enhance user engagement and trading insights.

### NFT Marketplace
Supports curated NFT collections, Web3 wallet checkout, smart filtering, collection statistics, featured NFTs, listing management, real-time updates, and rarity indicators.

### E-commerce & Payments
A Complete Checkout System with persistent shopping carts, Web3 wallet direct payments, NOWPayments multi-crypto support, and Chaos Pay integration. A Universal Payment System accepts all world currencies, complemented by advanced e-commerce features like multi-currency support, discount codes, gift cards, wallet-based loyalty points, blockchain-verified product reviews, subscription/recurring payments, affiliate/referral system, on-chain NFT receipts, and Chaos Pay merchant accounts.

### Marketing & Analytics
Provides a Command Center, Marketing Overview Dashboard, Marketing Campaign Management, and Social Media Automation for Twitter.

### Revenue Collection
All platform fees (DEX 0.3%, Chaos Pay 0.5%, NFT 2%, Trading Bots 0.1%, Launchpad 7.5%, Bridge 0.1%, Staking 10%) are directed to the `MERCHANT_ADDRESS` secret. The Auto-Compound Engine collects a 10% performance fee on staking rewards.

### Payment Gateway Configuration
Integrates Stripe for card payments (fully configured with webhook) and NOWPayments for crypto payments (supporting 300+ cryptocurrencies with API Key, IPN Secret, and payout wallet configuration).

### Mobile App Integration
The website is prepared for Google Play and App Store launch with dedicated download sections, a mobile app features page, and centralized configuration for activation.

# External Dependencies
- React
- TypeScript
- Express.js
- Vite
- Drizzle ORM
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Radix UI
- Lucide React
- Framer Motion
- MetaMask SDK
- Ethereum Provider API
- wagmi v2
- viem v2
- @rainbow-me/rainbowkit
- ethers v6
- PostgreSQL (via Neon serverless)
- connect-pg-simple
- Zod
- date-fns
- Wouter
- node-cron
- NOWPayments API
- Coinbase Pro SDK
- Twitter API v2 SDK (twitter-api-v2)
- CoinGecko API
- Aave V3 Protocol