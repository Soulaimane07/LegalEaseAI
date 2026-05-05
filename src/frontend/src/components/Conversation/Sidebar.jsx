import React from 'react'
import { VscKebabVertical } from "react-icons/vsc";


function Sidebar() {
  const list = [
    { name: 'Conversation 1', icon: 'plus' },
    { name: 'Conversation 2', icon: 'save' },
    { name: 'Conversation 3', icon: 'save' },
  ]

  return (
    <div className='bg-white rounded-md  sticky top-10 w-80 p-2 hidden lg:block'>
        <ul className='space-y-1'>
            {list.map((item) => (
                <li key={item.name} className='flex ConversationItem font-medium items-center gap-3 text-gray-700 cursor-pointer hover:bg-gray-100/80 rounded-md px-3 py-3 transition-colors duration-200'>
                    <span className='text-md'>{item.name}</span>

                    <button  className='ml-auto cursor-pointer opacity-50 hover:opacity-100 justify-content flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200'>
                      <VscKebabVertical size={20} />
                    </button>
                </li>
            ))}
        </ul>
    </div>
  )
}

export default Sidebar