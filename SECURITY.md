# Security Features

This document describes the security features built into the NFT Patents platform across smart contracts and the frontend.

---

## Smart Contract Security

### PatentNFT.sol

**Reentrancy Protection**
The contract inherits OpenZeppelin's `ReentrancyGuard`. Both `mintPatentNFT` and `withdraw` are marked `nonReentrant`, blocking reentrancy attacks on ETH-handling functions.

**Patent Deduplication**
Each patent number is normalized (whitespace/dashes stripped, letters uppercased) and stored as a `keccak256` hash. The mapping `_patentHashToTokenId` prevents the same patent from ever being minted twice, regardless of formatting differences in the input.

**Secure Withdrawals**
The `withdraw` function uses `call{value: ...}("")` instead of `transfer()`, which avoids gas-limit failures with smart contract wallets and follows current Solidity best practices.

**On-Chain Royalties**
Implements ERC-2981 for standardized royalty support, allowing marketplaces to automatically distribute royalties to the original creator.

**Access Control**
Admin-only operations (`setMintingPrice`, `setBaseMetadataURI`, `mintPatent`, `withdraw`) are gated by OpenZeppelin's `Ownable` pattern. All public minting goes through the standard payment-gated `mintPatentNFT` function.

**Payment Validation**
`mintPatentNFT` requires `msg.value >= mintingPrice` before any state changes occur, ensuring underpayment is rejected at the entry point.

---

### NFTMarketplace.sol

**Reentrancy Protection**
`listNFT` and `buyNFT` are both `nonReentrant`. State changes (deactivating the listing) happen before any ETH or NFT transfers.

**Pull Payment Pattern**
ETH is never pushed directly to sellers or buyers. Proceeds are credited to a `pendingWithdrawals` mapping and withdrawn separately via `withdrawFunds()`. This eliminates push-payment failure risks and the reentrancy vectors that come with them.

**Self-Purchase Prevention**
`buyNFT` explicitly rejects `msg.sender == listing.seller`, preventing wash-trade loops.

**Overpayment Refunds**
Any ETH sent above the listing price is automatically credited back to the buyer's `pendingWithdrawals` balance.

**Ownership and Approval Verification**
Before listing, the contract verifies the caller is the token owner and that the marketplace contract has been approved to transfer the NFT. This prevents listings from being created by non-owners.

**Platform Fee Cap**
`setPlatformFee` enforces a hard maximum of 10% (1000 basis points). The fee cannot be set higher regardless of owner intent.

**Zero-Address Guards**
The constructor and `setFeeRecipient` both reject `address(0)` as the fee recipient.

---

### PSPToken.sol

**Hard Supply Cap**
`MAX_SUPPLY` is a compile-time constant (10 million tokens). Both `purchaseTokens` and `mint` revert if a new mint would exceed it, preventing inflation.

**Emergency Pause**
Inherits OpenZeppelin's `Pausable`. The `pause()` and `unpause()` functions are owner-only. The `_update` override applies `whenNotPaused` to all token transfers, burns, and mints, allowing the contract to be frozen immediately if an issue is detected.

**Authorized Spender Model**
The `spendTokensFor` function (used by the `SearchPayment` contract) is restricted to addresses explicitly whitelisted by the owner via `setAuthorizedSpender`. Unauthorized callers are rejected.

**Burn-on-Spend**
Tokens spent via `spendTokensFor` are burned from the supply rather than accumulated, creating deflationary pressure and preventing the contract from holding user funds unexpectedly.

**Secure ETH Withdrawal**
`withdrawETH` and `redeemTokens` both use `call{value: ...}("")` with a success check, consistent with current Solidity payment best practices.

---

## Frontend Security

### XSS Prevention (`src/utils/security.ts`)

`SecurityUtils.sanitizeInput()` strips angle brackets, `javascript:` protocol strings, and inline event handler patterns from all user-supplied strings before they reach any rendering or API call path. Input is also capped at 1,000 characters.

No dangerous DOM patterns are used anywhere in the codebase:
- No `eval()`
- No `dangerouslySetInnerHTML`
- No `document.write`
- No direct `innerHTML` manipulation

### Input Validation

`SecurityUtils` provides typed validators used throughout the application:

| Validator | What it checks |
|---|---|
| `validatePatentNumber()` | Regex format match for US patent numbers |
| `validateEthereumAddress()` | 0x-prefixed 40-character hex string |
| `validateApiKey()` | Provider-specific prefix and minimum length (OpenAI, Gemini, Claude) |
| `validateUrl()` | HTTPS-only, optional domain allowlist, rejects open redirects |

### Secure Storage

`SecurityUtils.secureLocalStorage` wraps `localStorage` with a timestamp-based expiration system. Stale data is automatically removed on read.

API keys are stored only in `sessionStorage` for the minimum time needed and removed immediately after use. They are never written to `localStorage` or committed to state.

### Rate Limiting

Two rate limiters are exported as singletons:

- `apiRateLimiter` — 10 requests per minute for general API calls
- `searchRateLimiter` — 5 requests per minute for patent searches

These are enforced client-side before any network request is made.

### Content Security Policy

`SecurityUtils.setupCSP()` injects a `<meta http-equiv="Content-Security-Policy">` tag that:
- Restricts `connect-src` to known API endpoints (OpenAI, Google, Anthropic, Infura)
- Blocks all `object-src`
- Locks `base-uri` and `form-action` to `'self'`

### Web3 Integration

- Private keys are never stored, requested, or logged
- MetaMask detection uses the standard `window.ethereum` provider API without unsafe injection
- All Web3 calls are wrapped in `try/catch` with typed error handling
- Address validation is applied before any contract interaction

### Secure Random Generation

`SecurityUtils.generateSecureRandom()` uses the browser's `crypto.getRandomValues()` API, not `Math.random()`.

### Security Event Logging

`SecurityUtils.logSecurityEvent()` captures security-relevant events (failed validation, rate limit hits, etc.) with timestamp, URL, and user agent. In production this can be forwarded to a monitoring service.

---

## Emergency Procedures

### Pause All Token Operations

```bash
npx hardhat run scripts/emergency/pauseAll.js --network mainnet
```

Calls `pause()` on `PSPToken`, halting all transfers, mints, and burns until unpaused.

### Unpause

```bash
npx hardhat run scripts/emergency/unpauseAll.js --network mainnet
```

### Emergency Withdraw (Marketplace)

The `emergencyWithdraw()` function on `NFTMarketplace` allows the owner to drain the contract's ETH balance to the owner address in a single owner-gated transaction.

---

## Production Recommendations

The following are not yet implemented and are recommended before a high-value mainnet launch:

- **Multi-signature ownership** — Replace single-owner EOA with a Gnosis Safe (2-of-3 minimum) for all contract admin functions
- **Timelock on parameter changes** — Add a delay before critical changes (price updates, fee changes) take effect, giving users time to react
- **External security audit** — Commission an independent audit before significant TVL is at risk
- **On-chain monitoring** — Set up alerts for large ETH transfers, high-value sales, and unusual gas spikes
