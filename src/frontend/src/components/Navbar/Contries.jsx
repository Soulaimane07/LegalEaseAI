import React, {useState, useEffect} from 'react'
import { IoIosGlobe } from 'react-icons/io';

function Contries() {
    const [selectedCountry, setSelectedCountry] = useState({ name: 'France', code: 'FR', img: '/images/france.svg' });
    const [open, setOpen] = useState(false);

    const countries = [
        { name: 'France', code: 'FR', img: '/images/france.svg' },
        { name: 'Morocco', code: 'MA', img: '/images/morocco.png' }
    ];

    useEffect(() => {
        const detectCountry = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                
                // data.country_code will return 'MA' for Morocco or 'FR' for France
                const matched = countries.find(c => c.code === data.country);
                if (matched) setSelectedCountry(matched);
            } catch (error) {
                console.error("Location detection failed:", error);
            }
        };
        detectCountry();
    }, []);

  return (
    <div className="relative flex group">
        <button className='flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer p-2'>
            <IoIosGlobe size={24} />
        </button>

        {/* Dropdown Menu */}
        <div className='absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible transition-all duration-300 transform translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 overflow-hidden'>
            <h2 className="text-[10px] pt-4 font-bold text-center text-gray-400 uppercase tracking-widest mb-2"> 
                Jurisdiction
            </h2>
            <ul>
                {countries.map((c) => (
                    <li 
                        key={c.code}
                        onClick={() => setSelectedCountry(c)}
                        className={`flex px-4 py-3 items-center gap-3 text-sm cursor-pointer transition-all
                            ${selectedCountry.code === c.code 
                                ? 'bg-gray-100 text-gray-800 font-medium' 
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        <img src={c.img} className='w-5 shadow-sm' alt={c.name} />
                        {c.name}
                        {selectedCountry.code === c.code && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-600" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  )
}

export default Contries