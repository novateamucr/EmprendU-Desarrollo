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
                'code' => $this->channel_type,
                'label' => optional($this->platform)->label,
            ],
            'url' => $this->channel_url,
            // preferimos handle (número de teléfono, usuario, etc.),
            // y si no está, usamos channel_username como respaldo
            'handle' => $this->handle ?? $this->channel_username,
            'is_primary' => (bool) $this->is_primary,
            // Si es null (canales antiguos), lo consideramos público por defecto
            'is_public' => $this->is_public === null ? true : (bool) $this->is_public,
            'display_order' => (int) $this->display_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
