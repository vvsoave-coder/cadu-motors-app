import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setEnabled(true);
    document.body.classList.add('cadu-cursor-none');
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e) => {
      if (e.target.closest('[data-cursor="view"]')) setHovering(true);
      else setHovering(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      document.body.classList.remove('cadu-cursor-none');
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <motion.div style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-[100]">
      <motion.div
        animate={{ scale: hovering ? 2.4 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#F26A21] h-8 w-8"
      >
        {hovering && <span className="text-[8px] tracking-widest text-[#F26A21]">VER</span>}
      </motion.div>
    </motion.div>
  );
}