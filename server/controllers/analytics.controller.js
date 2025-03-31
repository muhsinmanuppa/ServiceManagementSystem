import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

export const getProviderAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const ytdBookings = await Booking.countDocuments({
      provider: req.user.id,
      scheduledDate: { $gte: startOfYear }
    });

    const ratings = await Booking.aggregate([
      {
        $match: {
          provider: req.user._id,
          'rating.score': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating.score' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const totalCompletedBookings = await Booking.countDocuments({
      provider: req.user.id,
      status: 'completed'
    });

    const stats = {
      todayBookings: await Booking.countDocuments({
        provider: req.user.id,
        scheduledDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      monthlyBookings: await Booking.countDocuments({
        provider: req.user.id,
        scheduledDate: { $gte: startOfMonth }
      }),
      activeServices: await Service.countDocuments({
        provider: req.user.id,
        status: 'active'
      }),
      monthlyRevenue: await Booking.aggregate([
        {
          $match: {
            provider: req.user._id,
            status: 'completed',
            completedDate: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]).then(result => (result[0]?.total || 0)),
      yearToDate: {
        bookings: ytdBookings,
        completionRate: (totalCompletedBookings / ytdBookings) * 100 || 0
      },
      satisfaction: {
        averageRating: ratings[0]?.averageRating || 0,
        totalRatings: ratings[0]?.totalRatings || 0
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

export const getServiceAnalytics = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);

    if (!service || service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const analytics = await Booking.aggregate([
      {
        $match: {
          service: service._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookings: { $sum: 1 },
          revenue: { $sum: "$amount" },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const dateQuery = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    let reportData;
    switch (type) {
      case 'bookings':
        reportData = await Booking.aggregate([
          { $match: { provider: req.user._id, ...dateQuery } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
              revenue: { $sum: "$amount" },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'revenue':
        reportData = await Booking.aggregate([
          { $match: { provider: req.user._id, status: 'completed', ...dateQuery } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedDate" } },
              totalRevenue: { $sum: "$amount" },
              bookings: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      success: true,
      data: reportData,
      period: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating report' });
  }
};
