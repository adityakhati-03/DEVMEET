import LoginForm from '../components/login-form';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dm-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <LoginForm />
    </div>
  );
}
