// TiledMap 管理器
// 负责 TMX 地图文件的加载、XML 解析、地图元数据提取，
// 以及路径点（PT1, PT2...）和障碍物/放置位（有 width/height 的对象）的结构化，
// 同时提供格子坐标 ↔ 世界坐标的转换工具

import { Vec3, resources, TextAsset } from 'cc';
import { Logger } from "../../../framework/logger/Logger";

const log = new Logger("tiled-map-mgr");

// ==================== 数据接口 ====================

/** TMX <object> 元素对应的地图对象数据 */
export interface TiledMapObject {
    /** 对象在 TMX 中的 id */
    id: number;
    /** 对象名称（如 "PT1", "1Ob1", "Obj1"） */
    name: string;
    /** 对象左上角 X 像素坐标（TMX 原始值） */
    x: number;
    /** 对象左上角 Y 像素坐标（TMX 原始值，原点在顶部） */
    y: number;
    /** 对象宽度（像素），路径点为 0 */
    width: number;
    /** 对象高度（像素），路径点为 0 */
    height: number;
    /** type 属性值（可选），可用于映射模板 ID */
    type: string;
    /** 自定义属性键值对 */
    properties: Record<string, string>;
}

/** TMX 解析后的完整地图结构化数据 */
export interface TiledMapData {
    /** 地图宽度（格子数） */
    width: number;
    /** 地图高度（格子数） */
    height: number;
    /** 格子宽度（像素） */
    tileWidth: number;
    /** 格子高度（像素） */
    tileHeight: number;
    /** 地图样式（来自 <properties> 的 style 值，默认为 0） */
    style: number;
    /** 地图所有自定义属性 */
    properties: Record<string, string>;
    /** 按 PT 编号升序排列的路径点列表 */
    pathPoints: TiledMapObject[];
    /** 所有障碍物/放置位（width > 0 && height > 0） */
    obstacles: TiledMapObject[];
}

// ==================== 管理器 ====================

export class TiledMapMgr {
    /** 当前已解析的地图数据 */
    private _mapData: TiledMapData | null = null;

    /** 当前加载的地图资源路径 */
    private _mapUrl: string = "";

    /** 是否已成功加载并解析 */
    private _loaded: boolean = false;

    // ==================== 状态访问 ====================

    /** 获取当前地图数据（只读） */
    get mapData(): Readonly<TiledMapData> | null {
        return this._mapData;
    }

    /** 是否已加载地图 */
    get isLoaded(): boolean {
        return this._loaded;
    }

    /** 地图宽度（格子数） */
    get mapWidth(): number {
        return this._mapData?.width ?? 0;
    }

    /** 地图高度（格子数） */
    get mapHeight(): number {
        return this._mapData?.height ?? 0;
    }

    /** 格子宽度（像素） */
    get tileWidth(): number {
        return this._mapData?.tileWidth ?? 0;
    }

    /** 格子高度（像素） */
    get tileHeight(): number {
        return this._mapData?.tileHeight ?? 0;
    }

    /** 地图总像素宽度 */
    get pixelWidth(): number {
        if (!this._mapData) return 0;
        return this._mapData.width * this._mapData.tileWidth;
    }

    /** 地图总像素高度 */
    get pixelHeight(): number {
        if (!this._mapData) return 0;
        return this._mapData.height * this._mapData.tileHeight;
    }

    /** 地图样式 */
    get style(): number {
        return this._mapData?.style ?? 0;
    }

    // ==================== 加载与卸载 ====================

    /**
     * 从 resources 目录加载 TMX 文件并解析
     * @param path resources 下的相对路径，不含扩展名（如 "Themes/Theme1/BG1/BGPath"）
     * @returns Promise，解析成功 resolve，失败 reject
     */
    public loadFromResources(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 如果已加载相同路径，直接返回
            if (this._loaded && this._mapUrl === path) {
                resolve();
                return;
            }

            // 先卸载旧数据
            this.unload();

            resources.load(path, TextAsset, (err, asset) => {
                if (err) {
                    log.error(`failed to load tmx: ${path}`, err);
                    reject(err);
                    return;
                }

                try {
                    const xmlString = asset.text;
                    this._mapData = this.parseTmx(xmlString);
                    this._mapUrl = path;
                    this._loaded = true;
                    log.info(`tmx loaded and parsed: ${path}, ` +
                        `map=${this._mapData.width}x${this._mapData.height}, ` +
                        `tile=${this._mapData.tileWidth}x${this._mapData.tileHeight}, ` +
                        `PT=${this._mapData.pathPoints.length}, ` +
                        `obstacles=${this._mapData.obstacles.length}`);
                    resolve();
                } catch (parseErr) {
                    log.error(`failed to parse tmx: ${path}`, parseErr);
                    reject(parseErr);
                }
            });
        });
    }

    /**
     * 直接解析 TMX XML 字符串
     * 适用于已有字符串内容或从其他来源获取的 TMX 数据
     * @param xmlString TMX 格式的 XML 字符串
     * @returns 结构化地图数据
     */
    public parseTmx(xmlString: string): TiledMapData {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // 检查 XML 解析错误
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            throw new Error(`XML parse error: ${parseError.textContent}`);
        }

        const mapElement = xmlDoc.querySelector("map");
        if (!mapElement) {
            throw new Error("Invalid TMX: <map> element not found");
        }

        // ==================== 解析 map 元素属性 ====================
        const mapWidth = parseInt(mapElement.getAttribute("width") || "0", 10);
        const mapHeight = parseInt(mapElement.getAttribute("height") || "0", 10);
        const tileWidth = parseInt(mapElement.getAttribute("tilewidth") || "0", 10);
        const tileHeight = parseInt(mapElement.getAttribute("tileheight") || "0", 10);

        // ==================== 解析 map-level <properties> ====================
        const properties: Record<string, string> = {};
        const propsElement = mapElement.querySelector("properties");
        if (propsElement) {
            const propNodes = propsElement.querySelectorAll("property");
            propNodes.forEach((prop) => {
                const name = prop.getAttribute("name");
                const value = prop.getAttribute("value");
                if (name !== null && value !== null) {
                    properties[name] = value;
                }
            });
        }

        const style = parseInt(properties["style"] || "0", 10);

        // ==================== 解析 <objectgroup> 对象组 ====================
        const pathPoints: TiledMapObject[] = [];
        const obstacles: TiledMapObject[] = [];

        const objectGroups = mapElement.querySelectorAll("objectgroup");
        objectGroups.forEach((group) => {
            const objects = group.querySelectorAll("object");
            objects.forEach((obj) => {
                const mapObj = this.parseObjectElement(obj);
                if (!mapObj) return;

                // 有 width 和 height 的对象 = 障碍物/放置位
                if (mapObj.width > 0 && mapObj.height > 0) {
                    obstacles.push(mapObj);
                } else {
                    // 仅有坐标的对象 = 路径点
                    pathPoints.push(mapObj);
                }
            });
        });

        // ==================== 路径点按 PT 编号升序排列 ====================
        pathPoints.sort((a, b) => {
            const numA = this.extractPtNumber(a.name);
            const numB = this.extractPtNumber(b.name);
            return numA - numB;
        });

        return {
            width: mapWidth,
            height: mapHeight,
            tileWidth,
            tileHeight,
            style,
            properties,
            pathPoints,
            obstacles,
        };
    }

    /**
     * 卸载当前地图数据
     */
    public unload(): void {
        this._mapData = null;
        this._mapUrl = "";
        this._loaded = false;
        log.info("tmx unloaded.");
    }

    // ==================== 路径点访问 ====================

    /**
     * 获取路径点列表（世界坐标）
     * TMX 坐标系 Y 轴向下 → Cocos 坐标系 Y 轴向上（原点在左下角）
     * 转换公式: worldX = tmxX + tileWidth/2, worldY = pixelHeight - tmxY - tileHeight/2
     *
     * @returns 按路径顺序排列的世界坐标路径点数组
     */
    public getPathPoints(): Vec3[] {
        if (!this._mapData || this._mapData.pathPoints.length === 0) {
            return [];
        }

        const mapPixelH = this.pixelHeight;
        const halfTW = this._mapData.tileWidth / 2;
        const halfTH = this._mapData.tileHeight / 2;

        return this._mapData.pathPoints.map((pt) => {
            const worldX = pt.x + halfTW;
            const worldY = mapPixelH - pt.y - halfTH;
            return new Vec3(worldX, worldY, 0);
        });
    }

    /**
     * 获取路径点原始 TMX 数据（不做坐标转换）
     * @returns 按路径顺序排列的 TiledMapObject 数组
     */
    public getRawPathPoints(): TiledMapObject[] {
        return this._mapData?.pathPoints ?? [];
    }

    // ==================== 障碍物访问 ====================

    /**
     * 获取所有障碍物/放置位数据
     * @returns TiledMapObject 数组
     */
    public getObstacles(): TiledMapObject[] {
        return this._mapData?.obstacles ?? [];
    }

    /**
     * 获取障碍物的格子坐标和世界坐标
     * @param obj TMX 对象
     * @returns { gridX, gridY, worldPos }
     */
    public getObstaclePlacement(obj: TiledMapObject): {
        gridX: number;
        gridY: number;
        /** 占据的格子数（按 tileWidth/tileHeight 计算） */
        gridW: number;
        gridH: number;
        worldPos: Vec3;
    } | null {
        if (!this._mapData) return null;

        const tw = this._mapData.tileWidth;
        const th = this._mapData.tileHeight;
        const mapPixelH = this.pixelHeight;

        // TMX 对象左上角 → Cocos 世界坐标（对象中心点）
        const worldX = obj.x + obj.width / 2;
        const worldY = mapPixelH - obj.y - obj.height / 2;

        // 世界坐标 → 格子坐标
        const gridX = Math.floor(obj.x / tw);
        const gridY = Math.floor((mapPixelH - obj.y - obj.height) / th);
        const gridW = Math.ceil(obj.width / tw);
        const gridH = Math.ceil(obj.height / th);

        return {
            gridX,
            gridY,
            gridW,
            gridH,
            worldPos: new Vec3(worldX, worldY, 0),
        };
    }

    // ==================== 坐标转换 ====================

    /**
     * 格子坐标 → 世界坐标（格子中心点）
     * 适用于 Cocos 坐标系（原点在左下角，Y 轴向上）
     *
     * @param gridX 格子列（从左边开始）
     * @param gridY 格子行（从底部开始）
     * @returns 格子中心的世界坐标
     */
    public gridToWorld(gridX: number, gridY: number): Vec3 {
        if (!this._mapData) {
            log.warn("gridToWorld called but no map loaded.");
            return new Vec3();
        }
        const worldX = gridX * this._mapData.tileWidth + this._mapData.tileWidth / 2;
        const worldY = gridY * this._mapData.tileHeight + this._mapData.tileHeight / 2;
        return new Vec3(worldX, worldY, 0);
    }

    /**
     * 世界坐标 → 格子坐标
     *
     * @param worldX 世界 X 坐标
     * @param worldY 世界 Y 坐标
     * @returns [gridX, gridY]
     */
    public worldToGrid(worldX: number, worldY: number): [number, number] {
        if (!this._mapData) {
            log.warn("worldToGrid called but no map loaded.");
            return [0, 0];
        }
        const gridX = Math.floor(worldX / this._mapData.tileWidth);
        const gridY = Math.floor(worldY / this._mapData.tileHeight);
        return [gridX, gridY];
    }

    /**
     * 将 TMX 原始像素坐标（左上角原点）转换为 Cocos 世界坐标（左下角原点）
     *
     * @param tmxX TMX 对象的 x 属性
     * @param tmxY TMX 对象的 y 属性
     * @param objWidth 对象宽度（像素），可选，用于计算中心点
     * @param objHeight 对象高度（像素），可选，用于计算中心点
     * @returns Cocos 世界坐标
     */
    public tmxToWorld(tmxX: number, tmxY: number, objWidth: number = 0, objHeight: number = 0): Vec3 {
        if (!this._mapData) {
            log.warn("tmxToWorld called but no map loaded.");
            return new Vec3(tmxX, tmxY, 0);
        }
        const worldX = tmxX + objWidth / 2;
        const worldY = this.pixelHeight - tmxY - objHeight / 2;
        return new Vec3(worldX, worldY, 0);
    }

    // ==================== 私有工具方法 ====================

    /**
     * 解析单个 <object> 元素为 TiledMapObject
     */
    private parseObjectElement(obj: Element): TiledMapObject | null {
        const idStr = obj.getAttribute("id");
        const name = obj.getAttribute("name") || "";
        const xStr = obj.getAttribute("x");
        const yStr = obj.getAttribute("y");

        if (idStr === null || xStr === null || yStr === null) return null;

        const id = parseInt(idStr, 10);
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        const width = parseFloat(obj.getAttribute("width") || "0");
        const height = parseFloat(obj.getAttribute("height") || "0");
        const type = obj.getAttribute("type") || "";

        // 解析对象级 <properties>
        const properties: Record<string, string> = {};
        const propsElement = obj.querySelector("properties");
        if (propsElement) {
            const propNodes = propsElement.querySelectorAll("property");
            propNodes.forEach((prop) => {
                const propName = prop.getAttribute("name");
                const propValue = prop.getAttribute("value");
                if (propName !== null && propValue !== null) {
                    properties[propName] = propValue;
                }
            });
        }

        return { id, name, x, y, width, height, type, properties };
    }

    /**
     * 从名称 "PT<N>" 中提取数字 N，用于路径点排序
     * 非 PT 格式的名称返回安全大数，排在末尾
     */
    private extractPtNumber(name: string): number {
        const match = name.match(/^PT(\d+)$/i);
        if (match) {
            return parseInt(match[1], 10);
        }
        // 非 PT 名称排到末尾
        return Number.MAX_SAFE_INTEGER;
    }
}

/** 全局 TiledMap 管理器单例 */
export const tiledMapMgr = new TiledMapMgr();
