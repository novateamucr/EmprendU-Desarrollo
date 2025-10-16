<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Entrepreneurship;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        Gate::define('manage-entrepreneurship', function ($user, int $entrepreneurshipId) {
            $ownerId = Entrepreneurship::where('id', $entrepreneurshipId)->value('user_id');
            return $ownerId && (int) $user->id === (int) $ownerId;
        });
    }
}
