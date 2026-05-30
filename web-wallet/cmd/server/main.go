// Pearl Wallet API Server
// Provides wallet derivation and XMSS operations via HTTP.
// The web wallet uses this server for cross-check verification
// and XMSS post-quantum address generation.
//
// Build: go build -o ../../bin/server .
// Run:   ./bin/server --port 8447 --network mainnet

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/pearl-research-labs/pearl/node/btcec"
	"github.com/pearl-research-labs/pearl/node/btcec/schnorr"
	"github.com/pearl-research-labs/pearl/node/btcutil"
	"github.com/pearl-research-labs/pearl/node/btcutil/hdkeychain"
	"github.com/pearl-research-labs/pearl/node/chaincfg"
	"github.com/pearl-research-labs/pearl/node/txscript"
	"github.com/pearl-research-labs/pearl/wallet/waddrmgr"

	bip39 "github.com/tyler-smith/go-bip39"
)

var (
	port     = flag.Int("port", 8447, "HTTP server port")
	network  = flag.String("network", "mainnet", "Network: mainnet, testnet, regtest, simnet")
	useXMSS  = flag.Bool("xmss", false, "Enable XMSS post-quantum support")
	coinType uint32
	params   *chaincfg.Params
)

func main() {
	flag.Parse()

	switch *network {
	case "mainnet":
		params = &chaincfg.MainNetParams
		coinType = chaincfg.HDCoinTypePearl
	case "testnet":
		params = &chaincfg.TestNetParams
		coinType = chaincfg.HDCoinTypeTestnet
	case "regtest":
		params = &chaincfg.RegressionNetParams
		coinType = chaincfg.HDCoinTypeTestnet
	case "simnet":
		params = &chaincfg.SimNetParams
		coinType = chaincfg.HDCoinTypeTestnet
	default:
		log.Fatalf("unknown network: %s", *network)
	}

	waddrmgr.InitKeyScopes(coinType)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/derive", cors(handleDerive))
	mux.HandleFunc("/api/verify", cors(handleVerify))
	mux.HandleFunc("/api/derive-xmss", cors(handleDeriveXMSS))
	mux.HandleFunc("/api/health", cors(handleHealth))

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Pearl Wallet API Server starting on %s (network=%s, xmss=%v)", addr, *network, *useXMSS)

	go func() {
		if err := http.ListenAndServe(addr, mux); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	log.Println("shutting down")
}

func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

type deriveRequest struct {
	Mnemonic     string `json:"mnemonic"`
	AddressIndex uint32 `json:"addressIndex"`
}

type deriveResponse struct {
	Address        string `json:"address"`
	DerivationPath string `json:"derivationPath"`
	AddressIndex   uint32 `json:"addressIndex"`
	CoinType       uint32 `json:"coinType"`
	Network        string `json:"network"`
	XOnlyPubKey    string `json:"xonlyPubKey"`
	TaprootKey     string `json:"taprootKey"`
}

type verifyRequest struct {
	Mnemonic        string `json:"mnemonic"`
	ExpectedAddress string `json:"expectedAddress"`
	AddressIndex    uint32 `json:"addressIndex"`
}

type verifyResponse struct {
	Passed      bool   `json:"passed"`
	Computed    string `json:"computed"`
	Expected    string `json:"expected"`
	Match       bool   `json:"match"`
	Description string `json:"description"`
}

type xmssDeriveRequest struct {
	Mnemonic     string `json:"mnemonic"`
	AddressIndex uint32 `json:"addressIndex"`
}

type xmssDeriveResponse struct {
	BIP86Address  string `json:"bip86Address"`
	XMSSAddress   string `json:"xmssAddress"`
	XMSSPubKey    string `json:"xmssPubKey"`
	DerivationPath string `json:"derivationPath"`
	PQPath        string `json:"pqPath"`
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{
		"status":  "ok",
		"network": *network,
		"xmss":    *useXMSS,
		"version": "1.0.0",
	})
}

func derivePearlAddress(mnemonic string, addressIndex uint32) (string, string, string, string, error) {
	seed := bip39.NewSeed(mnemonic, "")
	masterKey, err := hdkeychain.NewMaster(seed, params)
	if err != nil {
		return "", "", "", "", fmt.Errorf("master key: %w", err)
	}

	path := fmt.Sprintf("m/86'/%d'/0'/0/%d", coinType, addressIndex)
	addrKey, err := deriveKeyFromPath(masterKey, path)
	if err != nil {
		return "", "", "", "", fmt.Errorf("derivation: %w", err)
	}

	pubKey, err := addrKey.ECPubKey()
	if err != nil {
		return "", "", "", "", fmt.Errorf("pubkey: %w", err)
	}

	xOnly := schnorr.SerializePubKey(pubKey)
	taprootKey := txscript.ComputeTaprootKeyNoScript(pubKey)
	taprootXOnly := schnorr.SerializePubKey(taprootKey)

	address, err := btcutil.NewAddressTaproot(taprootXOnly, params)
	if err != nil {
		return "", "", "", "", fmt.Errorf("address: %w", err)
	}

	return address.EncodeAddress(), path,
		fmt.Sprintf("%x", xOnly), fmt.Sprintf("%x", taprootXOnly), nil
}

func handleDerive(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req deriveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	if !bip39.IsMnemonicValid(req.Mnemonic) {
		writeError(w, http.StatusBadRequest, "invalid BIP39 mnemonic")
		return
	}

	addr, path, xonly, taproot, err := derivePearlAddress(req.Mnemonic, req.AddressIndex)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, deriveResponse{
		Address:        addr,
		DerivationPath: path,
		AddressIndex:   req.AddressIndex,
		CoinType:       coinType,
		Network:        *network,
		XOnlyPubKey:    xonly,
		TaprootKey:     taproot,
	})
}

func handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req verifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	computed, _, _, _, err := derivePearlAddress(req.Mnemonic, req.AddressIndex)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	passed := computed == req.ExpectedAddress
	desc := fmt.Sprintf("Addresses %s: computed=%s expected=%s",
		map[bool]string{true: "MATCH", false: "MISMATCH"}[passed],
		computed, req.ExpectedAddress)

	writeJSON(w, verifyResponse{
		Passed:      passed,
		Computed:    computed,
		Expected:    req.ExpectedAddress,
		Match:       passed,
		Description: desc,
	})
}

func handleDeriveXMSS(w http.ResponseWriter, r *http.Request) {
	if !*useXMSS {
		writeError(w, http.StatusNotImplemented,
			"XMSS support not enabled (start server with --xmss flag)")
		return
	}

	if r.Method != "POST" {
		writeError(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	var req xmssDeriveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	if !bip39.IsMnemonicValid(req.Mnemonic) {
		writeError(w, http.StatusBadRequest, "invalid BIP39 mnemonic")
		return
	}

	seed := bip39.NewSeed(req.Mnemonic, "")
	masterKey, err := hdkeychain.NewMaster(seed, params)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "master key: "+err.Error())
		return
	}

	bip86Path := fmt.Sprintf("m/86'/%d'/0'/0/%d", coinType, req.AddressIndex)
	bip86Key, _ := deriveKeyFromPath(masterKey, bip86Path)
	bip86Pub, _ := bip86Key.ECPubKey()
	bip86Taproot := txscript.ComputeTaprootKeyNoScript(bip86Pub)
	bip86Addr, _ := btcutil.NewAddressTaproot(
		schnorr.SerializePubKey(bip86Taproot), params,
	)

	xmssHex, err := deriveXMSSPublicKeyHex(masterKey, bip86Pub, req.AddressIndex)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "XMSS: "+err.Error())
		return
	}

	xmssAddr, err := deriveXMSSAddress(masterKey, bip86Pub, req.AddressIndex)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "XMSS address: "+err.Error())
		return
	}

	pqPath := fmt.Sprintf("m/222'/%d'/0'/0/%d", coinType, req.AddressIndex)

	writeJSON(w, xmssDeriveResponse{
		BIP86Address:   bip86Addr.EncodeAddress(),
		XMSSAddress:    xmssAddr,
		XMSSPubKey:     xmssHex,
		DerivationPath: bip86Path,
		PQPath:         pqPath,
	})
}

func deriveKeyFromPath(key *hdkeychain.ExtendedKey, path string) (*hdkeychain.ExtendedKey, error) {
	current := key
	parts := path[len("m/"):]

	i := 0
	for i < len(parts) {
		j := i
		for j < len(parts) && parts[j] != '/' {
			j++
		}
		part := parts[i:j]
		i = j + 1

		var index uint32
		if part[len(part)-1] == '\'' {
			index = mustParseUint32(part[:len(part)-1]) + hdkeychain.HardenedKeyStart
		} else {
			index = mustParseUint32(part)
		}

		var err error
		current, err = current.Derive(index)
		if err != nil {
			return nil, err
		}
	}
	return current, nil
}

func mustParseUint32(s string) uint32 {
	var v uint32
	for _, c := range s {
		v = v*10 + uint32(c-'0')
	}
	return v
}

func deriveXMSSPublicKeyHex(masterKey *hdkeychain.ExtendedKey, bip86Pub *btcec.PublicKey, addrIndex uint32) (string, error) {
	pqPath := fmt.Sprintf("m/222'/%d'/0'/0/%d", coinType, addrIndex)
	pqKey, err := deriveKeyFromPath(masterKey, pqPath)
	if err != nil {
		return "", err
	}
	pqPub, err := pqKey.ECPubKey()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", pqPub.SerializeCompressed()), nil
}

func deriveXMSSAddress(masterKey *hdkeychain.ExtendedKey, bip86Pub *btcec.PublicKey, addrIndex uint32) (string, error) {
	pqPath := fmt.Sprintf("m/222'/%d'/0'/0/%d", coinType, addrIndex)
	pqKey, err := deriveKeyFromPath(masterKey, pqPath)
	if err != nil {
		return "", err
	}
	pqPub, err := pqKey.ECPubKey()
	if err != nil {
		return "", err
	}

	xmssScript, _ := txscript.NewScriptBuilder().
		AddData(pqPub.SerializeCompressed()).
		AddOp(txscript.OP_CHECKXMSSSIG).
		Script()

	tapLeaf := txscript.NewBaseTapLeaf(xmssScript)
	tapTree := txscript.AssembleTaprootScriptTree(tapLeaf)
	rootHash := tapTree.RootNode.TapHash()

	taprootKey := txscript.ComputeTaprootOutputKey(bip86Pub, rootHash[:])
	addr, err := btcutil.NewAddressTaproot(
		schnorr.SerializePubKey(taprootKey), params,
	)
	if err != nil {
		return "", err
	}

	return addr.EncodeAddress(), nil
}
