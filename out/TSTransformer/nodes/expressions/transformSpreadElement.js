"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSpreadElement = transformSpreadElement;
exports.transformSpreadElementNoCheck = transformSpreadElementNoCheck;
const luau_ast_1 = __importDefault(require("@roblox-ts/luau-ast"));
const diagnostics_1 = require("../../../Shared/diagnostics");
const assert_1 = require("../../../Shared/util/assert");
const DiagnosticService_1 = require("../../classes/DiagnosticService");
const transformExpression_1 = require("./transformExpression");
const getAddIterableToArrayBuilder_1 = require("../../util/getAddIterableToArrayBuilder");
const types_1 = require("../../util/types");
const validateNotAny_1 = require("../../util/validateNotAny");
const varArgsOptimization_1 = require("../../util/varArgsOptimization");
const typescript_1 = __importDefault(require("typescript"));
function simplifyUnpackOfArray(expression) {
    if (!luau_ast_1.default.isArray(expression))
        return;
    const { members } = expression;
    if (members.head === undefined)
        return;
    if (members.head === members.tail) {
        return members.head.value;
    }
}
function transformSpreadElement(state, node) {
    (0, validateNotAny_1.validateNotAnyType)(state, node.expression);
    const list = typescript_1.default.isArrayLiteralExpression(node.parent) ? node.parent.elements : node.parent.arguments;
    (0, assert_1.assert)(list);
    if (list[list.length - 1] !== node) {
        DiagnosticService_1.DiagnosticService.addDiagnostic(diagnostics_1.errors.noPrecedingSpreadElement(node));
    }
    return transformSpreadElementNoCheck(state, node);
}
function transformSpreadElementNoCheck(state, node) {
    var _a, _b;
    const expression = (0, transformExpression_1.transformExpression)(state, node.expression);
    const type = state.getType(node.expression);
    if ((0, types_1.isDefinitelyType)(type, (0, types_1.isArrayType)(state))) {
        return ((_b = (_a = (0, varArgsOptimization_1.tryHandleVarArgsArraySpread)(state, node)) !== null && _a !== void 0 ? _a : simplifyUnpackOfArray(expression)) !== null && _b !== void 0 ? _b : luau_ast_1.default.call(luau_ast_1.default.globals.unpack, [expression]));
    }
    else {
        const addIterableToArrayBuilder = (0, getAddIterableToArrayBuilder_1.getAddIterableToArrayBuilder)(state, node.expression, type);
        const arrayId = state.pushToVar(luau_ast_1.default.array(), "array");
        const lengthId = state.pushToVar(luau_ast_1.default.number(0), "length");
        state.prereqList(addIterableToArrayBuilder(state, expression, arrayId, lengthId, 0, false));
        return luau_ast_1.default.call(luau_ast_1.default.globals.unpack, [arrayId]);
    }
}
//# sourceMappingURL=transformSpreadElement.js.map