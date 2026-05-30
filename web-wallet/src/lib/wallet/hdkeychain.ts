import { hmac } from '@noble/hashes/hmac'
import { sha512 } from '@noble/hashes/sha512'
import { concatBytes } from '@/lib/wallet/crypto'
import { mod } from '@noble/curves/abstract/modular'
import { secp256k1 } from '@noble/curves/secp256k1'

const HARDENED_OFFSET = 0x80000000

function isHardened(index: number): boolean {
  return index >= HARDENED_OFFSET
}

function toBigIntBE(bytes: Uint8Array): bigint {
  let result = 0n
  for (const b of bytes) {
    result = (result << 8n) + BigInt(b)
  }
  return result
}

function parse25519(seed: Uint8Array): { key: Uint8Array; chainCode: Uint8Array } {
  const I = hmac(sha512, 'Bitcoin seed', seed)
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32, 64),
  }
}

function CKDpriv(
  key: Uint8Array,
  chainCode: Uint8Array,
  index: number
): { key: Uint8Array; chainCode: Uint8Array } {
  const indexBytes = new Uint8Array(4)
  indexBytes[0] = (index >> 24) & 0xff
  indexBytes[1] = (index >> 16) & 0xff
  indexBytes[2] = (index >> 8) & 0xff
  indexBytes[3] = index & 0xff

  let data: Uint8Array
  if (isHardened(index)) {
    const padding = new Uint8Array(1)
    data = concatBytes(padding, key, indexBytes)
  } else {
    const pubKey = pointFromKey(key)
    data = concatBytes(pubKey, indexBytes)
  }

  const I = hmac(sha512, chainCode, data)
  const IL = I.slice(0, 32)
  const IR = I.slice(32, 64)

  const keyInt = mod(toBigIntBE(IL) + toBigIntBE(key), secp256k1.CURVE.n)
  if (keyInt === 0n) throw new Error('invalid key')
  const newKey = new Uint8Array(32)
  const keyHex = keyInt.toString(16).padStart(64, '0')
  for (let i = 0; i < 32; i++) {
    newKey[i] = parseInt(keyHex.substring(i * 2, i * 2 + 2), 16)
  }

  return { key: newKey, chainCode: IR }
}

function pointFromKey(privateKey: Uint8Array): Uint8Array {
  const d = toBigIntBE(privateKey)
  const point = secp256k1.ProjectivePoint.fromPrivateKey(d)
  return point.toRawBytes(true)
}

export function xonlyPubKey(privateKey: Uint8Array): Uint8Array {
  const point = secp256k1.ProjectivePoint.fromPrivateKey(toBigIntBE(privateKey))
  const raw = point.toRawBytes(true)
  return raw.slice(1)
}

export interface HDKey {
  key: Uint8Array
  chainCode: Uint8Array
}

export function fromSeed(seed: Uint8Array): HDKey {
  return parse25519(seed)
}

export function derivePath(root: HDKey, path: string): HDKey {
  const components = path.split('/')
  if (components[0] !== 'm') throw new Error('Invalid path: must start with m')

  let current = root
  for (let i = 1; i < components.length; i++) {
    const c = components[i]
    let index: number
    if (c.endsWith("'")) {
      index = parseInt(c.slice(0, -1)) + HARDENED_OFFSET
    } else {
      index = parseInt(c)
    }
    current = CKDpriv(current.key, current.chainCode, index)
  }
  return current
}
