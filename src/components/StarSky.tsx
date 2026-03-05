import React, { useEffect, useRef, useState } from "react"
import { Stage, Layer, Circle, Line } from "react-konva"
import Konva from "konva"

const width = 1200
const height = 800
type BgStar = {
    x: number
    y: number
    r: number
    freq: number
    phase: number
}
type Meteor = {
    x: number
    y: number
    vx: number
    vy: number
    life: number
  }
function createStars(count: number, w: number, h: number): BgStar[] {
    return Array.from({ length: count }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        freq: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2
    }))
} function createMeteor(width: number) {
    return {
        x: Math.random() * width,
        y: -50,
        vx: -6 - Math.random() * 3,
        vy: 6 + Math.random() * 2,
        life: 120
    }
}
const bgStars = createStars(1221, width, height)

export default function StarSky() {
    const layerRef = useRef<Konva.Layer>(null)
    const meteors = useRef<Meteor[]>([])
    const meteorLines = useRef<Konva.Line[]>([])

    useEffect(() => {
        const layer = layerRef.current
        if (!layer) return

        const animation = new Konva.Animation((frame) => {
            const time = frame?.time ?? 0

            // ⭐ 背景星闪烁
            layer.find(".bgstar").forEach((node, i) => {
                const star = bgStars[i]

                const opacity =
                    0.3 + 0.7 * Math.sin(time * 0.002 * star.freq + star.phase)

                node.opacity(Math.abs(opacity))
            })

            // ☄️ 生成流星
            if (Math.random() < 0.01) {
                meteors.current.push(createMeteor(width))
            }

            // ☄️ 更新流星
            meteors.current.forEach((m, i) => {
                m.x += m.vx
                m.y += m.vy
                m.life--

                const line = meteorLines.current[i]
                if (line) {
                    line.points([
                        m.x,
                        m.y,
                        m.x - m.vx * 6,
                        m.y - m.vy * 6
                    ])
                }
            })

            meteors.current = meteors.current.filter(m => m.life > 0)

        }, layer)

        animation.start()

        return () => animation.stop()
    }, [])

    return (
        <Stage width={width} height={height}>
            <Layer ref={layerRef}>

                {/* 繁星 */}
                {bgStars.map((s, i) => (
                    <Circle
                        key={i}
                        name="bgstar"
                        x={s.x}
                        y={s.y}
                        radius={s.r}
                        fill="white"
                        opacity={0.8}
                    />
                ))}

                {/* 流星 */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <Line
                        key={i}
                        ref={(r) => {
                            if (r) meteorLines.current[i] = r
                        }}
                        points={[0, 0, 0, 0]}
                        stroke="white"
                        strokeWidth={2}
                        lineCap="round"
                        shadowBlur={2}
                    />
                ))}

            </Layer>
        </Stage>
    )
}