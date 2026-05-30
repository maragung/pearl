#!/bin/bash
# Build the Go WASM module for Pearl Wallet cross-check verification.
#
# Prerequisites:
#   - Go 1.21+ (go version)
#
# This script compiles the Go wallet derivation logic to WebAssembly,
# enabling cross-check verification between the JS and Go implementations.
#
# For XMSS support (post-quantum addresses), the XMSS C library must be
# compiled to WASM separately using emscripten. See:
#   ../../xmss/README.md
#   https://emscripten.org/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/public"

echo "Building Go WASM module..."
echo "  Source: $SCRIPT_DIR"
echo "  Output: $OUTPUT_DIR"

mkdir -p "$OUTPUT_DIR"

GOOS=js GOARCH=wasm go build \
  -o "$OUTPUT_DIR/pearl-wallet.wasm" \
  -ldflags="-s -w" \
  "$SCRIPT_DIR"

echo "WASM module built: $OUTPUT_DIR/pearl-wallet.wasm"

# Copy the WASM execution wrapper from Go distribution
WASM_EXEC="$(go env GOROOT)/misc/wasm/wasm_exec.js"
if [ -f "$WASM_EXEC" ]; then
  cp "$WASM_EXEC" "$OUTPUT_DIR/wasm_exec.js"
  echo "WASM exec JS copied: $OUTPUT_DIR/wasm_exec.js"
fi

echo "Done."
echo ""
echo "To load the WASM module in the browser:"
echo '  <script src="/wasm_exec.js"></script>'
echo '  <script>'
echo '    const go = new Go();'
echo '    WebAssembly.instantiateStreaming('
echo '      fetch("/pearl-wallet.wasm"), go.importObject'
echo '    ).then(result => {'
echo '      go.run(result.instance);'
echo '      // Now pearlWasm.deriveAddress() is available'
echo '    });'
echo '  </script>'
