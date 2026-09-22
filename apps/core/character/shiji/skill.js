import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 卞夫人
  // 抚定
  fuding: {
    audio: 2,
    round: 1,
    trigger: { global: "dying" },
    logTarget: "player",
    filter(event, player) {
      if (event.player === player) {
        return false
      }
      if (!event.player.isDying()) {
        return false
      }
      return player.countCards("he") > 0
    },
    async cost(event, trigger, player) {
      const target = trigger.player
      const max = Math.min(5, player.countCards("he"))
      event.result = await player
        .chooseToGive({
          target,
          position: "he",
          selectCard: [1, max],
          prompt: `抚定：交给${get.translation(target)}至多五张牌`,
          ai: (card) => {
            const { player, target } = get.event()
            if (!target || get.attitude(player, target) <= 0) {
              return 0
            }
            return 8 - get.value(card)
          },
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = trigger.player
      const cards = event.cards
      await player.give(cards, target, true)
      target.addTempSkill("fuding_effect")
      if (!target.storage.fuding_effect) {
        target.storage.fuding_effect = []
      }
      target.storage.fuding_effect.push({ source: player, num: cards.length })
    },
    subSkill: {
      effect: {
        charlotte: true,
        trigger: { player: "dyingAfter" },
        forceDie: true,
        silent: true,
        filter(event, player) {
          const storage = player.storage.fuding_effect
          return Array.isArray(storage) && storage.length > 0
        },
        async content(event, trigger, player) {
          const storage = player.storage.fuding_effect
          if (!storage?.length) {
            return
          }
          const entries = storage.slice()
          storage.length = 0
          for (const entry of entries) {
            if (entry.source?.isIn()) {
              await entry.source.draw(entry.num)
              await entry.source.recover()
            }
          }
          player.removeSkill("fuding_effect")
        },
      },
    },
    ai: {
      expose: 0.5,
    },
  },
  // 约俭
  yuejian: {
    mod: {
      maxHandcard(player, num) {
        return num + player.maxHp
      },
    },
    audio: 2,
    enable: ["chooseToUse", "chooseToRespond"],
    // 遍历本轮所有行动记录，检查是否使用过基本牌
    yuejian_usedThisRound(player) {
      const events = player
        .getRoundHistory("useCard")
        .concat(player.getRoundHistory("respond"))
      return events.some((evt) => get.type(evt.card, null, false) === "basic")
    },
    filter(event, player) {
      if (event.type === "wuxie") {
        return false
      }
      if (lib.skill.yuejian.yuejian_usedThisRound(player)) {
        return false
      }
      for (const name of lib.inpile) {
        if (get.type(name) !== "basic") {
          continue
        }
        if (event.filterCard({ name, isCard: true }, player, event)) {
          return true
        }
        if (name === "sha") {
          for (const nature of lib.inpile_nature) {
            if (
              event.filterCard({ name, nature, isCard: true }, player, event)
            ) {
              return true
            }
          }
        }
      }
      return false
    },
    chooseButton: {
      dialog(event, player) {
        const vcards = []
        for (const name of lib.inpile) {
          if (get.type(name) !== "basic") {
            continue
          }
          if (event.filterCard({ name, isCard: true }, player, event)) {
            vcards.push(["基本", "", name])
          }
          if (name === "sha") {
            for (const nature of lib.inpile_nature) {
              if (
                event.filterCard({ name, nature, isCard: true }, player, event)
              ) {
                vcards.push(["基本", "", name, nature])
              }
            }
          }
        }
        return ui.create.dialog("约俭", [vcards, "vcard"])
      },
      backup(links, player) {
        return {
          audio: "yuejian",
          popname: true,
          viewAs: { name: links[0][2], nature: links[0][3], isCard: true },
          filterCard: () => false,
          selectCard: -1,
        }
      },
      prompt(links, player) {
        return `视为使用${get.translation(links[0][3]) || ""}${get.translation(links[0][2])}`
      },
    },
    ai: {
      order: 4,
      save: true,
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag) {
        if (lib.skill.yuejian.yuejian_usedThisRound(player)) {
          return false
        }
      },
    },
  },
  // 王粲
  // 七哀
  spqiai: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.hasCards("he", (card) => get.type(card) !== "basic")
    },
    filterCard(card) {
      return get.type(card) !== "basic"
    },
    position: "he",
    filterTarget: lib.filter.notMe,
    delay: false,
    discard: false,
    lose: false,
    check(card) {
      const player = _status.event.player
      if (get.position(card) === "e" && card.name === "jinhe") {
        return 10
      }
      if (player.isHealthy()) {
        return 7 - get.value(card)
      }
      return 9 - get.value(card)
    },
    async content(event, trigger, player) {
      const { cards, target } = event
      await player.give(cards, target, true)
      if (!target.isIn()) {
        return
      }
      if (player.isHealthy()) {
        await player.draw(2)
        return
      }
      const result = await target
        .chooseControl({
          choiceList: [
            `令${get.translation(player)}回复1点体力`,
            `令${get.translation(player)}摸两张牌`,
          ],
        })
        .forResult()
      if (result.index === 0) {
        await player.recover()
        return
      }
      await player.draw(2)
    },
    ai: {
      order: 8,
      result: {
        player: 1,
        target(player, target) {
          if (ui.selected.cards.length) {
            const card = ui.selected.cards[0]
            const val = get.value(card, target)
            if (val < 0) {
              return -1
            }
            if (target.hasSkillTag("nogain")) {
              return 0
            }
            const useval = target.getUseValue(card)
            if (val < 1 || useval <= 0) {
              return 0.1
            }
            return Math.sqrt(useval)
          }
          return 0
        },
      },
    },
  },
  // 善檄
  spshanxi: {
    audio: 2,
    init(player) {
      game.addGlobalSkill("spshanxi_bj")
    },
    onremove(player) {
      if (
        !game.hasPlayer(
          (current) => current.hasSkill("spshanxi", null, null, false),
          true,
        )
      ) {
        game.removeGlobalSkill("spshanxi_bj")
      }
    },
    trigger: { player: "phaseUseBegin" },
    filter(event, player) {
      return game.hasPlayer(
        (current) => current !== player && !current.hasMark("spshanxi"),
      )
    },
    async cost(event, trigger, player) {
      let eff = 0
      const target = game.findPlayer(
        (current) => current !== player && current.hasMark("spshanxi"),
      )
      if (target) {
        eff = -get.attitude(player, target) / Math.sqrt(Math.max(1, target.hp))
      }
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("spshanxi"),
          prompt2: "令一名其他角色获得“檄”",
          filterTarget(card, player, target) {
            return target !== player && !target.hasMark("spshanxi")
          },
          ai(target) {
            return (
              -get.attitude(_status.event.player, target) /
                Math.sqrt(Math.max(1, target.hp)) -
              eff
            )
          },
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      for (const current of game.filterPlayer()) {
        if (current === target) {
          current.addMark("spshanxi", 1)
          continue
        }
        const num = current.countMark("spshanxi")
        if (num > 0) {
          current.removeMark("spshanxi", num)
        }
      }
    },
    marktext: "檄",
    intro: {
      name2: "檄",
      content: "已被设下索命檄文",
    },
    group: "spshanxi_suoming",
    ai: { threaten: 3.3 },
  },
  spshanxi_suoming: {
    audio: "spshanxi",
    trigger: { global: "recoverAfter" },
    forced: true,
    sourceSkill: "spshanxi",
    filter(event, player) {
      return event.player.hasMark("spshanxi") && event.player.hp > 0
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const target = trigger.player
      if (target.countCards("he") < 2) {
        await target.loseHp()
        return
      }
      const result = await target
        .chooseCard({
          prompt: `交给${get.translation(player)}两张牌，或失去1点体力`,
          selectCard: 2,
          position: "he",
          ai(card) {
            return 9 - get.value(card)
          },
        })
        .forResult()
      if (!result.bool || !result.cards?.length) {
        await target.loseHp()
        return
      }
      await target.give(result.cards, player)
    },
  },
  spshanxi_bj: {
    trigger: { player: "dieAfter" },
    sourceSkill: "spshanxi",
    filter(event, player) {
      for (const i of game.players) {
        if (i.hasSkill("spshanxi_suoming", null, null, false)) {
          return false
        }
      }
      return true
    },
    silent: true,
    forceDie: true,
    charlotte: true,
    async content(event, trigger, player) {
      game.removeGlobalSkill("spshanxi_bj")
    },
    ai: {
      effect: {
        target(card, player, target) {
          const suoming = game.findPlayer((current) =>
            current.hasSkill("spshanxi_suoming"),
          )
          if (
            suoming &&
            _status.event &&
            target === _status.event.dying &&
            target.hasMark("spshanxi")
          ) {
            if (target.countCards("he") < 2) {
              return "zerotarget"
            }
            return [1, get.attitude(target, suoming) > 0 ? 0 : -1.2]
          }
        },
      },
    },
  },
  // 费祎
  // 谏喻
  jianyu: {
    initSkill(skill) {
      if (!lib.skill[skill]) {
        lib.skill[skill] = {
          marktext: "喻",
          intro: {
            markcount: () => 1,
            content: "出牌阶段内指定另一名有“喻”的角色为目标时，其摸一张牌",
          },
        }
        lib.translate[skill] = "谏喻"
        lib.translate[`${skill}_bg`] = "喻"
      }
    },
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return (
        game.countPlayer(
          (current) => !current.hasMark(`jianyu_${player.playerid}`),
        ) > 1
      )
    },
    round: 1,
    filterTarget(card, player, target) {
      return !target.hasMark(`jianyu_${player.playerid}`)
    },
    selectTarget: 2,
    async content(event, trigger, player) {
      const target = event.target
      const skill = `jianyu_${player.playerid}`
      game.broadcastAll(lib.skill.jianyu.initSkill, skill)
      player.addTempSkill("jianyu_draw", { player: "phaseBegin" })
      target.addMark(skill, 1)
    },
    ai: {
      order: 0.1,
      result: {
        target(player, target) {
          if (!ui.selected.targets.length) {
            return target === player ? 1 : 0
          }
          if (get.attitude(player, target) < 0) {
            return (
              -1.6 *
              (1 +
                target.countCards(
                  "h",
                  (card) =>
                    target.hasValueTarget(card) &&
                    get.effect(player, card, target, target) > 0,
                ) *
                  Math.sqrt(target.countCards("h")))
            )
          }
          return (
            0.3 *
            (1 +
              target.countCards(
                "h",
                (card) =>
                  target.hasValueTarget(card) &&
                  get.effect(player, card, target, target) > 0,
              ) *
                Math.sqrt(target.countCards("h")))
          )
        },
      },
    },
    subSkill: {
      draw: {
        audio: "jianyu",
        charlotte: true,
        trigger: { global: "useCardToPlayer" },
        filter(event, player) {
          if (!event.player.isPhaseUsing()) {
            return false
          }
          return (
            event.player !== event.target &&
            event.player.hasMark(`jianyu_${player.playerid}`) &&
            event.target.hasMark(`jianyu_${player.playerid}`) &&
            event.target.isIn()
          )
        },
        forced: true,
        logTarget: "target",
        async content(event, trigger, player) {
          await trigger.target.draw()
        },
        onremove(player) {
          game.countPlayer((current) => {
            const num = current.countMark(`jianyu_${player.playerid}`)
            if (num) {
              current.removeMark(`jianyu_${player.playerid}`)
            }
          })
        },
      },
    },
  },
  // 生息
  shengxi: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      return player.hasHistory("useCard") && !player.hasHistory("sourceDamage")
    },
    async content(event, trigger, player) {
      const list = get.zhinangs()
      const { bool, links } = await player
        .chooseButton({
          createDialog: [
            `###${get.prompt("shengxi")}###获得一张智囊或摸一张牌`,
            [list, "vcard"],
            [["摸一张牌", "取消"], "tdnodes"],
          ],
          forced: true,
          ai(card) {
            if (card.link[2]) {
              if (!get.cardPile2((cardx) => cardx.name === card.link[2])) {
                return 0
              }
              return (
                (Math.random() + 1.5) *
                get.value({ name: card.link[2] }, _status.event.player)
              )
            }
            if (card.link === "摸一张牌") {
              return 1
            }
            return 0
          },
        })
        .forResult()
      if (!bool || !links?.length || links[0] === "取消") {
        return
      }
      player.logSkill("shengxi")
      if (links[0] === "摸一张牌") {
        await player.draw()
        return
      }
      const card = get.cardPile2((card) => card.name === links[0][2])
      if (card) {
        await player.gain({
          cards: [card],
          animate: "gain2",
        })
      }
    },
    group: "shengxi_zhunbei",
    subfrequent: ["zhunbei"],
    subSkill: {
      zhunbei: {
        audio: "shengxi",
        trigger: { player: "phaseZhunbeiBegin" },
        frequent: true,
        prompt2: "从额外牌堆中获得一张【调剂盐梅】",
        async content(event, trigger, player) {
          if (
            !_status.tiaojiyanmei_suits ||
            _status.tiaojiyanmei_suits.length > 0
          ) {
            if (!lib.inpile.includes("tiaojiyanmei")) {
              lib.inpile.add("tiaojiyanmei")
            }
            if (!_status.tiaojiyanmei_suits) {
              _status.tiaojiyanmei_suits = lib.suit.slice(0)
            }
            await player.gain(
              game.createCard2(
                "tiaojiyanmei",
                _status.tiaojiyanmei_suits.randomRemove(),
                6,
              ),
              "gain2",
            )
            return
          }
          const card = get.cardPile2((card) => card.name === "tiaojiyanmei")
          if (card) {
            await player.gain({
              cards: [card],
              animate: "gain2",
            })
          }
        },
      },
    },
  },
  // 陈震
  // 歃盟
  reshameng: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return game.hasPlayer((current) => current !== player)
    },
    position: "h",
    filterCard: () => true,
    selectCard: [1, 2],
    filterTarget(card, player, target) {
      return target !== player && target.countCards("h") > 0
    },
    selectTarget: 1,
    delay: false,
    discard: false,
    lose: false,
    check(card) {
      return 7 - get.value(card)
    },
    async content(event, trigger, player) {
      const { cards: playerCards, target } = event
      const playerShown = (playerCards || []).slice()
      const targetShown = []

      if (playerShown.length) {
        await player.showCards(
          playerShown,
          `${get.translation(player)}发动了【歃盟】`,
        )
      }

      const targetHand = target.countCards("h")
      if (targetHand > 0) {
        const max = Math.min(2, targetHand)
        const result = await target
          .chooseCard({
            position: "h",
            selectCard: [1, max],
            prompt: "歃盟：展示至多两张手牌",
            ai(card) {
              const evt = get.event()
              if (get.attitude(evt.player, player) <= 0) {
                return 0
              }
              return 6 - get.value(card)
            },
          })
          .forResult()
        if (result?.bool && result.cards?.length) {
          targetShown.addArray(result.cards)
          await target.showCards(
            targetShown,
            `${get.translation(target)}展示的牌`,
          )
        }
      }

      const all = [...playerShown, ...targetShown]
      if (!all.length) {
        return
      }

      const confirm = await player
        .chooseBool(
          `是否弃置${get.translation(target)}与你展示的${all.length}张牌？弃置后你摸X张（X为其中花色数），令${get.translation(target)}摸Y张（Y为其中类别数）`,
        )
        .forResult()
      if (!confirm?.bool) {
        return
      }

      await game.cardsDiscard(all)

      const suits = new Set()
      const types = new Set()
      for (const card of all) {
        const suit = get.suit(card)
        if (suit) {
          suits.add(suit)
        }
        const type = get.type2(card)
        if (type) {
          types.add(type)
        }
      }
      const X = suits.size
      const Y = types.size
      if (X > 0) {
        await player.draw(X)
      }
      if (Y > 0) {
        await target.draw(Y)
      }
    },
    ai: {
      order: 6,
      result: {
        target(player, target) {
          if (get.attitude(player, target) <= 0) {
            return 0
          }
          return 1
        },
      },
    },
  },
}

export default skills
