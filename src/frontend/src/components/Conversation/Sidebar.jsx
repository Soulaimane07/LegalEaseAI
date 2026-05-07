import React, { useState, useEffect, useRef } from 'react';
import { VscKebabVertical } from "react-icons/vsc";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GoPencil } from "react-icons/go";

import { useSelector, useDispatch } from 'react-redux';
import { deleteChat, renameChat, setConversation } from '../../redux/slices/chatSlice';

function Sidebar() {
  const dispatch = useDispatch();
  
  // Accessing Global State
  const { conversations, currentConversation } = useSelector((state) => state.chat);
  
  // UI Local States
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Outside click handler to close kebab menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-focus logic for renaming
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const toggleMenu = (e, id) => {
    e.stopPropagation(); 
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- REDUX CONNECTED DELETE PIPELINE ---
  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm("Are you sure you want to permanently delete this chat?")) {
      dispatch(deleteChat(id));
    }
  };

  const submitRename = (id, originalTitle) => {
    const cleanedTitle = editTitle.trim();
    setEditingId(null);
    
    if (cleanedTitle && cleanedTitle !== originalTitle) {
      dispatch(renameChat({ chatId: id, title: cleanedTitle }));
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-200/80 rounded-xl sticky top-6 w-80 p-3 hidden lg:flex flex-col h-full select-none transition-opacity ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
      
      <button 
        className='flex items-center mb-4 justify-between hover:border-gray-300 rounded-lg py-2.5 px-4 text-gray-500 hover:text-gray-800 font-semibold w-full cursor-pointer hover:bg-gray-200/40 transition-all duration-200 group'
        onClick={() => dispatch(setConversation(null))}
      >
        <div className='flex items-center gap-2.5 text-sm'>
          <FaRegEdit className="group-hover:text-gray-800" />
          <span>New Chat</span>
        </div>
      </button>

      <div className='overflow-y-auto flex-1 pr-1 custom-scrollbar'>
        <ul className='space-y-1' ref={menuRef}>
          {conversations.map((item) => {
            const isSelected = currentConversation?.id === item.id;
            const isMenuOpen = activeMenuId === item.id;
            const isEditing = editingId === item.id;

            return (
              <li 
                key={item.id} 
                className={`flex group mb-1.5 font-medium items-center justify-between text-sm cursor-pointer rounded-lg py-2 px-3 transition-all duration-200 relative min-h-[38px]
                    ${isSelected ? 'bg-gray-200/50 text-gray-900 font-semibold' : 'text-gray-500 hover:bg-gray-200/30 hover:text-gray-900'}
                  `}
                onClick={() => !isEditing && dispatch(setConversation(item))}  
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 outline-none text-gray-900 font-normal"
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename(item.id, item.title);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => submitRename(item.id, item.title)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className='truncate pr-8 w-full'>{item.title || "Untitled Chat"}</span>
                )}

                {!isEditing && (
                  <button 
                    className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-300/40
                      ${isMenuOpen ? 'opacity-100 bg-gray-300/40 text-gray-700' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    onClick={(e) => toggleMenu(e, item.id)}
                  >
                    <VscKebabVertical size={16} />
                  </button>
                )}

                {isMenuOpen && (
                  <div className='absolute right-2 top-9 bg-gray-50 border border-gray-200 shadow-xl rounded-xl py-1 w-32 z-50'>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(item.id);
                        setEditTitle(item.title || "");
                        setActiveMenuId(null);
                      }}
                      className='w-full flex items-center gap-2 px-3 py-1.5 text-left text-gray-600 hover:bg-gray-100 text-[13px]'
                    > 
                      <GoPencil size={14} /> Rename 
                    </button>
                    <button 
                      onClick={(e) => handleDeleteChat(e, item.id)}
                      className='w-full flex items-center gap-2 px-3 py-1.5 text-red-600 text-left hover:bg-red-50 text-[13px] border-t border-gray-100'
                    > 
                      <RiDeleteBin6Line size={14} /> Delete 
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;