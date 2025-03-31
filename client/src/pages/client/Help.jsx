import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import { Link } from 'react-router-dom';

const Help = () => {
  const dispatch = useDispatch();
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.subject || !contactForm.message) {
      dispatch(showNotification({
        message: 'Please fill in all required fields',
        type: 'warning'
      }));
      return;
    }
    
    try {
      setSubmitting(true);
      
      // In a real app, send to API
      // await api.post('/support/contact', contactForm);
      
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(showNotification({
        message: 'Your support request has been submitted. We\'ll respond shortly.',
        type: 'success'
      }));
      
      // Reset form
      setContactForm({
        subject: '',
        message: '',
        priority: 'normal'
      });
    } catch {
      dispatch(showNotification({
        message: 'Failed to submit support request. Please try again.',
        type: 'error'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // Sample FAQ data
  const faqs = [
    {
      id: 1,
      question: 'How do I book a service?',
      answer: 'To book a service, browse through our listings, select a service you need, click "Book Now," choose your preferred date and time, and complete the payment process.'
    },
    {
      id: 2,
      question: 'How do I cancel a booking?',
      answer: 'You can cancel a booking by navigating to "My Bookings" in your dashboard, finding the booking you want to cancel, and clicking the "Cancel" button. Please note that cancellation policies may vary by provider.'
    },
    {
      id: 3,
      question: 'Are service providers vetted?',
      answer: 'Yes, all service providers are vetted through our verification process, which includes identity verification, background checks, and qualification validation where applicable.'
    },
    {
      id: 4,
      question: 'How do I leave a review?',
      answer: 'After a service is completed, you\'ll receive a notification to leave a review. You can also go to "My Bookings," find the completed service, and click "Leave Review."'
    },
    {
      id: 5,
      question: 'What payment methods are accepted?',
      answer: 'We accept major credit/debit cards, PayPal, and in some regions, digital wallets like Apple Pay and Google Pay.'
    },
    {
      id: 6,
      question: 'What if I\'m not satisfied with a service?',
      answer: 'If you\'re not satisfied, please contact the service provider first to resolve the issue. If you can\'t reach a resolution, you can file a complaint through our platform, and our customer support team will assist you.'
    },
  ];

  // Filter FAQs based on search query
  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs;

  return (
    <div className="container-fluid px-0">
      <h3 className="mb-4">Help Center</h3>
      
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Frequently Asked Questions</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <input 
                  type="search" 
                  className="form-control" 
                  placeholder="Search FAQs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredFaqs.length === 0 && (
                <div className="alert alert-info">
                  No FAQs found matching your search query.
                </div>
              )}
              
              <div className="accordion" id="faqAccordion">
                {filteredFaqs.map((faq) => (
                  <div className="accordion-item" key={faq.id}>
                    <h2 className="accordion-header">
                      <button 
                        className="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#faq${faq.id}`}
                      >
                        {faq.question}
                      </button>
                    </h2>
                    <div 
                      id={`faq${faq.id}`} 
                      className="accordion-collapse collapse"
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Popular Articles</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <i className="bi bi-file-text me-2 text-primary"></i>
                  <Link to="#">How to find the right service for your needs</Link>
                </li>
                <li className="list-group-item">
                  <i className="bi bi-file-text me-2 text-primary"></i>
                  <Link to="#">Understanding service provider ratings and reviews</Link>
                </li>
                <li className="list-group-item">
                  <i className="bi bi-file-text me-2 text-primary"></i>
                  <Link to="#">Booking process explained step-by-step</Link>
                </li>
                <li className="list-group-item">
                  <i className="bi bi-file-text me-2 text-primary"></i>
                  <Link to="#">Payment methods and refund policy</Link>
                </li>
                <li className="list-group-item">
                  <i className="bi bi-file-text me-2 text-primary"></i>
                  <Link to="#">How to resolve service disputes</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card sticky-md-top" style={{top: "20px"}}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Contact Support</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleContactSubmit}>
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label">Subject</label>
                  <input 
                    type="text"
                    className="form-control"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea 
                    className="form-control"
                    id="message"
                    name="message"
                    rows="5"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    required
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select
                    className="form-select"
                    id="priority"
                    name="priority"
                    value={contactForm.priority}
                    onChange={handleContactChange}
                  >
                    <option value="low">Low - General Question</option>
                    <option value="normal">Normal - Need Help</option>
                    <option value="high">High - Urgent Issue</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
              
              <hr />
              
              <div className="text-center">
                <p className="mb-2 fw-bold">Other contact options:</p>
                <p className="mb-1">
                  <i className="bi bi-envelope me-2"></i>
                  <a href="mailto:support@example.com">support@example.com</a>
                </p>
                <p className="mb-1">
                  <i className="bi bi-telephone me-2"></i>
                  <a href="tel:+18001234567">+1 800 123 4567</a>
                </p>
                <p className="small text-muted mt-2">
                  Support hours: 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
