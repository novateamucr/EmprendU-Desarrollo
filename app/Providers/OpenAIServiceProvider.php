<?php

namespace App\Providers;

use App\Services\OpenAIService;
use Illuminate\Support\ServiceProvider;

class OpenAIServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(OpenAIService::class, function ($app) {
            return new OpenAIService();
        });
    }

    public function boot()
    {
        //
    }
}
