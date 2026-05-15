import { _decorator, Component, Node, Button, EditBox } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/AccountLoginUIPrefab")
export class AccountLoginUIPrefab extends Component {

    @property(Node)
    clickMask: Node = null;

    @property(Button)
    closeBtn: Button = null;

    @property(Button)
    loginBtn: Button = null;

    @property(EditBox)
    accountEdit: EditBox = null;

    @property(EditBox)
    passwordEdit: EditBox = null;
}
