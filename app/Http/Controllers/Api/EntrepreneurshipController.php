<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Entrepreneurship;

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
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|integer|exists:entrepreneurship_categories,id',
            'image_url' => 'nullable|url|max:500',
            'user_id' => 'sometimes|required|exists:users,id',
        ]);

        $entrepreneurship->update($data);
        return response()->json($entrepreneurship->fresh()->load(['owner','categoryRelation','products']));
    }

    public function destroy(Entrepreneurship $entrepreneurship)
    {
        $entrepreneurship->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
