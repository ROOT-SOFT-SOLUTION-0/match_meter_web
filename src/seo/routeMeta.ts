import type { MetaConfig } from '../components/MetaTags';

const BASE_TITLE = 'MatchMeter';
const BASE_DESCRIPTION =
  'MatchMeter is a tournament management app for cricket, football, and local leagues with fixtures, team registration, and live score updates.';

const withTitle = (pageTitle: string): string => `${pageTitle} | ${BASE_TITLE}`;

// Static meta configuration for top-level routes.
export const routeMeta: Record<string, MetaConfig> = {
  '/': {
    title: withTitle('Tournament Management App in India | Live Scores and Fixtures'),
    description:
      'MatchMeter tournament management software helps organizers create tournaments, manage teams, generate fixtures, and publish live scores in real time.',
    openGraph: {
      title: 'MatchMeter Tournament Management App with Live Score',
      description:
        'Run cricket and football tournaments with team approvals, automated fixtures, and live match updates from one mobile-first platform.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'MatchMeter Tournament Management App',
      description:
        'Create tournaments, manage teams, and update live scores with MatchMeter sports tournament software.',
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
