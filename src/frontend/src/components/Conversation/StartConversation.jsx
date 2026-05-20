import React, { useState, useEffect } from 'react'
import SearchBox from './SearchBox/SearchBox'

function StartConversation({ user }) {
  const [animate, setAnimate] = useState(false)

  // Trigger the animation as soon as the component mounts
  useEffect(() => {
    // A micro-timeout ensures the initial hidden state is registered by the browser DOM
    const timer = setTimeout(() => setAnimate(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className='text-left rounded-md p-10 w-full max-w-3xl select-none'>
        
        {/* 1. Greeting (Slides up first) */}
        <h1 className={`text-2xl mb-2 transition-all duration-700 ease-out transform
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        > 
          Hi {user?.displayName || 'there'} 
        </h1>

        {/* 2. Main Question (Slides up second - delay-150) */}
        <p className={`text-4xl font-semibold mb-10 transition-all duration-700 ease-out transform delay-150
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        > 
          Where should we start? 
        </p>

        {/* 3. Search Box (Slides up third - delay-300) */}
        <div className={`transition-all duration-700 ease-out transform delay-300
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <SearchBox />
        </div>

        {/* 4. Disclaimer Footer (Slides up last - delay-500) */}
        <p className={`text-xs text-center mt-6 text-gray-400 transition-all duration-1000 ease-out transform delay-500
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          LegalEase is AI and can make mistakes.
        </p>
    </div>
  )
}

export default StartConversation