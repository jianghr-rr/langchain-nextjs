// apps/quick-start-app/utils/run-js-in-worker.ts
import { Worker } from 'worker_threads';
import path from 'path';

export function runJsInWorker(code: string): Promise<string> {
  return new Promise((resolve) => {
    const worker = new Worker(path.resolve(__dirname, './js-repl-worker.js'));
    worker.postMessage(code);

    worker.once('message', (msg) => {
      if (msg.result !== undefined) {
        resolve(msg.result);
      } else {
        resolve(`运行出错: ${msg.error}`);
      }
      worker.terminate();
    });

    worker.once('error', (err) => {
      resolve(`Worker错误: ${err.message}`);
      worker.terminate();
    });
  });
}
