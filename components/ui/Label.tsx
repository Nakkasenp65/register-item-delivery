import React from "react";

type Props = React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode };

export function Label({ className = "", children, ...rest }: Props) {
  return (
    <label className={`block text-sm font-medium text-gray-600 mb-1 ${className}`} {...rest}>
      {children}
    </label>
  );
}

export default Label;
