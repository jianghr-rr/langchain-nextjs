'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Button } from 'flowbite-react';

const ChatBotPage = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 添加用户输入消息
    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setLoading(true);

    const newBotMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { text: '', isUser: false }]); // 先插入空消息占位

    try {
      const response = await fetch('/api/lang-graph/chat-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let fullText = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });

        // 实时更新 bot 消息内容
        setMessages((prev) => {
          const updated = [...prev];
          updated[newBotMsgIndex] = { text: fullText, isUser: false };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error receiving stream:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Error: Failed to receive message.', isUser: false },
      ]);
    }

    setInput('');
    setLoading(false);
  };

  // 自动滚动到最后一条消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="p-4 flex flex-col h-full w-full">
      <div className="mb-4 flex-grow space-y-2 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={msg.isUser ? 'text-right' : 'text-left'}>
            <span
              className={msg.isUser
                ? 'bg-blue-500 text-white p-2 rounded inline-block'
                : 'bg-gray-200 p-2 rounded inline-block whitespace-pre-wrap'}>
              {msg.text || (loading && !msg.isUser ? 'Typing...' : '')}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex space-x-2">
        <TextInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading}>
          {loading ? (
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2" />
              Sending...
            </div>
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatBotPage;
