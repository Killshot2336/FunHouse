import { useAuthStore } from './stores';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';

export default function App() {
  const { user } = useAuthStore();

  if (!user) return <LoginPage />;

  return (
    <ThemeProvider theme={user.theme}>
      <Layout />
    </ThemeProvider>
  );
}
