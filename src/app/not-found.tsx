"use client"
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="text-8xl font-extrabold text-black-600 drop-shadow-md">404</h1>
        <p className="text-3xl text-black-800 mt-4 font-semibold">Page Not Found</p>
        <p className="text-lg text-black-600 mt-2 max-w-md mx-auto">
          Looks like you're lost! The page doesn't exist or has been moved.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Link
        
          href="/"
         
        >
          <Button >
          Back to Home</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;