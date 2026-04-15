"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { LogOut, Package, ShoppingCart, User } from "lucide-react";
import { Link } from "@/lib/navigation";

function DashboardContent() {
  const { user, logout } = useAuthContext();

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Welcome, {user?.name || user?.email}!</h1>
        <p className="text-muted-foreground">Manage your shopping and account here</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/cart" className="block h-full">
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
              <CardDescription>View and manage your cart items</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Continue shopping or proceed to checkout
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/orders" className="block h-full">
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Orders
              </CardTitle>
              <CardDescription>Track your purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View order history and delivery status
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email}</p>
          </div>
          {user?.name && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
          )}
          {user?.role === "admin" && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-lg font-semibold text-amber-600">Administrator</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Admin Panel
          </Link>
        )}
        <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
