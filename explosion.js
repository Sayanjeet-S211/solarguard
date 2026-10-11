// Separation preserves coherent subassemblies; it illustrates the concept, not a disassembly procedure.
export function separationOffset(name, parent) {
 if (parent === 'carriage') {
  if (name.startsWith('Carriage block')) return [name.includes('idle')?.7:-.7,0,0];
  if (name.startsWith('LM8UU bearing')) return [name.includes('idle')?.35:-.35,.4,0];
  if (name === 'Belt clamp plate') return [-.7,.8,0];
  if (name === 'Belt clamp screw') return [-.7,1.05,0];
  if (name === 'Wiper arm') return [0, .3, 0];
  if (name === 'Silicone squeegee blade') return [0, .6, .25];
  return [0, 0, 0];
 }
 if (parent === 'managed-panel') {
  if (name === 'Panel A PV panel' || name === 'Panel frame') return [0, .45, 0];
  if (name === '8 mm guide rod' || name === 'Rod end bracket') return [0, 1.15, 0];
  if (name === 'Motor clamp strap') return [-.35,2.2,0];
  if (name.startsWith('Belt') || /pulley|gear motor|Motor mount/.test(name)) return [-.35, 1.85, 0];
  if (name === 'Spray bar (fixed)' || name === 'Spray nozzle') return [0, 2.75, -.45];
  if (name.startsWith('DS18B20')) return [.35, .2, 0];
  if (name.includes('end-stop')) return [-.35, 1.15, 0];
 }
 if (parent === 'electronics') {
  if (name === 'Electronics enclosure') return [0, 2.8, -.35];
  if (name === '3S battery + BMS' || name === 'Charge controller') return [0, .8, 1.05];
  return [0, 1.7, 1.05];
 }
 return [0, 0, 0];
}
const clamp = x => Math.max(0, Math.min(1, Number(x) || 0));
export class ExplosionMotion {
 constructor({reducedMotion = false} = {}) { this.value = 0; this.target = 0; this.reducedMotion = reducedMotion; this.tween = null; this.sequence = []; this.paused = false; }
 get playing() { return this.sequence.length > 0; }
 setTarget(value, duration = 2.4) {
  this.sequence = []; this.paused = false; this.move(value, duration);
 }
 move(value, duration) {
  this.target = clamp(value);
  if (this.reducedMotion || duration <= 0) { this.value = this.target; this.tween = null; }
  else this.tween = {from: this.value, to: this.target, elapsed: 0, duration};
 }
 play() {
  if (this.paused) { this.paused = false; return; }
  if (this.reducedMotion) { this.setTarget(1, 0); return; }
  this.sequence = [{to: 1, duration: 2.4}, {to: 1, duration: 1.4}, {to: 0, duration: 2.4}];
  this.paused = false;
  this.move(this.sequence[0].to, this.sequence[0].duration);
 }
 pause() { if (this.playing) this.paused = true; }
 step(dt) {
  if (this.paused || !this.tween) return this.value;
  const t = this.tween; t.elapsed += Math.max(0, dt);
  const u = Math.min(1, t.elapsed / t.duration), ease = u * u * (3 - 2 * u);
  this.value = t.from + (t.to - t.from) * ease;
  if (u === 1) {
   this.value = t.to; this.tween = null;
   if (this.sequence.length) { this.sequence.shift(); if (this.sequence.length) this.move(this.sequence[0].to, this.sequence[0].duration); }
  }
  return this.value;
 }
}
