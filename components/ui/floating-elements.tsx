"use client"

import { useEffect, useState } from "react"
import { Brain, Zap, Target, Star, Sparkles, Trophy } from "lucide-react"

const icons = [Brain, Zap, Target, Star, Sparkles, Trophy]

export function FloatingElements() {
  const [elements, setElements] = useState<
    Array<{
      id: number
      Icon: any
      x: number
      y: number
      delay: number
      duration: number
      color: string
    }>
  >([])

  useEffect(() => {
    const newElements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      color: [
        "text-blue-500",
        "text-purple-500",
        "text-cyan-500",
        "text-green-500",
        "text-yellow-500",
        "text-pink-500",
      ][Math.floor(Math.random() * 6)],
    }))
    setElements(newElements)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {elements.map((element) => {
        const Icon = element.Icon
        return (
          <div
            key={element.id}
            className={`absolute ${element.color} opacity-20 dark:opacity-10`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animation: `float ${element.duration}s ease-in-out infinite`,
              animationDelay: `${element.delay}s`,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
        )
      })}
    </div>
  )
}
