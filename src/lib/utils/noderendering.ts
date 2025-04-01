import type { SerializedProperty, SerializedReference, SerializedReferenceTarget } from '@lionweb/core';

export function getPropertyValue(property: SerializedProperty): string | null {
	return property?.value;
}

export function getReferenceValues(reference: SerializedReference): SerializedReferenceTarget[] {
	return reference?.targets || [];
}

export function renderPropertyValue(property: SerializedProperty): string {
	if (property.value === null) return 'null';
	if (typeof property.value === 'object') return JSON.stringify(property.value);
	return String(property.value).replace(/\n/g, '↵\n');
}