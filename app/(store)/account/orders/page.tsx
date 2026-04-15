import { ProtectedRoute } from "@/components/ProtectedRoute";
import AccountOrders from "@/pages/AccountOrders";

export default function AccountOrdersPage() {
  return (
    <ProtectedRoute>
      <AccountOrders />
    </ProtectedRoute>
  );
}
