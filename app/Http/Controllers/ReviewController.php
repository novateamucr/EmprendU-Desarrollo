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

   $reviews = Review::with(['user:id,name']) // carga user con solo id y name
    ->where('entrepreneurship_id', $entrepreneurshipId)
    ->latest() 
    ->get();

    return response()->json($reviews);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $request, R2FileUploadService $fileUploadService)
{
    DB::beginTransaction();
    try {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|integer|exists:user_roles,id',
            'phone' => 'nullable|string|max:20',
            'province' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'banned' => 'nullable|boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'avatar_url' => 'nullable|string',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['confirmation_token'] = Str::random(40);
        $data['isConfirmed'] = false; // Changed from is_confirmed to isConfirmed

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $data['avatar_url'] = $fileUploadService->upload($avatar, 'users/avatars');
        }

        $user = User::create($data);

        // Rest of your code...
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error al registrar usuario: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error al registrar el usuario',
            'error' => $e->getMessage()
        ], 500);
    }
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
