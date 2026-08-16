import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Store, Megaphone, Calendar, FileText, PlusCircle, ShieldAlert } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { format } from 'date-fns'

import { Route as AdminRoute } from './index'

export const Route = createLazyFileRoute('/_authenticated/admin/')({
  component: AdminDashboardRoute,
})

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_review: '#3b82f6',
  ready: '#6366f1',
  completed: '#10b981',
  rejected: '#ef4444',
}

const formatStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function AdminDashboardRoute() {
  const { stats, docRequestsByStatus, recentActivity } = AdminRoute.useLoaderData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of Barangay Daine portal activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingBusinesses} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Requests</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingDocRequests} pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Published community updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Upcoming scheduled events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingComplaints} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Document Request Status</CardTitle>
            <CardDescription>Distribution of document requests by their current status.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={docRequestsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {docRequestsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [value, formatStatus(name)]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 py-4">
              {docRequestsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[item.status] || '#9ca3af' }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formatStatus(item.status)} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button asChild className="justify-start min-h-[44px]">
                <Link to="/admin/announcements">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage Announcements
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start min-h-[44px]">
                <Link to="/admin/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Events
                </Link>
              </Button>
              <Button asChild variant="destructive" className="justify-start min-h-[44px]">
                <Link to="/admin/complaints">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Review Complaints ({stats.pendingComplaints} pending)
                </Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start min-h-[44px]">
                <Link to="/admin/businesses">
                  <Store className="mr-2 h-4 w-4" />
                  Review Pending Businesses ({stats.pendingBusinesses})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Document Requests</CardTitle>
          <CardDescription>Latest 10 requests from residents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
            ) : (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.profiles?.full_name || 'Unknown Resident'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested a {formatStatus(activity.document_type)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        color: STATUS_COLORS[activity.status] || '#9ca3af',
                        borderColor: STATUS_COLORS[activity.status] || '#9ca3af'
                      }}
                    >
                      {formatStatus(activity.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground min-w-[120px] text-right">
                      {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
