import type { MetaConfig } from '../components/MetaTags';

const BASE_TITLE = 'MatchMeter';
const BASE_DESCRIPTION =
  'MatchMeter is a mobile-first sports tournament OS to organize brackets, register teams, and keep players in sync.';

const withTitle = (pageTitle: string): string => `${pageTitle} | ${BASE_TITLE}`;

// Static meta configuration for top-level routes.
export const routeMeta: Record<string, MetaConfig> = {
  '/': {
    title: withTitle('Sports tournament control center'),
    description: BASE_DESCRIPTION,
    openGraph: {
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  },
  '/login': {
    title: withTitle('Login'),
    description: 'Sign in to manage your tournaments, teams, and live scores.',
    robots: 'noindex,follow',
  },
  '/signup': {
    title: withTitle('Sign up'),
    description: 'Create your MatchMeter account to organize and join sports tournaments.',
  },
  '/tournaments': {
    title: withTitle('Browse tournaments'),
    description: 'Discover, search, and join active sports tournaments.',
  },
  '/404': {
    title: withTitle('Page not found'),
    description: 'The page you are looking for could not be found.',
    robots: 'noindex,follow',
  },
};

export const getRouteMeta = (path: string): MetaConfig => {
  return routeMeta[path] || { title: BASE_TITLE, description: BASE_DESCRIPTION };
};
