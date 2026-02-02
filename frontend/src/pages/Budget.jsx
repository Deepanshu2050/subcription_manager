import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiX, FiTrendingUp } from 'react-icons/fi';

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

const Budget = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    const [formData, setFormData] = useState({
        period: 'Monthly',
        totalLimit: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/budgets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBudgets(response.data.data || []);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const budgetData = {
                ...formData,
                totalLimit: parseFloat(formData.totalLimit),
            };

            if (editingBudget) {
                await axios.put(`${API_URL}/budgets/${editingBudget._id}`, budgetData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(`${API_URL}/budgets`, budgetData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setShowModal(false);
            setEditingBudget(null);
            resetForm();
            fetchBudgets();
        } catch (error) {
            console.error('Error saving budget:', error);
            alert(error.response?.data?.message || 'Failed to save budget');
        }
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({
            period: budget.period,
            totalLimit: budget.totalLimit,
            startDate: new Date(budget.startDate).toISOString().split('T')[0],
            endDate: new Date(budget.endDate).toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/budgets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchBudgets();
        } catch (error) {
            console.error('Error deleting budget:', error);
            alert('Failed to delete budget');
        }
    };

    const resetForm = () => {
        setFormData({
            period: 'Monthly',
            totalLimit: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
        });
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-red-600';
        if (percentage >= 80) return 'bg-yellow-600';
        return 'bg-green-600';
    };

    const getAlertBadge = (percentage) => {
        if (percentage >= 100) return { text: 'Over Budget', class: 'badge-danger' };
        if (percentage >= 80) return { text: 'Warning', class: 'badge-warning' };
        return { text: 'On Track', class: 'badge-success' };
    };

    // Find current active budget
    const currentBudget = budgets.find(b => {
        const now = new Date();
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return now >= start && now <= end;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Budget
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Set and track your budget goals
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingBudget(null);
                        setShowModal(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <FiPlus /> Create Budget
                </button>
            </div>

            {/* Current Budget Status */}
            {currentBudget && (
                <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">Current Budget</h2>
                            <p className="text-white/80">{currentBudget.period} Budget</p>
                        </div>
                        <span className={`badge ${getAlertBadge((currentBudget.totalSpent / currentBudget.totalLimit) * 100).class}`}>
                            {getAlertBadge((currentBudget.totalSpent / currentBudget.totalLimit) * 100).text}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-white/80 text-sm">Total Limit</p>
                            <p className="text-2xl font-bold">₹{currentBudget.totalLimit.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm">Spent</p>
                            <p className="text-2xl font-bold">₹{currentBudget.totalSpent.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm">Remaining</p>
                            <p className="text-2xl font-bold">₹{currentBudget.remaining.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-semibold">{((currentBudget.totalSpent / currentBudget.totalLimit) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${getProgressColor((currentBudget.totalSpent / currentBudget.totalLimit) * 100)}`}
                                style={{ width: `${Math.min((currentBudget.totalSpent / currentBudget.totalLimit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Period */}
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
                        <span>Period: {new Date(currentBudget.startDate).toLocaleDateString()} - {new Date(currentBudget.endDate).toLocaleDateString()}</span>
                        {((currentBudget.totalSpent / currentBudget.totalLimit) * 100) >= 80 && (
                            <span className="flex items-center gap-1">
                                <FiAlertCircle /> Alert Active
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* All Budgets */}
            <div className="card">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    All Budgets
                </h3>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading budgets...</p>
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="text-center py-12">
                        <FiTrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">No budgets created yet</p>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary">
                            Create Your First Budget
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {budgets.map((budget) => {
                            const percentage = (budget.totalSpent / budget.totalLimit) * 100;
                            const isActive = new Date() >= new Date(budget.startDate) && new Date() <= new Date(budget.endDate);

                            return (
                                <div key={budget._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                                {budget.period} Budget
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isActive && <span className="badge badge-success">Active</span>}
                                            <button
                                                onClick={() => handleEdit(budget)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(budget._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Limit</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                ₹{budget.totalLimit.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Spent</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                ₹{budget.totalSpent.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                ₹{budget.remaining.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${getProgressColor(percentage)}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {percentage.toFixed(1)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {editingBudget ? 'Edit Budget' : 'Create Budget'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingBudget(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Period</label>
                                <select
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Total Limit (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.totalLimit}
                                    onChange={(e) => setFormData({ ...formData, totalLimit: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingBudget ? 'Update' : 'Create'} Budget
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingBudget(null);
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

export default Budget;
