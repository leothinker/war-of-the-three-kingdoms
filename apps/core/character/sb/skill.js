import { _status, game, get, lib, ui } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 谋曹操
  // 奸雄
  sbjianxiong: {
    audio: 2,
    trigger: { player: "damageEnd" },
    frequent: true,
    group: "sbjianxiong_mark",
    filter(event, player) {
      return (
        (get.itemtype(event.cards) === "cards" &&
          event.cards.some((i) => get.position(i, true) === "o")) ||
        2 - player.countMark("sbjianxiong") > 0
      )
    },
    prompt2(event, player) {
      const gain =
        get.itemtype(event.cards) === "cards" &&
        event.cards.some((i) => get.position(i, true) === "o")
      const draw = 2 - player.countMark("sbjianxiong")
      let str = ""
      if (gain) {
        str += `获得${get.translation(event.cards)}`
      }
      if (gain && draw > 0) {
        str += "并"
      }
      if (draw > 0) {
        str += `摸${get.cnNumber(draw)}张牌`
      }
      if (player.hasMark("sbjianxiong")) {
        str += "，然后你可以弃1枚“治世”"
      }
      return str
    },
    async content(event, trigger, player) {
      const nextEvents = []
      if (
        get.itemtype(trigger.cards) === "cards" &&
        trigger.cards.some((i) => get.position(i, true) === "o")
      ) {
        nextEvents.push(player.gain(trigger.cards, "gain2"))
      }
      const num = player.countMark("sbjianxiong")
      if (2 - num > 0) {
        nextEvents.push(player.draw(2 - num, "nodelay"))
      }
      for (const next of nextEvents) {
        await next
      }
      if (!num) {
        return
      }
      const result = await player
        .chooseBool("是否弃1枚“治世”？")
        .set("ai", () => {
          const player = _status.event.player
          const current = _status.currentPhase
          return get.distance(current, player, "absolute") > 3 && player.hp <= 2
        })
        .forResult()
      if (result.bool) {
        player.removeMark("sbjianxiong", 1)
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
          if (!get.tag(card, "damage") || player === target) {
            return
          }
          let cards = card.cards
          const evt = _status.event
          if (
            evt.player === target &&
            card.name === "damage" &&
            evt.getParent().type === "card"
          ) {
            cards = evt.getParent().cards.filterInD()
          }
          if (target.hp <= 1) {
            return
          }
          if (get.itemtype(cards) !== "cards") {
            return
          }
          for (const current of cards) {
            if (get.name(current, target) === "tao") {
              return [1, 4.5]
            }
          }
          if (get.value(cards, target) >= 7 + target.getDamagedHp()) {
            return [1, 2]
          }
          return [
            1,
            0.55 + 0.05 * Math.max(0, 2 - target.countMark("sbjianxiong")),
          ]
        },
      },
    },
    marktext: "治",
    intro: {
      name: "治世",
      name2: "治世",
      content: "mark",
    },
    subSkill: {
      mark: {
        audio: "sbjianxiong",
        trigger: { global: "phaseBefore", player: "enterGame" },
        forced: true,
        filter(event, player) {
          return event.name !== "phase" || game.phaseNumber === 0
        },
        async content(event, trigger, player) {
          const map = {}
          const list = []
          for (let i = 1; i <= 2; i++) {
            const cn = get.cnNumber(i, true)
            map[cn] = i
            list.push(cn)
          }
          list.push("cancel2")
          const result = await player
            .chooseControl({ controls: list, ai: () => get.cnNumber(2, true) })
            .set("prompt", "奸雄：获得至多2枚“治世”")
            .forResult()
          if (result.control !== "cancel2") {
            player.addMark("sbjianxiong", map[result.control])
          }
        },
      },
    },
  },
  // 清正
  qingzheng: {
    audio: 2,
    persevereSkill: false,
    trigger: { player: "phaseUseBegin" },
    filter(event, player) {
      return (
        player.countCards("h") > 0 &&
        game.hasPlayer(
          (current) => player !== current && current.countCards("h") > 0,
        )
      )
    },
    /**
     * player选择target的一种花色的牌
     * @param {Player} player
     * @param {Player} target
     */
    chooseOneSuitCard(
      player,
      target,
      force = false,
      limit,
      str = "请选择一个花色的牌",
      ai = { bool: false },
    ) {
      const { promise, resolve } = Promise.withResolvers()
      const event = _status.event
      event.selectedCards = []
      event.selectedButtons = []
      //对手牌按花色分类
      const suitCards = Object.groupBy(target.getCards("h"), (c) =>
        get.suit(c, target),
      )
      suitCards.heart ??= []
      suitCards.diamond ??= []
      suitCards.spade ??= []
      suitCards.club ??= []
      const dialog = (event.dialog = ui.create.dialog())
      dialog.classList.add("fullheight")
      event.control_ok = ui.create.control("ok", (link) => {
        _status.imchoosing = false
        event.dialog.close()
        event.control_ok?.close()
        event.control_cancel?.close()
        event._result = {
          bool: true,
          cards: event.selectedCards,
        }
        resolve(event._result)
        game.resume()
      })
      event.control_ok.classList.add("disabled")
      //如果是非强制的，才创建取消按钮
      if (!force) {
        event.control_cancel = ui.create.control("cancel", (link) => {
          _status.imchoosing = false
          event.dialog.close()
          event.control_ok?.close()
          event.control_cancel?.close()
          event._result = {
            bool: false,
          }
          resolve(event._result)
          game.resume()
        })
      }
      event.switchToAuto = () => {
        _status.imchoosing = false
        event.dialog?.close()
        event.control_ok?.close()
        event.control_cancel?.close()
        event._result = ai()
        resolve(event._result)
        game.resume()
      }
      dialog.addNewRow(str)
      const keys = Object.keys(suitCards).sort((a, b) => {
        const arr = ["spade", "heart", "club", "diamond", "none"]
        return arr.indexOf(a) - arr.indexOf(b)
      })
      //添加框
      while (keys.length) {
        const key1 = keys.shift()
        const cards1 = suitCards[key1]
        const key2 = keys.shift()
        const cards2 = suitCards[key2]
        //点击容器的回调
        /**@type {Row_Item_Option['clickItemContainer']} */
        const clickItemContainer = (container, item, allContainer) => {
          if (
            !item?.length ||
            item.some(
              (card) => !lib.filter.cardDiscardable(card, player, event.name),
            )
          ) {
            return
          }
          if (event.selectedButtons.includes(container)) {
            container.classList.remove("selected")
            event.selectedButtons.remove(container)
            event.selectedCards.removeArray(item)
          } else {
            if (event.selectedButtons.length >= limit) {
              const precontainer = event.selectedButtons[0]
              precontainer.classList.remove("selected")
              event.selectedButtons.remove(precontainer)
              const suit = get.suit(event.selectedCards[0], target),
                cards = target.getCards("h", { suit: suit })
              event.selectedCards.removeArray(cards)
            }
            container.classList.add("selected")
            event.selectedButtons.add(container)
            event.selectedCards.addArray(item)
          }
          event.control_ok.classList[
            event.selectedButtons.length === limit ? "remove" : "add"
          ]("disabled")
        }
        //给框加封条，显示xxx牌多少张
        function createCustom(suit, count) {
          return (itemContainer) => {
            function formatStr(str) {
              return str.replace(
                /(?:♥︎|♦︎)/g,
                '<span style="color: red; ">$&</span>',
              )
            }
            const div = ui.create.div(itemContainer)
            if (count) {
              div.innerHTML = formatStr(`${get.translation(suit)}牌${count}张`)
            } else {
              div.innerHTML = formatStr(`没有${get.translation(suit)}牌`)
            }
            div.css({
              position: "absolute",
              width: "100%",
              bottom: "1%",
              height: "35%",
              background: "#352929bf",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1.2em",
              zIndex: "2",
            })
          }
        }
        //框的样式，不要太宽，高度最小也要100px，防止空框没有高度
        /**@type {Row_Item_Option['itemContainerCss']} */
        const itemContainerCss = {
          border: "solid #c6b3b3 2px",
          minHeight: "100px",
        }
        if (key2) {
          dialog.addNewRow(
            {
              item: cards1,
              ItemNoclick: true, //卡牌不需要被点击
              clickItemContainer,
              custom: createCustom(key1, cards1.length), //添加封条
              itemContainerCss,
            },
            {
              item: cards2,
              ItemNoclick: true, //卡牌不需要被点击
              clickItemContainer,
              custom: createCustom(key2, cards2.length),
              itemContainerCss,
            },
          )
        } else {
          dialog.addNewRow({
            item: cards1,
            ItemNoclick: true, //卡牌不需要被点击
            clickItemContainer,
            custom: createCustom(key1, cards1.length),
            itemContainerCss,
          })
        }
      }
      game.pause()
      dialog.open()
      _status.imchoosing = true
      return promise
    },
    async cost(event, trigger, player) {
      const list = get.addNewRowList(player.getCards("h"), "suit", player)
      const limit =
        event.skill === "qingzheng" ? 3 - player.countMark("sbjianxiong") : 1
      const result = await player
        .chooseButtonTarget({
          createDialog: [
            [
              [
                [
                  `${get.prompt(event.skill)}<div class="text center">${get.translation(event.skill, "info")}</div>`,
                ],
                "addNewRow",
              ],
              [
                (dialog) => {
                  dialog.classList.add("fullheight")
                  // 不添加scroll1和scroll2的类名
                  dialog.forcebutton = false
                  dialog._scrollset = false
                },
                "handle",
              ],
              list.map((item) => [
                Array.isArray(item) ? item : [item],
                "addNewRow",
              ]),
            ],
          ],
          filterButton(button) {
            const player = get.player()
            if (
              !button.links.length ||
              button.links.some(
                (card) =>
                  !lib.filter.cardDiscardable(
                    card,
                    player,
                    get.event().getParent().skill,
                  ),
              )
            ) {
              return false
            }
            return true
          },
          selectButton: limit,
          limit,
          filterTarget(card, player, target) {
            return target !== player && target.countCards("h")
          },
          ai1(button) {
            const player = get.player()
            if (
              !game.hasPlayer(
                (current) =>
                  player !== current &&
                  current.countDiscardableCards(player, "h") > 0 &&
                  get.attitude(player, current) < 0,
              )
            ) {
              return 0
            }
            const values =
              button.links.map((i) => get.value(i)).reduce((p, c) => p + c, 0) /
              button.links.length
            if (button.links.length > 4 || values > 6) {
              return 0
            }
            return (13 - button.links.length) / values
          },
          ai2(target) {
            const player = get.player(),
              att = get.attitude(player, target)
            if (att >= 0) {
              return 0
            }
            return 1 - att / 2 + Math.sqrt(target.countCards("h"))
          },
        })
        .forResult()
      event.result = {
        bool: result?.bool,
        cost_data: result?.links,
        targets: result?.targets,
      }
      if (event.result.bool && result?.links?.length) {
        event.result.cards = player
          .getCards("h")
          .filter((card) => result.links.includes(get.suit(card, player)))
      }
    },
    async content(event, trigger, player) {
      await player.showHandcards()
      const {
        targets: [target],
        cards: cards1,
      } = event
      await player.discard(cards1)
      if (
        !target.countCards("h") ||
        lib.suits
          .slice()
          .filter((suit) =>
            target.hasCard(
              (card, playerx) => get.suit(card, playerx) === suit,
              "h",
            ),
          )
          .every((suit) =>
            target.hasCard(
              (card, playerx) =>
                get.suit(card, playerx) === suit &&
                !lib.filter.cardDiscardable(card, player),
              "h",
            ),
          )
      ) {
        if (target.countCards("h")) {
          const content = [
            `###清正###<div class="text center">${get.translation(target)}的手牌</div>`,
            target.getCards("h"),
          ]
          await player.chooseControl("ok").set("dialog", content)
        }
        return
      }
      const list = get.addNewRowList(target.getCards("h"), "suit", target)
      let result = await player
        .chooseButton(
          [
            [
              [
                [`清正：弃置${get.translation(target)}一种花色的所有牌`],
                "addNewRow",
              ],
              [
                (dialog) => {
                  dialog.classList.add("fullheight")
                  dialog.forcebutton = false
                  dialog._scrollset = false
                },
                "handle",
              ],
              list.map((item) => [
                Array.isArray(item) ? item : [item],
                "addNewRow",
              ]),
            ],
          ],
          true,
        )
        .set("filterButton", (button) => {
          const player = get.player()
          if (
            !button.links.length ||
            button.links.some(
              (card) =>
                !lib.filter.cardDiscardable(
                  card,
                  player,
                  get.event().getParent().name,
                ),
            )
          ) {
            return false
          }
          return true
        })
        .set("ai", (button) => {
          const player = get.player()
          return button.links.length
        })
        .forResult()
      if (!result?.links?.length) {
        return
      }
      let cards2 = target.getCards("h", (card) =>
        result.links.includes(get.suit(card, target)),
      )
      if (cards2.length) {
        cards2 = (await target.modedDiscard(cards2, player).forResult()).cards
      }
      if (cards1.length > cards2.length) {
        await target.damage(player)
      }
      if (event.name !== "qingzheng" || player.countMark("sbjianxiong") >= 2) {
        return
      }
      if (
        ["sbjianxiong"].some((skill) =>
          player.hasSkill(skill, null, null, false),
        )
      ) {
        result = await player
          .chooseBool("是否获得1枚“治世”？")
          .set("choice", Math.random() >= 0.5)
          .forResult()
        if (result?.bool) {
          player.addMark("sbjianxiong", 1)
        }
      }
    },
    ai: { combo: "sbjianxiong" },
  },
  // 护驾
  sbhujia: {
    audio: 2,
    trigger: { player: "damageBegin4" },
    zhuSkill: true,
    direct: true,
    filter(event, player) {
      return (
        !player.hasSkill("sbhujia_used") &&
        game.hasPlayer(
          (current) =>
            current !== player &&
            current.group === "wei" &&
            player.hasZhuSkill("sbhujia", current),
        )
      )
    },
    async content(event, trigger, player) {
      const result = await player
        .chooseTarget({
          prompt: get.prompt("sbhujia"),
          prompt2: `将${get.translation(trigger.source)}即将对你造成的${trigger.num}点伤害转移给一名其他魏势力角色`,
          filterTarget: (card, player, target) =>
            target !== player &&
            target.group === "wei" &&
            player.hasZhuSkill("sbhujia", target),
          ai: (target) => {
            const player = _status.event.player
            const evt = _status.event.getTrigger()
            return (
              get.damageEffect(target, evt.source, player, evt.nature) -
              _status.event.eff
            )
          },
        })
        .set(
          "eff",
          get.damageEffect(player, trigger.source, player, trigger.nature),
        )
        .forResult()
      if (!result.bool) {
        return
      }
      const target = result.targets[0]
      player.logSkill("sbhujia", target)
      player.addTempSkill("sbhujia_used", "roundStart")
      trigger.cancel()
      if (trigger.source) {
        await target.damage({
          source: trigger.source,
          nature: trigger.nature,
          num: trigger.num,
          card: trigger.card,
          cards: trigger.cards,
        })
        return
      }
      await target.damage({
        nosource: true,
        nature: trigger.nature,
        num: trigger.num,
        card: trigger.card,
        cards: trigger.cards,
      })
    },
    ai: {
      maixie_defend: true,
      effect: {
        target(card, player, target) {
          if (player.hasSkillTag("jueqing", false, target)) {
            return
          }
          if (
            get.tag(card, "damage") &&
            !target.hasSkill("sbhujia_used") &&
            game.hasPlayer(
              (current) =>
                current !== target &&
                current.group === "wei" &&
                target.hasZhuSkill("sbhujia", current),
            )
          ) {
            return 0.8
          }
        },
      },
      threaten(player, target) {
        if (target.countCards("h") === 0) {
          return 2
        }
      },
    },
    subSkill: {
      used: { charlotte: true },
    },
  },
}

export default skills
