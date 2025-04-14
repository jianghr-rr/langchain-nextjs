'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Button } from 'flowbite-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/vs2015.css';

const ChatBotPage = () => {
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const sendMessage = async () => {
      if (!input.trim()) return;
    
      setMessages((prev) => [...prev, { text: input, isUser: true }]);
      setLoading(true);
    
      try {
        const response = await fetch('/api/lang-graph/chat-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });
    
        const data = await response.json();
    
        setMessages((prev) => [...prev, { text: data.text, isUser: false }]);
      } catch (error) {
        console.error('Error receiving message:', error);
        setMessages((prev) => [
          ...prev,
          { text: 'Error: Failed to receive message.', isUser: false },
        ]);
      }
    
      setInput('');
      setLoading(false);
    };    

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
                        <div
                            className={msg.isUser
                                ? 'bg-blue-500 text-white p-2 rounded inline-block'
                                : 'bg-gray-100 p-2 rounded inline-block max-w-full'}>
                            {msg.isUser ? (
                                msg.text
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode }) {
                                            return !inline ? (
                                                <code
                                                    className={`${className} p-2 bg-gray-800 text-gray-100 rounded block overflow-x-auto`}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="bg-gray-200 px-1 rounded" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            )}
                        </div>
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