<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

use App\Http\Controllers\Api\EntrepreneurshipController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FairController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\EntrepreneurshipChannelController;
use App\Http\Controllers\Api\AIAssistantController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Api\ProductOptionController;
use App\Http\Controllers\Api\ProductOptionValueController;
use App\Http\Controllers\Api\ProductCustomFormController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\FeaturedBusinessController;
use App\Http\Controllers\Api\SocialPlatformController;
use App\Http\Controllers\Api\PublicShareController;
use App\Http\Controllers\Api\UbicacionController;

use App\Mail\ContactUsMailable;
use App\Mail\ContactUsConfirmationMailable;

// Public routes (no authentication required)
Route::post('login', [UserController::class, 'login']);

// Public share metadata endpoint (no auth)
Route::get('public/share/product/{id}', [PublicShareController::class, 'productMeta']);


// Protected routes (authentication required)
Route::apiResource('entrepreneurships', EntrepreneurshipController::class);

Route::apiResource('products', ProductController::class);
Route::post('products/by-ids', [ProductController::class, 'getProductsByIds']);
Route::apiResource('fairs', FairController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('roles', RoleController::class);
Route::apiResource('favorites', FavoriteController::class);
Route::apiResource('interests', InterestController::class);
Route::apiResource('ubicaciones', UbicacionController::class)->parameters([
    'ubicaciones' => 'ubicacion'
]);
// User routes
Route::apiResource('users', UserController::class);

// Profile route for the authenticated user
Route::middleware('auth:api')->group(function () {
    Route::put('profile', [UserController::class, 'updateProfile']);
});
Route::apiResource('reviews', ReviewController::class);
Route::get('/fairs', [FairController::class, 'index']);
Route::get('/featured-business/today', [FeaturedBusinessController::class, 'today']);
Route::get('/featured-business/history', [FeaturedBusinessController::class, 'history']);

// Social platforms (redes)
Route::get('social-platforms', [SocialPlatformController::class, 'index']);
Route::get('social-platforms/{platform}', [SocialPlatformController::class, 'show']);

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

// Test logging
Route::get('test-log', function() {
    \Log::info('This is a test log message', ['test' => 'value']);
    return response()->json(['message' => 'Check your logs for the test message']);
});

// Orders
Route::get('orders', [OrdersController::class, 'index'])->middleware('auth:sanctum'); // infer user from token
Route::post('orders', [OrdersController::class, 'store']);
Route::post('orders/{order}/items', [OrdersController::class, 'addItem']);
Route::patch('orders/{order}/status', [OrdersController::class, 'updateStatus'])->middleware('auth:sanctum');
Route::delete('orders/{order}', [OrdersController::class, 'destroy'])->middleware('auth:sanctum');
Route::get('orders/{order}', [OrdersController::class, 'show'])->middleware('auth:sanctum');
Route::get('entrepreneurships/{entrepreneurship}/orders', [OrdersController::class, 'forEntrepreneur'])->middleware('auth:sanctum');
Route::get('orders-table', [OrdersController::class, 'table'])->middleware('auth:sanctum');


// AI Assistant routes
Route::post('assistant/chat', [AIAssistantController::class, 'chat'])->middleware('auth:api');
Route::post('assistant/virtual', [AIAssistantController::class, 'virtualAssistant'])->middleware('auth:api');
Route::post('assistant/validate/entrepreneurship', [AIAssistantController::class, 'validateEntrepreneurship'])->middleware('auth:api');
Route::post('assistant/validate/product', [AIAssistantController::class, 'validateProduct'])->middleware('auth:api');

Route::post('/inscripciones', [InscripcionController::class, 'store']);
Route::get('/inscripciones/{userId}', [InscripcionController::class, 'getByUser']);
Route::get('/inscripciones/feria/{fairId}', [InscripcionController::class, 'getByFair']);


Route::post('/ContactUs', function (Request $request) {
    $data = $request->validate([
        'email' => 'required|email',
        'subject' => 'required|string',
        'message' => 'required|string',
    ]);

    Mail::to('novateamucr@gmail.com')->send(new ContactUsMailable($data));
    Mail::to($data['email'])->send(new ContactUsConfirmationMailable($data));

    return response()->json(['message' => '¡Correo enviado exitosamente! Pronto serás contactado.']);
});

Route::get('/confirm-email/{token}', [UserController::class, 'confirmEmail']);


