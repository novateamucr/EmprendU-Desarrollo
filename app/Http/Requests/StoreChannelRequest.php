<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChannelRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $platform = $this->input('platform_code');
        $urlRule = 'nullable|url|max:500';
        if ($platform === 'phone') {
            // para teléfono permitimos un string simple (el número), no una URL
            $urlRule = 'nullable|string|max:500';
        }

        return [
            'platform_code' => 'required|string|exists:social_platforms,code',
            'url' => $urlRule,
            'handle' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer',
        ];
    }
}
