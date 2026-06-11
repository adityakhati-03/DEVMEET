import SignupForm from '../components/SignupForm';

export default function SignupPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dm-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <SignupForm />
    </div>
  );
}
