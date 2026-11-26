"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { az } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DatePicker({ value, onChange, disabled, placeholder = "Tarix seçin", className, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className={cn("h-9 w-full justify-start rounded-xl font-normal", !value && "text-muted-foreground", className)}>
          <CalendarIcon data-icon="inline-start" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={az}
          weekStartsOn={1}
          selected={value}
          defaultMonth={value}
          disabled={disabled}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
