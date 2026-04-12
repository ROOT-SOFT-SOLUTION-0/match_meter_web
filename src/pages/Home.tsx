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
    title: 'Tournament management app',
    description:
      'Create cricket and football tournaments with fixtures, brackets, and live standings.',
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team and player management',
    description:
      'Handle registrations, approvals, rosters, and player visibility from one dashboard.',
  },
  {
    id: 'live',
    icon: Calendar,
    title: 'Live score and match control',
    description: 'Update scores in real time and share instant match status with fans and teams.',
  },
] as const;

const HOW_IT_WORKS = [
  {
    id: 'step-1',
    step: '01',
    title: 'Create your tournament',
    description:
      'Set sport type, location, date, format, and tournament rules in a few minutes.',
  },
  {
    id: 'step-2',
    step: '02',
    title: 'Add teams and build fixtures',
    description:
      'Approve registrations and auto-generate fixtures and brackets for smooth match flow.',
  },
  {
    id: 'step-3',
    step: '03',
    title: 'Run matches with live updates',
    description:
      'Push live scores and match events from mobile so players and fans always stay updated.',
  },
] as const;

const IDEAL_FOR = [
  'Cricket tournament organizers',
  'Football leagues and academies',
  'Community sports event managers',
  'Team managers and local clubs',
] as const;

const FAQS = [
  {
    id: 'faq-1',
    question: 'What is MatchMeter?',
    answer:
      'MatchMeter is a tournament management app that helps organizers manage fixtures, teams, and live scores from one platform.',
  },
  {
    id: 'faq-2',
    question: 'Can I use MatchMeter for cricket and football tournaments?',
    answer:
      'Yes. MatchMeter supports cricket, football, and other local league formats with flexible tournament workflows.',
  },
  {
    id: 'faq-3',
    question: 'Is MatchMeter useful for local tournaments in India?',
    answer:
      'Yes. MatchMeter is designed for local organizers who need a simple way to run matches, update scores, and improve visibility.',
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
          Tournament management app for India
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white">
          MatchMeter Tournament
          <span className="block text-emerald-600">Management App with Live Score.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400">
          MatchMeter helps you create tournaments, register teams, generate fixtures,
          and update live scores for cricket, football, and community leagues.
        </p>
        <p className="mx-auto max-w-3xl text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          If you searched for MatchMeter, Match Meter, or MatchMeater, this is the same platform built to run local tournaments professionally.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3 text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Why MatchMeter is a top tournament software choice
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Replace WhatsApp threads and spreadsheet confusion with one sports tournament management software for scheduling, scoring, and team operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
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
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            What is MatchMeter?
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            MatchMeter is a mobile-first tournament management system for organizers who need
            simple, fast, and transparent operations. From registrations to finals, every
            workflow is managed in one place.
          </p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            It is built for local tournaments where speed matters: team approvals, live score
            updates, fixture tracking, sponsor visibility, and admin-level control.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-secondary-950/60 p-5 sm:p-6 space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Who should use MatchMeter?
          </h3>
          <div className="flex flex-wrap gap-2">
            {IDEAL_FOR.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-900 px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-950/40 py-14 sm:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              How MatchMeter works
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Set up your event, manage teams, and publish live updates in three clear steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {HOW_IT_WORKS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-secondary-900/70 p-4 sm:p-5 space-y-2"
              >
                <p className="text-xs font-semibold tracking-[0.12em] text-emerald-600">
                  STEP {item.step}
                </p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 space-y-6">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Common questions from organizers searching for the best live score and tournament app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {FAQS.map((faq) => (
            <article
              key={faq.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-secondary-950/60 p-4 sm:p-5 space-y-2"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Start your next tournament with MatchMeter
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Launch a professional tournament experience with fixtures, live scores,
          and team management in one platform.
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
