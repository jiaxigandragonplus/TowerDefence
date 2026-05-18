import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/ThemeUIPrefab")
export class ThemeUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    homeBtn: Button = null;

    @property(Button)
    helpBtn: Button = null;

    @property(Button)
    preBtn: Button = null;

    @property(Button)
    nextBtn: Button = null;
}
