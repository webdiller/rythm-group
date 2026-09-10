"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_ICON_FILTERS,
  type IconCssFilters,
} from "@/lib/contact-icons/filters"

const SLIDERS: Array<{
  key: keyof IconCssFilters
  label: string
  min: number
  max: number
  step: number
  unit: string
}> = [
  { key: "brightness", label: "Яркость", min: 0, max: 200, step: 1, unit: "%" },
  { key: "contrast", label: "Контраст", min: 0, max: 200, step: 1, unit: "%" },
  { key: "saturate", label: "Насыщенность", min: 0, max: 200, step: 1, unit: "%" },
  { key: "invert", label: "Инверсия", min: 0, max: 100, step: 1, unit: "%" },
  { key: "hueRotate", label: "Оттенок", min: 0, max: 360, step: 1, unit: "°" },
  { key: "opacity", label: "Прозрачность", min: 0, max: 100, step: 1, unit: "%" },
]

type IconFilterEditorProps = {
  value: IconCssFilters
  onChange: (next: IconCssFilters) => void
  title?: string
}

export function IconFilterEditor({ value, onChange, title }: IconFilterEditorProps) {
  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      {SLIDERS.map((item) => (
        <div key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">{item.label}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {value[item.key]}
              {item.unit}
            </span>
          </div>
          <Slider
            min={item.min}
            max={item.max}
            step={item.step}
            value={[value[item.key]]}
            onValueChange={(v) => {
              const n = v[0]
              if (typeof n !== "number") return
              onChange({ ...value, [item.key]: n })
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange({ ...DEFAULT_ICON_FILTERS })}
      >
        Сбросить фильтры
      </Button>
    </div>
  )
}
