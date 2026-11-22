import { RouterProvider } from 'react-router-dom';
import { Snowfall } from '@/components/effects/Snowfall';
import { Toaster } from '@/components/ui/Toast';
import { Providers } from './providers';
import { router } from './router';

export default function App() {
  return (
    <Providers>
      <Snowfall />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster />
    </Providers>
  );
}
