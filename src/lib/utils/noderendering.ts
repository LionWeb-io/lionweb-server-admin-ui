export function getPropertyValue(property: any): any {
	return property?.value;
}

export function getReferenceValues(reference: any): any[] {
	return reference?.values || reference?.targets || [];
}

export function renderPropertyValue(property: { value: any }): string {
	if (property.value === null) return 'null';
	if (typeof property.value === 'object') return JSON.stringify(property.value);
	return String(property.value).replace(/\n/g, '↵\n');
}