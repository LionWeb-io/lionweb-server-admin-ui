import type { MessageFromClient, MessageToClient } from "@lionweb/server-delta-shared";
import {
    AdminRequestDefinitions,
    AdminResponseDefinitions,
    AdminTypesDefinitions,
    ChunksDefinitions,
    CommandDefinitions,
    DeltaTypesDefinitions,
    EventDefinitions,
    type PropertyDefinition,
    RequestDefinitions,
    ResponseDefinitions,
    type StructuredType,
    SyntaxDefinition
} from "@lionweb/validation";


const definitions = new SyntaxDefinition(
    [CommandDefinitions, ResponseDefinitions, RequestDefinitions, EventDefinitions, AdminRequestDefinitions, AdminResponseDefinitions //, MonitorDefinitions
    ],
    [ChunksDefinitions, DeltaTypesDefinitions, AdminTypesDefinitions]
);

export function getType(message: MessageFromClient | MessageToClient): StructuredType | undefined {
    if (message === undefined) {
        return undefined;
    }
    return definitions.getStructuredType(message.messageKind);
}
export function isPrimitive(prop: PropertyDefinition): boolean {
    if (prop === undefined) {
        return true;
    }
    return definitions.getPrimitiveType(prop.type) !== undefined;
}
