import User from '../../models/User.js';
import Booking from '../../models/Booking.js';

export const getAdminStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeProviders,
      pendingVerifications,
      totalRevenue,
      recentActivities
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ 
        role: 'provider',
        status: 'active',
        'verificationStatus.status': 'verified'
      }),
      User.countDocuments({
        role: 'provider',
        'verificationStatus.status': 'pending'
      }),
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            'payment.status': 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      Booking.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('client', 'name')
        .populate('provider', 'name')
        .populate('service', 'title')
        .lean()
        .then(bookings => bookings.map(booking => {
          let description = '';
          
          switch(booking.status) {
            case 'pending':
              description = `New booking request from ${booking.client?.name || 'Unknown Client'} for ${booking.service?.title}`;
              break;
            case 'confirmed':
              description = `Booking confirmed with ${booking.provider?.name} for ${booking.service?.title}`;
              break;
            case 'completed':
              description = `Service completed by ${booking.provider?.name} for ${booking.client?.name}`;
              break;
            case 'cancelled':
              description = `Booking cancelled for ${booking.service?.title}`;
              break;
            case 'in_progress':
              description = `Service in progress by ${booking.provider?.name}`;
              break;
            default:
              description = `Booking status updated to ${booking.status}`;
          }

          return {
            description,
            timestamp: booking.updatedAt || booking.createdAt,
            status: booking.status,
            amount: booking.totalAmount,
            id: booking._id
          };
        }))
    ]);

    res.json({
      totalUsers,
      activeProviders, 
      pendingVerifications,
      totalRevenue,
      recentActivities
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching admin statistics',
      error: error.message 
    });
  }
};
