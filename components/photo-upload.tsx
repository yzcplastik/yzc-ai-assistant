"use client"

import { Camera, ImagePlus, X } from "lucide-react"
import { useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.82

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas desteklenmiyor")
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
}

interface PhotoUploadProps {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
  hint?: string
}

export function PhotoUpload({ value, onChange, label = "Fotoğraf", hint = "İrsaliye, palet veya ürün fotoğrafı ekleyin." }: PhotoUploadProps) {
  const id = useId()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görüntü dosyası seçin.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      onChange(await compressImage(file))
    } catch {
      setError("Fotoğraf işlenemedi. Tekrar deneyin.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        ref={cameraRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Galeriden fotoğraf seç"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Yüklenen fotoğraf önizlemesi" className="max-h-72 w-full object-contain" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 size-9 rounded-full shadow"
            aria-label="Fotoğrafı kaldır"
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">{hint}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="default" className="h-12 gap-2 text-sm" disabled={busy} onClick={() => cameraRef.current?.click()}>
              <Camera className="size-5" />
              Fotoğraf Çek
            </Button>
            <Button type="button" variant="outline" className="h-12 gap-2 text-sm" disabled={busy} onClick={() => galleryRef.current?.click()}>
              <ImagePlus className="size-5" />
              Galeriden Seç
            </Button>
          </div>
        </div>
      )}
      {busy && <p className="text-xs text-muted-foreground">Fotoğraf işleniyor...</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
