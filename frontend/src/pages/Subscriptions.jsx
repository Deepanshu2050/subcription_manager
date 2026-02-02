import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiX, FiRefreshCw } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const BILLING_CYCLES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const CATEGORIES = ['Entertainment', 'Software', 'Cloud Services', 'News & Media', 'Fitness', 'Education', 'Music', 'Gaming', 'Other'];

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, cancelled

    const [formData, setFormData] = useState({
        serviceName: '',
        cost: '',
        billingCycle: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextBillingDate: '',
        category: 'Entertainment',
        description: '',
        reminderDays: 3,
    });

    useEffect(() => {
        fetchSubscriptions();
    }, [filter]);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await axios.get(`${API_URL}/subscriptions${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubscriptions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const subscriptionData = {
                ...formData,
                cost: parseFloat(formData.cost),
                reminderDays: parseInt(formData.reminderDays),
            };

            if (editingSubscription) {
                await axios.put(`${API_URL}/subscriptions/${editingSubscription._id}`, subscriptionData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(`${API_URL}/subscriptions`, subscriptionData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setShowModal(false);
            setEditingSubscription(null);
            resetForm();
            fetchSubscriptions();
        } catch (error) {
            console.error('Error saving subscription:', error);
            alert(error.response?.data?.message || 'Failed to save subscription');
        }
    };

    const handleEdit = (subscription) => {
        setEditingSubscription(subscription);
        setFormData({
            serviceName: subscription.serviceName,
            cost: subscription.cost,
            billingCycle: subscription.billingCycle,
            startDate: new Date(subscription.startDate).toISOString().split('T')[0],
            nextBillingDate: new Date(subscription.nextBillingDate).toISOString().split('T')[0],
            category: subscription.category,
            description: subscription.description || '',
            reminderDays: subscription.reminderDays,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this subscription?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/subscriptions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSubscriptions();
        } catch (error) {
            console.error('Error deleting subscription:', error);
            alert('Failed to delete subscription');
        }
    };

    const handleRenew = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/subscriptions/${id}/renew`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSubscriptions();
        } catch (error) {
            console.error('Error renewing subscription:', error);
            alert('Failed to renew subscription');
        }
    };

    const resetForm = () => {
        setFormData({
            serviceName: '',
            cost: '',
            billingCycle: 'Monthly',
            startDate: new Date().toISOString().split('T')[0],
            nextBillingDate: '',
            category: 'Entertainment',
            description: '',
            reminderDays: 3,
        });
    };

    const getDaysUntilRenewal = (nextBillingDate) => {
        const days = Math.ceil((new Date(nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getStatusBadge = (status) => {
        if (status === 'active') return 'badge-success';
        if (status === 'cancelled') return 'badge-danger';
        return 'badge-warning';
    };

    const totalMonthlyCost = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => {
            const multiplier = {
                'Daily': 30,
                'Weekly': 4.33,
                'Monthly': 1,
                'Quarterly': 0.33,
                'Yearly': 0.083
            }[sub.billingCycle] || 1;
            return sum + (sub.cost * multiplier);
        }, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Subscriptions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your recurring subscriptions
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingSubscription(null);
                        setShowModal(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <FiPlus /> Add Subscription
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('cancelled')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'cancelled'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    Cancelled
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white">
                    <p className="text-white/80 text-sm">Monthly Cost</p>
                    <p className="text-3xl font-bold">₹{totalMonthlyCost.toFixed(2)}</p>
                </div>
                <div className="card bg-gradient-to-r from-success-500 to-green-600 text-white">
                    <p className="text-white/80 text-sm">Active Subscriptions</p>
                    <p className="text-3xl font-bold">
                        {subscriptions.filter(s => s.status === 'active').length}
                    </p>
                </div>
                <div className="card bg-gradient-to-r from-warning-500 to-orange-600 text-white">
                    <p className="text-white/80 text-sm">Yearly Cost</p>
                    <p className="text-3xl font-bold">₹{(totalMonthlyCost * 12).toFixed(2)}</p>
                </div>
            </div>

            {/* Subscriptions Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="card text-center py-12">
                    <FiCreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No subscriptions found</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        Add Your First Subscription
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map((subscription) => {
                        const daysUntil = getDaysUntilRenewal(subscription.nextBillingDate);
                        const isActive = subscription.status?.toLowerCase() === 'active';
                        return (
                            <div key={subscription._id} className="card card-hover">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {subscription.serviceName}
                                            </h3>
                                            {isActive && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${daysUntil <= 3
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : daysUntil <= 7
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {daysUntil > 0 ? `${daysUntil} days` : 'Due today'}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`badge ${getStatusBadge(subscription.status)}`}>
                                            {subscription.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(subscription)}
                                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subscription._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Cost</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            ₹{subscription.cost} / {subscription.billingCycle}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Category</span>
                                        <span className="badge badge-info">{subscription.category}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Next Billing</span>
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {new Date(subscription.nextBillingDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {subscription.status === 'active' && (
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className={`text-sm font-medium ${daysUntil <= 3 ? 'text-red-600' : daysUntil <= 7 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                {daysUntil > 0 ? `Renews in ${daysUntil} days` : 'Renewal due'}
                                            </div>
                                        </div>
                                    )}

                                    {subscription.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                                            {subscription.description}
                                        </p>
                                    )}

                                    {subscription.status === 'active' && (
                                        <button
                                            onClick={() => handleRenew(subscription._id)}
                                            className="btn btn-secondary w-full flex items-center justify-center gap-2 mt-4"
                                        >
                                            <FiRefreshCw /> Mark as Renewed
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingSubscription(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Service Name</label>
                                <input
                                    type="text"
                                    value={formData.serviceName}
                                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Netflix, Spotify"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Billing Cycle</label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                    className="input"
                                    required
                                >
                                    {BILLING_CYCLES.map((cycle) => (
                                        <option key={cycle} value={cycle}>{cycle}</option>
                                    ))}
                                </select>
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
                                <label className="label">Next Billing Date</label>
                                <input
                                    type="date"
                                    value={formData.nextBillingDate}
                                    onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Reminder Days Before</label>
                                <input
                                    type="number"
                                    value={formData.reminderDays}
                                    onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
                                    className="input"
                                    min="1"
                                    max="30"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    rows="3"
                                    placeholder="Add notes about this subscription"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingSubscription ? 'Update' : 'Add'} Subscription
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingSubscription(null);
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

export default Subscriptions;
