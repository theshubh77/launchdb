/**
 * Utility function to dynamically append UTM parameters to an outbound link.
 * If the link is not absolute (does not start with http), it returns it unmodified.
 */
export function addUtmToUrl(url: string, utmSource: string = "launchdb.vercel.app"): string {
  if (!url || !url.startsWith("http")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", utmSource);
    return parsed.toString();
  } catch {
    return url;
  }
}
