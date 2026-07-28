import { useRef } from "react";

/**
 * Lets a horizontally-scrollable row (chip filters, tabs, etc.) be dragged with the
 * mouse like a slider — on mobile it already scrolls fine via native touch, but on
 * desktop the only way to scroll it otherwise is the wheel/trackpad.
 *
 * Spread the returned props onto the scroll container. If it contains clickable
 * children (buttons), a drag gesture won't accidentally fire their click.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const drag = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false });

  const onMouseDown = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    drag.current.isDown = true;
    drag.current.moved = false;
    drag.current.startX = e.pageX;
    drag.current.startScrollLeft = el.scrollLeft;
  };

  const stopDragging = () => {
    drag.current.isDown = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !drag.current.isDown) return;
    e.preventDefault();
    const walk = e.pageX - drag.current.startX;
    if (Math.abs(walk) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.startScrollLeft - walk;
  };

  // Swallow the click that follows a drag so it doesn't also select whatever
  // chip/button the cursor happened to land on.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    ref,
    onMouseDown,
    onMouseUp: stopDragging,
    onMouseLeave: stopDragging,
    onMouseMove,
    onClickCapture,
    className: "cursor-grab active:cursor-grabbing select-none",
  };
}
