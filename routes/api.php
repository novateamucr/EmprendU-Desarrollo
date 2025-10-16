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
use App\Http\Controllers\Api\EntrepreneurshipChannelController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Api\ProductOptionController;
use App\Http\Controllers\Api\ProductOptionValueController;
use App\Http\Controllers\Api\ProductCustomFormController;
use App\Http\Controllers\Api\OrdersController;

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
Route::get('/fairs', [FairController::class, 'index']);

// Secure password update route (expects current_password, password, password_confirmation)
Route::put('users/{user}/password', [UserController::class, 'updatePassword']);

// Entrepreneurship Channels (nested)
Route::get('entrepreneurships/{entrepreneurship}/channels', [EntrepreneurshipChannelController::class, 'index']);
Route::post('entrepreneurships/{entrepreneurship}/channels', [EntrepreneurshipChannelController::class, 'store']);
Route::put('entrepreneurships/{entrepreneurship}/channels/{channel}', [EntrepreneurshipChannelController::class, 'update']);
Route::delete('entrepreneurships/{entrepreneurship}/channels/{channel}', [EntrepreneurshipChannelController::class, 'destroy']);

// Product Options (nested under products)
Route::get('products/{product}/options', [ProductOptionController::class, 'index']);
Route::post('products/{product}/options', [ProductOptionController::class, 'store']);
Route::get('products/{product}/options/{option}', [ProductOptionController::class, 'show']);
Route::put('products/{product}/options/{option}', [ProductOptionController::class, 'update']);
Route::delete('products/{product}/options/{option}', [ProductOptionController::class, 'destroy']);

// Product Option Values (nested under product option)
Route::get('products/{product}/options/{option}/values', [ProductOptionValueController::class, 'index']);
Route::post('products/{product}/options/{option}/values', [ProductOptionValueController::class, 'store']);
Route::get('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'show']);
Route::put('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'update']);
Route::delete('products/{product}/options/{option}/values/{value}', [ProductOptionValueController::class, 'destroy']);

// Product Custom Forms (nested under products)
Route::get('products/{product}/custom-forms', [ProductCustomFormController::class, 'index']);
Route::post('products/{product}/custom-forms', [ProductCustomFormController::class, 'store']);
Route::get('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'show']);
Route::put('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'update']);
Route::delete('products/{product}/custom-forms/{custom_form}', [ProductCustomFormController::class, 'destroy']);

// Orders
Route::get('orders', [OrdersController::class, 'index']); // ?entrepreneurship_id=
Route::post('orders', [OrdersController::class, 'store']);
Route::post('orders/{order}/items', [OrdersController::class, 'addItem']);
Route::patch('orders/{order}/status', [OrdersController::class, 'updateStatus']);
Route::delete('orders/{order}', [OrdersController::class, 'destroy']);

