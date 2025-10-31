import React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
  const { className = "", ...rest } = props;
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...rest}
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;
