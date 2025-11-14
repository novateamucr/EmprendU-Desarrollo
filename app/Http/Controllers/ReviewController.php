<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * Display a listing of reviews for a specific entrepreneurship.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id'
        ]);

        $reviews = Review::with(['user:id,name'])
            ->where('entrepreneurship_id', $request->query('entrepreneurship_id'))
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    /**
     * Store a newly created review in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string',
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
            'user_id' => 'required|exists:users,id',
        ]);

        DB::beginTransaction();
        
        try {
            // Check if user already reviewed this entrepreneurship
            $existingReview = Review::where('user_id', $validated['user_id'])
                ->where('entrepreneurship_id', $validated['entrepreneurship_id'])
                ->first();

            if ($existingReview) {
                return response()->json([
                    'message' => 'Ya has dejado una reseña para este emprendimiento',
                    'review' => $existingReview
                ], 422);
            }

            // Check if user has a completed order with this entrepreneurship
            $hasCompletedOrder = Order::where('user_id', $validated['user_id'])
                ->where('entrepreneurship_id', $validated['entrepreneurship_id'])
                ->where('status', Order::STATUS_COMPLETED)
                ->exists();

            if (!$hasCompletedOrder) {
                return response()->json([
                    'message' => 'Debes haber realizado una orden completada con este emprendimiento para dejar una reseña',
                ], 403);
            }

            $review = Review::create($validated);
            
            DB::commit();

            return response()->json([
                'message' => 'Reseña creada exitosamente',
                'review' => $review->load('user:id,name')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear la reseña: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error al crear la reseña',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Display the specified review.
     */
    public function show(string $id): JsonResponse
    {
        $review = Review::with(['user:id,name', 'entrepreneurship'])
            ->findOrFail($id);
            
        return response()->json($review);
    }

    /**
     * Update the specified review in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        
        // Ensure the authenticated user is the owner of the review
        if ($review->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'message' => 'No autorizado para actualizar esta reseña'
            ], 403);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'review' => 'nullable|string',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Reseña actualizada correctamente',
            'review' => $review->load('user:id,name')
        ]);
    }

    /**
     * Remove the specified review from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        
        // Ensure the authenticated user is the owner of the review or an admin
        if ($review->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'message' => 'No autorizado para eliminar esta reseña'
            ], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Reseña eliminada correctamente'
        ]);
    }
}
