<?php
include 'conexion.php';
$nombre_cliente = $_POST['nombre_cliente'];
$id_producto = $_POST['producto'];
$cantidad = $_POST['cantidad'];
$correo = $_POST['correo'];
$telefono = $_POST['telefono'];
$direccion = $_POST['direccion'];
// Iniciar transacción
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
}
// 2. Obtener precio producto
$sql_producto = "SELECT precio FROM producto WHERE id_producto = $id_producto";
$res_producto = mysqli_query($enlace, $sql_producto);
$producto = mysqli_fetch_assoc($res_producto);
$precio = $producto['precio'];
$subtotal = $precio * $cantidad;
// 3. Insertar pedido
$sql_pedido = "INSERT INTO pedido (fecha_pedido, total, id_cliente)
VALUES (NOW(), $subtotal, $id_cliente)";
mysqli_query($enlace, $sql_pedido);
$id_pedido = mysqli_insert_id($enlace);
// 4. Insertar detalle
$sql_detalle = "INSERT INTO detallepedido (cantidad, subtotal, id_pedido, id_producto)
VALUES ($cantidad, $subtotal, $id_pedido, $id_producto)";
mysqli_query($enlace, $sql_detalle);
// Confirmar
mysqli_commit($enlace);
echo " Pedido registrado correctamente";
} catch (Exception $e) {
    mysqli_rollback($enlace);
    // Cambia la línea de abajo para ver el error real
    echo "Error en el pedido: " . $e->getMessage(); 
}
?>