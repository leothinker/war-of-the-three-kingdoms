import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 势于吉
  // 符济
  potfuji: {
    audio: 5,
    enable: "phaseUse",
    logAudio: (index) =>
      typeof index === "number" ? `potfuji${index}.mp3` : 2,
    filter(event, player) {
      return (
        player.countCards("he") > 0 &&
        game.hasPlayer((target) => target !== player)
      )
    },
    filterCard: true,
    position: "he",
    selectCard: () => [1, Infinity],
    filterTarget: lib.filter.notMe,
    selectTarget: () => ui.selected.cards.length,
    targetprompt() {
      const links = ui.selected.cards
      return [
        "获得",
        get.translation(links[ui.selected.targets.length - 1]),
      ].join("<br>")
    },
    check(card) {
      const player = get.player()
      if (
        ui.selected.cards.length >=
        game.countPlayer((current) => {
          return current !== player && get.attitude(player, current) > 0
        })
      ) {
        return 0
      }
      return 8 - get.value(card)
    },
    multiline: true,
    multitarget: true,
    complexSelect: true,
    usable: 1,
    lose: false,
    discard: false,
    delay: false,
    async content(event, trigger, player) {
      const { targets, cards: links } = event
      await player.showCards(
        links,
        `${get.translation(player)}发动了【${get.translation(event.name)}】`,
      )
      const gain_list = targets.map((target, i) => [target, [links[i]]])
      await game
        .loseAsync({
          gain_list: gain_list,
          player: player,
          cards: links,
          giver: player,
          animate: "give",
          gaintag: ["potfuji"],
        })
        .setContent("gaincardMultiple")
      for (const list of gain_list) {
        list[0].addSkill("potfuji_effect")
      }
      if (player.isMinHandcard()) {
        player.logSkill("potfuji", null, null, null, [3])
        player.changeSkin({ characterName: "pot_yuji" }, "pot_yuji_shadow")
        get.info(event.name).dynamic(player)
        await player.draw()
        player.addTempSkill(["potfuji_sha", "potfuji_shan"], {
          player: "phaseBegin",
        })
      }
      player
        .when({ player: ["phaseBegin"] }, false)
        .assign({
          lastDo: true,
        })
        .step(async () => {
          player.changeSkin({ characterName: "pot_yuji" }, "pot_yuji")
          game.broadcastAll((player) => {
            if (player.node.potfuji_dynamic) {
              player.node.potfuji_dynamic.delete()
              player.node.potfuji_dynamic2.delete()
              delete player.node.potfuji_dynamic
              delete player.node.potfuji_dynamic2
            }
          }, player)
        })
        .finish()
    },
    dynamic(player) {
      game.broadcastAll((player) => {
        if (
          (() => {
            for (const sheet of document.styleSheets) {
              try {
                const rules = sheet.cssRules || sheet.rules
                for (const rule of rules) {
                  if (rule.selectorText === ".player .player_fuji") {
                    return false
                  }
                }
              } catch (e) {}
            }
            return true
          })()
        ) {
          lib.init.sheet(
            ".player .player_fuji { animation: game_start 0.5s; -webkit-animation: game_start 0.5s; position: absolute; width: 100%; height: 100%; left: 0; top: 0; z-index: 4; pointer-events: none; background: linear-gradient( to top, rgba(0, 255, 255, 0.3) 0%, rgba(0, 255, 255, 0.3) 60%, rgba(0, 255, 255, 0) 80%, rgba(0, 255, 255, 0) 100% );}",
          )
        }
        if (!player.node.potfuji_dynamic) {
          player.node.potfuji_dynamic = ui.create.div(
            ".player_fuji",
            player.node.avatar,
          )
          player.node.potfuji_dynamic2 = ui.create.div(
            ".player_fuji",
            player.node.avatar2,
          )
        }
      }, player)
    },
    ai: {
      order: 10,
      result: {
        target(player, target) {
          var card = ui.selected.cards[ui.selected.targets.length]
          if (!card) {
            return 0
          }
          if (get.value(card) < 0) {
            return -1
          }
          return Math.sqrt(5 - Math.min(4, target.countCards("h")))
        },
      },
    },
    subSkill: {
      effect: {
        charlotte: true,
        trigger: {
          player: ["useCard", "useCardAfter"],
          source: "damageBegin1",
        },
        mark: true,
        marktext: "符",
        intro: {
          mark(dialog, content, player) {
            const cards = player.getCards("h", (card) =>
              card.hasGaintag("potfuji"),
            )
            if (cards?.length) {
              dialog.addAuto(cards)
            } else {
              dialog.addText("无符济牌")
            }
          },
        },
        filter(event, player, name) {
          const ori_event =
            event.name === "damage" ? event.getParent("useCard") : event
          if (
            ori_event?.name !== "useCard" ||
            !player.hasHistory("lose", (evt) => {
              const evtx = evt.relatedEvent || evt.getParent()
              if (evtx !== ori_event) {
                return false
              }
              return Object.values(evt.gaintag_map).flat().includes("potfuji")
            })
          ) {
            return false
          }
          return (
            name === "useCard" ||
            ori_event.card.name === (event.name === "damage" ? "sha" : "shan")
          )
        },
        forced: true,
        logTarget: "player",
        popup: false,
        async content(event, trigger, player) {
          if (
            trigger.name === "damage" ||
            event.triggername === "useCardAfter"
          ) {
            player.logSkill("potfuji", null, null, null, [
              trigger.name === "damage" ? 4 : 5,
            ])
          }
          if (trigger.name === "damage") {
            trigger.num++
          } else if (event.triggername === "useCardAfter") {
            await player.draw()
          } else {
            const history = player.getHistory("lose", (evt) => {
                if ((evt.relatedEvent || evt.getParent()) !== trigger) {
                  return false
                }
                return Object.values(evt.gaintag_map).flat().includes("potfuji")
              })[0],
              cards = history
                .getl(player)
                .cards2.filter((card) =>
                  history.gaintag_map[card.cardid]?.includes("potfuji"),
                )
            const gains = []
            for (const card of cards) {
              const gain = get.cardPile2((gain) => !gains.includes(gain))
              if (gain) {
                gains.push(gain)
              }
            }
            if (gains.length) {
              await player.gain({ cards: gains, animate: "draw" })
            }
          }
        },
      },
      sha: {
        charlotte: true,
        mark: true,
        marktext: "杀",
        intro: {
          name: "符济 - 杀",
          content: "使用【杀】造成的伤害+1",
        },
        audio: "potfuji4.mp3",
        trigger: { player: "useCard" },
        filter(event, player) {
          return event.card.name === "sha"
        },
        forced: true,
        logTarget: "player",
        async content(event, trigger, player) {
          await player.draw()
          trigger.baseDamage ??= 1
          trigger.baseDamage++
          player
            .when({
              player: "useCardAfter",
            })
            .filter((evt) => evt === trigger)
            .step(async () => {
              player.removeSkill("potfuji_sha")
              if (!player.hasSkill("potfuji_shan")) {
                player.changeSkin({ characterName: "pot_yuji" }, "pot_yuji")
                game.broadcastAll((player) => {
                  if (player.node.potfuji_dynamic) {
                    player.node.potfuji_dynamic.delete()
                    player.node.potfuji_dynamic2.delete()
                    delete player.node.potfuji_dynamic
                    delete player.node.potfuji_dynamic2
                  }
                }, player)
              }
            })
        },
      },
      shan: {
        charlotte: true,
        mark: true,
        marktext: "闪",
        intro: {
          name: "符济 - 闪",
          content: "使用【闪】结算完毕后摸一张牌",
        },
        audio: "potfuji5.mp3",
        trigger: { player: "useCard" },
        filter(event, player) {
          return event.card.name === "shan"
        },
        forced: true,
        async content(event, trigger, player) {
          await player.draw()
          player
            .when("useCardAfter")
            .filter((evt) => evt === trigger)
            .step(async () => {
              player.removeSkill("potfuji_shan")
              await player.draw()
              if (!player.hasSkill("potfuji_sha")) {
                player.changeSkin({ characterName: "pot_yuji" }, "pot_yuji")
                game.broadcastAll((player) => {
                  if (player.node.potfuji_dynamic) {
                    player.node.potfuji_dynamic.delete()
                    player.node.potfuji_dynamic2.delete()
                    delete player.node.potfuji_dynamic
                    delete player.node.potfuji_dynamic2
                  }
                }, player)
              }
            })
        },
      },
    },
  },
  // 道转
  potdaozhuan: {
    audio: 4,
    enable: "chooseToUse",
    logAudio: (index) =>
      typeof index === "number" ? `potdaozhuan${index}.mp3` : 2,
    filter(event, player) {
      if (event.potdaozhuan) {
        return false
      }
      let num = player.countCards("he")
      if (_status.currentPhase?.isIn() && _status.currentPhase !== player) {
        num += _status.currentPhase.countCards("he")
      }
      if (num <= 0) {
        return false
      }
      return get
        .inpileVCardList((info) => {
          const name = info[2]
          if (get.type(name) !== "basic") {
            return false
          }
          return !player.getStorage("potdaozhuan_used").includes(name)
        })
        .some((card) =>
          event.filterCard(
            new lib.element.VCard({
              name: card[2],
              nature: card[3],
              isCard: true,
            }),
            player,
            event,
          ),
        )
    },
    usable: 1,
    chooseButton: {
      dialog(event, player) {
        return ui.create.dialog("道转", [
          get.inpileVCardList((info) => get.type(info[2]) === "basic"),
          "vcard",
        ])
      },
      filter(button, player) {
        const event = get.event().getParent()
        if (player.getStorage("potdaozhuan_used").includes(button.link[2])) {
          return false
        }
        return event.filterCard(
          new lib.element.VCard({
            name: button.link[2],
            nature: button.link[3],
            isCard: true,
          }),
          player,
          event,
        )
      },
      check(button) {
        const event = get.event().getParent()
        if (event.type !== "phase") {
          return 1
        }
        return get.player().getUseValue(
          new lib.element.VCard({
            name: button.link[2],
            nature: button.link[3],
            isCard: true,
          }),
        )
      },
      prompt(links, player) {
        let prompt = "将你"
        if (_status.currentPhase?.isIn() && _status.currentPhase !== player) {
          prompt += `或${get.translation(_status.currentPhase)}`
        }
        prompt += "的一张牌置入弃牌堆，"
        return `###道转###<div class="text center">${prompt}视为使用${get.translation(links[0][3]) || ""}【${get.translation(links[0][2])}】</div>`
      },
      backup(links) {
        return {
          filterCard: () => false,
          selectCard: -1,
          viewAs: {
            name: links[0][2],
            nature: links[0][3],
            isCard: true,
          },
          log: false,
          async precontent(event, trigger, player) {
            const goon =
              _status.currentPhase?.isIn() && _status.currentPhase !== player
            let prompt = "将你"
            if (goon) {
              prompt += `或${get.translation(_status.currentPhase)}`
            }
            prompt += "的一张牌置入弃牌堆"
            const dialog = [`道转：${prompt}`]
            if (player.countCards("h")) {
              dialog.push('<div class="text center">你的手牌</div>')
              dialog.push(player.getCards("h"))
            }
            if (player.countCards("e")) {
              dialog.push('<div class="text center">你的装备牌</div>')
              dialog.push(player.getCards("e"))
            }
            if (goon) {
              const target = _status.currentPhase
              if (target.countCards("h")) {
                const cards = target.getCards("h")
                dialog.push(
                  `<div class="text center">${get.translation(target)}的手牌</div>`,
                )
                if (player.hasSkillTag("viewHandcard", null, target, true)) {
                  dialog.push(cards)
                } else {
                  dialog.push([cards.slice().randomSort(), "blank"])
                }
              }
              if (target.countCards("e")) {
                dialog.push(
                  `<div class="text center">${get.translation(target)}的装备牌</div>`,
                )
                dialog.push(target.getCards("e"))
              }
            }
            const result = await player
              .chooseButton(dialog)
              .set("filterButton", (button) => {
                const card = button.link,
                  { player, useCard, targets } = get.event()
                if (!targets?.length) {
                  return true
                }
                ui.selected.cards.add(card)
                const bool = targets.some((target) => {
                  if (!lib.filter.cardEnabled(useCard, player, "forceEnable")) {
                    return false
                  }
                  return (
                    lib.filter.targetEnabled2(useCard, player, target) &&
                    lib.filter.targetInRange(useCard, player, target)
                  )
                })
                ui.selected.cards.remove(card)
                return bool
              })
              .set("useCard", event.result.card)
              .set("targets", event.result.targets)
              .set("ai", (button) => {
                const player = get.player(),
                  source = get.owner(button.link)
                return (
                  get.value(button.link, get.owner(source)) *
                  Math.sign(-get.attitude(player, source))
                )
              })
              .forResult()
            if (result?.bool) {
              player.logSkill("potdaozhuan", null, null, null, [get.rand(1, 2)])
              player.addTempSkill("potdaozhuan_used", "roundStart")
              player.markAuto("potdaozhuan_used", [event.result.card.name])
              if (result.links?.length) {
                const target = _status.currentPhase
                const owners = result.links.map((i) => get.owner(i)).unique()
                await owners[0].loseToDiscardpile(result.links)
                if (owners[0] === target) {
                  player.tempBanSkill("potdaozhuan", "roundStart")
                  player.logSkill("potdaozhuan", null, null, null, [
                    get.rand(3, 4),
                  ])
                }
              }
              return
            }
            const evt = event.getParent()
            evt.set("potdaozhuan", true)
            evt.goto(0)
          },
        }
      },
    },
    hiddenCard(player, name) {
      if (
        player.isTempBanned("potdaozhuan") ||
        player.getStat("skill").potdaozhuan
      ) {
        return false
      }
      return (
        get.type(name) === "basic" &&
        !player.getStorage("potdaozhuan_used").includes(name)
      )
    },
    ai: {
      fireAttack: true,
      respondSha: true,
      respondShan: true,
      skillTagFilter(player, tag, arg) {
        if (arg === "respond") {
          return false
        }
        return get.info("potdaozhuan").hiddenCard(
          player,
          (() => {
            switch (tag) {
              case "fireAttack":
                return "sha"
              default:
                return tag.slice("respond".length).toLowerCase()
            }
          })(),
        )
      },
      order(item, player) {
        if (player && _status.event.type === "phase") {
          let max = 0,
            names = get.inpileVCardList((info) => {
              const name = info[2]
              if (get.type(name) !== "basic") {
                return false
              }
              return !player.getStorage("potdaozhuan_used").includes(name)
            })
          names = names.map(
            (namex) =>
              new lib.element.VCard({ name: namex[2], nature: namex[3] }),
          )
          names.forEach((card) => {
            if (player.getUseValue(card) > 0) {
              const temp = get.order(card)
              if (temp > max) {
                max = temp
              }
            }
          })
          return max + (max > 0 ? 0.2 : 0)
        }
        return 10
      },
      result: {
        player(player) {
          if (_status.event.dying) {
            return get.attitude(player, _status.event.dying)
          }
          return 1
        },
      },
    },
    subSkill: {
      backup: {},
      used: {
        charlotte: true,
        onremove: true,
        intro: { content: "本轮已使用牌名：$" },
      },
    },
  },
}

export default skills
