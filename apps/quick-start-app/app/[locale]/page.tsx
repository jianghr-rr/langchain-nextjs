'use client';
import React from 'react';
import dynamic from 'next/dynamic'
import { SessionProvider } from '~/context/session-context';

const ChatBox = dynamic(() => import('~/components/chat-box'), { ssr: false });
const UploadComponent = dynamic(() => import('~/components/upload-component'), {
  ssr: false,
});

const HomePage: React.FC = () => {
  return (
    <SessionProvider>
      <div className="flex h-full">
        <div className="w-2/3 overflow-y-auto border-r flex flex-col grow py-4">
          <h2 className="text-xl font-bold pl-4">Upload and Parse PDF</h2>
          <UploadComponent />
        </div>
        <div className="w-1/3 overflow-y-auto flex flex-col grow py-4">
          <h2 className="text-xl font-bold pl-4">AI Features</h2>
          <ChatBox />
        </div>
        </div>
      </SessionProvider>
  );
};

export default HomePage;
