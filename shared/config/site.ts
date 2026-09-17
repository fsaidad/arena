const defaultSiteUrl = "http://localhost:3000";

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl);
