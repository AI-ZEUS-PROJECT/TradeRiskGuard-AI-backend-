import type React from "react"
interface CardGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
}

export function CardGrid({ children, cols = 3 }: CardGridProps) {
  const colMap = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }

  return <div className={`grid ${colMap[cols]} gap-6`}>{children}</div>
}
