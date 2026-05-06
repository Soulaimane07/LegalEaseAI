import NavbarLanding from '../../components/Navbar/NavbarLanding'
import { Footer } from '../../components/FooterCTA'
import { AiOutlineProduct } from 'react-icons/ai';
import { FiLayers } from 'react-icons/fi';
import { GoCodeSquare } from 'react-icons/go';
import { useState, useEffect, useRef } from 'react';

// --- Space Background Canvas Component ---
function SpaceBackground({ containerRef, selected, isPageLoaded }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationFrameRef = useRef(null);

    // Mathematical shape generators based on coordinates relative to a center point
    const generateShapeTargets = (shapeId, count, centerX, centerY) => {
        const targets = [];
        const size = 330; 

        switch (shapeId) {
            case 1: // "Professional" -> Grid with 3 regular squares and 1 rotated diamond square
                const boxSize = size * 0.45;    // Size of each individual square bounding region
                const gap = size * 0.15;        // Distance between the squares
                
                // Calculate center offsets for the 4 grid positions
                const leftX = centerX - boxSize/2 - gap/2;
                const rightX = centerX + boxSize/2 + gap/2;
                const topY = centerY - boxSize/2 - gap/2;
                const bottomY = centerY + boxSize/2 + gap/2;

                for (let i = 0; i < count; i++) {
                    const quadrant = i % 4;
                    const t = Math.random(); // Linear interpolation value along a perimeter
                    const side = Math.floor(Math.random() * 4); // Pick one of the 4 edges of a square
                    
                    let x = 0, y = 0;

                    if (quadrant === 1) {
                        // --- Top Right Quadrant: Rotated Diamond Square ---
                        const radius = boxSize * 0.65; // Scale radius slightly for structural symmetry
                        
                        // Coordinates of the 4 points of the diamond
                        const pTop = { x: rightX, y: topY - radius };
                        const pRight = { x: rightX + radius, y: topY };
                        const pBottom = { x: rightX, y: topY + radius };
                        const pLeft = { x: rightX - radius, y: topY };

                        if (side === 0) { x = pTop.x + (pRight.x - pTop.x) * t; y = pTop.y + (pRight.y - pTop.y) * t; }
                        else if (side === 1) { x = pRight.x + (pBottom.x - pRight.x) * t; y = pRight.y + (pBottom.y - pRight.y) * t; }
                        else if (side === 2) { x = pBottom.x + (pLeft.x - pBottom.x) * t; y = pBottom.y + (pLeft.y - pBottom.y) * t; }
                        else { x = pLeft.x + (pTop.x - pLeft.x) * t; y = pLeft.y + (pTop.y - pLeft.y) * t; }

                    } else {
                        // --- Top Left, Bottom Left, and Bottom Right Quadrants: Standard Squares ---
                        let qcx = leftX, qcy = topY; // Default to Top Left (quadrant === 0)
                        
                        if (quadrant === 2) { qcx = leftX; qcy = bottomY; }      // Bottom Left
                        if (quadrant === 3) { qcx = rightX; qcy = bottomY; }     // Bottom Right

                        const half = boxSize / 2;
                        // Standard bounding box line assembly logic
                        if (side === 0) { x = qcx - half + boxSize * t; y = qcy - half; } // Top Edge
                        else if (side === 1) { x = qcx + half; y = qcy - half + boxSize * t; } // Right Edge
                        else if (side === 2) { x = qcx - half + boxSize * t; y = qcy + half; } // Bottom Edge
                        else { x = qcx - half; y = qcy - half + boxSize * t; } // Left Edge
                    }

                    targets.push({ 
                        x: x + (Math.random() - 0.5) * 6, 
                        y: y + (Math.random() - 0.5) * 6 
                    });
                }
                break;

            case 2: // "Frontend" -> FiLayers (1 full top diamond + 2 bottom layer outlines)
                const layerWidth = size * 1.3;  
                const layerHeight = size * 0.45; 
                const vOffset = size * 0.32; // Vertical distance between layers

                for (let i = 0; i < count; i++) {
                    const segment = i % 10; 
                    const t = Math.random();
                    let x = 0, y = 0;

                    if (segment < 4) {
                        // --- 1. Top Layer: Full Closed Diamond Outline ---
                        const side = segment % 4;
                        const topX = centerX;
                        const topY = centerY - vOffset;

                        const pTop = { x: topX, y: topY - layerHeight };
                        const pRight = { x: topX + layerWidth / 2, y: topY };
                        const pBottom = { x: topX, y: topY + layerHeight };
                        const pLeft = { x: topX - layerWidth / 2, y: topY };

                        if (side === 0) { x = pTop.x + (pRight.x - pTop.x) * t; y = pTop.y + (pRight.y - pTop.y) * t; }
                        else if (side === 1) { x = pRight.x + (pBottom.x - pRight.x) * t; y = pRight.y + (pBottom.y - pRight.y) * t; }
                        else if (side === 2) { x = pBottom.x + (pLeft.x - pBottom.x) * t; y = pBottom.y + (pLeft.y - pBottom.y) * t; }
                        else { x = pLeft.x + (pTop.x - pLeft.x) * t; y = pLeft.y + (pTop.y - pLeft.y) * t; }

                    } else if (segment < 7) {
                        // --- 2. Middle Layer: Lower Open V-Wing Outline ---
                        const side = (segment - 4) % 2; 
                        const midY = centerY;

                        const pLeft = { x: centerX - layerWidth / 2, y: midY };
                        const pBottom = { x: centerX, y: midY + layerHeight };
                        const pRight = { x: centerX + layerWidth / 2, y: midY };

                        if (side === 0) { x = pLeft.x + (pBottom.x - pLeft.x) * t; y = pLeft.y + (pBottom.y - pLeft.y) * t; }
                        else { x = pBottom.x + (pRight.x - pBottom.x) * t; y = pBottom.y + (pRight.y - pBottom.y) * t; }

                    } else {
                        // --- 3. Bottom Layer: Lowest Open V-Wing Outline ---
                        const side = (segment - 7) % 2;
                        const botY = centerY + vOffset;

                        const pLeft = { x: centerX - layerWidth / 2, y: botY };
                        const pBottom = { x: centerX, y: botY + layerHeight };
                        const pRight = { x: centerX + layerWidth / 2, y: botY };

                        if (side === 0) { x = pLeft.x + (pBottom.x - pLeft.x) * t; y = pLeft.y + (pBottom.y - pLeft.y) * t; }
                        else { x = pBottom.x + (pRight.x - pBottom.x) * t; y = pBottom.y + (pRight.y - pBottom.y) * t; }
                    }

                    targets.push({ 
                        x: x + (Math.random() - 0.5) * 5, 
                        y: y + (Math.random() - 0.5) * 5 
                    });
                }
                break;

            case 3: // "Backend" -> GoCodeSquare (1 outer square border + < > inner brackets)
                const squareSize = size * 1.1; 
                const bracketWidth = size * 0.25;
                const bracketHeight = size * 0.35;
                const bracketOffset = size * 0.22; // Horizontal separation from center

                for (let i = 0; i < count; i++) {
                    const segment = i % 8; 
                    const t = Math.random();
                    let x = 0, y = 0;

                    if (segment < 4) {
                        // --- 1. Outer Square Frame ---
                        const half = squareSize / 2;
                        if (segment === 0) { x = centerX - half + squareSize * t; y = centerY - half; } // Top
                        else if (segment === 1) { x = centerX + half; y = centerY - half + squareSize * t; } // Right
                        else if (segment === 2) { x = centerX - half + squareSize * t; y = centerY + half; } // Bottom
                        else { x = centerX - half; y = centerY - half + squareSize * t; } // Left

                    } else if (segment < 6) {
                        // --- 2. Left Bracket "<" ---
                        const isTopHalf = segment === 4;
                        const startX = centerX - bracketOffset;
                        const startY = centerY;

                        if (isTopHalf) {
                            x = startX + bracketWidth * t;
                            y = startY - bracketHeight * t;
                        } else {
                            x = startX + bracketWidth * t;
                            y = startY + bracketHeight * t;
                        }

                    } else {
                        // --- 3. Right Bracket ">" ---
                        const isTopHalf = segment === 6;
                        const startX = centerX + bracketOffset;
                        const startY = centerY;

                        if (isTopHalf) {
                            x = startX - bracketWidth * t;
                            y = startY - bracketHeight * t;
                        } else {
                            x = startX - bracketWidth * t;
                            y = startY + bracketHeight * t;
                        }
                    }

                    targets.push({ 
                        x: x + (Math.random() - 0.5) * 5, 
                        y: y + (Math.random() - 0.5) * 5 
                    });
                }
                break;

            default:
                for (let i = 0; i < count; i++) {
                    targets.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight });
                }
        }
        return targets;
    };

    const getSafeAmbientPosition = (width, height, centerX, centerY, safeRadius) => {
        let x, y, distance;
        do {
            x = Math.random() * width;
            y = Math.random() * height;
            const dx = x - centerX;
            const dy = y - centerY;
            distance = Math.sqrt(dx * dx + dy * dy);
        } while (distance < safeRadius);
        
        return { x, y };
    };

    // Instantiate baseline particles structure
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const cx = canvas.width / 2;
        const cy = (canvas.height / 2) - 40;
        const keepOutRadius = 380; 

        const colors = ['59, 130, 246', '234, 179, 8', '249, 115, 22'];
        const morphCount = 500; 
        const ambientCount = 800; 
        const arr = [];

        // 1. Generate Interactive Morphing Particles
        for (let i = 0; i < morphCount; i++) {
            arr.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                targetX: null,
                targetY: null,
                radius: Math.random() * 1.6 + 0.8,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -(Math.random() * 0.4 + 0.1),
                opacity: Math.random() * 0.7 + 0.3,
                baseColor: colors[i % colors.length],
                angleOffset: Math.random() * Math.PI * 2,
                floatSpeed: Math.random() * 0.02 + 0.015,
                isAmbient: false
            });
        }

        // 2. Generate Dark Ambient Space Particles
        for (let i = 0; i < ambientCount; i++) {
            const safePos = getSafeAmbientPosition(canvas.width, canvas.height, cx, cy, keepOutRadius);

            arr.push({
                x: safePos.x,
                y: safePos.y,
                targetX: null,
                targetY: null,
                radius: Math.random() * 0.9 + 0.3, 
                speedX: (Math.random() - 0.5) * 0.3, 
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.4 + 0.15, 
                baseColor: '10, 10, 10', 
                angleOffset: Math.random() * Math.PI * 2,
                floatSpeed: Math.random() * 0.01,
                isAmbient: true
            });
        }

        particlesRef.current = arr;
    }, [containerRef]);

    // Handle structural state transformations on dynamic updates
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || particlesRef.current.length === 0) return;

        const cx = canvas.width / 2;
        const cy = (canvas.height / 2) - 40; 

        const morphers = particlesRef.current.filter(p => !p.isAmbient);
        const targets = generateShapeTargets(selected, morphers.length, cx, cy);

        let targetIdx = 0;
        particlesRef.current.forEach((p) => {
            if (!p.isAmbient) {
                if (targets[targetIdx]) {
                    p.targetX = targets[targetIdx].x;
                    p.targetY = targets[targetIdx].y;
                }
                targetIdx++;
            }
        });
    }, [selected]);

    // Core Animation Engine Track
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let time = 0;

        const resizeCanvas = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }
        };
        window.addEventListener('resize', resizeCanvas);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.03; 

            const cx = canvas.width / 2;
            const cy = (canvas.height / 2) - 40;
            const keepOutRadius = 380; 

            particlesRef.current.forEach((p) => {
                if (!p.isAmbient && p.targetX !== null && p.targetY !== null) {
                    const floatX = Math.sin(time * p.floatSpeed * 2 + p.angleOffset) * 12;
                    const floatY = Math.cos(time * p.floatSpeed * 2 + p.angleOffset) * 12;

                    p.x += ((p.targetX + floatX) - p.x) * 0.06;
                    p.y += ((p.targetY + floatY) - p.y) * 0.06;
                } else {
                    p.x += p.speedX + Math.sin(time * p.floatSpeed + p.angleOffset) * 0.08;
                    p.y += p.speedY + Math.cos(time * p.floatSpeed + p.angleOffset) * 0.08;

                    const dx = p.x - cx;
                    const dy = p.y - cy;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < keepOutRadius) {
                        const angle = Math.atan2(dy, dx);
                        p.x = cx + Math.cos(angle) * (keepOutRadius + Math.random() * 20);
                        p.y = cy + Math.sin(angle) * (keepOutRadius + Math.random() * 20);
                        p.speedX *= -1;
                        p.speedY *= -1;
                    }

                    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                        const safePos = getSafeAmbientPosition(canvas.width, canvas.height, cx, cy, keepOutRadius);
                        p.x = safePos.x;
                        p.y = safePos.y;
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                
                // Track page loaded state instead of single keyword typing logic
                if (!p.isAmbient) {
                    ctx.fillStyle = `rgba(${p.baseColor}, ${isPageLoaded ? p.opacity : 0})`;
                } else {
                    ctx.fillStyle = `rgba(${p.baseColor}, ${p.opacity})`;
                }
                
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [containerRef, isPageLoaded]); 

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-0" 
        />
    );
}

// --- Main Page Component ---
function Usecases() {
    const [selected, setSelected] = useState(1);
    const [displayedTitle, setDisplayedTitle] = useState("");
    const [isInitialPageLoaded, setIsInitialPageLoaded] = useState(false); // Keeps list & paragraph visible after mount
    const mainContainerRef = useRef(null);

    const list = [
        { id: 1, title: "Professional", icon: <AiOutlineProduct size={21} /> },
        { id: 2, title: "Frontend", icon: <FiLayers size={21} /> },
        { id: 3, title: "Backend", icon: <GoCodeSquare size={21} /> }
    ];

    const currentTitle = list[selected - 1]?.title || "";

    // Typewriter effect handler (still fires on select change)
    useEffect(() => {
        setDisplayedTitle(""); 
        let timeoutId;

        const typeLetter = (index) => {
            if (index < currentTitle.length) {
                setDisplayedTitle((prev) => prev + currentTitle.charAt(index));
                
                timeoutId = setTimeout(() => {
                    typeLetter(index + 1);
                }, 60);
            } else {
                // Confirm initial load completion once the very first word finishes typing
                setIsInitialPageLoaded(true);
            }
        };

        typeLetter(0);

        return () => clearTimeout(timeoutId);
    }, [selected, currentTitle]);

    return (
        <div className="min-h-screen bg-bg font-sans relative overflow-x-hidden">
            <div className="noise-overlay" />
            <NavbarLanding />
            
            <main ref={mainContainerRef} className='min-h-screen pt-20 relative overflow-hidden'>
                <SpaceBackground containerRef={mainContainerRef} selected={selected} isPageLoaded={isInitialPageLoaded} />

                <div className="relative z-10">
                    <div className='mt-20 mb-40 flex flex-col items-center justify-center space-y-5'>
                        <h1 className='text-5xl font-semibold text-center mt-5 mb-6 min-h-[3rem] flex items-center'> 
                            {displayedTitle}
                            <span className="inline-block w-[4px] h-[2.8rem] align-middle ml-2 animate-pulse bg-gradient-to-b from-blue-500 via-yellow-500 to-orange-500 rounded-full" />
                        </h1>
                        
                        <p className={`w-1/2 px-20 text-center mx-auto text-gray-400 transition-all duration-700 ease-out transform ${
                            isInitialPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptas deleniti laborum quasi error, quibusdam autem ullam quas perferendis nemo dolorem pariatur earum hic? Dignissimos itaque veritatis minima exercitationem nostrum.
                        </p>
                    </div>

                    <div className={`flex space-x-6 items-center justify-center text-center pb-20 transition-all duration-700 delay-100 ease-out transform ${
                        isInitialPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                        {list.map((item) => (
                            <div 
                                onClick={() => setSelected(item.id)} 
                                key={item.id} 
                                className={`NavItem backdrop-blur-md space-x-4 bg-white/80 bg-opacity-30 backdrop-blur-md p-3 px-8 rounded-full flex w-fit mb-3 items-center cursor-pointer hover:text-gray-800 border transition-all duration-300 ${
                                    selected === item.id 
                                        ? 'text-gray-800 border-gray-400 shadow-sm scale-105' 
                                        : 'text-gray-500 border-gray-200/50 hover:scale-102'
                                }`}
                            >
                                {item.icon}
                                <span className="text-lg font-medium">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    )
}

export default Usecases;