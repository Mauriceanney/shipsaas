export const siteConfig = {
  name: "SaaS Boilerplate",
  description:
    "Production-ready SaaS boilerplate with Next.js 15, TypeScript, and Prisma",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    github: "https://github.com/yourusername/saas-boilerplate",
    twitter: "https://twitter.com/yourusername",
  },
  creator: "Your Name",
};

export const navConfig = {
  mainNav: [
    {
      title: "Features",
      href: "/#features",
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    {
      title: "Blog",
      href: "/blog",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "home",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "settings",
    },
    {
      title: "Billing",
      href: "/settings/billing",
      icon: "creditCard",
    },
  ],
};
