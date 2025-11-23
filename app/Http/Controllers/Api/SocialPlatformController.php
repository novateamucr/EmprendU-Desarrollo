<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialPlatform;
use Illuminate\Http\Request;

class SocialPlatformController extends Controller
{
    public function index()
    {
        return response()->json(
            SocialPlatform::orderBy('label')->get(['code', 'label'])
        );
    }

    public function show(SocialPlatform $platform)
    {
        return response()->json([
            'code' => $platform->code,
            'label' => $platform->label,
        ]);
    }
}
