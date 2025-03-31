import Service from '../../models/Service.js';

export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find({ status: 'active' })
            .populate('category', 'name')
            .populate('provider', 'name email rating')
            .sort('-createdAt');

        res.json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services'
        });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const service = await Service.findOne({ 
            _id: req.params.id,
            status: 'active'
        })
        .populate('category', 'name')
        .populate('provider', 'name email rating');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.json({
            success: true,
            service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching service'
        });
    }
};

export const getFeaturedServices = async (req, res) => {
    try {
        const services = await Service.find({ 
            status: 'active',
            // Add any featured criteria you need
        })
        .populate('category', 'name')
        .populate('provider', 'name email rating')
        .limit(6);  // Limit to 6 featured services

        res.json({
            success: true,
            services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured services'
        });
    }
};

export const searchServices = async (req, res) => {
    try {
        const { query } = req.query;
        const services = await Service.find({
            status: 'active',
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('category', 'name')
        .populate('provider', 'name email rating');

        res.json({
            success: true,
            services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching services'
        });
    }
};

export const getServiceCalendar = async (req, res) => {
    try {
        const { serviceId } = req.params;
        // Add your calendar logic here
        res.json({
            success: true,
            message: 'Calendar functionality to be implemented'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching service calendar'
        });
    }
};

// Add other methods (getFeaturedServices, searchServices, etc.) as needed
// ...
