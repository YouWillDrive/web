import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { availableLocales } from "./routing";

export default getRequestConfig(async () => {
  "use server";

  // Fetch from cookies
  let locale = (await cookies()).get("locale")?.value;

  if (!locale || !availableLocales.includes(locale)) {
    locale = "ru";
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
