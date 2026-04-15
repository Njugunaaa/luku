import { ProtectedRoute } from "@/components/ProtectedRoute";
import Account from "@/pages/Account";

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <Account />
    </ProtectedRoute>
  );
}
