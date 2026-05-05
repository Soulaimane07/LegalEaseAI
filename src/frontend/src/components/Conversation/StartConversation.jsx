import React from 'react'
import SearchBox from './SearchBox/SearchBox'

function StartConversation({user}) {
  return (
    <div className='text-left  bg-white/50 backdrop-blur-xl rounded-md p-10 w-full max-w-3xl'>
        <h1 className='text-2xl mb-2'> Hi {user?.displayName || 'there'} </h1>
        <p className='text-4xl font-semibold mb-10'> Where should we start? </p>
        <SearchBox />
    </div>
  )
}

export default StartConversation