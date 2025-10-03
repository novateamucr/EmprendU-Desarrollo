<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    $entrepreneurshipId = $request->query('entrepreneurship_id');

    if (!$entrepreneurshipId) {
        return response()->json(['message' => 'Falta el parámetro entrepreneurship_id'], 400);
    }

    $reviews = Review::where('entrepreneurship_id', $entrepreneurshipId)->get();

    return response()->json($reviews);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
         $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'entrepreneurship_id' => 'nullable|exists:entrepreneurships,id',
        ]);

        $review = Review::create($data);

        return response()->json([
            'message' => 'Reseña creada exitosmente',
            'review' => $review->load(['user', 'entrepreneurship']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $review = Review::with(['user', 'entrepreneurship'])->findOrFail($id);
        return response()->json($review);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $review = Review::findOrFail($id);

        $data = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'review' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'entrepreneurship_id' => 'nullable|exists:entrepreneurships,id',
        ]);

        $review->update($data);

        return response()->json([
            'message' => 'Review actualizado correctamente',
            'review' => $review->load(['user', 'entrepreneurship']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Reseña eliminada correctamente']);
    }
}
