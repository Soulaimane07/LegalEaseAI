import React, { useState, useEffect, useRef } from 'react';

function useTypewriter(text, speed = 40, delay = 400, onComplete, isActive = true) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Only run the timeout if the component is "active" (in view)
    if (!isActive) return;

    const startTimeout = setTimeout(() => setStarted(true), delay);
    
    if (started && displayedText.length < text.length) {
      const nextCharTimeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(nextCharTimeout);
    } else if (started && displayedText.length === text.length) {
      if (onComplete) onComplete();
    }

    return () => clearTimeout(startTimeout);
  }, [displayedText, text, speed, started, delay, onComplete, isActive]);

  return displayedText;
}

function Features() {
    const list = [
        {
            title: "An Agent-First Experience",
            video: "/videos/1.mp4",
            desc: "Manage multiple agents at the same time, across any workspace, from one central mission control view.",
            color: "hover:border-blue-500/50"
        },
        {
            title: "Gemini 2.5 Pro",
            video: "/videos/2.mp4",
            desc: "Harness Google's latest model for superior reasoning in multi-language contract interpretation (French/Arabic).",
            color: "hover:border-amber-500/50"
        },
        {
            title: "Clause Tracking",
            video: "/videos/3.mp4",
            desc: "Seamlessly track modifications across versions of documents, syncing directly with your legal workspace.",
            color: "hover:border-red-500/50"
        },
        {
            title: "Team Collaboration",
            video: "/videos/4.mp4",
            desc: "Share agent sessions with partners or clients in real-time, making complex legal projects collaborative.",
            color: "hover:border-blue-400/50"
        }
    ];

    const [isTypingDone, setIsTypingDone] = useState(false);
    const [hasStartedTyping, setHasStartedTyping] = useState(false);
    const sectionRef = useRef(null);
    
    const fullText = "LegalEase AI is our agentic development platform, allowing anyone to build in the agent-first era.";
    
    // Pass hasStartedTyping as the 'isActive' trigger
    const typedText = useTypewriter(fullText, 35, 500, () => {
        setIsTypingDone(false);
    }, hasStartedTyping);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasStartedTyping(true);
                }
            },
            { threshold: 0.3 } // Triggers when 30% of the header is visible
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) observer.unobserve(sectionRef.current);
        };
    }, []);

    return (
        <section id='features' className='max-w-7xl mx-auto px-6 py-24'>
            {/* Typewriter Header Section */}
            <div ref={sectionRef} className='min-h-[60vh] pt-8 pb-40 px-14 flex items-center text-left mb-20'>
                <h1 className="text-5xl font-semibold  font-display leading-[1.05] tracking-tight max-w-4xl">
                    {typedText}
                    {!isTypingDone && (
                        <span className="inline-block w-[5px] h-[3.5rem] align-middle ml-2 animate-pulse bg-gradient-to-b from-blue-600 via-amber-500 to-red-600 rounded-full" />
                    )}
                </h1>
            </div>

            {/* Features Grid */}
            <div className='flex flex-col px-8 gap-'>
                {list.map((item, index) => (
                    <div 
                        key={index} 
                        className={`flex flex-row justify-between items-center p-8 py-3 min-h-[18rem] ${item.color}`}
                    >
                        <div className='w-1/3'>
                            <h1 className='text-4xl font-semibold mb-4 text-gray-900 group-hover:text-black transition-colors'>
                                {item.title}
                            </h1>
                            <p className='text-gray-500 text-lg opacity-90 line-height-[1.2] leading-relaxed group-hover:text-gray-700 transition-colors '>
                                {item.desc}
                            </p>
                        </div>
                        <div className='bg-gray-100 h-[80vh] w-4/8 rounded-3xl overflow-hidden shadow-inner border border-gray-200/50'> 
                            <video 
                                src={item.video} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className='w-full h-full object-cover opacity-90 transition-opacity duration-500 hover:opacity-100'
                            /> 
                        </div>                    
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Features;