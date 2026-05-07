import React, { useState, useEffect, useRef } from 'react';
import { FaPlay } from "react-icons/fa";

function Demo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Controls the width
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Cursor Following Logic
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // 2. Intersection Observer for both Video and Expansion
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsExpanded(true);
          videoRef.current.play();
        } else {
          // Optional: shrink it back when scrolling away
          setIsExpanded(false); 
          videoRef.current.pause();
        }
      },
      { threshold: 0.3 } // Starts expanding when 20% of the div is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  return (
    <div 
      id='demo'
      ref={containerRef}
      className='min-h-screen flex items-center justify-center bg-white  relative overflow-hidden cursor-pointer'
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div 
        className={`relative m-3 rounded-4xl h-screen bg-black overflow-hidden  transition-all duration-[1200ms] ease-in-out flex items-center justify-center
          ${isExpanded ? 'w-full' : 'w-2/3'}
        `}
      >
        <video 
          ref={videoRef}
          src="/videos/welcome.mp4" 
          muted 
          loop 
          playsInline
          className="w-2/3  opacity-80"
        />

        {/* Floating Play Button */}
        <button 
          className="btn-primary absolute pointer-events-none z-50 bg-white text-black rounded-full px-8 py-4 flex items-center gap-3 transition-opacity duration-300 ease-out"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`, 
            transform: 'translate(-50%, -50%)', 
            opacity: isVisible ? 1 : 0,
            willChange: 'left, top'
          }}
        > 
          <FaPlay size={14} />
          <span className="font-semibold"> Play intro </span> 
        </button>
      </div>
    </div>
  );
}

export default Demo;