import { useState } from 'react';
import { Link } from 'react-router-dom';

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white font-bold text-2xl tracking-tight drop-shadow-md">ServiceHub</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <Link 
              to="/register" 
              className="px-4 py-2 text-white font-medium rounded-lg hover:bg-teal-800 transition-all duration-200 ease-in-out"
            >
              Register
            </Link>
            <Link 
              to="/login" 
              className="ml-2 px-5 py-2 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              Login
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20 focus:outline-none transition-all duration-200"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-2 px-4 border-t border-teal-400 border-opacity-50 bg-teal-600 bg-opacity-50">
          <Link
            to="/register"
            className="block px-4 py-2.5 rounded-md text-white font-medium hover:bg-teal-800 transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            Register
          </Link>
          <Link
            to="/login"
            className="block px-4 py-2.5 rounded-md bg-white text-teal-700 font-semibold hover:bg-teal-50 transition-all duration-200 text-center shadow-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;