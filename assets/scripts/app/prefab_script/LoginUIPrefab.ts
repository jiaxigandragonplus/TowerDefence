import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/LoginUIPrefab")
export class LoginUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Button)
    wechatLoginBtn: Button = null;

    @property(Button)
    accountLoginBtn: Button = null;

    @property(Button)
    accountRegBtn: Button = null;

    @property(Button)
    customBtn: Button = null;

    @property(Button)
    guestLoginBtn: Button = null;
}
