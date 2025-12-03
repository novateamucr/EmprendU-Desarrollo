<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Entrepreneurship;
use App\Services\OpenAIService;
use App\Services\R2FileUploadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Exceptions\SensitiveContentException;
use App\Models\OrderItem;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = Product::with('entrepreneurship');

        if ($e = $request->query('entrepreneurship_id')) {
            $q->where('entrepreneurship_id', $e);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request, R2FileUploadService $fileUploadService)
    {
        // Initialize variables
        $validatedData = [];
        $image = null;
        $filename = '';
        $uploadResult = null;
        $product = null;
        
        try {
            // Validate the request
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'category_id' => 'required|exists:categories,id',
                'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'long_description' => 'nullable|string',
            ]);

            // Handle image upload first
            if (!$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => [
                        'image' => ['Product image is required']
                    ]
                ], 422);
            }

            $image = $request->file('image');
            
            // Log image details for debugging
            $imageInfo = [
                'original_name' => $image->getClientOriginalName(),
                'size' => $image->getSize(),
                'mime' => $image->getMimeType(),
                'extension' => $image->getClientOriginalExtension(),
                'temp_path' => $image->getRealPath(),
                'is_readable' => is_readable($image->getRealPath())
            ];
            
            Log::info('Processing image upload', $imageInfo);

            // Verify the image is readable
            if (!is_readable($image->getRealPath())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot read the uploaded image file',
                    'errors' => [
                        'image' => ['The uploaded file could not be read.']
                    ]
                ], 422);
            }

            // Generate a unique filename
            $filename = Str::slug($validatedData['name']) . '-' . time() . '-' . Str::random(8);
            Log::info('Generated filename', ['filename' => $filename]);

            // Start database transaction only after initial validation
            DB::beginTransaction();

            try {
                // Upload the image with moderation enabled
                $uploadResult = $fileUploadService->upload(
                    $image,
                    'products',
                    'images',
                    $filename,
                    true // Enable strict moderation
                );

                if ($uploadResult === null) {
                    throw new \Exception('Failed to upload product image to storage');
                }

                Log::info('File upload successful', [
                    'url' => $uploadResult['url'] ?? 'no url',
                    'path' => $uploadResult['path'] ?? 'no path',
                    'file_exists' => Storage::disk('r2')->exists($uploadResult['path'] ?? '')
                ]);
                
                // Verify the file was actually uploaded
                if (empty($uploadResult['url']) || empty($uploadResult['path'])) {
                    throw new \Exception('Invalid upload result: missing URL or path');
                }

                // Create the product with the image URL
                $product = Product::create([
                    'name' => $validatedData['name'],
                    'description' => $validatedData['description'],
                    'long_description' => $validatedData['long_description'] ?? null,
                    'price' => $validatedData['price'],
                    'category_id' => $validatedData['category_id'],
                    'entrepreneurship_id' => $validatedData['entrepreneurship_id'],
                    'image_url' => $uploadResult['url'],
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Product created successfully',
                    'data' => $product->load('entrepreneurship'),
                    'image_url' => $uploadResult['url']
                ], 201);

            } catch (\App\Exceptions\SensitiveContentException $e) {
                // Rollback the transaction
                DB::rollBack();
                
                Log::warning('Content moderation blocked product creation', [
                    'error' => $e->getMessage(),
                    'file' => $image ? $image->getClientOriginalName() : 'no file',
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Content not allowed',
                    'errors' => [
                        'image' => ['The uploaded image contains content that violates our community guidelines.']
                    ],
                    'reason' => 'inappropriate_content',
                    'details' => $e->getMessage()
                ], 422);
                
            } catch (\Exception $e) {
                // Rollback the transaction
                DB::rollBack();
                
                // Clean up the product if it was created but the image upload failed
                if (isset($product) && $product->id) {
                    try {
                        $product->delete();
                    } catch (\Exception $deleteException) {
                        Log::error('Error cleaning up product after failed creation: ' . $deleteException->getMessage());
                    }
                }
                
                // Log the error
                $errorMessage = $e->getMessage();
                $statusCode = 500;
                
                // Check if this is a sensitive content error
                if (str_contains(strtolower($errorMessage), 'sensitive') || 
                    str_contains(strtolower($errorMessage), 'nudity') ||
                    str_contains(strtolower($errorMessage), 'explicit')) {
                    $statusCode = 422;
                    $errorMessage = 'The uploaded image contains content that violates our community guidelines.';
                }
                
                Log::error('Error creating product: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString(),
                    'request_data' => $request->except(['image']), // Exclude image data from logs
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Error creating product',
                    'error' => $errorMessage,
                    'status' => $statusCode
                ], $statusCode);
            }
        } catch (\Exception $e) {
            // This is the outer catch block for any other exceptions
            Log::error('Unexpected error in ProductController@store: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Product $product)
    {
        return response()->json($product->load('entrepreneurship'));
    }

    public function update(Request $request, Product $product, R2FileUploadService $fileUploadService)
    {
        DB::beginTransaction();
        
        try {
            // Log the raw request data for debugging
            \Log::info('=== RAW REQUEST DATA ===', [
                'all' => $request->all(),
                'files' => $request->allFiles(),
                'has_file' => $request->hasFile('image'),
                'headers' => $request->headers->all()
            ]);

            // Get all input data including files
            $input = $request->all();
            
            // Handle form data for file uploads
            if ($request->hasFile('image')) {
                $input['image'] = $request->file('image');
            }

            // Validate the request data
            $rules = [
                'name' => 'sometimes|required|string|max:150',
                'description' => 'sometimes|required|string',
                'price' => 'sometimes|required|numeric|min:0',
                'category_id' => 'sometimes|required|exists:entrepreneurship_categories,id',
                'entrepreneurship_id' => 'sometimes|required|exists:entrepreneurships,id',
                'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'long_description' => 'nullable|string',
                'image_url' => 'sometimes|string|nullable|url'
            ];

            $validator = \Validator::make($input, $rules);

            if ($validator->fails()) {
                throw new \Illuminate\Validation\ValidationException($validator);
            }

            $validated = $validator->validated();
            $changesDetected = false;
            $updateData = [];

            // Handle numeric conversions
            if (array_key_exists('price', $validated)) {
                $validated['price'] = (float)$validated['price'];
            }
            if (array_key_exists('category_id', $validated)) {
                $validated['category_id'] = (int)$validated['category_id'];
            }
            if (array_key_exists('entrepreneurship_id', $validated)) {
                $validated['entrepreneurship_id'] = (int)$validated['entrepreneurship_id'];
            }

            // Check for changes in regular fields
            $fieldsToCheck = ['name', 'description', 'price', 'category_id', 'entrepreneurship_id', 'long_description'];
            foreach ($fieldsToCheck as $field) {
                if (array_key_exists($field, $validated)) {
                    $newValue = $validated[$field];
                    $currentValue = $product->$field;
                    
                    // Convert both to string for comparison to handle different types
                    if ((string)$newValue !== (string)$currentValue) {
                        $updateData[$field] = $newValue;
                        $changesDetected = true;
                    }
                }
            }

            // Handle image upload if a new image was provided
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                
                try {
                    $uploadResult = $fileUploadService->upload(
                        $file,
                        'products',
                        'images',
                        Str::slug($product->name) . '-' . time() . '-' . Str::random(8),
                        true // Enable strict moderation
                    );
                    
                    if (!empty($uploadResult['url'])) {
                        // If there was an existing image, delete it
                        if ($product->image_url) {
                            $fileUploadService->delete($product->image_url);
                        }
                        
                        $updateData['image_url'] = $uploadResult['url'];
                        $changesDetected = true;
                    } else {
                        throw new \Exception('Failed to upload new image');
                    }
                } catch (SensitiveContentException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Content not allowed',
                        'errors' => [
                            'image' => ['The uploaded image contains content that violates our community guidelines.']
                        ],
                        'reason' => 'inappropriate_content',
                        'details' => $e->getMessage()
                    ], 422);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File upload failed',
                        'errors' => [
                            'image' => [$e->getMessage()]
                        ]
                    ], 422);
                }
            } 
            // Handle image_url update or removal
            elseif (array_key_exists('image_url', $validated)) {
                // If image_url is being set to null or a new URL
                if ($validated['image_url'] !== $product->image_url) {
                    // If there was an existing image, delete it
                    if ($product->image_url && empty($validated['image_url'])) {
                        $fileUploadService->delete($product->image_url);
                    }
                    $updateData['image_url'] = $validated['image_url'] ?: null;
                    $changesDetected = true;
                }
            }

            // Log the changes
            \Log::info('=== UPDATE DETAILS ===', [
                'changes_detected' => $changesDetected,
                'update_data' => $updateData,
                'current_product' => $product->toArray()
            ]);

            if (!$changesDetected) {
                return response()->json([
                    'message' => 'No changes detected',
                    'product' => $product->fresh()
                ], 200);
            }

            // Update the product with the changed data
            $product->update($updateData);
            
            DB::commit();

            return response()->json([
                'message' => 'Product updated successfully',
                'product' => $product->fresh()->load('category')
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['image']),
                'files' => $request->allFiles()
            ]);

            return response()->json([
                'message' => 'Error updating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Product $product, R2FileUploadService $fileUploadService)
    {
        DB::beginTransaction();
        try {
            // First, delete dependent order items to satisfy FK constraints
            // This will cascade delete order_item_options via DB FK
            OrderItem::where('product_id', $product->id)->delete();

            // Delete the image from R2 if it exists
            if (!empty($product->image_url)) {
                $fileUploadService->delete($product->image_url);
            }
            
            $product->delete();
            
            DB::commit();
            return response()->json(['message' => 'Product deleted successfully']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get multiple products by their IDs
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProductsByIds(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:products,id'
        ]);

        $products = Product::whereIn('id', $request->ids)
            ->with('entrepreneurship')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

}