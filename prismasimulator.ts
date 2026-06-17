import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Decimal } from '@prisma/client/runtime/library'; // Importamos Decimal si es necesario, pero guardaremos strings

const prisma = new PrismaClient();

// ------------------------------------------------------------------
// TIPOS DE ACEITE Y ADITIVOS DE LA DISTRIBUIDORA FANTASMA
// ------------------------------------------------------------------
const tiposProducto = [
  'Aceite Mineral 20W-50',
  'Aceite Sintético 5W-30',
  'Aceite Semi-Sintético 10W-40',
  'Aceite Industrial Hidráulico ISO 68',
  'Aceite Transmisión SAE 80W-90',
  'Tambo 200L Aceite Motor Diésel',
  'Aditivo Limpiador de Inyectores',
  'Anticongelante Orgánico Concentrado',
  'Grasa Multiusos de Litio (Tambo 50kg)',
  'Lubricante para Cadenas de Alta Temperatura'
];

// ------------------------------------------------------------------
// CONFIGURACIÓN DE LA SIMULACIÓN
// ------------------------------------------------------------------
const NUM_ALMACENES = 3;
const NUM_PRODUCTOS = 20;
const NUM_EMPLEADOS = 5;
const NUM_TRASPASOS = 50;
const NUM_MOVIMIENTOS = 30;

// ------------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE INYECCIÓN DE DATOS
// ------------------------------------------------------------------
async function main() {
  console.log('🛢️ Iniciando simulación de la Distribuidora Hexa...');
  console.log('Limpiando datos previos (cuidado en prod)...');
  
  // Orden de borrado respetando constraints (FKs)
  await prisma.movimientoBancario.deleteMany();
  await prisma.traspaso.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.almacen.deleteMany();

  console.log('Base de datos limpia. Inyectando fantasmas...');

  // -------------------------------------------
  // 1. CREACIÓN DE ALMACENES (Solo strings en dinero)
  // -------------------------------------------
  const almacenesData = Array.from({ length: NUM_ALMACENES }, (_, i) => ({
    nombre: faker.company.name() + ' Warehouse',
    direccion: faker.location.streetAddress(),
    presupuestoMensual: faker.finance.amount({min: 5000, max: 20000, dec: 2}), // String
    capacidadMaxima: faker.number.int({ min: 500, max: 2000 }),
  }));

  const almacenes = await Promise.all(
    almacenesData.map(data => prisma.almacen.create({ data }))
  );
  console.log(`✅ ${almacenes.length} Almacenes creados.`);

  // -------------------------------------------
  // 2. CREACIÓN DE 20 PRODUCTOS (Aceites, tambos, aditivos)
  // -------------------------------------------
  const productosData = Array.from({ length: NUM_PRODUCTOS }, () => {
    const tipoAleatorio = faker.helpers.arrayElement(tiposProducto);
    return {
      nombre: tipoAleatorio + ' - ' + faker.string.alphanumeric(6),
      descripcion: faker.commerce.productDescription(),
      // REGLA CRÍTICA: Precios y costos se guardan ESTICTAMENTE como STRING
      precioCosto: faker.finance.amount({ min: 10, max: 150, dec: 2 }),
      precioVenta: faker.finance.amount({ min: 20, max: 300, dec: 2 }),
      stockInicial: faker.number.int({ min: 50, max: 500 }),
      unidadMedida: faker.helpers.arrayElement(['Litro', 'Kilogramo', 'Pieza', 'Tambo']),
    };
  });

  const productos = await Promise.all(
    productosData.map(data => prisma.producto.create({ data }))
  );
  console.log(`✅ ${productos.length} Productos creados.`);

  // -------------------------------------------
  // 3. CREACIÓN DE EMPLEADOS (Salarios y comisiones en STRING)
  // -------------------------------------------
  const puestos = ['Almacenista', 'Vendedor Rutero', 'Coordinador Logístico', 'Facturador', 'Supervisor'];
  const empleadosData = Array.from({ length: NUM_EMPLEADOS }, () => ({
    nombre: faker.person.fullName(),
    puesto: faker.helpers.arrayElement(puestos),
    // REGLA CRÍTICA: Salarios y comisiones como STRING
    salarioBase: faker.finance.amount({ min: 8000, max: 25000, dec: 2 }),
    comisionPorcentaje: faker.finance.amount({ min: 0.5, max: 5, dec: 2 }),
  }));

  const empleados = await Promise.all(
    empleadosData.map(data => prisma.empleado.create({ data }))
  );
  console.log(`✅ ${empleados.length} Empleados creados.`);

  // -------------------------------------------
  // 4. CREACIÓN DE TRASPASOS (Simulando alta operación)
  //    Algunos "RECIBIDO", otros "EN_TRANSITO"
  // -------------------------------------------
  const estadosTraspaso = ['RECIBIDO', 'EN_TRANSITO', 'CANCELADO'];
  
  // Array para guardar referencias y luego testear edge-cases
  const traspasosGenerados = []; 

  for (let i = 0; i < NUM_TRASPASOS; i++) {
    const origen = faker.helpers.arrayElement(almacenes);
    const destino = faker.helpers.arrayElement(almacenes.filter(a => a.id !== origen.id));
    const producto = faker.helpers.arrayElement(productos);
    
    traspasosGenerados.push(
      prisma.traspaso.create({
        data: {
          almacenOrigenId: origen.id,
          almacenDestinoId: destino.id,
          productoId: producto.id,
          // Para probar edge-cases después, algunos traspasos exceden el stock a propósito
          cantidad: faker.number.int({ min: 1, max: 300 }),
          estado: faker.helpers.arrayElement(estadosTraspaso),
          fechaSolicitud: faker.date.recent({ days: 30 }),
          fechaRecepcion: faker.helpers.maybe(() => faker.date.recent({ days: 15 })) ?? null,
          costoEnvio: faker.finance.amount({ min: 50, max: 500, dec: 2 }), // String
        },
      })
    );
  }
  await Promise.all(traspasosGenerados);
  console.log(`✅ ${NUM_TRASPASOS} Traspasos creados (algunos en tránsito y con posibles problemas de stock).`);

  // -------------------------------------------
  // 5. CREACIÓN DE MOVIMIENTOS BANCARIOS (Flujo de caja)
  // -------------------------------------------
  const tiposMovimiento = ['INGRESO', 'EGRESO', 'COMISION'];
  
  const movimientosData = Array.from({ length: NUM_MOVIMIENTOS }, () => ({
    cuentaBancaria: faker.finance.accountNumber(),
    monto: faker.finance.amount({ min: 200, max: 50000, dec: 2 }), // String
    tipo: faker.helpers.arrayElement(tiposMovimiento),
    concepto: faker.finance.transactionDescription(),
    fecha: faker.date.recent({ days: 60 }),
    referenciaExterna: faker.string.uuid(),
  }));

  await Promise.all(
    movimientosData.map(data => prisma.movimientoBancario.create({ data }))
  );
  console.log(`✅ ${NUM_MOVIMIENTOS} Movimientos Bancarios creados.`);

  console.log('🚀 Simulación completada. Sistema fantasma listo para las pruebas de estrés, CTO.');
  console.log('⚠️ Nota: Traspasos con posible exceso de cantidad inyectados para probar validación de stock.');
  console.log('Hexa-QA esperando los archivos fuente para la cacería de bugs.');
}

main()
  .catch((e) => {
    console.error('🔥 ERROR CRÍTICO EN LA SIMULACIÓN: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });