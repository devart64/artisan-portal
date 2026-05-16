'use client'

export function ExportButton({ path, label }: { path: string; label: string }) {
  async function handleDownload() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      credentials: 'include',
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = path.split('/').pop()!
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      {label}
    </button>
  )
}
