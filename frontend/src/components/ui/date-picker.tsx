'use client'

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disablePastDates?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "选择日期",
  disabled = false,
  className,
  disablePastDates = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  
  // Update input value when date changes
  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, 'yyyy-MM-dd'))
    } else {
      setInputValue("")
    }
  }, [selectedDate])

  // Update selected date when date prop changes
  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    
    // Try to parse the date from input
    const parsedDate = new Date(value)
    if (!isNaN(parsedDate.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Valid date format
      if (disablePastDates && parsedDate < new Date()) {
        return // Don't set past dates if disabled
      }
      setSelectedDate(parsedDate)
      onDateChange(parsedDate)
    } else if (value === "") {
      setSelectedDate(undefined)
      onDateChange(undefined)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      if (disablePastDates && selectedDate < new Date()) {
        return // Don't select past dates if disabled
      }
      setSelectedDate(selectedDate)
      onDateChange(selectedDate)
      setOpen(false)
    }
  }

  const clearDate = () => {
    setSelectedDate(undefined)
    onDateChange(undefined)
    setInputValue("")
  }

  // Generate calendar grid
  const generateCalendar = () => {
    const now = new Date()
    const currentMonth = selectedDate ? selectedDate.getMonth() : now.getMonth()
    const currentYear = selectedDate ? selectedDate.getFullYear() : now.getFullYear()
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = date.getMonth() === currentMonth
      const isToday = date.getTime() === today.getTime()
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime()
      const isPastDate = disablePastDates && date < today
      const isDisabled = !isCurrentMonth || isPastDate
      
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      })
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentMonth = selectedDate ? selectedDate.getMonth() : new Date().getMonth()
    const currentYear = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
    
    const newDate = new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1)
    setSelectedDate(newDate)
  }

  const calendarDays = generateCalendar()
  const currentMonth = selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  const currentYear = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pr-20",
                selectedDate && "font-medium"
              )}
              onFocus={() => setOpen(true)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearDate()
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={() => setOpen(!open)}
              >
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Header with month/year navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <span className="text-lg">←</span>
              </Button>
              <div className="font-medium text-sm">
                {currentYear}年 {monthNames[currentMonth]}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <span className="text-lg">→</span>
              </Button>
            </div>
            
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 font-normal hover:bg-blue-50",
                    day.isCurrentMonth ? "text-gray-900" : "text-gray-300",
                    day.isToday && "bg-blue-100 text-blue-900 font-medium",
                    day.isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                    day.isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                    !day.isCurrentMonth && "hover:bg-transparent"
                  )}
                  onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                  disabled={day.isDisabled}
                >
                  {day.day}
                </Button>
              ))}
            </div>
            
            {/* Quick actions */}
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateSelect(new Date())}
                className="text-xs"
              >
                今天
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDate}
                className="text-xs"
              >
                清除
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}