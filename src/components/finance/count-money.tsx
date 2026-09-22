import { useEffect, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { Money } from "./money";

export function CountMoney({
  value,
  signed,
  className,
  tone,
}: {
  value: number;
  signed?: boolean;
  className?: string;
  tone?: "income" | "expense" | "neutral";
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => mv.on("change", (v) => setShown(v)), [mv]);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      setShown(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return <Money value={shown} signed={signed} className={className} tone={tone} />;
}
