import { _decorator, Component, Prefab, Node, NodePool, instantiate } from "cc";
import { Logger } from "../logger/Logger";

const log = new Logger("node-pools");

// 对象池
class NodePools {
    setTypePrefab(type: NodeType | string, prefab: Prefab) {
        this.ndPrefabs[type] = prefab;
    }

    getTypePrefab(type: NodeType | string) {
        return this.ndPrefabs[type];
    }

    getUnusedNd(type: NodeType | string): Node {
        const prefab = this.ndPrefabs[type];
        if (prefab == null) {
            log.error(`cannot find the prefab of NodeType ${NodeType[type]}`)
            return;
        }
        const pool = this.pools[type];
        if (pool && pool.size() > 0) {
            return pool.get();
        }
        const node = instantiate(prefab);
        node[this.nodeTypePropKey] = type;
        return node;
    }

    putUnusedNd(node: Node, type?: NodeType | string) {
        const nodeType = type || node[this.nodeTypePropKey];
        let pool = this.pools[nodeType];
        if (!pool) {
            pool = new NodePool();
            this.pools[nodeType] = pool;
        }
        node.setPosition(0, 0);
        pool.put(node);
    }

    private pools: { [type: number]: NodePool } = {};
    private ndPrefabs: { [type: number]: Prefab } = {};
    private nodeTypePropKey: string = "_node_type_";
}

export enum NodeType {
    IconSkillExp,//技能经验
    Item,//物品
    Max//用于计数结点类型数量
}

export const nodePools = new NodePools();