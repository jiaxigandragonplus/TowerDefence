import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/MainUIPrefab")
export class MainUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    adventureBtn: Button = null;

    @property(Button)
    bossBtn: Button = null;

    @property(Button)
    nestBtn: Button = null;

    @property(Button)
    settingBtn: Button = null;

    @property(Button)
    helpBtn: Button = null;
}
