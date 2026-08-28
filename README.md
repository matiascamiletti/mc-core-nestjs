# @mckit/core-nestjs

Biblioteca de utilidades y servicios core para aplicaciones NestJS / Node.js. Proporciona herramientas robustas y fuertemente tipadas para la manipulación segura de objetos dinámicos, interpolación de textos, acceso anidado por notación de puntos/arreglos y conversión de tipos.

---

## 📦 Instalación

```bash
npm install @mckit/core-nestjs
```

o con yarn / pnpm:

```bash
yarn add @mckit/core-nestjs
# o
pnpm add @mckit/core-nestjs
```

---

## 🚀 Características principales

- **Acceso seguro a propiedades anidadas**: Soporta notación de puntos (`user.address.city`) y corchetes de arreglos (`users[0].name`, `items[1].tags[0]`).
- **Interpolación dinámica de textos**: Soporta plantillas con placeholders estilo mustache (`"Hola {{user.name}}, tienes {{orders.length}} pedidos"`).
- **Tipado estricto con TypeScript**: Inferencia automática del tipo de retorno según el enum `DynamicObjectType`.
- **Conversión segura de tipos**: Transforma valores a `STRING`, `NUMBER`, `BOOLEAN`, `ARRAY`, `OBJECT` o `DATE` sin lanzar excepciones en tiempo de ejecución.
- **Asignación anidada inteligente**: `set()` crea automáticamente objetos o arreglos intermedios según el tipo de clave (numérica o texto).
- **Valores por defecto**: Soporte de `defaultValue` cuando una propiedad no existe o es `undefined`.

---

## 💡 Ejemplos de uso

### 1. Extracción de valores con tipado inferido (`get`)

```typescript
import { DynamicObjectService, DynamicObjectType } from '@mckit/core-nestjs';

const payload = {
    user: {
        firstName: 'Matias',
        age: '30',
        active: 'true',
        roles: ['admin', 'developer']
    },
    orders: [
        { id: 101, total: 150.50 },
        { id: 102, total: 89.99 }
    ]
};

// Extracción como Number (infiere tipo number en TypeScript)
const age = DynamicObjectService.get('user.age', payload, DynamicObjectType.NUMBER);
// age = 30 (number)

// Acceso por índice de arreglo
const firstOrderId = DynamicObjectService.get('orders[0].id', payload, DynamicObjectType.NUMBER);
// firstOrderId = 101 (number)

// Extracción como Boolean
const isActive = DynamicObjectService.get('user.active', payload, DynamicObjectType.BOOLEAN);
// isActive = true (boolean)

// Extracción como Array
const roles = DynamicObjectService.get('user.roles', payload, DynamicObjectType.ARRAY);
// roles = ['admin', 'developer'] (any[])

// Con valor por defecto (fallback)
const country = DynamicObjectService.get('user.address.country', payload, DynamicObjectType.STRING, {
    defaultValue: 'Argentina'
});
// country = "Argentina"
```

---

### 2. Texto con plantillas e interpolación

`DynamicObjectService.get` detecta automáticamente si el string contiene texto circundante y múltiples placeholders:

```typescript
const message = DynamicObjectService.get(
    'Hola {{user.firstName}}, tu primer pedido es #{{orders[0].id}} por un total de ${{orders[0].total}}',
    payload,
    DynamicObjectType.STRING
);

// Resultado:
// "Hola Matias, tu primer pedido es #101 por un total de $150.5"
```

También puedes usar directamente el método `interpolate`:

```typescript
const text = DynamicObjectService.interpolate(
    'Esto es un texto y el nombre es {{orders[0].id}}',
    payload
);
// "Esto es un texto y el nombre es 101"
```

---

### 3. Asignación segura de propiedades (`set`)

Crea automáticamente los objetos o arreglos intermedios que hagan falta en la estructura:

```typescript
const target: Record<string, any> = {};

// Crea target.users como Array y el objeto en la posición 0
DynamicObjectService.set('users[0].profile.name', 'Lucas', target);
DynamicObjectService.set('users[0].profile.age', 25, target);

/*
target = {
    users: [
        {
            profile: {
                name: 'Lucas',
                age: 25
            }
        }
    ]
}
*/
```

---

### 4. Conversión directa de tipos (`toAsType`)

```typescript
DynamicObjectService.toAsType('123', DynamicObjectType.NUMBER); // 123
DynamicObjectService.toAsType('true', DynamicObjectType.BOOLEAN); // true
DynamicObjectService.toAsType('["a", "b"]', DynamicObjectType.ARRAY); // ['a', 'b']
DynamicObjectService.toAsType('{"key": "value"}', DynamicObjectType.OBJECT); // { key: 'value' }
DynamicObjectService.toAsType('2026-01-15T10:00:00Z', DynamicObjectType.DATE); // Date object
```

---

## 📖 API Reference

### `DynamicObjectType` (Enum)

| Valor | Tipo TypeScript devuelto | Descripción |
| :--- | :--- | :--- |
| `STRING` | `string` | Convierte el valor a cadena de texto. |
| `NUMBER` | `number` | Convierte el valor a numérico (devuelve `0` si es inválido). |
| `BOOLEAN` | `boolean` | Soporta booleanos nativos, `'true'`, `'1'`, `'yes'`. |
| `ARRAY` | `any[]` | Parsea JSON o envuelve el elemento en un arreglo. |
| `OBJECT` | `Record<string, any>` | Parsea JSON o valida que sea un objeto plano. |
| `DATE` | `Date \| null` | Parsea fecha válida o devuelve `null`. |
| `RAW` | `any` | Devuelve el valor original sin transformar. |

### `DynamicObjectService` (Métodos)

- **`get(path, source, responseAs?, options?)`**: Obtiene el valor o interpola la plantilla con soporte de fallback.
- **`interpolate(template, context)`**: Reemplaza todas las etiquetas `{{ path }}` por su valor resuelto en `context`.
- **`set(path, value, target)`**: Asigna un valor en una ruta anidada creando objetos o arreglos según corresponda.
- **`toAsType(value, type)`**: Convierte cualquier valor al tipo especificado de forma segura.

---

## 🧪 Pruebas

Para ejecutar la suite de pruebas unitarias:

```bash
npm test
```

Para compilar la biblioteca:

```bash
npm run build
```

---

## 📄 Licencia

[ISC](LICENSE) © [Matias Camiletti](https://github.com/matiascamiletti)