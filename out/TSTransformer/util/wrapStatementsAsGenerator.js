"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapStatementsAsGenerator = wrapStatementsAsGenerator;
const luau_ast_1 = __importDefault(require("@roblox-ts/luau-ast"));
function wrapStatementsAsGenerator(state, node, statements, hasDotDotDot) {
    const list = luau_ast_1.default.list.make();
    if (hasDotDotDot) {
        const statement = luau_ast_1.default.list.shift(statements);
        luau_ast_1.default.list.push(list, statement);
    }
    luau_ast_1.default.list.push(list, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.ReturnStatement, {
        expression: luau_ast_1.default.call(state.TS(node, "generator"), [
            luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.FunctionExpression, {
                hasDotDotDot: false,
                parameters: luau_ast_1.default.list.make(),
                statements,
            }),
        ]),
    }));
    return list;
}
//# sourceMappingURL=wrapStatementsAsGenerator.js.map