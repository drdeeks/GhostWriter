"use strict";

import { Particle } from './Particle';

describe('Particle', () => {
  let mockP5: any;
  
  beforeEach(() => {
    mockP5 = {
      createVector: jest.fn((x, y) => ({
        x, y, 
        add: jest.fn(function(v) { this.x += v.x; this.y += v.y; return this; }),
        mult: jest.fn(function(n) { this.x *= n; this.y *= n; return this; })
      })),
      random: jest.fn((min, max) => min + (max - min) / 2),
      map: jest.fn((val, inMin, inMax, outMin, outMax) => outMin),
      stroke: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(),
      circle: jest.fn(),
      noStroke: jest.fn(),
      windowWidth: 1000,
      windowHeight: 800,
    };
  });

  it('should initialize with random position and velocity', () => {
    const particle = new Particle(mockP5);
    
    expect(mockP5.createVector).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    expect(particle.pos).toBeDefined();
    expect(particle.vel).toBeDefined();
  });

  it('should update position based on velocity', () => {
    const particle = new Particle(mockP5);
    const initialPos = { x: particle.pos.x, y: particle.pos.y };
    
    particle.update();
    
    expect(particle.pos.x).not.toBe(initialPos.x);
    expect(particle.pos.y).not.toBe(initialPos.y);
  });

  it('should bounce off edges', () => {
    const particle = new Particle(mockP5);
    
    // Set position to right edge
    particle.pos.x = mockP5.windowWidth + 10;
    const initialVelX = particle.vel.x;
    
    particle.update();
    
    expect(particle.vel.x).toBeLessThan(0);
  });

  it('should display as a circle', () => {
    const particle = new Particle(mockP5);
    
    particle.display();
    
    expect(mockP5.stroke).toHaveBeenCalledWith(255, 100);
    expect(mockP5.fill).toHaveBeenCalledWith(255, 150);
    expect(mockP5.ellipse).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 4, 4);
  });

  it('should handle different sizes', () => {
    const particle = new Particle(mockP5);
    particle.size = 8;
    
    particle.display();
    
    expect(mockP5.ellipse).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 8, 8);
  });
});