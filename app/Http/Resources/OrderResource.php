<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entrepreneurship_id' => $this->entrepreneurship_id,
            'entrepreneurship_name' => optional($this->whenLoaded('entrepreneurship') ?? $this->entrepreneurship)->name,
            'entrepreneurship' => $this->whenLoaded('entrepreneurship', function () {
                return [
                    'id' => optional($this->entrepreneurship)->id,
                    'name' => optional($this->entrepreneurship)->name,
                ];
            }),
            'customer_name' => $this->customer_name,
            'customer_phone_8' => $this->customer_phone_8,
            'customer_email' => $this->customer_email,
            'status' => $this->status,
            'items_total' => (float) $this->items_total,
            'options_total' => (float) $this->options_total,
            'shipping_total' => (float) $this->shipping_total,
            'discount_total' => (float) $this->discount_total,
            'grand_total' => (float) $this->grand_total,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'additional_location' => $this->whenLoaded('additionalLocation'),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
