import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 刘备
  // 仁德
  oldrende: {
    audio: "rerende",
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterTarget: lib.filter.notMe,
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    position: "h",
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      const { cards, target, targets } = event
      const assignedTargets = targets.slice(0)
      let result

      event.num = cards.length
      event.targets = assignedTargets

      await player.give(cards, target)
      if (event.num > 1) {
        await player.recover()
      }

      while (
        player.countCards("h") > 0 &&
        game.hasPlayer(
          (current) => current !== player && !assignedTargets.includes(current),
        )
      ) {
        result = await player
          .chooseCardTarget({
            prompt: "是否继续将任意张手牌交给其他角色",
            prompt2: "操作提示：请先选择任意张手牌，然后再选择一名其他角色。",
            filterCard: true,
            selectCard: [1, Infinity],
            filterTarget(card, player, target) {
              return target !== player && !assignedTargets.includes(target)
            },
          })
          .forResult()

        if (!result.bool) {
          break
        }

        const currentTarget = result.targets[0]
        const selectedCards = result.cards

        player.line(currentTarget, "green")
        await player.give(selectedCards, currentTarget)
        assignedTargets.push(currentTarget)

        const prevNum = event.num
        event.num += selectedCards.length

        if (prevNum < 2 && event.num > 1) {
          await player.recover()
        }
      }
    },
  },
  // 黄月英
  // 集智
  oldjizhi: {
    audio: "rejizhi",
    trigger: { player: "useCard" },
    frequent: true,
    filter(event, player) {
      return get.type(event.card, "trick") === "trick" && event.card.isCard
    },
    async content(event, trigger, player) {
      let result

      // step 0
      const card = get.cards()[0]
      await game.cardsGotoOrdering(card)
      await player.showCards(card, `${get.translation(player)}发动了【集智】`)

      if (get.type(card) !== "basic") {
        await player.gain(card, "gain2")
        return
      }
      if (!player.countCards("h")) {
        return
      }

      // step 1
      result = await player
        .chooseCard(
          "h",
          `是否将一张手牌与${get.translation(card)}交换？`,
          `若选择「取消」，则将${get.translation(card)}置入弃牌堆。`,
        )
        .forResult()

      // step 2
      if (result.bool && result.cards?.length) {
        const handcard = result.cards[0]
        player.$throw(handcard, 1000)
        game.log(player, "将", handcard, "置于牌堆顶")
        await player.lose(handcard, ui.cardPile, "visible", "insert")
        await player.gain(card, "gain2")
      }
    },
  },
  // 奇才
  oldqicai: {
    mod: {
      targetInRange(card, player, target, now) {
        var type = get.type(card)
        if (type === "trick" || type === "delay") {
          return true
        }
      },
      canBeDiscarded(card, player, target) {
        if (
          get.position(card) === "e" &&
          !get
            .subtypes(card)
            .some((subtype) =>
              ["equip3", "equip4", "equip6"].includes(subtype),
            ) &&
          player !== target
        ) {
          return false
        }
      },
    },
  },
  // 袁术
  // 妄尊
  wangzun: {
    audio: 2,
    trigger: { global: "phaseZhunbeiBegin" },
    check(event, player) {
      return event.player === player || get.attitude(player, event.player) <= 0
    },
    filter(event, player) {
      return event.player.isZhu
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await player.draw()
      const target = trigger.player
      target.addTempSkill("wangzun2")
      target.addMark("wangzun2", 1, false)
    },
    ai: {
      expose: 0.2,
    },
  },
  wangzun2: {
    onremove: true,
    mod: {
      maxHandcard(player, num) {
        return num - player.countMark("wangzun2")
      },
    },
    intro: { content: "手牌上限-#" },
  },
  // 同疾
  tongji: {
    global: "tongji_disable",
    audio: 2,
    trigger: { global: "useCard1" },
    forced: true,
    filter(event, player) {
      return (
        event.targets.includes(player) &&
        player !== event.player &&
        event.card.name === "sha" &&
        player.hp < player.countCards("h")
      )
    },
    content() {},
    ai: { neg: true },
    gainable: true,
    subSkill: {
      disable: {
        mod: {
          targetEnabled(card, player, target) {
            if (card.name === "sha") {
              if (player.hasSkill("tongji")) {
                return
              }
              if (target.hasSkill("tongji")) {
                return
              }
              if (
                game.hasPlayer(
                  (current) =>
                    current.hasSkill("tongji") &&
                    current.hp < current.countCards("h") &&
                    player.inRange(current),
                )
              ) {
                return false
              }
            }
          },
        },
      },
    },
  },
  // 神曹操
  // 归心
  oldguixin: {
    audio: "guixin",
    forbid: ["guozhan"],
    init() {
      if (!_status.oldguixin) {
        _status.oldguixin = []
        if (!_status.characterlist) {
          game.initCharacterList()
        }
        for (const name of _status.characterlist) {
          _status.oldguixin.addArray(
            get.character(name, 3).filter((skill) => {
              const info = get.info(skill)
              return info?.zhuSkill && !info.ai?.combo
            }),
          )
        }
      }
    },
    trigger: { player: "phaseEnd" },
    filter(event, player) {
      return (
        !_status.oldguixin.some(
          (skill) => !player.hasSkill(skill, null, false, false),
        ) || game.hasPlayer((current) => current !== player)
      )
    },
    direct: true,
    async content(event, trigger, player) {
      const controls = ["获得技能", "修改势力"]
      if (
        !_status.oldguixin.some(
          (skill) => !player.hasSkill(skill, null, false, false),
        )
      ) {
        controls.shift()
      }
      if (!game.hasPlayer((current) => current !== player)) {
        controls.shift()
      }
      if (!controls.length) {
        return
      }
      controls.push("cancel2")
      const result = await player
        .chooseControl({
          controls,
          prompt: get.prompt2(event.name),
          ai() {
            return _status.event.controls.length === 3 ? "获得技能" : "cancel2"
          },
        })
        .forResult()
      if (result?.control === "cancel2") {
        return
      }
      const control = result.control
      if (control === "获得技能") {
        const skills = _status.oldguixin.filter(
          (skill) => !player.hasSkill(skill, null, false, false),
        )
        if (skills.length) {
          const list = skills.map((skill) => [
            skill,
            '<div class="popup text" style="width:calc(100% - 10px);display:inline-block"><div class="skill">' +
              (() => {
                let str = get.translation(skill)
                if (!lib.skill[skill]?.nobracket) {
                  str = `【${str}】`
                }
                return str
              })() +
              "</div><div>" +
              lib.translate[`${skill}_info`] +
              "</div></div>",
          ])
          const result = await player
            .chooseButton({
              createDialog: ["归心：选择获得一个主公技", [list, "textbutton"]],
              forced: true,
              ai() {
                return 1 + Math.random()
              },
            })
            .forResult()
          if (result?.bool) {
            player.logSkill(event.name)
            await player.addSkill(result.links)
          }
        }
      } else if (
        control === "修改势力" &&
        game.hasPlayer((current) => current !== player)
      ) {
        const result = await player
          .chooseTarget({
            prompt: "请选择【归心】的目标",
            prompt2: "更改一名其他角色的势力",
            filterTarget: lib.filter.notMe,
            forced: true,
            ai() {
              return 1 + Math.random()
            },
          })
          .forResult()
        if (result?.bool) {
          const target = result.targets[0]
          player.logSkill(event.name, target)
          const groups = lib.group.filter(
            (group) => group !== "shen" && group !== target.group,
          )
          if (groups.length) {
            const result = await player
              .chooseControl({
                prompt: `请选择${get.translation(target)}要变更的势力`,
                controls: groups,
                ai() {
                  return get.event().controls.randomGet()
                },
              })
              .forResult()
            if (result?.control) {
              player.popup(get.translation(`${result.control}2`))
              await target.changeGroup(result.control)
            }
          }
        }
      }
    },
  },
  // 界关羽
  // 义绝
  oldyijue: {
    audio: "yijue",
    enable: "phaseUse",
    usable: 1,
    filterTarget(card, player, target) {
      return player !== target && target.countCards("h")
    },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      let result

      // step 0
      result = await player
        .chooseToCompare(target)
        .set("small", true)
        .forResult()

      // step 1
      if (result.bool) {
        if (!target.hasSkill("fengyin")) {
          target.addTempSkill("fengyin")
        }
        target.addTempSkill("oldyijue2")
        return
      }
      if (target.hp < target.maxHp) {
        result = await player
          .chooseBool("是否令其回复1点体力？")
          .set("ai", () => get.recoverEffect(target, player, player) > 0)
          .forResult()
      } else {
        return
      }

      // step 2
      if (result.bool) {
        await target.recover()
      }
    },
    ai: {
      result: {
        target(player, target) {
          var hs = player.getCards("h")
          if (hs.length < 3) {
            return 0
          }
          var bool = false
          for (var i = 0; i < hs.length; i++) {
            if (get.number(hs[i]) >= 9 && get.value(hs[i]) < 7) {
              bool = true
              break
            }
          }
          if (!bool) {
            return 0
          }
          if (
            target.countCards("h") > target.hp + 1 &&
            get.recoverEffect(target) > 0
          ) {
            return 1
          }
          if (
            player.canUse("sha", target) &&
            (player.countCards("h", "sha") ||
              player.countCards("he", { color: "red" }))
          ) {
            return -2
          }
          return -0.5
        },
      },
      order: 9,
    },
  },
  oldyijue2: {
    charlotte: true,
    mark: true,
    mod: {
      cardEnabled2(card) {
        if (get.position(card) === "h") {
          return false
        }
      },
    },
    intro: { content: "不能使用或打出手牌" },
  },
  // 界张飞
  // 替身
  oldtishen: {
    audio: "tishen",
    skillAnimation: true,
    animationColor: "soil",
    limited: true,
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      if (typeof player.storage.oldtishen2 === "number") {
        return player.hp < player.storage.oldtishen2
      }
      return false
    },
    check(event, player) {
      if (player.hp <= 1) {
        return true
      }
      return player.hp < player.storage.oldtishen2 - 1
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const next = await player.recover(player.storage.oldtishen2 - player.hp)
      await player.draw(next.num)
    },
    intro: {
      mark(dialog, content, player) {
        if (player.storage.oldtishen) {
          return
        }
        if (typeof player.storage.oldtishen2 !== "number") {
          return "上回合结束后的体力：无"
        }
        return `上回合结束后的体力：${player.storage.oldtishen2}`
      },
      content: "limited",
    },
    group: ["oldtishen2"],
  },
  oldtishen2: {
    trigger: { player: "phaseJieshuBegin" },
    priority: -10,
    silent: true,
    sourceSkill: "oldtishen",
    async content(event, trigger, player) {
      player.storage.oldtishen2 = player.hp
      game.broadcast((pl) => {
        pl.storage.oldtishen2 = pl.hp
      }, player)
      game.addVideo("storage", player, [
        "oldtishen2",
        player.storage.oldtishen2,
      ])
    },
    intro: {
      content(storage, player) {
        if (player.storage.oldtishen) {
          return
        }
        return `上回合结束后的体力：${storage}`
      },
    },
  },
  // 界赵云
  // 涯角
  oldyajiao: {
    audio: "yajiao",
    trigger: { player: ["respond", "useCard"] },
    frequent: true,
    filter(event, player) {
      return (
        player !== _status.currentPhase && get.itemtype(event.cards) === "cards"
      )
    },
    async content(event, trigger, player) {
      let result

      // step 0
      event.card = get.cards()[0]
      game.broadcast((card) => {
        ui.arena.classList.add("thrownhighlight")
        card
          .copy("thrown", "center", "thrownhighlight", ui.arena)
          .addTempClass("start")
      }, event.card)
      event.node = event.card
        .copy("thrown", "center", "thrownhighlight", ui.arena)
        .addTempClass("start")
      ui.arena.classList.add("thrownhighlight")
      game.addVideo("thrownhighlight1")
      game.addVideo("centernode", null, get.cardInfo(event.card))

      if (get.type(event.card, "trick") === get.type(trigger.card, "trick")) {
        result = await player
          .chooseTarget("将此牌交给一名角色")
          .set("ai", (target) => {
            var att = get.attitude(_status.event.player, target)
            if (_status.event.du) {
              if (target.hasSkillTag("nodu")) {
                return 0
              }
              return -att
            }
            if (att > 0) {
              return att + Math.max(0, 5 - target.countCards("h"))
            }
            return att
          })
          .set("du", event.card.name === "du")
          .forResult()
      } else {
        result = await player
          .chooseBool(`是否将${get.translation(event.card)}置入弃牌堆？`)
          .forResult()
        event.disbool = true
      }

      await game.delay(2)

      // step 1
      if (event.disbool) {
        if (!result.bool) {
          game.log(player, "展示了", event.card)
          ui.cardPile.insertBefore(event.card, ui.cardPile.firstChild)
        } else {
          game.log(player, "展示并弃掉了", event.card)
          await event.card.discard()
        }
        game.addVideo("deletenode", player, [get.cardInfo(event.node)])
        event.node.delete()
        game.broadcast((card) => {
          ui.arena.classList.remove("thrownhighlight")
          if (card.clone) {
            card.clone.delete()
          }
        }, event.card)
      } else if (result.targets) {
        player.line(result.targets, "green")
        await result.targets[0].gain(event.card, "log")
        event.node.moveDelete(result.targets[0])
        game.addVideo("gain2", result.targets[0], [get.cardInfo(event.node)])
        game.broadcast(
          (card, target) => {
            ui.arena.classList.remove("thrownhighlight")
            if (card.clone) {
              card.clone.moveDelete(target)
            }
          },
          event.card,
          result.targets[0],
        )
      } else {
        game.log(player, "展示了", event.card)
        ui.cardPile.insertBefore(event.card, ui.cardPile.firstChild)
        game.addVideo("deletenode", player, [get.cardInfo(event.node)])
        event.node.delete()
        game.broadcast((card) => {
          ui.arena.classList.remove("thrownhighlight")
          if (card.clone) {
            card.clone.delete()
          }
        }, event.card)
      }
      game.addVideo("thrownhighlight2")
      ui.arena.classList.remove("thrownhighlight")
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "respond") && target.countCards("h") > 1) {
            return [1, 0.2]
          }
        },
      },
    },
  },
  // 徐庶
  // 诛害
  zhuhai: {
    audio: 2,
    trigger: { global: "phaseJieshuBegin" },
    direct: true,
    filter(event, player) {
      return (
        event.player.isIn() &&
        event.player.getStat("damage") &&
        lib.filter.targetEnabled({ name: "sha" }, player, event.player) &&
        (player.hasSha() || (_status.connectMode && player.countCards("h") > 0))
      )
    },
    clearTime: true,
    async content(event, trigger, player) {
      await player
        .chooseToUse(
          function (card, player, event) {
            if (get.name(card) !== "sha") {
              return false
            }
            return lib.filter.filterCard.apply(this, arguments)
          },
          `诛害：是否对${get.translation(trigger.player)}使用一张【杀】？`,
        )
        .set("logSkill", "zhuhai")
        .set("complexSelect", true)
        .set("complexTarget", true)
        .set("filterTarget", function (card, player, target) {
          if (
            target !== _status.event.sourcex &&
            !ui.selected.targets.includes(_status.event.sourcex)
          ) {
            return false
          }
          return lib.filter.targetEnabled.apply(this, arguments)
        })
        .set("sourcex", trigger.player)
    },
  },
  // 潜心
  qianxin: {
    skillAnimation: true,
    animationColor: "orange",
    audio: 2,
    juexingji: true,
    trigger: { source: "damageSource" },
    forced: true,
    derivation: "jianyan",
    filter(event, player) {
      return player.hp < player.maxHp
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.addSkills("jianyan")
      await player.loseMaxHp()
    },
  },
  // 荐言
  jianyan: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    delay: false,
    filter(event, player) {
      return game.hasPlayer((current) => current.hasSex("male"))
    },
    async content(event, trigger, player) {
      let result

      // step 0
      result = await player
        .chooseControl(["red", "black", "basic", "trick", "equip"])
        .set("ai", () => {
          var player = _status.event.player
          if (!player.hasShan()) {
            return "basic"
          }
          if (player.countCards("e") <= 1) {
            return "equip"
          }
          if (player.countCards("h") > 2) {
            return "trick"
          }
          return "red"
        })
        .forResult()

      // step 1
      while (true) {
        const next = get.cards()[0]
        await player.showCards(
          next,
          `${get.translation(player)}发动了【荐言】`,
          true,
        )
        if (
          get.color(next) === result.control ||
          get.type(next, "trick") === result.control
        ) {
          event.card = next
          break
        }
        if (
          !ui.cardPile.hasChildNodes() &&
          !get.discardPile(
            (card) =>
              get.color(card) === result.control ||
              get.type(card, "trick") === result.control,
          )
        ) {
          return
        }
      }
      await player.showCards([event.card])

      // step 2
      result = await player
        .chooseTarget(
          true,
          `令一名男性角色获得${get.translation(event.card)}`,
          (card, player, target) => target.hasSex("male"),
        )
        .set("ai", (target) => {
          var att = get.attitude(_status.event.player, target)
          if (_status.event.neg) {
            return -att
          }
          return att
        })
        .set("neg", get.value(event.card, player, "raw") < 0)
        .forResult()

      // step 3
      player.line(result.targets, "green")
      await result.targets[0].gain(event.card, "gain2")
    },
    ai: {
      order: 9,
      result: {
        player(player) {
          if (
            game.hasPlayer(
              (current) =>
                current.hasSex("male") && get.attitude(player, current) > 0,
            )
          ) {
            return 2
          }
          return 0
        },
      },
      threaten: 1.2,
    },
  },
  // 界曹操
  // 奸雄
  oldjianxiong: {
    audio: "rejianxiong",
    trigger: { player: "damageEnd" },
    async cost(event, trigger, player) {
      const list = ["摸牌"]
      if (
        get.itemtype(trigger.cards) === "cards" &&
        trigger.cards.filterInD().length
      ) {
        list.push("拿牌")
      }
      list.push("cancel2")
      const { control } = await player
        .chooseControl(list)
        .set("prompt", get.prompt2(event.skill))
        .set("ai", () => {
          const player = get.event().player,
            trigger = get.event().getTrigger()
          const cards = trigger.cards ? trigger.cards.filterInD() : []
          if (get.event().controls.includes("拿牌")) {
            if (
              cards.reduce((sum, card) => {
                return sum + (card.name === "du" ? -1 : 1)
              }, 0) > 1 ||
              player.getUseValue(cards[0]) > 6
            ) {
              return "拿牌"
            }
          }
          return "摸牌"
        })
        .forResult()
      event.result = { bool: control !== "cancel2", cost_data: control }
    },
    async content(event, trigger, player) {
      if (event.cost_data === "摸牌") {
        await player.draw()
      } else {
        await player.gain(trigger.cards.filterInD(), "gain2")
      }
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -1]
          }
          if (get.tag(card, "damage") && player !== target) {
            return [1, 0.6]
          }
        },
      },
    },
  },
  // 界夏侯惇
  // 清俭
  oldqingjian: {
    audio: "qingjian",
    trigger: { player: "gainAfter", global: "loseAsyncAfter" },
    direct: true,
    filter(event, player) {
      var evt = event.getParent("phaseDraw")
      if (evt && evt.player === player) {
        return false
      }
      return event.getg(player).length > 0
    },
    async content(event, trigger, player) {
      let result
      // step 0
      event.cards = trigger.getg(player)
      // step 1..n
      while (true) {
        result = await player
          .chooseCardTarget({
            filterCard(card) {
              return _status.event.getParent().cards.includes(card)
            },
            selectCard: [1, event.cards.length],
            filterTarget(card, player, target) {
              return player !== target
            },
            allowChooseAll: true,
            ai1(card) {
              if (ui.selected.cards.length > 0) {
                return -1
              }
              if (card.name === "du") {
                return 20
              }
              return (
                _status.event.player.countCards("h") - _status.event.player.hp
              )
            },
            ai2(target) {
              var att = get.attitude(_status.event.player, target)
              if (
                ui.selected.cards.length &&
                ui.selected.cards[0].name === "du"
              ) {
                if (target.hasSkillTag("nodu")) {
                  return 0
                }
                return 1 - att
              }
              if (
                target.countCards("h") > _status.event.player.countCards("h")
              ) {
                return 0
              }
              return att - 4
            },
            prompt: "将其中任意张牌交给其他角色",
          })
          .forResult()

        // step 2
        if (result.bool) {
          player.logSkill("oldqingjian", result.targets)
          await player.give(result.cards, result.targets[0])
          for (var i = 0; i < result.cards.length; i++) {
            event.cards.remove(result.cards[i])
          }
          if (event.cards.length) {
            continue
          }
          break
        }
        break
      }
    },
    ai: {
      expose: 0.3,
    },
  },
  // 界张辽
  // 突袭
  oldtuxi: {
    audio: "retuxi",
    trigger: { player: "phaseDrawBegin2" },
    direct: true,
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      // step 0
      const result = await player
        .chooseTarget(
          get.prompt("oldtuxi"),
          [1, trigger.num],
          (card, player, target) =>
            target.countCards("h") > 0 &&
            player !== target &&
            target.countCards("h") >= player.countCards("h"),
          (target) => {
            var att = get.attitude(_status.event.player, target)
            if (target.hasSkill("tuntian")) {
              return att / 10
            }
            return 1 - att
          },
        )
        .forResult()
      // step 1
      if (result.bool) {
        player.logSkill("oldtuxi", result.targets)
        await player.gainMultiple(result.targets)
        trigger.num -= result.targets.length
      } else {
        event.finish()
        return
      }
      // step 2
      if (trigger.num <= 0) {
        await game.delay()
      }
    },
    ai: {
      threaten: 1.6,
      expose: 0.2,
    },
  },
  // 界许褚
  // 裸衣
  oldluoyi: {
    audio: "reluoyi",
    trigger: { player: "phaseDrawBegin1" },
    filter(event, player) {
      return !event.numFixed
    },
    check(event, player) {
      if (player.countCards("h", "sha")) {
        return true
      }
      return Math.random() < 0.5
    },
    async content(event, trigger, player) {
      // step 0
      player.addTempSkill("reluoyi2", { player: "phaseBefore" })
      trigger.changeToZero()

      // step 1
      event.cards = get.cards(3)
      await player.showCards(event.cards, "裸衣")

      // step 2
      const cards = event.cards
      for (let i = 0; i < cards.length; i++) {
        if (
          get.type(cards[i]) !== "basic" &&
          cards[i].name !== "juedou" &&
          (get.type(cards[i]) !== "equip" || get.subtype(cards[i]) !== "equip1")
        ) {
          cards[i].discard()
          cards.splice(i--, 1)
        }
      }
      await player.gain(cards, "gain2")
    },
  },
  // 界郭嘉
  // 遗计
  oldyiji: {
    audio: "reyiji",
    trigger: { player: "damageEnd" },
    frequent: true,
    filter(event) {
      return event.num > 0
    },
    async content(event, trigger, player) {
      // initialize counters (mimic step 0)
      event.num = 1
      event.count = 1

      let result
      // repeat for trigger.num times (event.count starts at 1)
      while (event.count <= trigger.num) {
        // step 1: draw/gain two cards
        await player.gain(get.cards(2))
        player.$draw(2)

        // step 2/3: allow up to two give-aways per iteration
        while (true) {
          result = await player
            .chooseCardTarget({
              filterCard: true,
              selectCard: [1, 2],
              filterTarget(card, player, target) {
                return player !== target && target !== event.temp
              },
              ai1(card) {
                if (ui.selected.cards.length > 0) return -1
                if (card.name === "du") return 20
                return (
                  _status.event.player.countCards("h") - _status.event.player.hp
                )
              },
              ai2(target) {
                var att = get.attitude(_status.event.player, target)
                if (
                  ui.selected.cards.length &&
                  ui.selected.cards[0].name === "du"
                ) {
                  if (target.hasSkillTag("nodu")) return 0
                  return 1 - att
                }
                return att - 4
              },
              prompt: "在至多两名其他角色的武将牌旁分别扣置至多两张手牌",
            })
            .forResult()

          if (result?.bool) {
            // move chosen cards to storage
            await player.lose(result.cards, ui.special, "toStorage")
            const tar = result.targets[0]
            if (tar.hasSkill("oldyiji2")) {
              tar.storage.oldyiji2 = tar.storage.oldyiji2.concat(result.cards)
            } else {
              tar.addSkill("oldyiji2")
              tar.storage.oldyiji2 = result.cards
            }
            player.$give(result.cards.length, tar, false)
            player.line(result.targets, "green")
            game.addVideo("storage", tar, [
              "oldyiji2",
              get.cardsInfo(tar.storage.oldyiji2),
              "cards",
            ])

            // if this is the first give in this iteration, allow a second give (to a different target)
            if (event.num === 1) {
              event.temp = tar
              event.num++
              continue // go back to chooseCardTarget (step 2)
            }

            // finished gives for this iteration -> prepare next iteration (if any)
            delete event.temp
            event.num = 1
            event.count++
            break
          }
          // player declined to give; if more iterations remain, continue loop; otherwise finish
          if (event.count < trigger.num) {
            delete event.temp
            event.num = 1
            event.count++
            break
          }
          return
        }

        // loop continues while(event.count <= trigger.num)
      }
    },
    ai: {
      maixie: true,
      maixie_hp: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (player.hasSkillTag("jueqing", false, target)) {
              return [1, -2]
            }
            if (!target.hasFriend()) {
              return
            }
            var num = 1
            if (get.attitude(player, target) > 0) {
              if (player.needsToDiscard()) {
                num = 0.7
              } else {
                num = 0.5
              }
            }
            if (player.hp >= 4) {
              return [1, num * 2]
            }
            if (target.hp === 3) {
              return [1, num * 1.5]
            }
            if (target.hp === 2) {
              return [1, num * 0.5]
            }
          }
        },
      },
      threaten: 0.6,
    },
  },
  oldyiji2: {
    trigger: { player: "phaseDrawBegin" },
    forced: true,
    mark: true,
    popup: "遗计获得牌",
    audio: false,
    sourceSkill: "oldyiji",
    async content(event, trigger, player) {
      await player.$draw(player.storage.oldyiji2.length)
      await player.gain(player.storage.oldyiji2, "fromStorage")
      delete player.storage.oldyiji2
      player.removeSkill("oldyiji2")
      await game.delay()
    },
    intro: {
      content: "cardCount",
    },
  },
  // 界吕布
  // 利驭
  oldliyu: {
    audio: "liyu",
    trigger: { source: "damageSource" },
    forced: true,
    filter(event, player) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.card &&
        event.card.name === "sha" &&
        event.player.isIn() &&
        event.player.countGainableCards(player, "he") > 0
      )
    },
    check() {
      return false
    },
    async content(event, trigger, player) {
      // step 0
      const result = await trigger.player
        .chooseTarget((card, player, target) => {
          var evt = _status.event.getParent()
          return (
            evt.player.canUse({ name: "juedou" }, target) &&
            target !== _status.event.player
          )
        }, get.prompt("oldliyu"))
        .set("ai", (target) => {
          var evt = _status.event.getParent()
          return (
            get.effect(
              target,
              { name: "juedou" },
              evt.player,
              _status.event.player,
            ) - 2
          )
        })
        .forResult()

      // step 1
      if (result.bool) {
        await player.gainPlayerCard(trigger.player, "he", true)
        event.target = result.targets[0]
        trigger.player.line(player, "green")
      } else {
        return
      }

      // step 2
      if (event.target) {
        await player.useCard(
          { name: "juedou", isCard: true },
          event.target,
          "noai",
        )
      }
    },
    ai: {
      halfneg: true,
    },
  },
  // 旧于禁
  // 毅重
  yizhong: {
    trigger: { target: "shaBefore" },
    forced: true,
    audio: 2,
    filter(event, player) {
      if (!player.hasEmptySlot(2)) {
        return false
      }
      return event.card.name === "sha" && get.color(event.card) === "black"
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (player === target && get.subtypes(card).includes("equip2")) {
            if (get.equipValue(card) <= 8) {
              return 0
            }
          }
          if (!player.hasEmptySlot(2)) {
            return
          }
          if (card.name === "sha" && get.color(card) === "black") {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 旧法正
  // 恩怨
  oldenyuan: {
    audio: 4,
    locked: true,
    group: ["oldenyuan1", "oldenyuan2"],
  },
  oldenyuan1: {
    audio: ["oldenyuan3.mp3", "oldenyuan4.mp3"],
    trigger: { player: "damageEnd" },
    forced: true,
    sourceSkill: "oldenyuan",
    filter(event, player) {
      return event.source?.isIn() && event.source !== player && event.num > 0
    },
    logTarget: "source",
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      const result = await trigger.source
        .chooseToGive(
          `恩怨：交给${get.translation(player)}一张红桃手牌，或失去1点体力`,
          (card, player) => {
            return get.suit(card) === "heart"
          },
          "h",
          player,
        )
        .set("ai", (card) => {
          const { player, target } = get.event()
          if (get.effect(player, { name: "losehp" }, player, player) >= 0) {
            return 0
          }
          if (get.attitude(target, player) > 0) {
            return 11 - get.value(card)
          }
          return 7 - get.value(card)
        })
        .forResult()
      if (!result?.bool) {
        await trigger.source.loseHp()
      }
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return [1, -2]
          }
          if (!target.hasFriend()) {
            return
          }
          if (get.tag(card, "damage")) {
            return [1, 0, 0, -1]
          }
        },
      },
    },
  },
  oldenyuan2: {
    audio: ["oldenyuan1.mp3", "oldenyuan2.mp3"],
    trigger: { player: "recoverEnd" },
    forced: true,
    logTarget: "source",
    sourceSkill: "oldenyuan",
    filter(event, player) {
      return event.source?.isIn() && event.source !== player && event.num > 0
    },
    getIndex: (event) => event.num,
    async content(event, trigger, player) {
      await trigger.source.draw()
    },
  },
  // 眩惑
  oldxuanhuo: {
    audio: 2,
    usable: 1,
    enable: "phaseUse",
    discard: false,
    lose: false,
    delay: 0,
    filter(event, player) {
      return player.countCards("he", { suit: "heart" })
    },
    filterCard(card) {
      return get.suit(card) === "heart"
    },
    filterTarget(card, player, target) {
      if (game.countPlayer() === 2) {
        return false
      }
      return player !== target
    },
    check(card) {
      var player = get.owner(card)
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (players[i] !== player && get.attitude(player, players[i]) > 3) {
          break
        }
      }
      if (i === players.length) {
        return -1
      }
      return 5 - get.value(card)
    },
    async content(event, trigger, player) {
      const { cards, target } = event

      await player.give(cards, target)

      let result = await player
        .gainPlayerCard({
          target,
          position: "he",
          forced: true,
        })
        .forResult()

      if (!result.bool || !result.cards?.length) {
        return
      }

      const card = result.cards[0]
      if (!player.hasCard((cardx) => cardx === card, "h")) {
        return
      }

      result = await player
        .chooseTarget({
          prompt: `将${get.translation(card)}交给另一名其他角色`,
          filterTarget(card, player, target) {
            return target !== get.event().sourcex && target !== player
          },
          ai(target) {
            return get.attitude(get.event().player, target)
          },
        })
        .set("sourcex", target)
        .forResult()

      if (result.bool && result.targets?.length) {
        await player.give(card, result.targets[0], "give")
        await game.delay()
      }
    },
    ai: {
      result: {
        target: -0.5,
      },
      basic: {
        order: 9,
      },
    },
  },
  // 旧马谡
  // 心战
  xinzhan: {
    audio: 2,
    enable: "phaseUse",
    filter(event, player) {
      return player.countCards("h") > player.maxHp
    },
    usable: 1,
    async content(event, trigger, player) {
      const cards = get.cards(3)
      const result = await player
        .chooseCardButton({
          prompt: "选择获得的红桃牌",
          cards,
          filter(button) {
            return get.suit(button.link) === "heart"
          },
          select: [1, Infinity],
        })
        .forResult()
      if (result.bool) {
        await player.gain({
          cards: result.links,
          animate: "draw",
        })
        cards.removeArray(result.links)
      }
      for (const card of cards.slice(0).reverse()) {
        ui.cardPile.insertBefore(card, ui.cardPile.firstChild)
      }
    },
    ai: {
      order: 11,
      result: {
        player: 1,
      },
    },
  },
  // 挥泪
  huilei: {
    audio: 2,
    trigger: { player: "die" },
    forced: true,
    forceDie: true,
    filter(event) {
      return event.source?.isIn()
    },
    logTarget: "source",
    skillAnimation: true,
    animationColor: "thunder",
    async content(event, trigger, player) {
      trigger.source.discard(trigger.source.getCards("he"))
    },
    ai: {
      threaten: 0.7,
    },
  },
  // 旧马谡
  // 无言
  oldwuyan: {
    audio: 2,
    trigger: { target: "useCardToBefore", player: "useCardToBefore" },
    forced: true,
    check(event, player) {
      return get.effect(event.target, event.card, event.player, player) < 0
    },
    filter(event, player) {
      if (!event.target) {
        return false
      }
      if (event.player === player && event.target === player) {
        return false
      }
      return get.type(event.card) === "trick"
    },
    async content(event, trigger, player) {
      trigger.cancel()
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "trick" && player !== target) {
            return "zeroplayertarget"
          }
        },
        player(card, player, target, current) {
          if (get.type(card) === "trick" && player !== target) {
            return "zeroplayertarget"
          }
        },
      },
    },
  },
  // 举荐
  oldjujian: {
    enable: "phaseUse",
    usable: 1,
    audio: 2,
    filterCard: true,
    position: "he",
    selectCard: [1, 3],
    check(card) {
      var player = get.owner(card)
      if (get.type(card) === "trick") {
        return 10
      }
      if (player.countCards("h") - player.hp - ui.selected.cards.length > 0) {
        return 8 - get.value(card)
      }
      return 4 - get.value(card)
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    async content(event, trigger, player) {
      const { cards, target } = event
      target.draw(cards.length)
      if (cards.length === 3) {
        if (
          get.type(cards[0], "trick") === get.type(cards[1], "trick") &&
          get.type(cards[0], "trick") === get.type(cards[2], "trick")
        ) {
          player.recover()
        }
      }
    },
    ai: {
      expose: 0.2,
      order: 1,
      result: {
        target: 1,
      },
    },
  },
  // 旧凌统
  // 旋风
  oldxuanfeng: {
    audio: "xuanfeng",
    trigger: {
      player: ["loseAfter"],
      global: [
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    filter(event, player) {
      var evt = event.getl(player)
      return evt?.es && evt.es.length > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("oldxuanfeng"),
          filterTarget(card, player, target) {
            if (target === player) {
              return false
            }
            return (
              get.distance(player, target) <= 1 ||
              player.canUse("sha", target, false)
            )
          },
          ai(target) {
            if (get.distance(player, target) <= 1) {
              return get.damageEffect(target, player, player) * 2
            }
            return get.effect(target, { name: "sha" }, player, player)
          },
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      const distance = get.distance(player, target)
      if (distance <= 1 && player.canUse("sha", target, false)) {
        const result = await player
          .chooseControl({
            controls: ["出杀", "造成伤害"],
            ai() {
              return "造成伤害"
            },
          })
          .forResult()
        if (result.control === "出杀") {
          await player
            .useCard({
              card: get.autoViewAs({ name: "sha", isCard: true }),
              targets: [target],
              addCount: false,
            })
            .set("animate", false)
          await game.delay()
        } else {
          await target.damage()
        }
      } else if (distance <= 1) {
        await target.damage()
      } else {
        await player
          .useCard({
            card: get.autoViewAs({ name: "sha", isCard: true }),
            targets: [target],
            addCount: false,
          })
          .set("animate", false)
        await game.delay()
      }
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (get.type(card) === "equip") {
            return [1, 3]
          }
        },
      },
      reverseEquip: true,
      noe: true,
    },
  },
  // 旧徐盛
  // 破军
  oldpojun: {
    audio: "pojun",
    trigger: { source: "damageSource" },
    check(event, player) {
      if (event.player.isTurnedOver()) {
        return get.attitude(player, event.player) > 0
      }
      if (event.player.hp < 3) {
        return get.attitude(player, event.player) < 0
      }
      return get.attitude(player, event.player) > 0
    },
    filter(event) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return event.card && event.card.name === "sha" && event.player.isIn()
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await trigger.player.draw(Math.min(5, trigger.player.hp))
      await trigger.player.turnOver()
    },
  },
  // 旧曹彰
  // 将驰
  oldjiangchi: {
    audio: "jiangchi",
    trigger: { player: "phaseDrawBegin2" },
    logAudio: (event, player, name, indexedData, costResult) =>
      costResult.cost_data.control === "oldjiangchi_less"
        ? "jiangchi2.mp3"
        : "jiangchi1.mp3",
    filter(event, player) {
      return !event.numFixed
    },
    async cost(event, trigger, player) {
      const result = await player
        .chooseControl({
          controls: ["oldjiangchi_less", "oldjiangchi_more", "cancel2"],
          ai() {
            const player = get.player()
            if (
              player.countCards("h") > 3 &&
              player.countCards("h", "sha") > 1
            ) {
              return "oldjiangchi_less"
            }
            if (player.countCards("h", "sha") > 2) {
              return "oldjiangchi_less"
            }
            if (player.hp - player.countCards("h") > 1) {
              return "oldjiangchi_more"
            }
            return "cancel2"
          },
        })
        .forResult()

      event.result = {
        bool: result.control !== "cancel2",
        cost_data: {
          control: result.control,
        },
      }
    },
    async content(event, trigger, player) {
      const { control } = event.cost_data
      if (control === "oldjiangchi_less") {
        trigger.num--
        player.addTempSkill("jiangchi2", "phaseEnd")
      } else if (control === "oldjiangchi_more") {
        trigger.num++
        player.addTempSkill("oldjiangchi3", "phaseEnd")
      }
    },
  },
  oldjiangchi3: {
    mod: {
      cardEnabled2(card) {
        if (card.name === "sha") {
          return false
        }
      },
    },
  },
  // 旧王异
  // 贞烈
  oldzhenlie: {
    audio: 2,
    trigger: {
      player: "judge",
    },
    check(event, player) {
      return event.judge(player.judging[0]) < 0
    },
    async content(event, trigger, player) {
      const card = get.cards()[0]

      const next = game.cardsGotoOrdering(card)
      next.relatedEvent = trigger
      await next

      player.$throw(card)
      if (trigger.player.judging[0].clone) {
        trigger.player.judging[0].clone.classList.remove("thrownhighlight")
        game.broadcast((card) => {
          if (card.clone) {
            card.clone.classList.remove("thrownhighlight")
          }
        }, trigger.player.judging[0])
        game.addVideo(
          "deletenode",
          player,
          get.cardsInfo([trigger.player.judging[0].clone]),
        )
      }
      trigger.player.judging[0] = card
      game.log(trigger.player, "的判定牌改为", card)
      await game.cardsDiscard(trigger.player.judging[0])
      await game.delay(2)
    },
  },
  // 秘计
  oldmiji: {
    trigger: { player: ["phaseZhunbeiBegin", "phaseJieshuBegin"] },
    audio: 2,
    filter(event, player) {
      return player.isDamaged()
    },
    async content(event, trigger, player) {
      let result = await player
        .judge({
          judge(card) {
            return get.color(card) === "black" ? 1 : -1
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()

      if (!result.bool || player.maxHp <= player.hp) {
        return
      }

      const cards = get.cards(player.maxHp - player.hp)
      result = await player
        .chooseTarget({
          forced: true,
          ai(target) {
            const player = get.player()
            return (
              get.attitude(player, target) /
              Math.sqrt(1 + target.countCards("h"))
            )
          },
        })
        .set("createDialog", ["请选择将这些牌交给一名角色", cards])
        .forResult()

      if (result.bool && result.targets?.length) {
        player.line(result.targets)
        await result.targets[0].gain({
          cards,
          animate: "draw",
        })
      }
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.tag(card, "recover") && target.hp === target.maxHp - 1) {
            return [0, 0]
          }
          if (target.hasFriend()) {
            if (
              (get.tag(card, "damage") === 1 || get.tag(card, "loseHp")) &&
              target.hp === target.maxHp
            ) {
              return [0, 1]
            }
          }
        },
      },
      threaten(player, target) {
        if (target.hp === 1) {
          return 3
        }
        if (target.hp === 2) {
          return 2
        }
        return 1
      },
    },
  },
  // 旧关兴张苞
  // 父魂
  oldfuhun: {
    audio: 2,
    trigger: { player: "phaseDrawBegin1" },
    filter(event, player) {
      return !event.numFixed
    },
    async content(event, trigger, player) {
      trigger.changeToZero()

      const cards = get.cards(2)
      await player.showCards(cards, `${get.translation(player)}发动了【父魂】`)

      await player.gain({
        cards,
        animate: "gain2",
      })
      if (get.color(cards[0]) !== get.color(cards[1])) {
        player.addTempSkills(["wusheng", "paoxiao"])
      }
    },
    derivation: ["wusheng", "paoxiao"],
  },
  // 旧廖化
  // 当先
  olddangxian: {
    trigger: { player: "phaseBegin" },
    forced: true,
    audio: "dangxian",
    async content(event, trigger, player) {
      trigger.phaseList.splice(trigger.num, 0, `phaseUse|${event.name}`)
    },
  },
  // 伏枥
  oldfuli: {
    skillAnimation: true,
    animationColor: "soil",
    audio: "fuli",
    limited: true,
    enable: "chooseToUse",
    filter(event, player) {
      if (event.type !== "dying") {
        return false
      }
      if (player !== event.dying) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.recoverTo(game.countGroup())
      await player.turnOver()
    },
    ai: {
      save: true,
      skillTagFilter(player, arg, target) {
        return player === target && player.storage.oldfuli !== true
      },
      result: {
        player: 10,
      },
      threaten(player, target) {
        if (!target.storage.oldfuli) {
          return 0.9
        }
      },
    },
  },
  // 旧马岱
  // 潜袭
  oldqianxi: {
    audio: 2,
    trigger: { source: "damageBegin2" },
    check(event, player) {
      const att = get.attitude(player, event.player)
      if (event.player.hp === event.player.maxHp) {
        return att < 0
      }
      if (
        event.player.hp === event.player.maxHp - 1 &&
        (event.player.maxHp <= 3 || event.player.hasSkillTag("maixie"))
      ) {
        return att < 0
      }
      return att > 0
    },
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        get.distance(player, event.player) <= 1
      )
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const result = await player
        .judge({
          judge(card) {
            return get.suit(card) !== "heart" ? 1 : -1
          },
          judge2(result) {
            return result.bool
          },
        })
        .forResult()

      if (result.bool) {
        trigger.cancel()
        trigger.player.loseMaxHp({ forced: true })
      }
    },
  },
  // 旧韩当
  // 弓骑
  oldgongqi: {
    audio: "gongqi",
    enable: ["chooseToUse", "chooseToRespond"],
    locked: false,
    filterCard: { type: "equip" },
    position: "hes",
    viewAs: {
      name: "sha",
      storage: { oldgongqi: true },
    },
    viewAsFilter(player) {
      if (!player.countCards("hes", { type: "equip" })) {
        return false
      }
    },
    prompt: "将一张装备牌当无距离限制的【杀】使用或打出",
    check(card) {
      var val = get.value(card)
      if (_status.event.name === "chooseToRespond") {
        return 1 / Math.max(0.1, val)
      }
      return 5 - val
    },
    mod: {
      targetInRange(card) {
        if (card.storage?.oldgongqi) {
          return true
        }
      },
    },
    ai: {
      respondSha: true,
      skillTagFilter(player) {
        if (!player.countCards("hes", { type: "equip" })) {
          return false
        }
      },
    },
  },
  // 解烦
  oldjiefan: {
    audio: "jiefan",
    trigger: { player: "chooseToUseBegin" },
    filter(event, player) {
      return event.type === "dying" && _status.currentPhase !== player
    },
    direct: true,
    clearTime: true,
    async content(event, trigger, player) {
      const list = [event.name, trigger.dying]
      await player
        .chooseToUse({
          filterCard(card, player, event) {
            if (get.name(card) !== "sha") {
              return false
            }
            // @ts-expect-error
            return lib.filter.filterCard.apply(this, arguments)
          },
          prompt: get.prompt2(...list),
        })
        .set("targetRequired", true)
        .set("complexSelect", true)
        .set("complexTarget", true)
        .set("filterTarget", function (card, player, target) {
          if (
            target !== _status.currentPhase &&
            !ui.selected.targets.includes(_status.currentPhase)
          ) {
            return false
          }
          return lib.filter.filterTarget.apply(this, arguments)
        })
        .set("logSkill", list)
        .set("oncard", () => {
          _status.event.player.addTempSkill("oldjiefan_recover")
        })
        .set("custom", {
          add: {},
          replace: {
            window: () => {
              ui.click.cancel()
            },
          },
        })
    },
    ai: {
      save: true,
      order: 3,
      result: { player: 1 },
    },
    subSkill: {
      recover: {
        // audio:'jiefan',
        trigger: { source: "damageBegin2" },
        filter(event, player) {
          return event.getParent(4).name === "oldjiefan"
        },
        forced: true,
        popup: false,
        charlotte: true,
        async content(event, trigger, player) {
          trigger.cancel()
          const evt = event.getParent("_save")
          const card = { name: "tao", isCard: true }
          if (evt?.dying && player.canUse(card, evt.dying)) {
            await player.useCard({
              card: get.autoViewAs(card),
              targets: [evt.dying],
              skill: "oldjiefan_recover",
            })
          }
        },
      },
    },
  },
  // 将华雄
  // 恃勇
  shiyong: {
    audio: 2,
    trigger: { player: "damageEnd" },
    forced: true,
    check() {
      return false
    },
    filter(event, player) {
      return (
        event.card &&
        event.card.name === "sha" &&
        (get.color(event.card) === "red" || event.getParent(2).jiu === true)
      )
    },
    async content(event, trigger, player) {
      await player.loseMaxHp()
    },
    ai: {
      neg: true,
    },
  },
  // 旧刘表
  // 自守
  oldzishou: {
    audio: "zishou",
    trigger: { player: "phaseDrawBegin2" },
    check(event, player) {
      return (
        (player.countCards("h") <= 2 && player.getDamagedHp() >= 2) ||
        player.skipList.includes("phaseUse")
      )
    },
    filter(event, player) {
      return !event.numFixed && player.isDamaged()
    },
    async content(event, trigger, player) {
      trigger.num += player.getDamagedHp()
      player.skip("phaseUse")
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 旧曹冲
  // 称象
  oldchengxiang: {
    audio: "chengxiang",
    inherit: "chengxiang",
    maxNum: 12,
  },
  // 仁心
  oldrenxin: {
    audio: "renxin",
    trigger: { global: "dying" },
    //priority:6,
    filter(event, player) {
      return (
        event.player !== player &&
        event.player.hp <= 0 &&
        player.countCards("h") > 0
      )
    },
    check(event, player) {
      if (get.attitude(player, event.player) <= 0) {
        return false
      }
      if (
        player.countCards("h", { name: ["tao", "jiu"] }) + event.player.hp <
        0
      ) {
        return false
      }
      return true
    },
    async content(event, trigger, player) {
      await player.turnOver()
      await player.give(player.getCards("h"), trigger.player)
      await trigger.player.recover()
    },
  },
  // 旧郭淮
  // 精策
  oldjingce: {
    trigger: { player: "phaseUseEnd" },
    frequent: true,
    filter(event, player) {
      return player.countUsed(null, true) >= player.hp
    },
    async content(event, trigger, player) {
      player.draw(2)
    },
    audio: "jingce",
  },
  // 旧满宠
  // 峻刑
  oldjunxing: {
    enable: "phaseUse",
    audio: "junxing",
    usable: 1,
    filterCard: true,
    selectCard: [1, Infinity],
    filter(event, player) {
      return player.countCards("h") > 0
    },
    check(card) {
      if (ui.selected.cards.length) {
        return -1
      }
      var val = get.value(card)
      if (get.type(card) === "basic") {
        return 8 - get.value(card)
      }
      return 5 - get.value(card)
    },
    filterTarget(card, player, target) {
      return player !== target
    },
    allowChooseAll: true,
    async content(event, trigger, player) {
      const { cards, target } = event
      const types = new Set(cards.map((card) => get.type2(card, player)))
      const result = await target
        .chooseToDiscard({
          filterCard(card) {
            return !_status.event.types.has(get.type2(card))
          },
          ai(card) {
            if (_status.event.player.isTurnedOver()) {
              return -1
            }
            return 8 - get.value(card)
          },
        })
        .set("types", types)
        .set("dialog", [
          `弃置与${get.translation(player)}弃置的牌类别均不同的一张手牌，或翻面`,
          "hidden",
          cards,
        ])
        .forResult()
      if (!result.bool) {
        await target.turnOver()
        await target.draw(cards.length)
      }
    },
    ai: {
      order: 2,
      expose: 0.3,
      threaten: 1.8,
      result: {
        target(player, target) {
          if (target.hasSkillTag("noturn")) {
            return 0
          }
          if (target.isTurnedOver()) {
            return 2
          }
          return -1 / (target.countCards("h") + 1)
        },
      },
    },
  },
  // 旧朱然
  // 胆守
  olddanshou: {
    audio: "danshou",
    derivation: "olddanshou_faq",
    trigger: { source: "damageSource" },
    //priority:9,
    check(event, player) {
      return get.attitude(player, event.player) <= 0
    },
    async content(event, trigger, player) {
      await player.draw()
      const cards = Array.from(ui.ordering.childNodes)
      cards.forEach((card) => card.discard())
      const evt = _status.event.getParent("phase", true)
      if (evt) {
        game.resetSkills()
        _status.event = evt
        _status.event.finish()
        _status.event.untrigger(true)
      }
    },
    ai: {
      jueqing: true,
    },
  },
  // 旧伏皇后
  // 惴恐
  oldzhuikong: {
    audio: "zhuikong",
    inherit: "zhuikong",
  },
  // 求援
  oldqiuyuan: {
    audio: "qiuyuan",
    inherit: "qiuyuan",
    filter(event, player) {
      return (
        event.card.name === "sha" &&
        game.hasPlayer((current) => {
          return (
            current !== player &&
            !event.targets.includes(current) &&
            current.countCards("h") > 0 &&
            lib.filter.targetEnabled(event.card, event.player, current)
          )
        })
      )
    },
    async content(event, trigger, player) {
      const {
        targets: [target],
      } = event
      const { card } = trigger
      const result = await target
        .chooseToGive(
          "h",
          `交给${get.translation(player)}一张手牌，若此牌不为【闪】，你也成为${get.translation(card)}的目标`,
          player,
          true,
        )
        .set("ai", (card) => {
          const { player, target } = get.event()
          return (
            Math.sign(Math.sign(get.attitude(player, target)) - 0.5) *
            get.value(card, player, "raw")
          )
        })
        .forResult()
      if (
        !result?.bool ||
        !result?.cards?.length ||
        get.name(result.cards[0], target) !== "shan"
      ) {
        trigger.getParent().targets.push(target)
        trigger.getParent().triggeredTargets2.push(target)
        game.log(target, "成为了", card, "的额外目标")
      }
    },
  },
  // 旧李儒
  // 绝策
  oldjuece: {
    audio: "juece",
    trigger: {
      global: [
        "loseAfter",
        "equipAfter",
        "addJudgeAfter",
        "gainAfter",
        "loseAsyncAfter",
        "addToExpansionAfter",
      ],
    },
    getIndex(event, player) {
      if (_status.currentPhase !== player) {
        return []
      }
      return game.filterPlayer((current) => {
        if (current === player || current.countCards("h") > 0) {
          return false
        }
        const evt = event.getl(current)
        return evt?.hs?.length > 0
      })
    },
    filter(event, player, _name, target) {
      return _status.currentPhase === player
    },
    check(event, player) {
      return get.damageEffect(event.player, player, player) > 0
    },
    async cost(event, trigger, player) {
      /** @type {Player} */
      const target = event.indexedData

      const result = await player
        .chooseBool({
          prompt: get.prompt2("oldjuece", target),
          ai() {
            const { player, target } = get.event()
            return get.damageEffect(target, player, player) >= 0
          },
        })
        .set("target", target)
        .forResult()

      event.result = {
        bool: result.bool,
        targets: [target],
      }
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      await target.damage()
    },
    ai: {
      threaten: 1.1,
    },
  },
  // 灭计
  oldmieji: {
    trigger: { player: "useCard2" },
    audio: "mieji",
    filter(event, player) {
      if (
        get.type(event.card) !== "trick" ||
        get.color(event.card) !== "black"
      ) {
        return false
      }
      if (event.targets?.length !== 1) {
        return false
      }
      var info = get.info(event.card)
      if (info.allowMultiple === false) {
        return false
      }
      if (event.targets && !info.multitarget) {
        if (
          game.hasPlayer(
            (current) =>
              !event.targets.includes(current) &&
              lib.filter.targetEnabled2(event.card, player, current) &&
              lib.filter.targetInRange(event.card, player, current),
          )
        ) {
          return true
        }
      }
      return false
    },
    position: "he",
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("oldmieji"),
          prompt2: `为${get.translation(trigger.card)}增加一个额外目标`,
          filterTarget(_card, _player, target) {
            const { player, card, targets } = get.event()
            if (targets.includes(target)) {
              return false
            }
            return (
              lib.filter.targetEnabled2(card, player, target) &&
              lib.filter.targetInRange(card, player, target)
            )
          },
          ai(target) {
            const event = get.event()
            const trigger = event.getTrigger()
            const player = event.player
            return get.effect(target, trigger.card, player, player)
          },
        })
        .set("autodelay", true)
        .set("targets", trigger.targets)
        .set("card", trigger.card)
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      trigger.targets.push(event.targets[0])
    },
  },
  // 焚城
  oldfencheng: {
    skillAnimation: "epic",
    animationColor: "gray",
    audio: "fencheng",
    enable: "phaseUse",
    filterTarget(card, player, target) {
      return player !== target
    },
    limited: true,
    selectTarget: -1,
    line: "fire",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      const { target } = event
      const res = get.damageEffect(target, player, target, "fire")
      const num = Math.max(1, target.countCards("e"))
      const result = await target
        .chooseToDiscard({
          prompt: `弃置${get.cnNumber(num)}张牌或受到1点火焰伤害`,
          selectCard: num,
          position: "he",
          allowChooseAll: true,
          ai(card) {
            const res = _status.event.res
            const num = _status.event.num
            const player = _status.event.player
            if (res >= 0) {
              return -1
            }
            if (num > 2 && player.hp > 1) {
              return -1
            }
            if (num > 1 && player.hp > 2) {
              return -1
            }
            if (get.position(card) === "e") {
              return 10 - get.value(card)
            }
            return 6 - get.value(card)
          },
        })
        .set("res", res)
        .set("num", num)
        .forResult()
      if (!result?.bool) {
        await target.damage({ nature: "fire" })
      }
    },
    ai: {
      order: 1,
      result: {
        player(player) {
          var num = 0,
            players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (
              player !== players[i] &&
              get.damageEffect(players[i], player, players[i], "fire") < 0
            ) {
              var att = get.attitude(player, players[i])
              if (att > 0) {
                num -= Math.max(1, players[i].countCards("e"))
              } else if (att < 0) {
                num += Math.max(1, players[i].countCards("e"))
              }
            }
          }
          if (players.length < 5) {
            return num - 1
          }
          return num - 2
        },
      },
    },
  },
  // 旧曹真
  // 司敌
  oldsidi: {
    audio: "sidi",
    trigger: { global: "useCard" },
    filter(event, player) {
      if (event.card.name !== "shan") {
        return false
      }
      if (event.player === player) {
        return true
      }
      return _status.currentPhase === player
    },
    frequent: true,
    marktext: "钤",
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    async content(event, trigger, player) {
      player.addToExpansion(get.cards(), "gain2").gaintag.add("oldsidi")
    },
    group: "oldsidi2",
  },
  oldsidi2: {
    audio: "sidi",
    trigger: { global: "phaseUseBegin" },
    sourceSkill: "oldsidi",
    filter(event, player) {
      if (event.player === player || event.player.isDead()) {
        return false
      }
      if (!player.getExpansions("oldsidi").length) {
        return false
      }
      return true
    },
    check(event, player) {
      if (get.attitude(player, event.player) >= 0) {
        return false
      }
      if (event.player.getEquip("zhuge")) {
        return false
      }
      if (event.player.hasSkill("paoxiao")) {
        return false
      }
      var players = game.filterPlayer()
      for (var i = 0; i < players.length; i++) {
        if (
          event.player.canUse("sha", players[i]) &&
          get.attitude(player, players[i]) > 0
        ) {
          break
        }
      }
      if (i === players.length) {
        return false
      }
      var nh = event.player.countCards("h")
      var nsha = event.player.countCards("h", "sha")
      if (nh < 2) {
        return false
      }
      switch (nh) {
        case 2:
          if (nsha) {
            return Math.random() < 0.4
          }
          return Math.random() < 0.2
        case 3:
          if (nsha) {
            return Math.random() < 0.8
          }
          return Math.random() < 0.3
        case 4:
          if (nsha > 1) {
            return true
          }
          if (nsha) {
            return Math.random() < 0.9
          }
          return Math.random() < 0.5
        default:
          return true
      }
    },
    logTarget: "player",
    async content(event, trigger, player) {
      const cards = player.getExpansions("oldsidi")
      let button
      if (cards.length === 1) {
        button = cards[0]
      } else {
        const result = await player
          .chooseCardButton({
            prompt: "移去一张“钤”",
            cards,
            forced: true,
          })
          .forResult()
        if (result.bool && result.links?.length) {
          button = result.links[0]
        }
      }
      if (button) {
        await player.loseToDiscardpile(button)
        trigger.player.addTempSkill("oldsidi3", "phaseUseAfter")
        trigger.player.addMark("oldsidi3", 1, false)
      }
    },
  },
  oldsidi3: {
    mod: {
      cardUsable(card, player, num) {
        if (card.name === "sha") {
          return num - player.countMark("oldsidi3")
        }
      },
    },
    onremove: true,
  },
  // 旧陈群
  // 定品
  dingpin: {
    audio: "pindi",
    enable: "phaseUse",
    onChooseToUse(event) {
      if (event.type !== "phase" || game.online) {
        return
      }
      var list = [],
        player = event.player
      player.getHistory("useCard", (evt) => {
        list.add(get.type2(evt.card))
      })
      player.getHistory("lose", (evt) => {
        if (evt.type !== "discard") {
          return
        }
        for (var i of evt.cards2) {
          list.add(get.type2(i, evt.hs.includes(i) ? player : false))
        }
      })
      event.set("dingpin_types", list)
    },
    filter(event, player) {
      var list = event.dingpin_types || []
      return (
        player.countCards("h", (card) => !list.includes(get.type2(card))) > 0
      )
    },
    filterCard(card) {
      var list = _status.event.dingpin_types || []
      return !list.includes(get.type2(card))
    },
    position: "h",
    filterTarget(card, player, target) {
      return !target.hasSkill("dingpin2") && target.getDamagedHp() > 0
    },
    async content(event, trigger, player) {
      const { target } = event
      const result = await target
        .judge({
          judge(card) {
            const evt = _status.event.getParent("dingpin")
            if (evt == null) {
              return 0
            }
            const color = get.color(card)
            switch (color) {
              case "black":
                return evt.target.getDamagedHp()
              case "red":
                return get.sgn(get.attitude(evt.target, evt.player)) * -3
            }
            return 0
          },
          judge2(result) {
            return result.color === "black"
          },
        })
        .forResult()
      switch (result.color) {
        case "black":
          if (target.getDamagedHp() > 0) {
            await target.draw(target.getDamagedHp())
          }
          target.addTempSkill("dingpin2")
          break
        case "red":
          await player.turnOver()
          break
      }
    },
    ai: {
      order: 9,
      result: {
        target(player, target) {
          if (player.isTurnedOver()) {
            return target.getDamagedHp()
          }
          var card = ui.cardPile.firstChild
          if (!card) {
            return
          }
          if (get.color(card) === "black") {
            return target.getDamagedHp()
          }
          return 0
        },
      },
    },
  },
  dingpin2: { charlotte: true },
  // 法恩
  oldfaen: {
    audio: "faen",
    trigger: { global: ["turnOverAfter", "linkAfter"] },
    filter(event, player) {
      if (event.name === "link") {
        return event.player.isLinked()
      }
      return true
    },
    check(event, player) {
      return get.attitude(player, event.player) > 0
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await trigger.player.draw()
    },
    ai: {
      expose: 0.2,
    },
    global: "faen_global",
  },
  // 旧吴懿
  // 奔袭
  oldbenxi: {
    audio: "benxi",
    trigger: { player: "useCard2" },
    forced: true,
    filter(event, player) {
      return player.isPhaseUsing()
    },
    async content(event, trigger, player) {},
    mod: {
      globalFrom(from, to, distance) {
        if (_status.currentPhase === from) {
          return distance - from.countUsed()
        }
      },
      selectTarget(card, player, range) {
        if (_status.currentPhase === player) {
          if (card.name === "sha" && range[1] !== -1) {
            if (
              !game.hasPlayer((current) => get.distance(player, current) > 1)
            ) {
              range[1]++
            }
          }
        }
      },
    },
    ai: {
      unequip: true,
      skillTagFilter(player) {
        if (game.hasPlayer((current) => get.distance(player, current) > 1)) {
          return false
        }
      },
    },
  },
  // 旧周仓
  // 忠勇
  oldzhongyong: {
    audio: "zhongyong",
    trigger: {
      player: "shaMiss",
    },
    filter(event, player) {
      return (
        player.isPhaseUsing() &&
        event.responded &&
        get.itemtype(event.responded.cards) === "cards"
      )
    },
    async cost(event, trigger, player) {
      const cards = trigger.responded.cards

      event.result = await player
        .chooseTarget({
          prompt: `忠勇：将${get.translation(trigger.responded.cards)}交给另一名角色`,
          filterTarget(card, player, target) {
            return target !== get.event().source
          },
          ai(target) {
            let att = get.attitude(get.player(), target)
            const cards = target.getCards("h")
            if (
              cards.length >= 2 &&
              cards.some((card) => card.name === "shan")
            ) {
              att /= 1.5
            }
            return att
          },
        })
        .set("source", trigger.target)
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const cards = trigger.responded.cards
      const target = event.targets[0]
      await target.gain({
        cards,
        animate: "gain2",
      })
      if (target === player) {
        return
      }

      await player
        .chooseToUse({
          prompt: `是否对${get.translation(trigger.target)}使用一张【杀】？`,
          filterCard(card) {
            return card.name === "sha"
          },
          filterTarget(card, player, target) {
            return target === get.event().target
          },
          selectTarget: -1,
        })
        .set("target", trigger.target)
        .set("addCount", false)
    },
  },
  // 旧朱桓
  // 诱敌
  oldyoudi: {
    audio: 2,
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return player.countCards("he") > 0
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt("oldyoudi"),
          filterTarget: lib.filter.notMe,
          ai(target) {
            if (!_status.event.goon) {
              return 0
            }
            if (target.countCards("he") === 0) {
              return 0
            }
            return -get.attitude(_status.event.player, target)
          },
        })
        .set(
          "goon",
          player.countCards("h", "sha") <= player.countCards("h") / 3,
        )
        .forResult()
    },
    async content(event, trigger, player) {
      await game.delay()
      const target = event.targets[0]

      const result = await target
        .discardPlayerCard({
          target: player,
          position: "he",
          forced: true,
        })
        .forResult()
      if (
        result.links?.length &&
        result.links[0].name !== "sha" &&
        target.countGainableCards(player, "he")
      ) {
        await player.gainPlayerCard({
          target,
          position: "he",
          forced: true,
        })
      }
    },
    ai: {
      expose: 0.2,
    },
  },
  // 旧曹叡
  // 明鉴
  oldmingjian: {
    audio: "mingjian",
    trigger: { player: "phaseUseBefore" },
    filter(event, player) {
      return player.countCards("h")
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(
          get.prompt(event.skill),
          "跳过出牌阶段并将所有手牌交给一名其他角色，然后结束此回合。若如此做，其获得一个额外的出牌阶段",
          lib.filter.notMe,
        )
        .set("ai", (target) => {
          var player = _status.event.player,
            att = get.attitude(player, target)
          if (target.hasSkillTag("nogain")) {
            return 0.01 * att
          }
          if (player.countCards("h") === player.countCards("h", "du")) {
            return -att
          }
          if (target.hasJudge("lebu")) {
            att *= 1.25
          }
          if (get.attitude(player, target) > 3) {
            var basis = get.threaten(target) * att
            if (
              player === get.zhu(player) &&
              player.hp <= 2 &&
              player.countCards("h", "shan") &&
              !game.hasPlayer(
                (current) =>
                  get.attitude(current, player) > 3 &&
                  current.countCards("h", "tao") > 0,
              )
            ) {
              return 0
            }
            if (
              target.countCards("h") + player.countCards("h") >
              target.hp + 2
            ) {
              return basis * 0.8
            }
            return basis
          }
          return 0
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      await player.give(player.getCards("h"), target)
      trigger.cancel()
      const evt = trigger.getParent("phase", true)
      if (evt) {
        game.log(player, "结束了回合")
        evt.num = evt.phaseList.length
        evt.goto(11)
      }
      const next = target.insertPhase()
      next._noTurnOver = true
      next.phaseList = ["phaseUse"]
      //next.setContent(lib.skill.oldmingjian.phase);
    },
    async phase(event, trigger, player) {
      await player.phaseUse()
      game.broadcastAll(() => {
        if (ui.tempnowuxie) {
          ui.tempnowuxie.close()
          delete ui.tempnowuxie
        }
      })
    },
  },
  // 旧曹休
  // 讨袭
  taoxi: {
    audio: "qingxi",
    trigger: { player: "useCardToPlayered" },
    check(event, player) {
      if (get.attitude(player, event.target) >= 0) {
        return false
      }
      var cards = event.target.getCards("h")
      if (
        cards.filter((card) => player.hasUseTarget(card)).length >=
        cards.length / 2
      ) {
        return true
      }
      return false
    },
    filter(event, player) {
      return (
        player.isPhaseUsing() &&
        event.targets.length === 1 &&
        event.target.countCards("h") > 0 &&
        player !== event.target &&
        !player.hasSkill("taoxi_used")
      )
    },
    logTarget: "target",
    async content(event, trigger, player) {
      const result = await player
        .choosePlayerCard({
          target: trigger.target,
          position: "h",
          forced: true,
        })
        .forResult()
      if (result.bool && result.links?.length) {
        const card = result.links[0]
        await player.showCards(
          card,
          `${get.translation(player)}对${get.translation(trigger.target)}发动了【讨袭】`,
        )
        if (!player.storage.taoxi_list) {
          player.storage.taoxi_list = [[], []]
        }
        if (
          !player.storage.taoxi_list[1].some((i) => i._cardid === card.cardid)
        ) {
          const cardx = ui.create.card()
          cardx.init(get.cardInfo(card))
          cardx._cardid = card.cardid
          player.directgains([cardx], null, "taoxi")
          player.storage.taoxi_list[0].push(trigger.target)
          player.storage.taoxi_list[1].push(cardx)
          player.markSkill("taoxi_list")
          player.addTempSkill("taoxi_list")
          player.addTempSkill("taoxi_use")
          player.addTempSkill("taoxi_used", "phaseUseAfter")
        }
      }
    },
    subSkill: {
      used: {},
      use: {
        trigger: { player: "useCardBefore" },
        charlotte: true,
        forced: true,
        popup: false,
        firstDo: true,
        group: "taoxi_lose",
        filter(event, player) {
          if (!player.storage.taoxi_list?.length) {
            return false
          }
          var list = player.storage.taoxi_list[1]
          return event.cards?.some((card) => {
            return list.includes(card)
          })
        },
        async content(event, trigger, player) {
          const cards = []
          const list = player.storage.taoxi_list
          for (const card of trigger.cards) {
            let bool = false
            for (const [i, owner] of list[0].entries()) {
              if (list[1][i] === card) {
                const cardid = card._cardid
                const cardx = owner.getCards(
                  "h",
                  (cardxx) => cardxx.cardid === cardid,
                )[0]
                if (cardx && get.position(cardx) === "h") {
                  cards.push(cardx)
                  owner.$throw(cardx)
                  bool = true
                  break
                }
              }
            }
            if (!bool) {
              cards.push(card)
            }
          }
          trigger.cards = cards
          trigger.card.cards = cards
          trigger.throw = false
        },
        mod: {
          aiOrder(player, card, num) {
            var list = player.storage.taoxi_list
            if (!list?.[1]) {
              return
            }
            if (list[1].includes(card)) {
              return num + 0.5
            }
          },
          cardEnabled2(card) {
            if (
              get.itemtype(card) === "card" &&
              card.hasGaintag("taoxi") &&
              _status.event.name === "chooseToRespond"
            ) {
              return false
            }
          },
        },
        ai: {
          effect: {
            player_use(card, player, target) {
              var list = player.storage.taoxi_list
              if (!list?.[1]) {
                return
              }
              if (list[1].includes(card)) {
                return [1, 1]
              }
            },
          },
        },
      },
      lose: {
        trigger: {
          global: [
            "loseEnd",
            "equipEnd",
            "addJudgeEnd",
            "gainEnd",
            "loseAsyncEnd",
            "addToExpansionEnd",
          ],
        },
        charlotte: true,
        forced: true,
        popup: false,
        firstDo: true,
        filter(event, player) {
          var list = player.storage.taoxi_list
          if (!list?.[0].length) {
            return false
          }
          return game.hasPlayer((current) => {
            if (!list[0].includes(current)) {
              return
            }
            var evt = event.getl(current)
            if (
              evt?.hs?.some((card) => {
                return list[1].some((i) => i._cardid === card.cardid)
              })
            ) {
              return true
            }
            return false
          })
        },
        async content(event, trigger, player) {
          const list = player.storage.taoxi_list
          const targets = game.filterPlayer((current) => {
            if (!list[0].includes(current)) {
              return
            }
            const evt = trigger.getl(current)
            if (
              evt?.hs?.some((card) => {
                return list[1].some((i) => i._cardid === card.cardid)
              })
            ) {
              return true
            }
            return false
          })
          for (const target of targets) {
            const hs = trigger.getl(target).hs
            for (let i = 0; i < list[0].length; i++) {
              if (hs.some((j) => j.cardid === list[1][i]._cardid)) {
                if (player.isOnline2()) {
                  player.send(
                    (list, i) => {
                      game.me.storage.taoxi_list = list
                      list[1][i].delete()
                      list[0].splice(i, 1)
                      list[1].splice(i, 1)
                    },
                    player.storage.taoxi_list,
                    i,
                  )
                }
                list[1][i].delete()
                list[0].splice(i, 1)
                list[1].splice(i, 1)
                i--
              }
            }
          }
        },
      },
      list: {
        audio: "qingxi",
        trigger: { player: "phaseEnd" },
        charlotte: true,
        forced: true,
        onremove(player) {
          game.broadcastAll((player) => {
            player.storage.taoxi_list[1].forEach((i) => i.delete())
            delete player.storage.taoxi_list
          }, player)
        },
        filter(event, player) {
          return (
            player.storage.taoxi_list && player.storage.taoxi_list[0].length > 0
          )
        },
        async content(event, trigger, player) {
          player.loseHp()
        },
      },
    },
  },
  // 全琮
  // 振赡
  zhenshan: {
    audio: "yaoming",
    enable: ["chooseToUse", "chooseToRespond"],
    filter(event, player) {
      if (event.type === "wuxie" || player.hasSkill("zhenshan_used")) {
        return false
      }
      const nh = player.countCards("h")
      if (
        !game.hasPlayer(
          (current) => current !== player && current.countCards("h") < nh,
        )
      ) {
        return false
      }
      for (const i of lib.inpile) {
        if (get.type(i) !== "basic") {
          continue
        }
        const card = { name: i, isCard: true }
        if (event.filterCard(card, player, event)) {
          return true
        }
        if (i === "sha") {
          for (const j of lib.inpile_nature) {
            card.nature = j
            if (event.filterCard(card, player, event)) {
              return true
            }
          }
        }
      }
      return false
    },
    chooseButton: {
      dialog(event, player) {
        const list = []
        for (const i of lib.inpile) {
          if (get.type(i) !== "basic") {
            continue
          }
          const card = { name: i, isCard: true }
          if (event.filterCard(card, player, event)) {
            list.push(["基本", "", i])
          }
          if (i === "sha") {
            for (const j of lib.inpile_nature) {
              card.nature = j
              if (event.filterCard(card, player, event)) {
                list.push(["基本", "", i, j])
              }
            }
          }
        }
        return ui.create.dialog("振赡", [list, "vcard"], "hidden")
      },
      check(button) {
        const player = _status.event.player
        const card = { name: button.link[2], nature: button.link[3] }
        if (card.name === "jiu") {
          return 0
        }
        if (
          game.hasPlayer(
            (current) => get.effect(current, card, player, player) > 0,
          )
        ) {
          if (card.name === "sha") {
            const eff = player.getUseValue(card)
            if (eff > 0) {
              return 2.9 + eff / 10
            }
            return 0
          }
          if (card.name === "tao" || card.name === "shan") {
            return 4
          }
        }
        return 0
      },
      backup(links, player) {
        return {
          filterCard: () => false,
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
            isCard: true,
          },
          selectCard: -1,
          log: false,
          async precontent(event, trigger, player) {
            const result = await player
              .chooseTarget({
                prompt: "赈赡：选择与手牌数小于你的一名角色交换手牌",
                filterTarget(card, player, target) {
                  return (
                    target !== player &&
                    target.countCards("h") < player.countCards("h")
                  )
                },
                forced: true,
                ai(target) {
                  return (
                    get.attitude(get.player(), target) *
                    Math.sqrt(target.countCards("h") + 1)
                  )
                },
              })
              .forResult()
            if (result?.bool) {
              player.logSkill("zhenshan", result.targets)
              player.addTempSkill("zhenshan_used")
              await player.swapHandcards(result.targets[0])
            } else {
              event.result.cancel = true
            }
            await game.delayx()
          },
        }
      },
      prompt(links, player) {
        return `选择${get.translation(links[0][3] || "")}【${get.translation(links[0][2])}】的目标`
      },
    },
    ai: {
      order() {
        const player = _status.event.player
        const event = _status.event
        const nh = player.countCards("h")
        if (
          game.hasPlayer(
            (current) =>
              get.attitude(player, current) > 0 && current.countCards("h") < nh,
          )
        ) {
          if (event.type === "dying") {
            if (event.filterCard({ name: "tao" }, player, event)) {
              return 0.5
            }
          } else {
            if (
              event.filterCard({ name: "tao" }, player, event) ||
              event.filterCard({ name: "shan" }, player, event)
            ) {
              return 4
            }
            if (event.filterCard({ name: "sha" }, player, event)) {
              return 2.9
            }
          }
        }
        return 0
      },
      save: true,
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag, arg) {
        if (player.getStat().skill.olzhenshan > 0) {
          return false
        }
        const nh = player.countCards("h")
        return game.hasPlayer(
          (current) => current !== player && current.countCards("h") < nh,
        )
      },
      result: {
        player(player) {
          if (_status.event.type === "dying") {
            return get.attitude(player, _status.event.dying)
          }
          return 1
        },
      },
    },
  },
  // 旧黄皓
  // 寝情
  oldqinqing: {
    audio: "qinqing",
    mode: ["identity", "versus"],
    available(mode) {
      if (mode === "versus" && _status.mode !== "four") {
        return false
      }
      if (mode === "identity" && _status.mode === "purple") {
        return false
      }
      return true
    },
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      var zhu = get.zhu(player)
      if (!zhu?.isZhu) {
        return false
      }
      return game.hasPlayer(
        (current) =>
          current !== zhu && current !== player && current.inRange(zhu),
      )
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("dcqinqing"),
          filterTarget(card, player, target) {
            const zhu = get.zhu(player)
            return target !== player && target.inRange(zhu)
          },
          ai(target) {
            const zhu = get.zhu(player)
            const he = target.countCards("he")
            if (get.attitude(_status.event.player, target) > 0) {
              if (target.countCards("h") > zhu.countCards("h") + 1) {
                return 0.1
              }
            } else {
              if (he > zhu.countCards("h") + 1) {
                return 2
              }
              if (he > 0) {
                return 1
              }
            }
            return 0
          },
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]

      if (target.countDiscardableCards(player, "he")) {
        await player.discardPlayerCard({
          target,
          position: "he",
          forced: true,
        })
      }
      await target.draw()

      const zhu = get.zhu(player)
      if (zhu?.isIn()) {
        if (target.countCards("h") > zhu.countCards("h")) {
          await player.draw()
        }
      }
    },
  },
  // 贿生
  oldhuisheng: {
    audio: "huisheng",
    trigger: { player: "damageBegin4" },
    direct: true,
    filter(event, player) {
      if (!player.countCards("he")) {
        return false
      }
      if (!event.source || event.source === player || !event.source.isIn()) {
        return false
      }
      if (player.storage.oldhuisheng?.includes(event.source)) {
        return false
      }
      return true
    },
    init(player) {
      if (player.storage.oldhuisheng) {
        player.storage.oldhuisheng = []
      }
    },
    async content(event, trigger, player) {
      if (!player.storage.oldhuisheng) {
        player.storage.oldhuisheng = []
      }
      player.storage.oldhuisheng.push(trigger.source)

      const att = get.attitude(player, trigger.source) > 0
      let goon = false

      if (player.hp === 1) {
        goon = true
      } else {
        const he = player.getCards("he")
        let num = 0
        for (const card of he) {
          if (get.value(card) < 8) {
            num++
            if (num >= 2) {
              goon = true
              break
            }
          }
        }
      }

      const result = await player
        .chooseCard({
          prompt: get.prompt2("oldhuisheng", trigger.source),
          position: "he",
          selectCard: [1, player.countCards("he")],
          ai(card) {
            if (_status.event.att) {
              return 10 - get.value(card)
            }
            if (_status.event.goon) {
              return 8 - get.value(card)
            }
            if (!ui.selected.cards.length) {
              return 7 - get.value(card)
            }
            return 0
          },
        })
        .set("goon", goon)
        .set("att", att)
        .forResult()

      if (!result.bool) {
        return
      }

      player.logSkill("oldhuisheng", trigger.source)
      await game.delay()

      const num = result.cards?.length ?? 0
      const sourceGoon = num > 2 || get.attitude(trigger.source, player) >= 0

      let forced = false
      let str = "获得其中一张，防止此伤害"
      if (trigger.source.countCards("he") < num) {
        forced = true
      } else {
        str += `，或取消并弃置${get.cnNumber(num)}张牌`
      }

      const result2 = await trigger.source
        .chooseButton({
          forced,
          createDialog: [str, result.cards],
          ai(button) {
            if (_status.event.goon) {
              return get.value(button.link)
            }
            return get.value(button.link) - 8
          },
        })
        .set("goon", sourceGoon)
        .forResult()

      if (result2.bool) {
        const card = result2.links?.[0]
        await trigger.source.gain({
          cards: [card],
          source: player,
          animate: "giveAuto",
          bySelf: true,
        })
        trigger.cancel()
      } else {
        await trigger.source.chooseToDiscard({
          selectCard: num,
          position: "he",
          forced: true,
        })
      }
    },
  },
  // 旧刘虞
  // 止戈
  oldzhige: {
    enable: "phaseUse",
    usable: 1,
    audio: "zhige",
    filter(event, player) {
      return player.countCards("h") > player.hp
    },
    filterTarget(card, player, target) {
      return player !== target && target.inRange(player)
    },
    async content(event, trigger, player) {
      const { target } = event
      let result
      result = await target
        .chooseToUse({
          prompt: `止戈：使用一张【杀】，或将装备区里的一张牌交给${get.translation(player)}`,
          filterCard: get.filter({ name: "sha" }),
        })
        .forResult()
      if (result.bool || !target.countCards("e")) {
        return
      }

      result = await target
        .chooseCard({
          prompt: `将装备区里的一张牌交给${get.translation(player)}`,
          position: "e",
          forced: true,
        })
        .forResult()
      if (result.bool && result.cards?.length) {
        await target.give(result.cards, player)
      }
    },
    ai: {
      expose: 0.2,
      order: 5,
      result: {
        target: -1,
        player(player, target) {
          if (target.countCards("h") === 0) {
            return 0
          }
          if (target.countCards("h") === 1) {
            return -0.1
          }
          if (player.hp <= 2) {
            return -2
          }
          if (player.countCards("h", "shan") === 0) {
            return -1
          }
          return -0.5
        },
      },
    },
  },
  // 宗祚
  oldzongzuo: {
    trigger: {
      global: "phaseBefore",
      player: "enterGame",
    },
    forced: true,
    audio: "zongzuo",
    filter(event, player) {
      return event.name !== "phase" || game.phaseNumber === 0
    },
    async content(event, trigger, player) {
      const num = game.countGroup()
      await player.gainMaxHp({ num })
      await player.recover({ num })
      //player.update();
    },
    group: "oldzongzuo_lose",
    subSkill: {
      lose: {
        trigger: { global: "dieAfter" },
        forced: true,
        audio: "zongzuo",
        filter(event, player) {
          if (!lib.group.includes(event.player.group)) {
            return false
          }
          if (
            game.hasPlayer((current) => current.group === event.player.group)
          ) {
            return false
          }
          return true
        },
        async content(event, trigger, player) {
          await player.loseMaxHp()
        },
      },
    },
  },
  // 旧张让
  // 滔乱
  oldtaoluan: {
    hiddenCard(player, name) {
      return (
        !player.getStorage("oldtaoluan").includes(name) &&
        lib.inpile.includes(name)
      )
    },
    audio: "taoluan",
    enable: "chooseToUse",
    filter(event, player) {
      return lib.inpile.some((name) => {
        if (player.getStorage("taoluan").includes(name)) {
          return false
        }
        if (get.type(name) !== "basic" && get.type(name) !== "trick") {
          return false
        }
        if (event.filterCard({ name: name, isCard: true }, player, event)) {
          return true
        }
        if (name === "sha") {
          for (var nature of lib.inpile_nature) {
            if (
              event.filterCard(
                { name: name, nature: nature, isCard: true },
                player,
                event,
              )
            ) {
              return true
            }
          }
        }
        return false
      })
    },
    onremove: true,
    chooseButton: {
      dialog(event, player) {
        var list = []
        for (var name of lib.inpile) {
          if (get.type(name) === "basic" || get.type(name) === "trick") {
            if (player.getStorage("oldtaoluan").includes(name)) {
              continue
            }
            list.push([get.translation(get.type(name)), "", name])
            if (name === "sha") {
              for (var j of lib.inpile_nature) {
                list.push(["基本", "", "sha", j])
              }
            }
          }
        }
        return ui.create.dialog("滔乱", [list, "vcard"])
      },
      filter(button, player) {
        return _status.event
          .getParent()
          .filterCard(
            { name: button.link[2] },
            player,
            _status.event.getParent(),
          )
      },
      check(button) {
        var player = _status.event.player
        var card = { name: button.link[2], nature: button.link[3] }
        if (player.countCards("hes", (cardx) => cardx.name === card.name)) {
          return 0
        }
        return _status.event.getParent().type === "phase"
          ? player.getUseValue(card)
          : 1
      },
      backup(links, player) {
        return {
          audio: "oldtaoluan",
          selectCard: 0,
          popname: true,
          viewAs: { name: links[0][2], nature: links[0][3] },
          onuse(result, player) {
            player.markAuto("oldtaoluan", [result.card.name])
          },
        }
      },
      prompt(links, player) {
        return `视为使用${get.translation(links[0][3]) || ""}${get.translation(links[0][2])}`
      },
    },
    ai: {
      save: true,
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag, arg) {
        if (!player.countCards("hes") || player.isTempBanned("oldtaoluan")) {
          return false
        }
        if (tag === "respondSha" || tag === "respondShan") {
          if (arg === "respond") {
            return false
          }
          return !player
            .getStorage("oldtaoluan")
            .includes(tag === "respondSha" ? "sha" : "shan")
        }
        return (
          !player.getStorage("oldtaoluan").includes("tao") ||
          (!player.getStorage("oldtaoluan").includes("jiu") && arg === player)
        )
      },
      order: 4,
      result: {
        player(player) {
          var allshown = true,
            players = game.filterPlayer()
          for (var i = 0; i < players.length; i++) {
            if (players[i].ai.shown === 0) {
              allshown = false
            }
            if (
              players[i] !== player &&
              players[i].countCards("h") &&
              get.attitude(player, players[i]) > 0
            ) {
              return 1
            }
          }
          if (allshown) {
            return 1
          }
          return 0
        },
      },
      threaten: 1.9,
    },
    group: "oldtaoluan2",
  },
  oldtaoluan2: {
    charlotte: true,
    trigger: { player: "useCardAfter" },
    sourceSkill: "oldtaoluan",
    filter(event, player) {
      if (!game.hasPlayer((current) => current !== player)) {
        return false
      }
      return event.skill === "oldtaoluan_backup"
    },
    forced: true,
    popup: false,
    async content(event, trigger, player) {
      let result = await player
        .chooseTarget({
          prompt:
            '滔乱<br /><br /><div class="text center">令一名其他角色选择一项：1.交给你一张与你以此法使用的牌类别不同的牌；2.令你失去1点体力',
          filterTarget: lib.filter.notMe,
          forced: true,
          ai(target) {
            const current = _status.event.player
            if (get.attitude(current, target) > 0) {
              if (get.attitude(target, current) > 0) {
                return target.countCards("he")
              }
              return target.countCards("he") / 2
            }
            return 0
          },
        })
        .forResult()
      const target = result.targets[0]
      player.line(target, "green")
      const type = get.type(trigger.card, "trick")
      result = await target
        .chooseCard({
          prompt: `滔乱<br><br><div class="text center">交给${get.translation(player)}一张不为${get.translation(type)}牌的牌，或令其失去1点体力`,
          position: "he",
          filterCard(card) {
            return get.type(card, "trick") !== get.event().cardType
          },
          ai(card) {
            if (get.event().att) {
              return 11 - get.value(card)
            }
            return 0
          },
        })
        .set("cardType", type)
        .set("att", get.attitude(target, player) > 0)
        .forResult()
      if (!result.bool) {
        await player.loseHp()
        return
      }
      await target.give(result.cards, player)
    },
  },
  oldtaoluan_backup: {},
  // 辛宪英
  // 忠鉴
  oldzhongjian: {
    audio: 2,
    enable: "phaseUse",
    usable(skill, player) {
      return (
        1 + (player.hasSkill(`${skill}_rewrite`, null, null, false) ? 1 : 0)
      )
    },
    filter(event, player) {
      if (!player.countCards("h")) {
        return false
      }
      return game.hasPlayer(
        (current) => current !== player && current.hp < current.countCards("h"),
      )
    },
    filterCard: true,
    check() {
      return Math.random()
    },
    discard: false,
    lose: false,
    delay: false,
    filterTarget(card, player, target) {
      return target !== player && target.hp < target.countCards("h")
    },
    async content(event, trigger, player) {
      const { cards, target } = event
      await player.showCards(cards)
      if (target.hp >= target.countCards("h")) {
        return
      }
      const result = await player
        .choosePlayerCard(target, "h", target.countCards("h") - target.hp, true)
        .forResult()
      if (!result?.cards?.length) {
        return
      }
      const hs = result.cards
      await target.showCards(hs)
      const bool1 = cards.some((card) =>
        hs.some((cardx) => get.color(cardx) === get.color(card)),
      )
      const bool2 = cards.some((card) =>
        hs.some((cardx) => get.number(cardx) === get.number(card)),
      )
      if (bool1) {
        const result = await player
          .discardPlayerCard({
            prompt: `忠鉴：弃置${get.translation(target)}一张牌或取消你摸一张牌`,
            target,
            position: "he",
          })
          .forResult()
        if (!result?.bool) {
          await player.draw()
        }
      }
      if (bool2) {
        player.addTempSkill(`${event.name}_rewrite`, "phaseUseEnd")
      }
      if (!bool1 && !bool2) {
        player.addSkill(`${event.name}_effect`)
        player.addMark(`${event.name}_effect`, 1, false)
        player.popup("杯具")
      }
    },
    ai: {
      order: 8,
      result: {
        player(player, target) {
          return target.countCards("h") - target.hp
        },
      },
    },
    subSkill: {
      rewrite: { charlotte: true },
      effect: {
        charlotte: true,
        onremove: true,
        markimage: "image/card/handcard.png",
        intro: { content: "手牌上限-#" },
        mod: {
          maxHandcard(player, num) {
            return num - player.countMark("oldzhongjian_effect")
          },
        },
      },
    },
  },
  // 才识
  oldcaishi: {
    audio: 2,
    trigger: { player: "phaseDrawBegin" },
    async cost(event, trigger, player) {
      const choices = []
      const choiceList = [
        "令你的手牌上限+1，然后本回合你不能对其他角色使用牌",
        "回复1点体力，然后本回合你不能对自己使用牌",
      ]
      choices.push("选项一")
      if (player.isDamaged()) {
        choices.push("选项二")
      } else {
        choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}</span>`
      }
      const result = await player
        .chooseControl(choices, "cancel2")
        .set("choiceList", choiceList)
        .set("prompt", get.prompt(event.skill))
        .set("ai", () => {
          return get.event().choice
        })
        .set(
          "choice",
          (() => {
            if (player.isDamaged()) {
              if (player.countCards("h", "tao")) {
                return 0
              }
              if (player.hp < 2) {
                return 1
              }
              if (
                player.countCards("h", (card) => {
                  const info = get.info(card)
                  return (
                    info &&
                    (info.toself || info.selectTarget === -1) &&
                    player.canUse(card, player) &&
                    player.getUseValue(card) > 0
                  )
                }) === 0
              ) {
                return 1
              }
            }
            return 0
          })(),
        )
        .forResult()
      event.result = {
        bool: result?.control !== "cancel2",
        cost_data: result?.index,
      }
    },
    async content(event, trigger, player) {
      const index = event.cost_data
      if (index === 0) {
        player.addSkill(`${event.name}_effect`)
        player.addMark(`${event.name}_effect`, 1, false)
        player.addTempSkill("zishou2")
      } else if (index === 1) {
        await player.recover()
        player.addTempSkill(`${event.name}_buff`)
      }
    },
    subSkill: {
      effect: {
        charlotte: true,
        onremove: true,
        markimage: "image/card/handcard.png",
        intro: { content: "手牌上限+#" },
        mod: {
          maxHandcard(player, num) {
            return num + player.countMark("oldcaishi_effect")
          },
        },
      },
      buff: {
        charlotte: true,
        mark: true,
        intro: { content: "本回合不能对自己使用牌" },
        mod: {
          playerEnabled(card, player, target) {
            if (player === target) {
              return false
            }
          },
        },
      },
    },
  },
  // 旧嵇康
  // 清弦
  oldqingxian: {
    audio: "qingxian",
    group: ["oldqingxian_jilie", "oldqingxian_rouhe"],
    ai: {
      threaten: 0.8,
      maixie: true,
      maixie_hp: true,
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (target.hp > 1 && target.hasFriend()) {
              return 0.4
            }
          }
        },
      },
    },
    subSkill: {
      rouhe: {
        audio: "qingxian",
        trigger: { player: "recoverEnd" },
        async cost(event, trigger, player) {
          event.result = await player
            .chooseTarget({
              prompt: get.prompt("oldqingxian"),
              prompt2:
                "当你回复体力后，你可以令一名其他角色执行一项：1.失去1点体力，从牌堆中随机使用一张装备牌；2.回复1点体力，弃置一张装备牌。若其以此法使用或弃置的牌为梅花，你回复1点体力",
              filterTarget(card, player, target) {
                return target !== player
              },
              ai(target) {
                const att = get.attitude(_status.event.player, target)
                if (target.isHealthy() && att > 0) {
                  return 0
                }
                if (target.hp === 1 && att !== 0) {
                  if (att > 0) {
                    return 9
                  }
                  return 10
                }
                return Math.sqrt(Math.abs(att))
              },
            })
            .forResult()
        },
        logTarget: "targets",
        async content(event, trigger, player) {
          await lib.skill.oldqingxian.content_choose(event, trigger, player)
        },
      },
      jilie: {
        audio: "qingxian",
        trigger: { player: "damageEnd" },
        filter(event, player) {
          return event.source?.isIn()
        },
        check(event, player) {
          if (
            get.attitude(player, event.source) > 0 &&
            event.source.isHealthy()
          ) {
            return false
          }
          return true
        },
        logTarget: "source",
        prompt2:
          "当你受到伤害后，你可以令伤害来源执行一项：1.失去1点体力，从牌堆中随机使用一张装备牌；2.回复1点体力，弃置一张装备牌。若其以此法使用或弃置的牌为梅花，你回复1点体力",
        async content(event, trigger, player) {
          await lib.skill.oldqingxian.content_choose(event, trigger, player)
        },
      },
    },
    /**
     * @type {ContentFuncByAll}
     */
    async content_choose(event, trigger, player) {
      const {
        targets: [target],
      } = event

      let resultIndex
      if (target.isHealthy()) {
        resultIndex = 0
      } else {
        let index
        if (get.attitude(player, target) > 0) {
          index = 1
        } else {
          index = 0
        }

        const chooseResult = await player
          .chooseControlList({
            list: [
              `令${get.translation(target)}失去1点体力，从牌堆中随机使用一张装备牌`,
              `令${get.translation(target)}回复1点体力，弃置一张装备牌`,
            ],
            forced: true,
            ai(event, player) {
              return get.event().index
            },
          })
          .set("index", index)
          .forResult()
        resultIndex = chooseResult?.index || index
      }
      let card = null
      if (resultIndex === 0) {
        await target.loseHp()
        card = get.cardPile(
          (card) => get.type(card) === "equip" && target.canUse(card, target),
          false,
          "random",
        )
        if (card) {
          await target.chooseUseTarget({
            card,
            throw: false,
            nopopup: true,
            forced: true,
          })
        }
      } else {
        await target.recover()
        if (target.countCards("he", { type: "equip" })) {
          const discardResult = await target
            .chooseToDiscard({
              prompt: "弃置一张装备牌",
              filterCard(card) {
                return get.type(card) === "equip"
              },
              position: "he",
              forced: true,
              ai(card) {
                let val = -get.value(card)
                if (get.suit(card) === "club") {
                  val += get.event().att * 10
                }
                return val
              },
            })
            .set("att", get.sgnAttitude(target, player))
            .forResult()
          if (discardResult?.cards) {
            card = discardResult.cards[0]
          }
        }
      }
      if (card && get.suit(card) === "club") {
        await player.recover()
      }
    },
  },
  // 绝响
  oldjuexiang: {
    audio: "juexiang",
    trigger: { player: "die" },
    forceDie: true,
    skillAnimation: true,
    animationColor: "thunder",
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("oldjuexiang"),
          filterTarget: lib.filter.notMe,
          ai(target) {
            const player = get.player()
            return get.attitude(player, target) / Math.sqrt(target.hp + 1)
          },
        })
        .set("forceDie", true)
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      target.addSkills(lib.skill.oldjuexiang.derivation.randomGet())
      target.addTempSkill("oldjuexiang_club", { player: "phaseZhunbeiBegin" })
    },
    derivation: ["juexiang_ji", "juexiang_lie", "juexiang_rou", "juexiang_he"],
    subSkill: {
      club: {
        mark: true,
        nopop: true,
        intro: {
          content: "info",
        },
        mod: {
          targetEnabled(card, player, target) {
            if (get.suit(card) === "club" && player !== target) {
              return false
            }
          },
        },
      },
    },
  },
  // 激弦
  juexiang_ji: {
    audio: 1,
    mark: true,
    intro: {
      content: "info",
    },
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return event.source?.isIn()
    },
    check(event, player) {
      return get.attitude(player, event.source) < 0
    },
    logTarget: "source",
    async content(event, trigger, player) {
      await trigger.source.loseHp()
      const card = get.cardPile(
        (card) =>
          get.type(card) === "equip" &&
          trigger.source.canUse(card, trigger.source),
        false,
        "random",
      )
      if (card) {
        await trigger.source.chooseUseTarget({
          card,
          throw: false,
          nopopup: true,
          forced: true,
        })
      }
    },
    ai: {
      maixie_defend: true,
    },
  },
  // 烈弦
  juexiang_lie: {
    audio: 1,
    mark: true,
    intro: {
      content: "info",
    },
    trigger: {
      player: "recoverEnd",
      global: "dyingAfter",
    },
    getIndex(event, player, triggername) {
      if (_status.dying.length) {
        if (triggername === "recoverEnd") {
          player.storage.juexiang_lie ??= 0
          ++player.storage.juexiang_lie
        }
        return 0
      }

      return triggername === "dyingAfter" ? player.storage.juexiang_lie : 1
    },
    async cost(event, trigger, player) {
      if (event.triggername === "dyingAfter") {
        if (!player.countMark("juexiang_lie")) {
          return
        }
        player.storage.juexiang_lie--
      }
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("juexiang_lie"),
          filterTarget: lib.filter.notMe,
          ai(target) {
            return -get.attitude(player, target) / (1 + target.hp)
          },
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      await target.loseHp()
      const card = get.cardPile(
        (card) => get.type(card) === "equip" && target.canUse(card, target),
        false,
        "random",
      )
      if (card) {
        await target.chooseUseTarget({
          card,
          throw: false,
          nopopup: true,
          forced: true,
        })
      }
    },
  },
  // 柔弦
  juexiang_rou: {
    audio: 1,
    mark: true,
    intro: {
      content: "info",
    },
    trigger: { player: "damageEnd" },
    filter(event, player) {
      return event.source?.isIn()
    },
    check(event, player) {
      var att = get.attitude(player, event.source)
      if (player.isHealthy()) {
        return att < 0
      }
      return att > 0
    },
    logTarget: "source",
    async content(event, trigger, player) {
      await trigger.source.recover()
      if (trigger.source.countCards("he", { type: "equip" })) {
        await trigger.source.chooseToDiscard({
          prompt: "弃置一张装备牌",
          filterCard(card) {
            return get.type(card) === "equip"
          },
          position: "he",
          forced: true,
        })
      }
    },
    ai: {
      maixie_defend: true,
    },
  },
  // 和弦
  juexiang_he: {
    audio: 1,
    mark: true,
    intro: {
      content: "info",
    },
    trigger: { player: "recoverEnd" },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget({
          prompt: get.prompt2("juexiang_he"),
          filterTarget: lib.filter.notMe,
          ai(target) {
            const att = get.attitude(get.event().player, target)
            if (target.isHealthy() && target.countCards("he")) {
              return -att
            }
            return (10 * att) / (1 + target.hp)
          },
        })
        .forResult()
    },
    logTarget: "targets",
    async content(event, trigger, player) {
      const target = event.targets[0]
      await target.recover()
      if (target.countCards("he", { type: "equip" })) {
        await target.chooseToDiscard({
          prompt: "弃置一张装备牌",
          filterCard(card) {
            return get.type(card) === "equip"
          },
          position: "he",
          forced: true,
        })
      }
    },
  },
  // 杨修
  // 啖酪
  danlao: {
    audio: 2,
    filter(event, player) {
      return (
        get.type(event.card) === "trick" &&
        event.targets &&
        event.targets.length > 1
      )
    },
    check(event, player) {
      return (
        event.getParent().excluded.includes(player) ||
        get.tag(event.card, "multineg") ||
        get.effect(player, event.card, event.player, player) <= 0
      )
    },
    trigger: { target: "useCardToTargeted" },
    content() {
      trigger.getParent().excluded.add(player)
      player.draw()
    },
    ai: {
      effect: {
        target(card) {
          if (get.type(card) !== "trick") {
            return
          }
          if (card.name === "tiesuo") {
            return [0, 0]
          }
          if (card.name === "yihuajiemu") {
            return [0, 1]
          }
          if (get.tag(card, "multineg")) {
            return [0, 2]
          }
        },
      },
    },
  },
  // 鸡肋
  jilei: {
    trigger: { player: "damageEnd" },
    audio: 2,
    audioname2: { sxrm_caocao: "jilei_sxrm_caocao" },
    filter(event) {
      return event.source?.isIn()
    },
    async cost(event, trigger, player) {
      const types = ["basic", "trick", "equip"].map((i) => `caoying_${i}`)
      const { bool, links } = await player
        .chooseButton([
          get.prompt2(event.skill, trigger.source),
          [types, "vcard"],
        ])
        .set("ai", (button) => {
          const type = button.link[2].slice(8),
            { player, source } = get.event()
          if (get.attitude(player, source) > 0) {
            return 0
          }
          if (source.getStorage("jilei2").includes(type)) {
            return 0
          }
          if (
            type === "trick" &&
            source.countCards("h", (card) => {
              return (
                get.type(card, null, source) === "trick" &&
                source.hasValueTarget(card)
              )
            })
          ) {
            return 3
          }
          return ["equip", "trick", "basic"].indexOf(type)
        })
        .set("source", trigger.source)
        .forResult()
      event.result = {
        bool: bool,
        targets: [trigger.source],
        cost_data: links,
      }
    },
    async content(event, trigger, player) {
      const type = event.cost_data[0][2].slice(8)
      player.popup(`${get.translation(type)}牌`)
      trigger.source.addTempSkill("jilei2", { player: "phaseBegin" })
      trigger.source.markAuto("jilei2", type)
    },
    ai: {
      maixie_defend: true,
      threaten: 0.7,
    },
  },
  jilei2: {
    charlotte: true,
    intro: {
      content(storage) {
        return `不能使用、打出或弃置${get.translation(storage)}牌`
      },
    },
    init(player, skill) {
      if (!player.storage[skill]) {
        player.storage[skill] = []
      }
    },
    mark: true,
    onremove: true,
    mod: {
      cardDiscardable(card, player) {
        if (player.storage.jilei2.includes(get.type(card, "trick"))) {
          return false
        }
      },
      cardEnabled(card, player) {
        if (player.storage.jilei2.includes(get.type(card, "trick"))) {
          var hs = player.getCards("h"),
            cards = [card]
          if (Array.isArray(card.cards)) {
            cards.addArray(card.cards)
          }
          for (var i of cards) {
            if (hs.includes(i)) {
              return false
            }
          }
        }
      },
      cardRespondable(card, player) {
        if (player.storage.jilei2.includes(get.type(card, "trick"))) {
          var hs = player.getCards("h"),
            cards = [card]
          if (Array.isArray(card.cards)) {
            cards.addArray(card.cards)
          }
          for (var i of cards) {
            if (hs.includes(i)) {
              return false
            }
          }
        }
      },
      cardSavable(card, player) {
        if (player.storage.jilei2.includes(get.type(card, "trick"))) {
          var hs = player.getCards("h"),
            cards = [card]
          if (Array.isArray(card.cards)) {
            cards.addArray(card.cards)
          }
          for (var i of cards) {
            if (hs.includes(i)) {
              return false
            }
          }
        }
      },
    },
  },
  oldjilei: {
    audio: "jilei",
    inherit: "jilei",
    async content(event, trigger, player) {
      const type = event.cost_data[0][2].slice(8)
      player.popup(`${get.translation(type)}牌`)
      trigger.source.addTempSkill("jilei2")
      trigger.source.markAuto("jilei2", type)
    },
  },
  // SP袁术
  // 庸肆
  spyongsi: {
    audio: 2,
    group: ["spyongsi1", "spyongsi2"],
    locked: true,
    ai: {
      threaten: 3.2,
    },
  },
  spyongsi1: {
    audio: true,
    trigger: { player: "phaseDrawBegin2" },
    forced: true,
    sourceSkill: "spyongsi",
    filter(event, player) {
      return !event.numFixed
    },
    content() {
      trigger.num += game.countGroup()
    },
  },
  spyongsi2: {
    audio: true,
    trigger: { player: "phaseDiscardBegin" },
    forced: true,
    sourceSkill: "spyongsi",
    content() {
      player.chooseToDiscard(game.countGroup(), "he", true)
    },
  },
  // 伪帝
  spweidi: {
    available(mode) {
      return (
        mode === "identity" || (mode === "versus" && _status.mode === "four")
      )
    },
    init(player) {
      const list = []
      const zhu = get.zhu(player)
      if (zhu && zhu !== player && zhu.skills) {
        for (var i = 0; i < zhu.skills.length; i++) {
          if (lib.skill[zhu.skills[i]] && lib.skill[zhu.skills[i]].zhuSkill) {
            list.push(zhu.skills[i])
          }
        }
      }
      player.addAdditionalSkill("spweidi", list)
      game.broadcastAll((list) => {
        game.expandSkills(list)
        for (var i of list) {
          var info = lib.skill[i]
          if (!info) {
            continue
          }
          if (!info.audioname2) {
            info.audioname2 = {}
          }
          info.audioname2.yuanshu = "spweidi"
        }
      }, list)
    },
    trigger: { global: ["gameStart", "changeSkillsAfter"] },
    forced: true,
    audio: 2,
    filter(event, player) {
      const mode = get.mode()
      if (
        mode !== "identity" &&
        (mode !== "versus" || _status.mode !== "four")
      ) {
        return false
      }
      const zhu = get.zhu(player)
      if (!zhu || zhu === player) {
        return false
      }
      if (event.name === "gameStart") {
        return true
      }
      return (
        event.player === zhu &&
        (event.addSkill.some((skill) => {
          return lib.skill[skill]?.zhuSkill
        }) ||
          event.addSkill.some((skill) => {
            return lib.skill[skill]?.zhuSkill
          }))
      )
    },
    async content(event, trigger, player) {
      lib.skill.spweidi.init(player)
    },
  },
  // SP关羽
  // 单骑
  danji: {
    audio: 2,
    skillAnimation: true,
    animationColor: "water",
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    juexingji: true,
    derivation: ["mashu"],
    filter(event, player) {
      var zhu = get.zhu(player)
      if (zhu?.isZhu) {
        var name = zhu.name
        while (name.indexOf("_") !== -1) {
          name = name.slice(name.indexOf("_") + 1)
        }
        if (name.indexOf("caocao") !== 0) {
          return false
        }
      }
      return !player.storage.danji && player.countCards("h") > player.hp
    },
    content() {
      player.awakenSkill(event.name)
      player.loseMaxHp()
      player.addSkills(["mashu"])
    },
    ai: {
      maixie: true,
      skillTagFilter: (player, tag, arg) => {
        if (tag === "maixie") {
          if (
            player.hp < 2 ||
            player.storage.danji ||
            player.countCards("h") !== player.hp
          ) {
            return false
          }
          const zhu = get.zhu(player)
          if (zhu?.isZhu) {
            let name = zhu.name
            while (name.indexOf("_") !== -1) {
              name = name.slice(name.indexOf("_") + 1)
            }
            if (name.indexOf("caocao") !== 0) {
              return false
            }
          }
          return true
        }
      },
      effect: {
        target: (card, player, target) => {
          const hs = target.countCards("h")
          if (target.hp < 3 || target.storage.danji || hs > target.hp + 1) {
            return
          }
          const zhu = get.zhu(target)
          if (zhu?.isZhu) {
            let name = zhu.name
            while (name.indexOf("_") !== -1) {
              name = name.slice(name.indexOf("_") + 1)
            }
            if (name.indexOf("caocao") !== 0) {
              return
            }
          }
          if (get.tag(card, "draw")) {
            return 1.6
          }
          if (get.tag(card, "lose") || get.tag(card, "discard")) {
            return [1, -0.8]
          }
          if (hs === target.hp && get.tag(card, "damage")) {
            return [1, target.hp / 3]
          }
          if (
            hs > target.hp &&
            target.hp > 3 &&
            (card.name === "shan" || card.name === "wuxie")
          ) {
            return "zeroplayertarget"
          }
        },
      },
      combo: "wusheng",
    },
  },
  // 曹洪
  // 援护
  yuanhu: {
    audio: 3,
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return player.countCards("he", { type: "equip" }) > 0
    },
    logAudio(_1, _2, _3, _4, result) {
      return `yuanhu${Math.min(get.equipNum(result.cards[0]), 3)}.mp3`
    },
    async cost(event, trigger, player) {
      event.result = await player
        .chooseCardTarget({
          filterCard(card) {
            return get.type(card) === "equip"
          },
          position: "he",
          filterTarget(card, player, target) {
            return target.canEquip(card)
          },
          ai1(card) {
            return 6 - get.value(card)
          },
          ai2(target) {
            return get.attitude(_status.event.player, target) - 3
          },
          prompt: get.prompt2(event.skill),
        })
        .forResult()
    },
    async content(event, trigger, player) {
      const target = event.targets[0]
      const card = event.cards[0]
      await target.equip(card)
      if (target !== player) {
        player.$give(card, target, false)
      }
      switch (get.subtype(card)) {
        case "equip1": {
          if (
            !game.hasPlayer((current) => get.distance(target, current) <= 1)
          ) {
            return
          }
          await game.delay()
          const { targets } = await player
            .chooseTarget(
              true,
              (card, player, target) =>
                get.distance(_status.event.thisTarget, target) <= 1 &&
                target.countCards("hej"),
              `选择弃置${get.translation(target)}距离为1的一名角色区域里的一张牌`,
            )
            .set("ai", (target) => {
              var attitude = get.attitude(_status.event.player, target)
              if (attitude > 0 && target.countCards("j")) {
                return attitude * 1.5
              }
              return -attitude
            })
            .set("thisTarget", target)
            .forResult()
          if (targets.length) {
            await player.discardPlayerCard(true, targets[0], "hej")
          }
          return
        }
        case "equip2":
          await target.draw()
          return
        case "equip5":
          return
        default:
          await target.recover()
          return
      }
    },
  },
  // 旧关银屏
  // 血祭
  oldxueji: {
    audio: "xueji",
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return (
        player.hp < player.maxHp &&
        player.countCards("he", { color: "red" }) > 0
      )
    },
    filterTarget(card, player, target) {
      return player !== target && get.distance(player, target, "attack") <= 1
    },
    selectTarget() {
      return [1, _status.event.player.maxHp - _status.event.player.hp]
    },
    position: "he",
    filterCard(card) {
      return get.color(card) === "red"
    },
    check(card) {
      return 8 - get.useful(card)
    },
    async content(event, trigger, player) {
      const { target } = event
      await target.damage()
      await target.draw()
    },
    ai: {
      order: 7,
      result: {
        target(player, target) {
          return get.damageEffect(target, player)
        },
      },
      threaten(player, target) {
        if (target.hp === 1) {
          return 2
        }
        if (target.hp === 2) {
          return 1.5
        }
        return 0.5
      },
      maixie: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (target.hp === target.maxHp && target.hasFriend()) {
              return [0, 1]
            }
          }
          if (get.tag(card, "recover") && player.hp >= player.maxHp - 1) {
            return [0, 0]
          }
        },
      },
    },
  },
  // 虎啸
  oldhuxiao: {
    audio: "huxiao",
    trigger: { player: "shaMiss" },
    forced: true,
    content() {
      if (player.stat[player.stat.length - 1].card.sha > 0) {
        player.stat[player.stat.length - 1].card.sha--
      }
    },
  },
  // 武继
  oldwuji: {
    audio: "wuji",
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return player.getStat("damage") >= 3
    },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "orange",
    async content(event, trigger, player) {
      player.removeSkills("oldhuxiao")
      await player.gainMaxHp()
      await player.recover()
      player.awakenSkill(event.name)
    },
  },
  // 旧灵雎
  // 焚心
  oldfenxin: {
    mode: ["identity"],
    trigger: { source: "dieBegin" },
    init(player) {
      player.storage.fenxin = false
    },
    intro: {
      content: "limited",
    },
    skillAnimation: "epic",
    animationColor: "fire",
    unique: true,
    limited: true,
    audio: "fenxin",
    mark: true,
    filter(event, player) {
      if (player.storage.fenxin) {
        return false
      }
      return (
        event.player.identity !== "zhu" &&
        player.identity !== "zhu" &&
        player.identity !== "mingzhong" &&
        event.player.identity !== "mingzhong"
      )
    },
    check(event, player) {
      if (player.identity === event.player.identity) {
        return Math.random() < 0.5
      }
      var stat = get.situation()
      switch (player.identity) {
        case "fan":
          if (stat < 0) {
            return false
          }
          if (stat === 0) {
            return Math.random() < 0.6
          }
          return true
        case "zhong":
          if (stat > 0) {
            return false
          }
          if (stat === 0) {
            return Math.random() < 0.6
          }
          return true
        case "nei":
          if (event.player.identity === "fan" && stat < 0) {
            return true
          }
          if (event.player.identity === "zhong" && stat > 0) {
            return true
          }
          if (stat === 0) {
            return Math.random() < 0.7
          }
          return false
      }
      return false
    },
    prompt(event, player) {
      return `焚心：是否与${get.translation(event.player)}交换身份牌？`
    },
    async content(event, trigger, player) {
      game.broadcastAll(
        (player, target, shown) => {
          const identity = player.identity
          player.identity = target.identity
          if (shown || player === game.me) {
            player.setIdentity()
          }
          target.identity = identity
        },
        player,
        trigger.player,
        trigger.player.identityShown,
      )
      player.line(trigger.player, "green")
      player.storage.fenxin = true
      player.awakenSkill(event.name)
    },
  },
  // 夏侯霸
  // 豹变
  baobian: {
    audio: 2,
    trigger: { player: ["phaseBefore", "changeHp"] },
    forced: true,
    popup: false,
    init(player) {
      if (game.online) {
        return
      }
      player.removeAdditionalSkill("baobian")
      var list = []
      if (player.hp <= 3) {
        //if(trigger.num!=undefined&&trigger.num<0&&player.hp-trigger.num>1) player.logSkill('baobian');
        list.push("tiaoxin")
      }
      if (player.hp <= 2) {
        list.push("paoxiao")
      }
      if (player.hp <= 1) {
        list.push("shensu")
      }
      if (list.length) {
        player.addAdditionalSkill("baobian", list)
      }
    },
    derivation: ["tiaoxin", "paoxiao", "shensu"],
    content() {
      player.removeAdditionalSkill("baobian")
      var list = []
      if (player.hp <= 3) {
        if (
          trigger.num !== undefined &&
          trigger.num < 0 &&
          player.hp - trigger.num > 1
        ) {
          player.logSkill("baobian")
        }
        list.push("tiaoxin")
      }
      if (player.hp <= 2) {
        list.push("paoxiao")
      }
      if (player.hp <= 1) {
        list.push("shensu")
      }
      if (list.length) {
        player.addAdditionalSkill("baobian", list)
      }
    },
    ai: {
      maixie: true,
      effect: {
        target(card, player, target) {
          if (get.tag(card, "damage")) {
            if (!target.hasFriend()) {
              return
            }
            if (target.hp >= 4) {
              return [0, 1]
            }
          }
          if (get.tag(card, "recover") && player.hp >= player.maxHp - 1) {
            return [0, 0]
          }
        },
      },
    },
  },
  // 大乔小乔
  // 星舞
  xingwu: {
    audio: 2,
    group: ["xingwu_color", "xingwu_color2"],
    subSkill: {
      color: {
        trigger: { player: "phaseZhunbeiBegin" },
        silent: true,
        content() {
          player.storage.xingwu_color = ["black", "red"]
        },
      },
      color2: {
        trigger: { player: "useCard" },
        silent: true,
        filter(event, player) {
          return (
            Array.isArray(player.storage.xingwu_color) &&
            _status.currentPhase === player
          )
        },
        content() {
          player.storage.xingwu_color.remove(get.color(trigger.card))
        },
      },
    },
    trigger: { player: "phaseDiscardBegin" },
    direct: true,
    filter(event, player) {
      if (!player.storage.xingwu_color) {
        return false
      }
      var length = player.storage.xingwu_color.length
      if (length === 0) {
        return false
      }
      var hs = player.getCards("h")
      if (hs.length === 0) {
        return false
      }
      if (length === 2) {
        return true
      }
      var color = player.storage.xingwu_color[0]
      for (var i = 0; i < hs.length; i++) {
        if (get.color(hs[i]) === color) {
          return true
        }
      }
      return false
    },
    intro: {
      content: "cards",
    },
    init(player) {
      player.storage.xingwu = []
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseCard(get.prompt("xingwu"), (card) =>
          _status.event.player.storage.xingwu_color.includes(get.color(card)),
        )
        .set("ai", (card) => {
          var player = _status.event.player
          if (player.storage.xingwu.length === 2) {
            if (
              !game.hasPlayer(
                (current) =>
                  current !== player &&
                  current.hasSex("male") &&
                  get.damageEffect(current, player, player) > 0 &&
                  get.attitude(player, current) < 0,
              )
            ) {
              return 0
            }
          }
          return 7 - get.value(card)
        })
        .forResult()
      if (result.bool) {
        player.logSkill("xingwu")
        if (player.storage.xingwu.length < 2) {
          player.$give(result.cards, player)
        }
        const loseNext = player.lose(result.cards, ui.special)
        player.storage.xingwu = player.storage.xingwu.concat(result.cards)
        player.markSkill("xingwu")
        player.syncStorage("xingwu")
        await loseNext
      } else {
        event.finish()
        return
      }
      if (player.storage.xingwu.length === 3) {
        player.$throw(player.storage.xingwu)
        while (player.storage.xingwu.length) {
          player.storage.xingwu.shift().discard()
        }
        player.unmarkSkill("xingwu")
        const result2 = await player
          .chooseTarget(
            (card, player, target) =>
              target !== player && target.hasSex("male"),
            "对一名男性角色造成2点伤害，弃置其装备区里的所有牌",
          )
          .set("ai", (target) => {
            var player = _status.event.player
            if (get.attitude(player, target) > 0) {
              return -1
            }
            return (
              get.damageEffect(target, player, player) +
              target.countCards("e") / 2
            )
          })
          .forResult()
        if (result2.bool) {
          const target = result2.targets[0]
          const damageNext = target.damage(2)
          event.target = target
          player.line(target, "green")
          await damageNext
        } else {
          event.finish()
          return
        }
      } else {
        event.finish()
        return
      }
      if (event.target?.isIn()) {
        const es = event.target.getCards("e")
        if (es.length) {
          await event.target.discard(es)
        }
      }
    },
    ai: {
      threaten: 1.5,
    },
  },
  // 落雁
  luoyan: {
    locked: true,
    group: ["luoyan_tianxiang", "luoyan_liuli"],
    derivation: ["tianxiang", "liuli"],
    ai: {
      combo: "xingwu",
    },
  },
  luoyan_tianxiang: {
    inherit: "tianxiang",
    filter(event, player) {
      if (!player.storage.xingwu?.length) {
        return false
      }
      if (player.hasSkill("tianxiang")) {
        return false
      }
      return lib.skill.tianxiang.filter(event, player)
    },
  },
  luoyan_liuli: {
    inherit: "liuli",
    filter(event, player) {
      if (!player.storage.xingwu?.length) {
        return false
      }
      if (player.hasSkill("liuli")) {
        return false
      }
      return lib.skill.liuli.filter(event, player)
    },
  },
  // SP夏侯氏
  // 燕语
  spyanyu: {
    audio: "yanyu",
    trigger: {
      global: "phaseUseBegin",
    },
    direct: true,
    filter(event, player) {
      return player.hasCards("he")
    },
    async content(event, trigger, player) {
      const next = player
        .chooseToDiscard({
          prompt: get.prompt2("spyanyu"),
          position: "he",
        })
        .set("logSkill", "spyanyu")
      if (player === trigger.player) {
        const map = {
          basic: 0,
          trick: 0.1,
        }
        const hs = trigger.player.getCards("h")
        let sha = false
        let jiu = false
        for (const card of hs) {
          if (!trigger.player.hasValueTarget(card)) {
            continue
          }
          if (card.name === "sha" && !sha) {
            sha = true
            map.basic += 2
          }
          if (card.name === "tao") {
            map.basic += 6
          }
          if (card.name === "jiu") {
            jiu = true
            map.basic += 2.5
          }
          if (get.type(card) === "trick") {
            map.trick += get.value(card, player, "raw")
          }
        }
        next.set("goon", map).set("ai", (card) => {
          const map = _status.event.goon
          const type = get.type(card, "trick")
          if (!map[type]) {
            return -1
          }
          return map[type] - get.value(card)
        })
      } else {
        next.set("ai", (cardx) => {
          const map = {
            basic: 0,
            trick: 0,
          }
          const hs = trigger.player.getCards("h")
          let sha = false
          let jiu = false
          for (const card of hs) {
            if (card === cardx || !trigger.player.hasValueTarget(card)) {
              continue
            }
            if (card.name === "sha" && !sha) {
              sha = true
              map.basic += 2
            }
            if (card.name === "tao") {
              map.basic += 6
            }
            if (card.name === "jiu") {
              jiu = true
              map.basic += 3
            }
            if (get.type(card) === "trick") {
              map.trick += player.getUseValue(card)
            }
          }
          const type = get.type(cardx, "trick")
          if (!map[type]) {
            return -get.value(cardx)
          }
          return map[type] - get.value(cardx)
        })
      }
      const result = await next.forResult()
      if (!result.bool || !result.cards?.length) {
        return
      }
      player.storage.spyanyu = get.type(result.cards[0], "trick")
      player.addTempSkill("spyanyu2", "phaseUseAfter")
    },
  },
  spyanyu2: {
    audio: "yanyu",
    init(player, skill) {
      player.storage[skill] = 0
    },
    onremove(player, skill) {
      delete player.storage.spyanyu
      delete player.storage.spyanyu2
    },
    trigger: {
      global: [
        "loseAfter",
        "cardsDiscardAfter",
        "loseAsyncAfter",
        "equipAfter",
      ],
    },
    direct: true,
    sourceSkill: "spyanyu",
    filter(event, player) {
      if (player.storage.spyanyu2 >= 3) {
        return false
      }
      const type = player.storage.spyanyu
      const cards = event.getd()
      return cards.some(
        (card) =>
          get.type(card, "trick") === type && get.position(card, true) === "d",
      )
    },
    async content(event, trigger, player) {
      const type = player.storage.spyanyu
      const cards = trigger
        .getd()
        .filter(
          (card) =>
            get.type(card, "trick") === type &&
            get.position(card, true) === "d",
        )
      let logged = false
      for (; cards.length && player.storage.spyanyu2 < 3; ) {
        const cardResult = await player
          .chooseCardButton({
            cards,
            prompt: "【燕语】：是否令一名角色获得其中一张牌？",
            ai: (button) =>
              button.link.name === "du" ? 10 : get.value(button.link),
          })
          .forResult()
        if (!cardResult.bool) {
          break
        }
        player.storage.spyanyu2++
        if (!logged) {
          player.logSkill("spyanyu")
          player.addExpose(0.25)
          logged = true
        }
        const card = cardResult.links[0]
        cards.remove(card)
        const targetResult = await player
          .chooseTarget({
            forced: true,
            prompt: `请选择令一名角色获得${get.translation(card)}`,
            ai: (target) => {
              const player = _status.event.player
              const card = _status.event.card
              const value = get.value(card)
              let attitude = get.attitude(player, target)
              if (
                player.storage.spyanyu2 < 3 &&
                target === _status.currentPhase &&
                target.hasValueTarget(card, null, true)
              ) {
                attitude *= 5
              } else if (
                target === player &&
                !player.hasJudge("lebu") &&
                get.type(card) === "trick"
              ) {
                attitude *= 3
              }
              if (target.hasSkillTag("nogain")) {
                attitude /= 10
              }
              return attitude * value
            },
          })
          .set("card", card)
          .forResult()
        const target = targetResult.targets[0]
        player.line(target, "green")
        await target.gain({ cards: [card], animate: "gain2" })
      }
    },
  },
  // 孝德
  xiaode: {
    audio: "qiaoshi",
    trigger: { global: "dieAfter" },
    filter(event, player) {
      return !player.hasSkill("xiaode_remove")
    },
    async cost(event, trigger, player) {
      const mainSkills =
        lib.character[trigger.player.name1 ?? trigger.player.name][3]
      const viceSkills =
        trigger.player.name2 != null
          ? lib.character[trigger.player.name2][3]
          : []
      const skills = mainSkills.concat(viceSkills)
      const isSkillAvailable = (skill) => {
        const info = get.info(skill)
        return !(
          info.charlotte ||
          info.zhuSkill ||
          (info.unique && !info.limited) ||
          info.juexingji ||
          info.dutySkill ||
          info.hiddenSkill
        )
      }
      const list = skills.filter(isSkillAvailable)
      if (!list.length) {
        return
      }
      const result = await player
        .chooseControl({
          controls: [...list, "cancel2"],
          prompt: get.prompt2("xiaode"),
          ai: () => list.randomGet(),
        })
        .forResult()
      if (result.control) {
        event.result = {
          bool: result.control !== "cancel2",
          cost_data: {
            control: result.control,
          },
        }
      }
    },
    async content(event, trigger, player) {
      const { control } = event.cost_data
      player.popup(control, "thunder")
      game.log(player, "获得了技能", `#g【${get.translation(control)}】`)
      player.addAdditionalSkill("xiaode", [control])
      player.addSkill("xiaode_remove")
    },
    subSkill: {
      remove: {
        trigger: { player: "phaseAfter" },
        charlotte: true,
        silent: true,
        async content(event, trigger, player) {
          player.removeAdditionalSkill("xiaode")
          player.removeSkill("xiaode_remove")
        },
      },
    },
  },
  // 咒缚
  zhoufu: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    filterCard: true,
    filterTarget(card, player, target) {
      return target !== player && !target.getExpansions("zhoufu_judge").length
    },
    check(card) {
      return 6 - get.value(card)
    },
    position: "h",
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      const target = event.target
      const cards = event.cards
      target.addToExpansion(cards, player, "give").gaintag.add("zhoufu_judge")
      cards[0].storage.zhoufu_source = player
      target.addTempSkill("zhoufu_judge", { player: "phaseEnd" })
    },
    ai: {
      order: 1,
      result: {
        target: -1,
      },
    },
    subSkill: {
      judge: {
        audio: "zhoufu",
        onremove: (player) => {
          const cards = player.getExpansions("zhoufu_judge")
          if (cards.length) {
            const source = cards[0].storage.zhoufu_source
            source.gain(cards, player, "give", "bySelf")
          }
        },
        intro: {
          content: "expansion",
        },
        trigger: { player: "judgeBefore" },
        forced: true,
        charlotte: true,
        filter(event, player) {
          return (
            !event.directresult && player.getExpansions("zhoufu_judge").length
          )
        },
        async content(event, trigger, player) {
          const card = player.getExpansions("zhoufu_judge")[0]
          trigger.directresult = card
        },
      },
    },
  },
  // 影兵
  yingbing: {
    audio: 2,
    trigger: { global: "judgeBefore" },
    frequent: true,
    filter(event, player) {
      return event.directresult?.hasGaintag("zhoufu_judge")
    },
    logTarget: "player",
    async content(event, trigger, player) {
      await player.draw(2)
    },
    ai: {
      combo: "zhoufu",
    },
  },
  // 狂斧
  oldkuangfu: {
    trigger: { source: "damageSource" },
    audio: "kuangfu",
    filter(event) {
      if (event._notrigger.includes(event.player)) {
        return false
      }
      return (
        event.card && event.card.name === "sha" && event.player.countCards("e")
      )
    },
    logTarget: "player",
    preHidden: true,
    check(event, player) {
      return get.attitude(player, event.player) <= 0
    },
    async content(event, trigger, player) {
      const neg = get.attitude(player, trigger.player) <= 0
      const result = await player
        .choosePlayerCard("e", trigger.player)
        .set("ai", (button) => {
          if (_status.event.neg) {
            return get.buttonValue(button)
          }
          return 0
        })
        .set("neg", neg)
        .forResult()
      if (result.bool) {
        event.card = result.links[0]
        let boolResult
        if (player.canEquip(event.card)) {
          const boolNext = player.chooseBool(
            `是否将${get.translation(event.card)}置入自己的装备区？`,
          )
          boolNext.ai = () => true
          boolResult = await boolNext.forResult()
        } else {
          event._result = { bool: false }
          boolResult = event._result
        }
        if (boolResult.bool) {
          trigger.player.$give(event.card, player, false)
          player.equip(event.card)
        } else {
          await trigger.player.discard(event.card)
        }
      } else {
        event.finish()
      }
    },
  },
  // 祖茂
  // 引兵
  yinbing: {
    trigger: { player: "phaseJieshuBegin" },
    direct: true,
    audio: 2,
    preHidden: true,
    filter(event, player) {
      return (
        player.countCards("he", { type: "basic" }) < player.countCards("he")
      )
    },
    marktext: "兵",
    async content(event, trigger, player) {
      const result = await player
        .chooseCard(
          [
            1,
            player.countCards("he") -
              player.countCards("he", { type: "basic" }),
          ],
          "he",
          get.prompt("yinbing"),
          (card) => get.type(card) !== "basic",
          "allowChooseAll",
        )
        .set("ai", (card) => 6 - get.value(card))
        .setHiddenSkill("yinbing")
        .forResult()
      if (result.bool) {
        player.logSkill("yinbing")
        const addNext = player.addToExpansion(result.cards, player, "give")
        addNext.gaintag.add("yinbing")
        await addNext
      }
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    ai: {
      effect: {
        target(card, player, target, current) {
          if (card.name === "sha" || card.name === "juedou") {
            if (current < 0) {
              return 1.2
            }
          }
        },
      },
      threaten(player, target) {
        if (target.getExpansions("yinbing").length) {
          return 2
        }
        return 1
      },
      combo: "juedi",
    },
    subSkill: {
      discard: {
        audio: "yinbing",
        trigger: { player: "damageEnd" },
        forced: true,
        filter(event, player) {
          return (
            event.card &&
            player.getExpansions("yinbing").length > 0 &&
            (event.card.name === "sha" || event.card.name === "juedou")
          )
        },
        async content(event, trigger, player) {
          const result = await player
            .chooseCardButton(
              "移去一张引兵牌",
              true,
              player.getExpansions("yinbing"),
            )
            .forResult()
          if (result.bool) {
            await player.loseToDiscardpile(result.links)
          }
        },
      },
    },
    group: "yinbing_discard",
  },
  // 绝地
  juedi: {
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return player.getExpansions("yinbing").length > 0
    },
    audio: 2,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt2("juedi"),
          true,
          (card, player, target) => player.hp >= target.hp,
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var att = get.attitude(player, target)
          if (att < 2) {
            return att - 10
          }
          var num = att / 10
          if (target === player) {
            num += player.maxHp - player.countCards("h") + 0.5
          } else {
            num += _status.event.n2 * 2
            if (target.isDamaged()) {
              if (target.hp === 1) {
                num += 3
              } else if (target.hp === 2) {
                num += 2
              } else {
                num += 0.5
              }
            }
          }
          if (target.hasJudge("lebu")) {
            num /= 2
          }
          return num
        })
        .set("n2", player.getExpansions("yinbing").length)
        .forResult()
      if (result.bool) {
        player.line(result.targets[0], "green")
        const cards = player.getExpansions("yinbing")
        if (result.targets[0] === player) {
          await player.loseToDiscardpile(cards)
          await player.draw(cards.length)
        } else {
          const target = result.targets[0]
          await player.give(cards, target, "give")
          await target.recover()
        }
      }
    },
    ai: {
      combo: "yinbing",
    },
  },
  // 旧诸葛诞
  // 举义
  oldjuyi: {
    audio: "juyi",
    derivation: ["benghuai", "oldweizhong"],
    trigger: { player: "phaseZhunbeiBegin" },
    filter(event, player) {
      return player.maxHp > game.countPlayer() && player.isDamaged()
    },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "thunder",
    async content(event, trigger, player) {
      player.awakenSkill(event.name)
      await player.drawTo(player.maxHp)
      await player.addSkills(["benghuai", "oldweizhong"])
    },
  },
  // 威重
  oldweizhong: {
    audio: "weizhong",
    inherit: "weizhong",
    async content(event, trigger, player) {
      await player.draw({
        num: 1,
      })
    },
  },
  // 旧孙鲁育
  // 魅步
  oldmeibu: {
    audio: "meibu",
    trigger: { global: "phaseUseBegin" },
    filter(event, player) {
      return (
        event.player !== player &&
        get.distance(event.player, player, "attack") > 1
      )
    },
    logTarget: "player",
    check(event, player) {
      if (get.attitude(player, event.player) >= 0) {
        return false
      }
      var e2 = player.getEquip(2)
      if (e2) {
        if (e2.name === "tengjia" || e2.name === "rewrite_tengjia") {
          return true
        }
        if (e2.name === "bagua" || e2.name === "rewrite_bagua") {
          return true
        }
      }
      return player.countCards("h", "shan") > 0
    },
    content() {
      var target = trigger.player
      target.addTempSkill("oldmeibu_viewas")
      target.addTempSkill("oldmeibu_range")
      target.storage.oldmeibu = player
      target.markSkillCharacter(
        "oldmeibu",
        player,
        "魅步",
        `锦囊牌本回合均视为【杀】且本回合${get.translation(player)}视为在攻击范围内`,
      )
    },
    ai: {
      expose: 0.2,
    },
    subSkill: {
      range: {
        mod: {
          targetInRange(card, player, target) {
            if (card.name === "sha" && target === player.storage.oldmeibu) {
              return true
            }
          },
        },
        onremove(player) {
          game.broadcast((player) => {
            if (player.marks.oldmeibu) {
              player.marks.oldmeibu.delete()
              delete player.marks.oldmeibu
            }
          }, player)
          if (player.marks.oldmeibu) {
            player.marks.oldmeibu.delete()
            delete player.marks.oldmeibu
            game.addVideo("unmark", player, "oldmeibu")
          }
        },
      },
      viewas: {
        mod: {
          cardEnabled(card, player) {
            if (card.name !== "sha" && get.type(card, "trick") === "trick") {
              return false
            }
          },
          cardUsable(card, player) {
            if (card.name !== "sha" && get.type(card, "trick") === "trick") {
              return false
            }
          },
          cardRespondable(card, player) {
            if (card.name !== "sha" && get.type(card, "trick") === "trick") {
              return false
            }
          },
          cardSavable(card, player) {
            if (card.name !== "sha" && get.type(card, "trick") === "trick") {
              return false
            }
          },
        },
        enable: ["chooseToUse", "chooseToRespond"],
        filterCard(card) {
          return get.type(card, "trick") === "trick"
        },
        viewAs: { name: "sha" },
        check() {
          return 1
        },
        ai: {
          effect: {
            target(card, player, target, current) {
              if (get.tag(card, "respondSha") && current < 0) {
                return 0.8
              }
            },
          },
          respondSha: true,
          order: 4,
          useful: -1,
          value: -1,
        },
      },
    },
  },
  // 穆穆
  oldmumu: {
    audio: "mumu",
    trigger: { player: "phaseJieshuBegin" },
    filter(event, player) {
      return (
        !player.hasHistory("sourceDamage", (evt) => evt.isPhaseUsing(player)) &&
        game.hasPlayer((current) => {
          if (current === player) {
            return current.getEquips(1).length > 0
          }
          return (
            current.getEquips(1).length > 0 || current.getEquips(2).length > 0
          )
        })
      )
    },
    direct: true,
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget(
          get.prompt("mumu"),
          "弃置场上的一张武器牌，然后摸一张牌，或者将场上的一张防具牌移动至你的装备区里（替换原防具）",
          (card, player, target) => {
            if (target === player) {
              return target.getEquips(1).length > 0
            }
            return (
              target.getEquips(1).length > 0 || target.getEquips(2).length > 0
            )
          },
        )
        .set("ai", (target) => {
          var player = _status.event.player
          var att = get.attitude(player, target)
          if (target.getEquip(2) && player.hasEmptySlot(2)) {
            return -2 * att
          }
          return -att
        })
        .forResult()
      if (!result.bool || !result.targets?.length) {
        return
      }
      const target = result.targets[0]
      const e1 = target.getEquips(1)
      const e2 = target.getEquips(2)
      event.e1 = e1
      event.e2 = e2
      let result2 = result
      if (e1.length && e2.length) {
        result2 = await player
          .chooseControl("武器牌", "防具牌")
          .set("ai", () => {
            if (_status.event.player.getEquip(2)) {
              return "武器牌"
            }
            return "防具牌"
          })
          .forResult()
      } else if (e1.length) {
        event.choice = "武器牌"
      } else {
        event.choice = "防具牌"
      }
      const choice = event.choice || result2.control
      if (choice === "武器牌") {
        if (event.e1) {
          await target.discard(event.e1)
        }
        await player.draw()
      } else {
        if (event.e2) {
          const equipNext = player.equip(event.e2[0])
          target.$give(event.e2, player)
          await equipNext
        }
      }
    },
  },
  // 旧马良
  // 协穆
  xiemu: {
    audio: 2,
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      return player.countCards("h", "sha") > 0
    },
    filterCard: { name: "sha" },
    check(card) {
      return 6 - get.value(card)
    },
    async content(event, trigger, player) {
      const list = game
        .filterPlayer((target) => {
          const group = target[get.mode() === "guozhan" ? "identity" : "group"]
          return group !== "unkonwn"
        })
        .map(
          (current) => current[get.mode() === "guozhan" ? "identity" : "group"],
        )
        .unique()
      if (player.storage.xiemu2) {
        list.removeArray(player.storage.xiemu2)
      }
      const list2 = list.slice(0)
      list2.sort((a, b) => lib.skill.xiemu.count(b) - lib.skill.xiemu.count(a))
      const result = await player
        .chooseControl(list)
        .set("prompt", "请选择一个势力")
        .set("ai", () => _status.event.group)
        .set("group", list2[0])
        .forResult()
      player.popup(result.control + 2, get.groupnature(result.control))
      game.log(player, "选择了", `#g${get.translation(result.control + 2)}`)
      player.addTempSkill("xiemu2", { player: "phaseBegin" })
      player.storage.xiemu2.add(result.control)
      player.updateMarks("xiemu2")
    },
    ai: {
      order: 1,
      result: { player: 1 },
    },
    count(group) {
      var player = _status.event.player
      return game.countPlayer(
        (current) =>
          current !== player &&
          (current[get.mode() === "guozhan" ? "identity" : "group"] ===
            group) ===
            group &&
          get.attitude(current, player) < 0,
      )
    },
  },
  xiemu2: {
    onremove: true,
    mark: true,
    forced: true,
    audio: "xiemu",
    sourceSkill: "xiemu",
    intro: {
      content(storage) {
        return `已指定${get.translation(storage)}势力`
      },
    },
    trigger: {
      target: "useCardToTargeted",
    },
    init(player) {
      if (!player.storage.xiemu2) {
        player.storage.xiemu2 = []
      }
    },
    filter(event, player) {
      if (!player.storage.xiemu2) {
        return false
      }
      if (get.color(event.card) !== "black") {
        return false
      }
      if (!event.player) {
        return false
      }
      if (
        event.player === player ||
        !player.storage.xiemu2.includes(event.player.group)
      ) {
        return false
      }
      return true
    },
    content() {
      player.draw(2)
    },
  },
  // 纳蛮
  naman: {
    audio: 2,
    trigger: { global: "respondAfter" },
    filter(event, player) {
      if (event.card.name !== "sha") {
        return false
      }
      if (event.player === player) {
        return false
      }
      if (event.cards) {
        for (var i = 0; i < event.cards.length; i++) {
          if (get.position(event.cards[i], true) === "o") {
            return true
          }
        }
      }
      return false
    },
    frequent: true,
    content() {
      var cards = trigger.cards.slice(0)
      for (var i = 0; i < cards.length; i++) {
        if (get.position(cards[i], true) !== "o") {
          cards.splice(i--, 1)
        }
      }
      game.delay(0.5)
      player.gain(cards, "gain2")
    },
  },
  // 张梁
  // 集军
  jijun: {
    marktext: "方",
    audio: 2,
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    enable: "phaseUse",
    filterCard: true,
    selectCard: [1, Infinity],
    allowChooseAll: true,
    filter(event, player) {
      return player.countCards("h") > 0
    },
    check(card) {
      var player = _status.event.player
      if (36 - player.getExpansions("jijun").length <= player.countCards("h")) {
        return 1
      }
      return 5 - get.value(card)
    },
    discard: false,
    lose: false,
    async content(event, trigger, player) {
      const { cards } = event
      await player.addToExpansion({
        cards,
        source: player,
        animate: "give",
        gaintag: ["jijun"],
      })
    },
    ai: {
      order: 1,
      result: {
        player: 1,
      },
      combo: "fangtong",
    },
  },
  // 方统
  fangtong: {
    trigger: {
      player: "phaseJieshuBegin",
    },
    audio: 2,
    forced: true,
    skillAnimation: true,
    animationColor: "metal",
    filter(event, player) {
      return player.getExpansions("jijun").length > 35
    },
    async content(event, trigger, player) {
      const winners = player.getFriends()
      game.over(player === game.me || winners.includes(game.me))
    },
    ai: {
      combo: "jijun",
    },
  },
  // 甘夫人
  // 淑慎
  oldshushen: {
    audio: "shushen",
    trigger: { player: "recoverAfter" },
    filter(event, player) {
      return game.hasPlayer((current) => current !== player) && event.num > 0
    },
    getIndex: (event) => event.num,
    async cost(event, trigger, player) {
      event.result = await player
        .chooseTarget(get.prompt2(event.skill), lib.filter.notMe)
        .set("ai", (target) => {
          const player = get.player()
          return get.attitude(player, target)
        })
        .forResult()
    },
    async content(event, trigger, player) {
      await event.targets[0].chooseDrawRecover(2, true)
    },
    ai: {
      threaten: 0.8,
      expose: 0.1,
    },
  },
  // 神智
  oldshenzhi: {
    audio: "shenzhi",
    trigger: { player: "phaseZhunbeiBegin" },
    check(event, player) {
      if (player.hp > 2) {
        return false
      }
      var cards = player.getCards("h")
      if (cards.length < player.hp) {
        return false
      }
      if (cards.length > 3) {
        return false
      }
      for (var i = 0; i < cards.length; i++) {
        if (get.value(cards[i]) > 7 || get.tag(cards[i], "recover") >= 1) {
          return false
        }
      }
      return true
    },
    filter(event, player) {
      return player.countCards("h") > 0
    },
    preHidden: true,
    async content(event, trigger, player) {
      const cards = player.getCards("h")
      event.bool = cards.length >= player.hp
      await player.discard(cards)
      if (event.bool) {
        await player.recover()
      }
    },
  },
  // 黄巾雷使
  // 符箓
  fulu: {
    trigger: { player: "useCard1" },
    filter(event, player) {
      if (event.card.name === "sha" && !game.hasNature(event.card)) {
        return true
      }
    },
    audio: true,
    check(event, player) {
      let eff = 0
      for (const target of event.targets) {
        const eff1 = get.damageEffect(target, player, player)
        const eff2 = get.damageEffect(target, player, player, "thunder")
        eff += eff2
        eff -= eff1
      }
      return eff >= 0
    },
    async content(event, trigger, player) {
      game.setNature(trigger.card, "thunder")
      if (get.itemtype(trigger.card) === "card") {
        const next = game.createEvent("fulu_clear")
        next.card = trigger.card
        event.next.remove(next)
        trigger.after.push(next)
        next.setContent(async ({ card }) => {
          game.setNature(card, [])
        })
      }
    },
  },
  // 助祭
  zhuji: {
    trigger: { global: "damageBegin1" },
    filter(event) {
      return event.source?.isIn() && event.hasNature("thunder")
    },
    check(event, player) {
      return (
        get.attitude(player, event.source) > 0 &&
        get.attitude(player, event.player) < 0
      )
    },
    prompt(event) {
      return `${get.translation(event.source)}即将对${get.translation(event.player)}造成雷电伤害，${get.prompt("zhuji")}`
    },
    logTarget: "source",
    async content(event, trigger, player) {
      trigger.source.judge().callback = lib.skill.zhuji.callback
    },
    async callback(event, trigger, player) {
      const evt = event.getParent(2)
      switch (event.judgeResult.color) {
        case "black":
          evt._trigger.num++
          break

        case "red":
          evt._trigger.source.gain(event.card, "gain2")
          break
        default:
          break
      }
    },
  },
  // 文聘
  // 镇卫
  zhenwei: {
    audio: 2,
    trigger: {
      global: "useCardToTarget",
    },
    direct: true,
    filter(event, player) {
      if (player === event.target || player === event.player) {
        return false
      }
      if (!player.countCards("he")) {
        return false
      }
      if (event.targets.length > 1) {
        return false
      }
      if (!event.target) {
        return false
      }
      if (event.target.hp >= player.hp) {
        return false
      }

      var card = event.card
      if (card.name === "sha") {
        return true
      }
      if (get.color(card) === "black" && get.type(card, "trick") === "trick") {
        return true
      }
      return false
    },
    async content(event, trigger, player) {
      let save = false
      if (get.attitude(player, trigger.target) > 2) {
        if (trigger.card.name === "sha") {
          if (
            player.countCards("h", "shan") ||
            player.getEquip(2) ||
            trigger.target.hp === 1 ||
            player.hp > trigger.target.hp + 1
          ) {
            if (
              !trigger.target.countCards("h", "shan") ||
              trigger.target.countCards("h") < player.countCards("h")
            ) {
              save = true
            }
          }
        } else if (trigger.card.name === "juedou" && trigger.target.hp === 1) {
          save = true
        } else if (
          trigger.card.name === "shunshou" &&
          get.attitude(player, trigger.player) < 0 &&
          get.attitude(trigger.player, trigger.target) < 0
        ) {
          save = true
        }
      }
      const next = player.chooseToDiscard(
        "he",
        get.prompt(event.name, trigger.target),
        `弃置一张牌，将${get.translation(trigger.card)}转移给你，或令此牌无效`,
      )
      next.logSkill = [event.name, trigger.target]
      next.set("ai", (card) => {
        if (_status.event.aisave) {
          return 7 - get.value(card)
        }
        return 0
      })
      next.set("aisave", save)
      const result = await next.forResult()
      if (result.bool) {
        const result2 = await player
          .chooseControl("转移", "失效", () => {
            var trigger = _status.event.getTrigger()
            var player = _status.event.player
            if (trigger.card.name === "sha") {
              if (player.countCards("h", "shan")) {
                return "转移"
              }
            } else if (trigger.card.name === "juedou") {
              if (player.countCards("h", "sha")) {
                return "转移"
              }
            }
            return "失效"
          })
          .set(
            "prompt",
            `将${get.translation(trigger.card)}转移给你，或令此牌无效`,
          )
          .forResult()
        if (result2.control === "转移") {
          const drawNext = player.draw()
          trigger.getParent().targets.remove(trigger.target)
          trigger.getParent().triggeredTargets2.remove(trigger.target)
          trigger.getParent().targets.push(player)
          trigger.untrigger()
          trigger.player.line(player)
          await drawNext
          await game.delayx()
        } else {
          const cards = trigger.cards.filterInD()
          if (cards.length > 0) {
            trigger.player.addSkill("zhenwei2")
            const addNext = trigger.player.addToExpansion(cards, "gain2")
            addNext.gaintag.add("zhenwei2")
            await addNext
          }
          trigger.targets.length = 0
          trigger.getParent().triggeredTargets2.length = 0
        }
      } else {
        event.finish()
        return
      }
    },
    ai: {
      threaten: 1.1,
    },
  },
  zhenwei2: {
    audio: false,
    intro: {
      content: "expansion",
      markcount: "expansion",
    },
    trigger: { global: "phaseEnd" },
    forced: true,
    charlotte: true,
    sourceSkill: "zhenwei",
    onremove(player, skill) {
      var cards = player.getExpansions(skill)
      if (cards.length) {
        player.loseToDiscardpile(cards)
      }
    },
    async content(event, trigger, player) {
      const cards = player.getExpansions("zhenwei2")
      if (cards.length) {
        await player.gain(cards, "gain2")
      }
      player.removeSkill("zhenwei2")
    },
  },
}

export default skills
