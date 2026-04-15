import { ProtectedRoute } from "@/components/ProtectedRoute";
import Checkout from "@/pages/Checkout";

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  );
}
