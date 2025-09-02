<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EntrepreneurshipCategory;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(EntrepreneurshipCategory::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:50|unique:entrepreneurship_categories,nombre'
        ]);

        $cat = EntrepreneurshipCategory::create($data);
        return response()->json($cat, 201);
    }

    public function show(EntrepreneurshipCategory $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, EntrepreneurshipCategory $category)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:50|unique:entrepreneurship_categories,nombre,' . $category->id
        ]);

        $category->update($data);
        return response()->json($category);
    }

    public function destroy(EntrepreneurshipCategory $category)
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}
