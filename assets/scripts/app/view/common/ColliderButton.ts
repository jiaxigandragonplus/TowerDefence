import { _decorator, Component, Collider2D, Node, EventTouch, Vec2, Vec3, BoxCollider2D, CircleCollider2D, PolygonCollider2D, EventHandler, UITransform } from "cc";
import { Utility } from "../../../framework/utils/Utility";
import { Logger } from "../../../framework/logger/Logger";

const log = new Logger('Collider Button')

const { ccclass, property, menu } = _decorator;
@ccclass
@menu("ig/all-stage/ColliderButton")
export class ColliderButton extends Component {

  @property
  interactable: boolean = true;

  @property({
    type: [EventHandler],
  })
  clickEvents: EventHandler[] = [];

  onLoad() {
    this.collider = this.node.getComponent(Collider2D);
    if (!this.collider) {
      log.error(`ColliderButton: cannot find Collider in ${this.node.name}`);
      return;
    }
    this.parseColliderType(this.collider);
  }

  onEnable() {
    this.registerEvent();
  }

  onDisable() {
    this.releaseEvent();
  }

  private registerEvent() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchBegan, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  private releaseEvent() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchBegan, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  private onTouchBegan(event: EventTouch) {
    if (!this.interactable || !this.enabledInHierarchy) {
      return;
    }
    
    if (!this.handleTouch(event)) {
      this.releaseEvent();
      this.registerEvent();
      return;
    }

    this.pressed = true;
    this.node.emit("pressdown", this);
    event.propagationStopped = true;
  }

  private onTouchMove(event: EventTouch) {
    if (!this.interactable || !this.enabledInHierarchy) {
      return;
    }
    this.node.emit("pressmove", this);
    if (!this.pressed) {
      return;
    }
    this.node.emit("pressedmove", this);
    event.propagationStopped = true;
  }

  private onTouchEnded(event: EventTouch) {
    if (!this.interactable || !this.enabledInHierarchy || !this.handleTouch(event)) {
      return;
    }
    if (this.pressed) {
      EventHandler.emitEvents(this.clickEvents, event);
      this.node.emit("click", this);
    }
    this.pressed = false;
    event.propagationStopped = true;
  }

  private onTouchCancel(event: EventTouch) {
    if (!this.interactable || !this.enabledInHierarchy) {
      return;
    }
    this.pressed = false;
  }

  private handleTouch(event: EventTouch) {
    const touchPos = event.getLocation();
    return this.checkInCollider(touchPos);
  }

  private checkInCollider(pos: Vec2) {
    const uiTransform = this.node.getComponent(UITransform);
    if (!uiTransform) {
      log.error("ColliderButton: node does not have UITransform component");
      return false;
    }
    
    // 将屏幕坐标转换为节点本地坐标
    // 在 Cocos Creator 3.x 中，使用 UITransform.convertToNodeSpaceAR 进行坐标转换
    const screenPos = new Vec3(pos.x, pos.y, 0);
    const localPos = uiTransform.convertToNodeSpaceAR(screenPos);
    const localVec2 = new Vec2(localPos.x, localPos.y);
    
    if (this.colliderType === 'BoxCollider2D') {
      const box = this.collider as BoxCollider2D;
      return Utility.pointInBox(localVec2, box.offset, box.size);
    }
    else if (this.colliderType === 'CircleCollider2D') {
      const circle = this.collider as CircleCollider2D;
      return Utility.pointInCircle(localVec2, circle.offset, circle.radius);
    }
    else if (this.colliderType === 'PolygonCollider2D') {
      const polygon = this.collider as PolygonCollider2D;
      return this.pointInPolygon(localVec2.subtract(polygon.offset), polygon.points);
    }
    else {
      log.error("ColliderButton: unexpect type of collider.");
      return false;
    }
  }

  private pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    // 射线法判断点是否在多边形内
    let inside = false;
    const x = point.x;
    const y = point.y;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private parseColliderType(target: Collider2D) {
    if (target instanceof BoxCollider2D){
      this.colliderType = 'BoxCollider2D';
    }
    else if (target instanceof CircleCollider2D) {
      this.colliderType = 'CircleCollider2D';
    }
    else if (target instanceof PolygonCollider2D) {
      this.colliderType = 'PolygonCollider2D';
    }
    else {
      log.error("ColliderButton: cant parse collider's type.");
    }
  }

  private colliderType: string;
  private collider: Collider2D;

  private pressed: boolean = false;
}