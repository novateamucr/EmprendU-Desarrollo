<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'entrepreneurship_id' => ['required','exists:entrepreneurships,id'],
            'user_id' => ['nullable','exists:users,id'],
            'customer_name' => ['required','string','max:255'],
            'customer_phone_8' => ['required','digits:8'],
            'customer_email' => ['required','email','max:255'],
            'notes' => ['nullable','string'],
            'shipping_total' => ['nullable','numeric','min:0'],
            'discount_total' => ['nullable','numeric','min:0'],
            'status' => ['nullable','in:draft,requested,accepted,canceled,completed,rated'],
        ];
    }
}
