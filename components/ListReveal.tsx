'use client';
import { useEffect, useState, ReactNode, Children, cloneElement, isValidElement } from 'react';

export function ListReveal({ children, delay=60 }: { children: ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(0);
  const childArray = Children.toArray(children);
  
  useEffect(() => {
    let i = 0;
    setVisible(0);
    const t = setInterval(() => {
      i++; setVisible(i);
      if (i >= childArray.length) clearInterval(t);
    }, delay);
    return () => clearInterval(t);
  }, [childArray.length, delay]);
  
  return (
    <div>
      {childArray.map((child, i) => (
        <div key={i} className={`transition-all duration-300 ${i < visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {child}
        </div>
      ))}
    </div>
  );
}
