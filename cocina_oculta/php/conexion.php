<?php
$server = 'localhost';
$user   = 'root';
$pass   = '';
$bd     = 'cocina_oculta';
$enlace = mysqli_connect($server, $user, $pass, $bd);
if (!$enlace) {
die("Error de conexión");
}
?>