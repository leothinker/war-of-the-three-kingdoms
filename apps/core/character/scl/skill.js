import { game, get, lib } from "wtk"

/** @type { importCharacterConfig["skill"] } */
const skills = {
  // 述志
  shuzhi: {
    audio: "sbjianxiong",
    trigger: { global: "phaseBefore", player: "enterGame" },
    forced: true,
    firstDo: true,
    filter(event, player) {
      return event.name !== "phase" || game.phaseNumber === 0
    },
    changeLimit(skill) {
      game.broadcastAll((skill) => {
        //限定技标签
        const info = get.info(skill)
        info.limited = true
        info.skillAnimation = true
        info.animationColor = "wood"
        //修改描述
        if (lib.dynamicTranslate[skill]) {
          lib.dynamicTranslate[skill] = `限定技，${lib.dynamicTranslate[skill]}`
        } else {
          lib.translate[`${skill}_info`] =
            `限定技，${lib.translate[`${skill}_info`]}`
        }
        game.finishSkill(skill)
      }, skill)
      return skill
    },
    async content(event, trigger, player) {
      player.addSkill(`${event.name}_limit`)
      const list = ["rejianxiong", "sclqingzheng"]
      const result = await player
        .chooseControl({
          controls: list,
          ai: () => Math.floor(Math.random() * 2),
        })
        .set("prompt", "述志：请选择为〖奸雄〗或〖清正〗添加限定技标签")
        .forResult()
      const skill = result.control
      await player.removeSkills(skill)
      const skillx = [get.info(event.name).changeLimit(skill)]
      await player.addAdditionalSkills("shuzhi", skillx, true)
      player.markAuto(event.name, skillx)
    },
    subSkill: {
      limit: {
        charlotte: true,
        silent: true,
        popup: false,
        firstDo: true,
        trigger: {
          player: ["useSkill", "logSkillBegin", "changeSkillsAfter"],
        },
        filter(event, player) {
          if (event.name === "changeSkills") {
            return (
              event.removeSkill?.length &&
              player.getStorage("shuzhi").containsSome(...event.removeSkill)
            )
          }
          if (["global", "equip"].includes(event.type)) {
            return false
          }
          const skill = get.sourceSkillFor(event)
          if (!skill || !player.getStorage("shuzhi").includes(skill)) {
            return false
          }
          return true
        },
        async content(event, trigger, player) {
          if (trigger.name === "changeSkills") {
            const skills = trigger.removeSkill
            player.unmarkAuto("shuzhi", skills)
          } else {
            const skill = get.sourceSkillFor(trigger)
            player.awakenSkill(skill)
          }
        },
      },
    },
  },
  // 清正
  sclqingzheng: {
    audio: "qingzheng",
    inherit: "qingzheng",
    async content(event, trigger, player) {
      const {
        targets: [target],
        cards: cards1,
      } = event
      await player.discard(cards1)
      await target.viewHandcards(player)
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
      const result = await player
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
    },
  },
}

export default skills
