import React, { useState, useEffect } from 'react';
import { expenseAPI, subscriptionAPI, budgetAPI } from '../services/api';
import {
    FiDollarSign,
    FiCreditCard,
    FiTrendingUp,
    FiAlertCircle,
    FiArrowUp,
    FiArrowDown,
} from 'react-icons/fi';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalExpenses: 0,
        monthlyExpenses: 0,
        activeSubscriptions: 0,
        monthlySubscriptionCost: 0,
    });
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [upcomingSubscriptions, setUpcomingSubscriptions] = useState([]);
    const [expensesByCategory, setExpensesByCategory] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch monthly expenses summary
            const expenseSummary = await expenseAPI.getSummary('monthly');
            const monthlyData = expenseSummary.data.data;

            // Fetch subscriptions
            const subsResponse = await subscriptionAPI.getAll({ status: 'Active' });
            const subscriptions = subsResponse.data.data;

            // Fetch subscription cost analysis
            const costAnalysis = await subscriptionAPI.getCostAnalysis();

            // Fetch upcoming renewals
            const upcoming = await subscriptionAPI.getUpcoming(7);

            // Fetch budget status
            const budgetResponse = await budgetAPI.getCurrentStatus();
            setBudgetStatus(budgetResponse.data.data);

            // Fetch recent expenses
            const recentResponse = await expenseAPI.getAll({ sortBy: '-date' });
            setRecentExpenses(recentResponse.data.data.slice(0, 5));

            setStats({
                totalExpenses: monthlyData.total,
                monthlyExpenses: monthlyData.count,
                activeSubscriptions: subscriptions.length,
                monthlySubscriptionCost: costAnalysis.data.data.monthlyTotal,
            });

            setExpensesByCategory(monthlyData.byCategory);
            setUpcomingSubscriptions(upcoming.data.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const categoryChartData = {
        labels: Object.keys(expensesByCategory),
        datasets: [
            {
                label: 'Expenses by Category',
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#ec4899',
                    '#06b6d4',
                    '#84cc16',
                ],
                borderWidth: 0,
            },
        ],
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Overview of your financial activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Monthly Expenses
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                                ₹{stats.totalExpenses.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {stats.monthlyExpenses} transactions
                            </p>
                        </div>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                            <FiDollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>
                </div>

                <div className="card card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Active Subscriptions
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                                {stats.activeSubscriptions}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                ₹{stats.monthlySubscriptionCost.toFixed(2)}/month
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <FiCreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {budgetStatus && (
                    <>
                        <div className="card card-hover">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Budget Status
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                                        {budgetStatus.spendingPercentage.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        ₹{budgetStatus.remaining.toFixed(2)} remaining
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${budgetStatus.alertLevel === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900'
                                    : budgetStatus.alertLevel === 'warning'
                                        ? 'bg-yellow-100 dark:bg-yellow-900'
                                        : 'bg-blue-100 dark:bg-blue-900'
                                    }`}>
                                    <FiTrendingUp className={`h-6 w-6 ${budgetStatus.alertLevel === 'critical'
                                        ? 'text-red-600 dark:text-red-400'
                                        : budgetStatus.alertLevel === 'warning'
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                        }`} />
                                </div>
                            </div>
                        </div>

                        <div className="card card-hover">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Budget Limit
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                                        ₹{budgetStatus.totalLimit.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Spent: ₹{budgetStatus.currentSpending.toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <FiAlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                {Object.keys(expensesByCategory).length > 0 && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Expenses by Category
                        </h3>
                        <div className="h-64">
                            <Pie
                                data={categoryChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Recent Expenses */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Recent Expenses
                    </h3>
                    <div className="space-y-3">
                        {recentExpenses.length > 0 ? (
                            recentExpenses.map((expense) => (
                                <div
                                    key={expense._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {expense.description}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            ₹{expense.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No expenses yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Upcoming Subscriptions */}
                {upcomingSubscriptions.length > 0 && (
                    <div className="card lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Upcoming Renewals (Next 7 Days)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingSubscriptions.map((sub) => (
                                <div
                                    key={sub._id}
                                    className="p-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-primary-200 dark:border-gray-600"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {sub.serviceName}
                                        </h4>
                                        <span className="badge badge-info">{sub.billingCycle}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                        ₹{sub.cost.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Renews: {new Date(sub.nextBillingDate).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
