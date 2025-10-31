<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba de correos</title>
</head>
<body>
    <h2>Nuevo mensaje desde formulario de contacto</h2>
    <p><strong>Correo:</strong> {{ $data['email'] }}</p>
    <p><strong>Asunto:</strong> {{ $data['subject'] }}</p>
    <p><strong>Mensaje:</strong></p>
    <p>{{ $data['message'] }}</p>
</body>
</html>