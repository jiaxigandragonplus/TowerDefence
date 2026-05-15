import { Node, find } from "cc";
import { viewMain } from "../ViewMain";

// 处理那些非根结点又需要跨场景存在的结点，根结点使用 cc.game.addPersistRootNode
class PersistNodeMgr {
    //初始化这个管理器
    init() {
        // 场景御载前从场景中摘下来
        viewMain.events.on("BeforeSceneUnload", () => {
            this.persistNodesUnderCanvas.forEach(pnode => {
                pnode.removeFromParent();
            });
        });
        // 场景加载完成后挂回上去
        viewMain.events.on("AfterSceneLoaded", () => {
            const canvas = find("canvas") || find("Canvas");
            if (canvas) {
                this.persistNodesUnderCanvas.forEach(pnode => {
                    pnode.setParent(canvas);
                });
            }
        });
    }

    //添加 Canvas 的孩子结点为 persist node
    addCanvasChild(node: Node) {
        this.persistNodesUnderCanvas.push(node);
    }

    private persistNodesUnderCanvas: Node[] = [];
}

export const persistNodeMgr = new PersistNodeMgr();
