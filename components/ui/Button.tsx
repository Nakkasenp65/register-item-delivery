import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export function Button({ className = "", children, ...rest }: Props) {
  return (
    <button
      className={`w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
