import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError, TData>,
  "queryKey" | "queryFn"
>;

type MutationOptions<TData, TVariables> = UseMutationOptions<
  TData,
  ApiError,
  TVariables
>;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const IS_DEV = process.env.NODE_ENV !== "production";
const API_TIMEOUT_MS = IS_DEV ? 5 * 60_000 : 15_000;
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildPath(path: string, query?: Record<string, unknown>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

async function request<TData>(
  method: HttpMethod,
  path: string,
  options: {
    body?: unknown;
    query?: Record<string, unknown>;
    signal?: AbortSignal;
  } = {},
): Promise<TData> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(buildPath(path, options.query), {
      method,
      credentials: "include",
      headers:
        options.body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
            },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
    });

    if (response.status === 204) {
      return undefined as TData;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.toLowerCase().includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : typeof payload === "string" && payload.trim()
            ? payload
            : "Request failed";

      throw new ApiError(message, response.status);
    }

    return payload as TData;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        IS_DEV
          ? "The request took too long while the local dev server was compiling. Please try again."
          : "The request took too long. Please try again.",
        408,
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Request failed",
      500,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function get<TData = any>(path: string, query?: Record<string, unknown>) {
  return request<TData>("GET", path, { query });
}

function post<TData = any, TVariables = unknown>(path: string, body?: TVariables) {
  return request<TData>("POST", path, { body });
}

function patch<TData = any, TVariables = unknown>(path: string, body?: TVariables) {
  return request<TData>("PATCH", path, { body });
}

function del<TData = any>(path: string) {
  return request<TData>("DELETE", path);
}

const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  products: {
    featured: ["products", "featured"] as const,
    list: (input?: Record<string, unknown>) => ["products", "list", input ?? {}] as const,
    bySlug: (slug: string) => ["products", "slug", slug] as const,
  },
  categories: {
    list: ["categories", "list"] as const,
    bySlug: (slug: string) => ["categories", "slug", slug] as const,
  },
  cart: {
    get: ["cart", "get"] as const,
  },
  orders: {
    myOrders: ["orders", "myOrders"] as const,
  },
  admin: {
    allOrders: (input?: Record<string, unknown>) => ["admin", "orders", input ?? {}] as const,
    summary: (period: string) => ["admin", "summary", period] as const,
    allUsers: ["admin", "users"] as const,
    allProducts: ["admin", "products"] as const,
  },
};

function useApiUtils() {
  const queryClient = useQueryClient();

  return {
    auth: {
      me: {
        setData: (_input: unknown, value: unknown) =>
          queryClient.setQueryData(queryKeys.auth.me, value),
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
      },
    },
    cart: {
      get: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.get }),
      },
    },
    products: {
      list: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: ["products", "list"] }),
      },
      featured: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.featured }),
      },
    },
    categories: {
      list: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.list }),
      },
    },
    orders: {
      myOrders: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.myOrders }),
      },
    },
    admin: {
      allOrders: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
      },
      weeklySummary: {
        invalidate: () =>
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary("weekly") }),
      },
      monthlySummary: {
        invalidate: () =>
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary("monthly") }),
      },
      yearlySummary: {
        invalidate: () =>
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary("yearly") }),
      },
      allUsers: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.allUsers }),
      },
      allProducts: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.allProducts }),
      },
    },
  };
}

export const api = {
  useUtils: useApiUtils,
  useContext: useApiUtils,
  auth: {
    me: {
      useQuery: (_input: undefined, options?: QueryOptions<any>) =>
        useQuery({
          queryKey: queryKeys.auth.me,
          queryFn: () => get("/api/auth/me"),
          ...options,
        }),
    },
    login: {
      useMutation: (options?: MutationOptions<any, { email: string; password: string }>) =>
        useMutation({
          mutationFn: (input) => post("/api/auth/login", input),
          ...options,
        }),
    },
    signup: {
      useMutation: (
        options?: MutationOptions<
          any,
          { email: string; password: string; name?: string }
        >,
      ) =>
        useMutation({
          mutationFn: (input) => post("/api/auth/signup", input),
          ...options,
        }),
    },
    logout: {
      useMutation: (options?: MutationOptions<{ success: true }, void>) =>
        useMutation({
          mutationFn: () => post("/api/auth/logout"),
          ...options,
        }),
    },
    forgotPassword: {
      useMutation: (options?: MutationOptions<{ success: true; resetUrl?: string }, { email: string }>) =>
        useMutation({
          mutationFn: (input) => post("/api/auth/forgot-password", input),
          ...options,
        }),
    },
    resetPassword: {
      useMutation: (
        options?: MutationOptions<{ success: true }, { token: string; password: string }>,
      ) =>
        useMutation({
          mutationFn: (input) => post("/api/auth/reset-password", input),
          ...options,
        }),
    },
  },
  products: {
    featured: {
      useQuery: (options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.products.featured,
          queryFn: () => get("/api/products/featured"),
          ...options,
        }),
    },
    list: {
      useQuery: (
        input?: {
          categoryId?: number;
          featured?: boolean;
          search?: string;
          limit?: number;
          offset?: number;
          inStock?: boolean;
        },
        options?: QueryOptions<any[]>,
      ) =>
        useQuery({
          queryKey: queryKeys.products.list(input),
          queryFn: () => get("/api/products", input),
          ...options,
        }),
    },
    bySlug: {
      useQuery: (
        input: { slug: string },
        options?: QueryOptions<any>,
      ) =>
        useQuery({
          queryKey: queryKeys.products.bySlug(input.slug),
          queryFn: () => get(`/api/products/${encodeURIComponent(input.slug)}`),
          ...options,
        }),
    },
  },
  categories: {
    list: {
      useQuery: (options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.categories.list,
          queryFn: () => get("/api/categories"),
          ...options,
        }),
    },
    bySlug: {
      useQuery: (
        input: { slug: string },
        options?: QueryOptions<any>,
      ) =>
        useQuery({
          queryKey: queryKeys.categories.bySlug(input.slug),
          queryFn: () => get(`/api/categories/${encodeURIComponent(input.slug)}`),
          ...options,
        }),
    },
  },
  cart: {
    get: {
      useQuery: (_input: undefined, options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.cart.get,
          queryFn: () => get("/api/cart"),
          ...options,
        }),
    },
    add: {
      useMutation: (
        options?: MutationOptions<
          { success: true },
          {
            productId: number;
            quantity: number;
            selectedSize?: string;
            selectedColor?: string;
          }
        >,
      ) =>
        useMutation({
          mutationFn: (input) => post("/api/cart", input),
          ...options,
        }),
    },
    update: {
      useMutation: (
        options?: MutationOptions<{ success: true }, { itemId: number; quantity: number }>,
      ) =>
        useMutation({
          mutationFn: (input) => patch(`/api/cart/${input.itemId}`, { quantity: input.quantity }),
          ...options,
        }),
    },
    remove: {
      useMutation: (
        options?: MutationOptions<{ success: true }, { itemId: number }>,
      ) =>
        useMutation({
          mutationFn: (input) => del(`/api/cart/${input.itemId}`),
          ...options,
        }),
    },
    clear: {
      useMutation: (options?: MutationOptions<{ success: true }, void>) =>
        useMutation({
          mutationFn: () => del("/api/cart"),
          ...options,
        }),
    },
  },
  orders: {
    create: {
      useMutation: (options?: MutationOptions<any, any>) =>
        useMutation({
          mutationFn: (input) => post("/api/orders", input),
          ...options,
        }),
    },
    myOrders: {
      useQuery: (_input: undefined, options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.orders.myOrders,
          queryFn: () => get("/api/orders"),
          ...options,
        }),
    },
  },
  admin: {
    allOrders: {
      useQuery: (input?: any, options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.admin.allOrders(input),
          queryFn: () => get("/api/admin/orders", input),
          ...options,
        }),
    },
    updateOrderStatus: {
      useMutation: (options?: MutationOptions<{ success: true }, any>) =>
        useMutation({
          mutationFn: (input) =>
            patch(`/api/admin/orders/${input.orderId}`, {
              status: input.status,
              paymentStatus: input.paymentStatus,
              notes: input.notes,
            }),
          ...options,
        }),
    },
    deleteOrder: {
      useMutation: (
        options?: MutationOptions<{ success: true }, { orderId: number }>,
      ) =>
        useMutation({
          mutationFn: (input) => del(`/api/admin/orders/${input.orderId}`),
          ...options,
        }),
    },
    createManualOrder: {
      useMutation: (options?: MutationOptions<any, any>) =>
        useMutation({
          mutationFn: (input) => post("/api/admin/orders/manual", input),
          ...options,
        }),
    },
    weeklySummary: {
      useQuery: (options?: QueryOptions<any>) =>
        useQuery({
          queryKey: queryKeys.admin.summary("weekly"),
          queryFn: () => get("/api/admin/summary/weekly"),
          ...options,
        }),
    },
    monthlySummary: {
      useQuery: (options?: QueryOptions<any>) =>
        useQuery({
          queryKey: queryKeys.admin.summary("monthly"),
          queryFn: () => get("/api/admin/summary/monthly"),
          ...options,
        }),
    },
    yearlySummary: {
      useQuery: (options?: QueryOptions<any>) =>
        useQuery({
          queryKey: queryKeys.admin.summary("yearly"),
          queryFn: () => get("/api/admin/summary/yearly"),
          ...options,
        }),
    },
    allUsers: {
      useQuery: (options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.admin.allUsers,
          queryFn: () => get("/api/admin/users"),
          ...options,
        }),
    },
    allProducts: {
      useQuery: (options?: QueryOptions<any[]>) =>
        useQuery({
          queryKey: queryKeys.admin.allProducts,
          queryFn: () => get("/api/admin/products"),
          ...options,
        }),
    },
    upsertProduct: {
      useMutation: (options?: MutationOptions<{ success: true }, any>) =>
        useMutation({
          mutationFn: (input) => post("/api/admin/products", input),
          ...options,
        }),
    },
    deleteProduct: {
      useMutation: (
        options?: MutationOptions<{ success: true }, { productId: number }>,
      ) =>
        useMutation({
          mutationFn: (input) => del(`/api/admin/products/${input.productId}`),
          ...options,
        }),
    },
    upsertCategory: {
      useMutation: (
        options?: MutationOptions<
          { success: true },
          {
            slug: string;
            name: string;
            description?: string;
            imageUrl?: string;
            gender?: "men" | "women" | "unisex";
            sortOrder?: number;
          }
        >,
      ) =>
        useMutation({
          mutationFn: (input) => post("/api/admin/categories", input),
          ...options,
        }),
    },
  },
};
