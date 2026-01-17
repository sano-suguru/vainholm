import { Suspense, lazy } from 'react';

const GameContainer = lazy(async () => {
  const mod = await import('./components/game');
  return { default: mod.GameContainer };
});

export default function App() {
  return (
    <Suspense fallback={null}>
      <GameContainer />
    </Suspense>
  );
}
