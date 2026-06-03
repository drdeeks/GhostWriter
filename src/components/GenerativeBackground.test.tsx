"use client";

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenerativeBackground } from './GenerativeBackground';

// Mock p5 module
jest.mock('p5', () => {
  const mockP5Instance = {
    createCanvas: jest.fn(),
    windowWidth: 1024,
    windowHeight: 768,
    pixelDensity: jest.fn(),
    clear: jest.fn(),
    dist: jest.fn(() => 100),
    map: jest.fn((val, inMin, inMax, outMin, outMax) => outMin),
    stroke: jest.fn(),
    line: jest.fn(),
    resizeCanvas: jest.fn(),
    remove: jest.fn(),
  };
  
  return jest.fn().mockImplementation((sketch) => {
    // Call the sketch function immediately with a mock p5 instance
    if (sketch) sketch(mockP5Instance);
    return mockP5Instance;
  });
});

describe('GenerativeBackground', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GenerativeBackground />);
    const container = screen.getByTestId('generative-background');
    expect(container).toBeInTheDocument();
  });

  it('creates p5 instance on mount', () => {
    render(<GenerativeBackground />);
    
    const p5Mock = require('p5');
    expect(p5Mock).toHaveBeenCalled();
  });

  it('applies default className', () => {
    render(<GenerativeBackground />);
    const container = screen.getByTestId('generative-background');
    expect(container).toHaveClass('fixed inset-0 -z-10 pointer-events-none opacity-60');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<GenerativeBackground className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});