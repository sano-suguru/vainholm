import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useMemo } from 'react';
import { DungeonRenderer } from './DungeonRenderer';
import { generateFloor } from '../generator/floorGenerator';
import { REGION_CONFIGS } from '../config';
import type { RegionConfig } from '../types';

type RegionId = 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup';

const REGION_MAP: Record<RegionId, RegionConfig> = {
  hrodrgraf: REGION_CONFIGS[0],
  rotmyrkr: REGION_CONFIGS[1],
  gleymdariki: REGION_CONFIGS[2],
  upphafsdjup: REGION_CONFIGS[3],
};

interface DungeonFloorPreviewProps {
  region: RegionId;
  floorLevel: number;
  seed: number;
  showGrid: boolean;
  zoom: number;
  width: number;
  height: number;
}

function DungeonFloorPreview({
  region,
  floorLevel,
  seed,
  showGrid,
  zoom,
  width,
  height,
}: DungeonFloorPreviewProps) {
  const regionConfig = REGION_MAP[region];

  const floor = useMemo(() => {
    return generateFloor({
      level: floorLevel,
      regionLevel: floorLevel,
      floorsPerRegion: regionConfig.floors,
      regionConfig,
      seed,
      previousStairsDown: null,
      isLastFloorInDungeon: false,
    });
  }, [regionConfig, floorLevel, seed]);

  return (
    <div>
      <div style={{ marginBottom: 16, fontFamily: 'monospace', fontSize: 12 }}>
        <strong>Region:</strong> {regionConfig.name} ({regionConfig.displayName}) |{' '}
        <strong>Floor:</strong> {floorLevel} |{' '}
        <strong>Size:</strong> {floor.map.width}x{floor.map.height} |{' '}
        <strong>Rooms:</strong> {floor.rooms.length} |{' '}
        <strong>Seed:</strong> {seed}
      </div>
      <DungeonRenderer
        map={floor.map}
        width={width}
        height={height}
        showGrid={showGrid}
        zoom={zoom}
      />
      <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: '#888' }}>
        Drag to pan. Spawn: ({floor.map.spawnPoint.x}, {floor.map.spawnPoint.y}) |
        Stairs Down: {floor.stairsDown ? `(${floor.stairsDown.x}, ${floor.stairsDown.y})` : 'None'}
      </div>
    </div>
  );
}

const meta: Meta<typeof DungeonFloorPreview> = {
  title: 'Dungeon/FloorPreview',
  component: DungeonFloorPreview,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    region: {
      control: 'select',
      options: ['hrodrgraf', 'rotmyrkr', 'gleymdariki', 'upphafsdjup'] as RegionId[],
      description: 'Dungeon region',
    },
    floorLevel: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'Floor level within region',
    },
    seed: {
      control: { type: 'number' },
      description: 'Random seed for reproducible generation',
    },
    showGrid: {
      control: 'boolean',
      description: 'Show tile grid overlay',
    },
    zoom: {
      control: { type: 'range', min: 0.25, max: 2, step: 0.25 },
      description: 'Zoom level',
    },
    width: {
      control: { type: 'range', min: 400, max: 1200, step: 100 },
      description: 'Canvas width',
    },
    height: {
      control: { type: 'range', min: 400, max: 900, step: 100 },
      description: 'Canvas height',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DungeonFloorPreview>;

export const Hrodrgraf: Story = {
  args: {
    region: 'hrodrgraf',
    floorLevel: 1,
    seed: 12345,
    showGrid: false,
    zoom: 0.5,
    width: 800,
    height: 600,
  },
};

export const Rotmyrkr: Story = {
  args: {
    region: 'rotmyrkr',
    floorLevel: 1,
    seed: 42,
    showGrid: false,
    zoom: 0.5,
    width: 800,
    height: 600,
  },
};

export const Gleymdariki: Story = {
  args: {
    region: 'gleymdariki',
    floorLevel: 1,
    seed: 99999,
    showGrid: false,
    zoom: 0.5,
    width: 800,
    height: 600,
  },
};

export const Upphafsdjup: Story = {
  args: {
    region: 'upphafsdjup',
    floorLevel: 1,
    seed: 54321,
    showGrid: false,
    zoom: 0.5,
    width: 800,
    height: 600,
  },
};

export const WithGrid: Story = {
  args: {
    region: 'hrodrgraf',
    floorLevel: 1,
    seed: 12345,
    showGrid: true,
    zoom: 0.75,
    width: 800,
    height: 600,
  },
};

export const ZoomedIn: Story = {
  args: {
    region: 'hrodrgraf',
    floorLevel: 1,
    seed: 12345,
    showGrid: false,
    zoom: 1.5,
    width: 800,
    height: 600,
  },
};

function SeedExplorer() {
  const [region, setRegion] = useState<RegionId>('hrodrgraf');
  const [floorLevel, setFloorLevel] = useState(1);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));

  const regionConfig = REGION_MAP[region];

  const floor = useMemo(() => {
    return generateFloor({
      level: floorLevel,
      regionLevel: floorLevel,
      floorsPerRegion: regionConfig.floors,
      regionConfig,
      seed,
      previousStairsDown: null,
      isLastFloorInDungeon: false,
    });
  }, [regionConfig, floorLevel, seed]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <label>
          Region:
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionId)}
            style={{ marginLeft: 8 }}
          >
            <option value="hrodrgraf">Hrodrgraf</option>
            <option value="rotmyrkr">Rotmyrkr</option>
            <option value="gleymdariki">Gleymdariki</option>
            <option value="upphafsdjup">Upphafsdjup</option>
          </select>
        </label>

        <label>
          Floor:
          <input
            type="number"
            min={1}
            max={4}
            value={floorLevel}
            onChange={(e) => setFloorLevel(Number(e.target.value))}
            style={{ marginLeft: 8, width: 60 }}
          />
        </label>

        <label>
          Seed:
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>

        <button onClick={() => setSeed(Math.floor(Math.random() * 100000))}>
          Random Seed
        </button>
      </div>

      <div style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }}>
        <strong>{regionConfig.name}</strong> ({regionConfig.displayName}) |
        Size: {floor.map.width}x{floor.map.height} |
        Rooms: {floor.rooms.length} |
        Corridors: {floor.corridors.length}
      </div>

      <DungeonRenderer map={floor.map} width={900} height={700} zoom={0.5} />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <SeedExplorer />,
};
