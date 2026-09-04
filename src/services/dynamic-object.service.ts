import { DynamicGetOptions, DynamicObjectType, DynamicTypeMapping } from "./dynamic-object.types";


export class DynamicObjectService {

    /**
     * Obtiene un valor anidado o interpola un texto de forma segura infiriendo el tipo de retorno.
     * Soporta:
     * - Rutas directas: "a[0].name", "user.address.city"
     * - Expresiones mustache: "{{a[0].name}}"
     * - Textos con plantillas/placeholders: "Esto es un texto y el nombre es {{a[0].name}}"
     */
    public static get<T extends DynamicObjectType = DynamicObjectType.RAW>(
        path: string | null | undefined,
        source: Record<string, any> | null | undefined,
        responseAs: T = DynamicObjectType.RAW as T,
        options?: DynamicGetOptions<DynamicTypeMapping[T]>
    ): DynamicTypeMapping[T] {
        if (!path) {
            return (options?.defaultValue !== undefined ? options.defaultValue : this.toAsType(undefined, responseAs)) as DynamicTypeMapping[T];
        }

        if (!source || typeof source !== 'object') {
            if (options?.notReplaceIfNotFound) {
                const trimmedPath = path.trim();
                const hasInterpolation = /\{\{\s*([^}]+?)\s*\}\}/.test(trimmedPath);
                if (hasInterpolation) {
                    return (options?.defaultValue !== undefined
                        ? options.defaultValue
                        : this.toAsType(trimmedPath, responseAs)
                    ) as DynamicTypeMapping[T];
                }
            }
            return (options?.defaultValue !== undefined ? options.defaultValue : this.toAsType(undefined, responseAs)) as DynamicTypeMapping[T];
        }

        const trimmedPath = path.trim();

        // Verifica si es un template con texto alrededor o múltiples variables: "Texto {{a[0].name}}" o "{{a}} - {{b}}"
        const singleMustacheMatch = trimmedPath.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
        const hasInterpolation = /\{\{\s*([^}]+?)\s*\}\}/.test(trimmedPath);

        if (hasInterpolation && !singleMustacheMatch) {
            const interpolated = this.interpolate(trimmedPath, source, options);
            return (interpolated !== undefined && interpolated !== ''
                ? this.toAsType(interpolated, responseAs)
                : (options?.defaultValue !== undefined ? options.defaultValue : this.toAsType(interpolated, responseAs))
            ) as DynamicTypeMapping[T];
        }

        // Si es una única expresión mustache "{{a[0].name}}", extraemos el interior "a[0].name"
        const cleanPath = singleMustacheMatch ? singleMustacheMatch[1].trim() : trimmedPath;

        // Normaliza notación de corchetes y puntos: "a[0].name" o "a['name']" -> ["a", "0", "name"]
        const keys = cleanPath
            .replace(/\[\s*['"]?([^'"\]]+)['"]?\s*\]/g, '.$1')
            .split('.')
            .map(k => k.trim())
            .filter(Boolean);

        let current: any = source;
        for (const key of keys) {
            if (current === null || current === undefined) {
                current = undefined;
                break;
            }
            current = current[key];
        }

        if (current === undefined || (current === null && options?.notReplaceIfNotFound && singleMustacheMatch)) {
            if (options?.defaultValue !== undefined && current === undefined) {
                return options.defaultValue;
            }
            if (options?.notReplaceIfNotFound && singleMustacheMatch) {
                return this.toAsType(trimmedPath, responseAs) as DynamicTypeMapping[T];
            }
        }

        return this.toAsType(current, responseAs) as DynamicTypeMapping[T];
    }

    /**
     * Interpola múltiples variables dentro de un template string.
     * Ejemplo: "Esto es un texto y el nombre es {{a[0].name}}"
     */
    public static interpolate(
        template: string,
        context: Record<string, any>,
        options?: DynamicGetOptions
    ): string {
        if (!template || !context || typeof context !== 'object') return template || '';
        return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, pathExpression) => {
            const val = this.get(pathExpression.trim(), context, DynamicObjectType.RAW);
            if (val === undefined || val === null) {
                if (options?.notReplaceIfNotFound) {
                    return match;
                }
                if (options?.defaultValue !== undefined) {
                    return String(options.defaultValue);
                }
                return '';
            }
            if (typeof val === 'object') {
                return JSON.stringify(val);
            }
            return String(val);
        });
    }

    /**
     * Asigna un valor anidado creando los objetos o arreglos intermedios necesarios.
     * Soporta rutas como "a[0].name" o "users.0.email"
     */
    public static set(path: string, value: any, target: Record<string, any>): Record<string, any> {
        if (!path || !target || typeof target !== 'object') return target;

        const cleanPath = path.replace(/^\{\{|\}\}$/g, '').trim();
        const keys = cleanPath
            .replace(/\[\s*['"]?([^'"\]]+)['"]?\s*\]/g, '.$1')
            .split('.')
            .map(k => k.trim())
            .filter(Boolean);

        let current: any = target;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const nextKey = keys[i + 1];
            const isNextKeyIndex = /^\d+$/.test(nextKey);

            if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                current[key] = isNextKeyIndex ? [] : {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        return target;
    }
    /**
     * Conversión segura de tipos sin lanzar excepciones.
     */
    public static toAsType(value: any, type: DynamicObjectType): any {
        switch (type) {
            case DynamicObjectType.STRING:
                return this.toString(value);
            case DynamicObjectType.NUMBER:
                return this.toNumber(value);
            case DynamicObjectType.BOOLEAN:
                return this.toBoolean(value);
            case DynamicObjectType.ARRAY:
                return this.toArray(value);
            case DynamicObjectType.OBJECT:
                return this.toObject(value);
            case DynamicObjectType.DATE:
                return this.toDate(value);
            case DynamicObjectType.RAW:
            default:
                return value;
        }
    }
    private static toString(val: any): string {
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    }
    private static toNumber(val: any): number {
        if (val === undefined || val === null || typeof val === 'object') return 0;
        const parsed = Number(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    private static toBoolean(val: any): boolean {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
            const lower = val.trim().toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes';
        }
        return Boolean(val);
    }
    private static toArray(val: any): any[] {
        if (val === undefined || val === null) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [val];
            } catch {
                return [val];
            }
        }
        return [val];
    }
    private static toObject(val: any): Record<string, any> {
        if (val === undefined || val === null) return {};
        if (typeof val === 'object' && !Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null ? parsed : {};
            } catch {
                return {};
            }
        }
        return {};
    }
    private static toDate(val: any): Date | null {
        if (!val) return null;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }

}