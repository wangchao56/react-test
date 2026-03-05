import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Star, Line, Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Star as StarIcon, Info, RefreshCcw, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface StarData {
  id: number;
  x: number;
  y: number;
  name: string;
  color: string;
  baseRadius: number;
  pulseSpeed: number; // Unique frequency for each star
  pulseOffset: number;
}

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SCALE_FACTOR = 0.8; // Scale down the constellation to fit nicely

// Initial positions for the Big Dipper (approximate relative coordinates)
// We map these to a grid system
const INITIAL_STARS: StarData[] = [
  { id: 1, x: 150, y: 150, name: "Dubhe (Alpha)", color: "#FFD700", baseRadius: 12, pulseSpeed: 0.002, pulseOffset: 0 },
  { id: 2, x: 280, y: 180, name: "Merak (Beta)", color: "#FFFACD", baseRadius: 11, pulseSpeed: 0.003, pulseOffset: 2 },
  { id: 3, x: 320, y: 320, name: "Phecda (Gamma)", color: "#E0FFFF", baseRadius: 10, pulseSpeed: 0.0015, pulseOffset: 4 },
  { id: 4, x: 360, y: 420, name: "Megrez (Delta)", color: "#F0F8FF", baseRadius: 9, pulseSpeed: 0.004, pulseOffset: 1 },
  { id: 5, x: 520, y: 450, name: "Alioth (Epsilon)", color: "#B0E0E6", baseRadius: 13, pulseSpeed: 0.0025, pulseOffset: 3 },
  { id: 6, x: 620, y: 480, name: "Mizar (Zeta)", color: "#ADD8E6", baseRadius: 11, pulseSpeed: 0.0035, pulseOffset: 5 },
  { id: 7, x: 720, y: 520, name: "Alkaid (Eta)", color: "#87CEFA", baseRadius: 12, pulseSpeed: 0.001, pulseOffset: 2.5 },
];

const CONNECTIONS = [
  [1, 2], // Dubhe -> Merak
  [2, 3], // Merak -> Phecda
  [3, 4], // Phecda -> Megrez
  [4, 5], // Megrez -> Alioth
  [5, 6], // Alioth -> Mizar
  [6, 7], // Mizar -> Alkaid
  [1, 4], // Dubhe -> Megrez (Handle start)
];

// --- Components ---

const StarNode = ({ 
  data, 
  isHovered, 
  onHover, 
  onDragMove, 
  globalSpeed 
}: { 
  data: StarData; 
  isHovered: boolean; 
  onHover: (id: number | null) => void;
  onDragMove: (id: number, x: number, y: number) => void;
  globalSpeed: number;
}) => {
  const [pulse, setPulse] = useState(0);

  // Animation Loop for Twinkling
  useEffect(() => {
    let animationFrameId: number;
    const animate = (time: number) => {
      // Calculate pulse based on time, speed, and unique offset
      const val = Math.sin(time * data.pulseSpeed * globalSpeed + data.pulseOffset);
      // Map sine wave (-1 to 1) to opacity/radius range (0.6 to 1.2)
      setPulse(val); 
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [data.pulseSpeed, data.pulseOffset, globalSpeed]);

  const currentRadius = data.baseRadius * (1 + pulse * 0.15);
  const opacity = 0.7 + pulse * 0.3;
  const glowOpacity = isHovered ? 0.8 : 0.4 + (pulse * 0.2);

  return (
    <Group
      x={data.x}
      y={data.y}
      draggable
      onDragMove={(e) => onDragMove(data.id, e.target.x(), e.target.y())}
      onMouseEnter={() => onHover(data.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Outer Glow (Corona) */}
      <Circle 
        radius={currentRadius * 3} 
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={currentRadius * 0.5}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={currentRadius * 3}
        fillRadialGradientColorStops={[0, data.color, 1, 'transparent']}
        opacity={glowOpacity}
        shadowBlur={20}
        shadowColor={data.color}
      />
      
      {/* Core Star */}
      <Star
        numPoints={5}
        innerRadius={currentRadius * 0.4}
        outerRadius={currentRadius}
        fill="#FFFFFF"
        opacity={opacity}
        shadowBlur={10}
        shadowColor={data.color}
        shadowOpacity={1}
      />

      {/* Hover Label */}
      {isHovered && (
        <Text
          text={data.name}
          fontSize={14}
          fontFamily="sans-serif"
          fill="white"
          y={currentRadius + 15}
          x={-50}
          width={100}
          align="center"
          shadowColor="black"
          shadowBlur={4}
        />
      )}
    </Group>
  );
};

export default function BigDipperApp() {
  const [stars, setStars] = useState<StarData[]>(INITIAL_STARS);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [showConnections, setShowConnections] = useState(true);
  const [bgStars, setBgStars] = useState<{x:number, y:number, size:number}[]>([]);

  // Generate background static stars once
  useEffect(() => {
    const newBgStars = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 1.5 + 0.5,
    }));
    setBgStars(newBgStars);
  }, []);

  const handleDragMove = (id: number, x: number, y: number) => {
    setStars(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  };

  const resetConstellation = () => {
    setStars(INITIAL_STARS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col items-center py-8 px-4">
      
      {/* Header */}
      <header className="mb-8 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
          The Big Dipper
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
          An interactive visualization of Ursa Major. Drag the stars to reshape the constellation.
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
        
        {/* Canvas Container */}
        <div className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/50 border border-slate-800 bg-black">
          {/* Nebula Background Effect (CSS) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.15),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.1),transparent_50%)] pointer-events-none" />

          <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="cursor-crosshair">
            <Layer>
              {/* Background Stars */}
              {bgStars.map((s, i) => (
                <Circle 
                  key={i} 
                  x={s.x} 
                  y={s.y} 
                  radius={s.size} 
                  fill="white" 
                  opacity={Math.random() * 0.5 + 0.1} 
                />
              ))}
            </Layer>

            <Layer>
              {/* Connection Lines */}
              {showConnections && CONNECTIONS.map(([startId, endId], i) => {
                const start = stars.find(s => s.id === startId);
                const end = stars.find(s => s.id === endId);
                if (!start || !end) return null;

                return (
                  <Line
                    key={i}
                    points={[start.x, start.y, end.x, end.y]}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth={1}
                    dash={[5, 5]}
                    lineCap="round"
                  />
                );
              })}

              {/* Main Stars */}
              {stars.map((star) => (
                <StarNode
                  key={star.id}
                  data={star}
                  isHovered={hoveredId === star.id}
                  onHover={setHoveredId}
                  onDragMove={handleDragMove}
                  globalSpeed={globalSpeed}
                />
              ))}
            </Layer>
          </Stage>

          {/* Floating Canvas Label */}
          <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-mono pointer-events-none">
            CANVAS: {CANVAS_WIDTH}x{CANVAS_HEIGHT}
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
              <StarIcon size={18} /> Controls
            </h3>
            
            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Twinkle Speed</span>
                <span>{globalSpeed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1" 
                value={globalSpeed}
                onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-300">Show Connections</span>
              <button 
                onClick={() => setShowConnections(!showConnections)}
                className={`w-12 h-6 rounded-full transition-colors relative ${showConnections ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showConnections ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Star List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Star Data</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {stars.map((star) => (
                <div 
                  key={star.id} 
                  className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                    hoveredId === star.id 
                      ? 'bg-indigo-900/30 border-indigo-500/50' 
                      : 'bg-slate-800/30 border-transparent hover:bg-slate-800/50'
                  }`}
                  onMouseEnter={() => setHoveredId(star.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: star.color, boxShadow: `0 0 10px ${star.color}` }} />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{star.name.split(' ')[0]}</div>
                      <div className="text-xs text-slate-500">{star.name.split('(')[1].replace(')', '')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button 
            onClick={resetConstellation}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <RefreshCcw size={16} />
            Reset Constellation
          </button>

          <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg flex gap-3 items-start">
            <Info className="text-indigo-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              The Big Dipper is an asterism within Ursa Major. Its two brightest stars, Dubhe and Merak, are known as the "pointer stars" used to find Polaris.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
