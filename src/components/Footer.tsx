// components/Footer.tsx
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900/50 text-white py-6 mt-auto text-center">
  <div className="w-full max-w mx-auto px-4 text-center">
    <p className="text-sm" suppressHydrationWarning>
      &copy; {new Date().getFullYear()} MyApp. All rights reserved.
    </p>
    <ul className="flex justify-center mt-4 space-x-6">
      <li>
        <a href="/privacy" className="hover:text-gray-300">
          Privacy Policy
        </a>
      </li>
      <li>
        <a href="/terms" className="hover:text-gray-300">
          Terms of Service
        </a>
      </li>
    </ul>
  </div>
</footer>
  );
};

export default Footer;