<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EntrepreneurshipChannelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'platform' => [
                'code' => $this->platform_code,
                'label' => optional($this->platform)->label,
            ],
            'url' => $this->url,
            'handle' => $this->handle,
            'is_primary' => (bool) $this->is_primary,
            'is_public' => (bool) $this->is_public,
            'display_order' => (int) $this->display_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
