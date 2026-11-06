import { Spinner } from '../ui/Spinner';

export function LoadingScreen({ message = 'Loading your workspace…' }: { message?: string }) {
  return <div className="loading-screen" role="status"><Spinner /><span>{message}</span></div>;
}
