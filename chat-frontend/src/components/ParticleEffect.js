import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ParticleEffect = ({
  trigger,
  type = 'confetti',
  duration = 3000,
  particleCount = 50,
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'],
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2,
        },
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, particleCount, duration, colors]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.x,
            y: particle.y,
            rotate: particle.rotation,
            scale: 1,
          }}
          animate={{
            x: particle.x + particle.velocity.x * 100,
            y: window.innerHeight + 10,
            rotate: particle.rotation + 360,
            scale: 0,
          }}
          transition={{
            duration: duration / 1000,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: type === 'confetti' ? '2px' : '50%',
          }}
        />
      ))}
    </div>
  );
};

export default ParticleEffect;
