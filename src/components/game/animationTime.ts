let moduleAnimationTime = 0;

export const getAnimationTime = (): number => moduleAnimationTime;

export const setAnimationTime = (time: number): void => {
  moduleAnimationTime = time;
};
