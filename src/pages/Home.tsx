import { Link } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, Card, CardBody, Badge } from '../components';
import { MetaTags } from '../components/MetaTags';
import { getRouteMeta } from '../seo/routeMeta';
import {
  Activity,
  Calendar,
  MapPin,
  Shield,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

const ROUTES = {
  TOURNAMENTS: '/tournaments',
  MY_TEAMS: '/my-teams',
  SIGNUP: '/signup',
  LOGIN: '/login',
} as const;

const STATS = [
  { id: 'tournaments', label: 'Active Events', value: '12', trend: '+2', trendLabel: 'vs last week' },
  { id: 'teams', label: 'Teams', value: '5', trend: '—', trendLabel: 'stable' },
  { id: 'upcoming', label: 'Days to next match', value: '2', trend: 'Sat 2PM', trendLabel: 'next kick-off' },
  { id: 'performance', label: 'Global rank', value: '#14', trend: 'Top 5%', trendLabel: 'division' },
] as const;

const FEATURES = [
  {
    id: 'tournament',
    icon: Trophy,
    title: 'Tournament control',
    description: 'Professional brackets, seeding, and schedules for any sport.',
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team spaces',
    description: 'Rosters, player eligibility, and digital IDs in one place.',
  },
  {
    id: 'live',
    icon: Calendar,
    title: 'Live operations',
    description: 'Real-time scoring, tables, and fixtures from your phone.',
  },
] as const;

const SubtleGrid = () => (
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage:
        'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}
  />
);

function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Coach';

  return (
    <div className="relative min-h[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <SubtleGrid />
      </div>

      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="p-4 sm:p-6 lg:p-7">
          <CardBody>
            <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-stretch">
              <div className="flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="success">Today • 2 matches</Badge>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Welcome back, {firstName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your squads, fixtures, and live scores in one screen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STATS.map((stat) => (
                    <div
                      key={stat.id}
                      className="rounded-2xl bg-gray-50/70 dark:bg-secondary-900/70 border border-gray-100 dark:border-gray-800 px-3 py-3"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                        {stat.label}
                      </p>
                      <div className="mt-1.5 flex items-baseline justify-between gap-2">
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <span className="inline-flex flex-col items-end text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5">
                            {stat.trend}
                          </span>
                          <span className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                            {stat.trendLabel}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to={ROUTES.MY_TEAMS}>
                    <Button variant="outline" size="sm" className="rounded-full px-4">
                      <Users className="h-4 w-4 mr-1.5" />
                      Manage teams
                    </Button>
                  </Link>
                  <Link to={ROUTES.TOURNAMENTS}>
                    <Button size="sm" className="rounded-full px-4">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      My schedule
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-900/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Next match</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Premier Football League
                      </p>
                    </div>
                    <Badge variant="info">Sat 2:00 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Arena 3
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      Check-in opens in 45 min
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-secondary-950/60 px-4 py-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Quick actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link to={ROUTES.TOURNAMENTS}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-900/70 px-3 py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:border-emerald-500/70 hover:bg-emerald-50/50 dark:hover:bg-secondary-900/80 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-400" />
                          <span className="truncate">View tournaments</span>
                        </span>
                        <Target className="h-4 w-4 text-gray-300" />
                      </button>
                    </Link>

                    <Link to={ROUTES.MY_TEAMS}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-900/70 px-3 py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:border-emerald-500/70 hover:bg-emerald-50/50 dark:hover:bg-secondary-900/80 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="truncate">Manage teams</span>
                        </span>
                        <Target className="h-4 w-4 text-gray-300" />
                      </button>
                    </Link>

                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-left text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:border-emerald-500/70 hover:bg-emerald-50/30 dark:hover:bg-secondary-900/60 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="truncate">Rules & formats</span>
                      </span>
                      <Target className="h-4 w-4 text-gray-300" />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-900/80 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900 dark:text-white">Season overview</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      12 active events • 5 registered teams
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <SubtleGrid />
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center space-y-8">
        <MetaTags config={getRouteMeta('/')} />
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          The athlete's tournament OS
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Run every match
          <span className="block text-emerald-600">from one control center.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400">
          Organize brackets, register teams, and keep players in sync with a
          mobile-first dashboard built for serious tournament operators.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
          <Link to={ROUTES.SIGNUP}>
            <Button size="md" className="rounded-full px-6">
              Get started free
            </Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline" size="md" className="rounded-full px-6">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-secondary-950/60 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.id} className="space-y-3 text-left sm:text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-100 text-emerald-600">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Ready for kickoff?
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Join leagues already using MatchMeter to power registrations,
          schedules, and live scores.
        </p>
        <Link to={ROUTES.SIGNUP}>
          <Button size="md" className="rounded-full px-8">
            Create your first tournament
          </Button>
        </Link>
      </section>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LandingPage />;
}
