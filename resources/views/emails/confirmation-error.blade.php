<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error de confirmación</title>
    <style>
        body {
            background: #f3f4f6;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
        }
        .modal {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(40, 41, 61, 0.16), 0 1.5px 6px rgba(80,100,120,0.09);
            padding: 32px 40px;
            text-align: center;
            max-width: 340px;
            width: 100%;
            transition: box-shadow 0.2s;
            animation: popup 0.5s cubic-bezier(0.58, 0.04, 0.43, 1.03);
        }
        @keyframes popup {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        h1 {
            margin-top: 0;
            margin-bottom: 18px;
            color: #dc2626;
            font-size: 1.5rem;
        }
        p {
            color: #6b7280;
            font-size: 1rem;
            margin-bottom: 0;
            line-height: 2;
        }

    </style>
</head>
<body>
    <div class="modal">
        <h1>¡Ups! Ocurrió un error</h1>
        <p>Intenta confirmar de nuevo tu correo<br>
        No se pudo validar tu correo electrónico</p>
    </div>
</body>
</html>