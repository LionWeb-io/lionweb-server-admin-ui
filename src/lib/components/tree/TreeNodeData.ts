import type { MonitorMessage } from "../../../deltaclients/monitor.svelte.js";

export class TreeNodeData {
    name: string;
    aboutNode?: MonitorMessage;
    children?: TreeNodeData[];

    constructor(name: string, aboutNode?: MonitorMessage, children?: TreeNodeData[]) {
        this.name = name;
        this.aboutNode = aboutNode;
        this.children = children;
    }
}

export interface TreeViewProps {
    title?: string;
    dataList?: TreeNodeData[];
}

export interface TreeNodeProps {
    data: TreeNodeData;
}
