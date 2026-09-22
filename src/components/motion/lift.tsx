import { Children, useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const spring = { stiffness: 220, damping: 18, mass: 0.6 };

export function Tilt({
  children,
  className,
  intensity = 12,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const gx = useSpring(50, spring);
  const gy = useSpring(40, spring);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgb(248 250 252 / 0.22), transparent 55%)`;

  const reset = () => {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(40);
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * intensity);
    rx.set((0.5 - py) * (intensity * 0.75));
    gx.set(px * 100);
    gy.set(py * 100);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("group relative h-full transform-gpu", className)}
      onPointerMove={reduce ? undefined : move}
      onPointerLeave={reduce ? undefined : reset}
      style={{
        rotateX: reduce ? 0 : rx,
        rotateY: reduce ? 0 : ry,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  );
}

export function Lift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tilt className={className} intensity={10}>
      {children}
    </Tilt>
  );
}

export function RevealDash({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {Children.map(children, (child) => (
        <motion.div
          className="h-full"
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.45, ease },
            },
          }}
        >
          <Tilt className="h-full">{child}</Tilt>
        </motion.div>
      ))}
    </motion.div>
  );
}
