import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiFilter, FiX } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Groceries',
    'Rent',
    'Insurance',
    'Personal Care',
    'Gifts & Donations',
    'Other',
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'];

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        startDate: '',
        endDate: '',
    });

    const [formData, setFormData] = useState({
        amount: '',
        category: 'Food & Dining',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        tags: '',
    });

    useEffect(() => {
        fetchExpenses();
    }, [filters]);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(`${API_URL}/expenses?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpenses(response.data.data || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            };

            if (editingExpense) {
                await axios.put(`${API_URL}/expenses/${editingExpense._id}`, expenseData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(`${API_URL}/expenses`, expenseData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setShowModal(false);
            setEditingExpense(null);
            resetForm();
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            alert(error.response?.data?.message || 'Failed to save expense');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            date: new Date(expense.date).toISOString().split('T')[0],
            paymentMethod: expense.paymentMethod,
            tags: expense.tags?.join(', ') || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense');
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/expenses/export/csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export expenses');
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            category: 'Food & Dining',
            description: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            tags: '',
        });
    };

    const clearFilters = () => {
        setFilters({ category: '', startDate: '', endDate: '' });
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Expenses
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and manage your expenses
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} className="btn btn-secondary flex items-center gap-2">
                        <FiDownload /> Export CSV
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingExpense(null);
                            setShowModal(true);
                        }}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <FiPlus /> Add Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <FiFilter className="text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                    </div>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="input max-w-xs"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="input max-w-xs"
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="input max-w-xs"
                        placeholder="End Date"
                    />

                    {(filters.category || filters.startDate || filters.endDate) && (
                        <button onClick={clearFilters} className="btn btn-secondary flex items-center gap-2">
                            <FiX /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-white/80 text-sm">Total Expenses</p>
                        <p className="text-3xl font-bold">₹{totalExpenses.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white/80 text-sm">Count</p>
                        <p className="text-2xl font-bold">{expenses.length}</p>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="card">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading expenses...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">No expenses found</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary mt-4"
                        >
                            Add Your First Expense
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Payment</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                                            {expense.description}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="badge badge-info">{expense.category}</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {expense.paymentMethod}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                                            ₹{expense.amount.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingExpense(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input"
                                    required
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Payment Method</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="input"
                                    required
                                >
                                    {PAYMENT_METHODS.map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="input"
                                    placeholder="e.g., work, lunch, meeting"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingExpense ? 'Update' : 'Add'} Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingExpense(null);
                                        resetForm();
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
