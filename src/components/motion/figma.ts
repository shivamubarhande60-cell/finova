/** Figma Smart Animate — Ease Out, 300ms, 8px rise. No bounce, no blur. */
export const figmaEase = [0.16, 1, 0.3, 1] as const;

export function figmaRise(delay = 0) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay, ease: figmaEase },
  };
}

export const figmaStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.02 },
  },
};

export const figmaChild = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: figmaEase },
  },
};
