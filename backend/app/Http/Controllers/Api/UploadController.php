<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private const MAX_FILE_SIZES = [
        'image' => 10 * 1024 * 1024,      // 10MB
        'video' => 15 * 1024 * 1024,      // 15MB
        '3d_model' => 20 * 1024 * 1024,   // 20MB
    ];

    private const ALLOWED_MIMES = [
        'image' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'video' => ['video/mp4', 'video/quicktime', 'video/webm'],
        '3d_model' => ['model/gltf-binary', 'application/octet-stream'], // GLB files only for now
    ];

    private const ALLOWED_EXTENSIONS = [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'video' => ['mp4', 'mov', 'webm'],
        '3d_model' => ['glb'], // GLB only - supported by Model3DViewer
    ];

    /**
     * Upload avatar image (public - no authentication required)
     * Used during user registration
     */
    public function uploadAvatar(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|max:5120', // 5MB max for avatars
            ]);

            $file = $request->file('file');

            // Validate MIME type (only images)
            if (!in_array($file->getMimeType(), self::ALLOWED_MIMES['image'])) {
                return response()->json([
                    'message' => 'Invalid file type. Only images are allowed.',
                    'allowed_types' => self::ALLOWED_MIMES['image'],
                ], 422);
            }

            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            if (!$extension) {
                $extension = match($file->getMimeType()) {
                    'image/jpeg', 'image/jpg' => 'jpg',
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    'image/webp' => 'webp',
                    default => 'jpg',
                };
            }

            // Validate extension
            if (!in_array(strtolower($extension), self::ALLOWED_EXTENSIONS['image'])) {
                return response()->json([
                    'message' => 'Invalid file extension',
                    'allowed_extensions' => self::ALLOWED_EXTENSIONS['image'],
                ], 422);
            }

            $filename = Str::uuid() . '.' . $extension;
            $path = "avatars/{$filename}";

            try {
                $fileContent = file_get_contents($file->getRealPath());
                $uploaded = Storage::disk('r2')->put($path, $fileContent);

                if (!$uploaded) {
                    return response()->json(['message' => 'Upload to R2 failed'], 500);
                }

                $url = Storage::disk('r2')->url($path);
            } catch (\Exception $uploadException) {
                return response()->json([
                    'message' => 'R2 upload error: ' . $uploadException->getMessage()
                ], 500);
            }

            return response()->json([
                'url' => $url,
                'key' => $path,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload file to Cloudflare R2
     */
    public function upload(Request $request)
    {
        try {
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
                    'received_type' => $file->getMimeType(),
                ], 422);
            }

            // Generate unique filename
            $extension = $file->getClientOriginalExtension();

            // If no extension, derive from MIME type
            if (!$extension) {
                $extension = match($file->getMimeType()) {
                    'image/jpeg', 'image/jpg' => 'jpg',
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    'image/webp' => 'webp',
                    'video/mp4' => 'mp4',
                    'video/quicktime' => 'mov',
                    'video/webm' => 'webm',
                    'model/gltf-binary' => 'glb',
                    default => 'bin',
                };
            }

            // Validate extension against allowed list
            if (!in_array(strtolower($extension), self::ALLOWED_EXTENSIONS[$type])) {
                return response()->json([
                    'message' => 'Invalid file extension',
                    'allowed_extensions' => self::ALLOWED_EXTENSIONS[$type],
                    'received_extension' => $extension,
                ], 422);
            }

            $filename = Str::uuid() . '.' . $extension;

            $directory = match($type) {
                'image' => 'image',
                'video' => 'video',
                '3d_model' => '3d',
            };

            $path = "{$directory}/{$filename}";

            try {
                $fileContent = file_get_contents($file->getRealPath());
                $uploaded = Storage::disk('r2')->put($path, $fileContent);

                if (!$uploaded) {
                    return response()->json(['message' => 'Upload to R2 failed'], 500);
                }

                $url = Storage::disk('r2')->url($path);
            } catch (\Exception $uploadException) {
                return response()->json([
                    'message' => 'R2 upload error: ' . $uploadException->getMessage()
                ], 500);
            }

            return response()->json([
                'url' => $url,
                'key' => $path,
                'type' => $type,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
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
