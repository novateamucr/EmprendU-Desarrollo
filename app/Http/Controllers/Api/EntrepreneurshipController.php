<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Entrepreneurship;
use App\Services\OpenAIService;
use Illuminate\Support\Facades\DB;
use Throwable;
use Illuminate\Support\Facades\Schema;

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

    public function store(Request $request, OpenAIService $openAIService)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string|min:50',
                'category' => 'required|integer|exists:entrepreneurship_categories,id',
                'image_url' => 'nullable|url|max:500',
                'user_id' => 'required|exists:users,id',
            ]);

            // Validate with OpenAI
            $validation = $openAIService->validateEntrepreneurship($data);
            
            if (isset($validation['inappropriate']) && $validation['inappropriate']) {
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

            return response()->json([
                'message' => 'Emprendimiento creado exitosamente',
                'data' => $entrepreneurship->load(['owner', 'categoryRelation']),
                'suggestions' => $validation['suggestions'] ?? []
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
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

    public function update(Request $request, Entrepreneurship $entrepreneurship, OpenAIService $openAIService)
    {
        try {
            \Log::info('Solicitud de actualización de emprendimiento', [
                'entrepreneurship_id' => $entrepreneurship->id,
                'request_data' => $request->all(),
                'user_id' => $request->user()?->id,
                'ip' => $request->ip()
            ]);

            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string|min:50',
                'category' => 'sometimes|required|integer|exists:entrepreneurship_categories,id',
                'image_url' => 'nullable|url|max:500',
            ]);

            // Si solo se actualiza la imagen, no validar con IA
            if (count($data) === 1 && isset($data['image_url'])) {
                $entrepreneurship->update($data);
                return response()->json([
                    'message' => 'Imagen actualizada exitosamente',
                    'data' => $entrepreneurship->fresh()
                ]);
            }

            // Validar con IA los cambios propuestos
            $validation = $openAIService->validateEntrepreneurshipUpdate($entrepreneurship, $data);
            
            // Registrar resultado de validación
            \Log::debug('Resultado validación IA', [
                'entrepreneurship_id' => $entrepreneurship->id,
                'validation' => $validation
            ]);

            // Verificar validación
            if (isset($validation['inappropriate']) && $validation['inappropriate']) {
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

            // Actualizar el emprendimiento
            $entrepreneurship->update($data);
            
            \Log::info('Emprendimiento actualizado', [
                'entrepreneurship_id' => $entrepreneurship->id,
                'updated_fields' => array_keys($data)
            ]);

            return response()->json([
                'message' => 'Emprendimiento actualizado exitosamente',
                'data' => $entrepreneurship->fresh(['owner', 'categoryRelation']),
                'suggestions' => $validation['suggestions'] ?? []
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar emprendimiento: ' . $e->getMessage(), [
                'entrepreneurship_id' => $entrepreneurship->id,
                'exception' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error al actualizar el emprendimiento',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    public function destroy(Entrepreneurship $entrepreneurship)
    {
        try {
            DB::beginTransaction();

            // Remove or detach related records to avoid FK issues
            // Channels (hasMany) – soft delete supported
            if (method_exists($entrepreneurship, 'channels')) {
                $rel = $entrepreneurship->channels();
                $table = $rel->getRelated()->getTable();
                if (Schema::hasTable($table)) {
                    $rel->delete();
                }
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
