'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme, systemTheme } = useTheme();
  const activeTheme = theme === 'system' ? systemTheme : theme;

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {activeTheme === 'light' && (
        <Sun
          onClick={() => setTheme('dark')}
          className="block cursor-pointer justify-center self-center"
        />
      )}
      {activeTheme === 'dark' && (
        <Moon
          onClick={() => setTheme('light')}
          className="block cursor-pointer justify-center self-center"
        />
      )}
    </>
  );
};

export default ThemeChanger;
export { ThemeChanger };
