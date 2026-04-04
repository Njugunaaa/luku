import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";

const ACCOUNT_ACTIONS = [
  {
    title: "My Orders",
    description: "Track delivery, payment, and order history in one place.",
    href: "/account/orders",
    icon: Package,
  },
  {
    title: "Dashboard",
    description: "Jump back into your shopper dashboard and saved shortcuts.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cart",
    description: "Continue shopping and review the pieces you plan to check out.",
    href: "/cart",
    icon: ShoppingBag,
  },
];

export default function Account() {
  const { user, logout } = useAuthContext();

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.12),transparent_20%)]">
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-pink-500">Account</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                  {user?.name ? `${user.name.split(" ")[0]}'s profile` : "Your profile"}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Keep your shopping journey organized with quick access to orders, cart activity,
                  and your main dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <Link href="/account/orders">
                    <Package className="h-4 w-4" />
                    View Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[2rem] border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-pink-500" />
                  Profile details
                </CardTitle>
                <CardDescription>
                  Your account basics and shopper access level.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <ProfileStat label="Full name" value={user?.name || "Not provided yet"} />
                <ProfileStat label="Email" value={user?.email || "Not available"} />
                <ProfileStat
                  label="Role"
                  value={user?.role === "admin" ? "Administrator" : "Customer"}
                />
                <ProfileStat
                  label="Account status"
                  value={user ? "Signed in and active" : "Unavailable"}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-pink-500" />
                  Quick actions
                </CardTitle>
                <CardDescription>
                  Move between the most-used customer areas without hunting through menus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ACCOUNT_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-background/70 p-4 transition-all hover:border-pink-300/50 hover:bg-pink-500/[0.05]"
                  >
                    <div className="rounded-2xl bg-pink-500/10 p-3 text-pink-500">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                ))}

                {user?.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="flex items-start gap-4 rounded-[1.5rem] border border-pink-400/30 bg-pink-500/[0.08] p-4 transition-all hover:border-pink-300/60 hover:bg-pink-500/[0.12]"
                  >
                    <div className="rounded-2xl bg-pink-500/15 p-3 text-pink-500">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Admin workspace</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Open operations, inventory, and reporting tools for the shop.
                      </p>
                    </div>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <Card className="rounded-[2rem] border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-pink-500" />
                  Shopper notes
                </CardTitle>
                <CardDescription>
                  A cleaner place to manage your next steps while checkout and order features continue to grow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Use this area as your customer home base. You can move to your order history,
                  continue shopping from cart, or return to the main dashboard without broken links.
                </p>
                <p>
                  As more account tools are added, this page is the right place for saved details,
                  delivery preferences, and future customer settings.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-pink-500" />
                  Session
                </CardTitle>
                <CardDescription>
                  Sign out safely when you are done shopping or managing the store.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={logout} className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}
