"use client";

import LinkBase from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";

type NavigateOptions = {
  replace?: boolean;
  scroll?: boolean;
};

export function useLocation(): [string, (href: string, options?: NavigateOptions) => void] {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const navigate = (href: string, options?: NavigateOptions) => {
    const scroll = options?.scroll ?? true;

    if (options?.replace) {
      router.replace(href, { scroll });
      return;
    }

    router.push(href, { scroll });
  };

  return [pathname, navigate];
}

export function useParams<TParams extends Record<string, string | string[] | undefined>>() {
  return useNextParams() as TParams;
}

export function Link(props: React.ComponentProps<typeof LinkBase>) {
  return <LinkBase {...props} />;
}
