import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import { CartPage } from "./pages/CartPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { RestaurantDetailPage } from "./pages/RestaurantDetailPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50/80">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/cart" element={user ? <CartPage /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <OrdersPage /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
