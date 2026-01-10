import type { MapData } from '../types';
import MapGeneratorWorker from './mapGenerator.worker?worker';

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingRequests = new Map<number, (data: MapData) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new MapGeneratorWorker();
    worker.onmessage = (event: MessageEvent<{ type: string; data: MapData; requestId: number }>) => {
      if (event.data.type === 'result') {
        const resolve = pendingRequests.get(event.data.requestId);
        if (resolve) {
          resolve(event.data.data);
          pendingRequests.delete(event.data.requestId);
        }
      }
    };
  }
  return worker;
}

export function generateMapAsync(
  width: number,
  height: number,
  seed: number = 12345
): Promise<MapData> {
  return new Promise((resolve) => {
    const requestId = nextRequestId++;
    pendingRequests.set(requestId, resolve);
    const w = getWorker();
    w.postMessage({ type: 'generate', width, height, seed, requestId });
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
}
