import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

export const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalBookings: await Booking.countDocuments({ client: req.user.id }),
      activeBookings: await Booking.countDocuments({ 
        client: req.user.id,
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }),
      completedBookings: await Booking.countDocuments({ 
        client: req.user.id,
        status: 'completed'
      }),
      totalServices: await Service.countDocuments()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};
