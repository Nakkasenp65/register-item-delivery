"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  data?: any; // เพิ่ม field สำหรับเก็บข้อมูลเพิ่มเติม
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onOptionSelect?: (option: ComboboxOption) => void; // เพิ่ม callback ที่ส่ง option ทั้งหมด
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  onOptionSelect,
  onSearchChange,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    onSearchChange?.(newSearch);
  };

  const handleSelect = (option: ComboboxOption) => {
    onValueChange?.(option.value);
    onOptionSelect?.(option);
    setOpen(false);
    setSearch("");
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {value ? options.find((option) => option.value === value)?.label : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-[300px] flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              inputMode="numeric"
              className="flex h-8 w-full rounded-md bg-transparent text-base outline-none placeholder:text-gray-500"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto overflow-x-hidden p-1">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">{emptyText}</div>
            ) : (
              options.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => handleSelect(option)}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{option.label}</span>
                    {option.subLabel && <span className="text-xs text-gray-500">{option.subLabel}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
