import { get } from "wtk"

const translates = {
  sxrm: "蚀心入魔",

  // 蚀心入魔·疑
  sxrm_caocao: "魔曹操",
  sxrm_caocao_prefix: "魔",
  sxrmkuxin: "枯心",
  sxrmkuxin_info:
    "当你受到伤害后，你可以令所有其他角色依次展示任意张手牌，你选择获得所有角色展示的牌或一名其他角色未展示的所有手牌并展示之，若你未因此获得红桃牌，你弃置获得的牌并翻面。",
  sxrmsigu: "似故",
  sxrmsigu_info: `出牌阶段限一次，你可以令一名其他角色进行判定并对其造成两次1点伤害，期间其根据判定结果视为拥有对应的“受到伤害后”的技能。<br>判定结果对应的技能——<br>A${get.poptip("zhichi")}、2${get.poptip("olganglie")}、3${get.poptip("refankui")}、4${get.poptip("reyiji")}、5${get.poptip("oljieming")}、6${get.poptip("fangzhu")}、7${get.poptip("shibei")}、8${get.poptip("rechengxiang")}、9${get.poptip("zhiyu")}、10${get.poptip("jilei")}、J${get.poptip("benyu")}、Q${get.poptip("chouce")}、K${get.poptip("wuhun")}`,
  benyu: "贲育",
  benyu2: "贲育",
  benyu_info:
    "当你受到伤害后，你可以选择一项：1.将手牌摸至与伤害来源手牌数相同（至多摸至五张）；2.弃置大于伤害来源手牌数张牌，然后对其造成1点伤害。",

  sxrm_xunyu: "疑荀彧",
  sxrm_xunyu_prefix: "疑",
  sxrmhuice: "回策",
  sxrmhuice_info:
    "出牌阶段限一次，你可以依次进行两次拼点（目标不能相同），均结束后，赢的角色各对另一次拼点中没赢的角色造成1点伤害。",
  sxrmyihe: "异合",
  sxrmyihe_info:
    "锁定技，你的回合内各限一次，当一名角色受到伤害时，若其和伤害来源的体力值与手牌数大小关系：不同，此伤害+1；相同，双方各摸两张牌。",
  sxrmjizhi: "赍志",
  sxrmjizhi_info:
    "锁定技，其他角色不能对你使用【桃】；当你每回合首次进入濒死状态时，你回复1点体力。",

  sxrm_caopi: "疑曹丕",
  sxrm_caopi_prefix: "疑",
  sxrmzhengsi: "争嗣",
  sxrmzhengsi_info:
    "出牌阶段，你可以选择包含你在内三名有手牌的角色，令其中一名角色先展示一张手牌，其余角色再同时展示一张手牌：点数最大的角色弃置两张手牌；点数最小的角色失去1点体力。",
  sxrmchengming: "承命",
  sxrmchengming_info:
    "出牌阶段结束时，若你是本阶段〖争嗣〗角色中手牌数/体力值最大的，你可以回复2点体力/获得这些角色各一张牌。",

  sxrm_wanghou: "疑王垕",
  sxrm_wanghou_prefix: "疑",
  sxrmjugu: "聚谷",
  sxrmjugu_info:
    "准备阶段，你可以依次选择任意角色的共计至多五张牌，将这些牌按你选择的顺序正面朝上置于牌堆顶，此回合结束时，这些角色获得牌堆顶各自被放置的牌（没有则跳过），然后各摸一张牌。",

  sxrm_jianggan: "疑蒋干",
  sxrm_jianggan_prefix: "疑",
  sxrmzongheng: "纵横",
  sxrmzongheng_info:
    "准备阶段，你可以观看两名其他角色的手牌，你展示并获得其中一名角色一张手牌，然后你弃置另一名角色与展示牌类别、花色、点数相同的至多各一张手牌。",
  sxrmduibian: "对辩",
  sxrmduibian_info: `当你每回合首次受到伤害时，你可以与伤害来源${get.poptip("sxrm_compare")}并防止此伤害，然后其可以令你弃置其一张牌并公开结果：若其赢，你失去1点体力。`,

  sxrm_liubei: "疑刘备",
  sxrm_liubei_prefix: "疑",
  sxrmchengbian: "乘变",
  sxrmchengbian_info: `准备阶段和结束阶段，你可以与一名角色${get.poptip("sxrm_compare")}并视为对其使用一张【决斗】，结算中双方可以将至少一半数量的手牌当【杀】打出；结算后公开结果，拼点赢的角色将手牌摸至体力上限。`,

  sxrm_fuhuanghou: "疑伏寿",
  sxrm_fuhuanghou_prefix: "疑",
  sxrmmitu: "密图",
  sxrmmitu_info:
    "准备阶段，你可以令至多三名已受伤角色各摸一张牌并展示之，这些角色可以与你指定的另一名角色拼点，赢的角色视为对没赢的角色使用一张【杀】，然后你减X点体力上限（X为其中未用展示牌拼点的角色数）。",
  sxrmqianliu: "潜流",
  sxrmqianliu_info:
    "当与你距离1以内的角色成为【杀】的目标后，你可以观看牌堆底的四张牌并将这些牌以任意顺序置于牌堆顶或牌堆底，若这些牌花色各不同，你可以展示并获得之。",

  sxrm_huatuo: "疑华佗",
  sxrm_huatuo_prefix: "疑",
  sxrmmiehai: "灭害",
  sxrmmiehai_info:
    "你可以将两张牌当无距离和次数限制的刺【杀】使用。此牌结算结束后，于此牌结算流程中正面朝上失去过黑桃牌且已受伤的角色各摸两张牌并回复1点体力。",

  sxrm_lvboshe: "疑吕伯奢",
  sxrm_lvboshe_prefix: "疑",
  sxrmqingjun: "请君",
  sxrmqingjun_info: `每轮结束时，你可以选择一名其他角色，然后你与攻击范围内包含其的角色各摸两张牌并${get.poptip("sxrmshefu")}，其获得一个额外回合。此回合结束时，移去以此法扣置的所有“伏兵”，以此法扣置“伏兵”且此回合未受到伤害的角色各视为对其使用一张【杀】。`,
  sxrmshefu: "设伏",
  sxrmshefu_info:
    "将一张牌扣置于武将牌上（称为“伏兵”，有“伏兵”的角色可以于不为自己的角色使用手牌时移去一张颜色和类别均与此牌相同的“伏兵”以令此牌无效）",

  // 蚀心入魔·慢
  sxrm_guanyu: "魔关羽",
  sxrm_guanyu_prefix: "魔",
  sxrmhanguo: "撼国",
  sxrmhanguo_info:
    "每轮开始时，你可以扣置一名上轮未选择过的其他角色所有牌直到本轮结束，本轮内：当你对其使用的【杀】对其造成伤害后，其死亡；其可以令除其外的角色选择是否替其使用或打出【闪】且响应的角色获得你一张牌。",
  sxrmweiwo: "唯我",
  sxrmweiwo_info: `限定技，结束阶段，你可以令至多三名其他角色获得${get.poptip("rende")}、${get.poptip("qingnang")}、${get.poptip("longyin")}中各不同的一个技能（这些技能只能对你发动），然后你获得${get.poptip("old_wushen")}。`,
  old_wushen: "武神",
  old_wushen_info: "锁定技，你的红桃手牌视为无距离限制的【杀】。",

  sxrm_pangde: "慢庞德",
  sxrm_pangde_prefix: "慢",
  sxrmnuozhan: "搦战",
  sxrmnuozhan_info:
    "准备阶段，你可以摸一张牌并令一名其他角色声明一种伤害类牌，然后你选择你或其视为对对方使用伤害+1的声明牌，若此牌未对目标造成伤害，使用者失去1点体力且你可以对相同角色重复此流程。",

  sxrm_guanyinping: "慢关银屏",
  sxrm_guanyinping_prefix: "慢",
  sxrmyinmou: "姻谋",
  sxrmyinmou_info: `男性角色的结束阶段，其可以连接你与其各一张未被${get.poptip("sxrm_connect")}的手牌。当你每回合首次失去${get.poptip("sxrm_connect")}牌后，本次一同失去${get.poptip("sxrm_connect")}牌的角色各摸X张牌（X为这些角色数且至多为5）。`,
  sxrmquchi: "驱斥",
  sxrmquchi_info: `出牌阶段限一次，你可以对一名角色造成1点火焰伤害，若其有${get.poptip("sxrm_connect")}牌，你重置其连接牌，令此伤害+1。`,

  sxrm_mifang: "慢糜芳",
  sxrm_mifang_prefix: "慢",
  sxrmhuoe: "火厄",
  sxrmhuoe_info:
    "结束阶段，你可以视为对至多四名其他角色使用一张【火攻】，结算流程中若你：能造成伤害，你须造成伤害并取消其余目标；不能造成伤害，当前目标角色观看你的手牌。然后你分配因此展示的牌，若这些牌的点数之和小于13，你失去1点体力。",
  sxrmtanduo: "贪惰",
  sxrmtanduo_info:
    "锁定技，若你的手牌数大于手牌上限，你的弃牌阶段改为摸牌阶段。",

  sxrm_yujin: "慢于禁",
  sxrm_yujin_prefix: "慢",
  sxrmsuwu: "肃伍",
  sxrmsuwu_info: `准备阶段，你可以${get.poptip("sxrm_connect")}至多四名角色各一张手牌。若你有${get.poptip("sxrm_connect")}牌，有${get.poptip("sxrm_connect")}牌的角色每回合首次使用的伤害类牌不能被响应且结算结束后其摸两张牌。`,
  sxrmrenwang: "仁王",
  sxrmrenwang_info: `每回合限一次，你可以将一张${get.poptip("sxrm_connect")}牌当【桃】使用。`,

  sxrm_liufeng: "慢寇封",
  sxrm_liufeng_prefix: "慢",
  sxrmhuaibing: "怀兵",
  sxrmhuaibing_info:
    "准备阶段，你可以选择两名角色，获得这些角色各一张手牌，然后你展示所有手牌，令其中体力值较小的角色下个摸牌阶段摸牌数、出牌阶段使用【杀】的次数上限、弃牌阶段手牌上限改为其中红色牌的数量。",

  sxrm_luxun: "慢陆逊",
  sxrm_luxun_prefix: "慢",
  sxrmchanyu: "谄谀",
  sxrmchanyu_info:
    "出牌阶段限一次，你可以令一名其他角色摸其体力值张牌并与其用各自点数最小的手牌拼点，然后双方展示手牌：赢的角色可以交换双方一种颜色或类别的所有手牌。",
  sxrmchanyu_tag: "invisible",
  sxrmcongfeng: "从风",
  sxrmcongfeng_info:
    "转换技，当你使用牌指定目标或成为牌的目标后，你可以：阳：与使用者各摸一张牌；阴：弃置使用者两张牌。",

  sxrm_lvmeng: "慢吕蒙",
  sxrm_lvmeng_prefix: "慢",
  sxrmkongzhi: "空志",
  sxrmkongzhi_info:
    "锁定技，当你使用【杀】指定一名角色为唯一目标后，你获得其至多三张牌。若你已受伤，普通锦囊牌对你无效且你的基本牌均视为【闪】。",
  sxrmbizha: "鄙诈",
  sxrmbizha_info:
    "结束阶段，你可以摸一张牌并与一名角色拼点：若其没赢，其失去2点体力并令你观看其手牌，然后你可以使用其中至多两张点数小于其拼点牌的牌；若你没赢，你减1点体力上限。",

  sxrm_yanwen: "慢颜良文丑",
  sxrm_yanwen_prefix: "慢",
  sxrmhaibian: "骇变",
  sxrmhaibian_info:
    "每回合开始时，若你上回合使用过手牌，上回合最后一张黑色牌和红色牌的使用者各可以视为使用一张【决斗】。",
  sxrmqiewang: "怯亡",
  sxrmqiewang_info:
    "锁定技，当与你距离1以内的角色受到伤害后，你摸一张牌且你的手牌本回合均视为【无懈可击】。",

  // 蚀心入魔·嗔
  sxrm_zhouyu: "魔周瑜",
  sxrm_zhouyu_prefix: "魔",
  sxrmjiehuo: "劫火",
  sxrmjiehuo_info:
    "使命技，回合开始时，你可以令场上下次出现的伤害改为3点火焰伤害。失败：此伤害被造成时，若造成此伤害的角色不为你，你减1点体力上限。",
  sxrmxianger: "香饵",
  sxrmxianger_info:
    "使命技，出牌阶段限一次，你可以令一名角色于其下个结束阶段回复2点体力，期间其不能使用点数大于6的牌。失败：此回复体力流程结束后，若期间其受到的伤害值小于2，你减1点体力上限。",
  sxrmmieguo: "灭虢",
  sxrmmieguo_info:
    "使命技，额定回合结束后，你可以获得一名其他角色至多三张牌并令其选择等量的角色，然后你执行一个不能对其选择角色使用牌的额外回合。失败：此额外回合结束时，若此额外回合你未使用过牌，你减1点体力上限。",

  sxrm_zhugeliang: "嗔诸葛亮",
  sxrm_zhugeliang_prefix: "嗔",
  sxrmbingqu: "并驱",
  sxrmbingqu_info:
    "准备阶段，你可以与一名其他角色各声明一种普通锦囊牌，然后双方依次将半数手牌（向上取整）当对方声明的牌使用。",
  sxrmfanxin: "燔心",
  sxrmfanxin_info: `游戏开始时或当“燔心”角色死亡后，你可以令一名其他角色获得${get.poptip("kuangbao")}和${get.poptip("wumou")}；其回合开始时，你可以弃其至多5枚“暴怒”并摸等量的牌。`,

  sxrm_chen_caocao: "嗔曹操",
  sxrm_chen_caocao_prefix: "嗔",
  sxrmlanjiao: "揽娇",
  sxrmlanjiao_info:
    "出牌阶段对每名角色限一次，你可以展示一名其他角色两张手牌，然后你获得展示的牌；其可以于展示时失去1点体力并摸一张牌，令你重新展示。若你于一回合内因此获得过红桃和方块牌，此技能本回合失效。",

  sxrm_caoren: "嗔曹仁",
  sxrm_caoren_prefix: "嗔",
  sxrmyangbei: "佯北",
  sxrmyangbei_info:
    "准备阶段或结束阶段，你可以翻面并摸三张牌。当你使用【杀】或普通锦囊牌指定一名角色为唯一目标后，其可以弃置所有手牌，令此技能本回合失效。",
  sxrmyinfeng: "阴锋",
  sxrmyinfeng_info:
    "锁定技，当你每回合首次造成伤害后，直到你下回合开始，受伤角色的体力上限减至其体力值且其即将造成或受到的伤害均视为失去体力。",

  sxrm_zhaoyun: "嗔赵云",
  sxrm_zhaoyun_prefix: "嗔",
  sxrmzhaduo: "诈夺",
  sxrmzhaduo_info:
    "结束阶段，你可以获得两名其他角色各一张牌，视为对其中一名角色使用一张【杀】，然后另一名角色视为对你使用一张【决斗】；与其中一名角色的结算流程中，你视为拥有另一名角色的所有技能。",

  sxrm_jiahua: "嗔贾华",
  sxrm_jiahua_prefix: "嗔",
  sxrmfubei: "伏备",
  sxrmfubei_info:
    "出牌阶段限一次，你可以将手牌摸至体力上限，然后将两张牌正面朝上置于牌堆顶前十张的任意位置；一名角色回合结束时，若牌堆顶的牌正面朝上，你对其造成1点伤害。",
  visible_sxrmfubei: "刀斧手",
  sxrmdancui: "殚瘁",
  sxrmdancui_info: `${get.poptip("sxrm_qidingSkill")}，当你造成伤害时，你可以弃置两张牌（无牌则不弃），令此伤害+1。`,

  sxrm_lusu: "嗔鲁肃",
  sxrm_lusu_prefix: "嗔",
  sxrmwanli: "万利",
  sxrmwanli_info:
    "首轮开始时，你可以交给一名其他角色任意张牌；第四轮结束时，其交给你三倍数量的牌（此前其称为“万利”角色；不足则全给并失去所有技能）；若其不为“万利”角色或已死亡，摸牌阶段，你多摸三张牌。",
  sxrmlishui: "理说",
  sxrmlishui_info:
    "当你成为黑色牌的目标后，你可以摸一张牌并与“万利”角色拼点：若你赢，其交给你牌的时机提前一轮。",

  sxrm_sunshangxiang: "嗔孙尚香",
  sxrm_sunshangxiang_prefix: "嗔",
  sxrmjiaozong: "骄纵",
  sxrmjiaozong_info:
    "准备阶段或当你成为【杀】的目标后，你可以将场上的一张装备牌移动至一名角色的装备区，其本回合不能使用与之颜色相同的牌且受到的伤害+1。",
  sxrmfusui: "妇随",
  sxrmfusui_info: `限定技，出牌阶段，你可以令一名男性角色失去一个无标签技能，然后你与其获得${get.poptip("sxrmbiyi")}且防止你与其本轮受到的伤害。`,
  sxrmbiyi: "比翼",
  sxrmbiyi_info: `转换技，阳：因此次${get.poptip("sxrmfusui")}失去的技能；阴：${get.poptip("xiaoji")}。`,

  sxrm_zhangzhao: "嗔张昭",
  sxrm_zhangzhao_prefix: "嗔",
  sxrmxiezhong: "挟众",
  sxrmxiezhong_info:
    "准备阶段，你可以令场上半数角色（向上取整）依次选择一项：1.摸两张牌，失去1点体力；2.将两张牌当【杀】使用。然后你可以令另一名角色执行两次被选择次数较多的一项。",
  sxrmqishi: "乞施",
  sxrmqishi_info: `${get.poptip("sxrm_qidingSkill")}，结束阶段，你可以获得本回合弃牌堆中其他角色置入的至多五张牌，然后你跳过下个摸牌阶段。`,
}

export default translates
