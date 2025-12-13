import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  code: string
  className?: string
}

export function CopyButton({ code, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      className={cn(
        'absolute top-3 right-3 z-10',
        'bg-white/10 backdrop-blur-sm border border-white/10',
        'hover:bg-white/20',
        copied && 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
        className
      )}
      aria-label={copied ? 'Copied!' : 'Copy code'}
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  )
}
