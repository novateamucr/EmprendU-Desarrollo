<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EntrepreneurshipResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Usa whenLoaded para solo incluir relaciones si fueron cargadas con with()/load()
     * Esto te permite controlar queries y evitar N+1 desde el controller.
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'category' => $this->whenLoaded('categoryRelation', function () {
                return [
                    'id' => $this->categoryRelation->id,
                    'nombre' => $this->categoryRelation->nombre,
                ];
            }),
            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'username' => $this->owner->username,
                    'avatar_url' => $this->owner->avatar_url,
                ];
            }),
            // products puede ser una colección simple o usar ProductResource si la tienes
            'products' => $this->whenLoaded('products', function () {
                return $this->products->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'price' => (float) $p->price,
                        'image_url' => $p->image_url,
                    ];
                });
            }),
            'favorites_count' => $this->whenLoaded('favorites', function () {
                return $this->favorites->count();
            }, $this->when(! $this->relationLoaded('favorites') && isset($this->favorites_count), $this->favorites_count)),
            'created_at' => $this->created_at ? $this->created_at->toDateTimeString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toDateTimeString() : null,
        ];
    }
}
