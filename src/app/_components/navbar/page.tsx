"use client"
import Image from 'next/image'
import React from 'react'
import logo from "@/app/assets/image.svg"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const path = usePathname()
    // console.log(path);
    
    return (
        <>
            <nav className='fixed top-0 w-full bg-[#ffffff] z-[100]'>
                <div className="container flex justify-between py-3">
                    <Link href="/" className='flex items-center gap-2'>
                        <Image src={logo} alt="Power Gym logo" width={80} height={80} />
                        <span className='text-[25px] md:text-[35px] font-bold'>Power Gym</span>
                    </Link>
                    <ul className='flex items-center gap-[20px] '>
                        <li><Link href="/" className='text-[22px] group'><i className={`fa-solid fa-users transition-colors group-hover:text-[#22c55e] ${path==='/'?'text-[#22c55e]':""}`}></i> <span className='font-semibold'>Home</span></Link></li>
                        <li><Link href="/archive" className='text-[22px] group'><i className={`fa-solid fa-book transition-colors group-hover:text-[red] ${path==='/archive'?'text-[red]':""}`}></i> <span className='font-semibold'>Archive</span></Link></li>
                    </ul>
                </div>
            </nav>
        </>
    )
}
