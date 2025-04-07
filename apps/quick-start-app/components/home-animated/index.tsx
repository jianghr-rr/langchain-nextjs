'use client';
import {
  useTransition,
  useSpring,
  useChain,
  config,
  animated,
  useSpringRef,
} from '@react-spring/web';
import React, { useState } from 'react';
import data from './data';

export default function Home() {
  const [open, set] = useState(false);

  const springApi = useSpringRef();
  const { size, ...rest } = useSpring({
    ref: springApi,
    config: config.stiff,
    from: { size: '20%', background: 'hotpink' },
    to: {
      size: open ? '100%' : '20%',
      background: open ? 'white' : 'hotpink',
    },
  });

  const transApi = useSpringRef();
  const transition = useTransition(open ? data : [], {
    ref: transApi,
    trail: 400 / data.length,
    from: { opacity: 0, scale: 0 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0 },
  });

  // This will orchestrate the two animations above, comment the last arg and it creates a sequence
  useChain(open ? [springApi, transApi] : [transApi, springApi], [
    0,
    open ? 0.1 : 0.6,
  ]);

  return (
    <div className="bg-lightblue flex size-full items-center justify-center p-5">
      <animated.div
        style={{ ...rest, width: size, height: size }}
        className="container relative grid cursor-pointer grid-cols-4 gap-6 rounded-md bg-white p-6 shadow-[0px_10px_10px_-5px_rgba(0,0,0,0.05)]"
        onClick={() => set((open) => !open)}
      >
        {transition((style, item) => (
          <animated.div
            className="size-full rounded-md bg-white"
            style={{ ...style, background: item.css }}
          />
        ))}
      </animated.div>
    </div>
  );
}
