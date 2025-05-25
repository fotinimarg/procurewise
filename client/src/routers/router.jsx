import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Page404 from "../pages/Page404";
import Orders from "../pages/user/Orders";
import UserProfile from "../pages/user/UserProfile";
import Categories from "../pages/Categories";
import Favorites from "../pages/user/Favorites";
import Help from "../pages/Help";
import ProtectedRoute from "../../context/ProtectedRoute";
import Unauthorized from "../pages/auth/Unauthorized";
import HomeOrDash from "../components/HomeOrDash";
import Dashboard from "../pages/user/Dashboard";
import Dash from "../pages/admin/Dash";
import AdminProtected from "../../context/AdminProtected";
import EditProduct from "../pages/admin/EditProduct";
import ProductsManagement from "../pages/admin/ProductsManagement";
import SuppliersManagement from "../pages/admin/SuppliersManagement";
import EditSupplier from "../pages/admin/EditSupplier";
import Product from "../pages/Product";
import Supplier from "../pages/Supplier";
import SearchResults from "../pages/SearchResults";
import CategoryPage from "../pages/CategoryPage";
import Settings from "../pages/user/Settings";
import Cart from "../pages/user/Cart";
import Checkout from "../pages/user/Checkout";
import Payment from "../pages/user/Payment";
import OrderSuccess from "../pages/user/OrderSuccess";
import OrderPage from "../pages/user/OrderPage";
import AdminProduct from "../pages/admin/AdminProduct";
import AdminSupplier from "../pages/admin/AdminSupplier";
import AdminOrders from "../pages/admin/AdminOrders";
import AboutUsPage from "../pages/AboutUs";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsOfService";
import ContactInfo from "../pages/ContactInfo";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import SuppliersPage from "../pages/Suppliers";
import UsersManagement from "../pages/admin/UsersManagement";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <HomeOrDash />
            },
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/verify-email",
                element: <VerifyEmail />
            },
            {
                path: "/forgot-password",
                element: <ForgotPassword />
            },
            {
                path: "/reset-password",
                element: <ResetPassword />
            },
            {
                path: '/search',
                element: <SearchResults />
            },
            {
                path: '/orders',
                element:
                    <ProtectedRoute>
                        <Orders />
                    </ProtectedRoute>
            },
            {
                path: '/cart',
                element:
                    <Cart />
            },
            {
                path: '/checkout',
                element:
                    <ProtectedRoute>
                        <Checkout />
                    </ProtectedRoute>
            },
            {
                path: '/checkout/payment',
                element:
                    <ProtectedRoute>
                        <Payment />
                    </ProtectedRoute>
            },
            {
                path: '/order/success/:orderId',
                element:
                    <ProtectedRoute>
                        <OrderSuccess />
                    </ProtectedRoute>
            },
            {
                path: '/order/:orderId',
                element:
                    <ProtectedRoute>
                        <OrderPage />
                    </ProtectedRoute>
            },
            {
                path: '/profile',
                element:
                    <ProtectedRoute>
                        <UserProfile />
                    </ProtectedRoute>
            },
            {
                path: '/settings',
                element:
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
            },
            {
                path: '/categories',
                element: <Categories />
            },
            {
                path: '/categories/:categorySlug',
                element: <CategoryPage />
            },
            {
                path: '/favorites',
                element:
                    <ProtectedRoute>
                        <Favorites />
                    </ProtectedRoute>
            },
            {
                path: '/about',
                element: <AboutUsPage />
            },
            {
                path: '/help',
                element: <Help />
            },
            {
                path: '/privacy-policy',
                element: <PrivacyPolicy />
            },
            {
                path: '/contact',
                element: <ContactInfo />
            },
            {
                path: '/terms-of-service',
                element: <TermsOfService />
            },
            {
                path: '/dashboard',
                element:
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
            },
            {
                path: '/products/:productId',
                element: <Product />
            },
            {
                path: '/suppliers/:supplierId',
                element: <Supplier />
            },
            {
                path: '/suppliers',
                element: <SuppliersPage />
            },
            {
                path: '/unauthorized',
                element: <Unauthorized />
            },
            {
                path: '/admin',
                element:
                    <AdminProtected>
                        <Dash />
                    </AdminProtected>
            },
            {
                path: '/admin/products',
                element:
                    <AdminProtected>
                        <ProductsManagement />
                    </AdminProtected>
            },
            {
                path: "/admin/products/edit/:id",
                element:
                    <AdminProtected>
                        <EditProduct />
                    </AdminProtected>
            },
            {
                path: "/admin/products/:productId",
                element:
                    <AdminProtected>
                        <AdminProduct />
                    </AdminProtected>
            },
            {
                path: '/admin/suppliers',
                element:
                    <AdminProtected>
                        <SuppliersManagement />
                    </AdminProtected>
            },
            {
                path: "/admin/suppliers/edit/:id",
                element:
                    <AdminProtected>
                        <EditSupplier />
                    </AdminProtected>
            },
            {
                path: "/admin/suppliers/:supplierId",
                element:
                    <AdminProtected>
                        <AdminSupplier />
                    </AdminProtected>
            },
            {
                path: "/admin/orders",
                element:
                    <AdminProtected>
                        <AdminOrders />
                    </AdminProtected>
            },
            {
                path: "/admin/users",
                element:
                    <AdminProtected>
                        <UsersManagement />
                    </AdminProtected>
            },
            {
                path: "/admin/categories",
                element:
                    <AdminProtected>
                        <AdminCategoriesPage />
                    </AdminProtected>
            },
            {
                path: '*',
                element: <Page404 />
            },
        ]
    }
]);

export default router;