'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface AnimatedStepContainerProps {
  isCollapsed: boolean;
  collapsedContent: React.ReactNode;
  expandedContent: React.ReactNode;
}

/**
 * AnimatedStepContainer - Provides smooth height animation when transitioning
 * from expanded step content to collapsed summary.
 *
 * Uses height animation for buttery-smooth transitions.
 * Respects reduced motion preferences.
 */
export const AnimatedStepContainer: React.FC<AnimatedStepContainerProps> = ({
  isCollapsed,
  collapsedContent,
  expandedContent,
}) => {
  const [showCollapsed, setShowCollapsed] = useState(isCollapsed);
  const [isAnimating, setIsAnimating] = useState(false);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  const containerRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use layout effect to measure heights before paint
  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      setShowCollapsed(isCollapsed);
      setHeight('auto');
      return;
    }

    if (isCollapsed && !showCollapsed) {
      // Collapsing: expanded -> collapsed
      setIsAnimating(true);

      // Get current expanded height
      const expandedHeight = expandedRef.current?.offsetHeight || 0;
      setHeight(expandedHeight);

      // Force reflow, then animate to collapsed height
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const collapsedHeight = collapsedRef.current?.offsetHeight || 56;
          setHeight(collapsedHeight);
        });
      });

      // After animation, switch content
      const timer = setTimeout(() => {
        setShowCollapsed(true);
        setIsAnimating(false);
        setHeight('auto');
      }, 350);

      return () => clearTimeout(timer);
    } else if (!isCollapsed && showCollapsed) {
      // Expanding: collapsed -> expanded (show immediately)
      setShowCollapsed(false);
      setHeight('auto');
    }
  }, [isCollapsed, showCollapsed, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden transition-[height] duration-350 ease-out motion-reduce:transition-none"
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        transitionDuration: isAnimating ? '350ms' : '0ms',
      }}
    >
      {/* Hidden collapsed content for measurement */}
      {!showCollapsed && (
        <div ref={collapsedRef} className="absolute opacity-0 pointer-events-none" aria-hidden>
          {collapsedContent}
        </div>
      )}

      {/* Visible content */}
      <div
        ref={showCollapsed ? undefined : expandedRef}
        className={`transition-opacity duration-200 ease-out ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        } motion-reduce:transition-none`}
      >
        {showCollapsed ? collapsedContent : expandedContent}
      </div>
    </div>
  );
};
