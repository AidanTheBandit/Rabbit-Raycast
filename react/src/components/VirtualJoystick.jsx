import React, { useRef, useState, useEffect } from 'react';
import './VirtualJoystick.css';

const VirtualJoystick = ({ onMove, size = 120 }) => {
  const joystickRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [maxDistance] = useState(size / 2 - 20); // Maximum distance from center

  useEffect(() => {
    const updateCenter = () => {
      if (joystickRef.current) {
        const rect = joystickRef.current.getBoundingClientRect();
        setCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, []);

  const calculateStickPosition = (clientX, clientY) => {
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= maxDistance) {
      return { x: dx, y: dy };
    } else {
      // Clamp to maximum distance
      const ratio = maxDistance / distance;
      return { x: dx * ratio, y: dy * ratio };
    }
  };

  const handleStart = (clientX, clientY) => {
    console.log('VirtualJoystick: handleStart called', clientX, clientY);
    setIsDragging(true);
    const newPosition = calculateStickPosition(clientX, clientY);
    setStickPosition(newPosition);
    sendMoveCommand(newPosition);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const newPosition = calculateStickPosition(clientX, clientY);
    setStickPosition(newPosition);
    sendMoveCommand(newPosition);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setStickPosition({ x: 0, y: 0 });
    sendMoveCommand({ x: 0, y: 0 });
  };

  const sendMoveCommand = (position) => {
    // Normalize position to -1 to 1 range
    const normalizedX = position.x / maxDistance;
    const normalizedY = position.y / maxDistance;

    const movement = {
      x: normalizedX,
      y: normalizedY,
      magnitude: Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
    };

    console.log('VirtualJoystick: sending movement', movement);

    if (onMove) {
      onMove(movement);
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleEnd();
  };

  // Add global mouse move and up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={joystickRef}
      className="virtual-joystick"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="joystick-base">
        <div
          className="joystick-stick"
          style={{
            transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)`
          }}
        />
      </div>
    </div>
  );
};

export default VirtualJoystick;
