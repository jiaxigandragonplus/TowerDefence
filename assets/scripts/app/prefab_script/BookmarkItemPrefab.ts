import { _decorator, Component, Node, Button } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/BookmarkItemPrefab")
export class BookmarkItemPrefab extends Component {

    @property(Node)
    bookmarkArray: Node[] = [];

    protected onEnable(): void {
        this.showBookmark(0);
    }

    showBookmark(index: number) {
        if (index < 0 || index >= this.bookmarkArray.length) {
            index = 0;
        }
        for (let i = 0; i < this.bookmarkArray.length; i++) {
            if (i === index) {
                this.bookmarkArray[i].active = true;
            } else {
                this.bookmarkArray[i].active = false;
            }
        }
    }
}
