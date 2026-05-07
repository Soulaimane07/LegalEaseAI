import { useEffect, useRef, useState } from 'react'





const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  
}

const Legal = ['Privacy', 'Terms', 'Security', 'Cookies']

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16 pb-10 px-6">
      <div className="max-w-6xl px-6 mx-auto">
        <div className=" grid grid-cols-2 md:grid-cols-4 gap-10 mb-11">
          {/* Brand */}
          <div className="col-span-2">
            <p className='text-3xl font-semibold'>Experience Liftoff</p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <ul className="flex flex-col gap-1.5">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm font-semibold text-muted hover:text-blue-300 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h2 className='font-semibold mb-6 legalCSS'> LegalEase AI </h2>

        <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted">© 2025 Google LLC. All rights reserved.</div>
          <div className="text-xs text-muted flex items-center gap-1.5">
            <ul className="flex flex-row gap-8 px-8">
              {Legal.map(l => (
                <li key={l}>
                  <a href="#" className="text-sm font-semibold text-muted hover:text-blue-300 transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
