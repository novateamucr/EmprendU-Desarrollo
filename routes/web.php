<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\View;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Share endpoints (HTML with Open Graph metadata for scrapers)
Route::get('/share/product/{id}', [ShareController::class, 'product'])->name('share.product');
//Route::get('/confirm-email/{token}', [UserController::class, 'confirmEmail']);//esta ruta era de prueba para ver las vistas de confirmacion de correo
Route::get('/preview-mail', function () {
    $data = [
        'subject' => 'Bienvenido a EmpowerUp 💙',
        'greeting' => '¡Hola, Vale!',
        'content' => "Gracias por unirte a nuestra comunidad EmpowerUp.\n\nHaz clic en el botón para activar tu cuenta.",
        'action_url' => 'https://empowerup.com/activar',
        'action_text' => 'Activar cuenta',
    ];

    return View::make('user.notification', ['data' => $data]);
});