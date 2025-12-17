<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private const MAX_FILE_SIZES = [
        'image' => 50 * 1024 * 1024,      // 50MB
        'video' => 200 * 1024 * 1024,     // 200MB
        '3d_model' => 100 * 1024 * 1024,  // 100MB
    ];

    private const ALLOWED_MIMES = [
        'image' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'video' => ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
        '3d_model' => ['model/gltf-binary', 'model/gltf+json', 'model/obj', 'application/octet-stream'],
    ];

    /**
     * Upload file to Cloudflare R2
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'type' => 'required|in:image,video,3d_model',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');

        // Validate file size
        if ($file->getSize() > self::MAX_FILE_SIZES[$type]) {
            return response()->json([
                'message' => 'File size exceeds maximum allowed size',
                'max_size' => $this->formatBytes(self::MAX_FILE_SIZES[$type]),
            ], 413);
        }

        // Validate MIME type
        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES[$type])) {
            return response()->json([
                'message' => 'Invalid file type',
                'allowed_types' => self::ALLOWED_MIMES[$type],
            ], 422);
        }

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        // Map type to directory name
        $directory = match($type) {
            'image' => 'image',
            'video' => 'video',
            '3d_model' => '3d',
        };

        $path = "{$directory}/{$filename}";

        // Upload to R2
        $uploaded = Storage::disk('r2')->put($path, file_get_contents($file->getRealPath()), 'public');

        if (!$uploaded) {
            return response()->json(['message' => 'Upload failed'], 500);
        }

        return response()->json([
            'url' => Storage::disk('r2')->url($path),
            'key' => $path,
            'type' => $type,
        ], 201);
    }

    /**
     * Delete file from Cloudflare R2
     */
    public function delete(Request $request, string $key)
    {
        if (!Storage::disk('r2')->exists($key)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        Storage::disk('r2')->delete($key);

        return response()->json(['message' => 'File deleted successfully'], 200);
    }

    /**
     * Format bytes to human-readable size
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
