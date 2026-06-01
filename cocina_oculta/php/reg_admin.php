<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include 'conexion.php';
session_start();
// Control estricto de acceso por rol
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'administrativo') {
    header("Location: login.php");
    exit;
}
$nombre_admin = $_POST['nombre_admin'];
$correo = $_POST['correo'];
$contrasena = $_POST['contrasena'];
$contrasena_encriptada = password_hash($contrasena, PASSWORD_DEFAULT);
mysqli_begin_transaction($enlace);
try {
// 1. Verificar si cliente existe
$sql_usuario = "SELECT id_usuario FROM usuario WHERE nombre = '$nombre_admin'";
$res_usuario = mysqli_query($enlace, $sql_usuario);
if (mysqli_num_rows($res_usuario) > 0) {
$row = mysqli_fetch_assoc($res_usuario);
$id_usuario = $row['id_usuario'];
} else {
$sql_insert_usuario = "INSERT INTO usuario (nombre, email, password, rol) VALUES ('$nombre_admin', '$correo', '$contrasena_encriptada', '1')";
mysqli_query($enlace, $sql_insert_usuario);
}
  mysqli_commit($enlace);
  echo "<script>alert('Administrador registrado correctamente'); window.location.href='index.html';</script>";
}
catch (Exception $e) {
    mysqli_rollback($enlace);
    // Cambia la línea de abajo para ver el error real
    echo "Error al registrar el administrador: " . $e->getMessage(); 
}
?>