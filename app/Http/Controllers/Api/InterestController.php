<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserInterest;
use App\Models\User;
use App\Models\EntrepreneurshipCategory;

class InterestController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = UserInterest::with(['user','category']);

        if ($userId = $request->query('user_id')) {
            $q->where('user_id', $userId);
        }
        if ($categoryId = $request->query('category_id')) {
            $q->where('category_id', $categoryId);
        }

        // If client requests format=names, return a simple array of category names
        if ($request->query('format') === 'names') {
            $rows = $q->get();
            $names = $rows->map(function ($r) {
                return optional($r->category)->nombre;
            })->filter()->values();
            return response()->json(['interests' => $names]);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:entrepreneurship_categories,id'
        ]);

        $interest = UserInterest::firstOrCreate([
            'user_id' => $data['user_id'],
            'category_id' => $data['category_id']
        ]);

        return response()->json($interest->load(['user','category']), 201);
    }

    public function show(UserInterest $interest)
    {
        return response()->json($interest->load('user'));
    }

    public function update(Request $request, UserInterest $interest)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:entrepreneurship_categories,id'
        ]);

        // Ensure uniqueness per user
        $exists = UserInterest::where('user_id', $interest->user_id)
            ->where('category_id', $data['category_id'])
            ->where('id', '!=', $interest->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Interest already exists for this user'], 422);
        }

        $interest->update($data);
        return response()->json($interest->fresh()->load(['user','category']));
    }

    public function destroy(UserInterest $interest)
    {
        $interest->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
