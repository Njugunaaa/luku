export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// when deployment to vercel or local, login page is internal
export const getLoginUrl = () => {
  return "/login";
};
