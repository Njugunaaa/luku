import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AccountOrders from "./pages/AccountOrders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/category/:slug" component={() => <Layout><Category /></Layout>} />
      <Route path="/product/:slug" component={() => <Layout><ProductDetail /></Layout>} />
      <Route path="/login" component={() => <Layout><Login /></Layout>} />
      <Route path="/signup" component={() => <Layout><Signup /></Layout>} />
      
      {/* Protected Routes - require authentication */}
      <Route path="/dashboard" component={() => (
        <Layout>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Layout>
      )} />
      <Route path="/cart" component={() => (
        <Layout>
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        </Layout>
      )} />
      <Route path="/checkout" component={() => (
        <Layout>
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        </Layout>
      )} />
      <Route path="/account/orders" component={() => (
        <Layout>
          <ProtectedRoute>
            <AccountOrders />
          </ProtectedRoute>
        </Layout>
      )} />
      
      {/* Admin Routes - require admin role */}
      <Route path="/admin" component={() => (
        <Layout>
          <AdminRoute>
            <Admin />
          </AdminRoute>
        </Layout>
      )} />
      
      {/* 404 Routes */}
      <Route path="/404" component={() => <Layout><NotFound /></Layout>} />
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster richColors position="top-right" />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
