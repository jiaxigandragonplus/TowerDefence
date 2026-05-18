import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/StageItemPrefab")
export class StageItemPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Node)
    lock: Node = null;
}
