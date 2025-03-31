import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PublicNavbar from '../components/PublicNavbar';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting data fetch');
        const [categoriesRes, servicesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/services/featured')
        ]);
        
        setCategories(categoriesRes.data.categories || []);
        
        // Handle both array and object responses for services
        const servicesData = servicesRes.data.services || servicesRes.data || [];
        console.log('Raw services response:', servicesRes.data);
        console.log('Processed services:', servicesData);
        setFeaturedServices(servicesData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setFeaturedServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add debug output
  console.log('Current featuredServices:', featuredServices);

  // Handle carousel navigation
  const nextSlide = () => {
    setActiveSlide((prev) => (prev === featuredServices.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? featuredServices.length - 1 : prev - 1));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Services Debug */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4">
            <div className="w-full">
              <small className="text-gray-400 text-xs">
                Featured Services Count: {featuredServices.length}
              </small>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-xl mb-16 overflow-hidden">
          <div className="px-8 py-16 md:px-16 md:flex items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome to ServiceHub</h1>
              <p className="text-indigo-100 text-xl mb-8">Find trusted service providers for all your needs</p>
              <div className="space-x-4">
                <Link to="/register" className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium py-3 px-6 rounded-lg shadow-md transition duration-200">
                  Get Started
                </Link>
                <Link to="/login" className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3 px-6 rounded-lg transition duration-200">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 md:flex justify-end">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Service hub illustration" 
                className="rounded-lg shadow-lg w-full md:max-w-md object-cover"
              />
            </div>
          </div>
        </div>

        {/* Featured Services Section */}
        {Array.isArray(featuredServices) && featuredServices.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
              <span className="bg-indigo-600 h-8 w-2 rounded-full mr-3"></span>
              Featured Services
            </h2>
            
            <div className="relative">
              <div className="overflow-hidden rounded-2xl shadow-lg">
                {featuredServices.map((service, index) => (
                  <div 
                    key={service._id} 
                    className={`transition-opacity duration-300 ${
                      index === activeSlide ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="bg-white overflow-hidden">
                      <div className="md:flex">
                        <div className="md:w-1/2">
                          <img 
                            src={service.imageUrl || 'https://via.placeholder.com/500x300'} 
                            className="w-full h-64 md:h-full object-cover" 
                            alt={service.title}
                          />
                        </div>
                        <div className="md:w-1/2">
                          <div className="p-8">
                            <div className="flex items-center mb-4">
                              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium py-1 px-2 rounded">
                                {service.category?.name || 'Service'}
                              </span>
                              <span className="text-gray-500 text-sm ml-3">By {service.provider?.name || 'Provider'}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">{service.title}</h3>
                            <p className="text-gray-600 mb-6">{service.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-indigo-600">
                                ₹{service.price}
                              </p>
                              <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition duration-200">
                                Book Now
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Carousel controls */}
              {featuredServices.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {featuredServices.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === activeSlide ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {featuredServices.length > 1 && (
                <>
                  <button 
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors" 
                    onClick={prevSlide}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="sr-only">Previous</span>
                  </button>
                  <button 
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors" 
                    onClick={nextSlide}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="sr-only">Next</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
            <span className="bg-indigo-600 h-8 w-2 rounded-full mr-3"></span>
            Service Categories
          </h2>
          
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <div key={category._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      {category.icon && (
                        <div className="bg-indigo-100 p-4 rounded-lg">
                          <i className={`bi bi-${category.icon} text-2xl text-indigo-600`}></i>
                        </div>
                      )}
                      <h3 className="text-xl font-bold ml-4 text-gray-800">{category.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{category.description}</p>
                    <Link 
                      to="/login" 
                      className="flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                    >
                      Browse Services
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No categories available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;