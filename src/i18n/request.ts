import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeValue = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
