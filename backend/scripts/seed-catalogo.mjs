// scripts/seed-catalogo.mjs
// Carga el catálogo inicial de ChocoBerry (las mismas categorías, precios y
// productos que tenía la tienda en los mocks del frontend) usando los modelos
// del backend.
//
// Es IDEMPOTENTE: si una categoría, presentación o producto ya existe (por
// nombre o por cantidad de fresas) no se duplica ni se sobrescribe, así que
// se puede ejecutar varias veces sin problema.
//
// Uso:  npm run seed:catalogo
import { pool } from '../src/config/db.js';
import * as categoriaModel from '../src/models/categoria.model.js';
import * as presentacionModel from '../src/models/presentacion.model.js';
import * as productoModel from '../src/models/producto.model.js';

const CATEGORIAS = ['Fechas especiales', 'Cumpleaños', 'Aniversarios', 'Regalos'];

const PRESENTACIONES = [
  { cantidadFresas: 6, precio: 35000 },
  { cantidadFresas: 8, precio: 45000 },
  { cantidadFresas: 12, precio: 55000 },
  { cantidadFresas: 16, precio: 75000 },
  { cantidadFresas: 30, precio: 130000 },
];

// Las imágenes viven en el front (frontend/public/img/Productos) y se guardan
// como ruta relativa al front; el backend solo persiste el texto.
const PRODUCTOS = [
  {
    nombre: 'Caja Romance',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/Regalo_1.webp',
    descripcion:
      'Un detalle dulce y especial para el Día de la Madre, perfecto para sorprender con amor.',
  },
  {
    nombre: 'Ramo Dulce Mamá',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/Romance_7.webp',
    descripcion:
      'Para el Día de la Madre: una dulce forma de celebrar a mamá y hacerla sentir especial.',
  },
  {
    nombre: 'Set Fuerza Papá',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/Diaespe_2.jpg',
    descripcion:
      'Ideal para el Día del Padre: un regalo con personalidad para celebrar a ese papá increíble.',
  },
  {
    nombre: 'Caja Clásica Papá',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/Diaespe_3.webp',
    descripcion:
      'Pensada para el Día del Padre, un detalle delicioso y especial para celebrar a papá.',
  },
  {
    nombre: 'Detalle Poder',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/img5.png',
    descripcion:
      'Para el Día de la Mujer: un detalle especial para celebrar su esencia, fuerza y elegancia.',
  },
  {
    nombre: 'Fresas Elegancia',
    categoria: 'Fechas especiales',
    imagen: '/img/Productos/img9.png',
    descripcion:
      'Ideal para el Día de la Mujer, un detalle sofisticado y delicioso para sorprender a una mujer especial.',
  },
  {
    nombre: 'Torre Cumpleaños',
    categoria: 'Cumpleaños',
    imagen: '/img/Productos/5.jpg',
    descripcion:
      'Una sorpresa deliciosa para hacer de su cumpleaños un momento inolvidable.',
  },
  {
    nombre: 'Caja Fiesta',
    categoria: 'Cumpleaños',
    imagen: '/img/Productos/FCA_4.webp',
    descripcion: 'Color, dulzura y alegría en un detalle perfecto para celebrar.',
  },
  {
    nombre: 'Mini Antojo',
    categoria: 'Regalos',
    imagen: '/img/Productos/Diaespe_1.jpg',
    descripcion: 'El detalle perfecto para consentirte o disfrutar un dulce momento.',
  },
  {
    nombre: 'Combo Antojo Doble',
    categoria: 'Regalos',
    imagen: '/img/Productos/img8.png',
    descripcion:
      'Una combinación irresistible para disfrutar y compartir un momento delicioso.',
  },
  {
    nombre: 'Caja Aniversario',
    categoria: 'Aniversarios',
    imagen: '/img/Productos/img7.png',
    descripcion:
      'Un detalle romántico para celebrar juntos una historia llena de momentos especiales.',
  },
  {
    nombre: 'Detalle Sorpresa',
    categoria: 'Regalos',
    imagen: '/img/Productos/Regalo_2.webp',
    descripcion:
      'Personaliza un detalle único para sorprender a esa persona especial.',
  },
];

async function main() {
  const resumen = {
    categoriasCreadas: 0,
    presentacionesCreadas: 0,
    productosCreados: 0,
    productosExistentes: 0,
  };

  // 1) Categorías (se resuelven por nombre, sin distinguir mayúsculas).
  const idCategoria = new Map();
  for (const nombre of CATEGORIAS) {
    let categoria = await categoriaModel.buscarPorNombre(nombre);
    if (!categoria) {
      const id = await categoriaModel.crear({ nombre, estado: true });
      categoria = await categoriaModel.buscarPorId(id);
      resumen.categoriasCreadas += 1;
    }
    idCategoria.set(nombre, categoria.id);
  }

  // 2) Presentaciones (cantidad de fresas -> precio).
  for (const { cantidadFresas, precio } of PRESENTACIONES) {
    const existente = await presentacionModel.buscarPorCantidad(cantidadFresas);
    if (!existente) {
      await presentacionModel.crear({
        cantidad_fresas: cantidadFresas,
        precio,
        estado: true,
      });
      resumen.presentacionesCreadas += 1;
    }
  }

  // 3) Productos.
  for (const producto of PRODUCTOS) {
    if (await productoModel.existeNombre(producto.nombre)) {
      resumen.productosExistentes += 1;
      continue;
    }

    await productoModel.crear({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen: producto.imagen,
      estado: true,
      id_categoria: idCategoria.get(producto.categoria),
    });
    resumen.productosCreados += 1;
  }

  return resumen;
}

try {
  const resumen = await main();
  console.log('Catálogo inicial listo:', resumen);
} catch (error) {
  console.error('No se pudo cargar el catálogo inicial:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
