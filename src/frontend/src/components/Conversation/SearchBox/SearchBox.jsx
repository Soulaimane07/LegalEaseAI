import React, { useState } from 'react'
import { IoIosSearch } from "react-icons/io";
import { auth } from "./firebase"; 

function SearchBox({handleSubmit, setDraft}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearchSubmit = async (e) => {
    if (e.key !== 'Enter' || loading) return;

    setLoading(true);
    handleSubmit(e);
  };

  return (
    <div className={`flex shadow items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <input 
          type="text" 
          className='w-full outline-none' 
          placeholder={loading ? "Processing entry..." : "Ask LegalEase..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDraft(e.target.value);
          }}
          onKeyDown={handleSearchSubmit} 
          disabled={loading}
        />
        <IoIosSearch size={20} className={loading ? "animate-pulse text-blue-500" : "text-gray-400"} />
    </div>
  )
}

export default SearchBox;