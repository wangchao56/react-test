import React, { useEffect, useRef } from "react";
import { Stage, Layer, Star, Line, Circle, Group } from "react-konva";
import Konva from "konva";
type BgStar = {
  x: number
  y: number
  r: number
  opacity: number
}

function generateStars(
  width: number,
  height: number,
  density: number
): BgStar[] {

  const count = Math.floor(width * height * density)

  const stars: BgStar[] = []

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.8 + 0.2
    })
  }

  return stars
}

type StarData = {
  x: number;
  y: number;
  freq: number;
  phase: number;
};

const width = 1200;
const height = 800;
const offset = 100;
const bgStars = generateStars(width, height, 0.002);

const stars: StarData[] = [
  { x: 0 + offset, y: 0 + offset, freq: 1.2, phase: 0 },
  { x: 150 + offset, y: 25 + offset, freq: 1.6, phase: 1 },
  { x: 215 + offset, y: 90 + offset, freq: 1.4, phase: 2 },
  { x: 300 + offset, y: 170 + offset, freq: 1.9, phase: 3 },
  { x: 290 + offset, y: 265 + offset, freq: 1.3, phase: 4 },
  { x: 455 + offset, y: 320 + offset, freq: 2.1, phase: 5 },
  { x: 515 + offset, y: 225 + offset, freq: 1.7, phase: 6 }
];


const StarGlow = ({ x, y }) => {
  const size = 40;

  return (
    <Group x={x} y={y}>

      {/* 外围紫色光晕 */}
      <Circle
        radius={size}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={size}
        fillRadialGradientColorStops={[
          0, "rgba(255,255,255,0.9)",
          0.2, "rgba(220,180,255,0.8)",
          0.4, "rgba(180,120,255,0.6)",
          0.7, "rgba(120,60,255,0.3)",
          1, "rgba(120,60,255,0)"
        ]}
      />

      {/* 十字光芒 */}
      <Line
        points={[-size,0, size,0]}
        stroke="rgba(255,200,255,0.9)"
        strokeWidth={2}
        shadowBlur={10}
        shadowColor="#ffb6ff"
      />

      <Line
        points={[0,-size, 0,size]}
        stroke="rgba(255,200,255,0.9)"
        strokeWidth={2}
        shadowBlur={10}
        shadowColor="#ffb6ff"
      />

      {/* 中心亮点 */}
      <Circle
        radius={3}
        fill="white"
        shadowColor="#ffffff"
        shadowBlur={10}
      />

    </Group>
  );
};
const StarNode = ({ x, y }) => {
  const r = 40;

  const rays = [0, 45, 90, 135];

  return (
    <Group x={x} y={y}>
      
      {/* 紫色光晕 */}
      <Circle
        radius={r}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r}
        fillRadialGradientColorStops={[
          0, "rgba(255,255,255,1)",
          0.2, "rgba(220,180,255,0.8)",
          0.4, "rgba(180,120,255,0.6)",
          0.7, "rgba(140,80,255,0.3)",
          1, "rgba(120,60,255,0)"
        ]}
      />

      {/* 米字光芒 */}
      {rays.map((deg, i) => (
        <Line
          key={i}
          points={[-r, 0, r, 0]}
          stroke="rgba(255,200,255,0.9)"
          strokeWidth={2}
          rotation={deg}
          shadowColor="#ffb6ff"
          shadowBlur={10}
        />
      ))}

      {/* 核心 */}
      <Circle
        radius={3}
        fill="white"
        shadowColor="white"
        shadowBlur={10}
      />
    </Group>
  );
};

export default function BigDipper() {
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const starsNodes = layer.find("Star");

    const animation = new Konva.Animation((frame) => {
      const time = frame?.time ?? 0;
      const t = time * 0.002;

      starsNodes.forEach((node, i) => {
        const star = stars[i];

        const s = Math.sin(t * star.freq + star.phase);

        node.opacity(0.5 + 0.5 * s);
        node.scale({ x: 0.9 + 0.2 * s, y: 0.9 + 0.2 * s });
      });
    }, layer);

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <Stage width={width} height={height}>
      {/* 背景繁星 */}
      <Layer listening={false}>
        {bgStars.map((s, i) => (
          <Circle
            key={i}
            x={s.x}
            y={s.y}
            radius={s.r}
            fill="#fff"
            opacity={s.opacity}
          />
        ))}
         <StarNode x={50} y={50}/>
      </Layer>
      <Layer ref={layerRef}>
        <Line
          points={stars.flatMap(s => [s.x, s.y])}
          stroke="#aaa"
          strokeWidth={1}
        />

        {stars.map((star, i) => (
          <Star
            key={i}
            x={star.x}
            y={star.y}
            numPoints={5}
            innerRadius={3}
            outerRadius={7}
            fill="#fff"
            shadowColor="#fff"
            shadowBlur={15}
          />
        ))}
      </Layer>
    </Stage>
  );
}