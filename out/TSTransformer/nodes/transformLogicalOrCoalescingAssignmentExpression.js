"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformLogicalOrCoalescingAssignmentExpression = transformLogicalOrCoalescingAssignmentExpression;
exports.transformLogicalOrCoalescingAssignmentExpressionStatement = transformLogicalOrCoalescingAssignmentExpressionStatement;
const luau_ast_1 = __importDefault(require("@roblox-ts/luau-ast"));
const transformExpression_1 = require("./expressions/transformExpression");
const transformWritable_1 = require("./transformWritable");
const createTruthinessChecks_1 = require("../util/createTruthinessChecks");
const types_1 = require("../util/types");
const typescript_1 = __importStar(require("typescript"));
function optimizedExpression(state, writable, value, operator) {
    if (luau_ast_1.default.isAnyIdentifier(writable)) {
        state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
            left: writable,
            operator: "=",
            right: luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.BinaryExpression, {
                left: writable,
                operator,
                right: value,
            }),
        }));
        return writable;
    }
}
function transformCoalescingAssignmentExpression(state, left, right) {
    const writable = (0, transformWritable_1.transformWritableExpression)(state, left, true);
    const [value, valuePreqreqs] = state.capture(() => (0, transformExpression_1.transformExpression)(state, right));
    if ((0, typescript_1.isIdentifier)(left) && !(0, types_1.isPossiblyType)(state.getType(left), (0, types_1.isBooleanLiteralType)(state, false))) {
        const optimized = optimizedExpression(state, writable, value, "or");
        if (optimized)
            return optimized;
    }
    const ifStatements = luau_ast_1.default.list.make();
    luau_ast_1.default.list.pushList(ifStatements, valuePreqreqs);
    luau_ast_1.default.list.push(ifStatements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
        left: writable,
        operator: "=",
        right: value,
    }));
    state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.IfStatement, {
        condition: luau_ast_1.default.binary(writable, "==", luau_ast_1.default.nil()),
        statements: ifStatements,
        elseBody: luau_ast_1.default.list.make(),
    }));
    return writable;
}
function transformLogicalAndAssignmentExpression(state, left, right) {
    const writable = (0, transformWritable_1.transformWritableExpression)(state, left, true);
    const [value, valuePreqreqs] = state.capture(() => (0, transformExpression_1.transformExpression)(state, right));
    const optimized = optimizedExpression(state, writable, value, "and");
    if (optimized)
        return optimized;
    const conditionId = state.pushToVar(writable, "condition");
    const ifStatements = luau_ast_1.default.list.make();
    luau_ast_1.default.list.pushList(ifStatements, valuePreqreqs);
    luau_ast_1.default.list.push(ifStatements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
        left: conditionId,
        operator: "=",
        right: value,
    }));
    state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.IfStatement, {
        condition: (0, createTruthinessChecks_1.createTruthinessChecks)(state, writable, left),
        statements: ifStatements,
        elseBody: luau_ast_1.default.list.make(),
    }));
    state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
        left: writable,
        operator: "=",
        right: conditionId,
    }));
    return writable;
}
function transformLogicalOrAssignmentExpression(state, left, right) {
    const writable = (0, transformWritable_1.transformWritableExpression)(state, left, true);
    const [value, valuePreqreqs] = state.capture(() => (0, transformExpression_1.transformExpression)(state, right));
    const optimized = optimizedExpression(state, writable, value, "or");
    if (optimized)
        return optimized;
    const conditionId = state.pushToVar(writable, "condition");
    const ifStatements = luau_ast_1.default.list.make();
    luau_ast_1.default.list.pushList(ifStatements, valuePreqreqs);
    luau_ast_1.default.list.push(ifStatements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
        left: conditionId,
        operator: "=",
        right: value,
    }));
    state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.IfStatement, {
        condition: luau_ast_1.default.unary("not", (0, createTruthinessChecks_1.createTruthinessChecks)(state, writable, left)),
        statements: ifStatements,
        elseBody: luau_ast_1.default.list.make(),
    }));
    state.prereq(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Assignment, {
        left: writable,
        operator: "=",
        right: conditionId,
    }));
    return writable;
}
function transformLogicalOrCoalescingAssignmentExpression(state, node) {
    const operator = node.operatorToken.kind;
    if (operator === typescript_1.default.SyntaxKind.QuestionQuestionEqualsToken) {
        return transformCoalescingAssignmentExpression(state, node.left, node.right);
    }
    else if (operator === typescript_1.default.SyntaxKind.AmpersandAmpersandEqualsToken) {
        return transformLogicalAndAssignmentExpression(state, node.left, node.right);
    }
    else {
        return transformLogicalOrAssignmentExpression(state, node.left, node.right);
    }
}
function transformLogicalOrCoalescingAssignmentExpressionStatement(state, node) {
    return state.capturePrereqs(() => transformLogicalOrCoalescingAssignmentExpression(state, node));
}
//# sourceMappingURL=transformLogicalOrCoalescingAssignmentExpression.js.map