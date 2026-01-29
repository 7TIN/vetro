import React from 'react';

type MessageCardProps = {
  type: "incoming" | "outgoing";
  message: string;
};

export const MessageCard = ({ type, message }: MessageCardProps) => {
  return (
    <div
      className={`w-full flex ${
        type === "incoming" ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[80%] w-fit px-3 py-2 rounded-lg font-mono text-sm shadow-sm ${
          type === "incoming"
            ? "bg-neutral-800 text-neutral-50 rounded-tl-none"
            : "bg-neutral-200 text-neutral-900 rounded-tr-none"
        }`}
      >
        {message}
      </div>
    </div>
  );
};