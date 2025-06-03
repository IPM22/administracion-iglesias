"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

// Función para formatear el teléfono con guiones
const formatPhoneDisplay = (value: string): string => {
  // Remover todo lo que no sea número
  const numbers = value.replace(/\D/g, "");

  // Aplicar formato XXX-XXX-XXXX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10
    )}`;
  }
};

// Función para extraer solo números
const extractNumbers = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "809-699-7909",
      className,
      disabled,
      name,
      id,
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState("");

    // Sincronizar el valor de display cuando el valor cambie externamente
    useEffect(() => {
      setDisplayValue(formatPhoneDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Solo permitir números y guiones, limitar a 12 caracteres (XXX-XXX-XXXX)
      if (inputValue.length <= 12) {
        const formattedValue = formatPhoneDisplay(inputValue);
        setDisplayValue(formattedValue);

        // Pasar solo los números al onChange
        const numbersOnly = extractNumbers(inputValue);
        onChange?.(numbersOnly);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir teclas de control como backspace, delete, arrow keys, etc.
      const controlKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Tab",
        "Enter",
        "Escape",
      ];

      // Permitir números y teclas de control
      if (controlKeys.includes(e.key) || /\d/.test(e.key)) {
        return;
      }

      // Bloquear cualquier otra tecla
      e.preventDefault();
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("font-mono", className)}
        disabled={disabled}
        name={name}
        id={id}
        maxLength={12}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
