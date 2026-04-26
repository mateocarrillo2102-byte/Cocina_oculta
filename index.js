const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});


const CSS = `
<style>
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; display: flex; }
    nav { width: 220px; background: #1a73e8; color: white; height: 100vh; position: fixed; padding: 20px; }
    nav h1 { font-size: 1.2em; border-bottom: 1px solid #64b5f6; padding-bottom: 10px; }
    nav a { display: block; color: white; text-decoration: none; padding: 12px; border-radius: 5px; margin: 8px 0; transition: 0.3s; }
    nav a:hover { background: #1557b0; }
    .main { margin-left: 260px; padding: 40px; width: 100%; }
    .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #f8f9fa; color: #555; }
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    input, select, textarea { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    .btn { background: #1a73e8; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold; background: #e8f0fe; color: #1967d2; }
</style>`;

const NAVBAR = `
<nav>
    <h1>🍳 Cocina Oculta</h1>
    <a href="/">📦 Pedidos</a>
    <a href="/clientes">👥 Clientes</a>
    <a href="/domiciliarios">🛵 Domiciliarios</a>
    <a href="/productos">🍕 Productos</a>
    <a href="/insumos">🌾 Insumos</a>
    <a href="/recetas">🍳 Recetas</a>
    <a href="/movimientos">📈 Movimientos</a>
    <a href="/detalles">📋 Detalles</a>
    <a href="/historial">📜 Historial</a>
</nav>`;

app.get('/', (req, res) => {
    // 1. Consultar Clientes
    db.query('SELECT * FROM cliente', (err, clientes) => {
        if (err) return res.status(500).send("Error en Tabla Cliente: " + err.message);

        // 2. Consultar Domiciliarios
        db.query('SELECT * FROM domiciliario WHERE disponible = 1', (err, domis) => {
            if (err) return res.status(500).send("Error en Tabla Domiciliario: " + err.message);

            // 3. Consultar Productos
            db.query('SELECT * FROM producto WHERE disponible = 1', (err, productos) => {
                if (err) return res.status(500).send("Error en Tabla Producto: " + err.message);

                // 4. Consultar Pedidos
                const qPedidos = `
                    SELECT p.*, c.nombre as cliente 
                    FROM pedido p 
                    LEFT JOIN cliente c ON p.id_cliente = c.id_cliente 
                    WHERE p.estado NOT IN ('entregado', 'cancelado') 
                    ORDER BY p.fecha_pedido DESC`;

                db.query(qPedidos, (err, pedidos) => {
                    if (err) return res.status(500).send("Error en Tabla Pedidos: " + err.message);

                    // VALIDACIÓN DE SEGURIDAD: Si son undefined, los volvemos listas vacías
                    const listaClientes = clientes || [];
                    const listaDomis = domis || [];
                    const listaProductos = productos || [];
                    const listaPedidos = pedidos || [];

                    res.send(`${CSS} ${NAVBAR} 
                        <div class="main"><div class="card">
                            <h2>📦 Registrar Pedido</h2>
                            <form action="/pedidos/crear" method="POST">
                                <select name="id_cliente" required>
                                    <option value="">Cliente...</option>
                                    ${listaClientes.map(c => `<option value="${c.id_cliente}">${c.nombre}</option>`).join('')}
                                </select>
                                
                                <select name="id_domiciliario">
                                    <option value="">Asignar Domiciliario...</option>
                                    ${listaDomis.map(d => `<option value="${d.id_domiciliario}">${d.nombre}</option>`).join('')}
                                </select>

                                <select name="id_producto" required>
                                    <option value="">Producto...</option>
                                    ${listaProductos.map(p => `<option value="${p.id_producto}">${p.nombre}</option>`).join('')}
                                </select>

                                <input type="number" name="total" placeholder="Total $" step="0.01" value="0">
                                <textarea name="observaciones" placeholder="Observaciones..."></textarea>
                                <button class="btn" type="submit">Crear Pedido</button>
                            </form>
                            
                            <table>
                                <tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Acción</th></tr>
                                ${listaPedidos.map(p => `<tr>
                                    <td>#${p.id_pedido}</td>
                                    <td>${p.cliente || 'N/A'}</td>
                                    <td><span class="badge">${p.estado}</span></td>
                                    <td>$${p.total}</td>
                                    <td><small>En curso...</small></td>
                                </tr>`).join('')}
                            </table>
                        </div></div>`
                    );
                });
            });
        });
    });
});

// --- VISTA DOMICILIARIOS ---
app.get('/domiciliarios', (req, res) => {
    db.query('SELECT * FROM domiciliario', (err, domis) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>🛵 Gestión de Domiciliarios</h2>
            <form action="/domiciliarios/crear" method="POST">
                <input type="text" name="nombre" placeholder="Nombre" required>
                <input type="text" name="telefono" placeholder="Teléfono" required>
                <select name="medio_transporte">
                    <option value="moto">Moto</option><option value="bicicleta">Bicicleta</option><option value="a pie">A pie</option><option value="otro">Otro</option>
                </select>
                <button class="btn" type="submit">Registrar</button>
            </form>
            <table>
                <tr><th>ID</th><th>Nombre</th><th>Transporte</th><th>Disponible</th></tr>
                ${domis.map(d => `<tr><td>${d.id_domiciliario}</td><td>${d.nombre}</td><td>${d.medio_transporte}</td><td>${d.disponible ? '✅' : '❌'}</td></tr>`).join('')}
            </table>
        </div></div>`);
    });
});

// --- VISTA PRODUCTOS ---
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM producto', (err, productos) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>🍕 Menú de Productos</h2>
            <form action="/productos/crear" method="POST">
                <input type="text" name="nombre" placeholder="Nombre Producto" required>
                <input type="number" name="precio" placeholder="Precio" step="0.01" required>
                <textarea name="descripcion" placeholder="Descripción..."></textarea>
                <button class="btn" type="submit">Añadir al Menú</button>
            </form>
            <table>
                <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Disponible</th></tr>
                ${productos.map(p => `<tr><td>${p.id_producto}</td><td>${p.nombre}</td><td>$${p.precio}</td><td>${p.disponible ? 'SÍ' : 'NO'}</td></tr>`).join('')}
            </table>
        </div></div>`);
    });
});

// --- RUTA CLIENTES (CORREGIDA) ---
app.get('/clientes', (req, res) => {
    db.query('SELECT * FROM cliente', (err, clientes) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>👥 Clientes</h2>
            <form action="/clientes/crear" method="POST">
                <input type="text" name="nombre" placeholder="Nombre" required>
                <input type="text" name="telefono" placeholder="Teléfono" required>
                <input type="text" name="direccion" placeholder="Dirección" required>
                <input type="email" name="correo" placeholder="Correo">
                <button class="btn" type="submit">Registrar</button>
            </form>
            <table>
                <tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Dirección</th></tr>
                ${clientes.map(c => `<tr><td>${c.id_cliente}</td><td>${c.nombre}</td><td>${c.telefono}</td><td>${c.direccion}</td></tr>`).join('')}
            </table>
        </div></div>`);
    });
});
// --- VISTA INSUMOS E INVENTARIO ---
app.get('/insumos', (req, res) => {
    const qInsumos = "SELECT * FROM insumo";
    const qMovimientos = "SELECT m.*, i.nombre as insumo_nombre FROM movimientoinventario m JOIN insumo i ON m.id_insumo = i.id_insumo ORDER BY m.fecha_movimiento DESC LIMIT 10";

    db.query(qInsumos, (err, insumos) => {
        db.query(qMovimientos, (err, movs) => {
            res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
                <h2>🌾 Gestión de Insumos (Stock)</h2>
                <form action="/insumos/crear" method="POST">
                    <input type="text" name="nombre" placeholder="Nombre Insumo (ej. Harina)" required>
                    <input type="text" name="unidad" placeholder="Unidad (kg, lt, und)" required>
                    <input type="number" name="minima" placeholder="Cant. Mínima" step="0.01">
                    <button class="btn" type="submit">Crear Insumo</button>
                </form>
                
                <table>
                    <tr><th>ID</th><th>Insumo</th><th>Disponible</th><th>U. Medida</th><th>Estado</th></tr>
                    ${insumos.map(i => `<tr>
                        <td>${i.id_insumo}</td>
                        <td><strong>${i.nombre}</strong></td>
                        <td>${i.cantidad_disponible}</td>
                        <td>${i.unidad_medida}</td>
                        <td>${i.cantidad_disponible <= i.cantidad_minima ? '<span class="badge" style="background:#fce8e6; color:#d93025;">Stock Bajo</span>' : '<span class="badge" style="background:#e6f4ea; color:#1e8e3e;">OK</span>'}</td>
                    </tr>`).join('')}
                </table>

                <br><hr><br>

                <h2>🔄 Registrar Movimiento (Entrada/Salida)</h2>
                <form action="/insumos/movimiento" method="POST">
                    <select name="id_insumo" required>
                        <option value="">Seleccionar Insumo...</option>
                        ${insumos.map(i => `<option value="${i.id_insumo}">${i.nombre}</option>`)}
                    </select>
                    <select name="tipo" required>
                        <option value="entrada">Entrada (+)</option>
                        <option value="salida">Salida (-)</option>
                    </select>
                    <input type="number" name="cantidad" placeholder="Cantidad" step="0.01" required>
                    <input type="text" name="descripcion" placeholder="Motivo (ej. Compra semanal)">
                    <button class="btn" style="background:#5f6368;" type="submit">Registrar Movimiento</button>
                </form>
            </div></div>`);
        });
    });
});

app.get('/recetas', (req, res) => {
    const qProd = "SELECT id_producto, nombre FROM producto";
    const qIns = "SELECT id_insumo, nombre FROM insumo";
    const qRecetas = `
        SELECT pi.*, p.nombre as producto, i.nombre as insumo 
        FROM productoinsumo pi 
        JOIN producto p ON pi.id_producto = p.id_producto 
        JOIN insumo i ON pi.id_insumo = i.id_insumo`;

    db.query(qProd, (err, productos) => {
        db.query(qIns, (err, insumos) => {
            db.query(qRecetas, (err, recetas) => {
                res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
                    <h2>🍳 Definir Recetas (Insumos por Producto)</h2>
                    <form action="/recetas/crear" method="POST">
                        <select name="id_producto" required>
                            <option value="">Producto...</option>
                            ${productos.map(p => `<option value="${p.id_producto}">${p.nombre}</option>`)}
                        </select>
                        <select name="id_insumo" required>
                            <option value="">Insumo que usa...</option>
                            ${insumos.map(i => `<option value="${i.id_insumo}">${i.nombre}</option>`)}
                        </select>
                        <input type="number" name="cantidad_usada" placeholder="Cantidad usada" step="0.01" required>
                        <button class="btn" type="submit">Vincular Insumo</button>
                    </form>
                    <table>
                        <tr><th>Producto</th><th>Insumo Usado</th><th>Cantidad por Unidad</th></tr>
                        ${recetas.map(r => `<tr><td>${r.producto}</td><td>${r.insumo}</td><td>${r.cantidad_usada}</td></tr>`).join('')}
                    </table>
                </div></div>`);
            });
        });
    });
});

app.get('/movimientos', (req, res) => {
    const qMovs = `
        SELECT m.*, i.nombre as insumo 
        FROM movimientoinventario m 
        JOIN insumo i ON m.id_insumo = i.id_insumo 
        ORDER BY m.fecha_movimiento DESC`;

    db.query(qMovs, (err, movimientos) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>📜 Historial de Movimientos de Inventario</h2>
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cantidad</th><th>Descripción</th></tr>
                </thead>
                <tbody>
                    ${movimientos.map(m => `
                        <tr>
                            <td>${new Date(m.fecha_movimiento).toLocaleString()}</td>
                            <td><strong>${m.insumo}</strong></td>
                            <td><span class="badge" style="background:${m.tipo === 'entrada' ? '#e6f4ea' : '#fce8e6'}; color:${m.tipo === 'entrada' ? '#1e8e3e' : '#d93025'};">${m.tipo.toUpperCase()}</span></td>
                            <td>${m.cantidad}</td>
                            <td>${m.descripcion || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div></div>`);
    });
});

app.get('/detalles', (req, res) => {
    const qDetalles = `
        SELECT dp.*, p.nombre as producto, ped.fecha_pedido 
        FROM detallepedido dp 
        JOIN producto p ON dp.id_producto = p.id_producto 
        JOIN pedido ped ON dp.id_pedido = ped.id_pedido 
        ORDER BY dp.id_pedido DESC`;

    db.query(qDetalles, (err, detalles) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>📋 Detalle de Ventas por Producto</h2>
            <table>
                <thead>
                    <tr><th>Pedido ID</th><th>Producto</th><th>Cantidad</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                    ${detalles.map(d => `
                        <tr>
                            <td>#${d.id_pedido}</td>
                            <td>${d.producto}</td>
                            <td>${d.cantidad}</td>
                            <td><strong>$${d.subtotal}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div></div>`);
    });
});

app.get('/historial', (req, res) => {
    const qHistorial = `
        SELECT p.*, c.nombre as cliente 
        FROM pedido p 
        JOIN cliente c ON p.id_cliente = c.id_cliente 
        WHERE p.estado IN ('entregado', 'cancelado')
        ORDER BY p.fecha_pedido DESC`;

    db.query(qHistorial, (err, pedidos) => {
        res.send(`${CSS} ${NAVBAR} <div class="main"><div class="card">
            <h2>📜 Historial de Pedidos Finalizados</h2>
            <table>
                <tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado Final</th></tr>
                ${pedidos.map(p => `<tr>
                    <td>#${p.id_pedido}</td>
                    <td>${new Date(p.fecha_pedido).toLocaleString()}</td>
                    <td>${p.cliente}</td>
                    <td>$${p.total}</td>
                    <td><span class="badge" style="background:${p.estado === 'entregado' ? '#e6f4ea' : '#fce8e6'}; color:${p.estado === 'entregado' ? '#1e8e3e' : '#d93025'};">${p.estado.toUpperCase()}</span></td>
                </tr>`).join('')}
            </table>
        </div></div>`);
    });
});

// --- LÓGICA DE INSERCIÓN ---
app.post('/pedidos/crear', (req, res) => {
    const { id_cliente, id_domiciliario, total, observaciones, id_producto, cantidad } = req.body;
    const domi = id_domiciliario === "" ? null : id_domiciliario;
    
    // 1. Crear el Pedido
    db.query('INSERT INTO pedido (id_cliente, id_domiciliario, total, observaciones, estado) VALUES (?, ?, ?, ?, "recibido")', 
    [id_cliente, domi, total, observaciones], (err, result) => {
        const nuevoIdPedido = result.insertId;

        // 2. Obtener precio para el subtotal
        db.query('SELECT precio FROM producto WHERE id_producto = ?', [id_producto], (err, prod) => {
            const subtotal = prod[0].precio * cantidad;

            // 3. Crear el Detalle del Pedido
            db.query('INSERT INTO detallepedido (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)', 
            [nuevoIdPedido, id_producto, cantidad, subtotal], () => {

                // 4. DESCONTAR INVENTARIO (Lógica de Receta)
                db.query('SELECT id_insumo, cantidad_usada FROM productoinsumo WHERE id_producto = ?', [id_producto], (err, receta) => {
                    receta.forEach(ins => {
                        const gasto = ins.cantidad_usada * cantidad;
                        db.query('UPDATE insumo SET cantidad_disponible = cantidad_disponible - ? WHERE id_insumo = ?', [gasto, ins.id_insumo]);
                    });
                    res.redirect('/');
                });
            });
        });
    });
});

app.get('/', (req, res) => {
    db.query('SELECT id_cliente, nombre FROM cliente', (err, clientes) => {
        // SI HAY ERROR O NO HAY CLIENTES, EVITAMOS QUE TRUENE
        if (err) return res.status(500).send("Error en BD: " + err.message);
        if (!clientes) clientes = []; // Si está vacío, que sea una lista vacía
        
        db.query('SELECT id_domiciliario, nombre FROM domiciliario WHERE disponible = 1', (err, domis) => {
            if (!domis) domis = [];
            
            // ... resto de tus consultas (productos, pedidos)
        });
    });
});


app.post('/pedidos/actualizar', (req, res) => {
    db.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', [req.body.nuevo_estado, req.body.id], () => res.redirect('/'));
});

app.post('/clientes/crear', (req, res) => {
    const { nombre, telefono, direccion, correo } = req.body;
    db.query('INSERT INTO cliente (nombre, telefono, direccion, correo) VALUES (?, ?, ?, ?)', [nombre, telefono, direccion, correo], () => res.redirect('/clientes'));
});

app.post('/domiciliarios/crear', (req, res) => {
    const { nombre, telefono, medio_transporte } = req.body;
    db.query('INSERT INTO domiciliario (nombre, telefono, medio_transporte) VALUES (?, ?, ?)', [nombre, telefono, medio_transporte], () => res.redirect('/domiciliarios'));
});

app.post('/productos/crear', (req, res) => {
    const { nombre, precio, descripcion } = req.body;
    db.query('INSERT INTO producto (nombre, precio, descripcion) VALUES (?, ?, ?)', [nombre, precio, descripcion], () => res.redirect('/productos'));
});

// CREAR NUEVO INSUMO
app.post('/insumos/crear', (req, res) => {
    const { nombre, unidad, minima } = req.body;
    db.query('INSERT INTO insumo (nombre, unidad_medida, cantidad_minima) VALUES (?, ?, ?)', [nombre, unidad, minima || 0], () => res.redirect('/insumos'));
});

// REGISTRAR MOVIMIENTO Y ACTUALIZAR STOCK
app.post('/insumos/movimiento', (req, res) => {
    const { id_insumo, tipo, cantidad, descripcion } = req.body;
    
    // 1. Registrar el movimiento
    db.query('INSERT INTO movimientoinventario (id_insumo, tipo, cantidad, descripcion) VALUES (?, ?, ?, ?)', [id_insumo, tipo, cantidad, descripcion], (err) => {
        if (err) return res.send(err.message);
        
        // 2. Actualizar la cantidad en la tabla insumo
        const operador = tipo === 'entrada' ? '+' : '-';
        const sqlUpdate = `UPDATE insumo SET cantidad_disponible = cantidad_disponible ${operador} ? WHERE id_insumo = ?`;
        
        db.query(sqlUpdate, [cantidad, id_insumo], () => res.redirect('/insumos'));
    });
});

app.post('/pedidos/agregar-producto', (req, res) => {
    const { id_pedido, id_producto, cantidad } = req.body;

    // 1. Obtener el precio del producto para calcular el subtotal
    db.query('SELECT precio FROM producto WHERE id_producto = ?', [id_producto], (err, prod) => {
        const subtotal = prod[0].precio * cantidad;

        // 2. Insertar en detallepedido
        db.query('INSERT INTO detallepedido (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)', 
        [id_pedido, id_producto, cantidad, subtotal], (err) => {
            
            // 3. LOGICA SAN/INVENTARIO: Buscar insumos de este producto y descontar
            const sqlReceta = "SELECT id_insumo, cantidad_usada FROM productoinsumo WHERE id_producto = ?";
            db.query(sqlReceta, [id_producto], (err, insumos) => {
                insumos.forEach(insumo => {
                    const gastoTotal = insumo.cantidad_usada * cantidad;
                    db.query('UPDATE insumo SET cantidad_disponible = cantidad_disponible - ? WHERE id_insumo = ?', 
                    [gastoTotal, insumo.id_insumo]);
                });
                res.redirect('/'); // Volver al dashboard
            });
        });
    });
})

app.post('/recetas/crear', (req, res) => {
    const { id_producto, id_insumo, cantidad_usada } = req.body;
    db.query('INSERT INTO productoinsumo (id_producto, id_insumo, cantidad_usada) VALUES (?, ?, ?)', 
    [id_producto, id_insumo, cantidad_usada], () => res.redirect('/recetas'));
});

app.post('/pedidos/agregar-item', (req, res) => {
    const { id_pedido, id_producto, cantidad } = req.body;

    // 1. Buscamos el precio para el dinero y los insumos para el stock
    db.query('SELECT precio FROM producto WHERE id_producto = ?', [id_producto], (err, results) => {
        const subtotal = results[0].precio * cantidad;

        // 2. Insertamos el producto en el detalle del pedido
        db.query('INSERT INTO detallepedido (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)', 
        [id_pedido, id_producto, cantidad, subtotal], (err) => {
            
            // 3. LA MAGIA: Buscamos qué insumos usa este producto específico
            db.query('SELECT id_insumo, cantidad_usada FROM productoinsumo WHERE id_producto = ?', [id_producto], (err, receta) => {
                
                // 4. Por cada ingrediente en la receta, restamos del inventario
                receta.forEach(ingrediente => {
                    const totalGasto = ingrediente.cantidad_usada * cantidad;
                    const sqlUpdate = 'UPDATE insumo SET cantidad_disponible = cantidad_disponible - ? WHERE id_insumo = ?';
                    
                    db.query(sqlUpdate, [totalGasto, ingrediente.id_insumo], (err) => {
                        if (err) console.log("Error al descontar: ", err.message);
                    });
                });

                console.log(`✅ Venta procesada: Se descontaron insumos para ${cantidad} unidad(es) del producto ID: ${id_producto}`);
                res.redirect('/'); // Volvemos al panel principal
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));