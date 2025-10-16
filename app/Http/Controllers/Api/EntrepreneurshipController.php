<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Entrepreneurship;
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

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|integer|exists:entrepreneurship_categories,id',
            'image_url' => 'nullable|url|max:500',
            'user_id' => 'required|exists:users,id',
        ]);

        $entre = Entrepreneurship::create($data);
        return response()->json($entre->load(['owner','categoryRelation','products']), 201);
    }

    public function show(Entrepreneurship $entrepreneurship)
    {
        return response()->json($entrepreneurship->load(['owner','categoryRelation','products','favorites']));
    }

    public function update(Request $request, Entrepreneurship $entrepreneurship)
    {
        \Log::info('Update entrepreneurship request received', [
            'entrepreneurship_id' => $entrepreneurship->id,
            'request_data' => $request->all(),
            'user_id' => $request->user() ? $request->user()->id : null,
            'ip' => $request->ip()
        ]);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'category' => 'sometimes|integer|exists:entrepreneurship_categories,id',
            'image_url' => 'sometimes|nullable|url|max:500',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        $entrepreneurship->update($data);
        return response()->json($entrepreneurship->fresh()->load(['owner','categoryRelation','products']));
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
