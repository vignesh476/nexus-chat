import { useRef, useCallback } from 'react';

const useSwipeToReply = (onReply, options = {}) => {
  const {
    threshold = 60,
    maxSwipe = 100,
    hapticFeedback = true,
  } = options;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const elementRef = useRef(null);

  const triggerHaptic = useCallback((intensity = 10) => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(intensity);
    }
  }, [hapticFeedback]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!elementRef.current) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 10) {
      isSwiping.current = true;
      
      // Limit swipe distance
      const swipeDistance = Math.min(deltaX, maxSwipe);
      
      // Apply transform
      elementRef.current.style.transform = `translateX(${swipeDistance}px)`;
      elementRef.current.style.transition = 'none';
      
      // Trigger haptic at threshold
      if (swipeDistance >= threshold && !elementRef.current.dataset.hapticTriggered) {
        triggerHaptic(15);
        elementRef.current.dataset.hapticTriggered = 'true';
      }
      
      // Prevent scrolling
      e.preventDefault();
    }
  }, [threshold, maxSwipe, triggerHaptic]);

  const handleTouchEnd = useCallback((e) => {
    if (!elementRef.current || !isSwiping.current) return;

    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;

    // Reset transform with animation
    elementRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    elementRef.current.style.transform = 'translateX(0)';
    
    // Clear haptic flag
    delete elementRef.current.dataset.hapticTriggered;

    // Trigger reply if threshold met
    if (deltaX >= threshold) {
      triggerHaptic(20);
      onReply();
    }

    isSwiping.current = false;
  }, [threshold, onReply, triggerHaptic]);

  return {
    ref: elementRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

export default useSwipeToReply;
