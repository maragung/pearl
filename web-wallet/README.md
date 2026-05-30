# Pearl Web Wallet

A browser-based Pearl Wallet with Create, Import, Export, and Cross-Check verification.

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS 4** (responsive, mobile-first)
- **shadcn/ui** patterns (Radix primitives)
- **Zustand** state management
- **@noble/hashes** + **@noble/curves** (pure-JS crypto)

## Quick Start

```bash
cd web-wallet
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Features

| Feature | Status |
|---------|--------|
| Create Wallet (BIP-39 → BIP-86 Taproot) | ✅ |
| Import Wallet (seed phrase / JSON file) | ✅ |
| Export Wallet (JSON → `oyster --createfromfile`) | ✅ |
| Address Display (Bech32m with QR code) | ✅ |
| Cross-Check Verification (re-derive + validate) | ✅ |
| Go WASM Cross-Check Module | ⚙️ Build required |
| XMSS Post-Quantum Addresses | 🚧 Go WASM |

## Cross-Check Verification

The wallet automatically verifies every address it generates:

1. **Mnemonic validation** — BIP39 checksum check
2. **Address format** — Valid Bech32m with correct HRP (`prl1`/`tprl1`)
3. **HRP match** — Address prefix matches selected network
4. **Derivation idempotency** — Re-deriving produces the same address

For external verification against the Go binary:

```bash
# 1. Export the wallet JSON
#    (click "Export Wallet File" in the web wallet)

# 2. Import into oyster binary
./bin/oyster -u rpcuser -P rpcpass --createfromfile=export.json

# 3. Compare addresses
./bin/prlctl -u rpcuser -P rpcpass getnewaddress
```

## Export Format

The export JSON is compatible with `oyster --createfromfile`:

```json
{
  "walletVersion": 1,
  "network": "mainnet",
  "PrivatePassphrase": "your-password",
  "PublicPassphrase": "public",
  "Seed": "12-word BIP39 seed phrase",
  "derivationPath": "m/86'/808276'/0'/0/0",
  "address": "prl1...",
  "Bday": "1767052800",
  "createdAt": "2026-05-30T00:00:00Z"
}
```

## Go WASM Module (for advanced cross-check)

```bash
cd cmd/wasm
./build.sh
```

This compiles the Go wallet derivation logic to WASM for direct comparison against the JS implementation.

## XMSS Post-Quantum Support

XMSS addresses require the C-based XMSS library compiled to WASM. This is a future enhancement. The current version supports BIP-86 Taproot addresses (key-path only, without PQ tapscript commitment).

## Build

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Project Structure

```
web-wallet/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router + Layout
│   ├── lib/wallet/           # Wallet crypto library
│   │   ├── bip39.ts          # BIP39 mnemonic generation/validation
│   │   ├── hdkeychain.ts     # BIP-32 HD key chain
│   │   ├── bip86.ts          # BIP-86 address derivation
│   │   ├── taproot.ts        # Taproot key tweaking
│   │   ├── address.ts        # Bech32m encode/decode
│   │   ├── networks.ts       # Network constants
│   │   ├── export.ts         # Export/import file format
│   │   ├── verify.ts         # Cross-check verification
│   │   └── crypto.ts         # Utility functions
│   ├── pages/
│   │   ├── Welcome.tsx       # Landing page
│   │   ├── CreateWallet.tsx  # 4-step wallet creation
│   │   ├── ImportWallet.tsx  # Import from seed/file
│   │   └── Dashboard.tsx     # Wallet dashboard
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── SeedDisplay.tsx
│   │   ├── SeedVerify.tsx
│   │   ├── AddressCard.tsx
│   │   └── VerifyBadge.tsx
│   └── store/
│       └── walletStore.ts    # Zustand state
└── cmd/wasm/
    ├── main.go               # Go WASM entry point
    └── build.sh              # WASM build script
```
