'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Button, Card } from 'flowbite-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useSession } from '~/context/graph-robot-session-context';
import axios from 'axios';
import 'highlight.js/styles/vs2015.css';

interface Message {
  type: 'ai' | 'tool' | 'error' | 'user';
  content: string;
  data?: any; // 用于存储结构化数据（如新闻列表）
  chartCode?: string; // 用于存储图表代码
}

interface NewsItem {
  title: string;
  url: string;
  content: string;
  score: number;
}

const NewsList = ({ news }: { news: NewsItem[] }) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {news.map((item, idx) => (
        <Card
          key={idx}
          href={item.url}
          className="hover:shadow-lg transition-shadow hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <h5 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white line-clamp-2">
            {item.title}
          </h5>
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
            {item.content || 'No preview content available.'}
          </div>
          <div className="text-xs text-right text-gray-400 mt-2">
            Relevance: {item.score.toFixed(2)}
          </div>
        </Card>
      ))}
    </div>
  );
};

const ChatBotPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { sessionId } = useSession();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // 添加用户消息
    setMessages((prev) => [...prev, { type: 'user', content: input }]);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/lang-graph/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId }),
      });

      if (!response.ok) throw new Error('API request failed');

      const { structured } = await response.json();

      // 处理结构化响应
      const newMessages: Message[] = structured.map((item: any) => {
        if (item.type === 'tool') {
          try {
            // 检查是否是图表代码
            if (
              item.content.includes('Chart.js') ||
              item.content.includes('new Chart')
            ) {
              return {
                type: 'tool',
                content: 'Chart Generation',
                chartCode: item.content,
              };
            }
            // 处理其他工具结果
            const toolData = JSON.parse(item.content);
            return {
              type: 'tool',
              content: 'Web search results',
              data: toolData,
            };
          } catch (e) {
            return {
              type: 'tool',
              content: 'Failed to parse tool results',
              data: [],
            };
          }
        }
        return {
          type: item.type as Message['type'],
          content: item.content,
        };
      });

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { type: 'error', content: 'Failed to get response. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('messages', messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-4 flex flex-col h-full w-full max-w-4xl mx-auto">
      <div className="mb-4 flex-grow space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                  p-3 rounded-lg max-w-[90%] 
                  ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.type === 'tool'
                        ? 'bg-emerald-100 dark:bg-emerald-900'
                        : msg.type === 'error'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}
            >
              {msg.type === 'tool' ? (
                msg.chartCode ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-emerald-600 dark:text-emerald-200">
                      📊 Chart
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: msg.chartCode }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-emerald-600 dark:text-emerald-200">
                      🔍 Web Search Results
                    </div>
                    <NewsList
                      news={
                        typeof msg.data === 'string'
                          ? JSON.parse(msg.data)
                          : (msg.data ?? [])
                      }
                    />
                  </div>
                )
              ) : msg.type === 'error' ? (
                <div className="text-red-600 dark:text-red-300">
                  ⚠️ {msg.content}
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      return !inline ? (
                        <code
                          className={`${className} p-2 bg-gray-800 text-gray-100 rounded block overflow-x-auto text-sm`}
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="bg-gray-200 px-1.5 py-0.5 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <TextInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
          placeholder="Type your message..."
        />
        <Button
          onClick={sendMessage}
          disabled={loading}
          gradientDuoTone="purpleToBlue"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
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
