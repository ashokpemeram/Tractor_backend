const Customer = require('../models/Customer');
const Entry = require('../models/Entry');

const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

exports.getCustomers = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const customers = await Customer.find({}).sort({ name: 1 });
  sendSuccess(res, customers);
};

exports.createCustomer = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const { name, phone, profilePhoto } = req.body;
  const customer = await Customer.create({ userId, name, phone, profilePhoto });
  
  sendSuccess(res, customer, 'Customer created successfully', 201);
};

exports.updateCustomer = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!customer) return sendError(res, 'Customer not found', 404);
  sendSuccess(res, customer, 'Customer updated successfully');
};

exports.deleteCustomer = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return sendError(res, 'User ID is required in headers', 401);

  // Check if entries exist
  const entriesCount = await Entry.countDocuments({ customerId: req.params.id, userId });
  if (entriesCount > 0) {
    return sendError(res, 'Cannot delete customer. They have existing work entries.', 400);
  }

  const customer = await Customer.findOneAndDelete({ _id: req.params.id, userId });
  if (!customer) return sendError(res, 'Customer not found', 404);
  
  sendSuccess(res, { id: req.params.id }, 'Customer deleted successfully');
};
