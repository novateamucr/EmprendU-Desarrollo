<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Correo - Correos de Formulario</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fb;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            background-color: #ffffff;
            margin: 40px auto;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background-color: #76B0CD;
            color: white;
            text-align: center;
            padding: 25px 20px;
        }
        .header h2 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 25px 30px;
        }
        .content p {
            font-size: 15px;
        }
        .content strong {
            color: #76B0CD;
        }
        .message {
            background-color: #f0f4ff;
            border-left: 4px solid #76B0CD;
            padding: 15px;
            border-radius: 8px;
            line-height: 1.6;
        }
        .messageUser{
            background-color: #f0f4ff;
            line-height: 1.6;
            padding: 15px;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            background-color: #f9fafc;
            color: #777;
            font-size: 13px;
            padding: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Nuevo mensaje desde el formulario de contacto</h2>
        </div>
        <div class="content">
            <p class="messageUser">¡Gracias por contactarnos! <br> Recibimos tu mensaje y pronto te responderemos. <br>Aquí encontrarás una copia de tu mensaje ingresado al formulario de contacto. </p>
            <p><strong>Correo:</strong> {{ $data['email'] }}</p>
            <p><strong>Asunto:</strong> {{ $data['subject'] }}</p>
            <p><strong>Mensaje:</strong></p>
            <div class="message">
                {{ $data['message'] }}
            </div>
        </div>
        <div class="footer">
            <p>Este mensaje fue enviado desde el sitio web de EmpowerUp</p>
        </div>
    </div>
</body>
</html>
