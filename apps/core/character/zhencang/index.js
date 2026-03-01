import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import skills from "./skill.js";
import translates from "./translate.js";
import { characterSort, characterSortTranslate } from "./sort.js";
import voices from "./voices.js";

game.import("character", function () {
	return {
		name: "zhencang",
		connect: true,
		character: { ...characters },
		characterSort: {
			zhencang: characterSort,
		},
		skill: { ...skills },
		translate: { ...translates, ...voices, ...characterSortTranslate },
	};
});
