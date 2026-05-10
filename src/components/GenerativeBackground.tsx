'use client';

import React, { useEffect, useRef } from 'react';

export const GenerativeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: any;

    const initP5 = async () => {
      const p5 = (await import('p5')).default;

      p5Instance = new p5((p: any) => {
        let particles: Particle[] = [];
        const numParticles = 35;
        
        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(containerRef.current!);
          for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle(p));
          }
          p.pixelDensity(1);
        };

        p.draw = () => {
          p.clear();
          for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].display();
            for (let j = i + 1; j < particles.length; j++) {
              const d = p.dist(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
              if (d < 200) {
                const alpha = p.map(d, 0, 200, 30, 0);
                p.stroke(i % 2 === 0 ? 0 : 106, i % 2 === 0 ? 255 : 13, i % 2 === 0 ? 255 : 173, alpha);
                p.line(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
              }
            }
          }
        };

        p.windowResized = () => { p.resizeCanvas(p.windowWidth, p.windowHeight); };

        class Particle {
          pos: any; vel: any; size: number; col: any; p: any;
          constructor(p: any) {
            this.p = p;
            this.pos = p.createVector(p.random(p.width), p.random(p.height));
            this.vel = p.createVector(p.random(-0.4, 0.4), p.random(-0.4, 0.4));
            this.size = p.random(1, 3);
            this.col = p.random() > 0.5 ? [0, 255, 255] : [106, 13, 173];
          }
          update() { this.pos.add(this.vel); if (this.pos.x < 0 || this.pos.x > this.p.width) this.vel.x *= -1; if (this.pos.y < 0 || this.pos.y > this.p.height) this.vel.y *= -1; }
          display() { this.p.noStroke(); this.p.fill(this.col[0], this.col[1], this.col[2], 60); this.p.circle(this.pos.x, this.pos.y, this.size); }
        }
      });
    };
    initP5();
    return () => { if (p5Instance) p5Instance.remove(); };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none opacity-60" />;
};