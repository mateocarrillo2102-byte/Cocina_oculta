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

// 1. Registrar movimientos de almacén (movimientoinventario)
$mensaje_kardex = "";
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['movimiento'])) {
    $id_insumo = intval($_POST['id_insumo']);
    $tipo = mysqli_real_escape_string($enlace, $_POST['tipo']);
    $cant = floatval($_POST['cantidad']);

    if ($cant > 0 && ($tipo === 'entrada' || $tipo === 'salida')) {
        mysqli_begin_transaction($enlace);
        try {
            $stmt = $enlace->prepare("INSERT INTO movimientoinventario (id_insumo, tipo_movimiento, cantidad, fecha) VALUES (?, ?, ?, NOW())");
            $stmt->bind_param("isd", $id_insumo, $tipo, $cant);
            $stmt->execute();

            $modificador = ($tipo === 'entrada') ? $cant : -$cant;
            $stmt_up = $enlace->prepare("UPDATE insumo SET stock_actual = stock_actual + ? WHERE id_insumo = ?");
            $stmt_up->bind_param("di", $modificador, $id_insumo);
            $stmt_up->execute();

            mysqli_commit($enlace);
            $mensaje_kardex = "<span style='color:#39FF14;'>Kardex actualizado.</span>";
        } catch (Exception $e) {
            mysqli_rollback($enlace);
            $mensaje_kardex = "<span style='color:#FF2D95;'>Error: " . $e->getMessage() . "</span>";
        }
    }
}

// 2. API AJAX para obtener los detalles de un pedido específico
if (isset($_GET['action']) && $_GET['action'] === 'detalle' && isset($_GET['id'])) {
    header('Content-Type: application/json');
    $id = intval($_GET['id']);
    $res = $enlace->query("SELECT dp.cantidad, dp.subtotal, p.nombre FROM detallepedido dp JOIN producto p ON dp.id_producto = p.id_producto WHERE dp.id_pedido = $id");
    $data = [];
    while ($row = $res->fetch_assoc()) { $data[] = $row; }
    echo json_encode($data);
    exit;
}

// 3. Consultas generales para las tablas del administrador
$insumos = $enlace->query("SELECT id_insumo, nombre, stock_actual, unidad_medida FROM insumo ORDER BY nombre ASC");
$movs = $enlace->query("SELECT m.fecha, m.tipo_movimiento, m.cantidad, i.nombre FROM movimientoinventario m JOIN insumo i ON m.id_insumo = i.id_insumo ORDER BY m.fecha DESC LIMIT 10");
$recetas = $enlace->query("SELECT p.nombre as prod, i.nombre as ins, pi.cantidad_necesaria FROM productoinsumo pi JOIN producto p ON pi.id_producto = p.id_producto JOIN insumo i ON pi.id_insumo = i.id_insumo");
$prods_top = $enlace->query("SELECT pr.nombre, SUM(dp.cantidad) as total FROM detallepedido dp JOIN producto pr ON dp.id_producto = pr.id_producto GROUP BY dp.id_producto ORDER BY total DESC LIMIT 5");
$pedidos = $enlace->query("SELECT p.id_pedido, p.fecha_pedido, p.total, c.nombre FROM pedido p JOIN cliente c ON p.id_cliente = c.id_cliente ORDER BY p.fecha_pedido DESC LIMIT 10");

$res_c = $enlace->query("SELECT c.nombre, COUNT(p.id_pedido) as total FROM cliente c JOIN pedido p ON c.id_cliente = p.id_cliente GROUP BY c.id_cliente ORDER BY total DESC LIMIT 1");
$cliente_top = $res_c ? $res_c->fetch_assoc() : ['nombre' => 'Ninguno', 'total' => 0];

function fmt($n) { return '$' . number_format($n, 0, ',', '.'); }
?>