import React from 'react'
import { TfiAngleRight } from "react-icons/tfi";
import { AiOutlineAppstore, AiOutlineProduct  } from "react-icons/ai";
import { FiLayers } from "react-icons/fi";
import { GoCodeSquare } from "react-icons/go";

function UseCases () {
    const list = [
        { id: 1, title: "Professional", icon: <AiOutlineProduct size={19} /> },
        { id: 2, title: "Frontend", icon: <FiLayers size={19} /> },
        { id: 3, title: "Backend", icon: <GoCodeSquare size={19} /> }
    ];

    return (
        <>
            <div className='w-1/2'>
                <p className='text-2xl mb-2 font-medium'>Built for developers <br /> in the agent-first era</p>
                <p className='text-gray-600 text-md mb-10'>Explore how Google Antigravity helps <br /> you build</p>
                <a href='/usecases' className='mt-16 bg-gray-100/60 hover:bg-gray-200/60 transition duration-300 px-6 py-2 rounded-full'> See overview </a>
            </div>
            <div className='w-full'>
                {list.map((item) => (
                    <div key={item.id} className='NavItem space-x-7 flex w-fit mb-3 items-center cursor-pointer '>
                        {item.icon}
                        <p className='mb-1 font-normal mr-2'>{item.title}</p>
                        <TfiAngleRight />
                    </div>
                ))}
            </div>
        </>
    )
}

const Resources = () => {
    const list = [
        { id: 1, title: "Documentation" },
        { id: 2, title: "Support"},
        { id: 3, title: "GitHub Repo"}
    ];

    return (
        <>
            <div className='w-1/2'>
                <p className='text-xl mb-2 font-medium'>Everything you <br /> need to stay up-to- <br /> date and get help</p>
            </div>
            <div className='w-full'>
                {list.map((item) => (
                    <div key={item.id} className='NavItem space-x-7 flex w-fit mb-2 items-center cursor-pointer '>
                        <p className='mb-1 font-normal mr-2'>{item.title}</p>
                        <TfiAngleRight />
                    </div>
                ))}
            </div>
        </>
    )
}

// Accept activeType as a prop to toggle content dynamically
function NavbarLandingDetails({ activeType }) {
  return (
    <div className="px-16 bg-white rounded-b-4xl w-full">
        <div className='mx-7 pt-12 py-8 pb-20  flex gap-20'>
            {activeType === 'Use cases' && <UseCases />}
            {activeType === 'Ressources' && <Resources />}
        </div>
    </div>
  )
}

export default NavbarLandingDetails;