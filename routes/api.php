<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\EntrepreneurshipController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FairController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AIAssistantController;
use App\Http\Controllers\ReviewController;

// Public routes (no authentication required)
Route::post('login', [UserController::class, 'login']);

// Protected routes (authentication required)
Route::apiResource('entrepreneurships', EntrepreneurshipController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('fairs', FairController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('roles', RoleController::class);
Route::apiResource('favorites', FavoriteController::class);
Route::apiResource('interests', InterestController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('reviews', ReviewController::class);

// Secure password update route (expects current_password, password, password_confirmation)
Route::put('users/{user}/password', [UserController::class, 'updatePassword']);

// AI Assistant routes
Route::post('assistant/chat', [AIAssistantController::class, 'chat'])->middleware('auth:api');
Route::post('assistant/virtual', [AIAssistantController::class, 'virtualAssistant'])->middleware('auth:api');
Route::post('assistant/validate/entrepreneurship', [AIAssistantController::class, 'validateEntrepreneurship'])->middleware('auth:api');
Route::post('assistant/validate/product', [AIAssistantController::class, 'validateProduct'])->middleware('auth:api');
