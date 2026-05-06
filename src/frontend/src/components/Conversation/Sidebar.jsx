import React, { useState, useEffect, useRef } from 'react';
import { VscKebabVertical } from "react-icons/vsc";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GoPencil } from "react-icons/go";
import { auth } from './firebase'; // Ensure correct path to your frontend firebase instance
import { API_BASE_URL } from '../variables'; // Ensure correct path to your global variables file

function Sidebar({ conversations = [], currentConversation, setConversation, refreshConversations }) {
  // Track context menu status
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Inline rename states
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Close the context dropdown menu if the user clicks anywhere outside of it
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-focus the input field when entering edit mode
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

  // --- CONNECTED BACKEND DELETE PIPELINE ---
  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);

    const confirmsDeletion = window.confirm("Are you sure you want to permanently delete this chat session?");
    if (!confirmsDeletion) return;

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User session not found.");

      const token = await currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/chat/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Backend rejected structural deletion request.");

      // If we deleted the active chat, reset the main chat layout area
      if (currentConversation?.id === id && setConversation) {
        setConversation(null);
      }

      // Sync side panel list state values with parent
      if (refreshConversations) {
        await refreshConversations();
      }

    } catch (error) {
      console.error("Failed to delete discussion thread:", error);
      alert("Unauthorized or failed to eliminate conversation log.");
    } finally {
      setLoading(false);
    }
  };

  // --- CONNECTED BACKEND RENAME PIPELINE ---
  const startRenamePipeline = (e, id, currentTitle) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setEditingId(id);
    setEditTitle(currentTitle || "");
  };

  const submitRename = async (id, originalTitle) => {
    const cleanedTitle = editTitle.trim();
    setEditingId(null); // Instantly collapse input UI view

    if (!cleanedTitle || cleanedTitle === originalTitle) return;

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User session not found.");

      const token = await currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/chat/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: cleanedTitle })
      });

      if (!response.ok) throw new Error("Backend rejected modification payload.");

      // If changing the active thread title, update current frame metadata parameters
      if (currentConversation?.id === id && setConversation) {
        setConversation(prev => ({ ...prev, title: cleanedTitle }));
      }

      // Sync side panel list state values with parent
      if (refreshConversations) {
        await refreshConversations();
      }

    } catch (error) {
      console.error("Failed to execute rename sequence:", error);
      alert("Could not update context title target.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-200/80 rounded-xl sticky top-6 w-80 p-3 hidden lg:flex flex-col h-full select-none transition-opacity ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
      
      {/* New Chat Top Generation Anchor Button */}
      <button 
        className='flex items-center mb-4 justify-between hover:border-gray-300 rounded-lg py-2.5 px-4 text-gray-500 hover:text-gray-800 font-semibold w-full cursor-pointer hover:bg-gray-200/40 transition-all duration-200 shrink-0 group'
        onClick={() => setConversation && setConversation(null)}
      >
        <div className='flex items-center gap-2.5 text-sm'>
          <FaRegEdit className="group-hover:text-gray-800 transition-colors" />
          <span>New Chat</span>
        </div>
      </button>

      {/* Conversations List Container */}
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
                onClick={() => !isEditing && setConversation && setConversation(item)}  
              >
                {isEditing ? (
                  /* Inline Input Field Form Elements */
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    className="w-full bg-white border border-gray-300 rounded px-2 py-0.5 outline-none text-gray-900 font-normal z-10"
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename(item.id, item.title);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => submitRename(item.id, item.title)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  /* Standard List Row Span Description text */
                  <span className='truncate pr-8 w-full'>{item.title || "Untitled Chat"}</span>
                )}

                {/* Kebab Context Actions Button Trigger */}
                {!isEditing && (
                  <button 
                    className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-300/40 transition-all duration-150
                      ${isMenuOpen ? 'opacity-100 bg-gray-300/40 text-gray-700' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    onClick={(e) => toggleMenu(e, item.id)}
                  >
                    <VscKebabVertical size={16} />
                  </button>
                )}

                {/* Absolute Dropdown Overlay Element Layout */}
                {isMenuOpen && (
                  <div className='absolute right-2 top-9 bg-gray-50 border border-gray-200/80 shadow-xl rounded-xl py-1 w-32 z-50 animate-in fade-in slide-in-from-top-1 duration-100'>
                    <button 
                      type="button" 
                      onClick={(e) => startRenamePipeline(e, item.id, item.title)}
                      className='w-full flex items-center gap-2 px-3 py-1.5 text-left text-gray-600 hover:bg-gray-100 text-[13px] font-medium transition-colors'
                    > 
                      <GoPencil size={14} /> 
                      Rename 
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => handleDeleteChat(e, item.id)}
                      className='w-full flex items-center gap-2 px-3 py-1.5 text-gray-600 text-left hover:bg-gray-100 text-[13px] font-medium transition-colors border-t border-gray-100'
                    > 
                      <RiDeleteBin6Line size={14} /> 
                      Delete 
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