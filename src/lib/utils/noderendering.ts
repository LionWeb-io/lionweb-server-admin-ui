import type {
	LionWebJsonReferenceTarget,
	LionWebJsonReference,
	LionWebJsonProperty,
	LionWebJsonNode
} from '@lionweb/validation';

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

export function getNodeName(node: LionWebJsonNode) : string | undefined {
	const nameProperty = node.properties.find(p => p.property.key === 'LionCore-builtins-INamed-name');
	return nameProperty?.value;
}

export function getQualifiedName(nodes: LionWebJsonNode[], node: LionWebJsonNode) : string | undefined {
	function getParent(node: LionWebJsonNode) : LionWebJsonNode | undefined {
		if (node.parent == null) {
			return undefined;
		}
		return nodes.find(n => n.id == node.parent);
	}

	const name = getNodeName(node);
	if (name == null) return undefined;
    const names = [name];
    let curr = getParent(node);
	while (curr != undefined) {
        const currName = getNodeName(curr);
        if (currName != null) {
			names.push(currName);
		}
		curr = getParent(curr);
	}
	return names.reverse().join('/');
}

export function getNodeRepresentation(node: LionWebJsonNode): { text: string; isId: boolean } {
	const nodeName = getNodeName(node);
	return {
		text: nodeName || node.id,
		isId: !nodeName
	};
}

export function getQualifiedNodeRepresentation(nodes: LionWebJsonNode[], node: LionWebJsonNode): { text: string; isId: boolean } {
	const nodeName = getQualifiedName(nodes, node);
	return {
		text: nodeName || node.id,
		isId: !nodeName
	};
}

export function splitQualifiedName(qualifiedName: string): { prefix: string | null, simpleName: string } {
	const parts = qualifiedName.split('/');
	const simpleName = parts.pop()!; // Get the last part as simple name
	const prefix = parts.length > 0 ? parts.join('/') : null; // Join remaining as prefix

	return { prefix, simpleName };
}
