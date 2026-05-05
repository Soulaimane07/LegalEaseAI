import React from 'react'
import { IoIosSearch } from "react-icons/io";

function SearchBox() {
  return (
    <div className='flex shadow items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6'>
        <input type="text" className='w-full outline-none' placeholder="Ask LegalEase..." />
        <IoIosSearch size={20} />
    </div>
  )
}

export default SearchBox