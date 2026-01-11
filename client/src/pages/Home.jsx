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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-16 overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="relative px-8 py-16 md:px-16 md:flex items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <span className="text-white text-sm font-semibold">🎉 Welcome to ServiceHub</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  Find Trusted <span className="text-yellow-300">Service Providers</span>
                </h1>
                <p className="text-indigo-100 text-xl mb-8 leading-relaxed">Connect with verified professionals for all your service needs</p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/register" className="bg-white text-indigo-600 hover:bg-yellow-300 hover:text-indigo-700 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                    Sign In
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 md:flex justify-end">
                <div className="grid grid-cols-2 gap-4 opacity-30">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-32"></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-32"></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-32"></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-32"></div>
                </div>
              </div>
            </div>
          </div>

          {Array.isArray(featuredServices) && featuredServices.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-12">
                <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full mb-4">
                  ⭐ FEATURED
                </span>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                  Popular Services
                </h2>
                <p className="text-gray-600 text-lg">Discover our most sought-after services</p>
              </div>
              
              <div className="relative">
                <div className="overflow-hidden rounded-3xl shadow-2xl">
                  {featuredServices.map((service, index) => (
                    <div 
                      key={service._id} 
                      className={`transition-opacity duration-300 ${
                        index === activeSlide ? 'block' : 'hidden'
                      }`}
                    >
                      <div className="bg-white overflow-hidden">
                        <div className="md:flex">
                          <div className="md:w-1/2 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 mix-blend-multiply"></div>
                            <img 
                              src={service.imageUrl || ''} 
                              className="w-full h-64 md:h-full object-cover" 
                              alt={service.title}
                            />
                          </div>
                          <div className="md:w-1/2 bg-gradient-to-br from-white to-indigo-50">
                            <div className="p-8 md:p-12">
                              <div className="flex items-center mb-6">
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-2 px-4 rounded-full">
                                  {service.category?.name || 'Service'}
                                </span>
                                <span className="text-gray-600 text-sm ml-3 font-medium">By {service.provider?.name || 'Provider'}</span>
                              </div>
                              <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{service.title}</h3>
                              <p className="text-gray-700 mb-8 text-lg leading-relaxed">{service.description}</p>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Starting from</p>
                                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    ₹{service.price}
                                  </p>
                                </div>
                                <Link to="/login" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                  Book Now →
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {featuredServices.length > 1 && (
                  <div className="flex justify-center mt-8 space-x-3">
                    {featuredServices.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`h-3 rounded-full transition-all duration-300 ${
                          index === activeSlide ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-12' : 'bg-gray-300 w-3 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                
                {featuredServices.length > 1 && (
                  <>
                    <button 
                      className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 p-3 rounded-full shadow-xl transition-all duration-300 group" 
                      onClick={prevSlide}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="sr-only">Previous</span>
                    </button>
                    <button 
                      className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 p-3 rounded-full shadow-xl transition-all duration-300 group" 
                      onClick={nextSlide}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="sr-only">Next</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="text-center mb-12">
              <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full mb-4">
                📂 CATEGORIES
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Service Categories
              </h2>
              <p className="text-gray-600 text-lg">Explore services by category</p>
            </div>
            
            {error ? (
              <div className="text-center py-12 bg-red-50 rounded-2xl border-2 border-red-200">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-600 text-lg font-semibold">{error}</p>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <div key={category._id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    <div className="p-8">
                      <div className="flex items-center mb-6">
                        {category.icon && (
                          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <i className={`bi bi-${category.icon} text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}></i>
                          </div>
                        )}
                        <h3 className="text-xl font-bold ml-4 text-gray-900 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
                      </div>
                      <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>
                      <Link 
                        to="/login" 
                        className="inline-flex items-center text-indigo-600 font-bold hover:text-purple-600 transition-colors group"
                      >
                        Browse Services
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 text-lg font-medium">No categories available at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Check back soon for updates!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;