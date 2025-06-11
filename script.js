// Variables globales
let pedidoActual = {
    mesa: '',
    items: [],
    notas: ''
};

let contadorPedidos = 0;
const audioNotificacion = new Audio('assets/notification.mp3');
audioNotificacion.volume = 0.3;

// Constantes
const MAX_ITEMS = 10;
const MONTO_CONFIRMACION = 50000;

// Función para generar ID secuencial
function generarIdPedido() {
    let contador = parseInt(localStorage.getItem('contadorPedidos')) || 0;
    contador++;
    localStorage.setItem('contadorPedidos', contador);
    return contador;
}

// Función para reproducir sonido de notificación
function playNotificationSound() {
    audioNotificacion.play().catch(e => {
        console.error("Error al reproducir sonido:", e);
        // Fallback: intentar reproducir sin volumen
        audioNotificacion.volume = 0;
        audioNotificacion.play().catch(e => console.error("Error en fallback:", e));
    });
}

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
    // Remover mensaje anterior si existe
    const errorAnterior = document.querySelector('.error-mensaje');
    if (errorAnterior) {
        errorAnterior.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-mensaje';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);

    // Remover el mensaje después de la animación
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Función para mostrar notificación de envío
function mostrarNotificacionEnvio(mensaje, tipo = 'exito') {
    const notificacion = document.getElementById('notificacion-envio');
    if (!notificacion) return;

    notificacion.textContent = mensaje;
    notificacion.style.display = 'block';
    notificacion.style.background = tipo === 'exito' ? 'var(--primary-accent)' : 'var(--dark-bg)';

    setTimeout(() => {
        notificacion.style.display = 'none';
    }, 3000);
}

// Función para validar mesa seleccionada
function validarMesa() {
    const mesaSeleccionada = document.getElementById('numero-mesa')?.value;
    if (!mesaSeleccionada || mesaSeleccionada === '-') {
        mostrarError("Por favor, seleccione una mesa primero");
        return false;
    }
    return true;
}

// Función para verificar nuevos pedidos
function verificarNuevosPedidos(pedidosAnteriores) {
    const pedidosActuales = JSON.parse(localStorage.getItem('pedidos')) || [];
    const nuevosPendientes = pedidosActuales.filter(p => !p.completado).length;
    
    if (nuevosPendientes > pedidosAnteriores) {
        // Solo reproducir si estamos en cocina.html
        if (window.location.pathname.includes('cocina.html')) {
            playNotificationSound();
            
            // Vibración en dispositivos móviles
            if ('vibrate' in navigator) {
                try {
                    navigator.vibrate(200);
                } catch (e) {
                    console.error("Error al vibrar:", e);
                }
            }
        }
    }
    
    return nuevosPendientes;
}

// Función para validar estructura de pedido
function validarPedido(pedido) {
    return pedido && 
           typeof pedido === 'object' &&
           Array.isArray(pedido.items) &&
           pedido.items.every(item => 
               item && 
               typeof item.nombre === 'string' &&
               typeof item.precio === 'number'
           ) &&
           (pedido.mesa || pedido.mesa === 0);
}

// Función para sanitizar pedidos
function sanitizarPedido(pedido) {
    if (!validarPedido(pedido)) {
        console.error('Pedido inválido:', pedido);
        return null;
    }

    return {
        id: pedido.id || Date.now(),
        pedidoId: `#${pedido.pedidoId || generarIdPedido()}`,
        mesa: pedido.mesa || 'N/A',
        items: (pedido.items || []).map(item => ({
            nombre: item.nombre || 'Producto sin nombre',
            precio: Number(item.precio) || 0,
            notas: item.notas || '',
            cantidad: item.cantidad || 1
        })),
        timestamp: pedido.timestamp || new Date().toISOString(),
        completado: Boolean(pedido.completado)
    };
}

// Función para cargar pedido guardado
function cargarPedidoGuardado() {
    const pedidoGuardado = localStorage.getItem('pedidoActual');
    if (pedidoGuardado) {
        pedidoActual = JSON.parse(pedidoGuardado);
        actualizarInterfaz();
    }
}

// Función para guardar pedido actual
function guardarPedidoActual() {
    localStorage.setItem('pedidoActual', JSON.stringify(pedidoActual));
}

// Función para validar pedido
function validarPedido() {
    const mesaValida = document.getElementById('numero-mesa')?.value;
    const tieneItems = pedidoActual.items.length > 0;
    
    // Actualizar estado del botón
    const btnEnviar = document.getElementById('btn-enviar-cocina');
    if (btnEnviar) {
        btnEnviar.disabled = !mesaValida || !tieneItems;
    }

    return mesaValida && tieneItems;
}

// Función para agregar item al pedido
function agregarItem(nombre, precio, notas = '') {
    if (!validarMesa()) {
        return;
    }

    if (pedidoActual.items.length >= MAX_ITEMS) {
        mostrarError(`Máximo ${MAX_ITEMS} items por pedido`);
        return;
    }

    // Añadir item al pedido
    pedidoActual.items.push({
        nombre,
        precio: Number(precio),
        notas: notas || document.getElementById('notas-pedido')?.value || '',
        cantidad: 1
    });

    // Limpiar notas
    const notasInput = document.getElementById('notas-pedido');
    if (notasInput) {
        notasInput.value = '';
    }

    // Actualizar interfaz
    guardarPedidoActual();
    actualizarInterfaz();
    validarPedido();
}

// Función para agregar combo 2 personas
function agregarCombo2() {
    if (!validarMesa()) return;
    
    agregarItem('Combo 2P - 1/2 Pollo Asado', 1037860);
    agregarItem('Combo 2P - 2 Papas Individuales', 259465);
    agregarItem('Combo 2P - 2 Bebidas', 259465);
}

// Función para agregar combo 4 personas
function agregarCombo4() {
    if (!validarMesa()) return;
    
    agregarItem('Combo 4P - Pollo Entero', 2075720);
    agregarItem('Combo 4P - 4 Papas Individuales', 518930);
    agregarItem('Combo 4P - 4 Bebidas', 518930);
}

// Función para actualizar cantidad de item
function actualizarCantidad(index, delta) {
    const item = pedidoActual.items[index];
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        eliminarItem(index);
        return;
    }
    
    if (nuevaCantidad > 10) {
        mostrarError('Máximo 10 unidades por item');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarPedidoActual();
    actualizarInterfaz();
}

// Función para formatear precios CLP
function formatoCLP(precio) {
    return '$' + Math.round(precio).toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Función para actualizar la interfaz
function actualizarInterfaz() {
    // Actualizar selector de mesa
    const selectMesa = document.getElementById('numero-mesa');
    if (selectMesa) {
        selectMesa.value = pedidoActual.mesa;
    }

    // Actualizar número de mesa mostrado
    const mesaActual = document.getElementById('mesa-actual');
    if (mesaActual) {
        mesaActual.textContent = pedidoActual.mesa || '-';
    }

    // Actualizar lista de pedidos
    const listaPedido = document.getElementById('lista-pedido');
    if (listaPedido) {
        listaPedido.innerHTML = pedidoActual.items.map((item, index) => `
            <div class="item-pedido">
                <div class="item-info">
                    <div class="item-nombre">${item.nombre}</div>
                    ${item.notas ? `<div class="item-notas">${item.notas}</div>` : ''}
                </div>
                <div class="item-precio">
                    <div class="cantidad-control">
                        <button class="btn-cantidad" onclick="actualizarCantidad(${index}, -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn-cantidad" onclick="actualizarCantidad(${index}, 1)">+</button>
                    </div>
                    <span>${formatoCLP(item.precio * item.cantidad)}</span>
                    <span class="eliminar" onclick="eliminarItem(${index})">×</span>
                </div>
            </div>
        `).join('');
    }

    // Actualizar subtotal
    actualizarSubtotal();
    validarPedido();
}

// Función para eliminar item
function eliminarItem(index) {
    if (confirm('¿Eliminar este item del pedido?')) {
        pedidoActual.items.splice(index, 1);
        guardarPedidoActual();
        actualizarInterfaz();
    }
}

// Función para actualizar subtotal
function actualizarSubtotal() {
    const subtotal = pedidoActual.items.reduce((sum, item) => 
        sum + (Number(item.precio) * item.cantidad || 0), 0);
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = formatoCLP(subtotal);
    }
}

// Función para cambiar mesa
function cambiarMesa() {
    const selectMesa = document.getElementById('numero-mesa');
    if (selectMesa) {
        if (pedidoActual.items.length > 0) {
            if (!confirm('Hay items en el pedido actual. ¿Desea cambiar de mesa?')) {
                return;
            }
        }
        pedidoActual.mesa = selectMesa.value;
        pedidoActual.items = [];
        guardarPedidoActual();
        actualizarInterfaz();
    }
}

// Función para enviar pedido a cocina
function enviarACocina() {
    if (!validarPedido()) {
        return;
    }

    const subtotal = pedidoActual.items.reduce((sum, item) => 
        sum + (Number(item.precio) * item.cantidad || 0), 0);

    if (subtotal > MONTO_CONFIRMACION) {
        if (!confirm(`El total del pedido es $${subtotal.toLocaleString('es-CL')}. ¿Desea continuar?`)) {
            return;
        }
    }

    // Crear pedido para cocina
    const pedidoCocina = {
        id: Date.now(),
        pedidoId: generarIdPedido(),
        mesa: pedidoActual.mesa,
        items: pedidoActual.items,
        timestamp: new Date().toISOString(),
        completado: false
    };

    // Validar y sanitizar pedido
    const pedidoSanitizado = sanitizarPedido(pedidoCocina);
    if (!pedidoSanitizado) {
        mostrarNotificacionEnvio('Error al procesar el pedido', 'error');
        return;
    }

    try {
        // Guardar en localStorage
        const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
        pedidos.push(pedidoSanitizado);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('pedidoActualizado', {
            detail: { pedido: pedidoSanitizado }
        }));

        // Limpiar pedido actual
        pedidoActual.items = [];
        pedidoActual.notas = '';
        guardarPedidoActual();
        actualizarInterfaz();

        // Resetear selección de mesa
        const selectMesa = document.getElementById('numero-mesa');
        if (selectMesa) {
            selectMesa.value = '';
        }

        mostrarNotificacionEnvio('¡Pedido enviado a cocina!', 'exito');
    } catch (error) {
        console.error('Error al guardar pedido:', error);
        mostrarNotificacionEnvio('Error al enviar el pedido', 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Polyfill para CustomEvent en Safari
    if (!window.CustomEvent) {
        window.CustomEvent = function(event, params) {
            const evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
    }

    // Cargar pedido guardado
    cargarPedidoGuardado();

    // Configurar botón de cambiar mesa
    const btnCambiarMesa = document.getElementById('btn-cambiar-mesa');
    if (btnCambiarMesa) {
        btnCambiarMesa.onclick = cambiarMesa;
    }

    // Configurar validación de mesa
    const selectMesa = document.getElementById('numero-mesa');
    if (selectMesa) {
        selectMesa.addEventListener('change', () => {
            pedidoActual.mesa = selectMesa.value;
            guardarPedidoActual();
            actualizarInterfaz();
        });
    }

    // Configurar botón de enviar
    const btnEnviar = document.getElementById('btn-enviar-cocina');
    if (btnEnviar) {
        btnEnviar.disabled = true;
    }

    // Validar estado inicial
    validarPedido();

    // Escuchar cambios en localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'pedidos') {
            contadorPedidos = verificarNuevosPedidos(contadorPedidos);
            actualizarInterfaz();
        }
    });
});