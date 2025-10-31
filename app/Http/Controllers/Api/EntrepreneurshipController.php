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
use Illuminate\Support\Str;

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
        // Log incoming request data with more details
        \Log::info('Store Request Data:', [
            'all_input' => $request->all(),
            'files' => $request->allFiles(),
            'has_file' => $request->hasFile('image'),
            'content_type' => $request->header('Content-Type'),
            'is_multipart' => str_contains($request->header('Content-Type'), 'multipart/form-data'),
            'request_headers' => $request->headers->all(),
            'request_method' => $request->method(),
        ]);
        
        DB::beginTransaction();
        try {
            // Log if we have a blob URL in the request
            if ($request->has('imageUrl') && strpos($request->input('imageUrl'), 'blob:') === 0) {
                \Log::info('Blob URL detected in request', [
                    'imageUrl' => $request->input('imageUrl')
                ]);
            }
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string|min:50',
                'category' => 'required|integer|exists:entrepreneurship_categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'user_id' => 'required|exists:users,id',
            ]);

            // Handle image upload if present
            if ($request->hasFile('image')) {
                // Generate a slug from the entrepreneurship name for the filename
                $filename = Str::slug($request->input('name')) . '-' . time();
                
                try {
                    $file = $request->file('image');
                    \Log::info('Processing file upload', [
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'extension' => $file->getClientOriginalExtension()
                    ]);
                    
                    $uploadResult = $fileUploadService->upload(
                        $file,
                        'entrepreneurships', // This is the main directory
                        'images',            // Subdirectory
                        $filename            // Custom filename (without extension)
                    );

                    if (empty($uploadResult['url']) || empty($uploadResult['path'])) {
                        throw new \Exception('Failed to upload image to R2 storage: Invalid upload result');
                    }

                    // Store both the full URL and the path in the database
                    $data['image_url'] = $uploadResult['url'];
                    $data['image_path'] = $uploadResult['path']; // Store the path for future reference
                    
                    \Log::info('Image uploaded successfully', [
                        'url' => $data['image_url'],
                        'path' => $data['image_path']
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Error uploading file', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            } elseif ($request->has('imageUrl') && strpos($request->input('imageUrl'), 'blob:') === 0) {
                // Handle blob URL case - this means the frontend needs to be fixed to send the actual file
                \Log::warning('Blob URL received instead of file. Frontend needs to convert blob to file before upload.');
                $data['image_url'] = 'https://images.pexels.com/photos/3197389/pexels-photo-3197389.jpeg';
            } else {
                // Set default image URL when no image is provided
                $data['image_url'] = 'https://images.pexels.com/photos/3197389/pexels-photo-3197389.jpeg';
                \Log::info('Using default image URL');
            }

            // Validate with OpenAI
            $validation = $openAIService->validateEntrepreneurship($data);
            
            // Log the validation response for debugging
            \Log::debug('OpenAI Validation Response', ['validation' => $validation]);
            
            // If the response has errors in the new format
            if (isset($validation['errors'])) {
                // Clean up uploaded image if validation fails
                if (isset($uploadResult)) {
                    $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                }
                
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validation['errors']
                ], 422);
            }
            
            // If the response indicates the content was not accepted
            if (isset($validation['accepted']) && $validation['accepted'] === false) {
                // Clean up uploaded image if validation fails
                if (isset($uploadResult)) {
                    $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                }
                
                $errors = [];
                if (!empty($validation['reason'])) {
                    $errors['general'] = [$validation['reason']];
                } else {
                    $errors['general'] = ['El contenido no cumple con los requisitos de la plataforma'];
                }
                
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $errors
                ], 422);
            }
            
            // If we get here, validation passed
            
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
        // Get raw input for debugging
        $rawInput = file_get_contents('php://input');
        
        // Debug log the incoming request data
        \Log::info('Update Request Data:', [
            'id' => $id,
            'request_data' => $request->all(),
            'raw_input' => $rawInput,
            'content_type' => $request->header('Content-Type'),
            'method' => $request->method(),
            'is_json' => $request->isJson(),
            'json' => $request->isJson() ? $request->json()->all() : []
        ]);

        // Handle form-data content type
        if (strpos($request->header('Content-Type'), 'multipart/form-data') !== false) {
            // For form data, we need to manually parse the raw input
            $formData = [];
            $boundary = '--' . explode('boundary=', $request->header('Content-Type'))[1];
            $parts = explode($boundary, $rawInput);
            
            foreach ($parts as $part) {
                if (empty(trim($part))) continue;
                
                if (preg_match('/name="([^"]+)"\s*\r?\n\r?\n(.*)\r?\n?$/', $part, $matches)) {
                    $formData[$matches[1]] = trim($matches[2]);
                }
            }
            
            if (!empty($formData)) {
                $request->merge($formData);
                \Log::info('Parsed form data:', $formData);
            }
        }

        $entrepreneurship = Entrepreneurship::findOrFail($id);

        // Debug log the current entrepreneurship data
        \Log::info('Current Entrepreneurship Data:', $entrepreneurship->toArray());

        // Clean up the description by removing extra whitespace and normalizing newlines
        if ($request->has('description')) {
            $description = trim(preg_replace('/\s+/', ' ', $request->input('description')));
            $request->merge(['description' => $description]);
        }

        // First, validate the request data
        $validationRules = [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|min:50',
            'category' => 'sometimes|required|integer|exists:entrepreneurship_categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'image_url' => 'nullable|string',
            'user_id' => 'sometimes|required|exists:users,id',
        ];
        
        // If we have an image in the request, remove the image_url validation
        if ($request->hasFile('image')) {
            unset($validationRules['image_url']);
        }
        
        $validated = $request->validate($validationRules);

        // Validate name and description together
        $errors = [];
        $hasNameUpdate = $request->has('name');
        $hasDescriptionUpdate = $request->has('description');
        
        // Basic validation
        if ($hasNameUpdate) {
            $name = trim($request->input('name'));
            if (empty($name)) {
                $errors['name'] = ['El nombre es obligatorio'];
            } elseif (strlen($name) < 3) {
                $errors['name'] = ['El nombre debe tener al menos 3 caracteres'];
            }
        }

        if ($hasDescriptionUpdate) {
            $description = trim(preg_replace('/\s+/', ' ', $validated['description']));
            if (strlen($description) < 50) {
                $errors['description'] = ['La descripción debe tener al menos 50 caracteres'];
            }
        }

        // If there are any basic validation errors, return them immediately
        if (!empty($errors)) {
            // Format the errors to match the specified format
            $formattedErrors = [];
            foreach ($errors as $field => $messages) {
                $formattedErrors[$field] = is_array($messages) ? $messages : [$messages];
            }
            
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $formattedErrors
            ], 422);
        }

        // AI Validation for name and description if they pass basic validation
        $aiValidationErrors = [];
        $fieldsToValidate = [];

        if ($hasNameUpdate) {
            $fieldsToValidate['name'] = $validated['name'];
        }
        if ($hasDescriptionUpdate) {
            $fieldsToValidate['description'] = $validated['description'];
        }

        if (!empty($fieldsToValidate)) {
            $validation = $openAIService->validateEntrepreneurship(array_merge(
                $entrepreneurship->toArray(),
                $fieldsToValidate
            ));

            // Handle validation response
            if ((isset($validation['accepted']) && $validation['accepted'] === false) || 
                (isset($validation['inappropriate']) && $validation['inappropriate'])) {
                
                $reason = $validation['reason'] ?? 'El contenido no cumple con los requisitos';
                $suggestions = $validation['suggestions'] ?? [];

                // Handle field-specific errors
                if (isset($validation['fields_with_issues'])) {
                    foreach ($validation['fields_with_issues'] as $field) {
                        if (isset($fieldsToValidate[$field])) {
                            $aiValidationErrors[$field] = [$reason];
                        }
                    }
                } else if (isset($validation['reason'])) {
                    // If no specific fields but there's a reason, apply to description by default
                    $aiValidationErrors['description'] = [$reason];
                }

                // Add default suggestions if none provided
                if (empty($suggestions) && isset($aiValidationErrors['description'])) {
                    $suggestions = [
                        'Ejemplo de descripción válida:',
                        '\"Ofrecemos productos artesanales hechos a mano con materiales 100% naturales. Especializados en cerámica tradicional, cada pieza es única y pintada a mano. Envíos a todo el país y garantía de satisfacción.\"',
                        'La descripción debe tener al menos 50 caracteres y describir claramente tu negocio.'
                    ];
                }

                if (isset($validation['fields_with_issues'])) {
                    foreach ($validation['fields_with_issues'] as $field) {
                        if (isset($fieldsToValidate[$field])) {
                            $aiValidationErrors[$field] = [$validation['reason'] ?? 'El contenido no cumple con las políticas de la plataforma'];
                            if (isset($defaultSuggestions[$field])) {
                                $validation['suggestions'] = array_merge(
                                    $validation['suggestions'] ?? [],
                                    $defaultSuggestions[$field]
                                );
                            }
                        }
                    }
                } else {
                    // If no specific fields are marked, assume both name and description are problematic
                    if ($hasNameUpdate) {
                        $aiValidationErrors['name'] = [$validation['reason'] ?? 'El nombre no cumple con las políticas de la plataforma'];
                        $validation['suggestions'] = array_merge(
                            $validation['suggestions'] ?? [],
                            $defaultSuggestions['name']
                        );
                    }
                    if ($hasDescriptionUpdate) {
                        $aiValidationErrors['description'] = [$validation['reason'] ?? 'La descripción no cumple con las políticas de la plataforma'];
                        $validation['suggestions'] = array_merge(
                            $validation['suggestions'] ?? [],
                            $defaultSuggestions['description']
                        );
                    }
                }
            }

            // Check for other validation issues from AI
            if (isset($validation['accepted']) && !$validation['accepted']) {
                if (isset($validation['fields_with_issues'])) {
                    foreach ($validation['fields_with_issues'] as $field) {
                        if (isset($fieldsToValidate[$field])) {
                            $aiValidationErrors[$field] = [$validation['reason'] ?? 'El contenido no cumple con los requisitos'];
                        }
                    }
                }
            }
        }

        // If there are any AI validation errors, return them
        if (!empty($aiValidationErrors)) {
            // Format the errors to match the specified format
            $formattedErrors = [];
            foreach ($aiValidationErrors as $field => $messages) {
                $formattedErrors[$field] = is_array($messages) ? $messages : [$messages];
            }
            
            $response = [
                'message' => 'Error de validación',
                'errors' => $formattedErrors
            ];
            
            // Add suggestions if available
            if (!empty($suggestions)) {
                $response['suggestions'] = is_array($suggestions) ? $suggestions : [$suggestions];
            }
            
            return response()->json($response, 422);
        }

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
            // Debug log the request data
            \Log::info('Request data:', [
                'has_file' => $request->hasFile('image'),
                'files' => $request->allFiles(),
                'input' => $request->except(['image']), // Exclude binary data from logs
                'content_type' => $request->header('Content-Type'),
                'is_json' => $request->isJson(),
                'is_multipart' => str_contains($request->header('Content-Type'), 'multipart/form-data')
            ]);

            // Handle image upload if a new image is provided
            if ($request->hasFile('image')) {
                \Log::info('Image file detected', [
                    'original_name' => $request->file('image')->getClientOriginalName(),
                    'size' => $request->file('image')->getSize(),
                    'mime' => $request->file('image')->getMimeType(),
                    'is_valid' => $request->file('image')->isValid()
                ]);
                \Log::info('Image file detected in request', [
                    'filename' => $request->file('image')->getClientOriginalName(),
                    'size' => $request->file('image')->getSize(),
                    'mime' => $request->file('image')->getMimeType()
                ]);
                try {
                    // Generate a slug from the entrepreneurship name for the filename
                    $filename = Str::slug($request->input('name')) . '-' . time();
                    
                    try {
                        \Log::info('Attempting to upload file to R2', [
                            'filename' => $filename,
                            'file' => $request->file('image')
                        ]);
                        $uploadResult = $fileUploadService->upload(
                            $request->file('image'),
                            'entrepreneurships', // This is the main directory
                            'images',            // Subdirectory
                            $filename            // Custom filename (without extension)
                        );
                        \Log::info('Upload result:', [
                            'upload_result' => $uploadResult
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Error during file upload', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e;
                    }
                    
                    if (!empty($uploadResult['url'])) {
                        \Log::info('Upload successful, processing result', [
                            'old_image_url' => $entrepreneurship->image_url,
                            'new_image_url' => $uploadResult['url']
                        ]);
                        // If there was an existing image, delete it
                        if ($entrepreneurship->image_url) {
                            $fileUploadService->delete(
                                $entrepreneurship->image_url,
                                $entrepreneurship->image_path ?? null
                            );
                        }
                        
                        $validated['image_url'] = $uploadResult['url'];
                        $validated['image_path'] = $uploadResult['path'];
                    } else {
                        \Log::error('Upload result is missing URL', [
                            'upload_result' => $uploadResult
                        ]);
                        throw new \Exception('Failed to upload new image: No URL returned from upload service');
                    }
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
            // Handle image_url update or removal (only if no file was uploaded)
            if (!$request->hasFile('image') && array_key_exists('image_url', $validated)) {
                // If image_url is being set to null or a new URL
                if ($validated['image_url'] !== $entrepreneurship->image_url) {
                    // If there was an existing image, delete it
                    if ($entrepreneurship->image_url && empty($validated['image_url'])) {
                        $fileUploadService->delete(
                            $entrepreneurship->image_url,
                            $entrepreneurship->image_path ?? null
                        );
                    }
                    $validated['image_url'] = $validated['image_url'] ?: null;
                }
            }

            // Always validate if description is present in the request
            if ($request->has('description')) {
                // First check the length requirement
                if (strlen($validated['description']) < 50) {
                    if (isset($uploadResult)) {
                        $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                    }
                    
                    return response()->json([
                        'message' => 'Error de validación',
                        'reason' => 'La descripción debe tener al menos 50 caracteres',
                        'fields_with_issues' => ['description']
                    ], 422);
                }
                
                // Then validate with OpenAI
                $validation = $openAIService->validateEntrepreneurship([
                    'name' => $entrepreneurship->name,
                    'description' => $validated['description'],
                    'category' => $entrepreneurship->category
                ]);
                
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
                    if (isset($uploadResult)) {
                        $fileUploadService->delete($uploadResult['url'], $uploadResult['path']);
                    }
                    
                    return response()->json([
                        'message' => 'Error de validación',
                        'reason' => $validation['reason'] ?? 'El contenido no cumple con los requisitos',
                        'suggestions' => $validation['suggestions'] ?? [],
                        'fields_with_issues' => $validation['fields_with_issues'] ?? []
                    ], 422);
                }
            }
            
            // Validate other fields with OpenAI if needed
            $fieldsToValidate = array_intersect_key($validated, array_flip(['name', 'category']));
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

            // Update the entrepreneurship with the validated data
            $updateData = $validated;
            
            // Log the data that will be updated
            \Log::info('Preparing to update entrepreneurship data', [
                'update_data' => $updateData,
                'has_image_url' => isset($updateData['image_url']),
                'has_image' => isset($updateData['image'])
            ]);
            
            // Remove the image from the update data as we handle it separately
            unset($updateData['image']);
            
            // Log the final data being saved
            \Log::info('Updating entrepreneurship with data', [
                'update_data' => $updateData,
                'image_url' => $entrepreneurship->image_url,
                'new_image_url' => $updateData['image_url'] ?? null
            ]);
            
            $entrepreneurship->update($updateData);
            
            // Log the result
            \Log::info('Entrepreneurship updated successfully', [
                'id' => $entrepreneurship->id,
                'current_image_url' => $entrepreneurship->image_url
            ]);

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
