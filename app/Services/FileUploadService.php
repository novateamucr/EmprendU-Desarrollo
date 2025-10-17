<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Upload a file to the specified disk
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string $disk
     * @return string|null
     */
    public function upload(UploadedFile $file, string $directory = 'products', string $disk = 'public'): ?string
    {
        try {
            // Ensure the directory exists
            if (!Storage::disk($disk)->exists($directory)) {
                Storage::disk($disk)->makeDirectory($directory, 0755, true);
            }

            // Generate a unique filename with original extension
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            
            // Store the file
            $path = $file->storeAs(
                $directory,
                $filename,
                $disk
            );

            if (!$path) {
                throw new \Exception('Failed to store file');
            }

            // Get the full public URL
            $fullPath = Storage::disk($disk)->path($path);
            \Log::info('File stored', [
                'path' => $path,
                'full_path' => $fullPath,
                'exists' => file_exists($fullPath),
                'size' => $file->getSize()
            ]);

            // Return the public URL
            return url(Storage::disk($disk)->url($path));
        } catch (\Exception $e) {
            \Log::error('File upload failed', [
                'error' => $e->getMessage(),
                'file' => [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType()
                ]
            ]);
            return null;
        }
    }

    /**
     * Delete a file from storage
     *
     * @param string|null $url
     * @param string $disk
     * @return bool
     */
    public function delete(?string $url, string $disk = 'public'): bool
    {
        if (empty($url)) {
            return false;
        }

        try {
            $path = $this->getPathFromUrl($url);
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }
            return false;
        } catch (\Exception $e) {
            \Log::error('File deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Extract the storage path from a public URL
     *
     * @param string $url
     * @return string
     */
    protected function getPathFromUrl(string $url): string
    {
        $basePath = parse_url(Storage::url(''), PHP_URL_PATH);
        $urlPath = parse_url($url, PHP_URL_PATH);
        
        // Remove the base path from the URL to get the storage path
        return ltrim(str_replace($basePath, '', $urlPath), '/');
    }
}
