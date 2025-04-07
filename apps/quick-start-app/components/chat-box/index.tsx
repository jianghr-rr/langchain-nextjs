'use client';

import React, { useState, useEffect } from 'react';
import { Button, TextInput, Card, Spinner } from 'flowbite-react';
import axios from 'axios';
import { useSession } from '~/context/session-context';
import ReactMarkdown from 'react-markdown';

const ChatBox: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'bot'; content: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { sessionId } = useSession();

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        if (sessionId) {
          const response = await axios.get(`/api/chat?sessionId=${sessionId}`);
          if (response.data.success) {
            setChatHistory(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, [sessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || !sessionId) return;
    setLoading(true);

    const newUserMessage = { type: 'user' as const, content: message };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setMessage('');

    try {
      const response = await axios.post('/api/chat', { question: message, sessionId });
      if (response.data.success) {
        const aiResponse = response.data.data.answer;
        setChatHistory((prev) => [...prev, { type: 'bot', content: aiResponse }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full gap-4 p-4 pb-0 grow">
      <Card className="h-0 grow">
        <div className="h-full overflow-y-auto p-4 flex flex-col gap-2">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-xs text-sm ${
                msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 self-start'
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="flex justify-center items-center">
              <Spinner size="md" />
            </div>
          )}
        </div>
      </Card>
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <TextInput
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
