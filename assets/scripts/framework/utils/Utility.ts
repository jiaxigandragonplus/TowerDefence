import { Logger } from "../logger/Logger";
import { Node, Vec2, Vec3, Size, Animation, director, view, UITransform } from 'cc';

const log = new Logger("utility");

export class Utility {
    // 从数组中移除制定元素
    static removeFromArray<T>(array: T[], elem: T) {
        const index = array.indexOf(elem);
        if (index < 0) {
            return;
        }
        array.splice(index, 1);
    }

    // 往数组指定位置插入元素
    static insertToArray<T>(array: T[], index: number, elem: T) {
        array.splice(index, 0, elem);
    }

    // 设置背景大小，适配不同分辨率
    static adaptUI(bg: Node) {
        // 调整分辨率
        let uiTransform = bg.getComponent(UITransform);
        if (!uiTransform) {
            log.warn("adaptUI: node does not have UITransform component");
            return;
        }
        let nodeSize = uiTransform.contentSize;
        let _rateR = nodeSize.height / nodeSize.width;
        let winSize = view.getVisibleSize();
        let _rateV = winSize.height / winSize.width;

        if (_rateV > _rateR) {
            // 适配宽度
            uiTransform.setContentSize(winSize.width, winSize.width * (nodeSize.height / nodeSize.width));
        }
        else {
            // 适配高度
            uiTransform.setContentSize(winSize.height * (nodeSize.width / nodeSize.height), winSize.height);
        }
    }

    // 递归查找子节点
    static deepFind(nodeName: string, referenceNode?: Node): Node {
        if (referenceNode == null) {
            referenceNode = director.getScene();
        }
        if (!referenceNode) {
            return null;
        }
        if (referenceNode.name === nodeName) {
            return referenceNode;
        }
        for (let i = 0; i < referenceNode.children.length; ++i) {
            const target = this.deepFind(nodeName, referenceNode.children[i]);
            if (target) {
                return target;
            }
        }
        return null;
    }

    // range: [min, max)
    static randomNumber(min: number, max: number): number {
        let delta = max - min;
        return min + Math.floor(Math.random() * delta);
    }

    // range: [min, max)
    static randomFloat(min: number, max: number): number {
        let delta = max - min;
        return min + Math.random() * delta;
    }

    // 生成随机串
    static randomString(len: number, charSet?: string) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < len; i++) {
            let randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    }

    // 遍历枚举的所有成员名称
    static forEachEnumMemName(enumType: any, callback: (enumName: string) => void) {
        for (let enumMember in enumType) {
            if (isNaN(Number(enumMember))) {
                callback(enumMember);
            }
        }
    }

    // 遍历枚举的所有成员值
    static forEachEnumMemValue(enumType: any, callback: (enumValue: number) => void) {
        for (let enumMember in enumType) {
            const value = Number(enumMember);
            if (!isNaN(value)) {
                callback(value);
            }
        }
    }

    //格式化数值，显示 k(千)、m(百万)、b(十亿)、t(万亿)
    static formatNumber(num: number, numberInitial?: string[]): string {
        let postfix = numberInitial || ["T", "B", "M", "K"];
        let trillion = 1e12;
        let billion = 1e9;
        let million = 1e6;
        let thousand = 1e3;
        if (num >= trillion) {
            return (num / trillion).toFixed(3) + postfix[0];
        }
        else if (num >= billion) {
            return (num / billion).toFixed(3) + postfix[1];
        }
        else if (num >= million) {
            return (num / million).toFixed(3) + postfix[2];
        }
        else if (num >= thousand) {
            return (num / thousand).toFixed(3) + postfix[3];
        }
        else {
            return num.toString();
        }
    }

    // timeInitial 是一个长度为 4 的字符串数组，表示日、时、分、秒，如 [d, h, m, s]
    static formatTimeWithInitial(seconds: number, timeInitial?: string[]): string {
        let postfix = timeInitial || ['Day', 'Hour', 'Min', 'Sec'];

        if (seconds <= 0) {
            return '00' + postfix[3];
        }
        let days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
        let hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;

        let leftTimeArray = [days, hours, mins, secs];

        while (leftTimeArray != null && leftTimeArray.length > 0 &&
            (leftTimeArray[0] == null || leftTimeArray[0] == 0)
        ) {
            postfix.shift();
            leftTimeArray.shift();
        }

        let leftTimes = leftTimeArray.map(function (time, index) {
            if (time < 0) {
                return '';
            }
            return (time < 10 ? '0' + time : time) + postfix[index];
        });

        return leftTimes.join(' ');
    };

    // 如果时间小于一天会显示为 00:00:00 的样子，如果大于 1 天会显示为 1Day1Hour
    static formatTimeAsRemainTime(seconds: number) {
        const days = Math.floor(seconds / 86400);
        if (days > 0) {
            seconds = seconds % 86400;
            let hours = Math.floor(seconds / 3600);
            return days + 'Day ' + hours + 'Hour';
        }
        else
            return this.formatTimeWithColon(seconds, 2);
    }

    // 将时间转换为 00:00 或 00:00:00 的字符串
    static formatTimeWithColon(seconds: number, colonNum: 1 | 2): string {
        let days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
        let hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        if (colonNum === 1) {
            return `${days * 1440 + hours * 60 + mins}:${secs}`;
        }
        if (colonNum === 2) {
            return `${days * 24 + hours}:${mins}:${secs}`;
        }
    }

    //将秒数格式化为"多久以前"，如："1 分钟以前"，"5 天前"
    static formmatTimePast(seconds: number): string {
        //TODO: implemente it
        return seconds.toString();
    }

    //浮点数约等于
    static floatApproximatelyEquals(a: number, b: number, e: number = 0.0001) {
        return Math.abs(a - b) < e;
    }

    //修改对象中的一个属性，如果有传入变化量则验证变化量
    static modifyObjectNumProp(obj: any, propName: string, final: number, delta?: number) {
        if (!obj.hasOwnProperty(propName)) {
            log.warn(`modifyObjectNumProp: ${obj} has not own property ${propName}`);
            return;
        }
        if (delta != null) {
            if ((obj[propName] + delta) != final) {
                log.warn(`modifyObjectNumProp: current value add delta does not equals final,
          ${obj} current ${propName} = ${obj[propName]}, 
          delta = ${final}, final = ${final}`);
            }
        }
        obj[propName] = final;
    }

    //判断一个点是否在一个盒子内
    static pointInBox(pointPos: Vec2, boxMiddle: Vec2, boxSize: Size) {
        const offset = pointPos.subtract(boxMiddle);
        return Math.abs(offset.x) < boxSize.width / 2 && Math.abs(offset.y) < boxSize.height / 2;
    }

    //判断一个点是否在一个圆内
    static pointInCircle(pointPos: Vec2, circleCenter: Vec2, circleRadius: number) {
        const offset = pointPos.subtract(circleCenter);
        return offset.length() < circleRadius;
    }

    static sampleAnim(anim: Animation, animName: string, time: number) {
        const state = anim.getState(animName);
        if (state) {
            state.time = time;
            state.sample();
        }
    }

    static getWorldPositionOfNode(node: Node): Vec3 {
        const worldPos = new Vec3();
        node.getWorldPosition(worldPos);
        return worldPos;
    }

    //这里的设置 anchor 是类似 Unity 只有节点原点会移动，而不是 cocos 那种只有框和锚点在动
    static setAnchorPointInPointsAR(node: Node, point: Vec2) {
        const uiTransform = node.getComponent(UITransform);
        if (!uiTransform) {
            log.warn("setAnchorPointInPointsAR: node does not have UITransform component");
            return;
        }
        const ap = uiTransform.anchorPoint;
        const arPoint = new Vec2(uiTransform.width * ap.x, uiTransform.height * ap.y);
        const pointWithoutAR = arPoint.add(point);
        Utility.setAnchorPointInPoints(node, pointWithoutAR);
    }

    //这里的设置 anchor 是类似 Unity 只有节点原点会移动，而不是 cocos 那种只有框和锚点在动
    static setAnchorPointInPoints(node: Node, point: Vec2) {
        let aX, aY = 0;
        const uiTransform = node.getComponent(UITransform);
        if (!uiTransform) {
            log.warn("setAnchorPointInPoints: node does not have UITransform component");
            return;
        }
        if (point.x <= 0 || uiTransform.width === 0) aX = 0;
        else if (point.x >= uiTransform.width) aX = 1;
        else aX = point.x / uiTransform.width;

        if (point.y <= 0 || uiTransform.height === 0) aY = 0;
        else if (point.y >= uiTransform.height) aY = 1;
        else aY = point.y / uiTransform.height;

        Utility.setAnchorPoint(node, aX, aY);
    }

    //这里的设置 anchor 是类似 Unity 只有节点原点会移动
    static setAnchorPoint(node: Node, aX: number, aY: number) {
        if (aX < 0) aX = 0;
        else if (aX > 1) aX = 1;

        if (aY < 0) aY = 0;
        else if (aY > 1) aY = 1;

        const uiTransform = node.getComponent(UITransform);
        if (!uiTransform) {
            log.warn("setAnchorPoint: node does not have UITransform component");
            return;
        }

        const childOffset = new Vec3(uiTransform.width * uiTransform.anchorPoint.x - uiTransform.width * aX, uiTransform.height * uiTransform.anchorPoint.y - uiTransform.height * aY, 0);
        const children = node.children;
        children.forEach(value => {
            value.position = value.position.add(childOffset);
        });
        const nodeOffset = new Vec3(-childOffset.x * node.scale.x, -childOffset.y * node.scale.y, 0);
        node.position = node.position.add(nodeOffset);
    }

    //获得半径为 1 的单位圆中的任意一点
    static getRandomInsideUnitSphere() {
        const angel = Utility.randomFloat(0, 360) / 180 * Math.PI;
        const r = Math.random();
        return new Vec2(Math.cos(angel) * r, Math.sin(angel) * r);
    }

    //返回带有商和余数的对象
    static divRem(a: number, b: number) {
        return {
            quotient: Math.floor(a / b),
            remainder: a % b,
        }
    }

    //将 HtmlImageElement 转为 Base64 编码
    static imageToBase64(img: HTMLImageElement, mimeType?: string) {
        // New Canvas
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw Image
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        // To Base64
        return canvas.toDataURL(mimeType);
    }
}

export type AsyncCallback = (err?: Error, ...args) => void;
