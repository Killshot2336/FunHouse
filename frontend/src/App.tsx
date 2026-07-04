import { useAuthStore } from './stores';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
  const { user } = useAuthStore();

  if (!user) return <LoginPage />;

  return (
    <ThemeProvider theme={user.theme}>
      <InstallPrompt />
      <Layout />
    </ThemeProvider>
  );
}
