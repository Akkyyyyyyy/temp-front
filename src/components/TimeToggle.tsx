import { useRef, useEffect, useState } from "react";

const timeViews = ['week', 'month'] as const;
type TimeView = typeof timeViews[number];

export default function TimeToggle() {
  const [timeView, setTimeView] = useState<TimeView>('week');
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Find the button for the selected view
    const btn = containerRef.current.querySelector(
      `button[data-view="${timeView}"]`
    ) as HTMLElement | null;

    if (btn) {
      setIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      });
    }
  }, [timeView]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-sm select-none"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-in-out z-0"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      {timeViews.map((view) => (
        <button
          key={view}
          data-view={view}
          onClick={() => setTimeView(view)}
          className={`relative z-10 capitalize px-4 py-1.5 text-sm rounded-full transition-colors duration-200
            ${timeView === view ? 'text-primary-foreground' : 'text-muted-foreground'}
          `}
          // Remove hover styles on buttons themselves
          onMouseEnter={(e) => e.currentTarget.style.color = ''}
          onMouseLeave={(e) => e.currentTarget.style.color = ''}
          type="button"
        >
          {view}
        </button>
      ))}
    </div>
  );
}
