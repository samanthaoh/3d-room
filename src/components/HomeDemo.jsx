import { useEffect, useState } from 'react';
import RoomPreview from './RoomPreview';

const scenes = [
  { title: 'Start with your space.', detail: 'Set the dimensions. See the possibilities.', label: 'Plan' },
  { title: 'Find the right pieces.', detail: 'Bring your room to life with furniture.', label: 'Furnish' },
  { title: 'Make everything fit.', detail: 'Move and rotate pieces to find your layout.', label: 'Arrange' },
  { title: 'Make it feel like you.', detail: 'Explore colors. Create a space of your own.', label: 'Style' },
];

export default function HomeDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { if (preference.matches) setPlaying(false); };
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setStep(previous => (previous + 1) % scenes.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [playing]);
  const room = {
    width: 5, depth: 4,
    wallColor: step === 3 ? '#adc3b0' : '#e5e9dc',
    floorColor: step === 3 ? '#be9973' : '#d4b48c',
    furniture: [
      { id: 'demo-sofa', type: 'sofa', x: step >= 2 ? 10 : 23, y: 15, rotation: 0 },
      { id: 'demo-table', type: 'table', x: step >= 2 ? 40 : 45, y: step >= 2 ? 52 : 47, rotation: step >= 2 ? 90 : 0 },
      { id: 'demo-chair', type: 'chair', x: step >= 2 ? 75 : 66, y: 56, rotation: step >= 2 ? 90 : 0 },
      { id: 'demo-plant', type: 'plant', x: 80, y: 12, rotation: 0 },
    ],
  };
  return <section className="hero-art home-demo" aria-label="Animated room feature demo" data-step={step}>
    <div className="demo-topline"><span className="demo-badge"><span aria-hidden="true"/> SEE YOUR SPACE TAKE SHAPE</span><button className="demo-play" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Pause room demo' : 'Play room demo'}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span></button></div>
    <div className="demo-scene" aria-hidden="true"><RoomPreview room={room} flat={step === 0}/></div>
    <div className="demo-story"><span className="eyebrow">0{step + 1} / 04 · {scenes[step].label.toUpperCase()}</span><h2>{scenes[step].title}</h2><p>{scenes[step].detail}</p>
      <div className="demo-steps" role="group" aria-label="Preview a room feature">{scenes.map((scene, index) => <button key={scene.label} aria-pressed={step === index} onClick={() => { setStep(index); setPlaying(false); }}><span className="demo-step-track" aria-hidden="true"/>{scene.label}</button>)}</div>
    </div>
  </section>;
}
