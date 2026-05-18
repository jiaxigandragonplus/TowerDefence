import { _decorator, Component, Node, Button, Label } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/BattleUIPrefab")
export class BattleUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    menuBtn: Button = null;

    @property(Button)
    pauseBtn: Button = null;

    @property(Button)
    resumeBtn: Button = null;

    @property(Button)
    speed1Btn: Button = null;

    @property(Button)
    speed2Btn: Button = null;

    @property(Label)
    totalWaveLabel: Label = null;
}
