<?php
include 'conexion.php';
$nombre_cliente = $_POST['nombre_cliente'];
$correo = $_POST['correo'];
$telefono = $_POST['telefono'];
$direccion = $_POST['direccion'];
$contrasena = $_POST['contrasena'];
$contrasena_encriptada = password_hash($contrasena, PASSWORD_DEFAULT);
mysqli_begin_transaction($enlace);
try {
// 1. Verificar si cliente existe
$sql_cliente = "SELECT id_cliente FROM cliente WHERE nombre = '$nombre_cliente'";
$res_cliente = mysqli_query($enlace, $sql_cliente);
if (mysqli_num_rows($res_cliente) > 0) {
$row = mysqli_fetch_assoc($res_cliente);
$id_cliente = $row['id_cliente'];
} else {
// Crear cliente si no existe
$sql_insert_cliente = "INSERT INTO cliente (nombre, telefono, direccion, correo)
VALUES ('$nombre_cliente', '$telefono', '$direccion', '$correo')";
mysqli_query($enlace, $sql_insert_cliente);
$id_cliente = mysqli_insert_id($enlace);
$sql_insert_usuario = "INSERT INTO usuario (nombre, email, password, rol) VALUES ('$nombre_cliente', '$correo', '$contrasena_encriptada', 'admin')";
mysqli_query($enlace, $sql_insert_usuario);
}
  mysqli_commit($enlace);
}
 catch (Exception $e) {
    mysqli_rollback($enlace);
    // Cambia la línea de abajo para ver el error real
    echo "Error al registrar el cliente: " . $e->getMessage(); 
}
?>