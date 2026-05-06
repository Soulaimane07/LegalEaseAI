import React from 'react'

function User({ user, open, setOpen, handleLogin, handleLogout }) {
  return (
    <div className=' space-x-2 relative flex items-center'>
        {user ? (
            /* User Profile & Sign Out Display */
            <button onClick={()=> setOpen(!open)} className="flex cursor-pointer bg-gray-100 hover:bg-gray-200 transition-all  items-center p-0.5 rounded-full">
              <img 
                src={user.photoURL || "../images/default-avatar.png"} 
                alt="Profile" 
                className="h-9 w-9 rounded-full border border-gray-200"
                referrerPolicy="no-referrer" // Prevents Google image loading restrictions
              />
            </button>
          ) : (
            /* Authentication Call to Actions */
            <>
              <button 
                onClick={handleLogin} 
                className="btn-ghost cursor-pointer bg-gray-100 text-gray-900 font-medium rounded-full text-sm py-2 px-6 hover:bg-gray-200 transition-colors"
              >
                Sign in
              </button>
              
              <button 
                onClick={handleLogin}
                className="btn-primary cursor-pointer bg-black text-white rounded-full text-sm font-medium px-6 py-2 transition-transform active:scale-95"
              >
                Start for Free
              </button>
            </>
        )}

        {(user && open) && (
          <div className="flex flex-col items-center gap-3 absolute top-12 right-0 bg-white border border-gray-200 rounded-2xl p-4  shadow-lg">
            {/* User Profile Display */}
            <div className="flex flex-col gap-3 px-4 py-2">
              <p className="text-xs text-gray-400 text-center font-medium">  {user.email}</p>
              <img 
                src={user.photoURL || "../images/default-avatar.png"} 
                alt="Profile" 
                className="h-20 mx-auto w-20 rounded-full border border-gray-200"
                referrerPolicy="no-referrer"
              />
              <p className="text-sm font-medium text-gray-900 text-center"> Hi, {user.displayName || "User"}! </p>
              <button 
                onClick={handleLogout}
                className="text-xs mt-2 font-medium text-white hover:scale-105 transition-all bg-black  px-3 py-2 rounded-full  cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
    </div>
  )
}

export default User