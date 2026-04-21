import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-9xl font-serif font-bold text-brand-gold/20">404</h1>
        <div className="relative -mt-20">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-ink mb-4">Page Not Found</h2>
          <p className="text-brand-ink/60 max-w-md mx-auto mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="btn-premium btn-gold inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
