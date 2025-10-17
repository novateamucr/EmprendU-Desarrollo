<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_item_id' => $this->order_item_id,
            'product_option_id' => $this->product_option_id,
            'product_option_value_id' => $this->product_option_value_id,
            'option_name' => $this->option_name,
            'option_value' => $this->option_value,
            'price_delta' => (float) $this->price_delta,
        ];
    }
}
