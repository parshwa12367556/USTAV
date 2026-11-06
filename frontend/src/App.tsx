import { Providers } from './app/providers';
import { AppRouter } from './routes/AppRouter';

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
