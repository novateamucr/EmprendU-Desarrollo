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
        DB::beginTransaction();
        try {
            // Validate the request data
            $data = $request->validate([
                'name' => 'required|string|max:150',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'category_id' => 'required|exists:entrepreneurship_categories,id',
                'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'long_description' => 'nullable|string',
            ]);

            // Handle image upload first
            if (!$request->hasFile('image')) {
                throw new \Exception('Product image is required');
            }

            // Generate a slug from the product name for the filename
            $filename = Str::slug($data['name']) . '-' . time();
            
            // Upload the image
            $uploadResult = $fileUploadService->upload(
                $request->file('image'),
                'products',
                'images',
                $filename
            );
            
            if (!$uploadResult) {
                throw new \Exception('Failed to upload product image to storage');
            }

            // Create the product with the image URL
            $product = Product::create([
                'name' => $data['name'],
                'description' => $data['description'],
                'long_description' => $data['long_description'] ?? null,
                'price' => $data['price'],
                'category_id' => $data['category_id'],
                'entrepreneurship_id' => $data['entrepreneurship_id'],
                'image_url' => $uploadResult['url'],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Product created successfully',
                'data' => $product->load('entrepreneurship'),
                'image_url' => $uploadResult['url']
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating product: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            // Clean up the product if it was created but the image upload failed
            if (isset($product)) {
                $product->delete();
            }
            
            return response()->json([
                'message' => 'Error creating product',
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
                
                if ($file->isValid()) {
                    // Generate a slug from the product name for the filename
                    $filename = Str::slug($request->input('name', $product->name)) . '-' . time();
                    
                    // Upload new image to R2
                    $uploadResult = $fileUploadService->upload(
                        $file,
                        'products',
                        'images',
                        $filename
                    );
                    
                    if (!$uploadResult) {
                        throw new \Exception('Failed to upload product image');
                    }

                    // Delete old image from R2 if exists
                    if ($product->image_url) {
                        $fileUploadService->delete($product->image_url);
                    }

                    $updateData['image_url'] = $uploadResult['url'];
                    $changesDetected = true;
                } else {
                    throw new \Exception('Invalid file: ' . $file->getErrorMessage());
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

}