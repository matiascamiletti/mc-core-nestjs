import { DynamicObjectService } from './dynamic-object.service';
import { DynamicObjectType } from './dynamic-object.types';

describe('DynamicObjectService', () => {
    const mockData = {
        a: [
            { name: 'Matias', age: 30, active: true },
            { name: 'Lucas', age: 25, active: false }
        ],
        user: {
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                tags: ['admin', 'dev']
            },
            createdDate: '2026-01-15T10:00:00.000Z'
        },
        nullProp: null,
        undefinedProp: undefined
    };

    describe('get()', () => {
        it('debe soportar texto con placeholders e interpolación como "Esto es un texto y el nombre es {{a[0].name}}"', () => {
            const result = DynamicObjectService.get(
                'Esto es un texto y el nombre es {{a[0].name}}',
                mockData,
                DynamicObjectType.STRING
            );
            expect(result).toBe('Esto es un texto y el nombre es Matias');
        });

        it('debe soportar múltiples placeholders en un mismo texto', () => {
            const result = DynamicObjectService.get(
                'Usuario: {{user.profile.firstName}} {{user.profile.lastName}} - Primer tag: {{user.profile.tags[0]}}',
                mockData,
                DynamicObjectType.STRING
            );
            expect(result).toBe('Usuario: John Doe - Primer tag: admin');
        });

        it('debe obtener valor directo por índice de arreglo "a[0].name"', () => {
            const result = DynamicObjectService.get('a[0].name', mockData, DynamicObjectType.STRING);
            expect(result).toBe('Matias');
        });

        it('debe obtener valor directo con llaves simples "{{a[0].name}}"', () => {
            const result = DynamicObjectService.get('{{a[0].name}}', mockData, DynamicObjectType.STRING);
            expect(result).toBe('Matias');
        });

        it('debe extraer objeto o número con el tipo correcto al usar una sola expresión', () => {
            const age = DynamicObjectService.get('{{a[0].age}}', mockData, DynamicObjectType.NUMBER);
            expect(age).toBe(30);
            expect(typeof age).toBe('number');

            const obj = DynamicObjectService.get('{{a[0]}}', mockData, DynamicObjectType.OBJECT);
            expect(obj).toEqual({ name: 'Matias', age: 30, active: true });
        });

        it('debe devolver valor por defecto si la propiedad no existe', () => {
            const result = DynamicObjectService.get('a[99].name', mockData, DynamicObjectType.STRING, {
                defaultValue: 'Default User'
            });
            expect(result).toBe('Default User');
        });

        it('debe convertir tipos adecuadamente', () => {
            expect(DynamicObjectService.get('a[0].active', mockData, DynamicObjectType.BOOLEAN)).toBe(true);
            expect(DynamicObjectService.get('user.profile.tags', mockData, DynamicObjectType.ARRAY)).toEqual(['admin', 'dev']);
            expect(DynamicObjectService.get('user.createdDate', mockData, DynamicObjectType.DATE)).toEqual(new Date('2026-01-15T10:00:00.000Z'));
        });
    });

    describe('interpolate()', () => {
        it('debe interpolar texto con corchetes y objetos anidados', () => {
            const template = 'Hola {{ a[1].name }}, tienes {{ a[1].age }} años.';
            const result = DynamicObjectService.interpolate(template, mockData);
            expect(result).toBe('Hola Lucas, tienes 25 años.');
        });
    });

    describe('set()', () => {
        it('debe asignar valores creando arrays u objetos intermedios', () => {
            const target: any = {};
            DynamicObjectService.set('users[0].name', 'Pedro', target);
            expect(target).toEqual({
                users: [{ name: 'Pedro' }]
            });

            DynamicObjectService.set('users[0].age', 40, target);
            expect(target.users[0]).toEqual({ name: 'Pedro', age: 40 });
        });
    });
});
