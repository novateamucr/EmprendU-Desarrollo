<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entrepreneurship;
use App\Http\Requests\StoreEntrepreneurshipRequest;
use App\Http\Requests\UpdateEntrepreneurshipRequest;
use App\Http\Resources\EntrepreneurshipResource;

class EntrepreneurshipController extends Controller
{
    public function index()
    {
        $items = Entrepreneurship::with(['owner', 'categoryRelation', 'products'])->paginate(15);
        return EntrepreneurshipResource::collection($items);
    }

    public function store(StoreEntrepreneurshipRequest $request)
    {
        $data = $request->validated();
        $entre = Entrepreneurship::create($data);
        return new EntrepreneurshipResource($entre->load(['owner', 'categoryRelation', 'products']));
    }

    public function show(Entrepreneurship $entrepreneurship)
    {
        return new EntrepreneurshipResource($entrepreneurship->load(['owner', 'categoryRelation', 'products']));
    }

    public function update(UpdateEntrepreneurshipRequest $request, Entrepreneurship $entrepreneurship)
    {
        $entrepreneurship->update($request->validated());
        return new EntrepreneurshipResource($entrepreneurship->load(['owner', 'categoryRelation', 'products']));
    }

    public function destroy(Entrepreneurship $entrepreneurship)
    {
        $entrepreneurship->delete();
        return response()->json(['message' => 'Deleted'], 200);
    }
}
