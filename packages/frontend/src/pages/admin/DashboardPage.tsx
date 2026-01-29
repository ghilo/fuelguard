import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  Car,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cylinder,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, Button, Badge, PageLoader } from '@/components/ui';
import { adminApi } from '@/services/api';
import type { OverviewStats, DailyStats } from '@/types';

const COLORS = ['#F77B01', '#016C2C', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function AdminDashboardPage() {
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getOverview(),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['admin-daily-stats'],
    queryFn: () => adminApi.getDailyStats(14),
  });

  const { data: vehicleDistData } = useQuery({
    queryKey: ['admin-vehicle-distribution'],
    queryFn: () => adminApi.getVehicleDistribution(),
  });

  const { data: fraudData } = useQuery({
    queryKey: ['admin-fraud-attempts'],
    queryFn: () => adminApi.getFraudAttempts(5),
  });

  if (overviewLoading) return <PageLoader />;

  const stats: OverviewStats = overviewData?.data?.stats || {
    totalStations: 0,
    totalVehicles: 0,
    totalHouseholds: 0,
    todayTransactions: 0,
    todayApproved: 0,
    todayDenied: 0,
    weeklyTransactions: 0,
    weeklyFraudAttempts: 0,
  };

  const dailyStats: DailyStats[] = dailyData?.data?.stats || [];
  const vehicleByType = vehicleDistData?.data?.byType || [];
  const fraudAttempts = fraudData?.data?.attempts || [];

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRIVATE_CAR: 'Private Cars',
      TAXI: 'Taxis',
      TRUCK: 'Trucks',
      MOTORCYCLE: 'Motorcycles',
      BUS: 'Buses',
      GOVERNMENT: 'Government',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStations}</p>
            <p className="text-sm text-gray-500">Active Stations</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-success-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
            <p className="text-sm text-gray-500">Registered Vehicles</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
            <Cylinder className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalHouseholds}</p>
            <p className="text-sm text-gray-500">Gas Bottles</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-danger-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-danger-600">{stats.weeklyFraudAttempts}</p>
            <p className="text-sm text-gray-500">Weekly Denials</p>
          </div>
        </Card>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <p className="text-sm text-gray-500 mb-1">Today's Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.todayTransactions}</p>
        </Card>
        <Card className="border-l-4 border-l-success-500">
          <p className="text-sm text-gray-500 mb-1">Today Approved</p>
          <p className="text-3xl font-bold text-success-600">{stats.todayApproved}</p>
        </Card>
        <Card className="border-l-4 border-l-danger-500">
          <p className="text-sm text-gray-500 mb-1">Today Denied</p>
          <p className="text-3xl font-bold text-danger-600">{stats.todayDenied}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Trends Chart */}
        <Card>
          <CardHeader title="Transaction Trends" subtitle="Last 14 days" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  stackId="1"
                  stroke="#016C2C"
                  fill="#016C2C"
                  fillOpacity={0.6}
                  name="Approved"
                />
                <Area
                  type="monotone"
                  dataKey="denied"
                  stackId="1"
                  stroke="#F77B01"
                  fill="#F77B01"
                  fillOpacity={0.6}
                  name="Denied"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vehicle Distribution */}
        <Card>
          <CardHeader title="Vehicle Distribution" subtitle="By type" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleByType.map((v: { vehicleType: string; count: number }) => ({
                    name: getVehicleTypeLabel(v.vehicleType),
                    value: v.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleByType.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicleByType.map((v: { vehicleType: string; count: number }, index: number) => (
              <Badge key={v.vehicleType} style={{ backgroundColor: COLORS[index % COLORS.length] + '20', color: COLORS[index % COLORS.length] }}>
                {getVehicleTypeLabel(v.vehicleType)}: {v.count}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Fraud Attempts */}
      <Card>
        <CardHeader
          title="Recent Fraud Attempts"
          subtitle="Latest denied transactions"
          action={
            <Link to="/admin/analytics">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }
        />
        {fraudAttempts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success-300 mx-auto mb-3" />
            <p className="text-gray-500">No fraud attempts recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fraudAttempts.map((attempt: any) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 bg-danger-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{attempt.vehicle?.plateNumber}</p>
                    <p className="text-sm text-gray-500">
                      {attempt.vehicle?.owner?.fullName} - {attempt.station?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-danger-600 font-medium">{attempt.denialReason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
