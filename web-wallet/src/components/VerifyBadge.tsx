import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react'
import type { VerificationResult } from '@/lib/wallet/verify'

interface VerifyBadgeProps {
  verification: VerificationResult | null
  className?: string
}

export default function VerifyBadge({ verification, className = '' }: VerifyBadgeProps) {
  if (!verification) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Pending verification
      </div>
    )
  }

  if (verification.passed) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ${className}`}>
        <ShieldCheck className="h-3 w-3" />
        Verified
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ${className}`}>
      <ShieldX className="h-3 w-3" />
      Verification Failed
    </div>
  )
}
