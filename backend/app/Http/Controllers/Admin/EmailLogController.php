<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailLogController extends Controller
{
    /**
     * Display email logs
     */
    public function index(Request $request)
    {
        $query = EmailLog::query()->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by template
        if ($request->filled('template')) {
            $query->where('template_key', $request->template);
        }

        // Search by email
        if ($request->filled('search')) {
            $query->where('recipient_email', 'like', '%' . $request->search . '%');
        }

        $logs = $query->paginate(20)->withQueryString();

        // Get statistics
        $stats = [
            'total' => EmailLog::count(),
            'sent' => EmailLog::sent()->count(),
            'failed' => EmailLog::failed()->count(),
            'pending' => EmailLog::pending()->count(),
        ];

        // Get unique templates for filter
        $templates = EmailLog::select('template_key')
            ->distinct()
            ->pluck('template_key');

        return Inertia::render('Admin/EmailLogs', [
            'logs' => $logs,
            'stats' => $stats,
            'templates' => $templates,
            'filters' => [
                'status' => $request->status,
                'template' => $request->template,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Show single email log details
     */
    public function show($id)
    {
        $log = EmailLog::findOrFail($id);

        return Inertia::render('Admin/EmailLogDetail', [
            'log' => $log,
        ]);
    }

    /**
     * Retry a failed email
     */
    public function retry($id)
    {
        $log = EmailLog::findOrFail($id);

        if ($log->status !== 'failed') {
            return back()->with('error', 'Apenas emails com falha podem ser reenviados');
        }

        // Re-queue the email
        \App\Jobs\SendEmailJob::dispatch(
            $log->template_key,
            $log->recipient_email,
            [], // You might want to store original data in metadata
            array_merge($log->metadata ?? [], ['retry' => true, 'original_log_id' => $log->id])
        );

        return back()->with('success', 'Email adicionado à fila para reenvio');
    }
}
