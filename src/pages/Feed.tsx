import { useEffect, useState } from 'react';
import { useAuth } from '../hooks';
import firestoreService from '../services/firestore.service';
import { Tournament } from '../types/models';
import { Card, CardBody, Badge, Button, Loading } from '../components';
import { MapPin, Calendar, PlayCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (timestamp: number) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return '';
  }
};

const buildEmbedUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    // YouTube regular + Shorts + youtu.be
    if (host.includes('youtube.com')) {
      let videoId = url.searchParams.get('v');
      
      // Handle youtube.com/shorts/VIDEO_ID
      if (!videoId && url.pathname.includes('/shorts/')) {
        videoId = url.pathname.split('/shorts/')[1].split('/')[0];
      } else if (!videoId) {
        videoId = url.pathname.split('/').filter(Boolean).pop();
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }
    if (host === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
      const videoId = url.pathname.split('/').filter(Boolean).pop();
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Google Drive file link -> preview
    if (host.includes('drive.google.com')) {
      const parts = url.pathname.split('/');
      const fileIndex = parts.indexOf('d');
      if (fileIndex !== -1 && parts[fileIndex + 1]) {
        const fileId = parts[fileIndex + 1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return raw;
  } catch {
    return raw;
  }
};

export default function Feed() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await firestoreService.getTournaments();
        setTournaments(list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load feed';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!user) {
    return <Loading fullscreen message="Loading profile..." />;
  }

  if (loading) {
    return <Loading fullscreen message="Loading your feed..." />;
  }

  return (
    <div className="max-w-xl mx-auto pb-24 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 px-1">
        Match feed
      </h1>

      {error && (
        <div className="rounded-lg border border-red-400/60 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {tournaments.length === 0 && !error && (
        <p className="text-sm text-gray-500 px-1">No tournaments yet. Check back soon.</p>
      )}

      {tournaments.map((t) => (
        <Card key={t.id} className="overflow-hidden bg-white/90 dark:bg-secondary-900/90">
          <CardBody className="p-0">
            {t.image && (
              <div className="w-full aspect-video bg-gray-100 dark:bg-secondary-800 overflow-hidden">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {t.sport?.[0] || 'M'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {t.location}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-[0.16em]">
                  {t.sport} • {formatDate(t.startDate)}
                </Badge>
              </div>
              <Link to={`/tournaments/${t.id}`}>
                <Button size="sm" variant="outline" className="text-xs px-3">
                  <Trophy className="h-3 w-3 mr-1" /> View
                </Button>
              </Link>
            </div>

            {t.highlightVideoUrl && (
              <div className="mt-2 flex justify-center w-full bg-black/5 dark:bg-black/20">
                <div 
                  className={`w-full relative ${
                    t.highlightVideoUrl.includes('shorts') || t.highlightVideoUrl.includes('tiktok') || t.highlightVideoUrl.includes('instagram') 
                      ? 'aspect-[9/16] max-w-[400px] mx-auto rounded-xl overflow-hidden shadow-sm' 
                      : 'aspect-video'
                  } bg-black flex items-center justify-center`}
                >
                  <iframe
                    src={buildEmbedUrl(t.highlightVideoUrl)}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={`Highlight for ${t.name}`}
                  />
                </div>
              </div>
            )}

            <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate((t as any).registrationDeadline)} reg deadline
              </span>
              {t.highlightVideoUrl && (
                <span className="inline-flex items-center gap-1">
                  <PlayCircle className="h-3 w-3" /> Highlight clip
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
