<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserInterest;
use App\Models\User;

class InterestController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = UserInterest::with('user');

        if ($userId = $request->query('user_id')) {
            $q->where('user_id', $userId);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'interest' => 'required|string|max:100'
        ]);

        // unique constraint in DB will protect duplicates, but try to avoid exception:
        $interest = UserInterest::firstOrCreate([
            'user_id' => $data['user_id'],
            'interest' => $data['interest']
        ]);

        return response()->json($interest, 201);
    }

    public function show(UserInterest $interest)
    {
        return response()->json($interest->load('user'));
    }

    public function update(Request $request, UserInterest $interest)
    {
        $data = $request->validate([
            'interest' => 'required|string|max:100'
        ]);

        // Ensure uniqueness per user
        $exists = UserInterest::where('user_id', $interest->user_id)
            ->where('interest', $data['interest'])
            ->where('id', '!=', $interest->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Interest already exists for this user'], 422);
        }

        $interest->update($data);
        return response()->json($interest->fresh());
    }

    public function destroy(UserInterest $interest)
    {
        $interest->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
