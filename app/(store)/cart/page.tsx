import { ProtectedRoute } from "@/components/ProtectedRoute";
import Cart from "@/pages/Cart";

export default function CartPage() {
  return (
    <ProtectedRoute>
      <Cart />
    </ProtectedRoute>
  );
}
