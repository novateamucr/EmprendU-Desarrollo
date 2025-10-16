<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChannelRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'platform_code' => 'sometimes|required|string|exists:social_platforms,code',
            'url' => 'nullable|url|max:500',
            'handle' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer',
        ];
    }
}
