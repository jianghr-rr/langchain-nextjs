import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

type SessionContextType = {
  sessionId: string;
  setSessionId: (id: string) => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sessionId, setSessionId] = useState<string>('');
    
    useEffect(() => {
        const storedSessionId = localStorage.getItem('graph_robot_session');
        if (storedSessionId) {
          setSessionId(storedSessionId);
        } else {
          const newSessionId = uuidv4();
          localStorage.setItem('graph_robot_session', newSessionId);
          setSessionId(newSessionId);
        }
    }, []);

    return (
        <SessionContext.Provider value={{ sessionId, setSessionId }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
