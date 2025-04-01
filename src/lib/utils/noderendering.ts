import type { LionWebJsonReferenceTarget, LionWebJsonReference, LionWebJsonProperty } from '@lionweb/validation';

export function getPropertyValue(property: LionWebJsonProperty): string | null {
	return property?.value;
}

export function getReferenceValues(reference: LionWebJsonReference): LionWebJsonReferenceTarget[] {
	return reference?.targets || [];
}

export function renderPropertyValue(property: LionWebJsonProperty): string {
	if (property.value === null) return 'null';
	if (typeof property.value === 'object') return JSON.stringify(property.value);
	return String(property.value).replace(/\n/g, '↵\n');
}