"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSend } from "@tabler/icons-react";

// Placeholder for chat functionality
// TODO: Integrate Stream Chat SDK for real-time messaging

export function ChatSidebar() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: string; time: string }>>([]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "You",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{msg.sender}</span>
                <span className="text-xs text-gray-500">{msg.time}</span>
              </div>
              <p className="text-sm text-gray-300">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={sendMessage}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <IconSend className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
