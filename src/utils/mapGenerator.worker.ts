import { generateMapData } from './mapGeneratorCore';

interface GenerateMapMessage {
  type: 'generate';
  width: number;
  height: number;
  seed: number;
  requestId: number;
}

self.onmessage = (event: MessageEvent<GenerateMapMessage>) => {
  const { type, width, height, seed, requestId } = event.data;
  
  if (type === 'generate') {
    const mapData = generateMapData(width, height, seed);
    self.postMessage({ type: 'result', data: mapData, requestId });
  }
};
