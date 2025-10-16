<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id' => ['required','exists:products,id'],
            'quantity' => ['required','integer','min:1'],
            'unit_price' => ['required','numeric','min:0'],
            'order_item_options' => ['array'],
            'order_item_options.*.product_option_id' => ['nullable','integer'],
            'order_item_options.*.product_option_value_id' => ['nullable','integer'],
            'order_item_options.*.option_name' => ['required','string','max:255'],
            'order_item_options.*.option_value' => ['nullable','string','max:255'],
            'order_item_options.*.price_delta' => ['required','numeric'],
        ];
    }
}
