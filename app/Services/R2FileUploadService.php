<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Exceptions\SensitiveContentException;

class R2FileUploadService
{
    protected $imageModerationService;

    public function __construct(ImageModerationService $imageModerationService)
    {
        $this->imageModerationService = $imageModerationService;
    }
    
    /**
     * Check if the file is an image and moderate it if needed
     * 
     * @param UploadedFile $file
     * @throws SensitiveContentException If image contains sensitive content
     */
    /**
     * Check if the file is an image and moderate it if needed
     * 
     * @param UploadedFile $file
     * @throws SensitiveContentException If image contains sensitive content or moderation fails
     */
    /**
     * Check if the file is an image and moderate it if needed
     * 
     * @param UploadedFile $file The image file to moderate
     * @throws SensitiveContentException If image contains sensitive content or moderation fails
     * @throws \Exception For other types of errors
     */
    protected function moderateImage(UploadedFile $file): void
    {
        try {
            Log::info('Starting image moderation', [
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]);

            // Get moderation result from the moderation service
            $moderationResult = $this->imageModerationService->checkImage($file);
            
            Log::info('Image moderation result', [
                'safe' => $moderationResult['safe'] ?? null,
                'categories' => $moderationResult['categories'] ?? [],
                'reason' => $moderationResult['reason'] ?? 'No reason provided'
            ]);
            
            // If content is not safe, throw SensitiveContentException
            if (!($moderationResult['safe'] ?? false)) {
                $reason = $moderationResult['reason'] ?? 'Content violates community guidelines';
                $categories = $moderationResult['categories'] ?? [];
                
                Log::warning('Inappropriate content detected', [
                    'categories' => $categories,
                    'reason' => $reason
                ]);
                
                throw new SensitiveContentException($reason);
            }
            
        } catch (SensitiveContentException $e) {
            // Re-throw SensitiveContentException as is
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error during image moderation: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // For moderation service errors, we should fail safely by not allowing the upload
            throw new SensitiveContentException(
                'Unable to verify image content. Please try again or use a different image.'
            );
        }
    }
    /**
     * Upload a file to R2 storage with organized directory structure
     *
     * @param UploadedFile $file
     * @param string $type The type of file (e.g., 'users', 'products', 'entrepreneurships')
     * @param string|null $subfolder Optional subfolder for further organization
     * @param string|null $customFilename Optional custom filename (without extension)
     * @param bool $moderate Whether to moderate the image for sensitive content
     * @return array|null Returns array with 'url' and 'path' or null on failure
     */
    public function upload(
        UploadedFile $file, 
        string $type, 
        ?string $subfolder = null,
        ?string $customFilename = null,
        bool $moderate = true
    ): ?array {
        Log::info('Starting file upload process', [
            'original_name' => $file->getClientOriginalName(),
            'type' => $type,
            'subfolder' => $subfolder,
            'customFilename' => $customFilename,
            'moderate' => $moderate
        ]);
        
        try {
            // Validate file type first
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            Log::info('File validation', [
                'extension' => $extension,
                'mimeType' => $mimeType,
                'size' => $file->getSize(),
                'realPath' => $file->getRealPath(),
                'tempPath' => $file->getPathname()
            ]);
            
            // Check if file is an image and moderate it if needed
            if ($moderate && strpos($mimeType, 'image/') === 0) {
                Log::info('Starting image moderation before upload');
                // Moderate the image before attempting to upload
                $this->moderateImage($file);
                Log::info('Image moderation passed, proceeding with upload');
            }
            
            // Create organized path: type/year/month/filename.extension
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
            if ($fileContent === false) {
                Log::error('Failed to read file content', [
                    'path' => $file->getRealPath(),
                    'error' => error_get_last()
                ]);
                return null;
            }
            
            // Upload to R2
            try {
                $bucket = config('filesystems.disks.r2.bucket');
                $endpoint = config('filesystems.disks.r2.endpoint');
                $key = config('filesystems.disks.r2.key');
                $secret = config('filesystems.disks.r2.secret');
                $region = config('filesystems.disks.r2.region');
                
                Log::info('R2 Configuration', [
                    'bucket' => $bucket,
                    'endpoint' => $endpoint,
                    'region' => $region,
                    'key_exists' => !empty($key),
                    'secret_exists' => !empty($secret)
                ]);

                Log::info('Attempting to upload file to R2', [
                    'path' => $path,
                    'size' => strlen($fileContent),
                    'mime_type' => $mimeType,
                    'bucket' => $bucket,
                    'endpoint' => $endpoint
                ]);
                
                // Test connection first
                try {
                    $exists = Storage::disk('r2')->exists($path);
                    Log::info('R2 connection test', ['can_connect' => true]);
                } catch (\Exception $e) {
                    Log::error('R2 connection failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw new \RuntimeException('Cannot connect to R2 storage: ' . $e->getMessage());
                }
                
                $uploaded = Storage::disk('r2')->put(
                    $path,
                    $fileContent,
                    [
                        'visibility' => 'public',
                        'ContentType' => $mimeType,
                    ]
                );
                
                Log::info('Storage::put result', [
                    'result' => $uploaded,
                    'file_size' => strlen($fileContent),
                    'path' => $path
                ]);
                
                if (!$uploaded) {
                    $error = 'Storage::put returned false';
                    Log::error('Failed to upload file to R2', [
                        'path' => $path,
                        'error' => $error,
                        'file_size' => strlen($fileContent),
                        'bucket' => $bucket,
                        'endpoint' => $endpoint
                    ]);
                    throw new \RuntimeException('Failed to upload file to R2: ' . $error);
                }
                
                // Verify the file exists after upload
                $fileExists = Storage::disk('r2')->exists($path);
                $fileUrl = Storage::disk('r2')->url($path);
                
                Log::info('File verification', [
                    'path' => $path,
                    'exists' => $fileExists,
                    'url' => $fileUrl,
                    'bucket' => $bucket,
                    'endpoint' => $endpoint
                ]);
                
                if (!$fileExists) {
                    $error = 'File does not exist after upload';
                    Log::error('File upload verification failed', [
                        'path' => $path,
                        'url' => $fileUrl,
                        'bucket' => $bucket,
                        'endpoint' => $endpoint,
                        'error' => $error
                    ]);
                    throw new \RuntimeException('File upload verification failed: ' . $error);
                }
                
                // Generate the public URL using the public R2 domain
                $publicUrl = rtrim(env('AWS_URL', 'https://pub-ea6620d5c362488b87b87d8594614290.r2.dev'), '/') . '/' . ltrim($path, '/');
                
                Log::info('File uploaded successfully', [
                    'path' => $path,
                    'url' => $publicUrl
                ]);
                
                return [
                    'url' => $publicUrl,
                    'path' => $path
                ];
            } catch (\Exception $e) {
                Log::error('Error uploading file to R2: ' . $e->getMessage(), [
                    'path' => $path ?? 'unknown',
                    'exception' => $e
                ]);
                return null;
            }
        } catch (SensitiveContentException $e) {
            // Re-throw SensitiveContentException to be handled by the controller
            Log::warning('Blocked upload due to sensitive content', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('R2 Upload Error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
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
