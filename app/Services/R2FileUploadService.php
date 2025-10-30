<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Carbon\Carbon;

class R2FileUploadService
{
    /**
     * Upload a file to R2 storage with organized directory structure
     *
     * @param UploadedFile $file
     * @param string $type The type of file (e.g., 'users', 'products', 'entrepreneurships')
     * @param string|null $subfolder Optional subfolder for further organization
     * @param string|null $customFilename Optional custom filename (without extension)
     * @return array|null Returns array with 'url' and 'path' or null on failure
     */
    public function upload(
        UploadedFile $file, 
        string $type, 
        ?string $subfolder = null,
        ?string $customFilename = null
    ): ?array {
        try {
            // Validate file type
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            // Create organized path: type/year/month/random_filename.extension
            $date = Carbon::now();
            $year = $date->format('Y');
            $month = $date->format('m');
            
            // Generate filename if not provided
            $filename = $customFilename ?? Str::random(32);
            $filename = Str::slug($filename) . '.' . $extension;
            
            // Build path components
            $pathComponents = array_filter([
                $type,
                $year,
                $month,
                $subfolder,
                $filename
            ]);
            
            $path = implode('/', $pathComponents);
            
            // Ensure the file content is read correctly
            $fileContent = file_get_contents($file->getRealPath());
            
            // Upload to R2
            $uploaded = Storage::disk('r2')->put(
                $path,
                $fileContent,
                [
                    'visibility' => 'public',
                    'ContentType' => $mimeType,
                ]
            );
            
            if ($uploaded) {
                // Generate the public URL using the public R2 domain
                $publicUrl = 'https://pub-ea6620d5c362488b87b87d8594614290.r2.dev/' . $path;
                
                return [
                    'url' => $publicUrl,
                    'path' => $path
                ];
            }
            
            return null;
        } catch (\Exception $e) {
            \Log::error('R2 Upload Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a file from R2 storage
     *
     * @param string|null $url The full URL of the file to delete
     * @param string|null $path Direct path to the file (alternative to URL)
     * @return bool
     */
    public function delete(?string $url = null, ?string $path = null): bool
    {
        try {
            // If path is not provided, try to extract it from URL
            if (empty($path) && !empty($url)) {
                // Remove the public URL prefix to get the path
                $publicUrl = 'https://pub-ea6620d5c362488b87b87d8594614290.r2.dev/';
                $path = str_replace($publicUrl, '', $url);
            }
            
            if (empty($path)) {
                return false;
            }
            
            // Clean up any URL parameters or fragments
            $path = explode('?', $path)[0];
            $path = explode('#', $path)[0];
            
            if (Storage::disk('r2')->exists($path)) {
                return Storage::disk('r2')->delete($path);
            }
            
            return false;
        } catch (\Exception $e) {
            \Log::error('R2 Delete Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate a public URL for a file
     *
     * @param string $path The path to the file in the bucket
     * @return string|null The public URL or null if invalid
     */
    public function getUrl(string $path): ?string
    {
        try {
            return Storage::disk('r2')->url($path);
        } catch (\Exception $e) {
            \Log::error('R2 Get URL Error: ' . $e->getMessage());
            return null;
        }
    }
}
