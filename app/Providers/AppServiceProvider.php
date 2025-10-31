<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\R2FileUploadService;
use App\Services\ImageModerationService;
use App\Services\OpenAIService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ImageModerationService::class, function ($app) {
            return new ImageModerationService();
        });

        $this->app->singleton(R2FileUploadService::class, function ($app) {
            return new R2FileUploadService(
                $app->make(ImageModerationService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
