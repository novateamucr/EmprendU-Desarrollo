<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\Log;

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
    public function upload(UploadedFile $file, string $directory = 'products', string $disk = 'r2'): ?string
    {
        try {
            // Generate a unique filename with original extension
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            
            // Store the file
            $path = $file->storeAs(
                $directory,
                $filename,
                ['disk' => $disk, 'visibility' => 'public']
            );

            if (!$path) {
                throw new Exception('Failed to store file');
            }

            // Get the public URL
            $url = Storage::disk($disk)->url($path);
            
            Log::info('File uploaded to R2', [
                'path' => $path,
                'url' => $url,
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]);

            // Return the full URL
            return $url;
            
        } catch (Exception $e) {
            $errorContext = [
                'error' => $e->getMessage(),
                'file' => [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'extension' => $file->getClientOriginalExtension()
                ],
                'disk_config' => [
                    'driver' => config('filesystems.disks.'.$disk.'.driver'),
                    'bucket' => config('filesystems.disks.'.$disk.'.bucket'),
                    'region' => config('filesystems.disks.'.$disk.'.region'),
                    'endpoint' => config('filesystems.disks.'.$disk.'.endpoint'),
                    'use_path_style_endpoint' => config('filesystems.disks.'.$disk.'.use_path_style_endpoint')
                ],
                'trace' => $e->getTraceAsString()
            ];
            
            Log::error('File upload failed', $errorContext);
            
            // Also log to error log for easier debugging
            error_log('File upload error: ' . json_encode($errorContext, JSON_PRETTY_PRINT));
            
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
    public function delete(?string $url, string $disk = 'r2'): bool
    {
        if (empty($url)) {
            return false;
        }

        try {
            $path = $this->getPathFromUrl($url);
            
            // For R2, we need to handle the URL format
            if ($disk === 'r2') {
                $bucket = config('filesystems.disks.r2.bucket');
                $endpoint = config('filesystems.disks.r2.endpoint');
                $baseUrl = str_replace('https://', "https://$bucket.", $endpoint) . '/';
                $path = str_replace($baseUrl, '', $url);
            }
            
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }
            
            Log::warning('File not found for deletion', [
                'url' => $url,
                'path' => $path,
                'disk' => $disk
            ]);
            
            return false;
            
        } catch (Exception $e) {
            Log::error('File deletion failed', [
                'error' => $e->getMessage(),
                'url' => $url,
                'disk' => $disk,
                'trace' => $e->getTraceAsString()
            ]);
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
        // For R2, the URL might be the full public URL
        $r2Endpoint = config('filesystems.disks.r2.endpoint');
        $r2Bucket = config('filesystems.disks.r2.bucket');
        $r2BaseUrl = str_replace('https://', "https://$r2Bucket.", $r2Endpoint) . '/';
        
        if (str_starts_with($url, $r2BaseUrl)) {
            return str_replace($r2BaseUrl, '', $url);
        }
        
        // For local storage or other providers
        $basePath = parse_url(Storage::url(''), PHP_URL_PATH);
        $urlPath = parse_url($url, PHP_URL_PATH);
        
        return ltrim(str_replace($basePath, '', $urlPath), '/');
    }
}
