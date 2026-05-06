import React from 'react';
import { VscKebabVertical } from "react-icons/vsc";
import { FaRegEdit } from "react-icons/fa";

function Sidebar({ conversations = [], currentConversation, setConversation }) {
  return (
    <div className='bg-gray-50 border border-gray-200/80 rounded-xl sticky top-6 w-80 p-3 hidden lg:flex flex-col h-full'>
      
      <button 
        className='flex items-center mb-2 justify-between  hover:border-gray-300 hover:bg-gray-50 rounded-lg py-2.5 px-4 text-gray-500 hover:text-gray-800 font-semibold w-full cursor-pointer hover:bg-gray-200/40 transition-all duration-200 shrink-0 group'
        onClick={() => setConversation(null)}
      >
        <div className='flex items-center gap-2.5 text-sm'>
          <FaRegEdit className=" group-hover:text-gray-800 transition-colors" />
          <span>New Chat</span>
        </div>
      </button>

      {/* Conversations List Container */}
      <div className='overflow-y-auto flex-1 pr-1 space-y-4 custom-scrollbar'>
        <div>
          <ul className='space-y-1'>
            {conversations.map((item, index) => {
              return (
                <li 
                  key={item.id || `${item.title}-${index}`} 
                  className={`flex group mb-1.5 font-medium items-center gap-2.5 text-sm cursor-pointer rounded-lg py-2 px-3 transition-all duration-200 relative
                      text-gray-500 hover:bg-gray-200/40 hover:text-gray-900
                      ${currentConversation?.title === item.title ? 'bg-gray-200/40 text-gray-900' : ''}
                    `}
                  onClick={() => setConversation(item)}  
                >
                  <span className='truncate pr-6'>{item.title}</span>

                  <button className='absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-300/50 transition-all duration-150'
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents selecting the chat when clicking the kebab menu
                    }}
                  >
                    <VscKebabVertical size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;