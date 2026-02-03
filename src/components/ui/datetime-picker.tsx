"use client"

import * as React from "react"
import { format, setHours, setMinutes } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  minDate?: Date
  disabled?: boolean
}

function getTimezoneDisplay(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const offset = new Date()
    .toLocaleTimeString("en-US", {
      timeZoneName: "shortOffset",
      timeZone: tz,
    })
    .split(" ")
    .pop()
  return `${tz} (${offset})`
}

function DateTimePicker({
  value,
  onChange,
  minDate,
  disabled = false,
}: DateTimePickerProps) {
  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    []
  )
  const minutes = React.useMemo(() => [0, 15, 30, 45], [])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined)
      return
    }
    // Preserve time when changing date, default to 9:00 AM if no time set
    const newDate = value
      ? setHours(setMinutes(date, value.getMinutes()), value.getHours())
      : setHours(setMinutes(date, 0), 9)
    onChange(newDate)
  }

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    if (!value) return
    const numVal = Number.parseInt(val, 10)
    const newDate =
      type === "hour" ? setHours(value, numVal) : setMinutes(value, numVal)
    onChange(newDate)
  }

  // Calendar disabled dates: before minDate if provided, otherwise before today
  const disabledDates = React.useCallback(
    (date: Date) => {
      if (minDate) {
        // Compare date-only (ignore time) to allow scheduling for today
        const minDateOnly = new Date(
          minDate.getFullYear(),
          minDate.getMonth(),
          minDate.getDate()
        )
        const dateOnly = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
        return dateOnly < minDateOnly
      }
      // Default: disable dates before today
      const today = new Date()
      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
      return dateOnly < todayOnly
    },
    [minDate]
  )

  const timezone = React.useMemo(() => getTimezoneDisplay(), [])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select
          value={value ? value.getHours().toString() : undefined}
          onValueChange={(v) => handleTimeChange("hour", v)}
          disabled={disabled || !value}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h.toString()}>
                {h.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex items-center text-muted-foreground">:</span>

        <Select
          value={value ? value.getMinutes().toString() : undefined}
          onValueChange={(v) => handleTimeChange("minute", v)}
          disabled={disabled || !value}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m.toString()}>
                {m.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{timezone}</p>
    </div>
  )
}

export { DateTimePicker }
export type { DateTimePickerProps }
