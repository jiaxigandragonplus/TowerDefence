import { _decorator, Component, Node, Button, Sprite } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/StageUIPrefab")
export class StageUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    backBtn: Button = null;

    @property(Button)
    helpBtn: Button = null;

    @property(Sprite)
    towers: Sprite = null;

    @property(Sprite)
    clouds: Sprite = null;
}
