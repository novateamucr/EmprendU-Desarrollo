<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserFavorite;
use App\Models\Entrepreneurship;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = UserFavorite::with('entrepreneurship','user');

        if ($user = $request->query('user_id')) {
            $q->where('user_id', $user);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
        ]);

        $fav = UserFavorite::firstOrCreate([
            'user_id' => $data['user_id'],
            'entrepreneurship_id' => $data['entrepreneurship_id']
        ]);

        return response()->json($fav, 201);
    }

    public function show(UserFavorite $favorite)
    {
        return response()->json($favorite->load('entrepreneurship','user'));
    }

    public function destroy(UserFavorite $favorite)
    {
        $favorite->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
