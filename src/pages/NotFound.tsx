import { Link } from 'react-router-dom';
import { Button } from '../components';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-6xl font-bold text-primary">404</div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, the page you're looking for doesn't exist.
        </p>
      </div>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
