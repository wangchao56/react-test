// AdvancedStarrySky.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Group, Circle, Shape } from 'react-konva';
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

interface Meteor {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  decay: number;
  length: number;
  brightness: number; // 0.7-1，流星亮度差异
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
  METEOR_INTERVAL: 2000,
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

// 流星组件 - 渐变尾迹 + 头部光晕，更接近真实流星
interface MeteorProps {
  x: number;
  y: number;
  angle: number;
  life: number;
  length: number;
  brightness: number;
}

const Meteor: React.FC<MeteorProps> = React.memo(({ x, y, angle, life, length, brightness }) => {
  const tailX = x - Math.cos(angle) * length;
  const tailY = y - Math.sin(angle) * length;
  const opacity = life * brightness;

  return (
    <Group opacity={opacity} globalCompositeOperation="lighter">
      {/* 头部光晕 - 模拟燃烧的核心 */}
      <Circle
        x={x}
        y={y}
        radius={1.5}
        fill="white"
        shadowBlur={8}
        shadowColor="rgba(255, 255, 255, 0.9)"
      />
      <Circle
        x={x}
        y={y}
        radius={0.8}
        fill="rgba(255, 255, 255, 0.95)"
      />
      {/* 渐变尾迹 - 头部亮白逐渐过渡到尾部透明蓝 */}
      <Shape
        sceneFunc={(context) => {
          const gradient = context.createLinearGradient(x, y, tailX, tailY);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          gradient.addColorStop(0.15, 'rgba(220, 235, 255, 0.7)');
          gradient.addColorStop(0.4, 'rgba(180, 210, 255, 0.35)');
          gradient.addColorStop(0.7, 'rgba(120, 180, 255, 0.12)');
          gradient.addColorStop(1, 'rgba(80, 150, 255, 0)');

          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(tailX, tailY);
          context.strokeStyle = gradient;
          context.lineWidth = 2.5;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.stroke();
        }}
      />
      {/* 外层柔和光晕 - 增加尾迹体积感 */}
      <Shape
        sceneFunc={(context) => {
          const gradient = context.createLinearGradient(x, y, tailX, tailY);
          gradient.addColorStop(0, 'rgba(200, 220, 255, 0.25)');
          gradient.addColorStop(0.5, 'rgba(150, 190, 255, 0.08)');
          gradient.addColorStop(1, 'rgba(100, 160, 255, 0)');

          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(tailX, tailY);
          context.strokeStyle = gradient;
          context.lineWidth = 6;
          context.lineCap = 'round';
          context.stroke();
        }}
      />
    </Group>
  );
});

Meteor.displayName = 'Meteor';

const AdvancedStarrySky: React.FC = () => {
  // Refs
  const stageRef = useRef<StageType>(null);
  const starsLayerRef = useRef<LayerType>(null);
  const animationRef = useRef<Konva.Animation | null>(null);
  const meteorRAFRef = useRef<number | null>(null);
  
  // State
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  const [stars] = useState<Star[]>(() => 
    generateStars(CONFIG.STAR_COUNT, window.innerWidth, window.innerHeight)
  );
  
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  
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

  // 流星生成器 - 随机参数使每条流星更独特
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < CONFIG.METEOR_SPAWN_RATE) {
        const startY = Math.random() * dimensions.height * 0.4;
        const meteor: Meteor = {
          id: Date.now() + Math.random(),
          x: Math.random() * dimensions.width * 0.25,
          y: startY,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
          speed: 8 + Math.random() * 10,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          length: 60 + Math.random() * 90,
          brightness: 0.75 + Math.random() * 0.25,
        };
        setMeteors((prev) => [...prev, meteor]);
      }
    }, CONFIG.METEOR_INTERVAL);

    return () => clearInterval(interval);
  }, [dimensions]);

  // 流星动画循环
  useEffect(() => {
    const updateMeteors = (): void => {
      setMeteors((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((m) => ({
            ...m,
            x: m.x + Math.cos(m.angle) * m.speed,
            y: m.y + Math.sin(m.angle) * m.speed,
            life: m.life - m.decay,
          }))
          .filter((m) => 
            m.life > 0 && 
            m.x < dimensions.width + 100 && 
            m.y < dimensions.height + 100
          );
      });
    };

    const loop = (): void => {
      updateMeteors();
      meteorRAFRef.current = requestAnimationFrame(loop);
    };
    
    meteorRAFRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (meteorRAFRef.current) {
        cancelAnimationFrame(meteorRAFRef.current);
      }
    };
  }, [dimensions]);

  // 星星闪烁动画 - 使用 Konva.Animation
  useEffect(() => {
    if (!starsLayerRef.current) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      
      const time = frame.time;
      const starShapes = starsLayerRef.current!.getChildren() as GroupType[];
      
      starShapes.forEach((group, i) => {
        const star = stars[i];
        if (!star) return;
        
        // 闪烁计算
        const flicker = 0.7 + 0.3 * Math.sin(time * star.flickerSpeed + star.flickerPhase);
        const opacity = Math.min(1, star.brightness * flicker);
        const radius = star.baseRadius * (0.8 + 0.2 * flicker);
        
        group.opacity(opacity);
        
        // 更新圆形
        const circle = group.findOne<Konva.Circle>('Circle');
        if (circle) {
          circle.radius(radius);
          circle.shadowBlur(radius * 2);
        }
        
        // 更新米字贴图
        const spike = group.findOne<Konva.Image>('Image');
        if (spike) {
          const size = radius * 8;
          spike.width(size);
          spike.height(size);
          spike.offsetX(size / 2);
          spike.offsetY(size / 2);
        }
      });
    }, starsLayerRef.current);

    anim.start();
    animationRef.current = anim;
    
    return () => {
      anim.stop();
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

      {/* 流星层 */}
      <Layer>
        {meteors.map((m) => (
          <Meteor 
            key={m.id} 
            x={m.x} 
            y={m.y} 
            angle={m.angle} 
            life={m.life}
            length={m.length}
            brightness={m.brightness}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default AdvancedStarrySky;
