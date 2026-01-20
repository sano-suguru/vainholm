import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { MapData, TileType, TilePosition } from '../../types';
import { TILE_SIZE } from '../../utils/constants';
import {
  getBaseTileTexture,
  loadTileTextures,
  isAnimatedTile,
  getAnimatedTileTextures,
  selectTileVariantTexture,
} from '../../utils/tileTextures';

extend({ Container, Graphics, Sprite });

const ANIMATION_FRAME_INTERVAL = 250;
const ANIMATION_FRAME_COUNT = 4;

interface DungeonRendererProps {
  map: MapData;
  width?: number;
  height?: number;
  showGrid?: boolean;
  zoom?: number;
}

interface ViewportState {
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

const TileLayer = memo(function TileLayer({
  map,
  zoom,
}: {
  map: MapData;
  zoom: number;
}) {
  const tilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const layer = map.layers[0];
    if (!layer) return positions;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;

        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (isAnimatedTile(tileType)) continue;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map]);

  const scaledTileSize = TILE_SIZE * zoom;

  const tileElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (const { x, y, tileType } of tilePositions) {
      const screenX = x * scaledTileSize;
      const screenY = y * scaledTileSize;
      const key = `${x}-${y}`;

      const texture =
        tileType === 'dungeon_floor' ||
        tileType === 'temple_floor' ||
        tileType === 'root_floor' ||
        tileType === 'fortress_floor' ||
        tileType === 'void_floor'
          ? selectTileVariantTexture(tileType, x, y)
          : getBaseTileTexture(tileType);

      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={scaledTileSize}
            height={scaledTileSize}
          />
        );
      }
    }
    return elements;
  }, [tilePositions, scaledTileSize]);

  return <pixiContainer>{tileElements}</pixiContainer>;
});

const AnimatedTileLayer = memo(function AnimatedTileLayer({
  map,
  zoom,
}: {
  map: MapData;
  zoom: number;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  useTick(() => {
    if (startTimeRef.current === 0) return;
    const elapsed = Date.now() - startTimeRef.current;
    const newFrameIndex = Math.floor(elapsed / ANIMATION_FRAME_INTERVAL) % ANIMATION_FRAME_COUNT;
    if (newFrameIndex !== frameIndex) {
      setFrameIndex(newFrameIndex);
    }
  });

  const animatedTilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const layer = map.layers[0];
    if (!layer) return positions;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;

        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (!isAnimatedTile(tileType)) continue;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map]);

  const scaledTileSize = TILE_SIZE * zoom;

  const tileElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (const { x, y, tileType } of animatedTilePositions) {
      const screenX = x * scaledTileSize;
      const screenY = y * scaledTileSize;
      const key = `anim-${x}-${y}`;

      const textures = getAnimatedTileTextures(tileType);
      const texture = textures?.[frameIndex];

      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={scaledTileSize}
            height={scaledTileSize}
          />
        );
      }
    }
    return elements;
  }, [animatedTilePositions, frameIndex, scaledTileSize]);

  return <pixiContainer>{tileElements}</pixiContainer>;
});

const FeatureLayer = memo(function FeatureLayer({
  map,
  zoom,
}: {
  map: MapData;
  zoom: number;
}) {
  const featureTilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const featureLayer = map.layers[1];
    if (!featureLayer) return positions;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const featureId = featureLayer.data[y]?.[x];
        if (featureId === undefined || featureId === 0) continue;

        const tileType = map.tileMapping[String(featureId)] as TileType;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map]);

  const scaledTileSize = TILE_SIZE * zoom;

  const featureElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (const { x, y, tileType } of featureTilePositions) {
      const screenX = x * scaledTileSize;
      const screenY = y * scaledTileSize;
      const key = `feature-${x}-${y}`;

      const texture = getBaseTileTexture(tileType);
      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={scaledTileSize}
            height={scaledTileSize}
          />
        );
      }
    }
    return elements;
  }, [featureTilePositions, scaledTileSize]);

  return <pixiContainer>{featureElements}</pixiContainer>;
});

const GridLayer = memo(function GridLayer({
  map,
  zoom,
}: {
  map: MapData;
  zoom: number;
}) {
  const scaledTileSize = TILE_SIZE * zoom;

  const drawGrid = useCallback(
    (g: Graphics) => {
      g.clear();

      for (let x = 0; x <= map.width; x++) {
        g.moveTo(x * scaledTileSize, 0);
        g.lineTo(x * scaledTileSize, map.height * scaledTileSize);
      }

      for (let y = 0; y <= map.height; y++) {
        g.moveTo(0, y * scaledTileSize);
        g.lineTo(map.width * scaledTileSize, y * scaledTileSize);
      }

      g.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
    },
    [map.width, map.height, scaledTileSize]
  );

  return <pixiGraphics draw={drawGrid} />;
});

function DungeonScene({
  map,
  showGrid,
  zoom,
  viewport,
}: {
  map: MapData;
  showGrid: boolean;
  zoom: number;
  viewport: ViewportState;
}) {
  const [texturesReady, setTexturesReady] = useState(false);

  useEffect(() => {
    loadTileTextures().then(() => setTexturesReady(true));
  }, []);

  if (!texturesReady) {
    return null;
  }

  return (
    <pixiContainer x={viewport.offsetX} y={viewport.offsetY}>
      <TileLayer map={map} zoom={zoom} />
      <AnimatedTileLayer map={map} zoom={zoom} />
      <FeatureLayer map={map} zoom={zoom} />
      {showGrid && <GridLayer map={map} zoom={zoom} />}
    </pixiContainer>
  );
}

export const DungeonRenderer = memo(function DungeonRenderer({
  map,
  width = 800,
  height = 600,
  showGrid = false,
  zoom = 1,
}: DungeonRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const centerOffset = useMemo(() => {
    const scaledTileSize = TILE_SIZE * zoom;
    const mapPixelWidth = map.width * scaledTileSize;
    const mapPixelHeight = map.height * scaledTileSize;
    return {
      x: (width - mapPixelWidth) / 2,
      y: (height - mapPixelHeight) / 2,
    };
  }, [map.width, map.height, width, height, zoom]);

  const [dragState, setDragState] = useState({
    dragOffsetX: 0,
    dragOffsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const viewport: ViewportState = {
    offsetX: centerOffset.x + dragState.dragOffsetX,
    offsetY: centerOffset.y + dragState.dragOffsetY,
    isDragging: dragState.isDragging,
    lastMouseX: dragState.lastMouseX,
    lastMouseY: dragState.lastMouseY,
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragState((prev) => ({
      ...prev,
      isDragging: true,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY,
    }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;

      const deltaX = e.clientX - prev.lastMouseX;
      const deltaY = e.clientY - prev.lastMouseY;

      return {
        ...prev,
        dragOffsetX: prev.dragOffsetX + deltaX,
        dragOffsetY: prev.dragOffsetY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY,
      };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        width,
        height,
        cursor: viewport.isDragging ? 'grabbing' : 'grab',
        overflow: 'hidden',
        background: '#1a1a2e',
      }}
    >
      <Application width={width} height={height} background={0x1a1a2e}>
        <DungeonScene map={map} showGrid={showGrid} zoom={zoom} viewport={viewport} />
      </Application>
    </div>
  );
});

export default DungeonRenderer;
