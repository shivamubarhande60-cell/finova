import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const SPRING = { stiffness: 46, damping: 22, mass: 0.9 };

const DOTS = [
  { x: 12, y: 22, s: 2, d: 0, z: 1.4 },
  { x: 28, y: 18, s: 3, d: 1.2, z: 1.1 },
  { x: 46, y: 14, s: 2, d: 0.4, z: 1.6 },
  { x: 63, y: 20, s: 4, d: 1.8, z: 0.9 },
  { x: 78, y: 12, s: 2, d: 0.8, z: 1.3 },
  { x: 88, y: 28, s: 3, d: 2.1, z: 1.7 },
  { x: 18, y: 48, s: 2, d: 1.1, z: 1.2 },
  { x: 34, y: 42, s: 3, d: 0.3, z: 0.8 },
  { x: 58, y: 38, s: 2, d: 1.6, z: 1.5 },
  { x: 72, y: 52, s: 4, d: 0.7, z: 1.1 },
  { x: 84, y: 44, s: 2, d: 2.4, z: 1.8 },
  { x: 8, y: 68, s: 3, d: 1.4, z: 1.0 },
  { x: 40, y: 62, s: 2, d: 0.9, z: 1.4 },
  { x: 66, y: 70, s: 3, d: 1.9, z: 0.7 },
  { x: 92, y: 64, s: 2, d: 0.2, z: 1.6 },
];

export function Stage3D() {
  const reduce = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const px = useSpring(0, SPRING);
  const py = useSpring(0, SPRING);
  const scroll = useSpring(0, SPRING);
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const light = useMotionTemplate`radial-gradient(720px 440px at ${mx}% ${my}%, rgb(59 130 246 / 0.22), transparent 58%)`;

  const farX = useTransform(px, (v) => v * 28);
  const farY = useTransform([py, scroll], ([p, s]) => Number(p) * 16 + Number(s) * 0.04);
  const midX = useTransform(px, (v) => v * 56);
  const midY = useTransform([py, scroll], ([p, s]) => Number(p) * 32 + Number(s) * 0.08);
  const nearX = useTransform(px, (v) => v * 92);
  const nearY = useTransform([py, scroll], ([p, s]) => Number(p) * 50 + Number(s) * 0.14);
  const rx = useTransform(py, (v) => v * -8);
  const ry = useTransform(px, (v) => v * 10);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (reduce) {
      el.pause();
      return;
    }
    void el.play().catch(() => {});
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;

    const onScroll = () => scroll.set(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      px.set(x);
      py.set(y);
      mx.set((x + 0.5) * 100);
      my.set((y + 0.5) * 100);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduce, px, py, scroll, mx, my]);

  return (
    <div className="stage-3d" aria-hidden>
      <motion.video
        ref={video}
        className="stage-video"
        src="/finova-stage.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ x: farX, y: farY, scale: 1.08 }}
      />
      <div className="stage-veil" />
      <motion.div className="stage-light" style={{ background: light }} />

      <motion.div className="parallax-layer parallax-far" style={{ x: farX, y: farY }}>
        <div className="breath-orb breath-orb-b" />
      </motion.div>

      <motion.div
        className="parallax-layer parallax-mid"
        style={{ x: midX, y: midY, rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformPerspective: 1200 }}
      >
        <div className="breath-orb breath-orb-a" />
      </motion.div>

      <motion.div className="parallax-layer parallax-near" style={{ x: nearX, y: nearY }}>
        <div className="breath-orb breath-orb-c" />
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="stage-dot"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.s,
              height: d.s,
              animationDelay: `${d.d}s`,
              transform: `translateZ(${d.z * 24}px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
