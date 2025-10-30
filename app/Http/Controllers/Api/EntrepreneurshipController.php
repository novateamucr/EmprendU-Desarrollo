<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Entrepreneurship;
use App\Services\OpenAIService;
use App\Services\R2FileUploadService;
use Illuminate\Support\Facades\DB;
use Throwable;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class EntrepreneurshipController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = Entrepreneurship::with(['owner','categoryRelation','products']);

        if ($category = $request->query('category')) {
            $q->where('category', $category);
        }

        if ($user = $request->query('user_id')) {
            $q->where('user_id', $user);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request, OpenAIService $openAIService, R2FileUploadService $fileUploadService)
    {
        DB::beginTransaction();
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string|min:50',
                'category' => 'required|integer|exists:entrepreneurship_categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'image_url' => 'nullable|string', // For existing URLs if needed
                'user_id' => 'required|exists:users,id',
            ]);

            // Handle image upload if present
            if ($request->hasFile('image')) {
                // Generate a slug from the entrepreneurship name for the filename
                $filename = Str::slug($request->input('name')) . '-' . time();
                
                $uploadResult = $fileUploadService->upload(
                    $request->file('image'),
                    'entrepreneurships', // This is the main directory
                    'images',            // Subdirectory
                    $filename            // Custom filename (without extension)
                );

                if (!$uploadResult) {
                    throw new \Exception('Failed to upload image to R2 storage');
                }

                // Store both the full URL and the path in the database
                $data['image_url'] = $uploadResult['url'];
                $data['image_path'] = $uploadResult['path']; // Store the path for future reference
            } elseif (empty($data['image_url'])) {
                $data['image_url'] = null;
            }

            // Validate with OpenAI
            $validation = $openAIService->validateEntrepreneurship($data);
            
            if (isset($validation['inappropriate']) && $validation['inappropriate']) {
                // Clean up uploaded image if validation fails
                if (isset($uploadResult)) {
                    $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                }
                
                return response()->json([
                    'message' => 'Contenido inapropiado detectado',
                    'reason' => $validation['reason'] ?? 'El contenido no cumple con las políticas de la plataforma',
                    'suggestions' => $validation['suggestions'] ?? [],
                    'fields_with_issues' => $validation['fields_with_issues'] ?? []
                ], 422);
            }

            if (isset($validation['accepted']) && !$validation['accepted']) {
                return response()->json([
                    'message' => 'Error de validación',
                    'reason' => $validation['reason'] ?? 'El contenido no cumple con los requisitos',
                    'suggestions' => $validation['suggestions'] ?? [],
                    'fields_with_issues' => $validation['fields_with_issues'] ?? []
                ], 422);
            }

            $entrepreneurship = Entrepreneurship::create($data);
            
            \Log::info('Nuevo emprendimiento creado', [
                'entrepreneurship_id' => $entrepreneurship->id,
                'user_id' => $data['user_id']
            ]);

            DB::commit();
            return response()->json($entrepreneurship, 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al crear emprendimiento: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error al crear el emprendimiento',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    public function show(Entrepreneurship $entrepreneurship)
    {
        return response()->json($entrepreneurship->load(['owner','categoryRelation','products','favorites']));
    }

    public function update(Request $request, $id, OpenAIService $openAIService, R2FileUploadService $fileUploadService)
    {
        $entrepreneurship = Entrepreneurship::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category' => 'sometimes|required|integer|exists:entrepreneurship_categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'image_url' => 'nullable|string', // For existing URLs if needed
            'user_id' => 'sometimes|required|exists:users,id',
        ]);

        // Only allow one of image or image_url, not both
        if ($request->hasFile('image') && $request->filled('image_url')) {
            return response()->json([
                'message' => 'Solo se permite subir una imagen o proporcionar una URL, no ambos.'
            ], 422);
        }

        // If image_url is being cleared
        if ($request->has('image_url') && empty($request->image_url) && !$request->hasFile('image')) {
            // Delete the old image if it exists
            if (!empty($entrepreneurship->image_url)) {
                $fileUploadService->delete(
                    $entrepreneurship->image_url,
                    $entrepreneurship->image_path ?? null
                );
                $entrepreneurship->image_url = null;
                $entrepreneurship->image_path = null;
            }
        }

        DB::beginTransaction();
        try {
            // Handle image upload if a new image is provided
            if ($request->hasFile('image')) {
                // Generate a slug from the entrepreneurship name for the filename
                $filename = Str::slug($request->input('name')) . '-' . time();
                
                $uploadResult = $fileUploadService->upload(
                    $request->file('image'),
                    'entrepreneurships', // This is the main directory
                    'images',            // Subdirectory
                    $filename            // Custom filename (without extension)
                );

                if (!$uploadResult) {
                    throw new \Exception('Failed to upload image to R2 storage');
                }

                // Store both the full URL and the path in the database
                $validated['image_url'] = $uploadResult['url'];
                $validated['image_path'] = $uploadResult['path']; // Store the path for future reference
            } elseif (isset($validated['image_url']) && $validated['image_url'] !== $entrepreneurship->image_url) {
                // If image_url is being updated to a new URL, delete the old image
                if ($entrepreneurship->image_url) {
                    $fileUploadService->delete(
                        $entrepreneurship->image_url,
                        $entrepreneurship->image_path ?? null
                    );
                }
            } else {
                // Keep the existing image_url if not being changed
                unset($validated['image_url']);
            }

            // If any validatable fields are being updated, validate with OpenAI
            $fieldsToValidate = array_intersect_key($validated, array_flip(['name', 'description']));
            if (!empty($fieldsToValidate)) {
                $validation = $openAIService->validateEntrepreneurship(array_merge(
                    $entrepreneurship->toArray(),
                    $fieldsToValidate
                ));
                
                if (isset($validation['inappropriate']) && $validation['inappropriate']) {
                    // Clean up uploaded image if validation fails
                    if (isset($uploadResult)) {
                        $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                    }
                    
                    return response()->json([
                        'message' => 'Contenido inapropiado detectado',
                        'reason' => $validation['reason'] ?? 'El contenido no cumple con las políticas de la plataforma',
                        'suggestions' => $validation['suggestions'] ?? [],
                        'fields_with_issues' => $validation['fields_with_issues'] ?? []
                    ], 422);
                }
            }

            $entrepreneurship->update($validated);

            DB::commit();
            return response()->json($entrepreneurship);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating entrepreneurship: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el emprendimiento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id, R2FileUploadService $fileUploadService)
    {
        $entrepreneurship = Entrepreneurship::findOrFail($id);

        DB::beginTransaction();
        try {
            // Delete the image from R2 if it exists
            if (!empty($entrepreneurship->image_url)) {
                // Try to use the stored path first, fall back to URL parsing
                $fileUploadService->delete(
                    $entrepreneurship->image_url,
                    $entrepreneurship->image_path ?? null
                );
            }

            // Products (hasMany)
            if (method_exists($entrepreneurship, 'products')) {
                $rel = $entrepreneurship->products();
                $table = $rel->getRelated()->getTable();
                if (Schema::hasTable($table)) {
                    $rel->delete();
                }
            }

            // Favorites (hasMany)
            if (method_exists($entrepreneurship, 'favorites')) {
                $rel = $entrepreneurship->favorites();
                $table = $rel->getRelated()->getTable();
                if (Schema::hasTable($table)) {
                    $rel->delete();
                }
            }

            // Fairs (belongsToMany) – detach pivot
            if (method_exists($entrepreneurship, 'fairs')) {
                $rel = $entrepreneurship->fairs();
                // for belongsToMany, table existence can be on pivot
                $pivot = $rel->getTable();
                if (Schema::hasTable($pivot)) {
                    $rel->detach();
                }
            }

            $entrepreneurship->delete();

            DB::commit();
            return response()->json(['message' => 'Deleted']);
        } catch (Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to delete entrepreneurship', [
                'entrepreneurship_id' => $entrepreneurship->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'No se pudo eliminar el emprendimiento. Verifique relaciones asociadas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
