// AdvancedStarrySky.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import type { Group as GroupType } from 'konva/lib/Group';
import type { Layer as LayerType } from 'konva/lib/Layer';
import type { Stage as StageType } from 'konva/lib/Stage';

// 类型定义
interface Star {
  id: number;
  x: number;
  y: number;
  baseRadius: number;
  brightness: number;
  seed: number;
  flickerSpeed: number;
  flickerPhase: number;
}

interface MeteorData {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  decay: number;
  length: number;
  brightness: number;
  node: Konva.Group;
}

interface Dimensions {
  width: number;
  height: number;
}

// 配置常量
const CONFIG = {
  MILKY_WAY_URL: '/milkyway_4k.jpg',
  SPIKE_STAR_URL: '/spike-star.png',
  STAR_COUNT: 1500,
  METEOR_SPAWN_RATE: 0.35,
  METEOR_INTERVAL_MS: 2000,
  BRIGHTNESS_THRESHOLD: 0.85,
} as const;

// 生成随机恒星数据
const generateStars = (count: number, width: number, height: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const brightness = Math.random();
    stars.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius: 0.3 + brightness * 1.5,
      brightness,
      seed: Math.random() * 1000,
      flickerSpeed: 0.002 + Math.random() * 0.004,
      flickerPhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
};

// 创建流星 Konva 节点（纯 Konva API，避免 React 重渲染）
const createMeteorNode = (length: number, angle: number): Konva.Group => {
  const tailX = -Math.cos(angle) * length;
  const tailY = -Math.sin(angle) * length;

  const group = new Konva.Group({ listening: false, globalCompositeOperation: 'lighter' });
  group.add(new Konva.Circle({ x: 0, y: 0, radius: 1.5, fill: 'white', shadowBlur: 6, shadowColor: 'rgba(255,255,255,0.9)' }));
  group.add(new Konva.Circle({ x: 0, y: 0, radius: 0.8, fill: 'rgba(255,255,255,0.95)' }));
  group.add(new Konva.Line({
    points: [0, 0, tailX, tailY],
    stroke: 'rgba(255,255,255,0.9)',
    strokeWidth: 2,
    lineCap: 'round',
  }));
  group.add(new Konva.Line({
    points: [0, 0, tailX, tailY],
    stroke: 'rgba(180,210,255,0.4)',
    strokeWidth: 5,
    lineCap: 'round',
  }));
  return group;
};

const AdvancedStarrySky: React.FC = () => {
  // Refs
  const stageRef = useRef<StageType>(null);
  const starsLayerRef = useRef<LayerType>(null);
  const meteorsLayerRef = useRef<LayerType>(null);
  const animationRef = useRef<Konva.Animation | null>(null);
  const meteorsDataRef = useRef<MeteorData[]>([]);
  const lastSpawnRef = useRef(0);
  
  // State
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  const [stars] = useState<Star[]>(() => 
    generateStars(CONFIG.STAR_COUNT, window.innerWidth, window.innerHeight)
  );
  
  // Images
  const [bgImage] = useImage(CONFIG.MILKY_WAY_URL);
  const [spikeImage] = useImage(CONFIG.SPIKE_STAR_URL);

  // 窗口大小变化处理
  useEffect(() => {
    const handleResize = (): void => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 同步 dimensions 到 ref，供动画闭包使用
  const dimensionsRef = useRef(dimensions);
  dimensionsRef.current = dimensions;

  // 星星 + 流星 统一 Konva.Animation，避免 React 重渲染
  useEffect(() => {
    const starsLayer = starsLayerRef.current;
    const meteorsLayer = meteorsLayerRef.current;
    if (!starsLayer || !meteorsLayer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const time = frame.time;
      const { width, height } = dimensionsRef.current;

      // 1. 星星闪烁
      const starShapes = starsLayer.getChildren() as GroupType[];
      starShapes.forEach((group, i) => {
        const star = stars[i];
        if (!star) return;
        const flicker = 0.7 + 0.3 * Math.sin(time * star.flickerSpeed + star.flickerPhase);
        const opacity = Math.min(1, star.brightness * flicker);
        const radius = star.baseRadius * (0.8 + 0.2 * flicker);
        group.opacity(opacity);
        const circle = group.findOne<Konva.Circle>('Circle');
        if (circle) {
          circle.radius(radius);
          circle.shadowBlur(radius * 2);
        }
        const spike = group.findOne<Konva.Image>('Image');
        if (spike) {
          const size = radius * 8;
          spike.width(size);
          spike.height(size);
          spike.offsetX(size / 2);
          spike.offsetY(size / 2);
        }
      });

      // 2. 流星生成（按时间间隔）
      if (time - lastSpawnRef.current > CONFIG.METEOR_INTERVAL_MS) {
        lastSpawnRef.current = time;
        if (Math.random() < CONFIG.METEOR_SPAWN_RATE) {
          const length = 60 + Math.random() * 90;
          const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25;
          const node = createMeteorNode(length, angle);
          meteorsLayer.add(node);
          meteorsDataRef.current.push({
            id: time + Math.random(),
            x: Math.random() * width * 0.25,
            y: Math.random() * height * 0.4,
            angle,
            speed: 8 + Math.random() * 10,
            life: 1,
            decay: 0.008 + Math.random() * 0.012,
            length,
            brightness: 0.75 + Math.random() * 0.25,
            node,
          });
        }
      }

      // 3. 流星位置更新（直接操作 Konva 节点，无 React 重渲染）
      const meteors = meteorsDataRef.current;
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.life -= m.decay;

        m.node.position({ x: m.x, y: m.y });
        m.node.opacity(m.life * m.brightness);

        if (m.life <= 0 || m.x > width + 100 || m.y > height + 100) {
          m.node.destroy();
          meteors.splice(i, 1);
        }
      }
    }, [starsLayer, meteorsLayer]);

    anim.start();
    animationRef.current = anim;
    return () => {
      anim.stop();
      meteorsDataRef.current.forEach((m) => m.node.destroy());
      meteorsDataRef.current = [];
    };
  }, [stars]);

  // 页面可见性变化处理（性能优化）
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        animationRef.current?.stop();
      } else {
        animationRef.current?.start();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ background: '#000', cursor: 'none' }}
    >
      {/* 背景层 */}
      <Layer listening={false}>
        {bgImage && (
          <Image
            image={bgImage}
            width={dimensions.width}
            height={dimensions.height}
            opacity={0.6}
          />
        )}
      </Layer>

      {/* 恒星层 */}
      <Layer ref={starsLayerRef} listening={false}>
        {stars.map((star) => (
          <Group 
            key={star.id} 
            x={star.x} 
            y={star.y}
            opacity={star.brightness}
          >
            <Circle
              radius={star.baseRadius}
              fill="white"
              shadowBlur={star.baseRadius * 2}
              shadowColor="white"
              shadowOpacity={0.6}
            />
            {star.brightness > CONFIG.BRIGHTNESS_THRESHOLD && spikeImage && (
              <Image
                image={spikeImage}
                width={star.baseRadius * 8}
                height={star.baseRadius * 8}
                offsetX={star.baseRadius * 4}
                offsetY={star.baseRadius * 4}
                opacity={0.9}
              />
            )}
          </Group>
        ))}
      </Layer>

      {/* 流星层 - 由 Konva.Animation 直接操作，无 React 重渲染 */}
      <Layer ref={meteorsLayerRef} listening={false} />
    </Stage>
  );
};

export default AdvancedStarrySky;
