import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/LoginUIPrefab")
export class LoginUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    startBtn: Button = null;
}
