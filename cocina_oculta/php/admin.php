<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/admin_data.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Admin Dashboard</title>
<style>
  body { font-family: sans-serif; background: #090909; color: #fff; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
  .card { background: #111; border: 1px solid #222; padding: 20px; border-radius: 8px; }
  h3 { color: #00F5FF; border-bottom: 1px solid #222; padding-bottom: 8px; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { text-align: left; padding: 8px; font-size: 13px; border-bottom: 1px solid #141414; }
  th { color: #666; text-transform: uppercase; font-size: 11px; }
  input, select, button { width: 100%; padding: 8px; background: #161616; border: 1px solid #222; color: #fff; margin-bottom: 10px; border-radius: 4px; }
  button { background: none; border-color: #00F5FF; color: #00F5FF; cursor: pointer; font-weight: bold; }
  .clickable { cursor: pointer; } .clickable:hover { background: #1a1a1a; }
  .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); justify-content: center; align-items: center; }
  .modal-box { background: #111; padding: 20px; border-radius: 8px; width: 400px; border: 1px solid #222; }
</style>
</head>
<body>

  <h2>PANEL DE GESTIÓN ADMINISTRATIVA</h2>

  <div class="grid">
    <!-- REGISTRO KARDEX -->
    <div class="card">
      <h3>Ajustar Inventario</h3>
      <?= $mensaje_kardex ?>
      <form action="" method="POST">
        <select name="id_insumo" required>
          <?php while($i = $insumos->fetch_assoc()): ?>
            <option value="<?= $i['id_insumo'] ?>"><?= htmlspecialchars($i['nombre']) ?></option>
          <?php endwhile; $insumos->data_seek(0); ?>
        </select>
        <select name="tipo" required>
          <option value="entrada">Entrada (+)</option>
          <option value="salida">Salida (-)</option>
        </select>
        <input type="number" step="0.01" name="cantidad" placeholder="Cantidad" required>
        <button type="submit" name="movimiento">REGISTRAR</button>
      </form>
    </div>

    <!-- REPORTE RÁPIDO -->
    <div class="card">
      <h3>Rendimiento Comercial</h3>
      <p><strong>Cliente Estrella:</strong> <?= htmlspecialchars($cliente_top['nombre'] ?? 'Ninguno') ?> (<?= $cliente_top['total'] ?? 0 ?> pedidos)</p>
      <h4>Top 5 Más Vendidos</h4>
      <?php while($pt = $prods_top->fetch_assoc()): ?>
        <div>• <?= htmlspecialchars($pt['nombre']) ?> (<?= $pt['total'] ?> uds)</div>
      <?php endwhile; ?>
    </div>
  </div>

    <div class="grid">
    <!-- TABLA INSUMOS -->
<div class="card">
  <h3>Existencias de Insumos</h3>
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Stock</th>
        <th>Unidad</th> <!-- Añadimos esta cabecera -->
      </tr>
    </thead>
    <tbody>
      <?php while ($i = $insumos->fetch_assoc()): ?>
        <tr>
            <td><?= htmlspecialchars($i['nombre']) ?></td>
            <td><strong><?= htmlspecialchars($i['stock_actual']) ?></strong></td>
            <td><?= htmlspecialchars($i['unidad_medida']) ?></td>
        </tr>
      <?php endwhile; ?>
    </tbody>
  </table>
</div>


    <!-- TABLA PRODUCTOINSUMO -->
    <div class="card">
      <h3>Fórmulas (ProductoInsumo)</h3>
      <table>
        <thead><tr><th>Producto</th><th>Insumo</th><th>Cantidad</th></tr></thead>
        <tbody>
          <?php while($re = $recetas->fetch_assoc()): ?>
            <tr><td><?= htmlspecialchars($re['prod']) ?></td><td><?= htmlspecialchars($re['ins']) ?></td><td><?= $re['cantidad_necesaria'] ?></td></tr>
          <?php endwhile; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- MONITOR DE PEDIDOS -->
  <div class="card" style="margin-bottom: 20px;">
    <h3>Monitor de Pedidos (Haga clic en una fila para ver Detalles)</h3>
    <table>
      <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Total</th></tr></thead>
      <tbody>
        <?php while($ped = $pedidos->fetch_assoc()): ?>
          <tr class="clickable" onclick="verDetalle(<?= $ped['id_pedido'] ?>)">
            <td>#<?= $ped['id_pedido'] ?></td>
            <td><?= $ped['fecha_pedido'] ?></td>
            <td><?= htmlspecialchars($ped['nombre']) ?></td>
            <td style="color:#39FF14; font-weight:bold;"><?= fmt($ped['total']) ?></td>
          </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>

  <!-- MOVIMIENTOS KARDEX -->
  <div class="card">
    <h3>Últimos Movimientos de Inventario</h3>
    <table>
      <thead><tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cantidad</th></tr></thead>
      <tbody>
        <?php while($m = $movs->fetch_assoc()): ?>
          <tr><td><?= $m['fecha'] ?></td><td><?= htmlspecialchars($m['nombre']) ?></td><td><?= strtoupper($m['tipo_movimiento']) ?></td><td><?= $m['cantidad'] ?></td></tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>

  <!-- VENTANA MODAL PARA DETALLE PEDIDO -->
  <div class="modal" id="boxModal">
    <div class="modal-box">
      <h3 id="mTitulo">Detalles</h3>
      <table>
        <thead><tr><th>Producto</th><th>Cant</th><th>Subtotal</th></tr></thead>
        <tbody id="mCuerpo"></tbody>
      </table>
      <button style="margin-top:15px; border-color:#FF2D95; color:#FF2D95;" onclick="document.getElementById('boxModal').style.display='none'">CERRAR</button>
    </div>
  </div>

<script>
function verDetalle(id) {
    document.getElementById('mTitulo').innerText = "Detalle de Orden #" + id;
    const tbody = document.getElementById('mCuerpo');
    tbody.innerHTML = "<tr><td colspan='3'>Buscando registros...</td></tr>";
    document.getElementById('boxModal').style.display = 'flex';

    fetch('admin_data.php?action=detalle&id=' + id)
        .then(r => r.json())
        .then(data => {
            tbody.innerHTML = "";
            data.forEach(item => {
                tbody.innerHTML += `<tr><td>${item.nombre}</td><td>${item.cantidad}</td><td style="color:#39FF14;">$${parseFloat(item.subtotal).toLocaleString('es-CO')}</td></tr>`;
            });
        });
}
</script>
</body>
</html>
