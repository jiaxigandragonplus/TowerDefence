import { _decorator, Component } from "cc";
import { Logger } from "../../framework/logger/Logger";
import { TowerCsvLoader } from "../data/TowerCsvLoader";
import { TowerConfig } from "../data/TowerConfig";

const log = new Logger("TowerCsvTest");
const { ccclass, property, menu } = _decorator;

/**
 * Tower.csv 加载测试用例
 *
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点上
 * 2. 勾选 runTestOnStart 可在启动时自动执行
 * 3. 也可通过控制台调用 TowerCsvTest.instance.run() 手动执行
 */
@ccclass
@menu("ig/Test/TowerCsvTest")
export class TowerCsvTest extends Component {
    @property({ tooltip: "启动时自动运行测试" })
    runTestOnStart: boolean = true;

    private loader: TowerCsvLoader = new TowerCsvLoader();
    private static _instance: TowerCsvTest;

    // ---- 工具方法 ----

    /** 简易字符串补齐（兼容 ES5，避免 padEnd 依赖 ES2017） */
    private static pad(str: string, len: number): string {
        while (str.length < len) {
            str += " ";
        }
        return str;
    }

    /** 打印塔类型分布 */
    private static printTowerSummary(towers: TowerConfig[]): void {
        var nameCount: Record<string, number> = {};
        for (var i = 0; i < towers.length; i++) {
            var tName = towers[i].Name;
            nameCount[tName] = (nameCount[tName] || 0) + 1;
        }
        log.info("  塔类型分布:");
        var keys = Object.keys(nameCount);
        for (var j = 0; j < keys.length; j++) {
            log.info("    " + keys[j] + ": " + nameCount[keys[j]] + " 个");
        }
    }

    // ---- 生命周期 / 静态入口 ----

    onLoad() {
        TowerCsvTest._instance = this;
    }

    async start() {
        if (this.runTestOnStart) {
            await this.run();
        }
    }

    static get instance(): TowerCsvTest {
        return TowerCsvTest._instance;
    }

    // ---- 测试主流程 ----

    async run() {
        log.info("========== Tower.csv 加载测试开始 ==========");

        // 测试1: 加载前的状态
        log.info("[测试1] 加载前状态检查");
        log.info("  isLoaded: " + this.loader.isLoaded());
        log.info("  getAll: " + JSON.stringify(this.loader.getAll()));

        // 测试2: 加载 CSV
        log.info("[测试2] 加载 Tower.csv");
        try {
            await this.loader.load();
            log.info("  加载成功!");
        } catch (err) {
            log.error("  加载失败!", err);
            log.info("========== 测试中止 ==========");
            return;
        }

        // 测试3: 加载后状态
        log.info("[测试3] 加载后状态检查");
        log.info("  isLoaded: " + this.loader.isLoaded());

        // 测试4: getAll - 获取全部数据
        log.info("[测试4] getAll - 获取全部塔配置");
        var allTowers = this.loader.getAll();
        log.info("  总记录数: " + allTowers.length);
        TowerCsvTest.printTowerSummary(allTowers);

        // 测试5: getById - 按 ID 查找
        log.info("[测试5] getById - 按 ID 查找");
        var testIds = [1, 5, 15, 25, 37, 999];
        for (var i = 0; i < testIds.length; i++) {
            var id = testIds[i];
            var tower = this.loader.getById(id);
            if (tower) {
                log.info("  ID=" + id + ": 找到 -> Name=\"" + tower.Name + "\", Model=\"" + tower.ModelName +
                    "\", AtkRange=" + tower.AttackRange + ", Cost=" + tower.CreateCost);
            } else {
                log.info("  ID=" + id + ": 未找到 (预期内)");
            }
        }

        // 测试6: find - 按条件查找
        log.info("[测试6] find - 按条件查找第一条");
        var firstBottle = this.loader.find(function (t) { return t.Name === "Bottle"; });
        if (firstBottle) {
            log.info("  找到第一个 Bottle: ID=" + firstBottle.Id + ", Model=" + firstBottle.ModelName);
        }

        var firstRotation = this.loader.find(function (t) { return t.IsRotation === 1; });
        if (firstRotation) {
            log.info("  找到第一个可旋转塔: ID=" + firstRotation.Id + ", Name=" + firstRotation.Name);
        }

        // 测试7: filter - 按条件过滤
        log.info("[测试7] filter - 按条件过滤");
        var bottleTowers = this.loader.filter(function (t) { return t.Name === "Bottle"; });
        log.info("  Name=\"Bottle\" 的塔数量: " + bottleTowers.length);

        var rotationTowers = this.loader.filter(function (t) { return t.IsRotation === 1; });
        log.info("  IsRotation=1 的塔数量: " + rotationTowers.length);

        var highRangeTowers = this.loader.filter(function (t) { return t.AttackRange >= 400; });
        log.info("  AttackRange>=400 的塔数量: " + highRangeTowers.length);

        // 测试8: 打印每个塔的简要信息
        log.info("[测试8] 全部塔配置清单");
        log.info("  ┌────┬────────────┬────────────────┬───────┬──────────┬──────────┬──────────┐");
        log.info("  │ ID │ Name       │ ModelName      │ Level │ AtkRange │ AtkSpace │ Cost     │");
        log.info("  ├────┼────────────┼────────────────┼───────┼──────────┼──────────┼──────────┤");
        for (var k = 0; k < allTowers.length; k++) {
            var t = allTowers[k];
            var sid = TowerCsvTest.pad(String(t.Id), 2);
            var sname = TowerCsvTest.pad(t.Name, 10);
            var smodel = TowerCsvTest.pad(t.ModelName, 14);
            var slevel = TowerCsvTest.pad(String(t.Level), 5);
            var srange = TowerCsvTest.pad(String(t.AttackRange), 8);
            var sspace = TowerCsvTest.pad(String(t.AttackSpace), 8);
            var scost = TowerCsvTest.pad(String(t.CreateCost), 8);
            log.info("  │ " + sid + " │ " + sname + " │ " + smodel + " │ " + slevel + " │ " + srange + " │ " + sspace + " │ " + scost + " │");
        }
        log.info("  └────┴────────────┴────────────────┴───────┴──────────┴──────────┴──────────┘");

        // 测试9: unload
        log.info("[测试9] unload - 卸载资源");
        this.loader.unload();
        log.info("  isLoaded: " + this.loader.isLoaded());
        log.info("  getAll 长度: " + this.loader.getAll().length);

        log.info("========== Tower.csv 加载测试完成 ==========");
    }
}
