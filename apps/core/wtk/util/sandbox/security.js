// 声明：沙盒维护的是服务器秩序，让服务器秩序不会因为非房主的玩家以及旁观者的影响，并在此基础上维护玩家设备不受危险代码攻击
// 但沙盒不会也没有办法维护恶意服务器/房主对于游戏规则的破坏，请玩家尽量选择官方或其他安全的服务器，同时选择一个受信任的玩家作为房主

// 声明导入类
/** @type {typeof import("./sandbox.js").AccessAction} */
let AccessAction
/** @type {typeof import("./sandbox.js").Domain} */
let Domain
/** @type {typeof import("./sandbox.js").Marshal} */
let Marshal
/** @type {typeof import("./sandbox.js").Monitor} */
let Monitor
/** @type {typeof import("./sandbox.js").Rule} */
let Rule
/** @type {typeof import("./sandbox.js").Sandbox} */
let Sandbox

/** @typedef {import("./sandbox.js").AccessAction} AccessAction */
/** @typedef {import("./sandbox.js").Domain} Domain */
/** @typedef {import("./sandbox.js").Marshal} Marshal */
/** @typedef {import("./sandbox.js").Monitor} Monitor */
/** @typedef {import("./sandbox.js").Rule} Rule */
/** @typedef {import("./sandbox.js").Sandbox} Sandbox */

// wtk 顶级变量
/** @type {Object<string|symbol, any>} */
const topVariables = {
  lib: null,
  game: null,
  ui: null,
  get: null,
  ai: null,
  _status: null,
}

/**
 * @param {Object?} obj
 */
function isPrimitive(obj) {
  return Object(obj) !== obj
}

/**
 * ```plain
 * 简单的、不带上下文的模拟eval函数
 *
 * 自动根据沙盒的启用状态使用不同的实现
 * ```
 *
 * @param {any} x
 * @returns {any}
 */
function _eval(x) {
  new Function(x)
  const topVars = Object.assign({}, topVariables)
  const vars = `_${Math.random().toString(36).slice(2)}`
  return new Function(vars, `with(${vars}){${x}}`)(topVars)
}

/**
 * ```plain
 * 携带简单上下文的eval函数
 *
 * 自动根据沙盒的启用状态使用不同的实现
 * ```
 *
 * @param {any} x
 * @param {Object} scope
 * @returns {any}
 */
function _exec(x, scope = {}) {
  if (isPrimitive(scope)) {
    scope = {}
  }

  new Function(x)
  const topVars = Object.assign({}, topVariables)
  const vars = `__vars_${Math.random().toString(36).slice(2)}`
  const name = `__scope_${Math.random().toString(36).slice(2)}`
  return new Function(vars, name, `with(${vars}){with(${name}){${x}}}`)(
    topVars,
    scope,
  )
}

/**
 * ```plain
 * 携带简单上下文的eval函数，并返回scope
 * eval代码的返回值将覆盖 `scope.return` 这个属性
 * 另外任意因对未定义变量赋值导致全局变量赋值的行为将被转移到scope里面
 * （替代eval的对策函数，具体看下面的例子）
 *
 * 自动根据沙盒的启用状态使用不同的实现
 *
 * 下面是 `security.exec2` 的使用示例:
 * ```
 * @example
 * ```javascript
 * // 执行一段代码并获取赋值的多个变量
 * let { return: skill, filter, content } = security.exec2(`
 *     filter = (e, p) => e.source && e.source == p;
 *     content = async (e, t, p) => t.cancel();
 *     return { filter, content };
 * `, { content: () => {}, lib, game, ui, get, ai, _status, }); // 提供默认的content，提供六个变量
 * ```
 *
 * @param {any} x
 * @param {Object|"window"} scope 传入一个对象作为上下文，或者传入 "window" 来生成一个包含指向自身的 `window` 属性的对象
 * @returns {Object}
 */
function _exec2(x, scope = {}) {
  if (scope === "window") {
    scope = {}
    scope.window = scope
  } else if (isPrimitive(scope)) {
    scope = {}
  }

  // 进行语法检查
  new Function(x)

  // 构造拦截器
  const intercepter = new Proxy(scope, {
    get(target, prop, receiver) {
      if (prop === Symbol.unscopables) {
        return undefined
      }

      if (!Reflect.has(target, prop) && !Reflect.has(window, prop)) {
        throw new ReferenceError(`"${String(prop)}" is not defined`)
      }

      return (
        Reflect.get(target, prop, receiver) ||
        topVariables[prop] ||
        window[prop]
      )
    },
    has(target, prop) {
      return true
    },
  })

  const result = new Function(
    "_",
    `with(_){return(()=>{"use strict";\n${x}})()}`,
  )(intercepter)
  scope.return = result
  return scope
}

/**
 * ```plain
 * 初始化模块
 * ```
 */
async function initSecurity({ lib, game, ui, get, ai, _status }) {
  topVariables.lib = lib
  topVariables.game = game
  topVariables.ui = ui
  topVariables.get = get
  topVariables.ai = ai
  topVariables._status = _status

  return
}

export const security = {
  initSecurity,
  eval: _eval,
  exec: _exec,
  exec2: _exec2,
}

Object.freeze(security)
