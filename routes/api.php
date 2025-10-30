<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\Api\EntrepreneurshipController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FairController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\EntrepreneurshipChannelController;
use App\Http\Controllers\Api\AIAssistantController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Api\ProductOptionController;
use App\Http\Controllers\Api\ProductOptionValueController;
use App\Http\Controllers\Api\ProductCustomFormController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Controllers\InscripcionController;

// Public routes (no authentication required)
Route::post('login', [UserController::class, 'login']);

// Test R2 Upload
Route::get('test-r2-upload', function() {
    try {
        $disk = Storage::disk('r2');
        
        // Test file content
        $testContent = 'Test content ' . now();
        $testPath = 'test-files/test-' . uniqid() . '.txt';
        
        // Upload test file
        $disk->put($testPath, $testContent, [
            'visibility' => 'public',
            'mimetype' => 'text/plain'
        ]);
        
        // Get public URL
        $url = $disk->url($testPath);
        
        // Check if file exists
        $exists = $disk->exists($testPath);
        
        // Get file content
        $content = $disk->get($testPath);
        
        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'path' => $testPath,
            'url' => $url,
            'exists' => $exists,
            'content' => $content,
            'config' => [
                'bucket' => config('filesystems.disks.r2.bucket'),
                'endpoint' => config('filesystems.disks.r2.endpoint'),
                'url' => config('filesystems.disks.r2.url'),
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'config' => [
                'bucket' => config('filesystems.disks.r2.bucket'),
                'endpoint' => config('filesystems.disks.r2.endpoint'),
                'url' => config('filesystems.disks.r2.url'),
                'key' => config('filesystems.disks.r2.key') ? '*** set ***' : 'Not set',
                'secret' => config('filesystems.disks.r2.secret') ? '*** set ***' : 'Not set',
            ]
        ], 500);
    }
});

// Test R2 upload (simplified)
Route::match(['get', 'post'], 'test-r2-upload', function() {
    try {
        $disk = Storage::disk('r2');
        
        // Test file content
        $testContent = 'Test file content ' . now();
        $testPath = 'test-' . uniqid() . '.txt'; // Removed test-files/ to avoid directory issues
        
        // Upload test file
        $uploaded = $disk->put($testPath, $testContent, [
            'visibility' => 'public',
            'ContentType' => 'text/plain'
        ]);
        
        if (!$uploaded) {
            throw new \Exception('Failed to upload file to R2');
        }
        
        // Get public URL
        $url = $disk->url($testPath);
        
        // Try to get file content directly without checking existence first
        $content = null;
        try {
            $content = $disk->get($testPath);
        } catch (\Exception $e) {
            // Ignore error, we'll handle it in the response
        }
        
        // Try to delete the file
        $deleted = false;
        try {
            $deleted = $disk->delete($testPath);
        } catch (\Exception $e) {
            // Ignore error, we'll handle it in the response
        }
        
        return response()->json([
            'success' => true,
            'message' => 'R2 upload test completed',
            'uploaded' => $uploaded,
            'path' => $testPath,
            'url' => $url,
            'content' => $content,
            'deleted' => $deleted,
            'config' => [
                'bucket' => config('filesystems.disks.r2.bucket'),
                'endpoint' => config('filesystems.disks.r2.endpoint'),
                'url' => config('filesystems.disks.r2.url'),
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error('R2 Test Error: ' . $e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString()
        ]);
        
        // Get the underlying AWS exception if it exists
        $awsError = '';
        if ($e instanceof \Aws\S3\Exception\S3Exception) {
            $awsError = $e->getAwsErrorMessage() ?: $e->getMessage();
        }
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'aws_error' => $awsError,
            'file' => $e->getFile() . ':' . $e->getLine(),
            'config' => [
                'bucket' => config('filesystems.disks.r2.bucket'),
                'endpoint' => config('filesystems.disks.r2.endpoint'),
                'url' => config('filesystems.disks.r2.url'),
                'key' => config('filesystems.disks.r2.key') ? '*** set ***' : 'Not set',
                'secret' => config('filesystems.disks.r2.secret') ? '*** set ***' : 'Not set',
            ]
        ], 500);
    }
});

// Protected routes (authentication required)
Route::apiResource('entrepreneurships', EntrepreneurshipController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('fairs', FairController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('roles', RoleController::class);
Route::apiResource('favorites', FavoriteController::class);
Route::apiResource('interests', InterestController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('reviews', ReviewController::class);
Route::get('/fairs', [FairController::class, 'index']);

// Secure password update route (expects current_password, password, password_confirmation)
Route::put('users/{user}/password', [UserController::class, 'updatePassword']);

// Entrepreneurship Channels (nested)
Route::get('entrepreneurships/{entrepreneurship}/channels', [EntrepreneurshipChannelController::class, 'index']);
Route::post('entrepreneurships/{entrepreneurship}/channels', [EntrepreneurshipChannelController::class, 'store']);
Route::put('entrepreneurships/{entrepreneurship}/channels/{channel}', [EntrepreneurshipChannelController::class, 'update']);
Route::delete('entrepreneurships/{entrepreneurship}/channels/{channel}', [EntrepreneurshipChannelController::class, 'destroy']);

// Product Options (nested under products)
Route::get('products/{product}/options', [ProductOptionController::class, 'index']);
Route::post('products/{product}/options', [ProductOptionController::class, 'store']);
Route::get('products/{product}/options/{option}', [ProductOptionController::class, 'show']);
Route::put('products/{product}/options/{option}', [ProductOptionController::class, 'update']);
Route::delete('products/{product}/options/{option}', [ProductOptionController::class, 'destroy']);

// Product Option Values (nested under product option)
Route::get('products/{product}/options/{option}/values', [ProductOptionValueController::class, 'index']);
Route::post('products/{product}/options/{option}/values', [ProductOptionValueController::class, 'store']);
Route::get('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'show']);
Route::put('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'update']);
Route::delete('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'destroy']);

// Product Custom Forms (nested under products)
Route::get('products/{product}/custom-forms', [ProductCustomFormController::class, 'index']);
Route::post('products/{product}/custom-forms', [ProductCustomFormController::class, 'store']);
Route::get('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'show']);
Route::put('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'update']);
Route::delete('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'destroy']);

// Orders
Route::get('orders', [OrdersController::class, 'index']); // ?entrepreneurship_id=
Route::post('orders', [OrdersController::class, 'store']);
Route::post('orders/{order}/items', [OrdersController::class, 'addItem']);
Route::patch('orders/{order}/status', [OrdersController::class, 'updateStatus']);
Route::delete('orders/{order}', [OrdersController::class, 'destroy']);


// AI Assistant routes
Route::post('assistant/chat', [AIAssistantController::class, 'chat'])->middleware('auth:api');
Route::post('assistant/virtual', [AIAssistantController::class, 'virtualAssistant'])->middleware('auth:api');
Route::post('assistant/validate/entrepreneurship', [AIAssistantController::class, 'validateEntrepreneurship'])->middleware('auth:api');
Route::post('assistant/validate/product', [AIAssistantController::class, 'validateProduct'])->middleware('auth:api');

Route::post('/inscripciones', [InscripcionController::class, 'store']);
Route::get('/inscripciones/{userId}', [InscripcionController::class, 'getByUser']);