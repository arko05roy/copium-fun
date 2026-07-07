"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type StackCard = {
  id: string | number;
  content: React.ReactNode;
  name?: string;
  designation?: string;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  autoFlip = false,
  flipInterval = 5000,
  className,
  cardClassName,
  onSwipe,
}: {
  items: StackCard[];
  offset?: number;
  scaleFactor?: number;
  autoFlip?: boolean;
  flipInterval?: number;
  className?: string;
  cardClassName?: string;
  onSwipe?: (side: "yes" | "no") => void;
}) => {
  const CARD_OFFSET = offset ?? 12;
  const SCALE_FACTOR = scaleFactor ?? 0.05;
  const [cards, setCards] = useState(items);

  useEffect(() => {
    setCards(items);
  }, [items]);

  useEffect(() => {
    if (!autoFlip || cards.length < 2) return;
    const id = setInterval(() => {
      setCards((prev) => {
        const next = [...prev];
        next.unshift(next.pop()!);
        return next;
      });
    }, flipInterval);
    return () => clearInterval(id);
  }, [autoFlip, flipInterval, cards.length]);

  if (cards.length === 0) return null;

  return (
    <div className={cn("relative h-[32rem] w-full max-w-md", className)}>
      {cards.map((card, index) => {
        const isTop = index === 0;
        return (
          <motion.div
            key={card.id}
            drag={isTop && onSwipe ? "x" : false}
            dragElastic={0.9}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (!onSwipe) return;
              if (info.offset.x > 80) onSwipe("yes");
              else if (info.offset.x < -80) onSwipe("no");
            }}
            className={cn(
              "absolute inset-x-0 top-0 flex h-[30rem] flex-col justify-between rounded-3xl border p-6 shadow-xl",
              cardClassName,
            )}
            style={{ transformOrigin: "top center" }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
          >
            <div className="min-h-0 flex-1">{card.content}</div>
            {card.name || card.designation ? (
              <div>
                {card.name ? <p className="font-medium">{card.name}</p> : null}
                {card.designation ? (
                  <p className="text-sm opacity-70">{card.designation}</p>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
};
