import { TbArrowLeftToArc, TbArrowRightToArc } from "react-icons/tb";
import { createContext, useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UserContext from '../../context/userContext';

const SidebarContext = createContext({})

export default function Sidebar({ children }) {
    const { sidebarOpen, toggleSidebar, user } = useContext(UserContext);
    return (
        <aside className="shadow-lg h-screen sticky top-0 z-10">
            <nav className="h-full inline-flex flex-col bg-[#96939b] border-r shadow-sm pt-1">
                <div className="p-4 pb-2 flex justify-between items-center">
                    <p className={`overflow-hidden transition-all text-gray-800 ${sidebarOpen ? "w-24" : "w-0"}`}>ProcureWise</p>
                    <button onClick={toggleSidebar} className="p-1 rounded-lg bg-gray-50 hover:bg-gray-100">
                        {sidebarOpen ? <TbArrowLeftToArc color="#4a5568" /> : <TbArrowRightToArc color="#4a5568" />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ sidebarOpen }}>
                    <ul className="flex-1 px-3">{children}</ul>
                </SidebarContext.Provider>
            </nav>
        </aside>
    )
}

export function SidebarItem({ icon, text, href }) {
    const { sidebarOpen } = useContext(SidebarContext);

    const location = useLocation();
    const isActive = location.pathname === href;

    return (
        <ul>
            {
                <Link to={href}>
                    < li className={`relative flex items-center py-2 my-1 font-medium rounded-md cursor-pointer transition-colors group
                        ${isActive ? "bg-gradient-to-tr from-[#E8E8E8] to-gray-200 text-[#564256]"
                            : "hover:bg-gray-200 text-gray-700"}
                        `}
                    >

                        <span className="mx-2">{icon}</span>
                        <span className={`overflow-hidden transition-all ${sidebarOpen ? "w-40 ml-3" : "w-0"}`}>{text}</span>

                        {!sidebarOpen && (
                            <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-[#E8E8E8] text-[#564256] text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">{text}</div>
                        )}
                    </li>
                </Link>
            }
        </ul >
    )
}