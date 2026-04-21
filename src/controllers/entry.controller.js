const Entry = require('../models/Entry');

const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

exports.getEntries = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const {
    status,
    customerId,
    startDate,
    endDate,
    sortBy = 'date',
    order = 'desc',
    page = 1,
    limit = 500, // Increased limit to easily fetch all for a mobile device
  } = req.query;

  const filter = {};

  if (status && ['paid', 'pending'].includes(status)) {
    filter.paymentStatus = status;
  }

  if (customerId) {
    filter.customerId = customerId;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [entries, total] = await Promise.all([
    Entry.find(filter)
      .populate('customerId', 'name phone profilePhoto')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Entry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Entries fetched',
    data: entries,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

exports.createEntry = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const { customerId, workType, quantity, rate, date, paymentStatus, notes } =
    req.body;

  const entry = await Entry.create({
    userId,
    customerId,
    workType,
    quantity,
    rate,
    date: date || new Date(),
    paymentStatus: paymentStatus || 'pending',
    notes,
  });

  const populatedEntry = await Entry.findById(entry._id).populate('customerId', 'name phone profilePhoto');

  sendSuccess(res, populatedEntry, 'Entry created successfully', 201);
};

exports.getEntry = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const entry = await Entry.findOne({ _id: req.params.id, userId }).populate('customerId', 'name phone profilePhoto');
  if (!entry) return sendError(res, 'Entry not found', 404);
  sendSuccess(res, entry);
};

exports.updateEntry = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const { customerId, workType, quantity, rate, date, paymentStatus, notes } =
    req.body;

  const entry = await Entry.findOneAndUpdate(
    { _id: req.params.id, userId },
    { customerId, workType, quantity, rate, date, paymentStatus, notes },
    { new: true, runValidators: true }
  ).populate('customerId', 'name phone profilePhoto');

  if (!entry) return sendError(res, 'Entry not found', 404);

  entry.totalAmount = entry.quantity * entry.rate;
  await entry.save();

  sendSuccess(res, entry, 'Entry updated successfully');
};

exports.deleteEntry = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId });
  if (!entry) return sendError(res, 'Entry not found', 404);
  sendSuccess(res, { id: req.params.id }, 'Entry deleted successfully');
};

exports.getStats = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayStats, monthStats, pendingStats, totalEntries] =
    await Promise.all([
      Entry.aggregate([
        { $match: { date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Entry.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Entry.aggregate([
        { $match: { paymentStatus: 'pending' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Entry.countDocuments({}),
    ]);

  sendSuccess(res, {
    todayEarnings: todayStats[0]?.total || 0,
    monthlyIncome: monthStats[0]?.total || 0,
    pendingPayments: pendingStats[0]?.total || 0,
    pendingCount: pendingStats[0]?.count || 0,
    totalEntries,
  });
};
