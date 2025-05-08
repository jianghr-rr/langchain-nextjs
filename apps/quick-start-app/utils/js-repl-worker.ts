// apps/quick-start-app/utils/js-repl-worker.ts
import { parentPort } from 'worker_threads';
import { Script, createContext } from 'vm';

parentPort?.on('message', (code: string) => {
  try {
    const context = createContext({});
    const script = new Script(code);
    // runInContext 支持传递 options，可以在这里设置超时
    const result = script.runInContext(context, { timeout: 1000 }); // 1秒超时
    parentPort?.postMessage({ result: String(result) });
  } catch (err: any) {
    parentPort?.postMessage({ error: err.message });
  }
});
