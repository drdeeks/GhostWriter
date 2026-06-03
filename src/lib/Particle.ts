export class Particle {
  pos: any;
  vel: any;
  size: number;
  col: any;
  p: any;
  
  constructor(p: any) {
    this.p = p;
    this.pos = p.createVector(p.random(p.width), p.random(p.height));
    this.vel = p.createVector(p.random(-0.4, 0.4), p.random(-0.4, 0.4));
    this.size = p.random(1, 3);
    this.col = p.random() > 0.5 ? [0, 255, 255] : [106, 13, 173];
  }
  
  update() {
    this.pos.add(this.vel);
    if (this.pos.x < 0 || this.pos.x > this.p.width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > this.p.height) this.vel.y *= -1;
  }
  
  display() {
    this.p.noStroke();
    this.p.fill(this.col[0], this.col[1], this.col[2], 60);
    this.p.circle(this.pos.x, this.pos.y, this.size);
  }
}