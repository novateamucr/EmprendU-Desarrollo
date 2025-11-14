<!DOCTYPE html>
<html>
<head>
    <title>Restablecimiento de Contraseña</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .password {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            border-radius: 5px;
            border: 1px dashed #999;
            letter-spacing: 2px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Restablecimiento de Contraseña</h2>
        </div>
        <div class="content">
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña en EmprendU. Aquí tienes tu nueva contraseña temporal:</p>
            
            <div class="password">
                {{ $temporaryPassword }}
            </div>
            
            <p>Por razones de seguridad, te recomendamos cambiar esta contraseña temporal después de iniciar sesión.</p>
            
            <p>Si no solicitaste este restablecimiento, por favor ignora este correo o contacta a soporte si tienes alguna pregunta.</p>
            
            <div class="footer">
                <p>© {{ date('Y') }} EmprendU. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>