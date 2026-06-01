<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/admin_data.php';
if (isset($_POST['ingresar'])) {
	$usuario = mysqli_real_escape_string($enlace, $_POST['user']);
	$pass = $_POST['pass']; // No es necesario aplicar escape string a la contraseña limpia
	$sql = "SELECT * FROM usuario WHERE email='$usuario'"; 
	$resultado = $enlace->query($sql);
	
	if ($resultado && $resultado->num_rows > 0) {
		$row = $resultado->fetch_assoc();
		if (password_verify($pass, $row['password'])) {
			$_SESSION['id_usuario'] = $row['id_usuario'];
			$_SESSION['rol'] = $row['rol'];
			switch ($_SESSION['rol']) {
				case 'admin':
					header("location: ../php/admin.php");
					break;
				case '2':
					header("location: ../html/clientes.html");
					break;
				default:
					header("location: ../html/pedido.html");
					break;
			}
			exit; 
		} else {
			// Contraseña incorrecta
			echo "<script>alert('Usuario o contraseña incorrectos'); window.location.href='index.html';</script>";
		}
}
}
?>