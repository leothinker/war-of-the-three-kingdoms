import { get, lib } from "wtk"

const dynamicTranslates = {
  sxrmweiwo_rende(player, skill) {
    const targets = player.getStorage(skill)
    const info = lib.translate[`${skill}_info`]
    if (!targets?.length) {
      return info
    }
    const str = `${get.translation(targets)}${targets.length > 1 ? "中的一人" : ""}`
    return info.replace("其他角色", str)
  },
  sxrmweiwo_qingnang(player, skill) {
    const targets = player.getStorage(skill)
    const info = lib.translate[`${skill}_info`]
    if (!targets?.length) {
      return info
    }
    const str = `${get.translation(targets)}${targets.length > 1 ? "中的一人" : ""}`
    return info.replace("一名角色", str)
  },
  sxrmweiwo_longyin(player, skill) {
    const targets = player.getStorage(skill)
    const info = lib.translate[`${skill}_info`]
    if (!targets?.length) {
      return info
    }
    const str = `${get.translation(targets)}${targets.length > 1 ? "中的一人" : ""}`
    return info.replace("一名角色", str)
  },
  sxrmcongfeng(player, skill) {
    const bool = player.getStorage(skill, false)
    let yang = "与使用者各摸一张牌",
      yin = "弃置使用者两张牌"
    if (bool) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，当你使用牌指定目标或成为牌的目标后，你可以：",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
  sxrmdancui(player, skill) {
    const bool = player.getStorage(skill, false)
    const type = !bool ? get.poptip("sxrm_qidingSkill") : "锁定技"
    const forced = !bool ? "可以" : ""
    return `${type}，当你造成伤害时，你${forced}弃置两张牌（无牌则不弃），令此伤害+1。`
  },
  sxrmbiyi(player, skill) {
    const storage = player.storage[skill]
    const skills = player.getStorage("sxrmbiyi_skill")
    let yang = skills.length
        ? `${skills.map((skill) => get.poptip(skill)).join("、")}`
        : "无技能",
      yin = `${get.poptip("xiaoji")}`
    if (storage) {
      yin = `<span class='bluetext'>${yin}</span>`
    } else {
      yang = `<span class='firetext'>${yang}</span>`
    }
    const start = "转换技，",
      end = "。"
    return `${start}阳：${yang}；阴：${yin}${end}`
  },
  sxrmqishi(player, skill) {
    const bool = player.getStorage(skill, false)
    const type = !bool ? get.poptip("sxrm_qidingSkill") : "锁定技"
    const forced = !bool ? "可以" : ""
    return `${type}，结束阶段，你${forced}获得本回合弃牌堆中其他角色置入的至多五张牌，然后你跳过下个摸牌阶段。`
  },
}

export default dynamicTranslates
