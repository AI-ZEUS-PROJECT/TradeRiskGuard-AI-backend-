"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
    FileText,
    LayoutDashboard,
    Calendar,
    BarChart2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    ArrowRight
} from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, AnalysisSummaryItem } from "@/lib/api"

export default function HistoryPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    const [analyses, setAnalyses] = useState<AnalysisSummaryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/signin")
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (!isAuthenticated) return

        const fetchHistory = async () => {
            try {
                setLoading(true)
                const res = await apiClient.listAnalyses({ limit: 50 })
                if (res.success && res.data) {
                    setAnalyses(res.data.analyses)
                } else {
                    setError(res.error || "Failed to load history")
                }
            } catch (e) {
                setError("An unexpected error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [isAuthenticated])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage your past trading risk analyses.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        New Analysis
                    </Button>
                </div>

                {error && (
                    <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recent Analyses
                        </CardTitle>
                        <CardDescription>
                            A record of all your processed trading data files.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analyses.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-4 text-lg font-semibold">No analyses found</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                                    You haven't analyzed any trading data yet. Upload a CSV or connect an account to get started.
                                </p>
                                <Button onClick={() => router.push("/dashboard")}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>File / Source</TableHead>
                                            <TableHead className="text-center">Trades</TableHead>
                                            <TableHead className="text-center">Risk Score</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analyses.map((item) => (
                                            <TableRow key={item.id} className="group">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {format(new Date(item.created_at), "MMM d, yyyy HH:mm")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        <span className="truncate max-w-[200px]" title={item.filename}>
                                                            {item.filename}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="font-mono">
                                                        {item.trade_count}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.score !== undefined && item.score !== null ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className={`font-bold ${item.score >= 80 ? 'text-green-600' :
                                                                    item.score >= 60 ? 'text-amber-600' :
                                                                        'text-red-600'
                                                                }`}>
                                                                {item.score}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">/ 100</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {item.status === 'completed' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        )}
                                                        <span className="capitalize text-sm">{item.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/dashboard?analysisId=${item.id}`)}
                                                            className="h-8 w-8 p-0"
                                                            title="View Dashboard"
                                                        >
                                                            <LayoutDashboard className="h-4 w-4" />
                                                            <span className="sr-only">Dashboard</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/report?analysisId=${item.id}`)}
                                                            className="h-8 w-8 p-0"
                                                            title="View Report"
                                                        >
                                                            <ArrowRight className="h-4 w-4" />
                                                            <span className="sr-only">Report</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    )
}
