import { memo } from 'react';
import type { Position, ViewportBounds, TileType } from '../../types';
import type { PerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import styles from '../../styles/game.module.css';

interface DebugInfoProps {
  playerPosition: Position;
  viewport: ViewportBounds;
  currentTile: TileType | null;
  metrics: PerformanceMetrics;
  mapSeed: number;
  floorInfo?: string;
}

export const DebugInfo = memo(function DebugInfo({
  playerPosition,
  viewport,
  currentTile,
  metrics,
  mapSeed,
  floorInfo,
}: DebugInfoProps) {
  const fpsColor = metrics.fps >= 55 ? '#6a6' : metrics.fps >= 30 ? '#aa6' : '#a66';
  const frameTimeColor = metrics.frameTime <= 18 ? '#6a6' : metrics.frameTime <= 33 ? '#aa6' : '#a66';

  return (
    <div className={styles.debugOverlay}>
      <p>Player: ({playerPosition.x}, {playerPosition.y})</p>
      <p>Viewport: ({viewport.startX}, {viewport.startY}) - ({viewport.endX}, {viewport.endY})</p>
      <p>Tile: {currentTile || 'none'}</p>
      <p>Seed: {mapSeed}</p>
      {floorInfo && <p>Floor: {floorInfo}</p>}
      <hr className={styles.debugDivider} />
      <p className={styles.debugMetric}>
        <span>FPS:</span>
        <span style={{ color: fpsColor }}>{metrics.fps.toFixed(1)}</span>
      </p>
      <p className={styles.debugMetric}>
        <span>Frame:</span>
        <span style={{ color: frameTimeColor }}>{metrics.frameTime.toFixed(2)}ms</span>
      </p>
      <p className={styles.debugMetric}>
        <span>Range:</span>
        <span>{metrics.minFrameTime.toFixed(1)} - {metrics.maxFrameTime.toFixed(1)}ms</span>
      </p>
      {metrics.memory !== null && (
        <p className={styles.debugMetric}>
          <span>Memory:</span>
          <span>{metrics.memory.toFixed(1)} MB</span>
        </p>
      )}
      <p className={styles.debugHint}>Press F3 to toggle</p>
    </div>
  );
});
