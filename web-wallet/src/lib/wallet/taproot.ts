import { sha256 } from '@noble/hashes/sha256'
import { secp256k1 } from '@noble/curves/secp256k1'

const TAPROOT_HASH_TAG = 'TapTweak'

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function liftX(pubKey: Uint8Array) {
  return secp256k1.ProjectivePoint.fromHex(
    concatBytes(new Uint8Array([0x02]), pubKey)
  )
}

export function computeTaprootKeyNoScript(internalPubKey: Uint8Array): Uint8Array {
  const P = liftX(internalPubKey)
  const tagHash = sha256(new TextEncoder().encode(TAPROOT_HASH_TAG))
  const tHash = sha256(concatBytes(tagHash, tagHash, internalPubKey))
  const tInt = BigInt('0x' + Array.from(tHash).map(b => b.toString(16).padStart(2, '0')).join(''))
  const Q = P.add(secp256k1.ProjectivePoint.BASE.multiply(tInt))
  const raw = Q.toRawBytes(true)
  return raw.slice(1)
}

export function computeTaprootOutputKey(
  internalPubKey: Uint8Array,
  scriptRoot: Uint8Array
): Uint8Array {
  const P = liftX(internalPubKey)
  const tagHash = sha256(new TextEncoder().encode(TAPROOT_HASH_TAG))
  const tHash = sha256(concatBytes(tagHash, tagHash, internalPubKey, scriptRoot))
  const tInt = BigInt('0x' + Array.from(tHash).map(b => b.toString(16).padStart(2, '0')).join(''))
  const Q = P.add(secp256k1.ProjectivePoint.BASE.multiply(tInt))
  const raw = Q.toRawBytes(true)
  return raw.slice(1)
}
