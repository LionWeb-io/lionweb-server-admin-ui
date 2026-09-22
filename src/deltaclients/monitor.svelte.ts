import { DeltaClient } from "@lionweb/server-delta-client";
import {
    type Custom_MonitorStartMonitor,
    isDeltaAdminRequest,
    isDeltaAdminResponse,
    isDeltaCommand,
    isDeltaEvent,
    isDeltaRequest,
    isDeltaResponse,
    type MessageFromClient,
    type MessageToClient,
    type SignOnRequest
} from "@lionweb/server-delta-shared";
import { SvelteMap } from "svelte/reactivity";
import { Client, clients } from "./clients.svelte.js";

export type MonitorMessage = {
    messageKind: "Monitor";
    clientId: string;
    participationId: string;
    repositoryName: string;
    delta: MessageToClient | MessageFromClient;
};

export function mmId(m: MonitorMessage): string {
    if (isDeltaResponse(m.delta)) {
        return m.clientId + m.delta.queryId + m.delta.messageKind;
    } else if (isDeltaEvent(m.delta)) {
        return m.clientId + m.delta.messageKind + m.delta.originCommands.map((or) => or.commandId).join(",");
    } else if (isDeltaCommand(m.delta)) {
        return m.clientId + m.delta.commandId + m.delta.messageKind;
    } else if (isDeltaRequest(m.delta)) {
        return m.clientId + m.delta.queryId + m.delta.messageKind;
    } else {
        return "???" + m.delta.messageKind;
    }
}

export function isFromClient(delta: MessageToClient | MessageFromClient): delta is MessageFromClient {
    return isDeltaCommand(delta) || isDeltaRequest(delta) || isDeltaAdminRequest(delta);
}
export function isToClient(delta: MessageToClient | MessageFromClient): delta is MessageToClient {
    return isDeltaEvent(delta) || isDeltaResponse(delta) || isDeltaAdminResponse(delta);
}

/**
 * Is `target` delta (sent to a client) the result of `src` delta (send to server)?
 * @param src
 * @param target
 */
export function causes(src: MonitorMessage, target: MonitorMessage): boolean {
    if (isDeltaCommand(src.delta) && isDeltaEvent(target.delta)) {
        const srcDelta = src.delta;
        return (
            target.delta.originCommands.find((origin) => {
                return origin.commandId === srcDelta.commandId && origin.participationId === src.participationId;
            }) != undefined
        );
    } else if (isDeltaRequest(src.delta) && isDeltaResponse(target.delta)) {
        const srcDelta = src.delta;
        const tgtDelta = target.delta;
        return tgtDelta.queryId === srcDelta.queryId && src.participationId === target.participationId;
    } else if (isDeltaAdminRequest(src.delta) && isDeltaAdminResponse(target.delta)) {
        const srcDelta = src.delta;
        const tgtDelta = target.delta;
        return tgtDelta.queryId === srcDelta.queryId && src.participationId === target.participationId;
    }
    return false;
}

export function getDeltaId(message: MessageFromClient | MessageToClient): string {
    if (isDeltaResponse(message)) {
        return message.queryId;
    } else if (isDeltaEvent(message)) {
        return message.originCommands.map((or) => or.commandId).join(",");
    } else if (isDeltaCommand(message)) {
        return message.commandId;
    } else if (isDeltaRequest(message)) {
        return message.queryId;
    } else {
        return "???";
    }
}

function isMonitorMessage(object: { messageKind: string }): object is MonitorMessage {
    return object?.messageKind === "Monitor";
}

export class Monitor {
    monitorClient: DeltaClient;
    allMessages: MonitorMessage[] = $state([]);
    clientToColum: SvelteMap<string, number> = $state(new SvelteMap<string, number>());
    messageToRow: SvelteMap<string, number> = $state(new SvelteMap<string, number>());
    activeClients: SvelteMap<string, Client> = $state(new SvelteMap<string, Client>());

    private static theInstance: Monitor;

    static getInstance(): Monitor {
        if (Monitor.theInstance === undefined) {
            Monitor.theInstance = new Monitor();
        }
        return Monitor.theInstance;
    }

    private nextClientColumn = 1;
    private nextMessageRow = 2;

    private constructor() {
        this.monitorClient = new DeltaClient("monitor", { hostname: "localhost", port: 3005 }, []);
        this.monitorClient.loggingOn = false;
        this.monitorClient.customFunctionOnly = true;
        this.monitorClient.customFunction = (msg: object) => {
            console.log(`Monitor received '${JSON.stringify(msg)}`);
            if (isMonitorMessage(msg as unknown as { messageKind: string })) {
                const message = (msg as unknown as { messageKind: string }) as MonitorMessage
                // console.error(`Monitor received '${JSON.stringify(message)}`);
                const clientId = message.clientId;
                const repository = message.repositoryName;
                const delta = message.delta;
                if (clientId === undefined) {
                    console.error(`Monitor message with undefined client`);
                    return;
                }
                let client = this.activeClients.get(clientId);
                if (client === undefined) {
                    // console.log(`Monitor: NEW CLIENT  ${clientId}`);
                    client = new Client(clientId, message.participationId, repository);
                    this.activeClients.set(clientId, client);
                    clients.push(client);
                }
                client.messages.push(delta);
                this.allMessages.push(message);
            } else {
                // console.error(`Monitor received '${JSON.stringify(msg)}`);
                // ignore non monitor messages
            }
        };
        const request: SignOnRequest = {
            messageKind: "SignOnRequest",
            repositoryId: "MyBulkImportRepo",
            deltaProtocolVersion: "2023.1",
            clientId: "monitor",
            queryId: `signOn-${22}`,
            additionalInfos: []
        };
        const monitorMessage: Custom_MonitorStartMonitor = {
            additionalInfos: [],
            messageKind: "Custom_MonitorStart",
            queryId: "id",
            repositoryName: "MyBulkImportRepo"
        };
        this.monitorClient.connect().then(() => {
            this.monitorClient.sendRequest(request);
            this.monitorClient.sendMonitorRequest(monitorMessage);
        });
    }

    getClients(): Client[] {
        return this.activeClients
            .entries()
            .map((e) => e[1])
            .toArray();
    }

    getMessages(): MonitorMessage[] {
        const filter = (msg: MonitorMessage): boolean => {
            return msg.delta.messageKind !== "SignOnResponse"; // && msg.clientId !== "client3"
        };
        const result = this.allMessages.filter((msg) => filter(msg) === true);
        let nextClientColumn = 1;
        let nextRow = 2;
        const clientsProcessed: Map<string, Client> = new Map<string, Client>();
        let previousMessage: MonitorMessage | undefined = undefined;
        result.forEach((msg) => {
            const clientId = msg.clientId;
            // const repository = msg.repositoryName
            // const delta = msg.delta
            const client = this.activeClients.get(clientId);
            const showingClient = clientsProcessed.get(clientId);
            if (showingClient === undefined) {
                clientsProcessed.set(clientId, client!);
                this.clientToColum.set(clientId, nextClientColumn++);
            }
            if (isFromClient(msg.delta)) {
                console.log(`isfromClient is ${msg.delta.messageKind}`);
                this.messageToRow.set(mmId(msg), ++nextRow);
            } else if (isToClient(msg.delta)) {
                console.log(`isfromServer is ${msg.delta.messageKind}`);
                const previousMessageKind = previousMessage?.delta?.messageKind;
                if (previousMessageKind === undefined || previousMessageKind !== msg.delta.messageKind) {
                    console.log(
                        `++ last is '${previousMessageKind}' new is '${msg.delta.messageKind}' => ${previousMessageKind === undefined || previousMessageKind !== msg.delta.messageKind}`
                    );
                    nextRow++;
                } else {
                    if (previousMessage !== undefined && getDeltaId(previousMessage?.delta) !== getDeltaId(msg.delta)) {
                        nextRow++;
                    } else {
                        nextRow++;
                    }
                }
                this.messageToRow.set(mmId(msg), nextRow);
                // TODO: fix this, Custom_Monitor is not recognized yet as a message kind
            } else if ((msg.delta as unknown as {messageKind: string}).messageKind.startsWith("Custom_Monitor")){
                // a Custom_Monitor event
            } else {
                console.error(`getMessages: incorrect message ${JSON.stringify(msg.delta)}`);
            }
            previousMessage = msg;
        });
        return result;
    }
}
