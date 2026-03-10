import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	//庞统写法修改
	lianhuan: {
		audio: 2,
		hiddenCard(player, name) {
			return name == "tiesuo" && player.hasCard(card => get.suit(card) == "club", "sh");
		},
		enable: "chooseToUse",
		filter(event, player) {
			if (!player.hasCard(card => get.suit(card) == "club", "sh")) {
				return false;
			}
			return event.type == "phase" || event.filterCard(get.autoViewAs({ name: "tiesuo" }, "unsure"), player, event);
		},
		position: "hs",
		filterCard(card, player, event) {
			if (!event) {
				event = _status.event;
			}
			if (get.suit(card) != "club") {
				return false;
			}
			if (event.type == "phase" && get.position(card) != "s" && player.canRecast(card)) {
				return true;
			} else {
				if (game.checkMod(card, player, "unchanged", "cardEnabled2", player) === false) {
					return false;
				}
				const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
				return event._backup.filterCard(cardx, player, event);
			}
		},
		filterTarget(fuck, player, target) {
			const card = ui.selected.cards[0],
				event = _status.event,
				backup = event._backup;
			if (!card || game.checkMod(card, player, "unchanged", "cardEnabled2", player) === false) {
				return false;
			}
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			return backup.filterCard(cardx, player, event) && backup.filterTarget(cardx, player, target);
		},
		selectTarget() {
			const card = ui.selected.cards[0],
				event = _status.event,
				player = event.player,
				backup = event._backup;
			let recast = false,
				use = false;
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			if (event.type == "phase" && player.canRecast(card)) {
				recast = true;
			}
			if (card && game.checkMod(card, player, "unchanged", "cardEnabled2", player) !== false) {
				if (backup.filterCard(cardx, player, event)) {
					use = true;
				}
			}
			if (!use) {
				return [0, 0];
			} else {
				const select = backup.selectTarget(cardx, player);
				if (recast && select[0] > 0) {
					select[0] = 0;
				}
				return select;
			}
		},
		filterOk() {
			const card = ui.selected.cards[0],
				event = _status.event,
				player = event.player,
				backup = event._backup;
			const selected = ui.selected.targets.length;
			let recast = false,
				use = false;
			const cardx = get.autoViewAs({ name: "tiesuo" }, [card]);
			if (event.type == "phase" && player.canRecast(card)) {
				recast = true;
			}
			if (card && game.checkMod(card, player, "unchanged", "cardEnabled2", player) !== false) {
				if (backup.filterCard(cardx, player, event)) {
					use = true;
				}
			}
			if (recast && selected == 0) {
				return true;
			} else if (use) {
				const select = backup.selectTarget(cardx, player);
				if (select[0] <= -1) {
					return true;
				}
				return selected >= select[0] && selected <= select[1];
			}
		},
		ai1(card) {
			return 6 - get.value(card);
		},
		ai2(target) {
			const player = get.player();
			return get.effect(target, { name: "tiesuo" }, player, player);
		},
		discard: false,
		lose: false,
		delay: false,
		viewAs(cards, player) {
			return {
				name: "tiesuo",
			};
		},
		prepare: () => true,
		async precontent(event, trigger, player) {
			const result = event.result;
			if (!result?.targets?.length) {
				delete result.card;
			}
		},
		async content(event, trigger, player) {
			await player.recast(event.cards);
		},
		ai: {
			order(item, player) {
				if (game.hasPlayer(current => get.effect(current, { name: "tiesuo" }, player, player) > 0) || player.hasCard(card => get.suit(card) == "club" && player.canRecast(card), "h")) {
					return 8;
				}
				return 1;
			},
			result: { player: 1 },
		},
	},
	//新杀小加强 陈到
	dcwanglie: {
		audio: "drlt_wanglie",
		locked: false,
		mod: {
			targetInRange(card, player, target) {
				if (player.hasSkill("dcwanglie_effect", null, null, false)) {
					return true;
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			return player.isPhaseUsing() && (event.card.name == "sha" || get.type(event.card) == "trick");
		},
		preHidden: true,
		check(event, player) {
			if (player.hasSkill("dcwanglie2", null, null, false)) {
				return true;
			}
			if (["wuzhong", "kaihua", "dongzhuxianji"].includes(event.card.name)) {
				return false;
			}
			player._wanglie_temp = true;
			let eff = 0;
			for (const i of event.targets) {
				eff += get.effect(i, event.card, player, player);
			}
			delete player._wanglie_temp;
			if (eff < 0) {
				return true;
			}
			if (
				!player.countCards("h", function (card) {
					return player.hasValueTarget(card, null, true);
				})
			) {
				return true;
			}
			if (
				get.tag(event.card, "damage") &&
				!player.needsToDiscard() &&
				!player.countCards("h", function (card) {
					return get.tag(card, "damage") && player.hasValueTarget(card, null, true);
				})
			) {
				return true;
			}
			return false;
		},
		prompt2(event) {
			return "令" + get.translation(event.card) + "不能被响应，然后本阶段你使用牌只能指定自己为目标";
		},
		group: "dcwanglie_startup",
		async content(event, trigger, player) {
			trigger.nowuxie = true;
			trigger.directHit.addArray(game.players);
			player.addTempSkill("dcwanglie2", "phaseUseAfter");
		},
		subSkill: {
			startup: {
				trigger: { player: "phaseUseBegin" },
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					player.addTempSkill("dcwanglie_effect", "phaseUseAfter");
				},
			},
			effect: {
				forced: true,
				charlotte: true,
				firstDo: true,
				popup: false,
				trigger: { player: "useCard1" },
				filter(event, player) {
					return event.targets.some(target => target != player);
				},
				async content(event, trigger, player) {
					player.addMark("dcwanglie_effect", 1, false);
					if (player.countMark("dcwanglie_effect") >= 2) {
						player.removeSkill("dcwanglie_effect");
					}
				},
				onremove: true,
			},
		},
		ai: {
			//pretao:true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				//if(tag=='pretao') return true;
				if (player._wanglie_temp) {
					return false;
				}
				player._wanglie_temp = true;
				const bool = (function () {
					if (["wuzhong", "kaihua", "dongzhuxianji"].includes(arg.card.name)) {
						return false;
					}
					if (get.attitude(player, arg.target) > 0 || !player.isPhaseUsing()) {
						return false;
					}
					let cards = player.getCards("h", function (card) {
						return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card));
					});
					let sha = player.getCardUsable("sha");
					if (arg.card.name == "sha") {
						sha--;
					}
					cards = cards.filter(function (card) {
						if (card.name == "sha" && sha <= 0) {
							return false;
						}
						return player.hasValueTarget(card, null, true);
					});
					if (!cards.length) {
						return true;
					}
					if (!get.tag(arg.card, "damage")) {
						return false;
					}
					if (
						!player.needsToDiscard() &&
						!cards.filter(function (card) {
							return get.tag(card, "damage");
						}).length
					) {
						return true;
					}
					return false;
				})();
				delete player._wanglie_temp;
				return bool;
			},
		},
	},
	dcwanglie2: {
		charlotte: true,
		mod: {
			playerEnabled(card, player, target) {
				if (player != target) {
					return false;
				}
			},
		},
	},
	//周妃
	olliangyin: {
		audio: "liangyin",
		trigger: {
			global: ["loseAfter", "addToExpansionAfter", "cardsGotoSpecialAfter", "loseAsyncAfter"],
		},
		filter(event, player, name) {
			if (event.name == "lose" || event.name == "loseAsync") {
				return event.getlx !== false && event.toStorage == true;
			}
			if (event.name == "cardsGotoSpecial") {
				return !event.notrigger;
			}
			return true;
		},
		usable: 1,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "选择一名其他角色，你与其各摸一张牌", lib.filter.notMe)
				.set("ai", function (target) {
					const player = _status.event.player,
						num = player.getExpansions("olkongsheng").length - 1;
					const att = get.attitude(player, target);
					if (att <= 0) {
						return 0;
					}
					if (target.countCards("h") == num && target.isDamaged() && get.recoverEffect(target, player, player) > 0) {
						return 3 * att;
					}
					return att;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await game.asyncDraw([player, target].sortBySeat());
			await game.delayx();
			let num = player.getExpansions("olkongsheng").length;
			let check = player => {
				if (!player.isIn() || player.isHealthy()) {
					return false;
				}
				return player.countCards("h") == num;
			};
			if (check(player) || check(target)) {
				const choiceList = ["令自己回复1点体力", "令" + get.translation(target) + "回复1点体力"];
				const choices = [];
				if (check(player)) {
					choices.push("选项一");
				} else {
					choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>";
				}
				if (check(target)) {
					choices.push("选项二");
				} else {
					choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>";
				}
				choices.push("cancel2");
				const { control } = await player
					.chooseControl(choices)
					.set("choiceList", choiceList)
					.set("prompt", "良姻：是否令一名角色回复体力？")
					.set("ai", function () {
						const player = _status.event.player,
							target = _status.event.getParent().targets[0];
						let list = _status.event.controls.slice(0),
							eff1 = 0,
							eff2 = 0;
						if (list.includes("选项一")) {
							eff1 = get.recoverEffect(player, player, player);
						}
						if (list.includes("选项二")) {
							eff2 = get.recoverEffect(target, player, player);
						}
						if (eff1 > Math.max(0, eff2)) {
							return "选项一";
						}
						if (eff2 > 0) {
							return "选项二";
						}
						return "cancel2";
					})
					.forResult();
				if (control == "选项一") {
					await player.recover();
				} else if (control == "选项二") {
					await target.recover();
				}
			}
		},
		group: "olliangyin_gain",
		subSkill: {
			gain: {
				audio: "liangyin",
				trigger: {
					global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter(event, player) {
					return game.hasPlayer(function (current) {
						const evt = event.getl(current);
						return evt && (evt.xs.length > 0 || evt.ss.length > 0);
					});
				},
				usable: 1,
				async cost(event, trigger, player) {
					if (!player.countCards("he") || !game.hasPlayer(current => current != player && current.countCards("he") > 0)) {
						return;
					}
					event.result = await player
						.chooseCardTarget({
							prompt: get.prompt("olliangyin"),
							prompt2: "弃置一张牌，并令一名其他角色也弃置一张牌",
							position: "he",
							filterCard: lib.filter.cardDiscardable,
							filterTarget(card, player, target) {
								return target != player && target.countCards("he") > 0;
							},
							ai1(card) {
								let player = _status.event.player;
								if (_status.event.me) {
									if (get.position(card) === _status.event.me) {
										return 12 - player.hp - get.value(card);
									}
									return 0;
								}
								return 5 - get.value(card);
							},
							ai2(target) {
								let player = _status.event.player,
									att = get.attitude(player, target);
								if (att > 0 && (_status.event.me || target.isHealthy())) {
									return -att;
								}
								if (
									att > 0 &&
									(target.countCards("he") > target.hp ||
										target.hasCard(function (card) {
											return get.value(card, target) <= 0;
										}, "e"))
								) {
									return att;
								}
								return -att;
							},
							me: (() => {
								if (player.isHealthy() || get.recoverEffect(player, player, _status.event.player) <= 0) {
									return false;
								}
								let ph = player.countCards("h"),
									num = player.getExpansions("olkongsheng").length;
								if (ph === num) {
									if (player.hasSkillTag("noh")) {
										return "h";
									}
									return "e";
								}
								if (ph - 1 === num) {
									return "h";
								}
								return false;
							})(),
						})
						.forResult();
				},
				async content(event, trigger, player) {
					const target = event.targets[0];
					await player.discard(event.cards);
					await target.chooseToDiscard("he", true);
					await game.delayx();
					const num = player.getExpansions("olkongsheng").length;
					const check = player => {
						if (!player.isIn() || player.isHealthy()) {
							return false;
						}
						return player.countCards("h") == num;
					};
					if (check(player) || check(target)) {
						const choiceList = ["令自己回复1点体力", "令" + get.translation(target) + "回复1点体力"];
						const choices = [];
						if (check(player)) {
							choices.push("选项一");
						} else {
							choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>";
						}
						if (check(target)) {
							choices.push("选项二");
						} else {
							choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>";
						}
						choices.push("cancel2");
						const { control } = await player
							.chooseControl(choices)
							.set("choiceList", choiceList)
							.set("prompt", "良姻：是否令一名角色回复体力？")
							.set("ai", function () {
								const player = _status.event.player,
									target = _status.event.getParent().targets[0];
								let list = _status.event.controls.slice(0),
									eff1 = 0,
									eff2 = 0;
								if (list.includes("选项一")) {
									eff1 = get.recoverEffect(player, player, player);
								}
								if (list.includes("选项二")) {
									eff2 = get.recoverEffect(target, player, player);
								}
								if (eff1 > Math.max(0, eff2)) {
									return "选项一";
								}
								if (eff2 > 0) {
									return "选项二";
								}
								return "cancel2";
							})
							.forResult();
						if (control == "选项一") {
							await player.recover();
						} else if (control == "选项二") {
							await target.recover();
						}
					}
				},
			},
		},
	},
	olkongsheng: {
		audio: "kongsheng",
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.countCards("he") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard("he", [1, player.countCards("he")], get.prompt(event.skill), "将任意张牌作为“箜”置于武将牌上", "allowChooseAll")
				.set("ai", function (card) {
					const player = _status.event.player,
						num = player.getExpansions("olkongsheng") + ui.selected.cards.length;
					if (
						ui.selected.cards.length > 0 &&
						game.hasPlayer(function (current) {
							if (current.isHealthy() || get.recoverEffect(current, player, player) <= 0) {
								return false;
							}
							const num2 =
								current.countCards("h", function (card) {
									if (current != player) {
										return true;
									}
									return !ui.selected.cards.includes(card);
								}) + 1;
							return num == num2;
						})
					) {
						return 0;
					}
					if (get.type(card, null, false) == "equip") {
						for (const i of ui.selected.cards) {
							if (get.type(i, null, false) == "equip") {
								return 0;
							}
						}
						return 5 - get.value(card);
					}
					if (!player.hasValueTarget(card)) {
						return 1;
					}
					return 0;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const next = player.addToExpansion(event.cards, player, "give");
			next.gaintag.add("olkongsheng");
			await next;
		},
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		group: "olkongsheng_kessoku",
		subSkill: {
			kessoku: {
				audio: "kongsheng",
				trigger: { player: "phaseJieshuBegin" },
				forced: true,
				locked: false,
				filter(event, player) {
					return (
						player.getExpansions("olkongsheng").filter(function (card) {
							return get.type(card, null, false) != "equip";
						}).length > 0
					);
				},
				async content(event, trigger, player) {
					let cards = player.getExpansions("olkongsheng").filter(function (card) {
						return get.type(card, null, false) != "equip";
					});
					if (cards.length) {
						await player.gain(cards, "gain2");
					}
					cards = player.getExpansions("olkongsheng");
					if (cards.length <= 0) {
						return;
					}
					const result = await player.chooseTarget(true, "令一名角色使用以下装备牌", get.translation(cards)).set("ai", function (target) {
						const player = _status.event.player;
						return get.effect(target, { name: "losehp" }, player, player);
					}).forResult();
					const target = result.targets[0];
					player.line(target, "green");
					while (true) {
						const cards = player.getExpansions("olkongsheng").filter(function (i) {
							return target.hasUseTarget(i);
						});
						if (cards.length) {
							let card = cards[0];
							if (cards.length > 1) {
								const result = await target.chooseButton(true, ["选择要使用的装备牌", cards]).set("ai", function (button) {
									return get.order(button.link);
								}).forResult();
								if (!result.bool) {
									break;
								}
								card = result.links[0];
							}
							await target.chooseUseTarget(card, true);
						} else {
							break;
						}
					}
					await target.loseHp();
				},
			},
		},
	},
	//新毌丘俭
	zhengrong: {
		trigger: { player: "useCardToPlayered" },
		audio: "drlt_zhenrong",
		filter(event, player) {
			if (!event.isFirstTarget) {
				return false;
			}
			if (!["basic", "trick"].includes(get.type(event.card))) {
				return false;
			}
			if (get.tag(event.card, "damage")) {
				return game.hasPlayer(function (current) {
					return event.targets.includes(current) && current.countCards("h") >= player.countCards("h") && current.countCards("he") > 0;
				});
			}
			return false;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "将一名手牌数不小于你的目标角色的一张牌置于你的武将牌上，成为「荣」", function (card, player, target) {
					return _status.event.targets.includes(target) && target.countCards("h") >= player.countCards("h") && target.countCards("he") > 0;
				})
				.set("ai", function (target) {
					return (1 - get.attitude(_status.event.player, target)) / target.countCards("he");
				})
				.set("targets", trigger.targets)
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			const next = player.choosePlayerCard(target, "he", true);
			next.ai = get.buttonValue;
			const result = await next.forResult();
			if (result.bool) {
				const card = result.links[0];
				const next = player.addToExpansion(card, "give", "log", target);
				next.gaintag.add("zhengrong");
				await next;
			}
		},
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		marktext: "荣",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
	},
	hongju: {
		trigger: { player: "phaseZhunbeiBegin" },
		audio: "drlt_hongju",
		forced: true,
		juexingji: true,
		skillAnimation: true,
		animationColor: "thunder",
		derivation: "qingce",
		filter(event, player) {
			return player.getExpansions("zhengrong").length >= 3;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const cards = player.getExpansions("zhengrong");
			if (cards.length && player.countCards("h")) {
				const next = player.chooseToMove("征荣：是否交换“荣”和手牌？");
				next.set("list", [
					[get.translation(player) + "（你）的“荣”", cards],
					["手牌区", player.getCards("h")],
				]);
				next.set("filterMove", function (from, to) {
					return typeof to != "number";
				});
				next.set("processAI", function (list) {
					const player = _status.event.player,
						cards = list[0][1].concat(list[1][1]).sort(function (a, b) {
							return get.value(a) - get.value(b);
						}),
						cards2 = cards.splice(0, player.getExpansions("zhengrong").length);
					return [cards2, cards];
				});
				const result = await next.forResult();
				if (result.bool) {
					const pushs = result.moved[0],
						gains = result.moved[1];
					pushs.removeArray(player.getExpansions("zhengrong"));
					gains.removeArray(player.getCards("h"));
					if (pushs.length && pushs.length == gains.length) {
						const next = player.addToExpansion(pushs);
						next.gaintag.add("zhengrong");
						await next;
						await player.gain(gains, "gain2", "log");
					}
				}
			}
			await player.addSkills("qingce");
			game.log(player, "获得了技能", "#g【清侧】");
			await player.loseMaxHp();
		},
		ai: { combo: "zhengrong" },
	},
	qingce: {
		enable: "phaseUse",
		audio: "drlt_qingce",
		filter(event, player) {
			return player.getExpansions("zhengrong").length > 0 && player.countCards("h") > 0;
		},
		chooseButton: {
			dialog(event, player) {
				return ui.create.dialog("请选择要获得的「荣」", player.getExpansions("zhengrong"), "hidden");
			},
			backup(links, player) {
				return {
					card: links[0],
					filterCard: true,
					position: "h",
					filterTarget(card, player, target) {
						return target.countDiscardableCards(player, "ej") > 0;
					},
					delay: false,
					audio: "drlt_qingce",
					content: lib.skill.qingce.contentx,
					ai: {
						result: {
							target(player, target) {
								const att = get.attitude(player, target);
								if (
									att > 0 &&
									(target.countCards("j") > 0 ||
										target.countCards("e", function (card) {
											return get.value(card, target) < 0;
										}))
								) {
									return 2;
								}
								if (att < 0 && target.countCards("e") > 0 && !target.hasSkillTag("noe")) {
									return -1;
								}
								return 0;
							},
						},
					},
				};
			},
			prompt(links, player) {
				return "选择弃置一张手牌，获得" + get.translation(links[0]) + "并弃置一名角色装备区或判定区内的一张牌";
			},
		},
		async contentx(event, trigger, player) {
			const card = lib.skill.qingce_backup.card;
			await player.gain(card, "gain2", "log");
			if (event.target.countDiscardableCards(player, "ej") > 0) {
				await player.discardPlayerCard("ej", true, event.target);
			}
		},
		ai: {
			combo: "zhengrong",
			order: 8,
			result: {
				player(player) {
					if (
						game.hasPlayer(function (current) {
							const att = get.attitude(player, current);
							if ((att > 0 && current.countCards("j") > 0) || (att < 0 && current.countCards("e") > 0)) {
								return true;
							}
							return false;
						})
					) {
						return 1;
					}
					return 0;
				},
			},
		},
	},
	//阴雷
	drlt_zhenrong: {
		marktext: "荣",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		audio: 2,
		trigger: { source: "damageSource" },
		filter(event, player) {
			return event.player != player && event.player.countCards("h") > player.countCards("h");
		},
		async cost(event, trigger, player) {
			const result = await player.choosePlayerCard("hej", get.prompt(event.skill), trigger.player).set("ai", function (button) {
				const { player, target } = get.event();
				return -get.attitude(player, target) + 1;
			}).forResult();
			if (result?.bool && result.links?.length) {
				event.result = result;
				event.result.cards = result.links;
			}
		},
		async content(event, trigger, player) {
			const next = player.addToExpansion(event.cards, trigger.player, "give", "log");
			next.gaintag.add("drlt_zhenrong");
			await next;
		},
	},
	drlt_hongju: {
		skillAnimation: true,
		animationColor: "thunder",
		audio: 2,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		unique: true,
		juexingji: true,
		derivation: ["drlt_qingce"],
		filter(event, player) {
			return player.getExpansions("drlt_zhenrong").length >= 3 && game.dead.length > 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const cards = player.getExpansions("drlt_zhenrong");
			if (cards.length && player.countCards("h")) {
				const next = player.chooseToMove("征荣：是否交换“荣”和手牌？");
				next.set("list", [
					[get.translation(player) + "（你）的“荣”", cards],
					["手牌区", player.getCards("h")],
				]);
				next.set("filterMove", function (from, to) {
					return typeof to != "number";
				});
				next.set("processAI", function (list) {
					const player = _status.event.player,
						cards = list[0][1].concat(list[1][1]).sort(function (a, b) {
							return get.value(a) - get.value(b);
						}),
						cards2 = cards.splice(0, player.getExpansions("drlt_zhenrong").length);
					return [cards2, cards];
				});
				const result = await next.forResult();
				if (result.bool) {
					const pushs = result.moved[0],
						gains = result.moved[1];
					pushs.removeArray(player.getExpansions("drlt_zhenrong"));
					gains.removeArray(player.getCards("h"));
					if (pushs.length && pushs.length == gains.length) {
						const next = player.addToExpansion(pushs);
						next.gaintag.add("drlt_zhenrong");
						await next;
						await player.gain(gains, "gain2", "log");
					}
				}
			}
			await player.addSkills("drlt_qingce");
			await player.loseMaxHp();
		},
		ai: {
			combo: "drlt_zhenrong",
		},
	},
	drlt_qingce: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.getExpansions("drlt_zhenrong").length > 0;
		},
		filterTarget(card, player, target) {
			return target.countDiscardableCards(player, "ej") > 0;
		},
		async content(event, trigger, player) {
			const next = player.chooseCardButton(player.getExpansions("drlt_zhenrong"), 1, "请选择需要弃置的“荣”", true);
			next.ai = button => 6 - get.value(button.link);
			const result = await next.forResult();
			if (result.bool) {
				const cards = result.links;
				await player.loseToDiscardpile(cards);
				await player.discardPlayerCard(event.target, "ej", 1, true);
			}
		},
		ai: {
			combo: "drlt_zhenrong",
			order: 13,
			result: {
				target(player, target) {
					if (get.attitude(player, target) > 0 && target.countCards("j") > 0) {
						return 1;
					}
					return -1;
				},
			},
		},
	},
	drlt_zhengu: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					//if(target.storage.drlt_zhengu_mark&&target.storage.drlt_zhengu_mark.includes(player)) return false;
					return target != player;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					//if(target.storage.drlt_zhengu_mark&&target.storage.drlt_zhengu_mark.includes(player)) return 0;
					const num = Math.min(5, player.countCards("h")) - target.countCards("h");
					const att = get.attitude(player, target);
					return num * att;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			player.addSkill("drlt_zhengu2");
			target.addSkill("drlt_zhengu_mark");
			target.storage.drlt_zhengu_mark.push(player);
			target.markSkill("drlt_zhengu_mark");
			lib.skill.drlt_zhengu.sync(player, target);
		},
		sync(player, target) {
			const num = player.countCards("h");
			const num2 = target.countCards("h");
			if (num < num2) {
				target.chooseToDiscard(num2 - num, true, "h", "allowChooseAll");
			} else {
				target.drawTo(Math.min(5, num));
			}
		},
	},
	drlt_zhengu2: {
		audio: "drlt_zhengu",
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		logTarget: "player",
		sourceSkill: "drlt_zhengu",
		filter(event, player) {
			return event.player.storage.drlt_zhengu_mark && event.player.storage.drlt_zhengu_mark.includes(player);
		},
		async content(event, trigger, player) {
			while (trigger.player.storage.drlt_zhengu_mark.includes(player)) {
				trigger.player.storage.drlt_zhengu_mark.remove(player);
			}
			if (trigger.player.storage.drlt_zhengu_mark.length == 0) {
				trigger.player.unmarkSkill("drlt_zhengu_mark");
			}
			lib.skill.drlt_zhengu.sync(player, trigger.player);
		},
	},
	drlt_zhengu_mark: {
		charlotte: true,
		init(player, skill) {
			if (!player.storage[skill]) {
				player.storage[skill] = [];
			}
		},
		marktext: "镇",
		intro: {
			name: "镇骨",
			content: "已成为$〖镇骨〗的目标",
		},
	},
	xinfu_zuilun: {
		audio: 2,
		trigger: {
			player: "phaseJieshuBegin",
		},
		check(event, player) {
			let num = 0;
			if (
				player.hasHistory("lose", function (evt) {
					return evt.type == "discard";
				})
			) {
				num++;
			}
			if (!player.isMinHandcard()) {
				num++;
			}
			if (!player.getStat("damage")) {
				num++;
			}
			if (num == 3) {
				return player.hp >= 2;
			}
			return true;
		},
		prompt(event, player) {
			let num = 3;
			if (
				player.hasHistory("lose", function (evt) {
					return evt.type == "discard";
				})
			) {
				num--;
			}
			if (!player.isMinHandcard()) {
				num--;
			}
			if (!player.getStat("damage")) {
				num--;
			}
			return get.prompt("xinfu_zuilun") + "（可获得" + get.cnNumber(num) + "张牌）";
		},
		async content(event, trigger, player) {
			let num = 0;
			const cards = get.cards(3);
			await game.cardsGotoOrdering(cards);
			if (
				player.hasHistory("lose", function (evt) {
					return evt.type == "discard";
				})
			) {
				num++;
			}
			if (!player.isMinHandcard()) {
				num++;
			}
			if (!player.getStat("damage")) {
				num++;
			}
			if (num == 0) {
				await player.gain(cards, "draw");
				return;
			}
			let prompt = "罪论：将" + get.cnNumber(num) + "张牌置于牌堆顶";
			if (num < 3) {
				prompt += "并获得其余的牌";
			}
			const chooseToMove = player.chooseToMove(prompt, true);
			if (num < 3) {
				chooseToMove.set("list", [["牌堆顶", cards], ["获得"]]);
				chooseToMove.set("filterMove", function (from, to, moved) {
					if (to == 1 && moved[0].length <= _status.event.num) {
						return false;
					}
					return true;
				});
				chooseToMove.set("filterOk", function (moved) {
					return moved[0].length == _status.event.num;
				});
			} else {
				chooseToMove.set("list", [["牌堆顶", cards]]);
			}
			chooseToMove.set("num", num);
			chooseToMove.set("processAI", function (list) {
				const check = function (card) {
					const player = _status.event.player;
					const next = player.next;
					const att = get.attitude(player, next);
					const judge = next.getCards("j")[tops.length];
					if (judge) {
						return get.judge(judge)(card) * att;
					}
					return next.getUseValue(card) * att;
				};
				const cards = list[0][1].slice(0),
					tops = [];
				while (tops.length < _status.event.num) {
					list.sort(function (a, b) {
						return check(b) - check(a);
					});
					tops.push(cards.shift());
				}
				return [tops, cards];
			});
			let result = await chooseToMove.forResult();
			if (result.bool) {
				const list = result.moved[0];
				cards.removeArray(list);
				await game.cardsGotoPile(list.reverse(), "insert");
			}
			game.updateRoundNumber();
			if (cards.length) {
				await player.gain(cards, "draw");
				return;
			}
			const chooseTarget = player.chooseTarget("请选择一名角色，与其一同失去1点体力", true, function (card, player, target) {
				return target != player;
			});
			chooseTarget.ai = function (target) {
				return -get.attitude(_status.event.player, target);
			};
			result = await chooseTarget.forResult();
			player.line(result.targets[0], "fire");
			await player.loseHp();
			await result.targets[0].loseHp();
		},
	},
	xinfu_fuyin: {
		trigger: {
			target: "useCardToTargeted",
		},
		forced: true,
		audio: 2,
		filter(event, player) {
			if (event.player.countCards("h") < player.countCards("h")) {
				return false;
			}
			if (event.card.name != "sha" && event.card.name != "juedou") {
				return false;
			}
			return !game.hasPlayer2(function (current) {
				return (
					current.getHistory("useCard", function (evt) {
						return evt != event.getParent() && evt.card && ["sha", "juedou"].includes(evt.card.name) && evt.targets.includes(player);
					}).length > 0
				);
			});
		},
		async content(event, trigger, player) {
			trigger.getParent().excluded.add(player);
		},
		ai: {
			effect: {
				target(card, player, target) {
					let hs = player.getCards("h", i => i !== card && (!card.cards || !card.cards.includes(i))),
						num = player.getCardUsable("sha");
					if ((card.name !== "sha" && card.name !== "juedou") || hs.length < target.countCards("h")) {
						return 1;
					}
					if (
						game.hasPlayer2(function (current) {
							return (
								current.getHistory("useCard", function (evt) {
									return evt.card && ["sha", "juedou"].includes(evt.card.name) && evt.targets.includes(player);
								}).length > 0
							);
						})
					) {
						return 1;
					}
					if (card.name === "sha") {
						num--;
					}
					hs = hs.filter(i => {
						if (!player.canUse(i, target)) {
							return false;
						}
						if (i.name === "juedou") {
							return true;
						}
						if (num && i.name === "sha") {
							num--;
							return true;
						}
						return false;
					});
					if (!hs.length) {
						return "zeroplayertarget";
					}
					num = 1 - 2 / 3 / hs.length;
					return [num, 0, num, 0];
				},
			},
		},
	},
	drlt_qianjie: {
		audio: 2,
		group: ["drlt_qianjie_1", "drlt_qianjie_2", "drlt_qianjie_3"],
		locked: true,
		ai: {
			effect: {
				target(card) {
					if (card.name == "tiesuo") {
						return "zeroplayertarget";
					}
				},
			},
		},
		subSkill: {
			1: {
				audio: "drlt_qianjie",
				trigger: {
					player: "linkBegin",
				},
				forced: true,
				filter(event, player) {
					return !player.isLinked();
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				ai: {
					noLink: true,
				},
			},
			2: {
				mod: {
					targetEnabled(card, player, target) {
						if (get.type(card) == "delay") {
							return false;
						}
					},
				},
			},
			3: {
				ai: { noCompareTarget: true },
			},
		},
	},
	drlt_jueyan: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.hasEnabledSlot(1) || player.hasEnabledSlot(2) || player.hasEnabledSlot(5) || player.hasEnabledSlot("horse");
		},
		async content(event, trigger, player) {
			const { control } = await player
				.chooseToDisable(true)
				.set("ai", function (event, player, list) {
					if (list.includes("equip5") && !player.hasSkill("drlt_jueyan_effect")) {
						return "equip5";
					}
					if (list.includes("equip2")) {
						return "equip2";
					}
					if (
						list.includes("equip1") &&
						player.countCards("h", function (card) {
							return get.name(card, player) == "sha" && player.hasUseTarget(card);
						}) -
							player.getCardUsable("sha") >
							1
					) {
						return "equip1";
					}
					if (
						list.includes("equip5") &&
						player.countCards("h", function (card) {
							return get.type2(card, player) == "trick" && player.hasUseTarget(card);
						}) > 1
					) {
						return "equip5";
					}
				})
				.forResult();
			const bool = !player.hasSkill("drlt_jueyan_effect");
			switch (control) {
				case "equip1":
					player.addTempSkill("drlt_jueyan1");
					if (bool) {
						player.addSkill("drlt_jueyan_sha");
					}
					break;
				case "equip2":
					await player.draw(3);
					player[bool ? "addSkill" : "addTempSkill"]("drlt_jueyan3");
					break;
				case "equip3_4":
					player[bool ? "addSkill" : "addTempSkill"]("drlt_jueyan2");
					break;
				case "equip5":
					await player[bool ? "addSkills" : "addTempSkills"]("rejizhi");
					break;
			}
			if (bool) {
				player.addSkill("drlt_jueyan_effect");
			}
		},
		ai: {
			order: 13,
			result: {
				player(player) {
					if (player.hasEnabledSlot("equip2")) {
						return 1;
					}
					if (
						player.hasEnabledSlot("equip1") &&
						player.countCards("h", function (card) {
							return get.name(card, player) == "sha" && player.hasValueTarget(card);
						}) -
							player.getCardUsable("sha") >
							1
					) {
						return 1;
					}
					if (
						player.hasEnabledSlot("equip5") &&
						player.countCards("h", function (card) {
							return get.type2(card, player) == "trick" && player.hasUseTarget(card);
						}) > 1
					) {
						return 1;
					}
					return -1;
				},
			},
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove: true,
			},
			sha: {
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return num + 1;
						}
					},
				},
				mark: true,
				marktext: "决",
				charlotte: true,
				locked: false,
				intro: { name: "决堰 - 武器", content: "本局游戏可以多使用一张【杀】" },
			},
		},
		derivation: ["drlt_jueyan_rewrite", "rejizhi"],
	},
	rejizhi_lukang: { audio: 1 },
	drlt_jueyan1: {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + 3;
				}
			},
		},
		mark: true,
		marktext: "决",
		charlotte: true,
		locked: false,
		intro: { name: "决堰 - 武器", content: "本回合内可以多使用三张【杀】" },
	},
	drlt_jueyan2: {
		mod: {
			targetInRange(card, player, target, now) {
				return true;
			},
		},
		mark: true,
		marktext: "决",
		charlotte: true,
		locked: false,
		intro: { name: "决堰 - 坐骑", content: "使用牌没有距离限制" },
	},
	drlt_jueyan3: {
		mod: {
			maxHandcard(player, num) {
				return num + 3;
			},
		},
		mark: true,
		marktext: "决",
		charlotte: true,
		locked: false,
		intro: { name: "决堰 - 防具", content: "手牌上限+3" },
	},
	drlt_poshi: {
		audio: 2,
		skillAnimation: true,
		animationColor: "wood",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		juexingji: true,
		derivation: ["drlt_huairou"],
		filter(event, player) {
			return !player.hasEnabledSlot() || player.hp == 1;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			const num = player.maxHp - player.countCards("h");
			if (num > 0) {
				await player.draw(num);
			}
			await player.changeSkills(["drlt_huairou"], ["drlt_jueyan"]);
		},
	},
	drlt_huairou: {
		audio: 2,
		enable: "phaseUse",
		position: "he",
		filter: (event, player) => player.hasCard(card => lib.skill.drlt_huairou.filterCard(card, player), lib.skill.drlt_huairou.position),
		filterCard: (card, player) => get.type(card) == "equip" && player.canRecast(card),
		check(card) {
			if (get.position(card) == "e") {
				return 0.5 - get.value(card, get.player());
			}
			if (!get.player().canEquip(card)) {
				return 5;
			}
			return 3 - get.value(card);
		},
		async content(event, trigger, player) {
			await player.recast(event.cards);
		},
		discard: false,
		lose: false,
		delay: false,
		prompt: "重铸一张装备牌",
		ai: {
			order: 10,
			result: {
				player: 1,
			},
		},
	},
	drlt_yongsi: {
		audio: 2,
		group: ["drlt_yongsi_1", "drlt_yongsi_2"],
		locked: true,
		subSkill: {
			1: {
				audio: "drlt_yongsi",
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					trigger.num = game.countGroup();
				},
			},
			2: {
				audio: "drlt_yongsi",
				trigger: {
					player: "phaseUseEnd",
				},
				forced: true,
				filter(event, player) {
					let num = 0;
					player.getHistory("sourceDamage", function (evt) {
						if (evt.getParent("phaseUse") == event) {
							num += evt.num;
						}
					});
					return !num || num > 1;
				},
				async content(event, trigger, player) {
					let numx = 0;
					player.getHistory("sourceDamage", function (evt) {
						if (evt.getParent("phaseUse") == trigger) {
							numx += evt.num;
						}
					});
					if (!numx) {
						const num = player.hp - player.countCards("h");
						if (num > 0) {
							await player.draw(num);
						}
					} else {
						player.addTempSkill("drlt_yongsi1", { player: "phaseDiscardAfter" });
					}
				},
			},
		},
	},
	drlt_yongsi1: {
		mod: {
			maxHandcard(player, num) {
				return num + player.maxHp - 2 * Math.max(0, player.hp);
			},
		},
	},
	drlt_weidi: {
		audio: 2,
		forceaudio: true,
		zhuSkill: true,
		trigger: { player: "phaseDiscardBegin" },
		filter(event, player) {
			if (!player.hasZhuSkill("drlt_weidi")) {
				return false;
			}
			return (
				player.needsToDiscard() > 0 &&
				game.countPlayer(function (current) {
					return current != player && current.group == "qun";
				}) > 0
			);
		},
		async cost(event, trigger, player) {
			const num = Math.min(
				player.needsToDiscard(),
				game.countPlayer(function (target) {
					return target != player && target.group == "qun";
				})
			);
			if (!num) {
				return;
			}
			event.result = await player
				.chooseCardTarget({
					prompt: get.prompt(event.skill),
					prompt2: "你可以将" + (num > 1 ? "至多" : "") + get.cnNumber(num) + "张手牌交给等量的其他群势力角色。先按顺序选中所有要给出的手牌，然后再按顺序选择等量的目标角色",
					selectCard: [1, num],
					selectTarget() {
						return ui.selected.cards.length;
					},
					filterTarget(card, player, target) {
						return target != player && target.group == "qun";
					},
					complexSelect: true,
					filterOk() {
						return ui.selected.cards.length == ui.selected.targets.length;
					},
					ai1(card) {
						const player = _status.event.player;
						const value = get.value(card, player, "raw");
						if (
							game.hasPlayer(function (target) {
								return target != player && target.group == "qun" && !ui.selected.targets.includes(target) && get.sgn(value) == get.sgn(get.attitude(player, target));
							})
						) {
							return 1 / Math.max(1, get.useful(card));
						}
						return -1;
					},
					ai2(target) {
						const player = _status.event.player;
						const card = ui.selected.cards[ui.selected.targets.length];
						if (card && get.value(card, player, "raw") < 0) {
							return -get.attitude(player, target);
						}
						return get.attitude(player, target);
					},
				})
				.forResult();
			if (event.result.bool) {
				event.result.bool = event.result.cards.length > 0;
			}
		},
		async content(event, trigger, player) {
			const list = [];
			for (let i = 0; i < event.targets.length; i++) {
				const target = event.targets[i];
				const card = event.cards[i];
				list.push([target, card]);
			}
			await game
				.loseAsync({
					gain_list: list,
					player: player,
					cards: event.cards,
					giver: player,
					animate: "giveAuto",
				})
				.setContent("gaincardMultiple");
		},
	},
	drlt_xiongluan: {
		audio: 2,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || !player.isPhaseUsing() || player.needsToDiscard() || !get.tag(card, "damage")) {
					return;
				}
				return 0;
			},
			aiUseful(player, card, num) {
				if (num <= 0 || !get.tag(card, "damage")) {
					return;
				}
				return num * player.getHp();
			},
		},
		locked: false,
		enable: "phaseUse",
		skillAnimation: true,
		animationColor: "gray",
		limited: true,
		filter(event, player) {
			return !player.isDisabledJudge() || player.hasEnabledSlot();
		},
		filterTarget(card, player, target) {
			return target != player;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const disables = [];
			for (let i = 1; i <= 5; i++) {
				for (let j = 0; j < player.countEnabledSlot(i); j++) {
					disables.push(i);
				}
			}
			if (disables.length > 0) {
				await player.disableEquip(disables);
			}
			await player.disableJudge();
			const { target } = event;
			player.addTempSkill(event.name + "_effect");
			player.markAuto(event.name + "_effect", [target]);
			target.addTempSkill(event.name + "_ban");
		},
		ai: {
			order: 13,
			result: {
				target: (player, target) => {
					let hs = player.countCards("h", card => {
							if (!get.tag(card, "damage") || get.effect(target, card, player, player) <= 0) {
								return 0;
							}
							if (get.name(card, player) === "sha") {
								if (target.getEquip("bagua")) {
									return 0.5;
								}
								if (target.getEquip("rewrite_bagua")) {
									return 0.25;
								}
							}
							return 1;
						}),
						ts =
							target.hp +
							target.hujia +
							game.countPlayer(current => {
								if (get.attitude(current, target) > 0) {
									return current.countCards("hs") / 8;
								}
								return 0;
							});
					if (hs >= ts) {
						return -hs;
					}
					return 0;
				},
			},
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove: true,
				mod: {
					targetInRange(card, player, target) {
						if (player.getStorage("drlt_xiongluan_effect").includes(target)) {
							return true;
						}
					},
					cardUsableTarget(card, player, target) {
						if (player.getStorage("drlt_xiongluan_effect").includes(target)) {
							return true;
						}
					},
				},
				intro: { content: "本回合对$使用牌无距离和次数限制且其不能使用和打出手牌" },
			},
			ban: {
				charlotte: true,
				mark: true,
				mod: {
					cardEnabled2(card, player) {
						if (get.position(card) == "h") {
							return false;
						}
					},
				},
				intro: { content: "本回合不能使用或打出手牌" },
				ai: {
					effect: {
						target(card, player, target) {
							if (!target._drlt_xiongluan2_effect && get.tag(card, "damage")) {
								target._drlt_xiongluan2_effect = true;
								const eff = get.effect(target, card, player, target);
								delete target._drlt_xiongluan2_effect;
								if (eff > 0) {
									return [1, -999999];
								}
								if (eff < 0) {
									return 114514;
								}
							}
						},
					},
				},
			},
		},
	},
	drlt_congjian: {
		audio: 2,
		audioname2: { tongyuan: "ocongjian_tongyuan" },
		trigger: { target: "useCardToTargeted" },
		filter(event, player) {
			return get.type(event.card) == "trick" && event.targets.length > 1 && player.countCards("he") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					filterCard: true,
					position: "he",
					filterTarget(card, player, target) {
						return player != target && _status.event.targets.includes(target);
					},
					ai1(card) {
						const player = get.player();
						if (card.name == "du") {
							return 20;
						}
						if (player.storage.drlt_xiongluan && get.type(card) == "equip") {
							return 15;
						}
						return 6 - get.value(card);
					},
					ai2(target) {
						const player = get.player();
						const att = get.attitude(player, target);
						if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
							if (target.hasSkillTag("nodu")) {
								return 0.1;
							}
							return 1 - att;
						}
						return att - 3;
					},
					prompt: get.prompt2(event.skill),
					targets: trigger.targets,
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			await player.give(event.cards, target, "give");
			const num = get.type(event.cards[0]) == "equip" ? 2 : 1;
			await player.draw(num);
		},
	},
	drlt_wanglie: {
		locked: false,
		mod: {
			targetInRange(card, player, target, now) {
				if (game.online) {
					if (!player.countUsed()) {
						return true;
					}
				} else {
					const evt = _status.event.getParent("phaseUse");
					if (
						evt &&
						evt.name == "phaseUse" &&
						player.getHistory("useCard", function (evt2) {
							return evt2.getParent("phaseUse") == evt;
						}).length == 0
					) {
						return true;
					}
				}
			},
		},
		audio: 2,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			return player.isPhaseUsing() && (event.card.name == "sha" || get.type(event.card) == "trick");
		},
		preHidden: true,
		check(event, player) {
			if (["wuzhong", "kaihua", "dongzhuxianji"].includes(event.card.name)) {
				return false;
			}
			player._wanglie_temp = true;
			let eff = 0;
			for (const i of event.targets) {
				eff += get.effect(i, event.card, player, player);
			}
			delete player._wanglie_temp;
			if (eff < 0) {
				return true;
			}
			if (
				!player.countCards("h", function (card) {
					return player.hasValueTarget(card, null, true);
				})
			) {
				return true;
			}
			if (
				get.tag(event.card, "damage") &&
				!player.needsToDiscard() &&
				!player.countCards("h", function (card) {
					return get.tag(card, "damage") && player.hasValueTarget(card, null, true);
				})
			) {
				return true;
			}
			return false;
		},
		prompt2(event) {
			return "令" + get.translation(event.card) + "不能被响应，然后本阶段不能再使用牌";
		},
		async content(event, trigger, player) {
			trigger.nowuxie = true;
			trigger.directHit.addArray(game.players);
			player.addTempSkill("drlt_wanglie2", "phaseUseAfter");
		},
		ai: {
			pretao: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag == "pretao") {
					return true;
				}
				if (player._wanglie_temp) {
					return false;
				}
				player._wanglie_temp = true;
				const bool = (function () {
					if (["wuzhong", "kaihua", "dongzhuxianji"].includes(arg.card.name)) {
						return false;
					}
					if (get.attitude(player, arg.target) > 0 || !player.isPhaseUsing()) {
						return false;
					}
					let cards = player.getCards("h", function (card) {
						return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card));
					});
					let sha = player.getCardUsable("sha");
					if (arg.card.name == "sha") {
						sha--;
					}
					cards = cards.filter(function (card) {
						if (card.name == "sha" && sha <= 0) {
							return false;
						}
						return player.hasValueTarget(card, null, true);
					});
					if (!cards.length) {
						return true;
					}
					if (!get.tag(arg.card, "damage")) {
						return false;
					}
					if (
						!player.needsToDiscard() &&
						!cards.filter(function (card) {
							return get.tag(card, "damage");
						}).length
					) {
						return true;
					}
					return false;
				})();
				delete player._wanglie_temp;
				return bool;
			},
		},
	},
	drlt_wanglie2: {
		mod: {
			cardEnabled(card, player) {
				return false;
			},
		},
	},
	liangyin: {
		audio: 2,
		group: ["liangyin_1", "liangyin_2"],
		subSkill: {
			1: {
				audio: "liangyin",
				trigger: {
					global: ["loseAfter", "addToExpansionAfter", "cardsGotoSpecialAfter", "loseAsyncAfter"],
				},
				filter(event, player, name) {
					if (event.name == "lose" || event.name == "loseAsync") {
						return event.getlx !== false && event.toStorage == true;
					}
					if (event.name == "cardsGotoSpecial") {
						return !event.notrigger;
					}
					return true;
				},
				async cost(event, trigger, player) {
					const next = player.chooseTarget("是否发动【良姻】令手牌数大于你的一名角色摸一张牌？", function (card, player, target) {
						return target != player && target.countCards("h") > player.countCards("h");
					});
					next.ai = function (target) {
						const player = get.player();
						return get.attitude(player, target);
					};
					event.result = await next.forResult();
				},
				async content(event, trigger, player) {
					await event.targets[0].draw();
				},
			},
			2: {
				audio: "liangyin",
				trigger: {
					global: "gainAfter",
				},
				filter(event, player) {
					return (
						event.fromStorage == true ||
						game.hasPlayer2(function (current) {
							const evt = event.getl(current);
							return evt && evt.xs && evt.xs.length > 0;
						})
					);
				},
				async cost(event, trigger, player) {
					const next = player.chooseTarget("是否发动【良姻】令手牌数小于你的一名角色弃置一张牌？", function (card, player, target) {
						return target != player && target.countCards("h") < player.countCards("h") && target.countCards("he") > 0;
					});
					next.ai = function (target) {
						const player = get.player();
						return -get.attitude(player, target);
					};
					event.result = await next.forResult();
				},
				async content(event, trigger, player) {
					await event.targets[0].chooseToDiscard("he", 1, true);
				},
			},
		},
	},
	kongsheng: {
		audio: 2,
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.countCards("he") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard(get.prompt(event.skill), "将任意张牌置于武将牌上", "he", [1, player.countCards("he")], "allowChooseAll")
				.set("ai", function (card) {
					const player = get.player();
					if (get.position(card) == "e") {
						return 1 - get.value(card);
					}
					if (card.name == "shan" || card.name == "du" || !player.hasValueTarget(card)) {
						return 1;
					}
					return 4 - get.value(card);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			player.addSkill("kongsheng2");
			const next = player.addToExpansion(event.cards, "log", "give", player);
			next.gaintag.add("kongsheng2");
			await next;
		},
	},
	kongsheng_ai: { ai: { reverseOrder: true } },
	kongsheng2: {
		audio: "kongsheng",
		marktext: "箜",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		trigger: {
			player: "phaseJieshuBegin",
		},
		sourceSkill: "kongsheng",
		filter(event, player) {
			return player.getExpansions("kongsheng2").length > 0;
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			player.addTempSkill("kongsheng_ai", "kongsheng2After");
			while (true) {
				const cards = player.getExpansions("kongsheng2").filter(function (i) {
					return get.type(i, null, false) == "equip" && player.hasUseTarget(i);
				});
				if (cards.length > 0) {
					let [card] = cards;
					if (cards.length > 1) {
						const result = await player.chooseButton(true, ["选择要使用的装备牌", cards]).set("ai", function (button) {
							return get.order(button.link);
						}).forResult();
						if (!result.bool) {
							continue;
						}
						[card] = result.links;
					}
					await player.chooseUseTarget(card, true);
				} else {
					break;
				}
			}
			const cards2 = player.getExpansions("kongsheng2");
			if (cards2.length) {
				await player.gain(cards2, "gain2");
			}
		},
	},
	nzry_juzhan: {
		audio: ["nzry_juzhan_11.mp3", "nzry_juzhan_12.mp3"],
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				if (storage) {
					return "当你使用【杀】指定一名角色为目标后，你可以获得其一张牌，然后你本回合内不能再对其使用牌";
				}
				return "当你成为其他角色【杀】的目标后，你可以与其各摸一张牌，然后其本回合内不能再对你使用牌";
			},
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (!player.storage.nzry_juzhan) {
				return player != event.player;
			}
			return player == event.player && event.target.countGainableCards(player, "he");
		},
		logTarget(event, player) {
			return player.storage.nzry_juzhan ? event.target : event.player;
		},
		check(event, player) {
			const target = get.info("nzry_juzhan").logTarget(event, player);
			return get.attitude(player, target) < 0;
		},
		prompt2(event, player) {
			const target = get.info("nzry_juzhan").logTarget(event, player);
			return player.storage.nzry_juzhan ? `获得${get.translation(target)}一张牌，然后你本回合内不能再对其使用牌` : `与${get.translation(target)}各摸一张牌，然后其本回合内不能再对你使用牌`;
		},
		async content(event, trigger, player) {
			const { name: skill } = event,
				target = get.info(skill).logTarget(trigger, player);
			player.changeZhuanhuanji(skill);
			const storage = player.storage[skill];
			const list = [player, target];
			if (storage) {
				await game.asyncDraw([player, target].sortBySeat());
				await game.delayx();
				list.reverse();
			} else {
				await player.gainPlayerCard(target, "he", true);
			}
			list[0].addTempSkill(skill + "_effect");
			list[0].markAuto(skill + "_effect", [list[1]]);
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove: true,
				mod: {
					playerEnabled(card, player, target) {
						if (player.getStorage("nzry_juzhan_effect").includes(target)) {
							return false;
						}
					},
				},
				intro: { content: "本回合不能对$使用牌" },
			},
		},
	},
	nzry_feijun: {
		init: player => {
			if (!Array.isArray(player.storage.nzry_feijun)) {
				player.storage.nzry_feijun = [];
			}
		},
		intro: {
			content(storage) {
				if (!storage || !storage.length) {
					return "尚未发动";
				}
				const str = get.translation(storage);
				return "已对" + str + "发动过〖飞军〗";
			},
		},
		mark: true,
		enable: "phaseUse",
		usable: 1,
		position: "he",
		audio: 2,
		filter(event, player) {
			return (
				game.hasPlayer(function (current) {
					return current.countCards("h") >= player.countCards("h");
				}) ||
				game.hasPlayer(function (current) {
					return current.countCards("e") >= player.countCards("e");
				}) > 0
			);
		},
		filterCard: true,
		check(card) {
			return 5 - get.value(card);
		},
		async content(event, trigger, player) {
			const list = [];
			if (
				game.hasPlayer(function (current) {
					return current.countCards("h") > player.countCards("h");
				})
			) {
				list.push("令一名手牌数大于你的角色交给你一张牌");
			}
			if (
				game.hasPlayer(function (current) {
					return current.countCards("e") > player.countCards("e");
				}) > 0
			) {
				list.push("令一名装备区内牌数大于你的角色弃置一张装备牌");
			}
			if (list.length == 0) {
				return;
			}
			let index;
			if (list.length < 2) {
				if (
					game.hasPlayer(function (current) {
						return current.countCards("h") > player.countCards("h");
					})
				) {
					index = 0;
				} else {
					index = 1;
				}
			} else {
				({ index } = await player
					.chooseControl()
					.set("ai", function () {
						if (
							game.hasPlayer(function (current) {
								return current.countCards("h") > player.countCards("h") && get.attitude(player, current) < 0;
							})
						) {
							return 0;
						}
						return 1;
					})
					.set("choiceList", list)
					.forResult());
			}
			let result;
			if (index == 0) {
				result = await player
					.chooseTarget(function (card, player, target) {
						return target != player && target.countCards("h") > player.countCards("h");
					}, "选择一名手牌数大于你的角色")
					.set("ai", function (target) {
						return -get.attitude(player, target);
					})
					.forResult();
			} else {
				const next = player.chooseTarget(function (card, player, target) {
					return target.countCards("e") > player.countCards("e") && target != player;
				}, "选择一名装备区里牌数大于你的角色");
				next.ai = function (target) {
					return -get.attitude(player, target);
				};
				result = await next.forResult();
			}
			if (!result.bool) {
				return;
			}
			const target = result.targets[0];
			const list2 = player.getStorage("nzry_feijun");
			if (!list2.includes(target)) {
				event._nzry_binglve = true;
				player.markAuto("nzry_feijun", [target]);
			}
			player.line(target, "green");
			if (index == 0) {
				const result = await target
					.chooseCard("he", true, "选择一张牌交给" + get.translation(player))
					.set("ai", function (card) {
						return 6 - get.value(card);
					})
					.forResult();
				if (result.bool) {
					target.give(result.cards, player);
				}
			} else {
				await target.chooseToDiscard("he", true, { type: "equip" }, "请弃置一张装备牌");
			}
		},
		ai: {
			order: 11,
			result: {
				player(player) {
					if (
						game.hasPlayer(function (current) {
							return (current.countCards("h") > player.countCards("h") || current.countCards("e") > player.countCards("e")) && get.attitude(player, current) < 0 && player.getStorage("nzry_feijun").includes(current);
						}) ||
						game.hasPlayer(function (current) {
							return current.countCards("h") > player.countCards("h") && get.attitude(player, current) < 0;
						}) ||
						(player.countCards("h") >= 2 &&
							game.hasPlayer(function (current) {
								return current.countCards("e") > player.countCards("e") && get.attitude(player, current) < 0;
							}))
					) {
						return 1;
					}
				},
			},
		},
	},
	nzry_binglve: {
		audio: 2,
		trigger: { player: "nzry_feijunAfter" },
		forced: true,
		filter(event, player) {
			return event._nzry_binglve == true;
		},
		async content(event, trigger, player) {
			await player.draw(2);
		},
		ai: { combo: "nzry_feijun" },
	},
	nzry_huaiju_ai: {
		charlotte: true,
		ai: {
			filterDamage: true,
			skillTagFilter(player, tag, arg) {
				if (!player.hasMark("nzry_huaiju")) {
					return false;
				}
				if (
					!game.hasPlayer(function (current) {
						return current.hasSkill("tachibana_effect");
					})
				) {
					return false;
				}
				if (arg && arg.player) {
					if (arg.player.hasSkillTag("jueqing", false, player)) {
						return false;
					}
				}
			},
		},
	},
	nzry_huaiju: {
		marktext: "橘",
		intro: {
			name: "怀橘",
			name2: "橘",
			content: "当前有#个“橘”",
		},
		audio: 2,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			player.addMark("nzry_huaiju", 3);
			player.addSkill("nzry_huaiju_ai");
		},
		group: ["tachibana_effect"],
	},
	//没错 这是个橘
	tachibana_effect: {
		audio: "nzry_huaiju",
		sourceSkill: "nzry_huaiju",
		trigger: {
			global: ["damageBegin4", "phaseDrawBegin2"],
		},
		forced: true,
		filter(event, player) {
			return event.player.hasMark("nzry_huaiju") && (event.name == "damage" || !event.numFixed);
		},
		async content(event, trigger, player) {
			player.line(trigger.player, "green");
			if (trigger.name == "damage") {
				trigger.cancel();
				trigger.player.removeMark("nzry_huaiju", 1);
			} else {
				trigger.num++;
			}
		},
	},
	nzry_yili: {
		audio: 2,
		trigger: { player: "phaseUseBegin" },
		async cost(event, trigger, player) {
			const next = player.chooseTarget(get.prompt(event.skill), "移去一个【橘】或失去1点体力，然后令一名其他角色获得一个【橘】", function (card, player, target) {
				return target != player;
			});
			next.ai = function (target) {
				const player = _status.event.player;
				if (player.storage.nzry_huaiju > 2 || player.hp > 2) {
					return get.attitude(player, target);
				}
				return -1;
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			let index = 0;
			if (player.hasMark("nzry_huaiju")) {
				({ index } = await player
					.chooseControl()
					.set("choiceList", ["失去1点体力", "移去一个“橘”"])
					.set("ai", function () {
						if (player.hp > 2) {
							return 0;
						}
						return 1;
					})
					.forResult());
			}
			if (index == 1) {
				player.removeMark("nzry_huaiju", 1);
			} else {
				await player.loseHp();
			}
			target.addMark("nzry_huaiju", 1);
			target.addSkill("nzry_huaiju_ai");
		},
		ai: {
			combo: "nzry_huaiju",
		},
	},
	nzry_zhenglun: {
		audio: 2,
		trigger: {
			player: "phaseDrawBefore",
		},
		filter(event, player) {
			return !player.hasMark("nzry_huaiju");
		},
		check(event, player) {
			return player.countCards("h") >= 2 || player.skipList.includes("phaseUse");
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.addMark("nzry_huaiju", 1);
		},
		ai: {
			combo: "nzry_huaiju",
		},
	},
	nzry_kuizhu: {
		audio: 2,
		trigger: {
			player: "phaseDiscardAfter",
		},
		filter(event, player) {
			const cards = [];
			player.getHistory("lose", function (evt) {
				if (evt.type == "discard" && evt.getParent("phaseDiscard") == event) {
					cards.addArray(evt.cards2);
				}
			});
			return cards.length > 0;
		},
		async cost(event, trigger, player) {
			const cards = [];
			player.getHistory("lose", function (evt) {
				if (evt.type == "discard" && evt.getParent("phaseDiscard") == trigger) {
					cards.addArray(evt.cards2);
				}
			});
			event.num = cards.length;
			event.str1 = "令至多" + event.num + "名角色摸一张牌";
			event.str2 = "对任意名体力值之和为" + event.num + "的角色造成1点伤害";
			const result = await player
				.chooseControl("cancel2")
				.set("ai", function () {
					const player = get.player();
					const { num } = get.event().getParent();
					if (
						game.countPlayer(function (current) {
							return get.attitude(player, current) < 0 && current.hp == num;
						}) > 0 &&
						num <= 3
					) {
						return 1;
					}
					return 0;
				})
				.set("choiceList", [event.str1, event.str2])
				.set("prompt", "是否发动【溃诛】？")
				.forResult();
			if (result.control == "cancel2") {
				return;
			}
			if (result.index == 1) {
				event.result = await player
					.chooseTarget("请选择〖溃诛〗造成伤害的目标", function (card, player, target) {
						const num = ui.selected.targets.map(t => t.hp).reduce((a, b) => a + b, 0);
						return num + target.hp <= _status.event.num;
					})
					.set("filterOk", function () {
						const num = ui.selected.targets.map(t => t.hp).reduce((a, b) => a + b);
						return num == _status.event.num;
					})
					.set("ai", function (target) {
						const player = get.player();
						if (ui.selected.targets[0] != undefined) {
							return -1;
						}
						return get.attitude(player, target) < 0;
					})
					.set("complexTarget", true)
					.set("promptbar", "none")
					.set("num", event.num)
					.set("selectTarget", [1, Infinity])
					.forResult();
				event.result.cost_data = "damage";
			} else {
				const next = player.chooseTarget("请选择〖溃诛〗摸牌的目标", [1, event.num]);
				next.ai = function (target) {
					const player = get.player();
					return get.attitude(player, target);
				};
				event.result = await next.forResult();
			}
		},
		async content(event, trigger, player) {
			const targets = event.targets.sortBySeat();
			if (event.cost_data == "damage") {
				await Promise.all(targets.map(target => target.damage()));
			} else {
				game.asyncDraw(targets);
			}
		},
	},
	rechezheng: {
		audio: "nzry_zhizheng",
		trigger: { source: "damageBegin2" },
		filter(event, player) {
			return player.isPhaseUsing() && !player.inRangeOf(event.player);
		},
		forced: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			effect: {
				player(card, player, target) {
					if (target && get.tag(card, "damage") && !player.inRangeOf(target)) {
						return "zeroplayertarget";
					}
				},
			},
		},
	},
	nzry_zhizheng: {
		audio: 2,
		//mod:{
		//	playerEnabled:function(card,player,target){
		//		const info=get.info(card);
		//		if(target!=player&&(!info||!info.singleCard||!ui.selected.targets.length)&&player.isPhaseUsing()&&!target.inRange(player)) return false;
		//	},
		//},
		trigger: {
			player: "phaseUseEnd",
		},
		forced: true,
		filter(event, player) {
			return (
				player.getHistory("useCard", function (evt) {
					return evt.getParent("phaseUse") == event;
				}).length <
					game.countPlayer(function (current) {
						return current != player && !current.inRange(player);
					}) &&
				game.hasPlayer(function (target) {
					return target != player && !target.inRange(player) && target.countDiscardableCards(player, "he");
				})
			);
		},
		async content(event, trigger, player) {
			const next = player.chooseTarget("请选择〖掣政〗的目标", "弃置一名攻击范围内不包含你的角色的一张牌", true, function (card, player, target) {
				return target != player && !target.inRange(player) && target.countDiscardableCards(player, "he");
			});
			next.ai = function (target) {
				return -get.attitude(player, target);
			};
			const result = await next.forResult();
			if (result.bool) {
				player.line(result.targets);
				player.discardPlayerCard(result.targets[0], "he", 1, true);
			}
		},
		group: "rechezheng",
	},
	nzry_lijun: {
		global: "nzry_lijun1",
		audio: "nzry_lijun1",
		zhuSkill: true,
	},
	nzry_lijun2: {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + player.countMark("nzry_lijun2");
				}
			},
		},
		charlotte: true,
		onremove: true,
	},
	nzry_lijun1: {
		audio: 2,
		//forceaudio:true,
		trigger: {
			player: "useCardAfter",
		},
		log: false, // 实际发动者是主公，所以给牌的人不log喵
		filter(event, player) {
			if (event.card.name != "sha" || player.group != "wu") {
				return false;
			}
			if (player.hasSkill("nzry_lijun2")) {
				return false;
			}
			if (!player.isPhaseUsing()) {
				return false;
			}
			if (
				!game.hasPlayer(function (target) {
					return player != target && target.hasZhuSkill("nzry_lijun", player);
				})
			) {
				return false;
			}
			for (let i = 0; i < event.cards.length; i++) {
				if (get.position(event.cards[i], true) == "o") {
					return true;
				}
			}
			return false;
		},
		async cost(event, trigger, player) {
			const list = game.filterPlayer(function (target) {
				return player != target && target.hasZhuSkill("nzry_lijun", player);
			});
			const next = player.chooseTarget(get.prompt("nzry_lijun"), "将" + get.translation(trigger.cards) + "交给" + get.translation(list) + (list.length > 1 ? "中的一人" : ""), function (card, player, target) {
				return player != target && target.hasZhuSkill("nzry_lijun", player);
			});
			next.ai = function (target) {
				return get.attitude(_status.event.player, target);
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			player.addTempSkill("nzry_lijun2", "phaseUseEnd");
			const [zhu] = event.targets;
			player.line(zhu, "green");
			zhu.logSkill("nzry_lijun"); // 给牌的人去logSkill好像还是不太好喵？
			const list = trigger.cards.filter(function (card) {
				return get.position(card, true) == "o";
			});
			const next = zhu.gain(list, "gain2");
			next.giver = player;
			await next;
			const result = await zhu
				.chooseBool()
				.set("ai", function () {
					if (get.attitude(zhu, player) > 0) {
						return true;
					}
					return false;
				})
				.set("prompt", "是否令" + get.translation(player) + "摸一张牌？")
				.forResult();
			if (!result.bool) {
				return;
			}
			await player.draw();
			player.addMark("nzry_lijun2", 1, false);
		},
	},
	nzry_chenglve: {
		audio: 2,
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				const num = storage ? 2 : 1;
				return `出牌阶段限一次，你可以摸${get.cnNumber(num)}张牌，然后弃置${get.cnNumber(3 - num)}张手牌。若如此做，直到本回合结束，你使用与弃置牌花色相同的牌无距离和次数限制`;
			},
		},
		enable: "phaseUse",
		usable: 1,
		async content(event, trigger, player) {
			player.changeZhuanhuanji("nzry_chenglve");
			const num = player.storage.nzry_chenglve ? 1 : 2;
			await player.draw(num);
			if (!player.hasCard(card => lib.filter.cardDiscardable(card, player, "nzry_chenglve"), "h")) {
				return;
			}
			await game.delayx();
			const { bool, cards } = await player.chooseToDiscard(true, "h", 3 - num).set("ai", card => {
				const player = get.player(),
					effect = player.getStorage("nzry_chenglve_effect");
				const cards = player.getCards("h").filter(i => get.tag(i, "damage") && get.type(i) != "delay" && player.hasValueTarget(i, true, false)),
					map = {};
				for (const cardx of cards) {
					const suit = get.suit(cardx, player);
					if (typeof map[suit] != "number") {
						map[suit] = 0;
					}
					map[suit]++;
				}
				const list = [];
				for (let i in map) {
					if (map[i] > 0) {
						list.push([i, map[i]]);
					}
				}
				list.sort((a, b) => b[1] - a[1]);
				if (effect.includes(get.suit(card, player))) {
					return 0;
				}
				if (list.some(i => i[0] == get.suit(card, player)) && !player.hasUseTarget(card, false)) {
					return 10;
				}
				if (player.storage.nzry_chenglve && ui.selected.cards.length && !ui.selected.cards.some(i => get.suit(i) == get.suit(card, player))) {
					return 2;
				}
				return 6 - get.value(card);
			}).forResult();
			if (bool) {
				const effect = "nzry_chenglve_effect";
				player.addTempSkill(effect);
				player.markAuto(effect, cards.map(card => get.suit(card, player)).unique());
				player.storage[effect].sort((a, b) => lib.suits.indexOf(b) - lib.suits.indexOf(a));
				player.addTip(effect, get.translation(effect) + player.getStorage(effect).reduce((str, suit) => str + get.translation(suit), ""));
			}
		},
		ai: {
			order(item, player) {
				if (player.countCards("h", card => get.tag(card, "damage") && get.type(card) != "delay" && player.hasValueTarget(card, true, false)) > 2) {
					return get.order({ name: "sha" }) + 0.14;
				}
				return 2.7;
			},
			result: {
				player(player) {
					if (!player.storage.nzry_chenglve && player.countCards("h") < 3) {
						return 0;
					}
					return 1;
				},
			},
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove(player, skill) {
					delete player.storage[skill];
					player.removeTip(skill);
				},
				mod: {
					cardUsable(card, player) {
						const suit = get.suit(card);
						if (suit == "unsure" || player.getStorage("nzry_chenglve_effect").includes(suit)) {
							return Infinity;
						}
					},
					targetInRange(card, player) {
						const suit = get.suit(card);
						if (suit == "unsure" || player.getStorage("nzry_chenglve_effect").includes(suit)) {
							return true;
						}
					},
				},
				marktext: "略",
				intro: { content: `本回合使用$花色的牌无距离和次数限制` },
			},
		},
	},
	nzry_shicai: {
		audio: "nzry_shicai_2",
		locked: false,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || player.nzry_shicai_aiOrder || get.itemtype(card) !== "card" || player.hasSkillTag("abnormalDraw")) {
					return num;
				}
				let type = get.type2(card, false);
				if (
					player.hasHistory("useCard", evt => {
						return get.type2(evt.card, false) == type;
					})
				) {
					return num;
				}
				player.nzry_shicai_aiOrder = true;
				let val = player.getUseValue(card, true, true);
				delete player.nzry_shicai_aiOrder;
				return 20 * val;
			},
		},
		trigger: { player: ["useCardAfter", "useCardToTargeted"] },
		prompt2(event, player) {
			const cards = event.cards.filterInD("oe");
			return "你可以将" + get.translation(cards) + (cards.length > 1 ? "以任意顺序" : "") + "置于牌堆顶，然后摸一张牌";
		},
		filter(event, player) {
			if (!event.cards.someInD()) {
				return false;
			}
			let evt = event,
				type = get.type2(evt.card, false);
			if (event.name == "useCardToTargeted") {
				if (type != "equip" || player != event.target) {
					return false;
				}
				evt = evt.getParent();
			} else {
				if (type == "equip") {
					return false;
				}
			}
			return !player.hasHistory(
				"useCard",
				evtx => {
					return evtx != evt && get.type2(evtx.card, false) == type;
				},
				evt
			);
		},
		check(event, player) {
			if (get.type(event.card) == "equip") {
				if (get.subtype(event.card) == "equip6") {
					return true;
				}
				if (get.equipResult(player, player, event.card) <= 0) {
					return true;
				}
				const eff1 = player.getUseValue(event.card);
				const subtype = get.subtype(event.card);
				return (
					player.countCards("h", function (card) {
						return get.subtype(card) == subtype && player.getUseValue(card) >= eff1;
					}) > 0
				);
			}
			return true;
		},
		async content(event, trigger, player) {
			let cards = trigger.cards.filterInD();
			if (cards.length > 1) {
				const result = await player
					.chooseToMove("恃才：将牌按顺序置于牌堆顶", true)
					.set("list", [["牌堆顶", cards]])
					.set("reverse", _status.currentPhase?.next && get.attitude(player, _status.currentPhase.next) > 0)
					.set("processAI", function (list) {
						const cards = list[0][1].slice(0);
						cards.sort(function (a, b) {
							return (_status.event.reverse ? 1 : -1) * (get.value(b) - get.value(a));
						});
						return [cards];
					})
					.forResult();
				if (!result.bool) {
					return;
				}
				cards = result.moved[0];
			}
			cards.reverse();
			await game.cardsGotoPile(cards, "insert");
			game.log(player, "将", cards, "置于了牌堆顶");
			await player.draw();
		},
		subSkill: { 2: { audio: 2 } },
		ai: {
			reverseOrder: true,
			skillTagFilter(player) {
				if (
					player.getHistory("useCard", function (evt) {
						return get.type(evt.card) == "equip";
					}).length > 0
				) {
					return false;
				}
			},
			effect: {
				target_use(card, player, target) {
					if (
						player == target &&
						get.type(card) == "equip" &&
						!player.getHistory("useCard", function (evt) {
							return get.type(evt.card) == "equip";
						}).length
					) {
						return [1, 3];
					}
				},
			},
		},
	},
	nzry_cunmu: {
		audio: 2,
		audioname: ["ol_pengyang"],
		trigger: {
			player: "drawBegin",
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.bottom = true;
		},
		ai: {
			abnormalDraw: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "abnormalDraw") {
					return !arg || arg === "bottom";
				}
			},
		},
	},
	nzry_mingren: {
		audio: "nzry_mingren_1",
		drawNum: 2,
		audioname: ["sb_yl_luzhi"],
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && !player.getExpansions("nzry_mingren").length;
		},
		async content(event, trigger, player) {
			await player.draw(get.info(event.name).drawNum || 2);
			if (!player.countCards("h")) {
				return;
			}
			const result = await player.chooseCard("h", "将一张手牌置于武将牌上，称为“任”", true).set("ai", function (card) {
				return 6 - get.value(card);
			}).forResult();
			if (result.bool) {
				const next = player.addToExpansion(result.cards[0], player, "give", "log");
				next.gaintag.add("nzry_mingren");
				await next;
			}
		},
		marktext: "任",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		group: ["nzry_mingren_1"],
		ai: { notemp: true },
		subSkill: {
			1: {
				audio: 2,
				audioname: ["sb_yl_luzhi"],
				trigger: { player: "phaseJieshuBegin" },
				filter(event, player) {
					return player.countCards("h") > 0 && player.getExpansions("nzry_mingren").length > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseCard("h", get.prompt(event.skill), "选择一张手牌替换“任”（" + get.translation(player.getExpansions("nzry_mingren")[0]) + "）")
						.set("ai", function (card) {
							const player = _status.event.player;
							const color = get.color(card);
							if (color == get.color(player.getExpansions("nzry_mingren")[0])) {
								return false;
							}
							let num = 0;
							const list = [];
							player.countCards("h", function (cardx) {
								if (cardx != card || get.color(cardx) != color) {
									return false;
								}
								if (list.includes(cardx.name)) {
									return false;
								}
								list.push(cardx.name);
								switch (cardx.name) {
									case "wuxie":
										num += game.countPlayer() / 2.2;
										break;
									case "caochuan":
										num += 1.1;
										break;
									case "shan":
										num += 1;
										break;
								}
							});
							return num * (30 - get.value(card));
						})
						.forResult();
				},
				async content(event, trigger, player) {
					// 考虑到getExpansions的实际执行在addToExpansion之前喵，此处调换顺序
					const card = player.getExpansions("nzry_mingren")[0];
					const next = player.addToExpansion(event.cards[0], "log", "give", player);
					next.gaintag.add("nzry_mingren");
					await next;
					if (card) {
						await player.gain(card, "gain2");
					}
				},
			},
		},
	},
	nzry_zhenliang: {
		audio: ["nzry_zhenliang_11.mp3", "nzry_zhenliang_12.mp3"],
		drawNum: 1,
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage) {
				if (storage) {
					return "当你于回合外使用或打出的牌结算完成后，若此牌与“任”颜色相同，则你可以令一名角色摸一张牌。";
				}
				return "出牌阶段限一次，你可以弃置一张与“任”颜色相同的牌并对攻击范围内的一名角色造成1点伤害。";
			},
		},
		enable: "phaseUse",
		trigger: {
			player: ["useCardAfter", "respondAfter"],
		},
		filter(event, player) {
			const cards = player.getExpansions("nzry_mingren");
			if (!cards.length) {
				return false;
			}
			if (event.name == "chooseToUse") {
				if (player.storage.nzry_zhenliang || player.hasSkill("nzry_zhenliang_used", null, null, false)) {
					return false;
				}
				const color = get.color(cards[0]);
				if (!player.countCards("he", card => get.color(card) == color)) {
					return false;
				}
				return game.hasPlayer(current => player.inRange(current));
			} else {
				if (_status.currentPhase == player || !player.storage.nzry_zhenliang) {
					return false;
				}
				return get.color(event.card) == get.color(cards[0]);
			}
		},
		position: "he",
		filterCard(card, player) {
			return get.color(card) == get.color(player.getExpansions("nzry_mingren")[0]);
		},
		filterTarget(card, player, target) {
			return player.inRange(target);
		},
		check(card) {
			return 6.5 - get.value(card);
		},
		prompt: "弃置一张与“任”颜色相同的牌，并对攻击范围内的一名角色造成1点伤害。",
		async cost(event, trigger, player) {
			const skillName = event.name.slice(0, -5),
				num = get.info(skillName).drawNum;
			event.result = await player
				.chooseTarget(get.prompt(skillName), `令${(num > 1 ? "至多" : "") + get.cnNumber(num)}名角色${num > 1 ? "各" : ""}摸${get.cnNumber(num)}张牌`)
				.set("selectTarget", [1, num])
				.set("ai", target => {
					const player = get.player();
					return get.effect(target, { name: "draw" }, player, player);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const skill = event.name;
			player.changeZhuanhuanji(skill);
			if (!trigger) {
				const target = event.target;
				player.addTempSkill(skill + "_used", "phaseUseAfter");
				await target.damage("nocard");
			} else {
				const targets = event.targets;
				if (targets.length === 1) {
					await targets[0].draw(get.info(skill).drawNum);
				} else {
					await game.asyncDraw(targets, get.info(skill).drawNum);
					await game.delayx();
				}
			}
		},
		ai: {
			order: 5,
			result: {
				player(player, target) {
					return get.damageEffect(target, player, player);
				},
			},
			combo: "nzry_mingren",
		},
		subSkill: { used: { charlotte: true } },
	},
	nzry_jianxiang: {
		audio: 2,
		trigger: { target: "useCardToTargeted" },
		filter(event, player) {
			return event.player != player && game.hasPlayer(current => current.isMinHandcard());
		},
		async cost(event, trigger, player) {
			const next = player.chooseTarget(get.prompt(event.skill), "令场上手牌数最少的一名角色摸一张牌", function (card, player, target) {
				return target.isMinHandcard();
			});
			next.ai = function (target) {
				const player = get.player();
				return get.attitude(player, target);
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			await event.targets[0].draw();
		},
	},
	nzry_shenshi: {
		audio: ["nzry_shenshi_11.mp3", "nzry_shenshi_12.mp3"],
		mark: true,
		locked: false,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				if (storage) {
					return "其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若此牌仍在该角色的手牌区或装备区，你将手牌摸至四张";
				}
				return "出牌阶段限一次，你可以将一张牌交给一名手牌数最多的角色，然后对其造成1点伤害，若该角色因此死亡，则你可以令一名角色将手牌摸至四张";
			},
		},
		enable: "phaseUse",
		trigger: { global: "damageSource" },
		filter(event, player) {
			if (!player.countCards("he")) {
				return false;
			}
			if (event.name == "chooseToUse") {
				return !player.storage.nzry_shenshi && !player.hasSkill("nzry_shenshi_used", null, null, false) && game.hasPlayer(current => get.info("nzry_shenshi").filterTarget(null, player, current));
			}
			return event.source?.isIn() && event.source != player && event.player == player && player.storage.nzry_shenshi;
		},
		discard: false,
		line: true,
		lose: false,
		delay: false,
		position: "he",
		filterCard: true,
		filterTarget(card, player, target) {
			return target != player && !game.hasPlayer(current => current != player && current.countCards("h") > target.countCards("h"));
		},
		check(card) {
			if (get.position(card) == "h") {
				return 1;
			}
			return 5 - get.value(card);
		},
		async cost(event, trigger, player) {
			const { source } = trigger;
			const { bool } = await player
				.chooseBool(get.prompt(event.name.slice(0, -5), source))
				.set("choice", (source.countCards("h") <= source.getHp() && player.countCards("h") < 4 && !source.hasSkillTag("nogain")) || get.attitude(player, source) > 0)
				.set("prompt2", "其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若此牌仍在该角色的手牌区或装备区，你将手牌摸至四张")
				.forResult();
			event.result = {
				bool: bool,
				targets: [source],
			};
		},
		prompt: "出牌阶段限一次，你可以将一张牌交给一名手牌数最多的角色，然后对其造成1点伤害，若该角色因此死亡，则你可以令一名角色将手牌摸至四张",
		async content(event, trigger, player) {
			const target = event.targets[0];
			player.changeZhuanhuanji(event.name);
			if (!trigger) {
				player.addTempSkill(event.name + "_used", "phaseUseAfter");
				await player.give(event.cards, target);
				await target.damage("nocard");
				if (
					!game.getGlobalHistory("everything", evt => {
						if (evt.name != "die" || evt.player != target) {
							return false;
						}
						return evt.reason?.getParent() == event;
					}).length ||
					!game.hasPlayer(current => current.countCards("h") < 4)
				) {
					return;
				}
				const result = await player
					.chooseTarget("令一名角色将手牌摸至四张", (card, player, target) => {
						return target.countCards("h") < 4;
					})
					.set("ai", target => {
						return get.attitude(player, target);
					})
					.forResult();
				if (result.bool) {
					player.line(result.targets);
					await result.targets[0].drawTo(4);
				}
			} else {
				await player.viewHandcards(target);
				const result = await player.chooseToGive(target, "he", true, `交给${get.translation(target)}一张牌`).set("ai", card => {
					return 5 - get.value(card);
				}).forResult();
				if (result.bool) {
					const card = result.cards[0];
					target.addGaintag(result.cards, event.name);
					player
						.when({ global: "phaseJieshuBegin" })
						.filter(evt => evt.getParent() == trigger.getParent("phase", true) && target.getCards("he").includes(card) && player.countCards("h") < 4)
						.step(async () => {
							target.removeGaintag(event.name);
							await player.drawTo(4);
						});
				}
			}
		},
		ai: {
			order: 1,
			result: {
				target(player, target) {
					return get.damageEffect(target, player, target);
				},
			},
		},
		subSkill: { used: { charlotte: true } },
	},
	xinjushou: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		async content(event, trigger, player) {
			await player.draw(4);
			await player.turnOver();
			const result = await player
				.chooseCard("h", true, "弃置一张手牌，若以此法弃置的是装备牌，则你改为使用之")
				.set("ai", function (card) {
					if (get.type(card) == "equip") {
						return 5 - get.value(card);
					}
					return -get.value(card);
				})
				.set("filterCard", lib.filter.cardDiscardable)
				.forResult();
			if (result.bool && result.cards.length) {
				const card = result.cards[0];
				if (get.type(card) == "equip" && player.hasUseTarget(card)) {
					player.chooseUseTarget(card, true, "nopopup");
				} else {
					player.discard(card);
				}
			}
		},
	},
	xinjiewei: {
		audio: 2,
		enable: "chooseToUse",
		filterCard: true,
		position: "e",
		viewAs: { name: "wuxie" },
		filter(event, player) {
			return player.countCards("e") > 0;
		},
		viewAsFilter(player) {
			return player.countCards("e") > 0;
		},
		prompt: "将一张装备区内的牌当无懈可击使用",
		check(card) {
			return 8 - get.equipValue(card);
		},
		threaten: 1.2,
		group: "xinjiewei_move",
		subSkill: {
			move: {
				trigger: { player: "turnOverEnd" },
				audio: "jiewei",
				filter(event, player) {
					return !player.isTurnedOver() && player.canMoveCard();
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseToDiscard("he", get.prompt("xinjiewei"), "弃置一张牌并移动场上的一张牌", lib.filter.cardDiscardable)
						.set("ai", function (card) {
							if (!_status.event.check) {
								return 0;
							}
							return 7 - get.value(card);
						})
						.set("check", player.canMoveCard(true))
						.forResult();
				},
				async content(event, trigger, player) {
					await player.moveCard(true);
				},
			},
		},
	},
	jianchu: {
		audio: 2,
		audioname: ["re_pangde"],
		trigger: { player: "useCardToPlayered" },
		filter(event, player) {
			return event.card.name == "sha" && event.target.countDiscardableCards(player, "he") > 0;
		},
		preHidden: true,
		check(event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		logTarget: "target",
		async content(event, trigger, player) {
			const result = await player
				.discardPlayerCard(trigger.target, get.prompt("jianchu", trigger.target), true)
				.set("ai", function (button) {
					if (!_status.event.att) {
						return 0;
					}
					if (get.position(button.link) == "e") {
						if (get.subtype(button.link) == "equip2") {
							return 5 * get.value(button.link);
						}
						return get.value(button.link);
					}
					return 1;
				})
				.set("att", get.attitude(player, trigger.target) <= 0)
				.forResult();
			if (result.bool && result.links && result.links.length) {
				if (get.type(result.links[0], null, result.links[0].original == "h" ? player : false) == "equip") {
					trigger.getParent().directHit.add(trigger.target);
				} else if (trigger.cards) {
					const list = [];
					for (let i = 0; i < trigger.cards.length; i++) {
						if (get.position(trigger.cards[i], true) == "o") {
							list.push(trigger.cards[i]);
						}
					}
					if (list.length) {
						trigger.target.gain(list, "gain2", "log");
					}
				}
			}
		},
		ai: {
			unequip_ai: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag == "directHit_ai") {
					return (
						arg.card.name == "sha" &&
						arg.target.countCards("e", function (card) {
							return get.value(card) > 1;
						}) > 0
					);
				}
				if (arg && arg.name == "sha" && arg.target.getEquip(2)) {
					return true;
				}
				return false;
			},
		},
	},
	redimeng: {
		audio: "dimeng",
		enable: "phaseUse",
		usable: 1,
		position: "he",
		filterCard() {
			if (ui.selected.targets.length == 2) {
				return false;
			}
			return true;
		},
		selectCard: [0, Infinity],
		selectTarget: 2,
		complexCard: true,
		complexSelect: true,
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			if (ui.selected.targets.length == 0) {
				return true;
			}
			return Math.abs(ui.selected.targets[0].countCards("h") - target.countCards("h")) == ui.selected.cards.length;
		},
		multitarget: true,
		multiline: true,
		async content(event, trigger, player) {
			// 改到一半发现又没人用这个技能
			// 心态炸了喵_(:з」∠)_
			const [target, target1] = event.targets;
			const cards = target.getCards("h").concat(target1.getCards("h"));
			event.dialogRef = true;
			const videoId = lib.status.videoId++;
			game.broadcastAll(
				function (cards, id, player, targets) {
					const dialog = ui.create.dialog("缔盟", true);
					if (player.isUnderControl(true) || targets[0].isUnderControl(true) || targets[1].isUnderControl(true)) {
						dialog.add(cards);
						dialog.seeing = true;
					} else {
						dialog.add([cards, "blank"]);
					}
					_status.dieClose.push(dialog);
					dialog.videoId = id;
					if (_status.event.dialogRef) {
						_status.event.dialog = dialog;
					}
				},
				cards,
				videoId,
				player,
				event.targets
			);
			game.addVideo("cardDialog", null, ["缔盟", get.cardsInfo(cards), videoId]);
			delete event.dialogRef;
			const dialog = event.dialog;
			let current = target;
			let num1 = 0;
			let num2 = 0;
			await game.delay();
			while (dialog.buttons.length) {
				let card;
				if (dialog.buttons.length > 1) {
					const next = current.chooseButton(true, function (button) {
						return get.value(button.link, _status.event.player);
					});
					next.set("dialog", get.idDialog(videoId));
					next.set("closeDialog", false);
					next.set("dialogdisplay", true);
					const result = await next.forResult();
					if (!result.bool) {
						return;
					}
					card = result.links[0];
				} else {
					card = dialog.buttons[0].link;
				}
				const button = dialog.buttons.find(button => button.link == card);
				if (button) {
					if (dialog.seeing) {
						button.querySelector(".info").innerHTML = get.translation(current.name);
						if (!_status.connectMode) {
							game.log(current, "选择了", button.link);
						}
					}
					dialog.buttons.remove(button);
				}
				if (card) {
					await current.gain(card);
					if (dialog.seeing) {
						current.$draw(card, "nobroadcast");
					} else {
						current.$draw(1, "nobroadcast");
					}
					game.broadcast(
						function (card, id, current) {
							const dialog = get.idDialog(id);
							if (dialog && dialog.seeing) {
								const button = dialog.buttons.find(button => button.link == card);
								if (button) {
									button.querySelector(".info").innerHTML = get.translation(current.name);
									dialog.buttons.remove(button);
								}
								current.$draw(card, "nobroadcast");
							} else {
								current.$draw(1, "nobroadcast");
							}
						},
						card,
						videoId,
						current
					);
				}
				if (current == target) {
					num1++;
					current = target1;
				} else {
					num2++;
					current = target;
				}
				await game.delay(2);
			}
			if (!_status.connectMode) {
				game.log(event.targets[0], "获得了" + get.cnNumber(num1) + "张牌");
				game.log(event.targets[1], "获得了" + get.cnNumber(num2) + "张牌");
			}
			dialog.close();
			_status.dieClose.remove(dialog);
			game.broadcast(function (id) {
				const dialog = get.idDialog(id);
				if (dialog) {
					dialog.close();
					_status.dieClose.remove(dialog);
				}
			}, videoId);
			game.addVideo("cardDialog", null, videoId);
		},
		targetprompt: ["先拿牌", "后拿牌"],
		find(type) {
			const player = _status.event.player;
			let list = game.filterPlayer(current => current != player && get.attitude(player, current) > 3);
			const num = player.countCards("he", card => get.value(card) < 7);
			let count = null,
				from,
				nh;
			if (list.length == 0) {
				return null;
			}
			list.sort((a, b) => a.countCards("h") - b.countCards("h"));
			if (type == 1) {
				return list[0];
			}
			from = list[0];
			nh = from.countCards("h");
			list = game.filterPlayer(current => current != player && get.attitude(player, current) < 1);
			if (!list.length) {
				return null;
			}
			list.sort((a, b) => b.countCards("h") - a.countCards("h"));
			for (let i = 0; i < list.length; i++) {
				const nh2 = list[i].countCards("h");
				if (nh2 - nh <= num) {
					count = nh2 - nh;
					break;
				}
			}
			if (count == null || count < 0) {
				return null;
			}
			if (type == 3) {
				return count;
			}
			return list[i];
		},
		check(card) {
			const count = lib.skill.redimeng.find(3);
			if (count == null) {
				return -1;
			}
			if (ui.selected.cards.length < count) {
				return 7 - get.value(card);
			}
			return -1;
		},
		ai: {
			order: 8,
			threaten: 1.6,
			expose: 0.5,
			result: {
				player(player, target) {
					if (ui.selected.targets.length == 0) {
						if (target == lib.skill.redimeng.find(1)) {
							return 1;
						}
						return 0;
					} else {
						if (target == lib.skill.redimeng.find(2)) {
							return 1;
						}
						return 0;
					}
				},
			},
		},
	},
	reluanji: {
		audio: 2,
		enable: "phaseUse",
		viewAs: { name: "wanjian" },
		filterCard(card, player) {
			if (!player.storage.reluanji) {
				return true;
			}
			return !player.storage.reluanji.includes(get.suit(card));
		},
		position: "hs",
		selectCard: 2,
		check(card) {
			const player = _status.event.player;
			const targets = game.filterPlayer(function (current) {
				return player.canUse("wanjian", current);
			});
			let num = 0;
			for (let i = 0; i < targets.length; i++) {
				let eff = get.sgn(get.effect(targets[i], { name: "wanjian" }, player, player));
				if (targets[i].hp == 1) {
					eff *= 1.5;
				}
				num += eff;
			}
			if (!player.needsToDiscard(-1)) {
				if (targets.length >= 7) {
					if (num < 2) {
						return 0;
					}
				} else if (targets.length >= 5) {
					if (num < 1.5) {
						return 0;
					}
				}
			}
			return 6 - get.value(card);
		},
		ai: {
			basic: {
				order: 8.9,
			},
		},
		group: ["reluanji_count", "reluanji_reset", "reluanji_respond", "reluanji_damage", "reluanji_draw"],
		subSkill: {
			reset: {
				trigger: { player: "phaseAfter" },
				silent: true,
				async content(event, trigger, player) {
					delete player.storage.reluanji;
					delete player.storage.reluanji2;
				},
			},
			count: {
				trigger: { player: "useCard" },
				silent: true,
				filter(event) {
					return event.skill == "reluanji";
				},
				async content(event, trigger, player) {
					player.storage.reluanji2 = trigger.card;
					if (!player.storage.reluanji) {
						player.storage.reluanji = [];
					}
					player.storage.reluanji.addArray(trigger.cards.map(c => get.suit(c)));
				},
			},
			respond: {
				trigger: { global: "respond" },
				silent: true,
				filter(event) {
					return event.getParent(2).skill == "reluanji";
				},
				async content(event, trigger, player) {
					await trigger.player.draw();
				},
			},
			damage: {
				trigger: { source: "damage" },
				forced: true,
				silent: true,
				popup: false,
				filter(event, player) {
					return player.storage.reluanji2 && event.card == player.storage.reluanji2;
				},
				async content(event, trigger, player) {
					delete player.storage.reluanji2;
				},
			},
			draw: {
				trigger: { player: "useCardAfter" },
				forced: true,
				silent: true,
				popup: false,
				filter(event, player) {
					return player.storage.reluanji2 && event.card == player.storage.reluanji2;
				},
				async content(event, trigger, player) {
					await player.draw(trigger.targets.length);
					delete player.storage.reluanji2;
				},
			},
		},
	},
	qimou: {
		limited: true,
		audio: 2,
		enable: "phaseUse",
		skillAnimation: true,
		animationColor: "orange",
		async content(event, trigger, player) {
			const shas = player.getCards("h", "sha");
			let num;
			if (player.hp >= 4 && shas.length >= 3) {
				num = 3;
			} else if (player.hp >= 3 && shas.length >= 2) {
				num = 2;
			} else {
				num = 1;
			}
			const map = {};
			const list = [];
			for (let i = 1; i <= player.hp; i++) {
				const cn = get.cnNumber(i, true);
				map[cn] = i;
				list.push(cn);
			}
			player.awakenSkill(event.name);
			player.storage.qimou = true;
			const result = await player
				.chooseControl(list, function () {
					return get.cnNumber(_status.event.goon, true);
				})
				.set("prompt", "失去任意点体力")
				.set("goon", num)
				.forResult();
			num = map[result.control] || 1;
			player.storage.qimou2 = num;
			player.addTempSkill("qimou2");
			await player.loseHp(num);
		},
		ai: {
			order: 2,
			result: {
				player(player) {
					if (player.hp == 1) {
						return 0;
					}
					const shas = player.getCards("h", "sha");
					if (!shas.length) {
						return 0;
					}
					const card = shas[0];
					if (!lib.filter.cardEnabled(card, player)) {
						return 0;
					}
					if (lib.filter.cardUsable(card, player)) {
						return 0;
					}
					let mindist;
					if (player.hp >= 4 && shas.length >= 3) {
						mindist = 4;
					} else if (player.hp >= 3 && shas.length >= 2) {
						mindist = 3;
					} else {
						mindist = 2;
					}
					if (
						game.hasPlayer(function (current) {
							return current.hp <= mindist - 1 && get.distance(player, current, "attack") <= mindist && player.canUse(card, current, false) && get.effect(current, card, player, player) > 0;
						})
					) {
						return 1;
					}
					return 0;
				},
			},
		},
	},
	qimou2: {
		onremove: true,
		mod: {
			cardUsable(card, player, num) {
				if (typeof player.storage.qimou2 == "number" && card.name == "sha") {
					return num + player.storage.qimou2;
				}
			},
			globalFrom(from, to, distance) {
				if (typeof from.storage.qimou2 == "number") {
					return distance - from.storage.qimou2;
				}
			},
		},
	},
	xinkuanggu: {
		audio: "kuanggu",
		audioname: ["re_weiyan", "ol_weiyan"],
		trigger: { source: "damageSource" },
		filter(event, player) {
			return event.checkKuanggu && event.num > 0;
		},
		getIndex(event, player, triggername) {
			return event.num;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			let choice;
			if (
				player.isDamaged() &&
				get.recoverEffect(player) > 0 &&
				player.countCards("hs", function (card) {
					return card.name == "sha" && player.hasValueTarget(card);
				}) >= player.getCardUsable("sha")
			) {
				choice = "recover_hp";
			} else {
				choice = "draw_card";
			}
			const next = player.chooseDrawRecover("###" + get.prompt(event.skill) + "###摸一张牌或回复1点体力");
			next.set("choice", choice);
			next.set("ai", function () {
				return _status.event.getParent().choice;
			});
			next.set("logSkill", event.skill);
			next.setHiddenSkill(event.skill);
			const { control } = await next.forResult();
			if (control == "cancel2") {
				return;
			}
			event.result = { bool: true, skill_popup: false }; // 好像在content里面不能中断getIndex喵
		},
		async content(event, trigger, player) {},
	},
	xinliegong: {
		mod: {
			aiOrder(player, card, num) {
				if (num > 0 && (card.name === "sha" || get.tag(card, "draw"))) {
					return num + 6;
				}
			},
			targetInRange(card, player, target) {
				if (card.name == "sha" && typeof get.number(card) == "number") {
					if (get.distance(player, target) <= get.number(card)) {
						return true;
					}
				}
			},
		},
		targetprompt2: target => {
			const player = get.player(),
				card = get.card(),
				list = [];
			if (card?.name != "sha" || !target.classList.contains("selectable")) {
				return list;
			}
			const num = card.cards?.length ?? 0;
			if (target.countCards("h") <= player.countCards("h") - num) {
				list.add("不可响应");
			}
			if (target.hp >= player.hp) {
				list.add("加伤");
			}
			return list;
		},
		onChooseToUse(event) {
			event.targetprompt2.add(lib.skill.xinliegong.targetprompt2);
		},
		onChooseTarget(event) {
			event.targetprompt2.add(lib.skill.xinliegong.targetprompt2);
		},
		audio: "liegong",
		audioname: ["re_huangzhong", "ol_huangzhong"],
		trigger: { player: "useCardToTargeted" },
		logTarget: "target",
		locked: false,
		check(event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (event.target.countCards("h") <= player.countCards("h")) {
				return true;
			}
			if (event.target.hp >= player.hp) {
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			if (trigger.target.countCards("h") <= player.countCards("h")) {
				trigger.getParent().directHit.push(trigger.target);
			}
			if (trigger.target.hp >= player.hp) {
				const id = trigger.target.playerid;
				const map = trigger.getParent().customArgs;
				if (!map[id]) {
					map[id] = {};
				}
				if (typeof map[id].extraDamage != "number") {
					map[id].extraDamage = 0;
				}
				map[id].extraDamage++;
			}
		},
		ai: {
			threaten: 0.5,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (
					arg?.target &&
					arg?.card &&
					get.attitude(player, arg.target) <= 0 &&
					arg.card.name == "sha" &&
					player.countCards("h", function (card) {
						return card != arg.card && (!arg.card.cards || !arg.card.cards.includes(card));
					}) >= arg.target.countCards("h")
				) {
					return true;
				}
				return false;
			},
		},
	},
	tiaoxin: {
		audio: 2,
		audioname: ["sp_jiangwei", "xiahouba", "re_jiangwei", "gz_jiangwei", "ol_jiangwei"],
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return target != player && target.inRange(player) && target.countCards("he") > 0;
		},
		async content(event, trigger, player) {
			const target = event.target;
			const result = await target
				.chooseToUse(
					function (card, player, event) {
						if (get.name(card) != "sha") {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					"挑衅：对" + get.translation(player) + "使用一张杀，或令其弃置你的一张牌"
				)
				.set("targetRequired", true)
				.set("complexSelect", true)
				.set("complexTarget", true)
				.set("filterTarget", function (card, player, target) {
					if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
						return false;
					}
					return lib.filter.filterTarget.apply(this, arguments);
				})
				.set("sourcex", player)
				.forResult();
			if (result.bool == false && target.countCards("he") > 0) {
				player.discardPlayerCard(target, "he", true);
			}
		},
		ai: {
			order: 4,
			expose: 0.2,
			result: {
				target: -1,
				player(player, target) {
					if (target.countCards("h") == 0) {
						return 0;
					}
					if (target.countCards("h") == 1) {
						return -0.1;
					}
					if (player.hp <= 2) {
						return -2;
					}
					if (player.countCards("h", "shan") == 0) {
						return -1;
					}
					return -0.5;
				},
			},
			threaten: 1.1,
		},
	},
	tiaoxin_xiahouba: { audio: 2 },
	zhiji: {
		skillAnimation: true,
		animationColor: "fire",
		audio: 2,
		audioname: ["re_jiangwei"],
		juexingji: true,
		derivation: "reguanxing",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			if (player.storage.zhiji) {
				return false;
			}
			return player.countCards("h") == 0;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.chooseDrawRecover(2, true);
			await player.loseMaxHp();
			await player.addSkills("reguanxing");
		},
	},
	xiangle: {
		audio: 2,
		audioname: ["re_liushan", "ol_liushan"],
		trigger: { target: "useCardToTargeted" },
		forced: true,
		preHidden: true,
		filter(event, player) {
			return event.card.name == "sha";
		},
		async content(event, trigger, player) {
			const eff = get.effect(player, trigger.card, trigger.player, trigger.player);
			const result = await trigger.player
				.chooseToDiscard("享乐：弃置一张基本牌，否则杀对" + get.translation(player) + "无效", function (card) {
					return get.type(card) == "basic";
				})
				.set("ai", function (card) {
					if (_status.event.eff > 0) {
						return 10 - get.value(card);
					}
					return 0;
				})
				.set("eff", eff)
				.forResult();
			if (!result?.bool) {
				trigger.getParent().excluded.add(player);
			}
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (card.name == "sha" && get.attitude(player, target) < 0) {
						if (_status.event.name == "xiangle") {
							return;
						}
						if (get.attitude(player, target) > 0 && current < 0) {
							return "zerotarget";
						}
						const bs = player.getCards("h", { type: "basic" });
						bs.remove(card);
						if (card.cards) {
							bs.removeArray(card.cards);
						} else {
							bs.removeArray(ui.selected.cards);
						}
						if (!bs.length) {
							return "zerotarget";
						}
						if (player.hasSkill("jiu") || player.hasSkill("tianxianjiu")) {
							return;
						}
						if (bs.length <= 2) {
							for (let i = 0; i < bs.length; i++) {
								if (get.value(bs[i]) < 7) {
									return [1, 0, 1, -0.5];
								}
							}
							return [1, 0, 0.3, 0];
						}
						return [1, 0, 1, -0.5];
					}
				},
			},
		},
	},
	fangquan: {
		audio: 2,
		trigger: { player: "phaseUseBefore" },
		filter(event, player) {
			return player.countCards("h") > 0 && !player.hasSkill("fangquan3");
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const fang = player.countMark("fangquan2") == 0 && player.hp >= 2 && player.countCards("h") <= player.hp + 1;
			event.result = await player
				.chooseBool(get.prompt2(event.skill))
				.set("ai", function () {
					const player = get.player();
					if (!_status.event.fang) {
						return false;
					}
					return game.hasPlayer(function (target) {
						if (target.hasJudge("lebu") || target == player) {
							return false;
						}
						if (get.attitude(player, target) > 4) {
							return get.threaten(target) / Math.sqrt(target.hp + 1) / Math.sqrt(target.countCards("h") + 1) > 0;
						}
						return false;
					});
				})
				.set("fang", fang)
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.addTempSkill("fangquan2");
			player.addMark("fangquan2", 1, false);
			//player.storage.fangquan=result.targets[0];
		},
	},
	fangquan2: {
		trigger: { player: "phaseEnd" },
		locked: true,
		log: false,
		audio: false,
		//priority:-50,
		onremove: true,
		sourceSkill: "fangquan",
		getIndex(event, player) {
			return player.countMark("fangquan2") || 1;
		},
		async cost(event, trigger, player) {
			const chooseToDiscard = player.chooseToDiscard("是否弃置一张手牌并令一名其他角色进行一个额外回合？");
			chooseToDiscard.ai = function (card) {
				return 20 - get.value(card);
			};
			if (!(await chooseToDiscard.forResult()).bool) {
				return;
			}
			const chooseTarget = player.chooseTarget(true, "请选择进行额外回合的目标角色", lib.filter.notMe);
			chooseTarget.ai = function (target) {
				const player = get.player();
				if (target.hasJudge("lebu") || get.attitude(player, target) <= 0) {
					return -1;
				}
				if (target.isTurnedOver()) {
					return 0.18;
				}
				return get.threaten(target) / Math.sqrt(target.hp + 1) / Math.sqrt(target.countCards("h") + 1);
			};
			event.result = await chooseTarget.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			player.logSkill(player.name == "re_liushan" ? "refangquan" : "fangquan", event.targets, "fire");
			target.markSkillCharacter("fangquan", player, "放权", "进行一个额外回合");
			target.insertPhase();
			player.removeMark("fangquan2");
			target.addSkill("fangquan3");
		},
	},
	fangquan3: {
		trigger: { player: ["phaseAfter", "phaseCancelled"] },
		forced: true,
		popup: false,
		audio: false,
		sourceSkill: "fangquan",
		async content(event, trigger, player) {
			player.unmarkSkill("fangquan");
			player.removeSkill("fangquan3");
		},
	},
	ruoyu: {
		skillAnimation: true,
		animationColor: "fire",
		audio: 2,
		audioname: ["re_liushan"],
		juexingji: true,
		zhuSkill: true,
		keepSkill: true,
		derivation: "rejijiang",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.isMinHp();
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.gainMaxHp();
			await player.recover();
			await player.addSkills("rejijiang");
		},
	},
	qiaobian: {
		audio: 2,
		audioname2: { gz_jun_caocao: "jianan_qiaobian" },
		trigger: {
			player: ["phaseJudgeBefore", "phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore"],
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			let check,
				str = "弃置一张手牌并跳过";
			str += ["判定", "摸牌", "出牌", "弃牌"][lib.skill.qiaobian.trigger.player.indexOf(event.triggername)];
			str += "阶段";
			if (trigger.name == "phaseDraw") {
				str += "，然后可以获得至多两名角色各一张手牌";
			}
			if (trigger.name == "phaseUse") {
				str += "，然后可以移动场上的一张牌";
			}
			switch (trigger.name) {
				case "phaseJudge":
					check = player.countCards("j");
					break;
				case "phaseDraw": {
					let i,
						num = 0,
						num2 = 0;
					const players = game.filterPlayer();
					for (i = 0; i < players.length; i++) {
						if (player != players[i] && players[i].countCards("h")) {
							const att = get.attitude(player, players[i]);
							if (att <= 0) {
								num++;
							}
							if (att < 0) {
								num2++;
							}
						}
					}
					check = num >= 2 && num2 > 0;
					break;
				}
				case "phaseUse":
					if (!player.canMoveCard(true)) {
						check = false;
					} else {
						check = game.hasPlayer(function (current) {
							return get.attitude(player, current) > 0 && current.countCards("j");
						});
						if (!check) {
							if (player.countCards("h") > player.hp + 1) {
								check = false;
							} else if (player.countCards("h", { name: "wuzhong" })) {
								check = false;
							} else {
								check = true;
							}
						}
					}
					break;
				case "phaseDiscard":
					check = player.needsToDiscard();
					break;
			}
			event.result = await player
				.chooseToDiscard(get.prompt(event.skill), str, lib.filter.cardDiscardable)
				.set("ai", card => {
					if (!_status.event.check) {
						return -1;
					}
					return 7 - get.value(card);
				})
				.set("check", check)
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			game.log(player, "跳过了", "#y" + ["判定", "摸牌", "出牌", "弃牌"][lib.skill.qiaobian.trigger.player.indexOf(event.triggername)] + "阶段");
			if (trigger.name == "phaseUse") {
				if (player.canMoveCard()) {
					await player.moveCard();
				}
			} else if (trigger.name == "phaseDraw") {
				const result = await player
					.chooseTarget([1, 2], "获得至多两名角色各一张手牌", function (card, player, target) {
						return target != player && target.countCards("h");
					})
					.set("ai", function (target) {
						return 1 - get.attitude(_status.event.player, target);
					})
					.forResult();
				if (!result.bool) {
					return;
				}
				result.targets.sortBySeat();
				player.line(result.targets, "green");
				if (!result.targets.length) {
					return;
				}
				await player.gainMultiple(result.targets);
				await game.delay();
			}
		},
		ai: { threaten: 3 },
	},
	tuntian: {
		audio: 2,
		audioname: ["gz_dengai"],
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		preHidden: true,
		filter(event, player) {
			if (player == _status.currentPhase) {
				return false;
			}
			if (event.name == "gain" && event.player == player) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.cards2 && evt.cards2.length > 0;
		},
		async content(event, trigger, player) {
			const judge = player.judge(function (card) {
				if (get.suit(card) == "heart") {
					return -1;
				}
				return 1;
			});
			judge.judge2 = function (result) {
				return result.bool;
			};
			if (get.mode() != "guozhan") {
				judge.callback = lib.skill.tuntian.callback;
				return void (await judge);
			}
			const result = await judge.forResult();
			if (!result.bool || get.position(result.card) != "d") {
				//game.cardsDiscard(card);
				return;
			}
			const card = result.card;
			const chooseBool = player.chooseBool("是否将" + get.translation(card) + "作为“田”置于武将牌上？");
			chooseBool.ai = function () {
				return true;
			};
			const { bool } = await chooseBool.forResult();
			if (!bool) {
				return;
			}
			const addToExpansion = player.addToExpansion(card, "gain2");
			addToExpansion.gaintag.add("tuntian");
			await addToExpansion;
		},
		async callback(event, trigger, player) {
			if (!event.judgeResult.bool) {
				return;
			}
			const next = player.addToExpansion(event.judgeResult.card, "gain2");
			next.gaintag.add("tuntian");
			await next;
		},
		marktext: "田",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		group: "tuntian_dist",
		locked: false,
		subSkill: {
			dist: {
				locked: false,
				mod: {
					globalFrom(from, to, distance) {
						let num = distance - from.getExpansions("tuntian").length;
						if (_status.event.skill == "jixi_backup" || _status.event.skill == "gz_jixi_backup") {
							num++;
						}
						return num;
					},
				},
			},
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (typeof card === "object" && get.name(card) === "sha" && target.mayHaveShan(player, "use")) {
						return [0.6, 0.75];
					}
					if (!target.hasFriend() && !player.hasUnknown()) {
						return;
					}
					if (_status.currentPhase == target || get.type(card) === "delay") {
						return;
					}
					if (card.name != "shuiyanqijunx" && get.tag(card, "loseCard") && target.countCards("he")) {
						if (target.hasSkill("ziliang")) {
							return 0.7;
						}
						return [0.5, Math.max(2, target.countCards("h"))];
					}
					if (target.isUnderControl(true, player)) {
						if ((get.tag(card, "respondSha") && target.countCards("h", "sha")) || (get.tag(card, "respondShan") && target.countCards("h", "shan"))) {
							if (target.hasSkill("ziliang")) {
								return 0.7;
							}
							return [0.5, 1];
						}
					} else if (get.tag(card, "respondSha") || get.tag(card, "respondShan")) {
						if (get.attitude(player, target) > 0 && card.name == "juedou") {
							return;
						}
						if (get.tag(card, "damage") && target.hasSkillTag("maixie")) {
							return;
						}
						if (target.countCards("h") == 0) {
							return 2;
						}
						if (target.hasSkill("ziliang")) {
							return 0.7;
						}
						if (get.mode() == "guozhan") {
							return 0.5;
						}
						return [0.5, Math.max(target.countCards("h") / 4, target.countCards("h", "sha") + target.countCards("h", "shan"))];
					}
				},
			},
			threaten(player, target) {
				if (target.countCards("h") == 0) {
					return 2;
				}
				return 0.5;
			},
			nodiscard: true,
			nolose: true,
			notemp: true,
		},
	},
	zaoxian: {
		skillAnimation: true,
		animationColor: "thunder",
		audio: 2,
		audioname: ["re_dengai"],
		juexingji: true,
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.getExpansions("tuntian").length >= 3;
		},
		derivation: "jixi",
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills("jixi");
		},
		ai: {
			combo: "tuntian",
		},
	},
	jixi: {
		audio: 2,
		audioname: ["re_dengai", "gz_dengai", "ol_dengai"],
		enable: "phaseUse",
		filter(event, player) {
			return player.getExpansions("tuntian").length > 0 && event.filterCard({ name: "shunshou" }, player, event);
		},
		chooseButton: {
			dialog(event, player) {
				return ui.create.dialog("急袭", player.getExpansions("tuntian"), "hidden");
			},
			filter(button, player) {
				const card = button.link;
				if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player)) {
					return false;
				}
				const evt = _status.event.getParent();
				return evt.filterCard(get.autoViewAs({ name: "shunshou" }, [card]), player, evt);
			},
			backup(links, player) {
				const skill = _status.event.buttoned;
				return {
					audio: "jixi",
					audioname: ["re_dengai", "gz_dengai", "ol_dengai"],
					selectCard: -1,
					position: "x",
					filterCard: skill == "jixi" ? card => card == lib.skill.jixi_backup.card : card => card == lib.skill.gz_jixi_backup.card,
					viewAs: { name: "shunshou" },
					card: links[0],
				};
			},
			prompt(links, player) {
				return "选择 顺手牵羊（" + get.translation(links[0]) + "）的目标";
			},
		},
		subSkill: {
			backup: {},
		},
		ai: {
			order: 10,
			result: {
				player(player) {
					return player.getExpansions("tuntian").length - 1;
				},
			},
			combo: "tuntian",
		},
	},
	jiang: {
		audio: 2,
		preHidden: true,
		audioname: ["sp_lvmeng", "re_sunben", "re_sunce"],
		mod: {
			aiOrder(player, card, num) {
				if (get.color(card) === "red" && get.name(card) === "sha") {
					return get.order({ name: "sha" }) + 0.15;
				}
			},
		},
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			if (!(event.card.name == "juedou" || (event.card.name == "sha" && get.color(event.card) == "red"))) {
				return false;
			}
			return player == event.target || event.getParent().triggeredTargets3.length == 1;
		},
		locked: false,
		frequent: true,
		async content(event, trigger, player) {
			player.draw();
		},
		ai: {
			effect: {
				target_use(card, player, target) {
					if (card.name == "sha" && get.color(card) == "red") {
						return [1, 0.6];
					}
				},
				player_use(card, player, target) {
					if (card.name == "sha" && get.color(card) == "red") {
						return [1, 1];
					}
				},
			},
		},
	},
	hunzi: {
		//audioname:['re_sunben'],
		skillAnimation: true,
		animationColor: "wood",
		audio: 2,
		juexingji: true,
		derivation: ["reyingzi", "gzyinghun"],
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.hp <= 1 && !player.storage.hunzi;
		},
		forced: true,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills(["reyingzi", "gzyinghun"]);
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
					return 2;
				}
				return 0.5;
			},
			maixie: true,
			effect: {
				target(card, player, target) {
					if (!target.hasFriend()) {
						return;
					}
					if (target.hp === 2 && get.tag(card, "damage") == 1 && !target.isTurnedOver() && _status.currentPhase !== target && get.distance(_status.currentPhase, target, "absolute") <= 3) {
						return [0.5, 1];
					}
					if (target.hp === 1 && get.tag(card, "recover") && !target.isTurnedOver() && _status.currentPhase !== target && get.distance(_status.currentPhase, target, "absolute") <= 3) {
						return [1, -3];
					}
				},
			},
		},
	},
	zhiba: {
		global: "zhiba_global",
		audioname: ["re_sunben"],
		audioname2: {
			pe_jun_sunce: "olzhiba",
		},
		audio: 2,
		zhuSkill: true,
		subSkill: {
			global: {
				enable: "phaseUse",
				prompt() {
					const player = get.player();
					const list = game.filterPlayer(target => target.hasZhuSkill("zhiba", player) && player.canCompare(target));
					let str = "和" + get.translation(list);
					if (list.length > 1) {
						str += "中的一人";
					}
					str += "进行拼点。若你没赢，其可以获得两张拼点牌。";
					return str;
				},
				filter(event, player) {
					if (player.group != "wu") {
						return false;
					}
					return game.hasPlayer(target => target.hasZhuSkill("zhiba", player) && player.canCompare(target));
				},
				filterTarget(card, player, target) {
					return target.hasZhuSkill("zhiba", player) && player.canCompare(target);
				},
				log: false,
				prepare(cards, player, targets) {
					targets[0].logSkill("zhiba");
				},
				usable: 1,
				async content(event, trigger, player) {
					const { target } = event;
					if (["hunzi", "rehunzi"].some(skill => target.storage[skill])) {
						const { bool } = await target
							.chooseBool("是否拒绝〖制霸〗拼点？")
							.set("choice", get.attitude(target, player) <= 0)
							.forResult();
						if (bool) {
							game.log(target, "拒绝了拼点");
							target.chat("拒绝");
							return;
						}
					}
					if (!player.canCompare(target)) {
						return;
					}
					const result = await player
						.chooseToCompare(target, card => {
							if (card.name == "du") {
								return 20;
							}
							const player = get.owner(card);
							const target = get.event().getParent().target;
							if (player != target && get.attitude(player, target) > 0) {
								return -get.number(card);
							}
							return get.number(card);
						})
						.set("preserve", "lose")
						.forResult();
					if (result.bool == false) {
						const list = [result.player, result.target].filterInD("d");
						if (!list.length) {
							return;
						}
						const next = target.chooseBool("是否获得" + get.translation(list) + "？").set("ai", () => get.value(list) > 0);
						if ((await next.forResult()).bool) {
							await target.gain(list, "gain2");
						}
					}
				},
				ai: {
					basic: {
						order: 1,
					},
					expose: 0.2,
					result: {
						target(player, target) {
							if (player.countCards("h", "du") && get.attitude(player, target) < 0) {
								return -1;
							}
							if (player.countCards("h") <= player.hp) {
								return 0;
							}
							let maxnum = 0;
							const cards2 = target.getCards("h");
							for (let i = 0; i < cards2.length; i++) {
								if (get.number(cards2[i]) > maxnum) {
									maxnum = get.number(cards2[i]);
								}
							}
							if (maxnum > 10) {
								maxnum = 10;
							}
							if (maxnum < 5 && cards2.length > 1) {
								maxnum = 5;
							}
							const cards = player.getCards("h");
							for (let i = 0; i < cards.length; i++) {
								if (get.number(cards[i]) < maxnum) {
									return 1;
								}
							}
							return 0;
						},
					},
				},
			},
		},
	},
	zhijian: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.countCards("h", { type: "equip" }) > 0;
		},
		filterCard(card) {
			return get.type(card) == "equip";
		},
		check(card) {
			const player = _status.currentPhase;
			if (player.countCards("he", { subtype: get.subtype(card) }) > 1) {
				return 11 - get.equipValue(card);
			}
			return 6 - get.value(card);
		},
		filterTarget(card, player, target) {
			if (target.isMin()) {
				return false;
			}
			return player != target && target.canEquip(card);
		},
		async content(event, trigger, player) {
			await event.target.equip(event.cards[0]);
			await player.draw();
		},
		discard: false,
		lose: false,
		prepare(cards, player, targets) {
			player.$give(cards, targets[0], false);
		},
		ai: {
			basic: {
				order: 10,
			},
			result: {
				target(player, target) {
					const card = ui.selected.cards[0];
					if (card) {
						return get.effect(target, card, target, target);
					}
					return 0;
				},
			},
			threaten: 1.3,
		},
	},
	guzheng: {
		audio: 2,
		audioname: ["re_zhangzhang"],
		trigger: { global: "phaseDiscardAfter" },
		filter(event, player) {
			if (event.player != player && event.player.isIn()) {
				return (
					event.player.getHistory("lose", function (evt) {
						return evt.type == "discard" && evt.getParent("phaseDiscard") == event && evt.hs.someInD("d");
					}).length > 0
				);
			}
			return false;
		},
		checkx(event, player, cards, cards2) {
			if (cards.length > 2 || get.attitude(player, event.player) > 0) {
				return true;
			}
			for (let i = 0; i < cards2.length; i++) {
				if (get.value(cards2[i], event.player, "raw") < 0) {
					return true;
				}
			}
			return false;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const cards = [],
				cards2 = [];
			const target = trigger.player;
			game.getGlobalHistory("cardMove", function (evt) {
				if (evt.name == "cardsDiscard") {
					if (evt.getParent("phaseDiscard") == trigger) {
						const moves = evt.cards.filterInD("d");
						cards.addArray(moves);
						cards2.removeArray(moves);
					}
				}
				if (evt.name == "lose") {
					if (evt.type != "discard" || evt.position != ui.discardPile || evt.getParent("phaseDiscard") != trigger) {
						return;
					}
					const moves = evt.cards.filterInD("d");
					cards.addArray(moves);
					if (evt.player == target) {
						cards2.addArray(moves);
					} else {
						cards2.removeArray(moves);
					}
				}
			});
			if (!cards2.length) {
				return;
			}
			if (cards.length == 1) {
				event.card = cards[0];
				event.result = await player
					.chooseBool()
					.set("createDialog", [get.prompt(event.skill, target), '<span class="text center">点击“确认”以令其收回此牌</span>', cards])
					.set("choice", lib.skill.guzheng.checkx(trigger, player, cards, cards2))
					.set("ai", function () {
						return _status.event.choice;
					})
					.setHiddenSkill(event.skill)
					.forResult();
				event.result.cost_data = {
					action: "single",
					cards: cards,
				};
			} else {
				event.result = await player
					.chooseButton(2, [get.prompt(event.skill, target), '<span class="text center">被选择的牌将成为对方收回的牌</span>', cards, [["获得剩余的牌", "放弃剩余的牌"], "tdnodes"]])
					.set("filterButton", function (button) {
						const type = typeof button.link;
						if (ui.selected.buttons.length && type == typeof ui.selected.buttons[0].link) {
							return false;
						}
						return type == "string" || _status.event.allowed.includes(button.link);
					})
					.set("allowed", cards2)
					.set("check", lib.skill.guzheng.checkx(trigger, player, cards, cards2))
					.set("ai", function (button) {
						if (typeof button.link == "string") {
							return button.link == "获得剩余的牌" ? 1 : 0;
						}
						if (_status.event.check) {
							return 20 - get.value(button.link, _status.event.getTrigger().player);
						}
						return 0;
					})
					.setHiddenSkill(event.skill)
					.forResult();
				event.result.cost_data = {
					action: "multiple",
					cards: event.result.links,
				};
			}
		},
		logTarget: "player",
		async content(event, trigger, player) {
			const target = trigger.player;
			const action = event.cost_data.action;
			const cards = event.cost_data.cards;
			if (action != "multiple") {
				const gain = target.gain(cards[0], "gain2");
				gain.giver = player;
				await gain;
			} else {
				if (typeof cards[0] != "string") {
					cards.reverse();
				}
				const [, card] = cards;
				const gain = target.gain(card, "gain2");
				gain.giver = player;
				await gain;
				if (cards[0] != "获得剩余的牌") {
					return;
				}
			}
			//避免插入结算改变弃牌堆 重新判断一次
			cards.length = 0;
			game.getGlobalHistory("cardMove", function (evt) {
				if (evt.name == "cardsDiscard") {
					if (evt.getParent("phaseDiscard") == trigger) {
						const moves = evt.cards.filterInD("d");
						cards.addArray(moves);
					}
				}
				if (evt.name == "lose") {
					if (evt.type != "discard" || evt.position != ui.discardPile || evt.getParent("phaseDiscard") != trigger) {
						return;
					}
					const moves = evt.cards.filterInD("d");
					cards.addArray(moves);
				}
			});
			if (cards.length > 0) {
				await player.gain(cards, "gain2");
			}
		},
		ai: {
			threaten: 1.3,
			expose: 0.2,
		},
	},
	beige: {
		audio: 2,
		audioname: ["re_caiwenji", "ol_caiwenji"],
		trigger: { global: "damageEnd" },
		filter(event, player) {
			return event.card && event.card.name == "sha" && event.source && event.player.isIn() && player.countCards("he");
		},
		checkx(event, player) {
			const att1 = get.attitude(player, event.player);
			const att2 = get.attitude(player, event.source);
			return att1 > 0 && att2 <= 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			const next = player.chooseToDiscard("he", get.prompt2(event.skill, trigger.player));
			const check = lib.skill.beige.checkx(trigger, player);
			next.set("ai", function (card) {
				if (_status.event.goon) {
					return 8 - get.value(card);
				}
				return 0;
			});
			next.set("goon", check);
			next.setHiddenSkill(event.skill);
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			const result = await trigger.player.judge().forResult();
			switch (result.suit) {
				case "heart":
					await trigger.player.recover();
					break;
				case "diamond":
					await trigger.player.draw(2);
					break;
				case "club":
					await trigger.source.chooseToDiscard("he", 2, true);
					break;
				case "spade":
					await trigger.source.turnOver();
					break;
			}
		},
		ai: {
			expose: 0.3,
		},
	},
	duanchang: {
		audio: 2,
		audioname: ["re_caiwenji", "ol_caiwenji"],
		forbid: ["boss"],
		trigger: { player: "die" },
		forced: true,
		forceDie: true,
		skillAnimation: true,
		animationColor: "gray",
		filter(event) {
			return event.source && event.source.isIn();
		},
		async content(event, trigger, player) {
			trigger.source.clearSkills();
		},
		logTarget: "source",
		ai: {
			maixie_defend: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 0.2;
				}
				return 1.5;
			},
			effect: {
				target(card, player, target, current) {
					if (!target.hasFriend()) {
						return;
					}
					if (target.hp <= 1 && get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return 3;
						}
						return [1, 0, 0, -3 * get.threaten(player)];
					}
				},
			},
		},
	},
	// ---------- 本次分界线喵 ----------
	huashen: {
		audio: "huashen2",
		unique: true,
		init(player) {
			if (!player.storage.huashen) {
				player.storage.huashen = { owned: {}, choosed: [] };
			}
		},
		intro: {
			content(storage, player) {
				let str = "";
				const list = Object.keys(storage.owned);
				if (list.length) {
					str += get.translation(list[0]);
					for (let i = 1; i < list.length; i++) {
						str += "、" + get.translation(list[i]);
					}
				}
				const skill = player.storage.huashen.current2;
				if (skill) {
					str += "<p>当前技能：" + get.translation(skill);
				}
				return str;
			},
			onunmark(storage, player) {
				_status.characterlist.addArray(Object.keys(storage.owned));
				storage.owned = [];
				const name = player.name ? player.name : player.name1;
				if (name) {
					const sex = get.character(name).sex;
					const group = get.character(name).group;
					if (player.sex !== sex) {
						game.broadcastAll(
							(player, sex) => {
								player.sex = sex;
							},
							player,
							sex
						);
						game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
					}
					if (player.group !== group) {
						game.broadcastAll(
							(player, group) => {
								player.group = group;
								player.node.name.dataset.nature = get.groupnature(group);
							},
							player,
							group
						);
						game.log(player, "将势力变为了", "#y" + get.translation(group + 2));
					}
				}
			},
			mark(dialog, content, player) {
				const list = Object.keys(content.owned);
				if (list.length) {
					const skill = player.storage.huashen.current2;
					const character = player.storage.huashen.current;
					if (skill && character) {
						dialog.addSmall([[character], (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
						dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2)) + "】</div>" + "<div>" + get.skillInfoTranslation(skill, player, false) + "</div></div>");
					}
					if (player.isUnderControl(true)) {
						dialog.addSmall([list, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
					} else {
						dialog.addText("共有" + get.cnNumber(list.length) + "张“化身”");
					}
				} else {
					return "没有化身";
				}
			},
			markcount(storage = {}) {
				return Object.keys(storage.owned).length;
			},
		},
		addHuashen(player) {
			if (!player.storage.huashen) {
				return;
			}
			if (!_status.characterlist) {
				game.initCharacterList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || lib.skill.rehuashen.banned.includes(name) || player.storage.huashen.owned[name]) {
					continue;
				}
				let skills = lib.character[name][3].filter(skill => {
					const categories = get.skillCategoriesOf(skill, player);
					return !categories.some(type => lib.skill.rehuashen.bannedType.includes(type));
				});
				if (skills.length) {
					player.storage.huashen.owned[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			const list = [];
			for (let i = 0; i < num; i++) {
				const name = lib.skill.huashen.addHuashen(player);
				if (name) {
					list.push(name);
				}
			}
			if (list.length) {
				player.syncStorage("huashen");
				player.markSkill("huashen");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g化身");
				lib.skill.rehuashen.drawCharacter(player, list);
			}
		},
		trigger: {
			global: "phaseBefore",
			player: ["enterGame", "phaseBegin", "phaseEnd"],
		},
		filter(event, player, name) {
			if (event.name != "phase") {
				return true;
			}
			if (name == "phaseBefore") {
				return game.phaseNumber == 0;
			}
			return !get.is.empty(player.storage.huashen.owned);
		},
		log: false,
		async cost(event, trigger, player) {
			const name = event.triggername;
			if (trigger.name != "phase" || (name == "phaseBefore" && game.phaseNumber == 0)) {
				player.logSkill("huashen");
				lib.skill.huashen.addHuashens(player, 2);
				event.logged = true;
			}
			await Promise.all(event.next); // await logSkill 防止被 paused
			// 因为化身内置了一个 chooseButtonControl 需要特殊处理一下
			const cards = [];
			const skills = [];
			for (const i in player.storage.huashen.owned) {
				cards.push(i);
				skills.addArray(player.storage.huashen.owned[i]);
			}
			const cond = event.triggername == "phaseBegin" ? "in" : "out";
			skills.randomSort();
			skills.sort(function (a, b) {
				return get.skillRank(b, cond) - get.skillRank(a, cond);
			});
			if (player.isUnderControl()) {
				game.swapPlayerAuto(player);
			}
			const switchToAuto = function () {
				_status.imchoosing = false;
				let skill = skills[0],
					character;
				for (const i in player.storage.huashen.owned) {
					if (player.storage.huashen.owned[i].includes(skill)) {
						character = i;
						break;
					}
				}
				if (event.dialog) {
					event.dialog.close();
				}
				if (event.control) {
					event.control.close();
				}
				return Promise.resolve({
					bool: true,
					skill: skill,
					character: character,
				});
			};
			const chooseButton = function (player, list, forced) {
				const { promise, resolve } = Promise.withResolvers();
				const event = _status.event;
				player = player || event.player;
				if (!event._result) {
					event._result = {};
				}
				const prompt = forced ? "化身：选择获得一项技能" : get.prompt("huashen");
				const dialog = ui.create.dialog(prompt, [list, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
				event.dialog = dialog;
				event.forceMine = true;
				event.button = null;
				for (let i = 0; i < event.dialog.buttons.length; i++) {
					event.dialog.buttons[i].classList.add("pointerdiv");
					event.dialog.buttons[i].classList.add("selectable");
				}
				const buttons = dialog.content.querySelector(".buttons");
				const array = dialog.buttons.filter(item => !item.classList.contains("nodisplay") && item.style.display !== "none");
				const choosed = player.storage.huashen.choosed;
				const groups = array
					.map(i => get.character(i.link).group)
					.unique()
					.sort((a, b) => {
						const getNum = g => (lib.group.includes(g) ? lib.group.indexOf(g) : lib.group.length);
						return getNum(a) - getNum(b);
					});
				if (choosed.length > 0 || groups.length > 1) {
					event.dialog.style.bottom = (parseInt(event.dialog.style.top || "0", 10) + get.is.phoneLayout() ? 230 : 220) + "px";
					event.dialog.addPagination({
						data: array,
						totalPageCount: groups.length + Math.sign(choosed.length),
						container: dialog.content,
						insertAfter: buttons,
						onPageChange(state) {
							const { pageNumber, data, pageElement } = state;
							const { groups, choosed } = pageElement;
							data.forEach(item => {
								item.classList[
									(() => {
										const name = item.link,
											goon = choosed.length > 0;
										if (goon && pageNumber === 1) {
											return choosed.includes(name);
										}
										const group = get.character(name).group;
										return groups.indexOf(group) + (1 + goon) === pageNumber;
									})()
										? "remove"
										: "add"
								]("nodisplay");
							});
							ui.update();
						},
						pageLimitForCN: ["←", "→"],
						pageNumberForCN: (choosed.length > 0 ? ["常用"] : []).concat(
							groups.map(i => {
								const isChineseChar = char => {
									const regex = /[\u4e00-\u9fff\u3400-\u4dbf\ud840-\ud86f\udc00-\udfff\ud870-\ud87f\udc00-\udfff\ud880-\ud88f\udc00-\udfff\ud890-\ud8af\udc00-\udfff\ud8b0-\ud8bf\udc00-\udfff\ud8c0-\ud8df\udc00-\udfff\ud8e0-\ud8ff\udc00-\udfff\ud900-\ud91f\udc00-\udfff\ud920-\ud93f\udc00-\udfff\ud940-\ud97f\udc00-\udfff\ud980-\ud9bf\udc00-\udfff\ud9c0-\ud9ff\udc00-\udfff]/u;
									return regex.test(char);
								}; //友情提醒：regex为基本汉字区间到扩展G区的Unicode范围的正则表达式，非加密/混淆
								const str = get.plainText(lib.translate[i + "2"] || lib.translate[i] || "无");
								return isChineseChar(str.slice(0, 1)) ? str.slice(0, 1) : str;
							})
						),
						changePageEvent: "click",
						pageElement: {
							groups: groups,
							choosed: choosed,
						},
					});
				}
				event.dialog.open();
				event.custom.replace.button = function (button) {
					const paginationInstance = event.dialog.paginationMap?.get(event.dialog.content.querySelector(".buttons"));
					if (!event.dialog.contains(button.parentNode)) {
						return;
					}
					if (event.control) {
						event.control.style.opacity = 1;
					}
					if (button.classList.contains("selectedx")) {
						//二次选择已选择的武将牌解禁更换操作
						if (paginationInstance?.state) {
							paginationInstance.state.pageRefuseChanged = false;
						}
						event.button = null;
						button.classList.remove("selectedx");
						if (event.control) {
							event.control.replacex(["cancel2"]);
						}
					} else {
						//否则禁止更换操作
						if (paginationInstance?.state) {
							paginationInstance.state.pageRefuseChanged = true;
						}
						if (event.button) {
							event.button.classList.remove("selectedx");
						}
						button.classList.add("selectedx");
						event.button = button;
						if (event.control && button.link) {
							event.control.replacex(player.storage.huashen.owned[button.link]);
						}
					}
					game.check();
				};
				event.custom.replace.window = function () {
					//解禁更换操作
					const paginationInstance = event.dialog.paginationMap?.get(event.dialog.content.querySelector(".buttons"));
					if (paginationInstance?.state) {
						paginationInstance.state.pageRefuseChanged = false;
					}
					if (event.button) {
						event.button.classList.remove("selectedx");
						event.button = null;
					}
					if (event.control) {
						event.control.replacex(["cancel2"]);
					}
				};
				event.switchToAuto = function () {
					const cards = [];
					const skills = [];
					for (const i in player.storage.huashen.owned) {
						cards.push(i);
						skills.addArray(player.storage.huashen.owned[i]);
					}
					const cond = event.triggername == "phaseBegin" ? "in" : "out";
					skills.randomSort();
					skills.sort(function (a, b) {
						return get.skillRank(b, cond) - get.skillRank(a, cond);
					});
					_status.imchoosing = false;
					let skill = skills[0],
						character;
					for (const i in player.storage.huashen.owned) {
						if (player.storage.huashen.owned[i].includes(skill)) {
							character = i;
							break;
						}
					}
					resolve({
						bool: true,
						skill: skill,
						character: character,
					});
					if (event.dialog) {
						event.dialog.close();
					}
					if (event.control) {
						event.control.close();
					}
				};
				const controls = [];
				event.control = ui.create.control();
				event.control.replacex = function () {
					const args = Array.from(arguments)[0];
					if (args.includes("cancel2") && forced) {
						args.remove("cancel2");
						this.style.opacity = "";
					}
					args.push(function (link) {
						const result = event._result;
						if (link == "cancel2") {
							result.bool = false;
						} else {
							if (!event.button) {
								return;
							}
							result.bool = true;
							result.skill = link;
							result.character = event.button.link;
						}
						event.dialog.close();
						event.control.close();
						game.resume(); // 不再 game.resume 防止 game.loop 被重复执行
						_status.imchoosing = false;
						resolve(result);
					});
					return this.replace.apply(this, args);
				};
				if (!forced) {
					controls.push("cancel2");
					event.control.style.opacity = 1;
				}
				event.control.replacex(controls);
				game.pause(); // 暂停 game.loop 防止 game.resume2
				game.countChoose();
				return promise;
			};
			let next;
			if (event.isMine()) {
				next = chooseButton(player, cards, event.logged);
			} else if (event.isOnline()) {
				const { promise, resolve } = Promise.withResolvers();
				event.player.send(chooseButton, event.player, cards, event.logged);
				event.player.wait(async result => {
					if (result == "ai") {
						result = await switchToAuto();
					}

					resolve(result);
				}); // 不再 game.resume 防止 game.loop 被重复执行
				game.pause(); // 暂停 game.loop 防止 game.resume2
				next = promise;
			} else {
				next = switchToAuto();
			}
			const result = await next;
			// _status.paused = false; // 恢复 game.loop 但不立刻执行
			game.resume();
			result.logged = event.logged;
			event.result = {
				bool: result.bool,
				cost_data: result,
			};
		},
		async content(event, trigger, player) {
			const map = event.cost_data;
			if (!map.logged) {
				player.logSkill("huashen");
			}
			const skill = map.skill,
				character = map.character;
			player.storage.huashen.choosed.add(character);
			if (character != player.storage.huashen.current) {
				const old = player.storage.huashen.current;
				player.storage.huashen.current = character;
				player.markSkill("huashen");
				game.broadcastAll(
					function (player, character, old) {
						player.tempname.remove(old);
						player.tempname.add(character);
						player.sex = lib.character[character].sex;
						//player.group=lib.character[character][1];
						//player.node.name.dataset.nature=get.groupnature(player.group);
						/*
						const mark = player.marks.huashen;
						if (!mark) return;
						mark.style.transition = "all 0.3s";
						setTimeout(function () {
							mark.style.transition = "all 0s";
							ui.refresh(mark);
							mark.setBackground(character, "character");
							if (mark.firstChild) {
								mark.firstChild.remove();
							}
							setTimeout(function () {
								mark.style.transition = "";
								mark.show();
							}, 50);
						}, 200);
						*/
					},
					player,
					character,
					old
				);
				get.character().group;
				game.log(player, "将性别变为了", "#y" + get.translation(get.character(character).sex) + "性");
				await player.changeGroup(get.character(character).group);
			}
			player.storage.huashen.current2 = skill;
			if (!player.additionalSkills.huashen || !player.additionalSkills.huashen.includes(skill)) {
				player.flashAvatar("huashen", character);
				player.syncStorage("huashen");
				player.updateMarks("huashen");
				await player.addAdditionalSkills("huashen", skill);
				// lib.skill.rehuashen.createAudio(character,skill,'zuoci');
			}
		},
	},
	huashen2: { audio: 2 },
	xinsheng: {
		audio: 2,
		unique: true,
		trigger: { player: "damageEnd" },
		frequent: true,
		getIndex: event => event.num,
		filter(event) {
			return event.num;
		},
		async content(event, trigger, player) {
			lib.skill.huashen.addHuashens(player, 1);
		},
		ai: { combo: "huashen" },
	},
	huoshou: {
		audio: "huoshou1",
		audioname: ["re_menghuo"],
		locked: true,
		group: ["huoshou1", "huoshou2"],
		preHidden: ["huoshou1", "huoshou2"],
		ai: {
			halfneg: true,
			effect: {
				target(card, player, target) {
					if (card.name == "nanman") {
						return "zeroplayertarget";
					}
				},
			},
		},
	},
	huoshou1: {
		audio: 2,
		audioname: ["re_menghuo"],
		trigger: { target: "useCardToBefore" },
		forced: true,
		priority: 15,
		sourceSkill: "huoshou",
		filter(event, player) {
			return event.card.name == "nanman";
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	huoshou2: {
		audio: "huoshou1",
		audioname: ["re_menghuo"],
		trigger: { global: "useCard" },
		forced: true,
		sourceSkill: "huoshou",
		filter(event, player) {
			return event.card && event.card.name == "nanman" && event.player != player;
		},
		async content(event, trigger, player) {
			trigger.customArgs.default.customSource = player;
		},
	},
	zaiqixx: {
		audio: "zaiqi",
		inherit: "zaiqi",
	},
	zaiqi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin1" },
		filter(event, player) {
			return !event.numFixed && player.isDamaged();
		},
		check(event, player) {
			if (player.getDamagedHp() < 2) {
				return false;
			} else if (player.getDamagedHp() == 2) {
				return player.countCards("h") >= 2;
			}
			return true;
		},
		async content(event, trigger, player) {
			trigger.changeToZero();
			let cards = get.cards(player.getDamagedHp() + (event.name == "zaiqi" ? 0 : 1), true);
			cards = (await player.showCards(cards, `${get.translation(player)}发动了〖${get.translation(event.name)}〗`, true).set("delay_time", Math.min(4, cards.length)).forResult()).cards;
			let num = 0;
			for (let i = 0; i < cards.length; i++) {
				if (get.suit(cards[i]) == "heart") {
					num++;
					cards.splice(i--, 1);
				}
			}
			if (num) {
				await player.recover(num);
			}
			if (cards.length) {
				await player.gain(cards, "gain2");
			}
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
					return 2;
				}
				if (target.hp == 2) {
					return 1.5;
				}
				return 1;
			},
		},
	},
	juxiang: {
		//unique:true,
		locked: true,
		audio: "juxiang1",
		audioname: ["re_zhurong", "ol_zhurong"],
		group: ["juxiang1", "juxiang2"],
		preHidden: ["juxiang1", "juxiang2"],
		ai: {
			effect: {
				target(card) {
					if (card.name == "nanman") {
						return [0, 1, 0, 0];
					}
				},
			},
		},
	},
	juxiang1: {
		audio: 2,
		audioname: ["re_zhurong", "ol_zhurong"],
		trigger: { target: "useCardToBefore" },
		forced: true,
		priority: 15,
		sourceSkill: "juxiang",
		filter(event, player) {
			return event.card.name == "nanman";
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	juxiang2: {
		audio: "juxiang1",
		audioname: ["re_zhurong", "ol_zhurong"],
		trigger: { global: "useCardAfter" },
		forced: true,
		sourceSkill: "juxiang",
		filter(event, player) {
			return event.card.name == "nanman" && event.player != player && event.cards.someInD();
		},
		async content(event, trigger, player) {
			await player.gain(trigger.cards.filterInD(), "gain2");
		},
	},
	lieren: {
		audio: 2,
		audioname: ["boss_lvbu3", "ol_zhurong"],
		trigger: { source: "damageSource" },
		filter(event, player) {
			if (event._notrigger.includes(event.player)) {
				return false;
			}
			return event.card && event.card.name == "sha" && event.getParent().name == "sha" && event.player.isIn() && player.canCompare(event.player);
		},
		check(event, player) {
			return get.attitude(player, event.player) < 0 && player.countCards("h") > 1;
		},
		//priority:5,
		async content(event, trigger, player) {
			const result = await player.chooseToCompare(trigger.player).forResult();
			if (result.bool && trigger.player.countGainableCards(player, "he")) {
				await player.gainPlayerCard(trigger.player, true, "he");
			}
		},
	},
	xingshang: {
		audio: 2,
		audioname2: { caoying: "lingren_xingshang" },
		trigger: { global: "die" },
		preHidden: true,
		filter(event) {
			return event.player.countCards("he") > 0;
		},
		async content(event, trigger, player) {
			event.togain = trigger.player.getCards("he");
			await player.gain(event.togain, trigger.player, "giveAuto", "bySelf");
		},
	},
	fangzhu: {
		audio: 2,
		audioname2: { new_simayi: "fangzhu_new_simayi" },
		trigger: { player: "damageEnd" },
		preHidden: true,
		async cost(event, trigger, player) {
			const draw = player.getDamagedHp();
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "令一名其他角色翻面" + (draw > 0 ? "并摸" + get.cnNumber(draw) + "张牌" : ""), function (card, player, target) {
					return player != target;
				})
				.setHiddenSkill(event.skill)
				.set("ai", target => {
					if (target.hasSkillTag("noturn")) {
						return 0;
					}
					const player = _status.event.player;
					const current = _status.currentPhase;
					const dis = current ? get.distance(current, target, "absolute") : 1;
					const draw = player.getDamagedHp();
					const att = get.attitude(player, target);
					if (att == 0) {
						return target.hasJudge("lebu") ? Math.random() / 3 : Math.sqrt(get.threaten(target)) / 5 + Math.random() / 2;
					}
					if (att > 0) {
						if (target.isTurnedOver()) {
							return att + draw;
						}
						if (draw < 4) {
							return -1;
						}
						if (current && target.getSeatNum() > current.getSeatNum()) {
							return att + draw / 3;
						}
						return (10 * Math.sqrt(Math.max(0.01, get.threaten(target)))) / (3.5 - draw) + dis / (2 * game.countPlayer());
					} else {
						if (target.isTurnedOver()) {
							return att - draw;
						}
						if (draw >= 5) {
							return -1;
						}
						if (current && target.getSeatNum() <= current.getSeatNum()) {
							return -att + draw / 3;
						}
						return (4.25 - draw) * 10 * Math.sqrt(Math.max(0.01, get.threaten(target))) + (2 * game.countPlayer()) / dis;
					}
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const draw = player.getDamagedHp();
			if (draw > 0) {
				await event.targets[0].draw(draw);
			}
			await event.targets[0].turnOver();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						if (target.hp <= 1) {
							return;
						}
						if (!target.hasFriend()) {
							return;
						}
						let hastarget = false;
						let turnfriend = false;
						const players = game.filterPlayer();
						for (let i = 0; i < players.length; i++) {
							if (get.attitude(target, players[i]) < 0 && !players[i].isTurnedOver()) {
								hastarget = true;
							}
							if (get.attitude(target, players[i]) > 0 && players[i].isTurnedOver()) {
								hastarget = true;
								turnfriend = true;
							}
						}
						if (get.attitude(player, target) > 0 && !hastarget) {
							return;
						}
						if (turnfriend || target.hp == target.maxHp) {
							return [0.5, 1];
						}
						if (target.hp > 1) {
							return [1, 0.5];
						}
					}
				},
			},
		},
	},
	fangzhu_new_simayi: { audio: 1 },
	songwei: {
		group: "songwei2",
		audioname: ["re_caopi"],
		audio: "songwei2",
		zhuSkill: true,
	},
	songwei2: {
		audio: 2,
		audioname: ["re_caopi"],
		audioname2: {
			pe_jun_caopi: "sbsongwei",
		},
		forceaudio: true,
		trigger: { global: "judgeEnd" },
		sourceSkill: "songwei",
		filter(event, player) {
			if (event.player == player || event.player.group != "wei") {
				return false;
			}
			if (event.result.color != "black") {
				return false;
			}
			return player.hasZhuSkill("songwei", event.player);
		},
		async cost(event, trigger, player) {
			event.result = await trigger.player
				.chooseBool("是否发动【颂威】，令" + get.translation(player) + "摸一张牌？")
				.set("choice", get.attitude(trigger.player, player) > 0)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.player.line(player, "green");
			player.draw();
		},
	},
	jiezi: {
		trigger: { global: ["phaseDrawSkipped", "phaseDrawCancelled"] },
		audio: 2,
		forced: true,
		filter(event, player) {
			return event.player != player;
		},
		async content(event, trigger, player) {
			await player.draw();
		},
	},
	gzduanliang: {
		audio: "duanliang1",
		audioname: ["re_xuhuang"],
		group: ["duanliang1", "duanliang2"],
		ai: {
			threaten: 1.2,
		},
	},
	duanliang: {
		audio: "duanliang1",
		audioname: ["re_xuhuang"],
		group: ["duanliang1", "duanliang3"],
		ai: {
			threaten: 1.2,
		},
	},
	duanliang1: {
		audio: 2,
		audioname: ["re_xuhuang"],
		enable: "chooseToUse",
		sourceSkill: "duanliang",
		filterCard(card) {
			if (get.type(card) != "basic" && get.type(card) != "equip") {
				return false;
			}
			return get.color(card) == "black";
		},
		filter(event, player) {
			return player.countCards("hes", { type: ["basic", "equip"], color: "black" });
		},
		position: "hes",
		viewAs: { name: "bingliang" },
		prompt: "将一黑色的基本牌或装备牌当兵粮寸断使用",
		check(card) {
			return 6 - get.value(card);
		},
		ai: {
			order: 9,
		},
	},
	duanliang2: {
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "bingliang") {
					if (get.distance(player, target) <= 2) {
						return true;
					}
				}
			},
		},
	},
	duanliang3: {
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "bingliang") {
					if (target.countCards("h") >= player.countCards("h")) {
						return true;
					}
				}
			},
		},
	},
	haoshi: {
		audio: 2,
		trigger: { player: "phaseDrawBegin2" },
		filter(event, player) {
			return !event.numFixed;
		},
		preHidden: true,
		check(event, player) {
			return (
				player.countCards("h") + 2 + event.num <= 5 ||
				game.hasPlayer(function (target) {
					return (
						player !== target &&
						!game.hasPlayer(function (current) {
							return current !== player && current !== target && current.countCards("h") < target.countCards("h");
						}) &&
						get.attitude(player, target) > 0
					);
				})
			);
		},
		async content(event, trigger, player) {
			trigger.num += 2;
			player.addSkill("haoshi2");
		},
		ai: {
			threaten: 2,
			noh: true,
			skillTagFilter(player, tag) {
				if (tag == "noh") {
					if (player.countCards("h") != 2) {
						return false;
					}
				}
			},
		},
	},
	haoshi2: {
		trigger: { player: "phaseDrawEnd" },
		forced: true,
		popup: false,
		audio: false,
		sourceSkill: "haoshi",
		async content(event, trigger, player) {
			player.removeSkill("haoshi2");
			if (player.countCards("h") <= 5) {
				return;
			}
			const result = await player.chooseCardTarget({
				selectCard: Math.floor(player.countCards("h") / 2),
				filterTarget(card, player, target) {
					return target.isMinHandcard();
				},
				prompt: "将一半的手牌交给场上手牌数最少的一名角色",
				forced: true,
				ai2(target) {
					return get.attitude(_status.event.player, target);
				},
			}).forResult();
			if (result.targets && result.targets[0]) {
				await player.give(result.cards, result.targets[0]);
			}
		},
	},
	dimeng: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		position: "he",
		filterCard() {
			const targets = ui.selected.targets;
			if (targets.length == 2) {
				if (Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) <= ui.selected.cards.length) {
					return false;
				}
			}
			return true;
		},
		selectCard: [0, Infinity],
		selectTarget: 2,
		complexCard: true,
		complexTarget: true,
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			const targets = ui.selected.targets;
			if (!targets?.length) {
				return true;
			} else if (targets.concat([target]).every(target => !target.countCards("h"))) {
				return false;
			}
			return Math.abs(targets[0].countCards("h") - target.countCards("h")) == ui.selected.cards.length;
		},
		/*filterOk() {
			if (targets.length != 2) {
				return false;
			}
			return Math.abs(targets[0].countCards("h") - targets[1].countCards("h")) == ui.selected.cards.length;
		},*/
		multitarget: true,
		multiline: true,
		async content(event, trigger, player) {
			event.targets[0].swapHandcards(event.targets[1]);
		},
		check(card) {
			const list = [],
				player = _status.event.player;
			const num = player.countCards("he");
			const players = game.filterPlayer();
			let count;
			for (let i = 0; i < players.length; i++) {
				if (players[i] != player && get.attitude(player, players[i]) > 3) {
					list.push(players[i]);
				}
			}
			list.sort(function (a, b) {
				return a.countCards("h") - b.countCards("h");
			});
			if (list.length == 0) {
				return -1;
			}
			const from = list[0];
			list.length = 0;
			for (let i = 0; i < players.length; i++) {
				if (players[i] != player && get.attitude(player, players[i]) < 1) {
					list.push(players[i]);
				}
			}
			if (list.length == 0) {
				return -1;
			}
			list.sort(function (a, b) {
				return b.countCards("h") - a.countCards("h");
			});
			if (from.countCards("h") >= list[0].countCards("h")) {
				return -1;
			}
			for (let i = 0; i < list.length && from.countCards("h") < list[i].countCards("h"); i++) {
				if (list[i].countCards("h") - from.countCards("h") <= num) {
					count = list[i].countCards("h") - from.countCards("h");
					break;
				}
			}
			if (count < 2 && from.countCards("h") >= 2) {
				return -1;
			}
			if (ui.selected.cards.length < count) {
				return 11 - get.value(card);
			}
			return -1;
		},
		ai: {
			order: 6,
			threaten: 3,
			expose: 0.9,
			result: {
				target(player, target) {
					const list = [];
					const num = player.countCards("he");
					const players = game.filterPlayer();
					if (ui.selected.targets.length == 0) {
						for (let i = 0; i < players.length; i++) {
							if (players[i] != player && get.attitude(player, players[i]) > 3) {
								list.push(players[i]);
							}
						}
						list.sort(function (a, b) {
							return a.countCards("h") - b.countCards("h");
						});
						if (target == list[0]) {
							return get.attitude(player, target);
						}
						return -get.attitude(player, target);
					} else {
						const from = ui.selected.targets[0];
						for (let i = 0; i < players.length; i++) {
							if (players[i] != player && get.attitude(player, players[i]) < 1) {
								list.push(players[i]);
							}
						}
						list.sort(function (a, b) {
							return b.countCards("h") - a.countCards("h");
						});
						if (from.countCards("h") >= list[0].countCards("h")) {
							return -get.attitude(player, target);
						}
						for (let i = 0; i < list.length && from.countCards("h") < list[i].countCards("h"); i++) {
							if (list[i].countCards("h") - from.countCards("h") <= num) {
								const count = list[i].countCards("h") - from.countCards("h");
								if (count < 2 && from.countCards("h") >= 2) {
									return -get.attitude(player, target);
								}
								if (target == list[i]) {
									return get.attitude(player, target);
								}
								return -get.attitude(player, target);
							}
						}
					}
				},
			},
		},
	},
	yinghun: {
		audio: 2,
		audioname: ["re_sunjian", "sunce", "re_sunben", "re_sunce", "ol_sunjian"],
		audioname2: {
			re_sunyi: "gzyinghun_re_sunyi",
			boss_sunce: "yinghun_sunce",
		},
		mod: {
			aiOrder(player, card, num) {
				if (num > 0 && _status.event && _status.event.type == "phase" && get.tag(card, "recover")) {
					if (player.needsToDiscard()) {
						return num / 3;
					}
					return 0;
				}
			},
		},
		locked: false,
		trigger: { player: "phaseZhunbeiBegin" },
		preHidden: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					if (player.getDamagedHp() == 1 && target.countCards("he") == 0) {
						return 0;
					}
					if (get.attitude(_status.event.player, target) > 0) {
						return 10 + get.attitude(_status.event.player, target);
					}
					if (player.getDamagedHp() == 1) {
						return -1;
					}
					return 1;
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const num = player.getDamagedHp();
			const [target] = event.targets;
			let directcontrol = num == 1;
			if (!directcontrol) {
				const str1 = "摸" + get.cnNumber(num, true) + "弃一";
				const str2 = "摸一弃" + get.cnNumber(num, true);
				directcontrol =
					str1 ==
					(await player
						.chooseControl(str1, str2, function (event, player) {
							if (player.isHealthy()) {
								return 1 - _status.event.choice;
							}
							return _status.event.choice;
						})
						.set("choice", get.attitude(player, target) > 0 ? 0 : 1)
						.forResult()).control;
			}
			if (directcontrol) {
				if (num > 0) {
					await target.draw(num);
				}
				await target.chooseToDiscard(true, "he");
			} else {
				await target.draw();
				if (num > 0) {
					await target.chooseToDiscard(num, true, "he", "allowChooseAll");
				}
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (
						get.tag(card, "damage") &&
						get.itemtype(player) === "player" &&
						target.hp >
							(player.hasSkillTag("damageBonus", true, {
								target: target,
								card: card,
							})
								? 2
								: 1)
					) {
						return [1, 0.5];
					}
				},
			},
			threaten(player, target) {
				return Math.max(0.5, target.getDamagedHp() / 2);
			},
			maixie: true,
		},
	},
	gzyinghun: {
		audio: "yinghun",
		audioname: ["re_sunjian", "sunce", "re_sunben", "re_sunce", "ol_sunjian", "sb_sunce"],
		audioname2: {
			re_sunyi: "gzyinghun_re_sunyi",
		},
		mod: {
			aiOrder(player, card, num) {
				if (num > 0 && _status.event && _status.event.type == "phase" && get.tag(card, "recover")) {
					if (player.needsToDiscard()) {
						return num / 3;
					}
					return 0;
				}
			},
		},
		locked: false,
		trigger: { player: "phaseZhunbeiBegin" },
		filter(event, player) {
			return player.getDamagedHp() > 0;
		},
		preHidden: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					const player = _status.event.player;
					if (player.getDamagedHp() == 1 && target.countCards("he") == 0) {
						return 0;
					}
					if (get.attitude(_status.event.player, target) > 0) {
						return 10 + get.attitude(_status.event.player, target);
					}
					if (player.getDamagedHp() == 1) {
						return -1;
					}
					return 1;
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const num = player.getDamagedHp();
			const [target] = event.targets;
			let directcontrol = num == 1;
			if (!directcontrol) {
				const str1 = "摸" + get.cnNumber(num, true) + "弃一";
				const str2 = "摸一弃" + get.cnNumber(num, true);
				directcontrol =
					str1 ==
					(await player
						.chooseControl(str1, str2, function (event, player) {
							return _status.event.choice;
						})
						.set("choice", get.attitude(player, target) > 0 ? str1 : str2)
						.forResult()).control;
			}
			if (directcontrol) {
				await target.draw(num);
				await target.chooseToDiscard(true, "he");
			} else {
				await target.draw();
				await target.chooseToDiscard(num, true, "he");
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (
						get.tag(card, "damage") &&
						get.itemtype(player) === "player" &&
						target.hp >
							(player.hasSkillTag("damageBonus", true, {
								target: target,
								card: card,
							})
								? 2
								: 1)
					) {
						return [1, 0.5];
					}
				},
			},
			threaten(player, target) {
				return Math.max(0.5, target.getDamagedHp() / 2);
			},
			maixie: true,
		},
	},
	yinghun_ol_sunjian: { audio: 2 },
	jiuchi: {
		audio: 2,
		audioname: ["re_dongzhuo"],
		enable: "chooseToUse",
		filterCard(card) {
			return get.suit(card) == "spade";
		},
		viewAs: { name: "jiu" },
		viewAsFilter(player) {
			if (!player.countCards("hs", { suit: "spade" })) {
				return false;
			}
			return true;
		},
		prompt: "将一张黑桃手牌当酒使用",
		check(card) {
			if (_status.event.type == "dying") {
				return 1 / Math.max(0.1, get.value(card));
			}
			return 4 - get.value(card);
		},
		ai: {
			threaten: 1.5,
		},
	},
	roulin: {
		audio: 2,
		audioname: ["re_dongzhuo", "ol_dongzhuo"],
		trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
		forced: true,
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			if (player == event.player) {
				return event.target.hasSex("female");
			}
			return event.player.hasSex("female");
		},
		check(event, player) {
			return player == event.player;
		},
		async content(event, trigger, player) {
			const id = (player == trigger.player ? trigger.target : player).playerid;
			const map = trigger.getParent().customArgs;
			if (!map[id]) {
				map[id] = {};
			}
			if (typeof map[id].shanRequired == "number") {
				map[id].shanRequired++;
			} else {
				map[id].shanRequired = 2;
			}
		},
		ai: {
			halfneg: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "directHit_ai") {
					return;
				}
				if (arg.card.name != "sha" || !arg.target.hasSex("female") || arg.target.countCards("h", "shan") > 1) {
					return false;
				}
			},
		},
	},
	benghuai: {
		audio: 2,
		audioname: ["re_dongzhuo", "ol_dongzhuo"],
		audioname2: {
			zhugedan: "benghuai_zhugedan",
			re_zhugedan: "benghuai_re_zhugedan",
		},
		trigger: { player: "phaseJieshuBegin" },
		forced: true,
		check() {
			return false;
		},
		filter(event, player) {
			return !player.isMinHp();
		},
		async content(event, trigger, player) {
			const { control } = await player
				.chooseControl("baonue_hp", "baonue_maxHp", function (event, player) {
					if (player.hp == player.maxHp) {
						return "baonue_hp";
					}
					if (player.hp < player.maxHp - 1 || player.hp <= 2) {
						return "baonue_maxHp";
					}
					return "baonue_hp";
				})
				.set("prompt", "崩坏：失去1点体力或减1点体力上限")
				.forResult();
			if (control == "baonue_hp") {
				await player.loseHp();
			} else {
				await player.loseMaxHp(true);
			}
		},
		ai: {
			threaten: 0.5,
			neg: true,
		},
	},
	baonue: {
		group: "baonue2",
		audioname: ["re_dongzhuo"],
		audio: "baonue2",
		zhuSkill: true,
	},
	baonue2: {
		audio: 2,
		audioname: ["re_dongzhuo"],
		//forceaudio:true,
		trigger: { global: "damageSource" },
		sourceSkill: "baonue",
		filter(event, player) {
			if (player == event.source || !event.source || event.source.group != "qun") {
				return false;
			}
			return player.hasZhuSkill("baonue", event.source);
		},
		async cost(event, trigger, player) {
			event.result = await trigger.source
				.chooseBool("是否对" + get.translation(player) + "发动【暴虐】？")
				.set("choice", get.attitude(trigger.source, player) > 0)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.source.line(player, "green");
			const next = trigger.source.judge(function (card) {
				if (get.suit(card) == "spade") {
					return 4;
				}
				return 0;
			});
			next.judge2 = function (result) {
				return result.bool ? true : false;
			};
			const result = await next.forResult();
			if (result.suit == "spade") {
				await player.recover();
			}
		},
	},
	luanwu: {
		audio: 2,
		audioname: ["re_jiaxu"],
		enable: "phaseUse",
		filter(event, player) {
			return game.hasPlayer(current => player != current);
		},
		limited: true,
		skillAnimation: "epic",
		animationColor: "thunder",
		filterTarget: lib.filter.notMe,
		selectTarget: -1,
		multiline: true,
		async contentBefore(event, trigger, player) {
			player.awakenSkill(event.skill);
		},
		async content(event, trigger, player) {
			const { target } = event;
			const result = await target
				.chooseToUse(
					"乱武：使用一张【杀】或失去1点体力",
					function (card) {
						if (get.name(card) != "sha") {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					function (card, player, target) {
						if (player == target) {
							return false;
						}
						var dist = get.distance(player, target);
						if (dist > 1) {
							if (
								game.hasPlayer(function (current) {
									return current != player && get.distance(player, current) < dist;
								})
							) {
								return false;
							}
						}
						return lib.filter.filterTarget.apply(this, arguments);
					}
				)
				.set("ai2", function () {
					return get.effect_use.apply(this, arguments) - get.event().effect;
				})
				.set("effect", get.effect(target, { name: "losehp" }, target, target))
				.set("addCount", false)
				.forResult();
			if (!result?.bool) {
				await target.loseHp();
			}
		},
		ai: {
			order: 1,
			result: {
				player(player) {
					if (lib.config.mode == "identity" && game.zhu.isZhu && player.identity == "fan") {
						if (game.zhu.hp == 1 && game.zhu.countCards("h") <= 2) {
							return 1;
						}
					}
					const players = game.filterPlayer();
					let num = 0;
					for (let i = 0; i < players.length; i++) {
						let att = get.attitude(player, players[i]);
						if (att > 0) {
							att = 1;
						}
						if (att < 0) {
							att = -1;
						}
						if (players[i] != player && players[i].hp <= 3) {
							const hs = players[i].countCards("hs");
							if (hs === 0) {
								num += att / players[i].hp;
							} else if (hs === 1) {
								num += att / 2 / players[i].hp;
							} else if (hs === 2) {
								num += att / 4 / players[i].hp;
							}
						}
						if (players[i].hp == 1) {
							num += att * 1.5;
						}
					}
					if (player.hp == 1) {
						return -num;
					}
					if (player.hp == 2) {
						return -game.players.length / 4 - num;
					}
					return -game.players.length / 3 - num;
				},
			},
		},
	},
	wansha: {
		locked: true,
		audio: 2,
		audioname: ["re_jiaxu", "boss_lvbu3", "new_simayi"],
		audioname2: { shen_simayi: "jilue_wansha" },
		global: "wansha2",
		trigger: { global: "dying" },
		priority: 15,
		forced: true,
		preHidden: true,
		filter(event, player, name) {
			return _status.currentPhase == player && event.player != player;
		},
		async content() {},
	},
	wansha2: {
		mod: {
			cardSavable(card, player) {
				if (card.name == "tao" && _status.currentPhase?.isIn() && _status.currentPhase.hasSkill("wansha") && _status.currentPhase != player) {
					if (!player.isDying()) {
						return false;
					}
				}
			},
			cardEnabled(card, player) {
				if (card.name == "tao" && _status.currentPhase?.isIn() && _status.currentPhase.hasSkill("wansha") && _status.currentPhase != player) {
					if (!player.isDying()) {
						return false;
					}
				}
			},
		},
	},
	weimu: {
		trigger: { global: "useCard1" },
		audio: 2,
		audioname2: {
			wangyuanji: "qc_weimu",
			boss_chujiangwang: "boss_chujiangwang_weimu",
		},
		forced: true,
		firstDo: true,
		filter(event, player) {
			if (event.player == player) {
				return false;
			}
			if (get.color(event.card) != "black" || get.type(event.card) != "trick") {
				return false;
			}
			var info = lib.card[event.card.name];
			return info && info.selectTarget && info.selectTarget == -1 && !info.toself;
		},
		async content(event, trigger, player) {},
		mod: {
			targetEnabled(card) {
				if ((get.type(card) == "trick" || get.type(card) == "delay") && get.color(card) == "black") {
					return false;
				}
			},
		},
	},
	huoji: {
		audio: 2,
		enable: "chooseToUse",
		filterCard(card) {
			return get.color(card) == "red";
		},
		viewAs: { name: "huogong" },
		viewAsFilter(player) {
			if (!player.countCards("hs", { color: "red" })) {
				return false;
			}
		},
		position: "hs",
		prompt: "将一张红色牌当火攻使用",
		check(card) {
			const player = get.player();
			if (player.countCards("h") > player.hp) {
				return 6 - get.value(card);
			}
			return 3 - get.value(card);
		},
		ai: {
			fireAttack: true,
		},
	},
	bazhen: {
		audio: 2,
		audioname: ["re_sp_zhugeliang", "ol_sp_zhugeliang", "ol_pangtong"],
		group: "bazhen_bagua",
		locked: true,
		init(player, skill) {
			player.addExtraEquip(skill, "bagua", true, player => player.hasEmptySlot(2) && lib.card.bagua);
		},
		onremove(player, skill) {
			player.removeExtraEquip(skill);
		},
	},
	bazhen_bagua: {
		audio: "bazhen",
		audioname: ["re_sp_zhugeliang", "ol_sp_zhugeliang", "ol_pangtong"],
		equipSkill: true,
		noHidden: true,
		inherit: "bagua_skill",
		sourceSkill: "bazhen",
		filter(event, player) {
			if (!lib.skill.bagua_skill.filter(event, player)) {
				return false;
			}
			if (!player.hasEmptySlot(2)) {
				return false;
			}
			return true;
		},
		ai: {
			respondShan: true,
			freeShan: true,
			skillTagFilter(player, tag, arg) {
				if (tag !== "respondShan" && tag !== "freeShan") {
					return;
				}
				if (!player.hasEmptySlot(2) || player.hasSkillTag("unequip2")) {
					return false;
				}
				if (!arg || !arg.player) {
					return true;
				}
				if (
					arg.player.hasSkillTag("unequip", false, {
						target: player,
					})
				) {
					return false;
				}
				return true;
			},
			effect: {
				target(card, player, target) {
					if (player == target && get.subtype(card) == "equip2") {
						if (get.equipValue(card) <= 7.5) {
							return 0;
						}
					}
					if (!target.hasEmptySlot(2)) {
						return;
					}
					return lib.skill.bagua_skill.ai.effect.target.apply(this, arguments);
				},
			},
		},
	},
	kanpo: {
		mod: {
			aiValue(player, card, num) {
				if (get.name(card) != "wuxie" && get.color(card) != "black") {
					return;
				}
				const cards = player.getCards("hs", function (card) {
					return get.name(card) == "wuxie" || get.color(card) == "black";
				});
				cards.sort(function (a, b) {
					return (get.name(b) == "wuxie" ? 1 : 2) - (get.name(a) == "wuxie" ? 1 : 2);
				});
				const geti = function () {
					if (cards.includes(card)) {
						return cards.indexOf(card);
					}
					return cards.length;
				};
				if (get.name(card) == "wuxie") {
					return Math.min(num, [6, 4, 3][Math.min(geti(), 2)]) * 0.6;
				}
				return Math.max(num, [6, 4, 3][Math.min(geti(), 2)]);
			},
			aiUseful() {
				return lib.skill.kanpo.mod.aiValue.apply(this, arguments);
			},
		},
		locked: false,
		audio: 2,
		enable: "chooseToUse",
		filterCard(card) {
			return get.color(card) == "black";
		},
		viewAsFilter(player) {
			return player.countCards("hs", { color: "black" }) > 0;
		},
		viewAs: { name: "wuxie" },
		position: "hs",
		prompt: "将一张黑色手牌当无懈可击使用",
		check(card) {
			const tri = _status.event.getTrigger();
			if (tri && tri.card && tri.card.name == "chiling") {
				return -1;
			}
			return 8 - get.value(card);
		},
		threaten: 1.2,
	},
	niepan: {
		audio: 2,
		audioname: ["re_pangtong"],
		audioname2: { sb_pangtong: "sbniepan" },
		enable: "chooseToUse",
		limited: true,
		skillAnimation: true,
		animationColor: "fire",
		filter(event, player) {
			if (event.type == "dying") {
				if (player != event.dying) {
					return false;
				}
				return true;
			} else if (event.getParent().name == "phaseUse") {
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.storage.niepan = true;
			await player.discard(player.getCards("hej"));
			await player.link(false);
			await player.turnOver(false);
			await player.draw(3);
			if (player.hp < 3) {
				await player.recover(3 - player.hp);
			}
		},
		ai: {
			order: 0.5,
			skillTagFilter(player, tag, target) {
				if (player != target || player.storage.niepan) {
					return false;
				}
			},
			save: true,
			result: {
				player(player) {
					if (player.hp <= 0) {
						return 10;
					}
					if (player.hp <= 1 && player.countCards("he") <= 1) {
						return 10;
					}
					return 0;
				},
			},
			threaten(player, target) {
				if (!target.storage.niepan) {
					return 0.6;
				}
			},
		},
	},
	oldniepan: {
		audio: "niepan",
		audioname2: { sb_pangtong: "sbniepan" },
		enable: "chooseToUse",
		skillAnimation: true,
		limited: true,
		animationColor: "orange",
		filter(event, player) {
			if (event.type == "dying") {
				if (player != event.dying) {
					return false;
				}
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.storage.oldniepan = true;
			await player.discard(player.getCards("hej"));
			await player.link(false);
			await player.turnOver(false);
			await player.draw(3);
			if (player.hp < 3) {
				await player.recover(3 - player.hp);
			}
		},
		ai: {
			order: 1,
			skillTagFilter(player, arg, target) {
				if (player != target || player.storage.oldniepan) {
					return false;
				}
			},
			save: true,
			result: {
				player(player) {
					if (player.hp <= 0) {
						return 10;
					}
					if (player.hp <= 2 && player.countCards("he") <= 1) {
						return 10;
					}
					return 0;
				},
			},
			threaten(player, target) {
				if (!target.storage.oldniepan) {
					return 0.6;
				}
			},
		},
	},
	quhu: {
		audio: 2,
		audioname: ["re_xunyu", "ol_xunyu"],
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			if (player.countCards("h") == 0) {
				return false;
			}
			return game.hasPlayer(function (current) {
				return current.hp > player.hp && player.canCompare(current);
			});
		},
		filterTarget(card, player, target) {
			return target.hp > player.hp && player.canCompare(target);
		},
		async content(event, trigger, player) {
			const target = event.target;
			const { bool } = await player.chooseToCompare(target).forResult();
			if (!bool) {
				return void (await player.damage(target));
			}
			if (
				!game.hasPlayer(function (player) {
					return player != target && target.inRange(player);
				})
			) {
				return;
			}
			const result = await player
				.chooseTarget(function (card, player, target) {
					const source = _status.event.source;
					return target != source && source.inRange(target);
				}, true)
				.set("ai", function (target) {
					return get.damageEffect(target, _status.event.source, player);
				})
				.set("source", target)
				.forResult();
			if (!result.bool || !result.targets || !result.targets.length) {
				return;
			}
			target.line(result.targets[0], "green");
			await result.targets[0].damage(target);
		},
		ai: {
			order: 0.5,
			result: {
				target(player, target) {
					const att = get.attitude(player, target);
					const oc = target.countCards("h") == 1;
					if (att > 0 && oc) {
						return 0;
					}
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						if (players[i] != target && players[i] != player && target.inRange(players[i])) {
							if (get.damageEffect(players[i], target, player) > 0) {
								return att > 0 ? att / 2 : att - (oc ? 5 : 0);
							}
						}
					}
					return 0;
				},
				player(player, target) {
					if (target.hasSkillTag("jueqing", false, target)) {
						return -10;
					}
					const hs = player.getCards("h");
					let mn = 1;
					for (let i = 0; i < hs.length; i++) {
						mn = Math.max(mn, get.number(hs[i]));
					}
					if (mn <= 11 && player.hp < 2) {
						return -20;
					}
					let max = player.maxHp - hs.length;
					const players = game.filterPlayer();
					for (let i = 0; i < players.length; i++) {
						if (get.attitude(player, players[i]) > 2) {
							max = Math.max(Math.min(5, players[i].hp) - players[i].countCards("h"), max);
						}
					}
					switch (max) {
						case 0:
							return mn == 13 ? 0 : -20;
						case 1:
							return mn >= 12 ? 0 : -15;
						case 2:
							return 0;
						case 3:
							return 1;
						default:
							return max;
					}
				},
			},
			expose: 0.2,
		},
	},
	jieming: {
		audio: 2,
		trigger: { player: "damageEnd" },
		getIndex(event) {
			return event.num;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
					return true; //target.countCards('h')<Math.min(target.maxHp,5); // 没有卷入格式化大劫的上古代码碎片喵
				})
				.set("ai", function (target) {
					let att = get.attitude(_status.event.player, target);
					if (target.hasSkillTag("nogain")) {
						att /= 6;
					}
					if (att > 2) {
						return Math.max(0, Math.min(5, target.maxHp) - target.countCards("h"));
					}
					return att / 3;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			for (const target of event.targets) {
				await target.drawTo(Math.min(5, target.maxHp));
			}
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "damage") && target.hp > 1) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						const players = game.filterPlayer();
						let max = 0;
						for (let i = 0; i < players.length; i++) {
							if (get.attitude(target, players[i]) > 0) {
								max = Math.max(Math.min(5, players[i].hp) - players[i].countCards("h"), max);
							}
						}
						switch (max) {
							case 0:
								return 2;
							case 1:
								return 1.5;
							case 2:
								return [1, 2];
							default:
								return [0, max];
						}
					}
					if ((card.name == "tao" || card.name == "caoyao") && target.hp > 1 && target.countCards("h") <= target.hp) {
						return [0, 0];
					}
				},
			},
		},
	},
	qiangxix: {
		audio: "qiangxi",
		audioname: ["boss_lvbu3"],
		mod: {
			aiOrder(player, card, num) {
				if (player.getEquips(1).length || get.subtype(card, player) !== "equip1" || !player.hasSkillTag("noe")) {
					return num;
				}
				return 10;
			},
		},
		enable: "phaseUse",
		usable: 2,
		locked: false,
		filter(event, player) {
			if (player.hp < 1 && !player.hasCard(card => lib.skill.qiangxix.filterCard(card), "he")) {
				return false;
			}
			return game.hasPlayer(current => lib.skill.qiangxix.filterTarget(null, player, current));
		},
		filterCard(card) {
			return get.subtype(card) == "equip1";
		},
		position: "he",
		filterTarget(card, player, target) {
			if (target == player) {
				return false;
			}
			var stat = player.getStat()._qiangxix;
			return !stat || !stat.includes(target);
		},
		selectCard() {
			if (_status.event.player.hp < 1) {
				return 1;
			}
			return [0, 1];
		},
		async content(event, trigger, player) {
			const { target, cards } = event;
			const stat = player.getStat();
			stat._qiangxix ??= [];
			stat._qiangxix.push(target);

			if (!cards?.length) {
				await player.loseHp();
			}
			await target.damage("nocard");
		},
		ai: {
			damage: true,
			order: 8,
			result: {
				player(player, target) {
					if (ui.selected.cards.length) {
						return 0;
					}
					if (player.hp >= target.hp) {
						return -0.9;
					}
					if (player.hp <= 2) {
						return -10;
					}
					return get.effect(player, { name: "losehp" }, player, player);
				},
				target(player, target) {
					if (!ui.selected.cards.length) {
						if (player.hp < 2) {
							return 0;
						}
						if (player.hp == 2 && target.hp >= 2) {
							return 0;
						}
						if (target.hp > player.hp) {
							return 0;
						}
					}
					return get.damageEffect(target, player, target);
				},
			},
			threaten: 1.5,
		},
	},
	qiangxi: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		audioname: ["boss_lvbu3"],
		filterCard(card) {
			return get.subtype(card) == "equip1";
		},
		selectCard: [0, 1],
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			return player.inRange(target);
		},
		async content(event, trigger, player) {
			if (event.cards.length == 0) {
				await player.loseHp();
			}
			await event.target.damage("nocard");
		},
		check(card) {
			return 10 - get.value(card);
		},
		position: "he",
		ai: {
			damage: true,
			order: 8,
			result: {
				player(player, target) {
					if (ui.selected.cards.length) {
						return 0;
					}
					if (player.hp >= target.hp) {
						return -0.9;
					}
					if (player.hp <= 2) {
						return -10;
					}
					return -2;
				},
				target(player, target) {
					if (!ui.selected.cards.length) {
						if (player.hp < 2) {
							return 0;
						}
						if (player.hp == 2 && target.hp >= 2) {
							return 0;
						}
						if (target.hp > player.hp) {
							return 0;
						}
					}
					return get.damageEffect(target, player);
				},
			},
			threaten: 1.3,
		},
	},
	xinqiangxi: {
		audio: "qiangxi",
		enable: "phaseUse",
		filter(event, player) {
			const list = player.getStorage("xinqiangxi_used");
			if (list.includes("discard")) {
				return !list.includes("losehp");
			} else if (list.includes("losehp")) {
				return !list.includes("discard") && player.countCards("he", { type: "equip" }) > 0;
			} else {
				return true;
			}
		},
		filterCard(card) {
			const player = _status.event.player;
			if (player.getStorage("xinqiangxi_used").includes("discard")) {
				return false;
			}
			return get.type(card) == "equip";
		},
		selectCard() {
			const player = _status.event.player;
			if (player.getStorage("xinqiangxi_used").includes("discard")) {
				return -1;
			}
			if (player.getStorage("xinqiangxi_used").includes("losehp")) {
				return [1, 1];
			}
			return [0, 1];
		},
		filterTarget(card, player, target) {
			if (player == target) {
				return false;
			}
			return player.inRange(target);
		},
		async content(event, trigger, player) {
			player.addTempSkill("xinqiangxi_used");
			if (event.cards.length == 0) {
				player.markAuto("xinqiangxi_used", "losehp");
				await player.loseHp();
			} else {
				player.markAuto("xinqiangxi_used", "discard");
			}
			await event.target.damage("nocard");
		},
		check(card) {
			return 10 - get.value(card);
		},
		position: "he",
		ai: {
			order: 8.5,
			result: {
				target(player, target) {
					if (!ui.selected.cards.length) {
						if (player.hp < 2) {
							return 0;
						}
						if (target.hp >= player.hp) {
							return 0;
						}
					}
					return get.damageEffect(target, player);
				},
			},
		},
		threaten: 1.5,
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
			},
		},
	},
	tianyi: {
		audio: 2,
		audioname: ["re_taishici"],
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return player.canCompare(target);
		},
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const { bool } = await player.chooseToCompare(event.target).forResult();
			if (bool) {
				player.addTempSkill("tianyi2");
			} else {
				player.addTempSkill("tianyi3");
			}
		},
		ai: {
			order(name, player) {
				const cards = player.getCards("h");
				if (player.countCards("h", "sha") == 0) {
					return 1;
				}
				for (let i = 0; i < cards.length; i++) {
					if (cards[i].name != "sha" && get.number(cards[i]) > 11 && get.value(cards[i]) < 7) {
						return 9;
					}
				}
				return get.order({ name: "sha" }) - 1;
			},
			result: {
				player(player) {
					if (player.countCards("h", "sha") > 0) {
						return 0.6;
					}
					const num = player.countCards("h");
					if (num > player.hp) {
						return 0;
					}
					if (num == 1) {
						return -2;
					}
					if (num == 2) {
						return -1;
					}
					return -0.7;
				},
				target(player, target) {
					const num = target.countCards("h");
					if (num == 1) {
						return -1;
					}
					if (num == 2) {
						return -0.7;
					}
					return -0.5;
				},
			},
			threaten: 1.3,
		},
	},
	tianyi2: {
		mod: {
			targetInRange(card, player, target, now) {
				if (card.name == "sha") {
					return true;
				}
			},
			selectTarget(card, player, range) {
				if (card.name == "sha" && range[1] != -1) {
					range[1]++;
				}
			},
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + 1;
				}
			},
		},
		charlotte: true,
	},
	tianyi3: {
		mod: {
			cardEnabled(card) {
				if (card.name == "sha") {
					return false;
				}
			},
		},
		charlotte: true,
	},
	shuangxiong: {
		audio: 2,
		audioname: ["re_yanwen"],
		group: "shuangxiong_judge",
		subSkill: {
			judge: {
				audio: "shuangxiong",
				logAudio: () => 1,
				trigger: { player: "phaseDrawBegin1" },
				check(event, player) {
					if (player.countCards("h") > player.hp) {
						return true;
					}
					if (player.countCards("h") > 3) {
						return true;
					}
					return false;
				},
				filter(event, player) {
					return !event.numFixed;
				},
				preHidden: true,
				prompt2: () => "进行一次判定，本回合可以将一张与此牌颜色不同的手牌当作【决斗】使用",
				async content(event, trigger, player) {
					trigger.changeToZero();
					await player.judge().set("callback", lib.skill.shuangxiong_judge.callback);
				},
				async callback(event, trigger, player) {
					await player.gain(event.card, "gain2");
					player.addTempSkill("shuangxiong_viewas");
					player.markAuto("shuangxiong_viewas", [event.judgeResult.color]);
				},
			},
			viewas: {
				charlotte: true,
				onremove: true,
				audio: "shuangxiong",
				logAudio: () => "shuangxiong2.mp3",
				enable: "chooseToUse",
				viewAs: { name: "juedou" },
				position: "hs",
				viewAsFilter(player) {
					return player.hasCard(card => lib.skill.shuangxiong_viewas.filterCard(card, player), "hs");
				},
				filterCard(card, player) {
					const color = get.color(card),
						colors = player.getStorage("shuangxiong_viewas");
					for (const i of colors) {
						if (color != i) {
							return true;
						}
					}
					return false;
				},
				prompt() {
					const colors = _status.event.player.getStorage("shuangxiong_viewas");
					let str = "将一张颜色";
					for (let i = 0; i < colors.length; i++) {
						if (i > 0) {
							str += "或";
						}
						str += "不为";
						str += get.translation(colors[i]);
					}
					str += "的手牌当做【决斗】使用";
					return str;
				},
				check(card) {
					const player = _status.event.player;
					const raw = player.getUseValue(card, null, true);
					const eff = player.getUseValue(get.autoViewAs({ name: "juedou" }, [card]));
					return eff - raw;
				},
				ai: { order: 7 },
			},
			re_yanwen1: { audio: true },
			re_yanwen2: { audio: true },
		},
	},
	shuangxiong1: {
		audio: true,
		trigger: { player: "phaseDrawBegin1" },
		sourceSkill: "shuangxiong",
		check(event, player) {
			if (player.countCards("h") > player.hp) {
				return true;
			}
			if (player.countCards("h") > 3) {
				return true;
			}
			return false;
		},
		filter(event, player) {
			return !event.numFixed;
		},
		preHidden: true,
		prompt2: () => "进行一次判定，本回合可以将一张与此牌颜色不同的手牌当作【决斗】使用",
		async content(event, trigger, player) {
			trigger.changeToZero();
			await player.judge().set("callback", lib.skill.shuangxiong1.callback);
		},
		async callback(event, trigger, player) {
			await player.gain(event.card, "gain2");
			player.addTempSkill("shuangxiong2");
			player.markAuto("shuangxiong2", [event.judgeResult.color]);
		},
	},
	shuangxiong2: {
		charlotte: true,
		onremove: true,
		audio: true,
		audioname2: {
			re_yanwen: "shuangxiong_re_yanwen2",
		},
		enable: "chooseToUse",
		viewAs: { name: "juedou" },
		position: "hs",
		sourceSkill: "shuangxiong",
		viewAsFilter(player) {
			return player.hasCard(card => lib.skill.shuangxiong2.filterCard(card, player), "hs");
		},
		filterCard(card, player) {
			const color = get.color(card),
				colors = player.getStorage("shuangxiong2");
			for (const i of colors) {
				if (color != i) {
					return true;
				}
			}
			return false;
		},
		prompt() {
			const colors = _status.event.player.getStorage("shuangxiong2");
			let str = "将一张颜色";
			for (let i = 0; i < colors.length; i++) {
				if (i > 0) {
					str += "或";
				}
				str += "不为";
				str += get.translation(colors[i]);
			}
			str += "的手牌当做【决斗】使用";
			return str;
		},
		check(card) {
			const player = _status.event.player;
			const raw = player.getUseValue(card, null, true);
			const eff = player.getUseValue(get.autoViewAs({ name: "juedou" }, [card]));
			return eff - raw;
		},
		ai: { order: 7 },
	},
	luanji: {
		audio: 2,
		enable: "phaseUse",
		position: "hs",
		viewAs: { name: "wanjian" },
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				return get.suit(card) == get.suit(ui.selected.cards[0]);
			}
			const cards = player.getCards("hs");
			for (let i = 0; i < cards.length; i++) {
				if (card != cards[i]) {
					if (get.suit(card) == get.suit(cards[i])) {
						return true;
					}
				}
			}
			return false;
		},
		selectCard: 2,
		complexCard: true,
		check(card) {
			const player = _status.event.player;
			const targets = game.filterPlayer(function (current) {
				return player.canUse("wanjian", current);
			});
			let num = 0;
			for (let i = 0; i < targets.length; i++) {
				let eff = get.sgn(get.effect(targets[i], { name: "wanjian" }, player, player));
				if (targets[i].hp == 1) {
					eff *= 1.5;
				}
				num += eff;
			}
			if (!player.needsToDiscard(-1)) {
				if (targets.length >= 7) {
					if (num < 2) {
						return 0;
					}
				} else if (targets.length >= 5) {
					if (num < 1.5) {
						return 0;
					}
				}
			}
			return 6 - get.value(card);
		},
		ai: {
			basic: {
				order: 8.5,
			},
		},
	},
	xueyi: {
		trigger: { player: "phaseDiscardBefore" },
		audio: 2,
		audioname: ["re_yuanshao"],
		audioname2: {
			pe_jun_yuanshao: ["xueyi_re_yuanshao1.mp3", "xueyi_re_yuanshao2.mp3"],
		},
		forced: true,
		firstDo: true,
		filter(event, player) {
			return (
				player.hasZhuSkill("xueyi") &&
				game.hasPlayer(function (current) {
					return current != player && current.group == "qun";
				}) &&
				player.countCards("h") > player.hp
			);
		},
		async content() {},
		mod: {
			maxHandcard(player, num) {
				if (player.hasZhuSkill("xueyi")) {
					return (
						num +
						game.countPlayer(function (current) {
							if (player != current && current.group == "qun") {
								return 2;
							}
						})
					);
				}
				return num;
			},
		},
		zhuSkill: true,
	},
	mengjin: {
		audio: 2,
		trigger: { player: "shaMiss" },
		//priority:-1,
		filter(event) {
			return event.target.countCards("he") > 0;
		},
		check(event, player) {
			return get.attitude(player, event.target) < 0;
		},
		logTarget: "target",
		async content(event, trigger, player) {
			await player.discardPlayerCard("he", trigger.target, true);
		},
	},
	jiewei: {
		trigger: { player: "turnOverEnd" },
		//direct:true,
		frequent: true,
		audio: "xinjiewei",
		async content(event, trigger, player) {
			await player.draw();
			const result = await player.chooseToUse(function (card) {
				if (!lib.filter.cardEnabled(card, _status.event.player, _status.event)) {
					return false;
				}
				const type = get.type(card, "trick");
				return type == "trick" || type == "equip";
			}, "是否使用一张锦囊牌或装备牌？").forResult();
			if (!result.bool) {
				return;
			}
			const type = get.type(result.card || result.cards[0]);
			if (
				!game.hasPlayer(function (current) {
					if (type == "equip") {
						return current.countCards("e");
					} else {
						return current.countCards("j");
					}
				})
			) {
				return;
			}
			const next = player.chooseTarget("是否弃置场上的一张" + get.translation(type) + "牌？", function (card, player, target) {
				if (_status.event.type == "equip") {
					return target.countCards("e") > 0;
				} else {
					return target.countCards("j") > 0;
				}
			});
			next.set("ai", function (target) {
				if (type == "equip") {
					return -get.attitude(player, target);
				} else {
					return get.attitude(player, target);
				}
			});
			next.set("type", type);
			event.type = type;
			const result2 = await next.forResult();
			if (type && result2.bool && result2.targets && result2.targets.length) {
				player.line(result2.targets, "green");
				if (type == "equip") {
					player.discardPlayerCard(result2.targets[0], "e", true);
				} else {
					player.discardPlayerCard(result2.targets[0], "j", true);
				}
			}
		},
		ai: {
			combo: "moon_jushou",
		},
	},
	releiji: {
		audio: 2,
		audioname: ["boss_qinglong"],
		trigger: { player: ["useCard", "respond"] },
		filter(event, player) {
			return event.card.name == "shan";
		},
		line: "thunder",
		async cost(event, trigger, player) {
			const next = player.chooseTarget(get.prompt2(event.skill), function (card, player, target) {
				return target != player;
			});
			next.ai = function (target) {
				if (target.hasSkill("hongyan")) {
					return 0;
				}
				return get.damageEffect(target, _status.event.player, _status.event.player, "thunder");
			};
			event.result = await next.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			const next = target.judge(function (card) {
				const suit = get.suit(card);
				if (suit == "spade") {
					return -4;
				}
				if (suit == "club") {
					return -2;
				}
				return 0;
			});
			next.judge2 = function (result) {
				return result.bool == false; // ? true : false; 喵？
			};
			const { suit } = await next.forResult();
			if (suit == "club") {
				await player.recover();
				await target.damage("thunder");
			} else if (suit == "spade") {
				await target.damage(2, "thunder");
			}
		},
		ai: {
			useShan: true,
			effect: {
				target_use(card, player, target, current) {
					if (
						get.tag(card, "respondShan") &&
						!player.hasSkillTag(
							"directHit_ai",
							true,
							{
								target: target,
								card: card,
							},
							true
						)
					) {
						let club = 0,
							spade = 0;
						if (
							game.hasPlayer(function (current) {
								return get.attitude(target, current) < 0 && get.damageEffect(current, target, target, "thunder") > 0;
							})
						) {
							club = 2;
							spade = 4;
						}
						if (!target.isHealthy()) {
							club += 2;
						}
						if (!club && !spade) {
							return 1;
						}
						if (card.name === "sha") {
							if (!target.mayHaveShan(player, "use")) {
								return;
							}
						} else if (!target.mayHaveShan(player)) {
							return 1 - 0.1 * Math.min(5, target.countCards("hs"));
						}
						if (!target.hasSkillTag("rejudge")) {
							return [1, (club + spade) / 4];
						}
						let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e",
							better = club > spade ? "club" : "spade",
							max = 0;
						target.hasCard(function (cardx) {
							if (get.suit(cardx) === better) {
								max = 2;
								return true;
							}
							if (spade && get.color(cardx) === "black") {
								max = 1;
							}
						}, pos);
						if (max === 2) {
							return [1, Math.max(club, spade)];
						}
						if (max === 1) {
							return [1, Math.min(club, spade)];
						}
						if (pos === "e") {
							return [1, Math.min((Math.max(1, target.countCards("hs")) * (club + spade)) / 4, Math.max(club, spade))];
						}
						return [1, (club + spade) / 4];
					}
				},
			},
		},
	},
	shensu: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		group: ["shensu1", "shensu2"],
		preHidden: ["shensu1", "shensu2"],
	},
	xinshensu: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		group: ["xinshensu_1", "xinshensu_2", "shensu4"],
		preHidden: ["xinshensu_1", "xinshensu_2", "shensu4"],
		subSkill: {
			1: {
				audio: "shensu1",
				inherit: "shensu1",
				sourceSkill: "xinshensu",
			},
			2: {
				inherit: "shensu2",
				sourceSkill: "xinshensu",
			},
		},
	},
	shensu1_xiahouba: { audio: 2 },
	shensu1: {
		audio: 2,
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		trigger: { player: "phaseJudgeBefore" },
		sourceSkill: "shensu",
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "跳过判定阶段和摸牌阶段，视为对一名其他角色使用一张【杀】", function (card, player, target) {
					if (player == target) {
						return false;
					}
					return player.canUse({ name: "sha" }, target, false);
				})
				.set("check", player.countCards("h") > 2)
				.set("ai", function (target) {
					if (!_status.event.check) {
						return 0;
					}
					return get.effect(target, { name: "sha" }, _status.event.player);
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.skip("phaseDraw");
			await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
		},
	},
	shensu2: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		trigger: { player: "phaseUseBefore" },
		sourceSkill: "shensu",
		filter(event, player) {
			return (
				player.countCards("he", function (card) {
					if (_status.connectMode) {
						return true;
					}
					return get.type(card) == "equip";
				}) > 0
			);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					prompt: get.prompt(event.skill),
					prompt2: "弃置一张装备牌并跳过出牌阶段，视为对一名其他角色使用一张【杀】",
					filterCard(card, player) {
						return get.type(card) == "equip" && lib.filter.cardDiscardable(card, player);
					},
					position: "he",
					filterTarget(card, player, target) {
						if (player == target) {
							return false;
						}
						return player.canUse({ name: "sha" }, target, false);
					},
					ai1(card) {
						if (_status.event.check) {
							return 0;
						}
						return 6 - get.value(card);
					},
					ai2(target) {
						if (_status.event.check) {
							return 0;
						}
						return get.effect(target, { name: "sha" }, _status.event.player);
					},
					check:
						player.countCards("hs", i => {
							return player.hasValueTarget(i, null, true);
						}) >
						player.hp - 1,
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.discard(event.cards[0]);
			await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
		},
	},
	shensu4: {
		audio: "shensu1",
		audioname: ["xiahouba", "re_xiahouyuan", "ol_xiahouyuan"],
		trigger: { player: "phaseDiscardBefore" },
		sourceSkill: "xinshensu",
		async cost(event, trigger, player) {
			const check = player.needsToDiscard() || player.isTurnedOver() || (player.hasSkill("shebian") && player.canMoveCard(true, true));
			event.result = await player
				.chooseTarget(get.prompt(event.skill), "跳过弃牌阶段并将武将牌翻面，视为对一名其他角色使用一张【杀】", function (card, player, target) {
					if (player == target) {
						return false;
					}
					return player.canUse({ name: "sha" }, target, false);
				})
				.set("check", check)
				.set("ai", function (target) {
					if (!_status.event.check) {
						return 0;
					}
					return get.effect(target, { name: "sha" }, _status.event.player, _status.event.player);
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.cancel();
			await player.turnOver();
			await player.useCard({ name: "sha", isCard: true }, event.targets[0], false);
		},
	},
	jushou: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		check(event, player) {
			return event.player.hp + player.countCards("h") < 4;
		},
		async content(event, trigger, player) {
			await player.draw(3);
			await player.turnOver();
		},
	},
	moon_jushou: {
		audio: "xinjushou",
		trigger: { player: "phaseJieshuBegin" },
		check(event, player) {
			return event.player.hp + player.countCards("h") < 4;
		},
		async content(event, trigger, player) {
			await player.draw();
			await player.turnOver();
		},
	},
	liegong: {
		audio: 2,
		audioname: ["re_huangzhong"],
		trigger: { player: "useCardToPlayered" },
		check(event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		logTarget: "target",
		filter(event, player) {
			if (event.card.name != "sha") {
				return false;
			}
			const length = event.target.countCards("h");
			return length >= player.hp || length <= player.getAttackRange();
		},
		preHidden: true,
		async content(event, trigger, player) {
			trigger.getParent().directHit.push(trigger.target);
		},
		locked: false,
		mod: {
			attackRange(player, distance) {
				if (get.zhu(player, "shouyue")) {
					return distance + 1;
				}
			},
		},
		ai: {
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (get.attitude(player, arg.target) > 0 || arg.card.name != "sha") {
					return false;
				}
				const length = arg.target.countCards("h");
				return length >= player.hp || length <= player.getAttackRange();
			},
		},
	},
	kuanggu: {
		audio: 2,
		audioname: ["re_weiyan", "ol_weiyan"],
		trigger: { source: "damageSource" },
		forced: true,
		filter(event, player) {
			return event.checkKuanggu && player.isDamaged();
		},
		async content(event, trigger, player) {
			await player.recover(trigger.num);
		},
	},
	tianxiang: {
		audio: 2,
		audioname: ["daxiaoqiao", "re_xiaoqiao", "ol_xiaoqiao"],
		trigger: { player: "damageBegin3" },
		filter(event, player) {
			return player.countCards("h", { suit: "heart" }) > 0 && event.num > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					filterCard(card, player) {
						return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player);
					},
					filterTarget(card, player, target) {
						return player != target;
					},
					ai1(card) {
						return 10 - get.value(card);
					},
					ai2(target) {
						const att = get.attitude(_status.event.player, target);
						const trigger = _status.event.getTrigger();
						let da = 0;
						if (_status.event.player.hp == 1) {
							da = 10;
						}
						if (trigger.num > 1) {
							if (target.maxHp > 5 && target.hp > 1) {
								return -att / 10 + da;
							}
							return -att + da;
						}
						const eff = get.damageEffect(target, trigger.source, target, trigger.nature);
						if (att == 0) {
							return 0.1 + da;
						}
						if (eff >= 0 && trigger.num == 1) {
							return att + da;
						}
						if (target.hp == target.maxHp) {
							return -att + da;
						}
						if (target.hp == 1) {
							if (target.maxHp <= 4 && !target.hasSkillTag("maixie")) {
								if (target.maxHp <= 3) {
									return -att + da;
								}
								return -att / 2 + da;
							}
							return da;
						}
						if (target.hp == target.maxHp - 1) {
							if (target.hp > 2 || target.hasSkillTag("maixie")) {
								return att / 5 + da;
							}
							if (att > 0) {
								return 0.02 + da;
							}
							return 0.05 + da;
						}
						return att / 2 + da;
					},
					prompt: get.prompt2(event.skill),
				})
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.player = event.targets[0];
			trigger.player.addSkill("tianxiang2");
			await player.discard(event.cards[0]);
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return;
					}
					if (get.tag(card, "damage") && target.countCards("h") > 1) {
						return 0.7;
					}
				},
			},
			threaten(player, target) {
				if (target.countCards("h") == 0) {
					return 2;
				}
			},
		},
	},
	tianxiang2: {
		trigger: { player: ["damageAfter", "damageCancelled", "damageZero"] },
		forced: true,
		popup: false,
		audio: false,
		vanish: true,
		charlotte: true,
		sourceSkill: "tianxiang",
		async content(event, trigger, player) {
			player.removeSkill("tianxiang2");
			player.popup("tianxiang");
			if (player.getDamagedHp()) {
				await player.draw(player.getDamagedHp());
			}
		},
	},
	retianxiang: {
		audio: "tianxiang",
		audioname: ["daxiaoqiao", "re_xiaoqiao", "ol_xiaoqiao"],
		trigger: { player: "damageBegin4" },
		preHidden: true,
		filter(event, player) {
			return (
				player.countCards("h", function (card) {
					return _status.connectMode || get.suit(card, player) == "heart";
				}) > 0 && event.num > 0
			);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					filterCard(card, player) {
						return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player);
					},
					filterTarget(card, player, target) {
						return player != target;
					},
					ai1(card) {
						return 10 - get.value(card);
					},
					ai2(target) {
						const att = get.attitude(_status.event.player, target);
						const trigger = _status.event.getTrigger();
						let da = 0;
						if (_status.event.player.hp == 1) {
							da = 10;
						}
						const eff = get.damageEffect(target, trigger.source, target);
						if (att == 0) {
							return 0.1 + da;
						}
						if (eff >= 0 && att > 0) {
							return att + da;
						}
						if (att > 0 && target.hp > 1) {
							if (target.maxHp - target.hp >= 3) {
								return att * 1.1 + da;
							}
							if (target.maxHp - target.hp >= 2) {
								return att * 0.9 + da;
							}
						}
						return -att + da;
					},
					prompt: get.prompt(event.skill),
					prompt2: lib.translate[`${event.skill}_info`],
				})
				.setHiddenSkill(event.name.slice(0, -5))
				.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			const [card] = event.cards;
			trigger.cancel();
			await player.discard(event.cards);
			const result = await player
				.chooseControlList(
					true,
					function (event, player) {
						const target = _status.event.target;
						let att = get.attitude(player, target);
						if (target.hasSkillTag("maihp")) {
							att = -att;
						}
						if (att > 0) {
							return 0;
						} else {
							return 1;
						}
					},
					["令" + get.translation(target) + "受到伤害来源对其造成的1点伤害，然后摸X张牌（X为其已损失体力值且至多为5）", "令" + get.translation(target) + "失去1点体力，然后获得" + get.translation(event.cards)]
				)
				.set("target", target)
				.forResult();
			if (typeof result.index != "number") {
				return;
			}
			if (result.index) {
				event.related = target.loseHp();
			} else {
				event.related = target.damage(trigger.source || "nosource", "nocard");
			}
			await event.related;
			//if(event.related.cancelled||target.isDead()) return;
			if (result.index && card.isInPile()) {
				await target.gain(card, "gain2");
			} else if (target.getDamagedHp()) {
				await target.draw(Math.min(5, target.getDamagedHp()));
			}
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return;
					}
					if (get.tag(card, "damage") && target.countCards("he") > 1) {
						return 0.7;
					}
				},
			},
		},
	},
	retianxiang3: {
		trigger: { player: "loseHpAfter" },
		forced: true,
		popup: false,
		sourceSkill: "retianxiang",
		filter(event) {
			return event.type == "retianxiang";
		},
		vanish: true,
		async content(event, trigger, player) {
			await player.gain(player.storage.retianxiang3, "gain2");
			player.removeSkill("retianxiang3");
		},
		onremove(player) {
			const card = player.storage.retianxiang3;
			if (get.position(card) == "s") {
				game.cardsDiscard(card);
			}
			delete player.storage.retianxiang3;
		},
	},
	retianxiang2: {
		trigger: { player: "damageAfter" },
		forced: true,
		popup: false,
		sourceSkill: "retianxiang",
		filter(event) {
			return event.type == "retianxiang";
		},
		vanish: true,
		async content(event, trigger, player) {
			if (player.isDamaged()) {
				await player.draw(player.getDamagedHp());
			}
			player.removeSkill("retianxiang2");
		},
	},
	xintianxiang: {
		audio: "tianxiang",
		trigger: { player: "damageBefore" },
		filter(event, player) {
			return player.countCards("he", { suit: "heart" }) > 0 && event.num > 0 && !player.hasSkill("xintianxiang3");
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCardTarget({
					filterCard(card, player) {
						return get.suit(card) == "heart" && lib.filter.cardDiscardable(card, player);
					},
					filterTarget(card, player, target) {
						return player != target;
					},
					position: "he",
					ai1(card) {
						return 10 - get.value(card);
					},
					ai2(target) {
						const att = get.attitude(_status.event.player, target);
						const trigger = _status.event.getTrigger();
						let da = 0;
						if (_status.event.player.hp == 1) {
							da = 10;
						}
						if (trigger.num > 1) {
							if (target.maxHp > 5 && target.hp > 1) {
								return -att / 10 + da;
							}
							return -att + da;
						}
						const eff = get.damageEffect(target, trigger.source, target, trigger.nature);
						if (att == 0) {
							return 0.1 + da;
						}
						if (eff >= 0 && trigger.num == 1) {
							return att + da;
						}
						if (target.hp == target.maxHp) {
							return -att + da;
						}
						if (target.hp == 1) {
							if (target.maxHp <= 4 && !target.hasSkillTag("maixie")) {
								if (target.maxHp <= 3) {
									return -att + da;
								}
								return -att / 2 + da;
							}
							return da;
						}
						if (target.hp == target.maxHp - 1) {
							if (target.hp > 2 || target.hasSkillTag("maixie")) {
								return att / 5 + da;
							}
							if (att > 0) {
								return 0.02 + da;
							}
							return 0.05 + da;
						}
						return att / 2 + da;
					},
					prompt: get.prompt2(event.skill),
				})
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.player = event.targets[0];
			trigger.player.addSkill("xintianxiang2");
			trigger.player.storage.xintianxiang = player;
			await player.discard(event.cards[0]);
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return;
					}
					if (get.tag(card, "damage") && target.countCards("he") > 1) {
						return 0.7;
					}
				},
			},
		},
	},
	xintianxiang2: {
		trigger: { player: ["damageAfter", "damageCancelled", "damageZero"] },
		forced: true,
		popup: false,
		audio: false,
		vanish: true,
		sourceSkill: "xintianxiang",
		async content(event, trigger, player) {
			const source = player.storage.xintianxiang;
			if (source.isDead()) {
				return;
			}
			const num = player.maxHp - player.hp || 0;
			const str1 = "令" + get.translation(player) + "摸" + get.cnNumber(num) + "张牌";
			const str2 = "令" + get.translation(player) + "防止造成和受到的所有伤害且天香失效直到你下一回合开始";
			const att = get.attitude(source, player);
			let choice = "选项一";
			if (att < 0) {
				if (num >= 2) {
					choice = "选项二";
				}
			} else if (att > 0) {
				if (num < 2 && !player.hasSkillTag("maixie")) {
					choice = "选项二";
				}
			}
			const { control } = await source
				.chooseControl(function () {
					return _status.event.choice;
				})
				.set("choiceList", [str1, str2])
				.set("choice", choice)
				.forResult();
			if (control == "选项一") {
				if (player.isDamaged()) {
					await player.draw(player.maxHp - player.hp);
				}
			} else {
				player.storage.xintianxiang.addSkill("xintianxiang3");
				player.storage.xintianxiang.storage.xintianxiang3 = player;
				player.addSkill("xintianxiang4");
			}
			player.removeSkill("xintianxiang2");
			delete player.storage.xintianxiang;
		},
	},
	xintianxiang3: {
		trigger: { player: ["phaseZhunbeiBegin", "dieBegin"] },
		silent: true,
		sourceSkill: "xintianxiang",
		async content(event, trigger, player) {
			if (player.storage.xintianxiang3) {
				player.storage.xintianxiang3.removeSkill("xintianxiang4");
				delete player.storage.xintianxiang3;
			}
			player.removeSkill("xintianxiang3");
		},
	},
	xintianxiang4: {
		trigger: { source: "damageBefore", player: "damageBefore" },
		forced: true,
		mark: true,
		intro: {
			content: "防止造成和受到的一切伤害",
		},
		priority: 15,
		sourceSkill: "xintianxiang",
		async content(event, trigger, player) {
			trigger.cancel();
		},
		ai: {
			nofire: true,
			nothunder: true,
			nodamage: true,
			notrick: true,
			notricksource: true,
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "damage")) {
						return "zeroplayertarget";
					}
				},
				player(card, player, target, current) {
					if (get.tag(card, "damage")) {
						return "zeroplayertarget";
					}
				},
			},
		},
	},
	hongyan: {
		audio: true,
		mod: {
			suit(card, suit) {
				if (suit == "spade") {
					return "heart";
				}
			},
		},
	},
	xinhongyan: {
		audio: "hongyan",
		mod: {
			suit(card, suit) {
				if (suit == "spade") {
					return "heart";
				}
			},
		},
		trigger: { global: "judge" },
		filter(event, player) {
			if (event.fixedResult && event.fixedResult.suit) {
				return event.fixedResult.suit == "heart";
			}
			return get.suit(event.player.judging[0], event.player) == "heart";
		},
		async cost(event, trigger, player) {
			const str = "红颜：" + get.translation(trigger.player) + "的" + (trigger.judgestr || "") + "判定为" + get.translation(trigger.player.judging[0]) + "，请将其改为一种花色";
			const { control } = await player
				.chooseControl("spade", "heart", "diamond", "club")
				.set("prompt", str)
				.set("ai", function () {
					const player = get.player();
					const judging = _status.event.judging;
					const trigger = _status.event.getTrigger();
					const list = lib.suit.slice(0);
					const attitude = get.attitude(player, trigger.player);
					if (attitude == 0) {
						return 0;
					}
					const getj = function (suit) {
						return trigger.judge({
							name: get.name(judging),
							nature: get.nature(judging),
							suit: suit,
							number: get.number(judging),
						});
					};
					list.sort(function (a, b) {
						return (getj(b) - getj(a)) * get.sgn(attitude);
					});
					return list[0];
				})
				.set("judging", trigger.player.judging[0])
				.forResult();
			event.result = {
				bool: control != "cancel2",
				cost_data: control,
			};
		},
		async content(event, trigger, player) {
			const control = event.cost_data;
			player.addExpose(0.25);
			player.popup(control);
			game.log(player, "将判定结果改为了", "#y" + get.translation(control + 2));
			if (!trigger.fixedResult) {
				trigger.fixedResult = {};
			}
			trigger.fixedResult.suit = control;
			trigger.fixedResult.color = get.color({ suit: control });
		},
		ai: {
			rejudge: true,
			tag: {
				rejudge: 0.4,
			},
			expose: 0.5,
		},
	},
	gzbuqu: {
		audio: 2,
		trigger: { player: "changeHp" },
		filter(event, player) {
			return player.hp <= 0 && event.num < 0;
		},
		marktext: "创",
		intro: {
			markcount: "expansion",
			content: "expansion",
		},
		group: "gzbuqu_recover",
		frequent: true,
		ondisable: true,
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				//delete player.nodying;
				player.loseToDiscardpile(cards);
				if (player.hp <= 0) {
					player.dying({});
				}
			}
		},
		process(player) {
			//delete player.nodying;
			const nums = [];
			const cards = player.getExpansions("gzbuqu");
			for (let i = 0; i < cards.length; i++) {
				if (nums.includes(get.number(cards[i]))) {
					return false;
				} else {
					nums.push(get.number(cards[i]));
				}
			}
			return true;
			//player.nodying=true;
		},
		subSkill: {
			recover: {
				trigger: { player: "recoverAfter" },
				filter(event, player) {
					return player.getExpansions("gzbuqu").length > 0 && event.num > 0;
				},
				forced: true,
				popup: false,
				async content(event, trigger, player) {
					for (let i = trigger.num; i > 0; i--) {
						let cards = player.getExpansions("gzbuqu");
						const count = cards.length;
						if (count <= 0 || player.hp + count <= 1) {
							return;
						}
						if (count > 1) {
							cards = (await player
								.chooseCardButton("不屈：移去一张“创”", true, cards)
								.set("ai", function (button) {
									const buttons = get.selectableButtons();
									for (let i = 0; i < buttons.length; i++) {
										if (buttons[i] != button && get.number(buttons[i].link) == get.number(button.link) && !ui.selected.buttons.includes(buttons[i])) {
											return 1;
										}
									}
									return 0;
								})
								.forResult()).links;
						}
						await player.loseToDiscardpile(cards);
					}
					if (lib.skill.gzbuqu.process(player)) {
						if (player.isDying()) {
							const histories = [event];
							let evt = event;
							while (true) {
								evt = event.getParent("dying");
								if (!evt || evt.name != "dying" || histories.includes(evt)) {
									break;
								}
								histories.push(evt);
								if (evt.player == player) {
									evt.nodying = true;
								}
							}
						}
					}
				},
			},
		},
		async content(event, trigger, player) {
			const num = -trigger.num - Math.max(player.hp - trigger.num, 1) + 1;
			const next = player.addToExpansion(get.cards(num), "gain2");
			next.gaintag.add("gzbuqu");
			await next;
			await player.showCards(get.translation(player) + "的不屈牌", player.getExpansions("gzbuqu"));
			if (lib.skill.gzbuqu.process(player)) {
				const evt = trigger.getParent();
				if (evt.name == "damage" || evt.name == "loseHp") {
					evt.nodying = true;
				}
			}
		},
		ai: {
			mingzhi: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
						let num = target.getExpansions("gzbuqu").length || target.getHp();
						return (num + 1) / 5;
					}
				},
			},
		},
	},
	buqu: {
		audio: 2,
		audioname: ["key_yuri"],
		trigger: { player: "chooseToUseBefore" },
		forced: true,
		preHidden: true,
		filter(event, player) {
			return event.type == "dying" && player.isDying() && event.dying == player && !event.getParent()._buqu;
		},
		async content(event, trigger, player) {
			trigger.getParent()._buqu = true;
			const [card] = get.cards();
			const next = player.addToExpansion(card, "gain2");
			next.gaintag.add("buqu");
			await next;
			const cards = player.getExpansions("buqu"),
				num = get.number(card);
			player.showCards(cards, "不屈");
			for (let i = 0; i < cards.length; i++) {
				if (cards[i] != card && get.number(cards[i]) == num) {
					await player.loseToDiscardpile(card);
					return;
				}
			}
			trigger.cancel();
			trigger.result = { bool: true };
			if (player.hp <= 0) {
				await player.recover(1 - player.hp);
			}
		},
		mod: {
			maxHandcardBase(player, num) {
				if (get.mode() != "guozhan" && player.getExpansions("buqu").length) {
					return player.getExpansions("buqu").length;
				}
			},
		},
		ai: {
			save: true,
			mingzhi: true,
			skillTagFilter(player, tag, target) {
				if (player != target) {
					return false;
				}
			},
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
						let num = target.getExpansions("buqu").length || target.getHp();
						return (num + 1) / 5;
					}
				},
			},
		},
		onremove(player, skill) {
			const cards = player.getExpansions(skill);
			if (cards.length) {
				player.loseToDiscardpile(cards);
			}
		},
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
	},
	fenji: {
		audio: 2,
		trigger: { global: ["gainAfter", "loseAfter", "loseAsyncAfter"] },
		filter(event, player) {
			if (event.name == "lose") {
				if (event.type != "discard" || !event.player.isIn()) {
					return false;
				}
				if ((event.discarder || event.getParent(2).player) == event.player) {
					return false;
				}
				if (!event.getl(event.player).hs.length) {
					return false;
				}
				return true;
			} else if (event.name == "gain") {
				if (event.giver || event.getParent().name == "gift") {
					return false;
				}
				const cards = event.getg(event.player);
				if (!cards.length) {
					return false;
				}
				return game.hasPlayer(current => {
					if (current == event.player) {
						return false;
					}
					const hs = event.getl(current).hs;
					for (const i of hs) {
						if (cards.includes(i)) {
							return true;
						}
					}
					return false;
				});
			} else if (event.type == "gain") {
				if (event.giver || !event.player || !event.player.isIn()) {
					return false;
				}
				const hs = event.getl(event.player);
				return game.hasPlayer(current => {
					if (current == event.player) {
						return false;
					}
					const cards = event.getg(current);
					for (const i of cards) {
						if (hs.includes(i)) {
							return true;
						}
					}
				});
			} else if (event.type == "discard") {
				if (!event.discarder) {
					return false;
				}
				return game.hasPlayer(current => {
					return current != event.discarder && event.getl(current).hs.length > 0;
				});
			}
			return false;
		},
		getIndex(event) {
			const targets = [];
			if (event.name == "gain") {
				const cards = event.getg(event.player);
				targets.addArray(
					game.filterPlayer(current => {
						if (current == event.player) {
							return false;
						}
						const hs = event.getl(current).hs;
						for (const i of hs) {
							if (cards.includes(i)) {
								return true;
							}
						}
						return false;
					})
				);
			} else if (event.name == "loseAsync" && event.type == "discard") {
				targets.addArray(
					game.filterPlayer(current => {
						return current != event.discarder && event.getl(current).hs.length > 0;
					})
				);
			} else {
				targets.push(event.player);
			}
			return targets;
		},
		logTarget: (event, player, triggername, target) => target,
		check(event, player, triggername, target) {
			if (get.attitude(player, target) <= 0) {
				return false;
			}
			return 2 * get.effect(target, { name: "draw" }, player, player) + get.effect(player, { name: "losehp" }, player, player) > 0;
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			await player.loseHp();
			await target.draw(2);
		},
	},
	new_fenji: {
		audio: "fenji",
		trigger: {
			global: "phaseJieshuBegin",
		},
		filter(event, player) {
			if (event.player.countCards("h") == 0 && event.player.isIn()) {
				return true;
			}
			return false;
		},
		preHidden: true,
		check(event, player) {
			if (get.attitude(get.event().player, event.player) <= 0) {
				return false;
			}
			return 2 * get.effect(event.player, { name: "draw" }, player, get.event().player) + get.effect(player, { name: "losehp" }, player, get.event().player) > 0;
		},
		logTarget: "player",
		async content(event, trigger, player) {
			player.line(trigger.player, "green");
			await trigger.player.draw(2);
			await player.loseHp();
		},
	},
	leiji: {
		audio: 2,
		trigger: { player: ["useCard", "respond"] },
		filter(event, player) {
			return event.card.name == "shan";
		},
		preHidden: true,
		line: "thunder",
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill))
				.set("ai", target => {
					const player = get.player();
					if (target.hasSkill("hongyan")) {
						return 0;
					}
					return get.damageEffect(target, player, player, "thunder");
				})
				.setHiddenSkill(event.skill)
				.forResult();
		},
		async content(event, trigger, player) {
			const [target] = event.targets;
			const next = target.judge(card => {
				if (get.suit(card) == "spade") {
					return -4;
				}
				return 4;
			});
			next.judge2 = result => !result.bool;
			const result = await next.forResult();
			if (!result?.bool) {
				await target.damage(2, "thunder");
			}
		},
		ai: {
			mingzhi: false,
			useShan: true,
			effect: {
				target_use(card, player, target, current) {
					if (
						get.tag(card, "respondShan") &&
						!player.hasSkillTag(
							"directHit_ai",
							true,
							{
								target: target,
								card: card,
							},
							true
						) &&
						game.hasPlayer(function (current) {
							return get.attitude(target, current) < 0 && get.damageEffect(current, target, target, "thunder") > 0;
						})
					) {
						if (card.name === "sha") {
							if (!target.mayHaveShan(player, "use")) {
								return;
							}
						} else if (!target.mayHaveShan(player)) {
							return 1 - 0.1 * Math.min(5, target.countCards("hs"));
						}
						if (!target.hasSkillTag("rejudge")) {
							return [1, 1];
						}
						let pos = player.hasSkillTag("viewHandcard", null, target, true) ? "hes" : "e";
						if (
							target.hasCard(function (cardx) {
								return get.suit(cardx) === "spade";
							}, pos)
						) {
							return [1, 4];
						}
						if (pos === "e") {
							return [1, Math.min(4, 1 + 0.75 * Math.max(1, target.countCards("hs")))];
						}
						return [1, 1];
					}
				},
			},
		},
	},
	guidao: {
		audio: 2,
		audioname: ["sp_zhangjiao"],
		trigger: { global: "judge" },
		filter(event, player) {
			return player.countCards("hes", { color: "black" }) > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard(`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`, "hes", card => {
					const player = get.player();
					if (get.color(card) !== "black") {
						return false;
					}
					const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
					if (mod2 != "unchanged") {
						return mod2;
					}
					const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player);
					if (mod != "unchanged") {
						return mod;
					}
					return true;
				})
				.set("ai", card => {
					const trigger = get.event().getTrigger();
					const { player, judging } = get.event();
					const result = trigger.judge(card) - trigger.judge(judging);
					const attitude = get.attitude(player, trigger.player);
					let val = get.value(card);
					if (get.subtype(card) == "equip2") {
						val /= 2;
					} else {
						val /= 6;
					}
					if (attitude == 0 || result == 0) {
						return 0;
					}
					if (attitude > 0) {
						return result - val;
					}
					return -result - val;
				})
				.set("judging", trigger.player.judging[0])
				.forResult();
		},
		popup: false,
		async content(event, trigger, player) {
			const next = player.respond(event.cards, event.name, "highlight", "noOrdering");
			await next;
			const { cards } = next;
			if (cards?.length) {
				player.$gain2(trigger.player.judging[0]);
				await player.gain(trigger.player.judging[0]);
				trigger.player.judging[0] = cards[0];
				trigger.orderingCards.addArray(cards);
				game.log(trigger.player, "的判定牌改为", cards);
				await game.delay(2);
			}
		},
		ai: {
			rejudge: true,
			tag: { rejudge: 1 },
		},
	},
	// 蛊惑（guhuo）技能错误，请勿引用
	/*
	guhuo:{
		enable:'phaseUse',
		usable:1,
		audio:2,
		filter:function(event,player){
			return player.countCards('hs')>0
		},
		chooseButton:{
			dialog:function(){
				const list=['sha','tao','jiu','taoyuan','wugu','juedou','huogong','jiedao','tiesuo','guohe','shunshou','wuzhong','wanjian','nanman'];
				for(let i=0;i<list.length;i++){
					if(i<3){
						list[i]=['基本','',list[i]];
					}
					else{
						list[i]=['锦囊','',list[i]];
					}
				}
				return ui.create.dialog([list,'vcard']);
			},
			filter:function(button,player){
				return lib.filter.filterCard({name:button.link[2]},player,_status.event.getParent());
			},
			check:function(button){
				const player=_status.event.player;
				if(player.countCards('h','wuzhong')){
					if(player.hp==1&&player.countCards('h','tao')){
						return button.link=='tao'?1:0;
					}
					return button.link=='wuzhong'?1:0;
				}
				if(player.hp<player.maxHp){
					if(player.countCards('h','tao')){
						return button.link=='tao'?1:0;
					}
				}
			},
			backup:function(links,player){
				return {
					filterCard:true,
					selectCard:-1,
					audio:2,
					popname:true,
					viewAs:{name:links[0][2]},
				}
			},
			prompt:function(links,player){
				return '将全部手牌当'+get.translation(links[0][2])+'使用';
			}
		},
		ai:{
			order:1,
			result:{
				player:function(player){
					const cards=player.getCards('h');
					let num=0;
					if(cards.length>=3&&player.hp>=3) return 0;
					for(let i=0;i<cards.length;i++){
						num+=Math.max(0,get.value(cards[i],player,'raw'));
					}
					num/=cards.length;
					num*=Math.min(cards.length,player.hp);
					return 12-num;
				}
			},
			threaten:1.6,
		}
	},
	*/
	huangtian: {
		audio: "huangtian2",
		audioname: ["zhangjiao", "re_zhangjiao"],
		audioname2: {
			pe_jun_zhangjiao: ["xinhuangtian2_re_zhangjiao1.mp3", "xinhuangtian2_re_zhangjiao2.mp3"],
		},
		global: "huangtian2",
		zhuSkill: true,
	},
	huangtian2: {
		audio: 2,
		enable: "phaseUse",
		discard: false,
		lose: false,
		delay: false,
		line: true,
		prepare(cards, player, targets) {
			targets[0].logSkill("huangtian");
		},
		prompt() {
			const player = _status.event.player;
			const list = game.filterPlayer(function (target) {
				return target != player && target.hasZhuSkill("huangtian", player);
			});
			let str = "将一张【闪】或【闪电】交给" + get.translation(list);
			if (list.length > 1) {
				str += "中的一人";
			}
			return str;
		},
		filter(event, player) {
			if (player.group != "qun") {
				return false;
			}
			if (player.countCards("h", "shan") + player.countCards("h", "shandian") == 0) {
				return 0;
			}
			return game.hasPlayer(function (target) {
				return target != player && target.hasZhuSkill("huangtian", player) && !target.hasSkill("huangtian3");
			});
		},
		filterCard(card) {
			return card.name == "shan" || card.name == "shandian";
		},
		log: false,
		visible: true,
		filterTarget(card, player, target) {
			return target != player && target.hasZhuSkill("huangtian", player) && !target.hasSkill("huangtian3");
		},
		//usable:1,
		//forceaudio:true,
		async content(event, trigger, player) {
			await player.give(event.cards, event.target);
			event.target.addTempSkill("huangtian3", "phaseUseEnd");
		},
		ai: {
			expose: 0.3,
			order: 10,
			result: {
				target: 5,
			},
		},
	},
	huangtian3: {},
	xinfu_guhuo: {
		audio: "guhuo_guess",
		derivation: ["chanyuan"],
		enable: ["chooseToUse", "chooseToRespond"],
		hiddenCard(player, name) {
			return lib.inpile.includes(name) && player.countCards("hs") > 0 && !player.hasSkill("guhuo_phase");
		},
		filter(event, player) {
			if (player.hasSkill("guhuo_phase")) {
				return false;
			}
			if (!player.countCards("hs")) {
				return false;
			}
			for (const i of lib.inpile) {
				const type = get.type(i);
				if ((type == "basic" || type == "trick") && event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
					return true;
				}
				if (i == "sha") {
					for (const j of lib.inpile_nature) {
						if (event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
							return true;
						}
					}
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				const list = [];
				for (const i of lib.inpile) {
					if (event.type != "phase") {
						if (!event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) {
							continue;
						}
					}
					const type = get.type(i);
					if (type == "basic" || type == "trick") {
						list.push([type, "", i]);
					}
					if (i == "sha") {
						for (const j of lib.inpile_nature) {
							if (event.type != "phase") {
								if (!event.filterCard(get.autoViewAs({ name: i, nature: j }, "unsure"), player, event)) {
									continue;
								}
							}
							list.push(["基本", "", "sha", j]);
						}
					}
				}
				return ui.create.dialog("蛊惑", [list, "vcard"]);
			},
			filter(button, player) {
				const evt = _status.event.getParent();
				return evt.filterCard({ name: button.link[2], nature: button.link[3] }, player, evt);
			},
			check(button) {
				const player = _status.event.player;
				const enemyNum = game.countPlayer(function (current) {
					return current != player && !current.hasSkill("chanyuan") && (get.realAttitude || get.attitude)(current, player) < 0;
				});
				const card = { name: button.link[2], nature: button.link[3] };
				const val = _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1;
				if (val <= 0) {
					return 0;
				}
				if (enemyNum) {
					if (
						!player.hasCard(function (cardx) {
							if (card.name == cardx.name) {
								if (card.name != "sha") {
									return true;
								}
								return get.is.sameNature(card, cardx);
							}
							return false;
						}, "hs")
					) {
						if (get.value(card, player, "raw") < 6) {
							return Math.sqrt(val) * (0.25 + Math.random() / 1.5);
						}
						if (enemyNum <= 2) {
							return Math.sqrt(val) / 1.5;
						}
						return 0;
					}
					return 3 * val;
				}
				return val;
			},
			backup(links, player) {
				return {
					filterCard(card, player, target) {
						let result = true;
						const suit = card.suit,
							number = card.number;
						card.suit = "none";
						card.number = null;
						const mod = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
						if (mod != "unchanged") {
							result = mod;
						}
						card.suit = suit;
						card.number = number;
						return result;
					},
					selectCard: 1,
					position: "hs",
					ignoreMod: true,
					aiUse: Math.random(),
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						suit: "none",
						number: null,
					},
					ai1(card) {
						const player = _status.event.player;
						const enemyNum = game.countPlayer(function (current) {
							return current != player && !current.hasSkill("chanyuan") && (get.realAttitude || get.attitude)(current, player) < 0;
						});
						const cardx = lib.skill.xinfu_guhuo_backup.viewAs;
						if (enemyNum) {
							if (card.name == cardx.name && (card.name != "sha" || get.is.sameNature(card, cardx))) {
								return 2 + Math.random() * 3;
							} else if (lib.skill.xinfu_guhuo_backup.aiUse < 0.5 && !player.isDying()) {
								return 0;
							}
						}
						return 6 - get.value(card);
					},
					async precontent(event, trigger, player) {
						player.logSkill("xinfu_guhuo");
						player.addTempSkill("guhuo_guess");
						const [card] = event.result.cards;
						event.result.card.suit = get.suit(card);
						event.result.card.number = get.number(card);
					},
				};
			},
			prompt(links, player) {
				return "将一张手牌当做" + get.translation(links[0][2]) + (_status.event.name == "chooseToRespond" ? "打出" : "使用");
			},
		},
		ai: {
			save: true,
			respondSha: true,
			respondShan: true,
			fireAttack: true,
			skillTagFilter(player) {
				if (!player.countCards("hs") || player.hasSkill("guhuo_phase")) {
					return false;
				}
			},
			threaten: 1.2,
			order: 8.1,
			result: { player: 1 },
		},
	},
	guhuo_guess: {
		audio: 2,
		trigger: {
			player: ["useCardBefore", "respondBefore"],
		},
		forced: true,
		silent: true,
		popup: false,
		firstDo: true,
		charlotte: true,
		filter(event, player) {
			return event.skill && (event.skill.indexOf("guhuo_") == 0 || event.skill.indexOf("xinfu_guhuo_") == 0);
		},
		async content(event, trigger, player) {
			player.addTempSkill("guhuo_phase");
			event.fake = false;
			event.betrayer = null;
			const [card] = trigger.cards;
			if (card.name != trigger.card.name || (card.name == "sha" && !get.is.sameNature(trigger.card, card))) {
				event.fake = true;
			}
			player.popup(trigger.card.name, "metal");
			const next = player.lose(card, ui.ordering);
			next.relatedEvent = trigger;
			await next;
			// player.line(trigger.targets,trigger.card.nature);
			trigger.throw = false;
			trigger.skill = "xinfu_guhuo_backup";
			game.log(player, "声明", trigger.targets && trigger.targets.length ? "对" : "", trigger.targets || "", trigger.name == "useCard" ? "使用" : "打出", trigger.card);
			event.prompt = get.translation(player) + "声明" + (trigger.targets && trigger.targets.length ? "对" + get.translation(trigger.targets) : "") + (trigger.name == "useCard" ? "使用" : "打出") + (get.translation(trigger.card.nature) || "") + get.translation(trigger.card.name) + "，是否质疑？";
			event.targets = game
				.filterPlayer(function (current) {
					return current != player && !current.hasSkill("chanyuan");
				})
				.sortBySeat(_status.currentPhase);
			game.broadcastAll(
				function (card, player) {
					_status.guhuoNode = card.copy("thrown");
					if (lib.config.cardback_style != "default") {
						_status.guhuoNode.style.transitionProperty = "none";
						ui.refresh(_status.guhuoNode);
						_status.guhuoNode.classList.add("infohidden");
						ui.refresh(_status.guhuoNode);
						_status.guhuoNode.style.transitionProperty = "";
					} else {
						_status.guhuoNode.classList.add("infohidden");
					}
					_status.guhuoNode.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
					player.$throwordered2(_status.guhuoNode);
				},
				trigger.cards[0],
				player
			);
			event.onEnd01 = function () {
				_status.guhuoNode.removeEventListener("webkitTransitionEnd", _status.event.onEnd01);
				setTimeout(function () {
					_status.guhuoNode.style.transition = "all ease-in 0.3s";
					_status.guhuoNode.style.transform = "perspective(600px) rotateY(270deg)";
					const onEnd = function () {
						_status.guhuoNode.classList.remove("infohidden");
						_status.guhuoNode.style.transition = "all 0s";
						ui.refresh(_status.guhuoNode);
						_status.guhuoNode.style.transform = "perspective(600px) rotateY(-90deg)";
						ui.refresh(_status.guhuoNode);
						_status.guhuoNode.style.transition = "";
						ui.refresh(_status.guhuoNode);
						_status.guhuoNode.style.transform = "";
						_status.guhuoNode.removeEventListener("webkitTransitionEnd", onEnd);
					};
					_status.guhuoNode.listenTransition(onEnd);
				}, 300);
			};
			for (const target of event.targets) {
				const { links } = await target
					.chooseButton([event.prompt, [["reguhuo_ally", "reguhuo_betray"], "vcard"]], true)
					.set("ai", function (button) {
						const player = _status.event.player;
						const evt = _status.event.getParent("guhuo_guess"),
							evtx = evt.getTrigger();
						if (!evt) {
							return Math.random();
						}
						const card = { name: evtx.card.name, nature: evtx.card.nature, isCard: true };
						const ally = button.link[2] == "reguhuo_ally";
						if (ally && (player.hp <= 1 || get.attitude(player, evt.player) >= 0)) {
							return 1.1;
						}
						if (!ally && get.attitude(player, evt.player) < 0 && evtx.name == "useCard") {
							let eff = 0;
							const targetsx = evtx.targets || [];
							for (const target of targetsx) {
								const isMe = target == evt.player;
								eff += get.effect(target, card, evt.player, player) / (isMe ? 1.5 : 1);
							}
							eff /= 1.5 * targetsx.length || 1;
							if (eff > 0) {
								return 0;
							}
							if (eff < -7) {
								return Math.random() + Math.pow(-(eff + 7) / 8, 2);
							}
							return Math.pow((get.value(card, evt.player, "raw") - 4) / (eff == 0 ? 5 : 10), 2);
						}
						return Math.random();
					})
					.forResult();
				if (links[0][2] == "reguhuo_betray") {
					target.addExpose(0.2);
					game.log(target, "#y质疑");
					target.popup("质疑！", "fire");
					event.betrayer = target;
					break;
				} else {
					game.log(target, "#g不质疑");
					target.popup("不质疑", "wood");
				}
			}
			await game.delayx();
			game.broadcastAll(function (onEnd) {
				_status.event.onEnd01 = onEnd;
				if (_status.guhuoNode) {
					_status.guhuoNode.listenTransition(onEnd, 300);
				}
			}, event.onEnd01);
			await game.delay(2);
			if (!event.betrayer) {
				return;
			}
			if (event.fake) {
				event.betrayer.popup("质疑正确", "wood");
				game.log(player, "声明的", trigger.card, "作废了");
				trigger.cancel();
				trigger.getParent().goto(0);
				trigger.line = false;
			} else {
				event.betrayer.popup("质疑错误", "fire");
				await event.betrayer.addSkills("chanyuan");
			}
			await game.delay(2);
			if (event.fake) {
				game.broadcastAll(() => ui.clear());
			} // game.broadcastAll(ui.clear); 原来的代码抽象喵
		},
	},
	chanyuan: {
		init(player, skill) {
			if (player.hp == 1) {
				player.logSkill(skill);
			}
			player.addSkillBlocker(skill);
		},
		onremove(player, skill) {
			player.removeSkillBlocker(skill);
		},
		skillBlocker(skill, player) {
			return skill != "chanyuan" && skill != "rechanyuan" && !lib.skill[skill].charlotte && !lib.skill[skill].persevereSkill && player.hp == 1;
		},
		mark: true,
		intro: {
			content(storage, player, skill) {
				let str = "<li>锁定技。你不能于〖蛊惑〗的结算流程中进行质疑。当你的体力值为1时，你的其他技能失效。";
				const list = player.getSkills(null, false, false).filter(function (i) {
					return lib.skill.rechanyuan.skillBlocker(i, player);
				});
				if (list.length) {
					str += "<br><li>失效技能：" + get.translation(list);
				}
				return str;
			},
		},
		audio: 2,
		trigger: { player: "changeHp" },
		filter(event, player) {
			return player.hp == 1;
		},
		forced: true,
		async content(event, trigger, player) {},
	},
	guhuo_phase: {},




	jilin: {
		audio: 5,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		locked: false,
		logAudio: () => 1,
		async content(event, trigger, player) {
			const cards = get.cards(2);
			const next = player.addToExpansion(cards, "draw");
			next.gaintag.add(event.name);
			await next;
		},
		marktext: "志",
		intro: {
			markcount: "expansion",
			mark(dialog, content, player) {
				const cards = player.getExpansions("jilin"),
					mingzhi = cards.filter(card => card.storage.jilin),
					hidden = cards.removeArray(mingzhi);
				if (mingzhi.length) {
					dialog.addText("已明之志");
					dialog.addSmall(mingzhi);
				}
				if (hidden.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addText("未明之志");
						dialog.addSmall(hidden);
					} else {
						return "共有" + get.cnNumber(hidden.length) + "张暗“志”";
					}
				}
			},
			/*
			???
			content(content, player) {
				const cards = player.getExpansions("jilin"),
					mingzhi = cards.filter(card => card.storage.jilin),
					hidden = cards.removeArray(mingzhi);
				if (mingzhi.length) {
					dialog.addText("已明之志");
					dialog.addSmall(mingzhi);
				}
				if (hidden.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addText("未明之志");
						dialog.addSmall(hidden);
					} else {
						return "共有" + get.cnNumber(hidden.length) + "张暗“志”";
					}
				}
			},
			*/
		},
		group: ["jilin_kanpo", "jilin_change"],
		subSkill: {
			kanpo: {
				audio: ["jilin2.mp3", "jilin3.mp3"],
				trigger: {
					target: "useCardToTarget",
				},
				filter(event, player) {
					return event.player != player && player.getExpansions("jilin").some(card => !card.storage.jilin);
				},
				async cost(event, trigger, player) {
					const hidden = player.getExpansions("jilin").filter(card => !card.storage.jilin);
					const goon = get.effect(player, trigger.card, trigger.player, player) < 0;
					const suits = player
						.getExpansions("jilin")
						.filter(card => card.storage.jilin)
						.map(card => get.suit(card))
						.toUniqued();
					if (hidden.length == 1) {
						const { bool } = await player
							.chooseBool("戢鳞：明置一张“志”", `令${get.translation(trigger.card)}对你无效`)
							.set("choice", goon)
							.forResult();
						event.result = {
							bool: bool,
							cost_data: hidden,
						};
					} else {
						const { bool, links } = await player
							.chooseButton(["戢鳞：明置一张“志”", hidden])
							.set("ai", button => {
								const player = get.player(),
									card = button.link,
									suits = get.event().suits;
								if (!get.event().goon) {
									return 0;
								}
								if (!suits.includes(get.suit(card))) {
									return 10;
								}
								return 6 - get.value(card);
							})
							.set("suits", suits)
							.set("goon", goon)
							.forResult();
						event.result = {
							bool: bool,
							cost_data: links,
						};
					}
				},
				async content(event, trigger, player) {
					await player.showCards(event.cost_data, get.translation(player) + "发动了【戢鳞】");
					event.cost_data[0].storage.jilin = true;
					trigger.getParent().excluded.add(player);
				},
			},
			change: {
				audio: ["jilin4.mp3", "jilin5.mp3"],
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return player.countCards("h") && player.getExpansions("jilin").some(card => !card.storage.jilin);
				},
				async cost(event, trigger, player) {
					const hidden = player.getExpansions("jilin").filter(card => !card.storage.jilin);
					const next = player.chooseToMove("戢鳞：是否交换“志”和手牌？");
					next.set("list", [
						[get.translation(player) + "（你）的未明之“志”", hidden],
						["手牌区", player.getCards("h")],
					]);
					next.set("filterMove", (from, to) => {
						return typeof to != "number";
					});
					next.set("processAI", list => {
						let player = get.player(),
							cards = list[0][1].concat(list[1][1]).sort(function (a, b) {
								return get.useful(a) - get.useful(b);
							}),
							cards2 = cards.splice(0, player.getExpansions("jilin").length);
						return [cards2, cards];
					});
					const { bool, moved } = await next.forResult();
					event.result = {
						bool: bool,
						cost_data: moved,
					};
				},
				async content(event, trigger, player) {
					const moved = event.cost_data;
					const pushs = moved[0],
						gains = moved[1];
					pushs.removeArray(player.getExpansions("jilin"));
					gains.removeArray(player.getCards("h"));
					if (!pushs.length || pushs.length != gains.length) {
						return;
					}
					const next = player.addToExpansion(pushs);
					next.gaintag.add("jilin");
					await next;
					await player.gain(gains, "draw");
				},
			},
		},
	},
	yingyou: {
		audio: 4,
		trigger: {
			player: "phaseUseBegin",
		},
		filter(event, player) {
			return player.countCards("h") && player.getExpansions("jilin").some(card => !card.storage.jilin);
		},
		async cost(event, trigger, player) {
			const hidden = player.getExpansions("jilin").filter(card => !card.storage.jilin);
			const suits = player
				.getExpansions("jilin")
				.filter(card => card.storage.jilin)
				.map(card => get.suit(card))
				.toUniqued();
			const { bool, links } = await player
				.chooseButton(["英猷：你可以明志", hidden])
				.set("ai", button => {
					const player = get.player(),
						card = button.link,
						suits = get.event().suits;
					const getNum = player => {
						var list = [];
						for (var i of lib.suit) {
							list.push(player.countCards("h", { suit: i }) + 3);
						}
						return list.sort((a, b) => b - a)[0];
					};
					if (!suits.includes(get.suit(card))) {
						return 10;
					}
					if (get.suit(card) == getNum(player)) {
						return 5;
					}
					return 0;
				})
				.set("suits", suits)
				.forResult();
			event.result = {
				bool: bool,
				cost_data: links,
			};
		},
		logAudio: () => 2,
		async content(event, trigger, player) {
			await player.showCards(event.cost_data, get.translation(player) + "发动了【英猷】");
			event.cost_data[0].storage.jilin = true;
			const num = player.getExpansions("jilin").filter(card => card.storage.jilin).length;
			await player.draw(num);
		},
		ai: {
			combo: "jilin",
		},
		group: "yingyou_draw",
		subSkill: {
			draw: {
				audio: ["yingyou3.mp3", "yingyou4.mp3"],
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter(event, player) {
					const suits = player
						.getExpansions("jilin")
						.filter(card => card.storage.jilin)
						.map(card => get.suit(card))
						.toUniqued();
					const evt = event.getl(player);
					if (!evt || !evt.cards2 || !evt.cards2.length) {
						return false;
					}
					return evt.cards2.some(card => {
						return suits.includes(get.suit(card, player));
					});
				},
				forced: true,
				locked: false,
				async content(event, trigger, player) {
					const suits = player
						.getExpansions("jilin")
						.filter(card => card.storage.jilin)
						.map(card => get.suit(card))
						.toUniqued();
					const num = trigger.getl(player).cards2.filter(card => {
						return suits.includes(get.suit(card, player));
					}).length;
					await player.draw(num);
				},
			},
		},
	},
	yingtian: {
		audio: 2,
		trigger: { global: "dieAfter" },
		filter(event, player) {
			return game.countGroup() < 3;
		},
		forced: true,
		juexingji: true,
		skillAnimation: true,
		animationColor: "gray",
		async content(event, trigger, player) {
			const skill = event.name;
			player.awakenSkill(skill);
			await player.changeSkills(get.info(skill).derivation, ["yingyou"]);
			player.addSkill(skill + "_effect");
		},
		derivation: ["reguicai", "rewansha", "lianpo"],
		subSkill: {
			effect: {
				mod: {
					targetInRange: () => true,
				},
			},
		},
	},
	changandajian_equip5: {
		equipSkill: true,
		mod: { maxHandcard: (player, num) => num + 2 },
	},
	changandajian_destroy: {
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		forced: true,
		charlotte: true,
		equipSkill: true,
		filter(event, player) {
			var evt = event.getl(player);
			if (!evt || !evt.es || !evt.es.length) {
				return false;
			}
			for (var i of evt.es) {
				if (i.name.indexOf("changandajian_equip") == 0) {
					return true;
				}
			}
			return false;
		},
		getEffect(player, target) {
			if (player == target) {
				return 0;
			}
			var getRaw = function () {
				var att = get.attitude(player, target);
				if (att > 0) {
					if (
						target.countCards("j", function (card) {
							var cardj = card.viewAs ? { name: card.viewAs } : card;
							return get.effect(target, cardj, target, player) < 0;
						}) > 0
					) {
						return 3;
					}
					if (target.getEquip("baiyin") && target.isDamaged() && get.recoverEffect(target, player, player) > 0) {
						if (target.hp == 1 && !target.hujia) {
							return 1.6;
						}
					}
					if (
						target.countCards("e", function (card) {
							if (get.position(card) == "e") {
								return get.value(card, target) < 0;
							}
						}) > 0
					) {
						return 1;
					}
				}
				var es = target.getCards("e");
				var noe = es.length == 0 || target.hasSkillTag("noe");
				var noe2 =
					es.filter(function (esx) {
						return get.value(esx, target) > 0;
					}).length == 0;
				if (noe || noe2) {
					return 0;
				}
				if (att <= 0 && !target.countCards("e")) {
					return 1.5;
				}
				return -1.5;
			};
			return getRaw() * get.attitude(player, target);
		},
		async content(event, trigger, player) {
			let time = 0;
			let recover = 0;
			const evt = trigger.getl(player);
			for (const card of evt.es) {
				if (card.name.indexOf("changandajian_equip") === 0) {
					time++;
				}
				if (card.name === "changandajian_equip2") {
					recover++;
				}
			}
			if (recover > 0) {
				await player.recover(recover);
			}

			for (let i = 0; i < time && game.hasPlayer(current => current.countCards("ej") > 0); i++) {
				let result = await player
					.chooseTarget(true, "选择一名装备区或判定区有牌的角色", (card, player, target) => target.countCards("ej") > 0)
					.set("ai", target => lib.skill.changandajian_destroy.getEffect(_status.event.player, target))
					.forResult();
				if (!result.bool) {
					return;
				}

				// @ts-expect-error 必然存在
				const target = result.targets[0];
				player.line(target, "green");
				result = await player.choosePlayerCard(target, true, "ej").forResult();
				if (!result.bool) {
					return;
				}

				// @ts-expect-error 必然存在
				const card = result.cards[0];
				const num = get.number(card);
				// @ts-expect-error 神秘类型
				if (typeof get.strNumber(num, false) === "string") {
					if (lib.filter.canBeGained(card, player, target)) {
						await player.gain(card, target, "give", "bySelf");
					}
				} else if (lib.filter.canBeDiscarded(card, player, target)) {
					await target.discard(card);
				}
			}
		},
	},
	dili: {
		audio: 2,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter(event, player) {
			if (player.storage.dili) {
				return false;
			}
			if (event.name != "phase") {
				return true;
			}
			if (game.phaseNumber == 0) {
				return true;
			}
			//让神山识能够获得东吴命运线
			return player.name == "key_shiki";
		},
		async content(event, trigger, player) {
			player.storage.dili = true;
			const skill = ["dili_shengzhi", "dili_chigang", "dili_qionglan", "dili_quandao", "dili_jiaohui", "dili_yuanlv"].randomGet();
			player.addSkill(skill);
			game.log(player, '解锁了<span style="font-family: yuanli">东吴命运线</span>：', "#g【" + get.translation(skill) + "】");
		},
		derivation: [
			"dili_shengzhi",
			"dili_chigang",
			"dili_qionglan",
			"dili_quandao",
			"dili_jiaohui",
			"dili_yuanlv",
			"gzyinghun",
			"hongde",
			"rebingyi",
			"xinfu_guanwei",
			"bizheng",
			"xinanguo",
			"shelie",
			"wengua",
			"rebotu",
			"rezhiheng",
			"jiexun",
			"reanxu",
			"xiashu",
			"rejieyin",
			"oldimeng",
			"xinfu_guanchao",
			"drlt_jueyan",
			"lanjiang",
		],
		subSkill: {
			shengzhi: {
				audio: 2,
				trigger: { player: "useCard" },
				forced: true,
				filter(event, player) {
					var num = get.number(event.card);
					if (typeof num != "number") {
						return false;
					}
					if (num <= 1) {
						return false;
					}
					for (var i = 2; i <= Math.sqrt(num); i++) {
						if (num % i == 0) {
							return false;
						}
					}
					if (!player.storage.yuheng) {
						return false;
					}
					var list = ["gzyinghun", "hongde", "rebingyi"];
					for (var i of list) {
						if (!player.storage.yuheng.includes(i)) {
							return false;
						}
					}
					return true;
				},
				async content(event, trigger, player) {
					trigger.directHit.addArray(game.filterPlayer(current => current != player));
				},
				init(player, skill) {
					player.markAuto("yuheng_current", ["gzyinghun", "hongde", "rebingyi"]);
				},
				mark: true,
				ai: {
					directHit_ai: true,
					skillTagFilter(player, tag, arg) {
						if (arg && arg.card) {
							var num = get.number(arg.card);
							if (typeof num != "number") {
								return false;
							}
							if (num <= 1) {
								return false;
							}
							for (var i = 2; i <= Math.sqrt(num); i++) {
								if (num % i == 0) {
									return false;
								}
							}
							return true;
						}
						return false;
					},
				},
				intro: {
					name: "命运线：圣质",
					content(storage, player) {
						var finished = [],
							unfinished = ["gzyinghun", "hongde", "rebingyi"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str += "<li>锁定技。若你因〖驭衡〗获得过〖英魂〗〖弘德〗〖秉壹〗，则当你使用点数为质数的牌时，此牌不可被响应。";
						return str;
					},
				},
			},
			chigang: {
				audio: 2,
				trigger: { player: "phaseChange" },
				forced: true,
				filter(event, player) {
					if (!player.storage.yuheng?.length) {
						return false;
					}
					const list = ["xinfu_guanwei", "bizheng", "xinanguo"];
					if (list.some(skill => !player.storage.yuheng.includes(skill))) {
						return false;
					}
					return event.phaseList[event.num].indexOf("phaseJudge") != -1;
				},
				async content(event, trigger, player) {
					trigger.phaseList[trigger.num] = `phaseDraw|${event.name}`;
					await game.delayx();
				},
				init(player, skill) {
					player.markAuto("yuheng_current", ["xinfu_guanwei", "bizheng", "xinanguo"]);
				},
				ai: {
					effect: {
						target(card) {
							if (get.type(card) == "delay") {
								return "zeroplayertarget";
							}
						},
					},
				},
				mark: true,
				intro: {
					name: "命运线：持纲",
					content(storage, player) {
						var finished = [],
							unfinished = ["xinfu_guanwei", "bizheng", "xinanguo"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str +=
							"<li>锁定技。若你因〖驭衡〗获得过〖观微〗〖弼政〗〖安国〗，则当你的判定阶段开始前，你跳过此阶段并获得一个额外的摸牌阶段。";
						return str;
					},
				},
			},
			qionglan: {
				audio: 2,
				init(player, skill) {
					player.markAuto("yuheng_current", ["shelie", "wengua", "rebotu"]);
				},
				trigger: { player: "useSkillAfter" },
				forced: true,
				limited: true,
				filter(event, player) {
					if (!player.storage.yuheng || event.skill != "yuheng") {
						return false;
					}
					var list = ["shelie", "wengua", "rebotu"];
					for (var i of list) {
						if (!player.storage.yuheng.includes(i)) {
							return false;
						}
					}
					return true;
				},
				async content(event, trigger, player) {
					player.awakenSkill(event.name);
					const list = ["dili_shengzhi", "dili_chigang", "dili_quandao", "dili_jiaohui", "dili_yuanlv"];
					const list2 = list.randomRemove(2);
					if (list2.includes("dili_quandao") && list2.includes("dili_jiaohui")) {
						list2.randomRemove(1);
						list2.push(list.randomGet());
					}
					for (const skill of list2) {
						player.addSkill(skill);
						game.log(player, '解锁了<span style="font-family: yuanli">东吴命运线</span>：', "#g【" + get.translation(skill) + "】");
					}
				},
				mark: true,
				intro: {
					name: "命运线：穹览",
					content(storage, player) {
						var finished = [],
							unfinished = ["shelie", "wengua", "rebotu"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str +=
							'<li>锁定技，限定技。若你因〖驭衡〗获得过〖涉猎〗〖问卦〗〖博图〗，则当你发动的〖驭衡〗结算结束后，你随机获得两条其他<span style="font-family: yuanli">东吴命运线</span>。';
						return str;
					},
				},
			},
			quandao: {
				audio: 2,
				mod: {
					cardname(card, player) {
						if (player.storage.yuheng && typeof get.strNumber(card.number, false) === "string") {
							var list = ["rezhiheng", "jiexun", "reanxu"];
							for (var i of list) {
								if (!player.storage.yuheng.includes(i)) {
									return;
								}
							}
							return "tiaojiyanmei";
						}
					},
				},
				init(player, skill) {
					player.markAuto("yuheng_current", ["rezhiheng", "jiexun", "reanxu"]);
				},
				mark: true,
				intro: {
					name: "命运线：权道",
					content(storage, player) {
						var finished = [],
							unfinished = ["rezhiheng", "jiexun", "reanxu"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str += "<li>锁定技。若你因〖驭衡〗获得过〖制衡〗〖诫训〗〖安恤〗，则你手牌区内点数为字母的牌的牌名视为【调剂盐梅】。";
						return str;
					},
				},
			},
			jiaohui: {
				audio: 2,
				mod: {
					cardname(card, player) {
						if (player.countCards("h") == 1 && player.storage.yuheng) {
							var list = ["xiashu", "rejieyin", "oldimeng"];
							for (var i of list) {
								if (!player.storage.yuheng.includes(i)) {
									return;
								}
							}
							return "yuanjiao";
						}
					},
				},
				init(player, skill) {
					player.markAuto("yuheng_current", ["xiashu", "rejieyin", "oldimeng"]);
				},
				mark: true,
				intro: {
					name: "命运线：交辉",
					content(storage, player) {
						var finished = [],
							unfinished = ["xiashu", "rejieyin", "oldimeng"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str += "<li>锁定技。若你因〖驭衡〗获得过〖下书〗〖结姻〗〖缔盟〗，且你的手牌数为1，则此牌的牌名视为【远交近攻】。";
						return str;
					},
				},
			},
			yuanlv: {
				audio: 2,
				init(player, skill) {
					_status.changandajian_cardcolor = 0;
					player.markAuto("yuheng_current", ["xinfu_guanchao", "drlt_jueyan", "lanjiang"]);
				},
				trigger: { player: "useCardToTargeted" },
				forced: true,
				filter(event, player) {
					if (
						get.type(event.card, null, false) != "equip" ||
						player != event.target ||
						event.card.name.indexOf("changandajian_equip") == 0
					) {
						return false;
					}
					if (!player.storage.yuheng) {
						return false;
					}
					var list = ["xinfu_guanchao", "drlt_jueyan", "lanjiang"];
					for (var i of list) {
						if (!player.storage.yuheng.includes(i)) {
							return false;
						}
					}
					var type = get.subtype(event.card);
					if (lib.card["changandajian_" + type] && player.hasEquipableSlot(type)) {
						return true;
					}
					return false;
				},
				async content(event, trigger, player) {
					const cards = trigger.cards.filterInD();
					if (cards.length > 0) {
						await game.cardsDiscard(cards);
					}
					const type = get.subtype(trigger.card);
					const card = game.createCard("changandajian_" + type, _status.changandajian_cardcolor++ % 2 ? "spade" : "heart", 10);
					await player.useCard(card, player);
				},
				mark: true,
				intro: {
					name: "命运线：渊虑",
					content(storage, player) {
						var finished = [],
							unfinished = ["xinfu_guanchao", "drlt_jueyan", "lanjiang"];
						if (player.storage.yuheng) {
							for (var i = 0; i < unfinished.length; i++) {
								if (player.storage.yuheng.includes(unfinished[i])) {
									finished.push(unfinished[i]);
									unfinished.splice(i--, 1);
								}
							}
						}
						var str = "";
						if (unfinished.length) {
							str += "<li>未获得：" + get.translation(unfinished) + "<br>";
						}
						if (finished.length) {
							str += "<li>已获得过：" + get.translation(finished) + "<br>";
						}
						str +=
							"<li>锁定技。若你因〖驭衡〗获得过〖观潮〗〖决堰〗〖澜疆〗，则当你成为自己使用的装备牌的目标后，你将此牌置于弃牌堆，然后使用一张与此装备牌副类别相同的【长安大舰】。";
						return str;
					},
				},
			},
		},
		ai: {
			combo: "yuheng",
		},
	},
	yuheng: {
		audio: 2,
		enable: "phaseUse",
		usable: 1,
		async content(event, trigger, player) {
			// ?
			let skills = player.getSkills(null, false, false).filter(skill => {
				if (skill == "yuheng") {
					return false;
				}
				const info = get.info(skill);
				return info && !info.charlotte && !get.is.locked(skill);
			});
			if (skills.length) {
				player.removeSkills(skills);
			}
			//初始化技能库
			const list1 = ["dili_shengzhi", "dili_chigang", "dili_qionglan", "dili_quandao", "dili_jiaohui", "dili_yuanlv"];
			const list2 = [
				"gzyinghun",
				"hongde",
				"rebingyi",
				"xinfu_guanwei",
				"bizheng",
				"xinanguo",
				"shelie",
				"wengua",
				"rebotu",
				"rezhiheng",
				"jiexun",
				"reanxu",
				"xiashu",
				"rejieyin",
				"oldimeng",
				"xinfu_guanchao",
				"drlt_jueyan",
				"lanjiang",
			];
			const list3 = [];
			if (!player.storage.yuheng_full) {
				player.storage.yuheng_full = list2.slice(0);
			}
			if (player.getStorage("yuheng_current").length == 0) {
				for (let i = 0; i < list1.length; i++) {
					if (player.hasSkill(list1[i])) {
						for (var j = 0; j < 3; j++) {
							list3.add(list2[i * 3 + j]);
						}
					}
				}
				if (!player.storage.yuheng_current) {
					player.storage.yuheng_current = list3.slice(0);
				}
			}
			let fullskills, currentskills;
			//决定抽选技能范围
			if (player.storage.yuheng_full && player.storage.yuheng_full.length) {
				fullskills = player.storage.yuheng_full;
			} else {
				fullskills = list2.slice(0);
			}
			if (player.storage.yuheng_current && player.storage.yuheng_current.length) {
				currentskills = player.storage.yuheng_current;
			} else {
				currentskills = list3.slice(0);
			}
			skills = [];
			//在没有发动过其他非锁定技时抽选技能
			const evtx = event.getParent("phaseUse");
			if (
				currentskills.length > 0 &&
				!player.hasHistory("useSkill", evt => {
					if (evt.skill == "yuheng" || evt.type != "player" || !evt.sourceSkill) {
						return false;
					}
					const info1 = get.info(evt.skill);
					if (info1.charlotte) {
						return false;
					}
					const info = get.info(evt.sourceSkill);
					if (info.charlotte || get.is.locked(evt.skill)) {
						return false;
					}
					return evt.event.getParent("phaseUse") == evtx;
				})
			) {
				fullskills.randomSort();
				currentskills.randomSort();
				for (let i = 0; i < fullskills.length; i++) {
					for (let j = 0; j < currentskills.length; j++) {
						if (fullskills[i] != currentskills[j] || (i == fullskills.length - 1 && j == currentskills.length - 1)) {
							skills.add(fullskills.splice(i--, 1)[0]);
							skills.add(currentskills.splice(j--, 1)[0]);
							break;
						}
					}
					if (skills.length > 0) {
						break;
					}
				}
			} else {
				//在已经发动过其他非锁定技时抽选技能
				skills.add(fullskills.randomRemove(1)[0]);
			}
			for (const skill of skills) {
				player.addSkills(skill);
			}
			player.markAuto("yuheng", skills);
		},
		ai: {
			order(item, player) {
				var evtx = _status.event.getParent("phaseUse");
				if (
					!player.hasHistory("useSkill", function (evt) {
						if (evt.skill == "yuheng" || evt.type != "player" || !evt.sourceSkill) {
							return false;
						}
						var info1 = get.info(evt.skill);
						if (info1.charlotte) {
							return false;
						}
						var info = get.info(evt.sourceSkill);
						if (info.charlotte || get.is.locked(evt.skill)) {
							return false;
						}
						return evt.event.getParent("phaseUse") == evtx;
					})
				) {
					return 11;
				}
				return 0.8;
			},
			result: { player: 1 },
		},
		group: "yuheng_losehp",
		subSkill: {
			losehp: {
				audio: "yuheng",
				trigger: { player: "phaseUseEnd" },
				forced: true,
				locked: false,
				filter(event, player) {
					return !player.hasHistory("useSkill", function (evt) {
						if (evt.skill != "yuheng") {
							return false;
						}
						return evt.event.getParent("phaseUse") == event;
					});
				},
				async content(event, trigger, player) {
					await player.loseHp();
				},
			},
		},
	},
	wuhun2: { audio: 2 },
	new_wuhun: {
		audio: "wuhun2",
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.source && event.source.isIn();
		},
		forced: true,
		logTarget: "source",
		async content(event, trigger, player) {
			trigger.source.addMark("new_wuhun", trigger.num);
		},
		group: "new_wuhun_die",
		ai: {
			notemp: true,
			effect: {
				target: (card, player, target) => {
					if (!target.hasFriend()) {
						return;
					}
					let rec = get.tag(card, "recover"),
						damage = get.tag(card, "damage");
					if (!rec && !damage) {
						return;
					}
					if (damage && player.hasSkillTag("jueqing", false, target)) {
						return 1.7;
					}
					let die = [null, 1],
						temp;
					game.filterPlayer(i => {
						temp = i.countMark("new_wuhun");
						if (i === player && target.hp + target.hujia > 1) {
							temp++;
						}
						if (temp > die[1]) {
							die = [i, temp];
						} else if (temp === die[1]) {
							if (!die[0]) {
								die = [i, temp];
							} else if (get.attitude(target, i) < get.attitude(target, die[0])) {
								die = [i, temp];
							}
						}
					});
					if (die[0]) {
						if (damage) {
							return [1, 0, 1, (-6 * get.sgnAttitude(player, die[0])) / Math.max(1, target.hp)];
						}
						return [1, (6 * get.sgnAttitude(player, die[0])) / Math.max(1, target.hp)];
					}
				},
			},
		},
		marktext: "魇",
		intro: {
			name: "梦魇",
			content: "mark",
			onunmark: true,
		},
		subSkill: {
			die: {
				audio: "wuhun2",
				trigger: { player: "die" },
				filter(event, player) {
					return game.hasPlayer(function (current) {
						return current != player && current.hasMark("new_wuhun");
					});
				},
				forced: true,
				direct: true,
				forceDie: true,
				skillAnimation: true,
				animationColor: "soil",
				async content(event, trigger, player) {
					let maxNum = 0;
					for (const current of game.players) {
						if (current === player) {
							continue;
						}

						const markNum = current.countMark("new_wuhun");
						maxNum = Math.max(maxNum, markNum);
					}
					const num = maxNum;
					let result = await player
						.chooseTarget(
							true,
							"请选择【武魂】的目标",
							"令其进行判定，若判定结果不为【桃】或【桃园结义】，则其死亡",
							(card, player, target) => {
								return target != player && target.countMark("new_wuhun") == _status.event.num;
							}
						)
						.set("ai", target => -get.attitude(_status.event.player, target))
						.set("forceDie", true)
						.set("num", num)
						.forResult();
					if (!result.bool) {
						return;
					}

					const target = result.targets[0];
					event.target = target;
					player.logSkill("new_wuhun_die", target);
					player.line(target, { color: [255, 255, 0] });
					await game.delay(2);
					result = await target
						.judge(card => (["tao", "taoyuan"].includes(card.name) ? 10 : -10))
						.set("judge2", result => !result.bool)
						.forResult();
					if (!result.bool) {
						await target.die();
					}
				},
			},
		},
	},
	new_guixin: {
		audio: "guixin",
		trigger: {
			player: "damageEnd",
		},
		filter(event, player) {
			return game.hasPlayer(cur => {
				return cur !== player && cur.countCards("hej") > 0;
			});
		},
		check(event, player) {
			if (player.isTurnedOver() || event.num > 1) {
				return true;
			}
			var num = game.countPlayer(function (current) {
				if (current.countCards("he") && current != player && get.attitude(player, current) <= 0) {
					return true;
				}
				if (current.countCards("j") && current != player && get.attitude(player, current) > 0) {
					return true;
				}
			});
			return num >= 2;
		},
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			let targets = game.filterPlayer();
			targets.remove(player);
			targets.sort(lib.sort.seat);
			player.line(targets, "green");
			const control = await player
				.chooseControl("手牌区", "装备区", "判定区")
				.set("ai", function () {
					if (
						game.hasPlayer(function (current) {
							return current.countCards("j") && current != player && get.attitude(player, current) > 0;
						})
					) {
						return 2;
					}
					return Math.floor(Math.random() * 3);
				})
				.set("prompt", "请选择优先获得的区域")
				.forResult();
			const range = {
				手牌区: ["h", "e", "j"],
				装备区: ["e", "h", "j"],
				判定区: ["j", "h", "e"],
			}[control.control || "手牌区"];
			while (targets.length > 0) {
				const target = targets.shift();
				for (var i = 0; i < range.length; i++) {
					var cards = target.getCards(range[i]);
					if (cards.length) {
						var card = cards.randomGet();
						await player.gain(card, target, "giveAuto", "bySelf");
						break;
					}
				}
			}
			await player.turnOver();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 2.5;
				}
				return 1;
			},
			effect: {
				target(card, player, target) {
					if (
						!target._new_guixin_eff &&
						get.tag(card, "damage") &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							card: card,
							target: target,
						})
							? 2
							: 1)
					) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						target._new_guixin_eff = true;
						let gain = game.countPlayer(function (current) {
							if (target == current) {
								return 0;
							}
							if (get.attitude(target, current) > 0) {
								if (
									current.hasCard(
										cardx =>
											lib.filter.canBeGained(cardx, target, current, "new_guixin") &&
											get.effect(current, cardx, current, current) < 0,
										"j"
									)
								) {
									return 1.3;
								}
								return 0;
							}
							if (
								current.hasCard(
									cardx =>
										lib.filter.canBeGained(cardx, target, current, "new_guixin") &&
										get.effect(current, cardx, current, current) > 0,
									"e"
								)
							) {
								return 1.1;
							}
							if (current.hasCard(cardx => lib.filter.canBeGained(cardx, target, current, "new_guixin"), "h")) {
								return 0.9;
							}
							return 0;
						});
						if (target.isTurnedOver()) {
							gain += 2.3;
						} else {
							gain -= 2.3;
						}
						delete target._new_guixin_eff;
						return [1, Math.max(0, gain)];
					}
				},
			},
		},
	},
	ol_shenfen: {
		audio: 2,
		enable: "phaseUse",
		filter(event, player) {
			return player.countMark("baonu") >= 6;
		},
		usable: 1,
		skillAnimation: true,
		animationColor: "metal",
		async content(event, trigger, player) {
			player.removeMark("baonu", 6);
			const targets = game.filterPlayer(target => target !== player);
			player.line(targets, "green");

			await game.doAsyncInOrder(targets, target => target.damage("nocard"));
			await game.doAsyncInOrder(targets, async target => {
				const cards = target.getCards("e");
				await target.discard(cards).set("delay", false);
				if (cards.length) {
					await game.delay(0.5);
				}
			});
			await game.doAsyncInOrder(targets, async target => {
				const num = target.countCards("h");
				await target.chooseToDiscard(4, "h", true).set("delay", false);
				if (num > 0) {
					await game.delay(0.5);
				}
			});
			await player.turnOver();
		},
		ai: {
			combo: "baonu",
			order: 10,
			result: {
				player(player) {
					return game.countPlayer(function (current) {
						if (current != player) {
							return get.sgn(get.damageEffect(current, player, player));
						}
					});
				},
			},
		},
	},
	ol_wuqian: {
		audio: 2,
		enable: "phaseUse",
		derivation: "wushuang",
		filter(event, player) {
			return player.countMark("baonu") >= 2 && game.hasPlayer(target => lib.skill.ol_wuqian.filterTarget(null, player, target));
		},
		filterTarget(card, player, target) {
			return target != player && !target.hasSkill("ol_wuqian_targeted");
		},
		async content(event, trigger, player) {
			const { target } = event;
			player.removeMark("baonu", 2);
			await player.addTempSkills("wushuang");
			player.popup("无双");
			// game.log(player,'获得了技能','#g【无双】');
			target.addTempSkill("ol_wuqian_targeted");
		},
		ai: {
			order: 9,
			result: {
				target(player, target) {
					if (
						player.countCards("hs", card => {
							if (!player.getCardUsable({ name: card.name })) {
								return false;
							}
							if (!player.canUse(card, target)) {
								return false;
							}
							var eff1 = get.effect(target, card, player, player);
							_status.baonuCheck = true;
							var eff2 = get.effect(target, card, player, player);
							delete _status.baonuCheck;
							return eff2 > Math.max(0, eff1);
						})
					) {
						return -1;
					}
					return 0;
				},
			},
			combo: "baonu",
		},
		global: "ol_wuqian_ai",
		subSkill: {
			targeted: {
				charlotte: true,
				ai: { unequip2: true },
			},
			ai: {
				ai: {
					unequip2: true,
					skillTagFilter(player) {
						if (!_status.baonuCheck) {
							return false;
						}
					},
				},
			},
		},
	},
	wumou: {
		audio: 2,
		trigger: { player: "useCard" },
		forced: true,
		filter(event) {
			return get.type(event.card) == "trick";
		},
		async content(event, trigger, player) {
			if (!player.hasMark("baonu")) {
				await player.loseHp();
				return;
			}

			const result = await player
				.chooseControlList(["移去一枚【暴怒】标记", "失去1点体力"], true)
				.set("ai", (event, player) => {
					if (get.effect(player, { name: "losehp" }, player, player) >= 0) {
						return 1;
					}
					if (player.storage.baonu > 6) {
						return 0;
					}
					if (player.hp + player.countCards("h", "tao") > 3) {
						return 1;
					}
					return 0;
				})
				.forResult();

			if (result.index == 0) {
				player.removeMark("baonu", 1);
			} else {
				await player.loseHp();
			}
		},
		ai: {
			effect: {
				player_use(card, player) {
					if (get.type(card) == "trick" && get.value(card) < 6) {
						return [0, -2];
					}
				},
			},
			neg: true,
		},
	},
	qinyin: {
		audio: 2,
		audioname: ["mb_zhouyu"],
		trigger: { player: "phaseDiscardEnd" },
		direct: true,
		logAudio: index => (typeof index === "number" ? "qinyin" + index + ".mp3" : 2),
		logAudio2: {
			mb_zhouyu: index => (typeof index === "number" ? `qinyin_mb_zhouyu${index}.mp3` : 2),
		},
		filter(event, player) {
			var cards = [];
			player.getHistory("lose", function (evt) {
				if (evt.type == "discard" && evt.getParent("phaseDiscard") == event) {
					cards.addArray(evt.cards2);
				}
			});
			return cards.length > 1;
		},
		async content(event, trigger, player) {
			event.forceDie = true;
			if (typeof event.count !== "number") {
				event.count = 1;
			}

			for (let time = event.count; time > 0; time--) {
				let recover = 0;
				let lose = 0;
				const players = game.filterPlayer();
				for (const current of players) {
					if (current.hp < current.maxHp) {
						if (get.attitude(player, current) > 0) {
							if (current.hp < 2) {
								lose--;
								recover += 0.5;
							}
							lose--;
							recover++;
						} else if (get.attitude(player, current) < 0) {
							if (current.hp < 2) {
								lose++;
								recover -= 0.5;
							}
							lose++;
							recover--;
						}
					} else {
						if (get.attitude(player, current) > 0) {
							lose--;
						} else if (get.attitude(player, current) < 0) {
							lose++;
						}
					}
				}

				const prompt = get.prompt("qinyin") + "（剩余" + get.cnNumber(time) + "次）";
				const next = player.chooseControl("失去体力", "回复体力", "cancel2", ui.create.dialog(get.prompt("qinyin"), "hidden"));
				next.set("ai", () => {
					if (lose > recover && lose > 0) {
						return 0;
					}
					if (lose < recover && recover > 0) {
						return 1;
					}
					return 2;
				});

				const result = await next.forResult();
				if (result.control === "cancel2") {
					return;
				}

				player.logSkill("qinyin", null, null, null, [result.control == "回复体力" ? 2 : 1]);
				const bool = result.control === "回复体力";
				await game.doAsyncInOrder(game.filterPlayer(), async target => {
					if (bool) {
						await target.recover();
					} else {
						await target.loseHp();
					}
				});
			}
		},
		ai: {
			expose: 0.1,
			threaten: 2,
		},
	},
	lianpo: {
		audio: 2,
		audioname: ["new_simayi"],
		trigger: { global: "phaseAfter" },
		frequent: true,
		filter(event, player) {
			return player.getStat("kill") > 0;
		},
		async content(event, trigger, player) {
			player.insertPhase();
		},
	},
	baonu: {
		audio: 2,
		marktext: "暴",
		trigger: {
			source: "damageSource",
			player: ["damageEnd", "enterGame"],
			global: "phaseBefore",
		},
		forced: true,
		filter(event) {
			return (event.name != "damage" && (event.name != "phase" || game.phaseNumber == 0)) || event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("baonu", trigger.name == "damage" ? trigger.num : 2);
		},
		intro: {
			name: "暴怒",
			content: "mark",
		},
		ai: {
			combo: "ol_shenfen",
			maixie: true,
			maixie_hp: true,
		},
	},
	shenfen: {
		audio: 2,
		unique: true,
		enable: "phaseUse",
		filter(event, player) {
			return player.storage.baonu >= 6;
		},
		skillAnimation: true,
		animationColor: "metal",
		limited: true,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.storage.baonu -= 6;
			player.markSkill("baonu");
			player.syncStorage("baonu");
			event.targets = game.filterPlayer();
			event.targets.remove(player);
			// event.targets.sort(lib.sort.seat);
			event.targets2 = event.targets.slice(0);
			player.line(event.targets, "green");

			await game.doAsyncInOrder(event.targets, target => target.damage());
			await game.doAsyncInOrder(event.targets2, async target => {
				if (target && target.countCards("he")) {
					await target.chooseToDiscard("he", true, 4);
				}
			});
		},
		ai: {
			order: 10,
			result: {
				player(player) {
					return game.countPlayer(function (current) {
						if (current != player) {
							return get.sgn(get.damageEffect(current, player, player));
						}
					});
				},
			},
			combo: "baonu",
		},
	},
	wuqian: {
		audio: 2,
		enable: "phaseUse",
		derivation: "wushuang",
		filter(event, player) {
			return player.storage.baonu >= 2 && !player.hasSkill("wushuang");
		},
		async content(event, trigger, player) {
			player.storage.baonu -= 2;
			player.addTempSkill("wushuang");
		},
		ai: {
			order: 5,
			result: {
				player(player) {
					if (!player.storage.shenfen) {
						return 0;
					}
					var cards = player.getCards("h", "sha");
					if (cards.length) {
						if (
							game.hasPlayer(function (current) {
								return player.canUse("sha", current) && get.effect(current, cards[0], player, player) > 0 && current.hasShan();
							})
						) {
							return 1;
						}
					}
					return 0;
				},
			},
			combo: "baonu",
		},
	},
	renjie: {
		audio: "renjie2",
		trigger: { player: "damageEnd" },
		forced: true,
		group: "renjie2",
		filter(event) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("renjie", trigger.num);
		},
		intro: {
			name2: "忍",
			content: "mark",
		},
		marktext: "忍",
		ai: {
			maixie: true,
			maixie_hp: true,
			combo: "jilue",
			effect: {
				target(card, player, target) {
					if ((!target.hasSkill("sbaiyin") && !target.hasSkill("jilue")) || !target.hasFriend()) {
						return;
					}
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -2];
					}
					if (get.tag(card, "damage")) {
						if (target.hp == target.maxHp) {
							if (!target.hasSkill("jilue")) {
								return [0, 1];
							}
							return [0.7, 1];
						}
						return 0.7;
					}
				},
			},
		},
	},
	renjie2: {
		audio: 2,
		mod: {
			aiOrder: (player, card, num) => {
				if (num <= 0 || typeof card !== "object" || !player.isPhaseUsing()) {
					return num;
				}
				if (player.hasSkill("sbaiyin")) {
					if (player.countMark("renjie") < 4 && player.getUseValue(card) < Math.min(4, (player.hp * player.hp) / 4)) {
						return 0;
					}
				} else if (player.hasSkill("jilue")) {
					if (player.countMark("renjie") < 3 && player.getUseValue(card) < Math.min(1.8, 0.18 * player.hp * player.hp)) {
						return 0;
					}
				}
			},
		},
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		forced: true,
		sourceSkill: "renjie",
		filter(event, player) {
			if (event.type != "discard" || event.getlx === false) {
				return false;
			}
			var evt = event.getParent("phaseDiscard"),
				evt2 = event.getl(player);
			return evt && evt2 && evt.name == "phaseDiscard" && evt.player == player && evt2.cards2 && evt2.cards2.length > 0;
		},
		async content(event, trigger, player) {
			player.addMark("renjie", trigger.getl(player).cards2.length);
		},
	},
	sbaiyin: {
		skillAnimation: "epic",
		animationColor: "thunder",
		juexingji: true,
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		audio: 2,
		filter(event, player) {
			return player.countMark("renjie") >= 4;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			await player.loseMaxHp();
			await player.addSkills("jilue");
		},
		derivation: ["jilue", "jilue_guicai", "jilue_fangzhu", "jilue_jizhi", "jilue_zhiheng", "jilue_wansha"],
		ai: { combo: "renjie" },
	},
	jilue: {
		audio: 2,
		group: ["jilue_guicai", "jilue_fangzhu", "jilue_wansha", "jilue_zhiheng", "jilue_jizhi"],
		ai: { combo: "renjie" },
	},
	jilue_guicai: {
		audio: 1,
		trigger: { global: "judge" },
		filter(event, player) {
			return player.countCards("hes") > 0 && player.hasMark("renjie");
		},
		async cost(event, trigger, player) {
			const next = player.chooseCard("是否弃置一枚“忍”，并发动〖鬼才〗？", "hes", filterCard);
			next.set("ai", processAI);

			event.result = await next.forResult();

			return;

			/**
			 * @param {Card} card
			 * @returns {boolean}
			 */
			function filterCard(card) {
				const player = get.player();
				const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
				if (mod2 != "unchanged") {
					return mod2;
				}
				const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player);
				if (mod != "unchanged") {
					return mod;
				}
				return true;
			}

			/**
			 * @param {Card} card
			 * @returns {number}
			 */
			function processAI(card) {
				const trigger = get.event().parent._trigger;
				const player = get.event().player;
				const result = trigger.judge(card) - trigger.judge(trigger.player.judging[0]);
				const attitude = get.attitude(player, trigger.player);
				let val = get.value(card);
				if (get.subtype(card) == "equip2") {
					val /= 2;
				} else {
					val /= 4;
				}
				if (attitude == 0 || result == 0) {
					return 0;
				}
				if (attitude > 0) {
					return result - val;
				}
				return -result - val;
			}
		},
		async content(event, trigger, player) {
			const { cards } = event;
			const [card] = cards;
			player.removeMark("renjie", 1);
			await player.respond(cards, "highlight", "noOrdering");
			if (trigger.player.judging[0].clone) {
				trigger.player.judging[0].clone.delete();
				game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
			}
			await game.cardsDiscard(trigger.player.judging[0]);
			trigger.player.judging[0] = card;
			trigger.orderingCards.addArray(cards);
			game.log(trigger.player, "的判定牌改为", card);
			await game.delay(2);
		},
		ai: {
			rejudge: true,
			tag: {
				rejudge: 1,
			},
		},
	},
	jilue_fangzhu: {
		audio: 1,
		trigger: { player: "damageEnd" },
		//priority:-1,
		filter(event, player) {
			return player.hasMark("renjie");
		},
		async cost(event, trigger, player) {
			const next = player.chooseTarget("是否弃置一枚“忍”，并发动【放逐】？", (card, player, target) => player !== target);
			next.set("ai", processAI);

			event.result = await next.forResult();

			return;

			/**
			 * @param {Player} target
			 * @returns {number}
			 */
			function processAI(target) {
				if (target.hasSkillTag("noturn")) {
					return 0;
				}
				const player = get.player();
				const current = _status.currentPhase;
				const dis = current ? get.distance(current, target, "absolute") : 1;
				const draw = player.getDamagedHp();
				const att = get.attitude(player, target);
				if (att == 0) {
					return target.hasJudge("lebu") ? Math.random() / 3 : Math.sqrt(get.threaten(target)) / 5 + Math.random() / 2;
				}
				if (att > 0) {
					if (target.isTurnedOver()) {
						return att + draw;
					}
					if (draw < 4) {
						return -1;
					}
					if (current && target.getSeatNum() > current.getSeatNum()) {
						return att + draw / 3;
					}
					return (10 * Math.sqrt(Math.max(0.01, get.threaten(target)))) / (3.5 - draw) + dis / (2 * game.countPlayer());
				} else {
					if (target.isTurnedOver()) {
						return att - draw;
					}
					if (draw >= 5) {
						return -1;
					}
					if (current && target.getSeatNum() <= current.getSeatNum()) {
						return -att + draw / 3;
					}
					return (4.25 - draw) * 10 * Math.sqrt(Math.max(0.01, get.threaten(target))) + (2 * game.countPlayer()) / dis;
				}
			}
		},
		logTarget: "targets",
		async content(event, trigger, player) {
			const { targets } = event;
			const [target] = targets;
			player.removeMark("renjie", 1);
			await target.draw(player.maxHp - player.hp);
			await target.turnOver();
		},
	},
	jilue_wansha: {
		audio: 1,
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.hasMark("renjie");
		},
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);
			player.addTempSkill("rewansha");
		},
		ai: {
			order: () => {
				let player = _status.event.player;
				if (
					game.hasPlayer(current => {
						if (player === current || current.hp > 1 || get.attitude(player, current) >= 0) {
							return false;
						}
						return (
							(player.inRange(current) && player.countCards("hs", "sha") && player.getCardUsable("sha")) ||
							player.countCards("hs", card => get.name(card) !== "sha" && get.tag(card, "damage")) > 1
						);
					})
				) {
					return 9.2;
				}
				return 0;
			},
			result: {
				player: 1,
			},
			effect: {
				player(card, player, target) {
					if (target && player.hasSkill("rewansha") && target.hp <= 1 && get.tag(card, "damage")) {
						return [1, 0, 1.5, -1.5];
					}
				},
			},
		},
	},
	jilue_zhiheng: {
		audio: 1,
		audioname2: {},
		inherit: "rezhiheng",
		filter(event, player) {
			return player.hasMark("renjie");
		},
		prompt: "弃置一枚“忍”，然后弃置任意张牌并摸等量的牌。若弃置了所有的手牌，则可以多摸一张牌。",
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);

			const playerCards = player.getCards("h");
			const discardingCards = event.cards;
			await player.discard(discardingCards);

			const extraNum = discardingCards.every(card => playerCards.includes(card)) ? 1 : 0;
			await player.draw(event.num + discardingCards.length);
		},
		ai: {
			order(item, player) {
				if (player.hasCard(i => get.value(i) > Math.max(6, 9 - player.hp), "he")) {
					return 1;
				}
				return 10;
			},
			result: {
				player(player) {
					var num = 0;
					var cards = player.getCards("he");
					for (var i = 0; i < cards.length; i++) {
						if (get.value(cards[i]) < 6) {
							num++;
						}
					}
					if (cards.length > 2) {
						return 1;
					}
					// if (cards.length == 2 && player.storage.jilue > 1) {
					// }
					return 0;
				},
			},
			nokeep: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "nokeep") {
					return player.isPhaseUsing() && !player.getStat().skill.jilue_zhiheng && player.hasCard(card => get.name(card) !== "tao", "h");
				}
			},
		},
	},
	jilue_jizhi: {
		audio: 1,
		trigger: { player: "useCard" },
		filter(event, player) {
			return get.type(event.card, "trick") == "trick" && event.card.isCard && player.hasMark("renjie");
		},
		async content(event, trigger, player) {
			player.removeMark("renjie", 1);
			const result = await player.draw("nodelay").forResult();
			event.card = result.cards[0];

			if (get.type(event.card) !== "basic") {
				return;
			}

			const result2 = await player
				.chooseBool(`是否弃置${get.translation(event.card)}并令本回合手牌上限+1？`)
				.set("ai", (evt, player) => _status.currentPhase === player && player.needsToDiscard(-3) && _status.event.value < 6)
				.set("value", get.value(event.card, player))
				.forResult();

			if (result2.bool) {
				await player.discard(event.card);
				player.addTempSkill("jilue_jizhi_clear");
				player.addMark("jilue_jizhi_clear", 1, false);
			}
		},
		subSkill: {
			clear: {
				charlotte: true,
				onremove: true,
				mod: {
					maxHandcard(player, num) {
						return num + player.countMark("jilue_jizhi_clear");
					},
				},
				intro: { content: "手牌上限+#" },
			},
		},
	},
	wushen: {
		mod: {
			cardname(card, player, name) {
				if (get.suit(card) == "heart") {
					return "sha";
				}
			},
			cardnature(card, player) {
				if (get.suit(card) == "heart") {
					return false;
				}
			},
			targetInRange(card) {
				if (card.name === "sha") {
					const suit = get.suit(card);
					if (suit === "heart" || suit === "unsure") {
						return true;
					}
				}
			},
			cardUsable(card) {
				if (card.name === "sha") {
					const suit = get.suit(card);
					if (suit === "heart" || suit === "unsure") {
						return Infinity;
					}
				}
			},
		},
		audio: 2,
		trigger: { player: "useCard" },
		forced: true,
		filter(event, player) {
			return event.card.name == "sha" && get.suit(event.card) == "heart";
		},
		async content(event, trigger, player) {
			trigger.directHit.addArray(game.players);
			if (trigger.addCount !== false) {
				trigger.addCount = false;
				if (player.stat[player.stat.length - 1].card.sha > 0) {
					player.stat[player.stat.length - 1].card.sha--;
				}
			}
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "respondSha") && current < 0) {
						return 0.6;
					}
				},
			},
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				return arg.card.name == "sha" && get.suit(arg.card) == "heart";
			},
		},
	},
	wuhun: {
		audio: "wuhun2",
		trigger: { player: "die" },
		filter(event) {
			return event.source && event.source.isIn();
		},
		forced: true,
		forceDie: true,
		skillAnimation: true,
		animationColor: "soil",
		logTarget: "source",
		async content(event, trigger, player) {
			const num = trigger.source.getHp();
			if (num > 0) {
				await trigger.source.loseHp(num);
			}
		},
		ai: {
			threaten(player, target) {
				if (target.hp == 1) {
					if (player.getHp() <= 0) {
						return 100;
					}
					return 0.2;
				}
				return 0.8;
			},
			effect: {
				target(card, player, target, current) {
					if (player.getHp() <= 0) {
						return;
					}
					if (!target.hasFriend()) {
						return;
					}
					if (target.hp <= 1 && get.tag(card, "damage")) {
						return [1, 0, 0, -2 * player.getHp()];
					}
				},
			},
		},
	},
	guixin: {
		audio: 2,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return game.hasPlayer(cur => {
				return cur !== player && cur.countCards("hej") > 0;
			});
		},
		check(event, player) {
			if (player.isTurnedOver() || event.num > 1) {
				return true;
			}
			var num = game.countPlayer(function (current) {
				if (current.countCards("he") && current != player && get.attitude(player, current) <= 0) {
					return true;
				}
				if (current.countCards("j") && current != player && get.attitude(player, current) > 0) {
					return true;
				}
			});
			return num >= 2;
		},
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			let targets = game.filterPlayer(current => current != player).sortBySeat();
			player.line(targets, "green");
			await player.gainMultiple(targets, "hej");
			await player.turnOver();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			threaten(player, target) {
				if (target.hp == 1) {
					return 2.5;
				}
				return 0.5;
			},
			effect: {
				target(card, player, target) {
					if (
						!target._guixin_eff &&
						get.tag(card, "damage") &&
						target.hp >
						(player.hasSkillTag("damageBonus", true, {
							card: card,
							target: target,
						})
							? 2
							: 1)
					) {
						if (player.hasSkillTag("jueqing", false, target)) {
							return [1, -2];
						}
						target._guixin_eff = true;
						let gain = game.countPlayer(function (current) {
							if (target == current) {
								return 0;
							}
							if (get.attitude(target, current) > 0) {
								if (
									current.hasCard(
										cardx =>
											lib.filter.canBeGained(cardx, target, current, "guixin") &&
											get.effect(current, cardx, current, current) < 0,
										"ej"
									)
								) {
									return 1.3;
								}
								return 0;
							}
							if (
								current.hasCard(
									cardx =>
										lib.filter.canBeGained(cardx, target, current, "guixin") && get.effect(current, cardx, current, current) > 0,
									"ej"
								)
							) {
								return 1.1;
							}
							if (current.hasCard(cardx => lib.filter.canBeGained(cardx, target, current, "guixin"), "h")) {
								return 0.9;
							}
							return 0;
						});
						if (target.isTurnedOver()) {
							gain += 2.3;
						} else {
							gain -= 2.3;
						}
						delete target._guixin_eff;
						return [1, Math.max(0, gain)];
					}
				},
			},
		},
	},
	qixing: {
		audio: 2,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const getStars = player.addToExpansion(get.cards(7), "draw");
			getStars.gaintag.add("qixing");
			await getStars;

			// 下面内容直接复制的qixing2，仅ai做了改变
			const expansions = player.getExpansions("qixing");
			const cards = player.getCards("h");
			if (!expansions.length || !cards.length) {
				return;
			}

			const next = player.chooseToMove("七星：是否交换“星”和手牌？");
			next.set("list", [
				[`${get.translation(player)}（你）的星`, expansions],
				["手牌区", cards],
			]);
			next.set("filterMove", (from, to) => typeof to != "number");
			next.set("processAI", processAI);

			const result = await next.forResult();
			if (result.bool) {
				const pushs = result.moved[0];
				const gains = result.moved[1];
				pushs.removeArray(expansions);
				gains.removeArray(cards);
				if (!pushs.length || pushs.length !== gains.length) {
					return;
				}
				player.logSkill("qixing2");
				const addStars = player.addToExpansion(pushs, player, "giveAuto");
				addStars.gaintag.add("qixing");
				await addStars;
				await player.gain(gains, "draw");
			}

			return;

			/**
			 * @typedef {[string, Card[]]} MoveItem
			 * @typedef {MoveItem[]} MoveList
			 * @param {MoveList} list
			 * @return {[Card[], Card[]]}
			 */
			function processAI(list) {
				const player = get.player();

				const cards = list[0][1].concat(list[1][1]).sort((a, b) => get.useful(a) - get.useful(b));
				const cards2 = cards.splice(0, player.getExpansions("qixing").length);
				return [cards2, cards];
			}
		},
		intro: {
			markcount: "expansion",
			mark(dialog, content, player) {
				var content = player.getExpansions("qixing");
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addAuto(content);
					} else {
						return "共有" + get.cnNumber(content.length) + "张星";
					}
				}
			},
			content(content, player) {
				var content = player.getExpansions("qixing");
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						return get.translation(content);
					}
					return "共有" + get.cnNumber(content.length) + "张星";
				}
			},
		},
		group: ["qixing2"],
		ai: {
			notemp: true,
		},
	},
	qixing2: {
		trigger: { player: "phaseDrawAfter" },
		direct: true,
		sourceSkill: "qixing",
		filter(event, player) {
			return player.getExpansions("qixing").length > 0 && player.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const expansions = player.getExpansions("qixing");
			const cards = player.getCards("h");
			if (!expansions.length || !cards.length) {
				return;
			}

			const next = player.chooseToMove("七星：是否交换“星”和手牌？");
			next.set("list", [
				[`${get.translation(player)}（你）的星`, expansions],
				["手牌区", cards],
			]);
			next.set("filterMove", (from, to) => typeof to != "number");
			next.set("processAI", processAI);

			const result = await next.forResult();
			if (result.bool) {
				const pushs = result.moved[0];
				const gains = result.moved[1];
				pushs.removeArray(expansions);
				gains.removeArray(cards);
				if (!pushs.length || pushs.length !== gains.length) {
					return;
				}
				player.logSkill("qixing2");
				const addStars = player.addToExpansion(pushs, player, "giveAuto");
				addStars.gaintag.add("qixing");
				await addStars;
				await player.gain(gains, "draw");
			}

			return;

			/**
			 * @typedef {[string, Card[]]} MoveItem
			 * @typedef {MoveItem[]} MoveList
			 * @param {MoveList} list
			 * @return {[Card[], Card[]]}
			 */
			function processAI(list) {
				const player = get.player();

				const cards = list[0][1].concat(list[1][1]).sort((a, b) => get.value(a) - get.value(b));
				const cards2 = cards.splice(0, player.getExpansions("qixing").length);
				return [cards2, cards];
			}
		},
	},
	dawu: {
		trigger: { player: "phaseJieshuBegin" },
		filter(event, player) {
			return player.getExpansions("qixing").length;
		},
		audio: 2,
		async cost(event, trigger, player) {
			const {
				bool,
				targets,
				links: cost_data,
			} = await player
				.chooseButtonTarget({
					createDialog: [get.prompt2(event.skill), player.getExpansions("qixing")],
					selectButton: [1, game.countPlayer()],
					filterTarget: true,
					selectTarget() {
						return ui.selected.buttons.length;
					},
					complexSelect: true,
					ai1(button) {
						const { player, allUse } = get.event();
						const targets = game.filterPlayer(target => {
							if (target.isMin() || target.hasSkill("biantian2") || target.hasSkill("dawu2")) {
								return false;
							}
							let att = get.attitude(player, target);
							if (att >= 4) {
								if (target.hp > 2 && (target.isHealthy() || target.hasSkillTag("maixie"))) {
									return false;
								}
								if (allUse || target.hp == 1) {
									return true;
								}
								if (target.hp == 2 && target.countCards("he") <= 2) {
									return true;
								}
							}
							return false;
						});
						if (ui.selected.buttons.length < targets.length) {
							return 1;
						}
						return 0;
					},
					ai2(target) {
						const { player, allUse } = get.event();
						if (target.isMin() || target.hasSkill("biantian2") || target.hasSkill("dawu2")) {
							return 0;
						}
						let att = get.attitude(player, target);
						if (att >= 4) {
							if (target.hp > 2 && (target.isHealthy() || target.hasSkillTag("maixie"))) {
								return 0;
							}
							if (allUse || target.hp == 1) {
								return att;
							}
							if (target.hp == 2 && target.countCards("he") <= 2) {
								return att * 0.7;
							}
							return 0;
						}
						return -1;
					},
				})
				.set("allUse", player.getExpansions("qixing").length >= game.countPlayer(current => get.attitude(player, current) > 4) * 2)
				.forResult();
			event.result = {
				bool: bool,
				targets: targets?.sortBySeat(),
				cost_data: cost_data,
			};
		},
		async content(event, trigger, player) {
			const { targets, cost_data: cards } = event;
			targets.forEach(target => {
				target.addAdditionalSkill(`dawu_${player.playerid}`, "dawu2");
				target.markAuto("dawu2", [player]);
			});
			player.addTempSkill("dawu3", { player: "phaseBeginStart" });
			await player.loseToDiscardpile(cards);
		},
		ai: {
			combo: "qixing",
		},
	},
	dawu2: {
		charlotte: true,
		ai: {
			nofire: true,
			nodamage: true,
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "damage") && !get.tag(card, "thunderDamage")) {
						return "zeroplayertarget";
					}
				},
			},
		},
		intro: {
			content(storage) {
				return `共有${storage.length}枚标记`;
			},
		},
	},
	dawu3: {
		trigger: { global: "damageBegin4" },
		sourceSkill: "dawu",
		filter(event, player) {
			return !event.hasNature("thunder") && event.player.getStorage("dawu2").includes(player);
		},
		forced: true,
		charlotte: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.cancel();
		},
		onremove(player) {
			game.countPlayer2(current => {
				if (current.getStorage("dawu2").includes(player)) {
					current.unmarkAuto("dawu2", [player]);
					current.removeAdditionalSkill(`dawu_${player.playerid}`);
				}
			}, true);
		},
	},
	kuangfeng: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		filter(event, player) {
			return player.getExpansions("qixing").length;
		},
		async cost(event, trigger, player) {
			const {
				bool,
				targets,
				links: cost_data,
			} = await player
				.chooseButtonTarget({
					createDialog: [get.prompt2(event.skill), player.getExpansions("qixing")],
					selectButton: 1,
					filterTarget: true,
					ai1(button) {
						if (
							game.hasPlayer(target => {
								return get.attitude(get.player(), target) < 0;
							})
						) {
							return 1;
						}
						return 0;
					},
					ai2(target) {
						return -get.attitude(get.player(), target);
					},
				})
				.forResult();
			event.result = {
				bool: bool,
				targets: targets?.sortBySeat(),
				cost_data: cost_data,
			};
		},
		async content(event, trigger, player) {
			const { targets, cost_data: cards } = event;
			targets.forEach(target => {
				target.addAdditionalSkill(`kuangfeng_${player.playerid}`, "kuangfeng2");
				target.markAuto("kuangfeng2", [player]);
			});
			player.addTempSkill("kuangfeng3", { player: "phaseBeginStart" });
			await player.loseToDiscardpile(cards);
		},
		ai: {
			combo: "qixing",
		},
	},
	kuangfeng2: {
		charlotte: true,
		intro: {
			content(storage) {
				return `共有${storage.length}枚标记`;
			},
		},
		ai: {
			effect: {
				target(card, player, target, current) {
					if (get.tag(card, "fireDamage") && current < 0) {
						return 1.5;
					}
				},
			},
		},
	},
	kuangfeng3: {
		trigger: { global: "damageBegin3" },
		sourceSkill: "kuangfeng",
		filter(event, player) {
			return event.hasNature("fire") && event.player.getStorage("kuangfeng2").includes(player);
		},
		charlotte: true,
		forced: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.num++;
		},
		onremove(player) {
			game.countPlayer2(current => {
				if (current.getStorage("kuangfeng2").includes(player)) {
					current.unmarkAuto("kuangfeng2", player);
					current.removeAdditionalSkill(`kuangfeng_${player.playerid}`);
				}
			}, true);
		},
	},
	yeyan: {
		limited: true,
		audio: 2,
		enable: "phaseUse",
		filterCard(card, player) {
			return !ui.selected.cards.some(cardx => get.suit(cardx, player) == get.suit(card, player));
		},
		selectCard: [0, 4],
		filterTarget(card, player, target) {
			var length = ui.selected.cards.length;
			return length == 0 || length == 4;
		},
		selectTarget() {
			if (ui.selected.cards.length == 4) {
				return [1, 2];
			}
			if (ui.selected.cards.length == 0) {
				return [1, 3];
			}
			game.uncheck("target");
			return [1, 3];
		},
		complexCard: true,
		complexSelect: true,
		line: "fire",
		forceDie: true,
		animationColor: "metal",
		skillAnimation: "legend",
		check(card) {
			if (!lib.skill.yeyan.getBigFire(get.event().player)) {
				return -1;
			}
			return 1 / (get.value(card) || 0.5);
		},
		multitarget: true,
		multiline: true,
		async contentBefore(event, trigger, player) {
			player.awakenSkill(event.skill);
		},
		async content(event, trigger, player) {
			const { cards, targets } = event;

			if (cards.length !== 4) {
				await game.doAsyncInOrder(targets, target =>
					target.damage({
						num: 1,
						nature: "fire",
						nocard: true,
					})
				);
				return;
			}

			await player.loseHp(3);

			if (targets.length === 1) {
				const result = await player
					.chooseControl("2点", "3点")
					.set("prompt", "请选择伤害点数")
					.set("ai", () => "3点")
					.set("forceDie", true)
					.forResult();

				await targets[0].damage({
					num: result.control === "2点" ? 2 : 3,
					nature: "fire",
					nocard: true
				});
			} else {
				const result = await player
					.chooseTarget("请选择受到2点伤害的角色", true, (card, player, target) => {
						return get.event().targets.includes(target);
					})
					.set("ai", () => 1)
					.set("forceDie", true)
					.set("targets", targets)
					.forResult();

				const target2 = result.targets[0];
				targets.sortBySeat();
				for (const target of targets) {
					let damageNum = 1;
					if (target === target2) {
						damageNum = 2;
					}
					await target.damage({
						num: damageNum,
						nature: "fire",
						nocard: true,
					});
				}
			}
		},
		ai: {
			order(item, player) {
				return lib.skill.yeyan.getBigFire(player) ? 10 : 1;
			},
			fireAttack: true,
			result: {
				target(player, target) {
					if (player.hasUnknown()) {
						return 0;
					}
					const att = get.sgn(get.attitude(player, target));
					const targets = game.filterPlayer(
						target =>
							get.damageEffect(target, player, player, "fire") &&
							(!lib.skill.yeyan.getBigFire(player) || (target.hp <= 3 && !target.hasSkillTag("filterDamage", null, { player: player })))
					);
					if (!targets.includes(target)) {
						return 0;
					}
					if (lib.skill.yeyan.getBigFire(player)) {
						if (ui.selected.targets.length) {
							return 0;
						}
						if (!(targets.length == 1 || (att < 0 && target.identity && target.identity.indexOf("zhu") != -1))) {
							return 0;
						}
					}
					return att * get.damageEffect(target, player, player, "fire");
				},
			},
		},
		getBigFire(player) {
			if (player.getDiscardableCards(player, "h").reduce((list, card) => list.add(get.suit(card, player)), []).length < 4) {
				return false;
			}
			const targets = game.filterPlayer(
				target =>
					get.damageEffect(target, player, player, "fire") &&
					target.hp <= 3 &&
					!target.hasSkillTag("filterDamage", null, { player: player })
			);
			if (!targets.length) {
				return false;
			}
			if (
				targets.length == 1 ||
				targets.some(target => get.attitude(player, target) < 0 && target.identity && target.identity.indexOf("zhu") != -1)
			) {
				let suits = player.getDiscardableCards(player, "h").reduce((map, card) => {
					const suit = get.suit(card, player);
					if (!map[suit]) {
						map[suit] = [];
					}
					return map;
				}, {}),
					cards = [];
				Object.keys(suits).forEach(i => {
					suits[i].addArray(player.getDiscardableCards(player, "h").filter(card => get.suit(card) == i));
					cards.add(suits[i].sort((a, b) => get.value(a) - get.value(b))[0]);
				});
				return player.hp + player.countCards("h", card => !cards.includes(card) && player.canSaveCard(card, player)) - 3 > 0;
			}
			return false;
		},
	},
	longhun: {
		audio: 4,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || !player.isPhaseUsing() || player.needsToDiscard() < 2) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num - 3.6;
				}
			},
			aiValue(player, card, num) {
				if (num <= 0) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num + 3.6;
				}
				if (suit === "club") {
					return num + 1;
				}
				if (suit === "spade") {
					return num + 1.8;
				}
			},
			aiUseful(player, card, num) {
				if (num <= 0) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num + 3;
				}
				if (suit === "club") {
					return num + 1;
				}
				if (suit === "spade") {
					return num + 1;
				}
			},
		},
		locked: false,
		group: ["longhun1", "longhun2", "longhun3", "longhun4"],
		ai: {
			fireAttack: true,
			skillTagFilter(player, tag) {
				switch (tag) {
					case "respondSha": {
						if (player.countCards("he", { suit: "diamond" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					case "respondShan": {
						if (player.countCards("he", { suit: "club" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					case "save": {
						if (player.countCards("he", { suit: "heart" }) < Math.max(1, player.hp)) {
							return false;
						}
						break;
					}
					default:
						return true;
				}
			},
			maixie: true,
			respondSha: true,
			respondShan: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "recover") && target.hp >= 1) {
						return [0, 0];
					}
					if (!target.hasFriend()) {
						return;
					}
					if ((get.tag(card, "damage") == 1 || get.tag(card, "loseHp")) && target.hp > 1) {
						return [0, 1];
					}
				},
			},
			threaten(player, target) {
				if (target.hp == 1) {
					return 2;
				}
				return 0.5;
			},
		},
	},
	longhun1: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张红桃牌当作桃使用";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "tao" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "heart" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "heart";
		},
	},
	longhun2: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张方片当作火杀使用或打出";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "sha", nature: "fire" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "diamond" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "diamond";
		},
	},
	longhun3: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张黑桃牌当作无懈可击使用";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 7 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAs: { name: "wuxie" },
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "spade" }) >= player.hp;
		},
		filterCard(card) {
			return get.suit(card) == "spade";
		},
	},
	longhun4: {
		audio: true,
		enable: ["chooseToUse", "chooseToRespond"],
		sourceSkill: "longhun",
		prompt() {
			return "将" + get.cnNumber(Math.max(1, _status.event.player.hp)) + "张梅花牌当作闪使用或打出";
		},
		position: "hes",
		check(card, event) {
			if (_status.event.player.hp > 1) {
				return 0;
			}
			return 10 - get.value(card);
		},
		selectCard() {
			return Math.max(1, _status.event.player.hp);
		},
		viewAsFilter(player) {
			return player.countCards("hes", { suit: "club" }) >= player.hp;
		},
		viewAs: { name: "shan" },
		filterCard(card) {
			return get.suit(card) == "club";
		},
	},
	juejing: {
		mod: {
			maxHandcard(player, num) {
				return 2 + num;
			},
			aiOrder(player, card, num) {
				if (num <= 0 || !player.isPhaseUsing() || !get.tag(card, "recover")) {
					return num;
				}
				if (player.needsToDiscard() > 1) {
					return num;
				}
				return 0;
			},
		},
		audio: true,
		trigger: { player: "phaseDrawBegin2" },
		//priority:-5,
		filter(event, player) {
			return !event.numFixed && player.hp < player.maxHp;
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.num += player.getDamagedHp();
		},
	},
	relonghun: {
		audio: 2,
		mod: {
			aiOrder(player, card, num) {
				if (num <= 0 || !player.isPhaseUsing() || player.needsToDiscard() < 2) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num - 3.6;
				}
			},
			aiValue(player, card, num) {
				if (num <= 0) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num + 3.6;
				}
				if (suit === "club") {
					return num + 1;
				}
				if (suit === "spade") {
					return num + 1.8;
				}
			},
			aiUseful(player, card, num) {
				if (num <= 0) {
					return num;
				}
				let suit = get.suit(card, player);
				if (suit === "heart") {
					return num + 3;
				}
				if (suit === "club") {
					return num + 1;
				}
				if (suit === "spade") {
					return num + 1;
				}
			},
		},
		locked: false,
		//技能发动时机
		enable: ["chooseToUse", "chooseToRespond"],
		//发动时提示的技能描述
		prompt: "将♦牌当做杀，♥牌当做桃，♣牌当做闪，♠牌当做无懈可击使用或打出",
		//动态的viewAs
		viewAs(cards, player) {
			if (cards.length) {
				var name = false,
					nature = null;
				//根据选择的卡牌的花色 判断要转化出的卡牌是闪还是火杀还是无懈还是桃
				switch (get.suit(cards[0], player)) {
					case "club":
						name = "shan";
						break;
					case "diamond":
						name = "sha";
						nature = "fire";
						break;
					case "spade":
						name = "wuxie";
						break;
					case "heart":
						name = "tao";
						break;
				}
				//返回判断结果
				if (name) {
					return { name: name, nature: nature };
				}
			}
			return null;
		},
		//AI选牌思路
		check(card) {
			if (ui.selected.cards.length) {
				return 0;
			}
			var player = _status.event.player;
			if (_status.event.type == "phase") {
				var max = 0;
				var name2;
				var list = ["sha", "tao"];
				var map = { sha: "diamond", tao: "heart" };
				for (var i = 0; i < list.length; i++) {
					var name = list[i];
					if (
						player.countCards("hes", function (card) {
							return (name != "sha" || get.value(card) < 5) && get.suit(card, player) == map[name];
						}) > 0 &&
						player.getUseValue({ name: name, nature: name == "sha" ? "fire" : null }) > 0
					) {
						var temp = get.order({ name: name, nature: name == "sha" ? "fire" : null });
						if (temp > max) {
							max = temp;
							name2 = map[name];
						}
					}
				}
				if (name2 == get.suit(card, player)) {
					return name2 == "diamond" ? 5 - get.value(card) : 20 - get.value(card);
				}
				return 0;
			}
			return 1;
		},
		//选牌数量
		selectCard: [1, 2],
		//确保选择第一张牌后 重新检测第二张牌的合法性 避免选择两张花色不同的牌
		complexCard: true,
		//选牌范围：手牌区和装备区和木马
		position: "hes",
		//选牌合法性判断
		filterCard(card, player, event) {
			//如果已经选了一张牌 那么第二张牌和第一张花色相同即可
			if (ui.selected.cards.length) {
				return get.suit(card, player) == get.suit(ui.selected.cards[0], player);
			}
			event = event || _status.event;
			//获取当前时机的卡牌选择限制
			var filter = event._backup.filterCard;
			//获取卡牌花色
			var name = get.suit(card, player);
			//如果这张牌是梅花并且当前时机能够使用/打出闪 那么这张牌可以选择
			if (name == "club" && filter(get.autoViewAs({ name: "shan" }, "unsure"), player, event)) {
				return true;
			}
			//如果这张牌是方片并且当前时机能够使用/打出火杀 那么这张牌可以选择
			if (name == "diamond" && filter(get.autoViewAs({ name: "sha", nature: "fire" }, "unsure"), player, event)) {
				return true;
			}
			//如果这张牌是黑桃并且当前时机能够使用/打出无懈 那么这张牌可以选择
			if (name == "spade" && filter(get.autoViewAs({ name: "wuxie" }, "unsure"), player, event)) {
				return true;
			}
			//如果这张牌是红桃并且当前时机能够使用/打出桃 那么这张牌可以选择
			if (name == "heart" && filter(get.autoViewAs({ name: "tao" }, "unsure"), player, event)) {
				return true;
			}
			//上述条件都不满足 那么就不能选择这张牌
			return false;
		},
		//判断当前时机能否发动技能
		filter(event, player) {
			//获取当前时机的卡牌选择限制
			var filter = event.filterCard;
			//如果当前时机能够使用/打出火杀并且角色有方片 那么可以发动技能
			if (filter(get.autoViewAs({ name: "sha", nature: "fire" }, "unsure"), player, event) && player.countCards("hes", { suit: "diamond" })) {
				return true;
			}
			//如果当前时机能够使用/打出闪并且角色有梅花 那么可以发动技能
			if (filter(get.autoViewAs({ name: "shan" }, "unsure"), player, event) && player.countCards("hes", { suit: "club" })) {
				return true;
			}
			//如果当前时机能够使用/打出桃并且角色有红桃 那么可以发动技能
			if (filter(get.autoViewAs({ name: "tao" }, "unsure"), player, event) && player.countCards("hes", { suit: "heart" })) {
				return true;
			}
			//如果当前时机能够使用/打出无懈可击并且角色有黑桃 那么可以发动技能
			if (filter(get.autoViewAs({ name: "wuxie" }, "unsure"), player, event) && player.countCards("hes", { suit: "spade" })) {
				return true;
			}
			return false;
		},
		ai: {
			respondSha: true,
			respondShan: true,
			//让系统知道角色“有杀”“有闪”
			skillTagFilter(player, tag) {
				var name;
				switch (tag) {
					case "respondSha":
						name = "diamond";
						break;
					case "respondShan":
						name = "club";
						break;
					case "save":
						name = "heart";
						break;
				}
				if (!player.countCards("hes", { suit: name })) {
					return false;
				}
			},
			//AI牌序
			order(item, player) {
				if (player && _status.event.type == "phase") {
					var max = 0;
					var list = ["sha", "tao"];
					var map = { sha: "diamond", tao: "heart" };
					for (var i = 0; i < list.length; i++) {
						var name = list[i];
						if (
							player.countCards("hes", function (card) {
								return (name != "sha" || get.value(card) < 5) && get.suit(card, player) == map[name];
							}) > 0 &&
							player.getUseValue({
								name: name,
								nature: name == "sha" ? "fire" : null,
							}) > 0
						) {
							var temp = get.order({
								name: name,
								nature: name == "sha" ? "fire" : null,
							});
							if (temp > max) {
								max = temp;
							}
						}
					}
					max /= 1.1;
					return max;
				}
				return 2;
			},
		},
		//让系统知道玩家“有无懈”“有桃”
		hiddenCard(player, name) {
			if (name == "wuxie" && _status.connectMode && player.countCards("hs") > 0) {
				return true;
			}
			if (name == "wuxie") {
				return player.countCards("hes", { suit: "spade" }) > 0;
			}
			if (name == "tao") {
				return player.countCards("hes", { suit: "heart" }) > 0;
			}
		},
		group: ["relonghun_num", "relonghun_discard"],
		subSkill: {
			num: {
				trigger: { player: "useCard" },
				forced: true,
				popup: false,
				filter(event) {
					var evt = event;
					return ["sha", "tao"].includes(evt.card.name) && evt.skill == "relonghun" && evt.cards && evt.cards.length == 2;
				},
				async content(event, trigger, player) {
					trigger.baseDamage++;
				},
			},
			discard: {
				trigger: { player: ["useCardAfter", "respondAfter"] },
				forced: true,
				popup: false,
				logTarget() {
					return _status.currentPhase;
				},
				autodelay(event) {
					return event.name == "respond" ? 0.5 : false;
				},
				filter(evt, player) {
					return (
						["shan", "wuxie"].includes(evt.card.name) &&
						evt.skill == "relonghun" &&
						evt.cards &&
						evt.cards.length == 2 &&
						_status.currentPhase &&
						_status.currentPhase != player &&
						_status.currentPhase.countDiscardableCards(player, "he")
					);
				},
				async content(event, trigger, player) {
					//game.log(trigger.card)
					//game.log(trigger.cards)
					player.line(_status.currentPhase, "green");
					await player.discardPlayerCard(_status.currentPhase, "he", true);
				},
			},
		},
	},
	xinjuejing: {
		mod: {
			maxHandcard(player, num) {
				return 2 + num;
			},
			aiOrder(player, card, num) {
				if (num <= 0 || !player.isPhaseUsing() || !get.tag(card, "recover")) {
					return num;
				}
				if (player.needsToDiscard() > 1) {
					return num;
				}
				return 0;
			},
		},
		audio: 2,
		trigger: { player: ["dying", "dyingAfter"] },
		forced: true,
		async content(event, trigger, player) {
			await player.draw();
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (target.getHp() > 1) {
						return;
					}
					if (get.tag(card, "damage") || get.tag(card, "loseHp")) {
						return [1, 1];
					}
				},
			},
		},
	},
	shelie: {
		audio: 2,
		trigger: { player: "phaseDrawBegin1" },
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.changeToZero();
			const cards = get.cards(5, true);
			await player.showCards(cards, `${get.translation(player)}发动了【${get.translation(event.name)}】`, true).set("clearArena", false);
			const list = cards.map(card => get.suit(card)).unique();
			const result = await player
				.chooseCardButton(`涉猎：获取花色各不相同的牌`, cards, list.length, true)
				.set("filterButton", function (button) {
					for (let i = 0; i < ui.selected.buttons.length; i++) {
						if (get.suit(ui.selected.buttons[i].link) == get.suit(button.link)) {
							return false;
						}
					}
					return true;
				})
				.set("ai", function (button) {
					return get.value(button.link, _status.event.player);
				})
				.forResult();
			game.broadcastAll(ui.clear);
			if (result?.links?.length) {
				await player.gain(result.links, "gain2");
			}
		},
		ai: {
			threaten: 1.2,
		},
	},
	gongxin: {
		audio: 2,
		audioname: ["re_lvmeng"],
		audioname2: { gexuan: "gongxin_gexuan" },
		enable: "phaseUse",
		usable: 1,
		filterTarget(card, player, target) {
			return target != player && target.countCards("h");
		},
		async content(event, trigger, player) {
			const { target } = event;
			const cards = target.getCards("h");
			const result = await player
				.chooseToMove_new("攻心")
				.set("list", [
					[get.translation(target) + "的手牌", cards],
					[["弃置"], ["置于牌堆顶"]],
				])
				.set("filterOk", moved => {
					return (
						moved[1]
							.slice()
							.concat(moved[2])
							.filter(card => get.suit(card) == "heart").length == 1
					);
				})
				.set("filterMove", (from, to, moved) => {
					if (moved[0].includes(from.link) && moved[1].length + moved[2].length >= 1 && [1, 2].includes(to)) {
						return false;
					}
					return get.suit(from) == "heart";
				})
				.set("processAI", list => {
					let card = list[0][1]
						.slice()
						.filter(card => {
							return get.suit(card) == "heart";
						})
						.sort((a, b) => {
							return get.value(b) - get.value(a);
						})[0];
					if (!card) {
						return false;
					}
					return [list[0][1].slice().remove(card), [card], []];
				})
				.forResult();
			if (result.bool) {
				if (result.moved[1].length) {
					await target.discard(result.moved[1]);
				} else {
					await player.showCards(result.moved[2], get.translation(player) + "对" + get.translation(target) + "发动了【攻心】");
					await target.lose(result.moved[2], ui.cardPile, "visible", "insert");
				}
			}
		},
		ai: {
			threaten: 1.5,
			result: {
				target(player, target) {
					return -target.countCards("h");
				},
			},
			order: 10,
			expose: 0.4,
		},
	},
};

export default skills;
