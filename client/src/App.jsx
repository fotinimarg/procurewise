import { Outlet } from 'react-router-dom'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import { UserContextProvider } from '../context/userContext';
import Navbar from './components/Navbar';
import Sidebar, { SidebarItem } from './components/Sidebar';
import { LayoutDashboard, Boxes, LifeBuoy, ShoppingBag, Heart, Store, UsersRound, AlignStartVertical } from "lucide-react";
import AuthContext from "../context/AuthProvider";
import { useContext } from 'react';
import { CartContextProvider } from '../context/CartContext';
import Footer from './components/Footer';
import FloatingButton from './components/FloatingButton';

axios.defaults.baseURL = 'http://localhost:8000/api'
axios.defaults.withCredentials = true

function App() {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth?.user.role === 'admin';

  return (
    <UserContextProvider>
      <main className='min-h-screen'>
        <Toaster position='top-center' toastOptions={{ duration: 2000 }} />
        <CartContextProvider>
          <div className='flex justify-start w-full'>
            <div className='relative'>
              {auth && auth?.accessToken
                ? (<Sidebar>

                  {/* Admin Sidebar */}
                  {isAdmin ? (
                    <>
                      <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" href={"/"} />
                      <SidebarItem icon={<Boxes size={20} />} text="Products" href={"/admin/products"} />
                      <SidebarItem icon={<Store size={20} />} text="Suppliers" href={"/admin/suppliers"} />
                      <SidebarItem icon={<ShoppingBag size={20} />} text="Orders" href={"/admin/orders"} />
                      <SidebarItem icon={<UsersRound size={20} />} text="Users" href={"/admin/users"} />
                      <SidebarItem icon={<AlignStartVertical size={20} />} text="Categories" href={"/admin/categories"} />
                    </>
                  ) : (
                    <>
                      {/* User Sidebar */}
                      <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" href={"/"} />
                      <SidebarItem icon={<Boxes size={20} />} text="Categories" href={"/categories"} />
                      <SidebarItem icon={<ShoppingBag size={20} />} text="Orders" href={"/orders"} />
                      <SidebarItem icon={<Heart size={20} />} text="Favorites" href={"/favorites"} />
                    </>
                  )}

                  {/* Shared Sidebar Items */}
                  <hr className="my-3" />
                  <SidebarItem icon={<LifeBuoy size={20} />} text="Help" href={"/help"} />
                </Sidebar>
                ) : (<>
                  <FloatingButton />
                </>)}
            </div>
            <div className='flex flex-col min-h-screen w-screen'>
              <Navbar />
              <main className='flex-grow w-full'>
                <Outlet />
              </main>
              <Footer />
            </div>

          </div>
        </CartContextProvider>
      </main>
    </UserContextProvider >
  )
}

export default App
