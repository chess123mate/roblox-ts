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
exports.selectLengthCall = exports.varArgsLiteral = void 0;
exports.analyzeVarArgsOptimization = analyzeVarArgsOptimization;
exports.handleVarArgsParameterOptimization = handleVarArgsParameterOptimization;
exports.tryHandleVarArgsCallMacro = tryHandleVarArgsCallMacro;
exports.tryHandleVarArgsIndexableExpression = tryHandleVarArgsIndexableExpression;
exports.tryHandleVarArgsArraySpread = tryHandleVarArgsArraySpread;
exports.varArgsForOfGetFirstStatementValue = varArgsForOfGetFirstStatementValue;
exports.transformVarArgsForOfResult = transformVarArgsForOfResult;
const luau_ast_1 = __importDefault(require("@roblox-ts/luau-ast"));
const offset_1 = require("./offset");
const traversal_1 = require("./traversal");
const types_1 = require("./types");
const typescript_1 = __importStar(require("typescript"));
function analyzeVarArgsOptimization(state, body, parameter, paramId) {
    if (body.parent.asteriskToken !== undefined)
        return;
    let numShadows = 0;
    const shadowedStack = new Array();
    function pushVarArgs(name) {
        const shadowed = name === paramId.name;
        shadowedStack.push(shadowed);
        if (shadowed)
            numShadows++;
    }
    function pushNoVarArgs() {
        shadowedStack.push(false);
    }
    function popVarArgs() {
        const shadowed = shadowedStack.pop();
        if (shadowed)
            numShadows--;
    }
    let tryDepth = 0;
    function isIdentifierVarArgs(identifier) {
        const symbol = state.typeChecker.getSymbolAtLocation(identifier);
        if (!symbol || !symbol.valueDeclaration || symbol.valueDeclaration.kind !== typescript_1.default.SyntaxKind.Parameter) {
            return false;
        }
        if (identifier.getText() !== paramId.name) {
            return false;
        }
        if (numShadows > 0) {
            return false;
        }
        return true;
    }
    function isSafe_modify() {
        if ((shadowedStack.length > 0 && numShadows === 0) || tryDepth > 0) {
            unsafe = true;
            return false;
        }
        return true;
    }
    function isIdentifierSafeVarArgs(identifier) {
        return isIdentifierVarArgs(identifier) && isSafe_modify();
    }
    let sizeAccesses = 0;
    let unsafe = false;
    function visit(node) {
        if (unsafe)
            return;
        if (typescript_1.default.isIdentifier(node)) {
            if (!isIdentifierSafeVarArgs(node)) {
                return;
            }
            if (typescript_1.default.isAssignmentTarget((0, traversal_1.skipUpwards)(node))) {
                unsafe = true;
                return;
            }
            const top = (0, traversal_1.skipUpwards)(node);
            const parent = top.parent;
            if (typescript_1.default.isSpreadElement(parent)) {
                return;
            }
            if (typescript_1.default.isVariableDeclaration(parent)) {
                unsafe = true;
                return;
            }
            else if (typescript_1.default.isBinaryExpression(parent)) {
                unsafe = true;
                return;
            }
            if (typescript_1.default.isCallExpression(parent)) {
                unsafe = true;
                return;
            }
            if (typescript_1.default.isForOfStatement(parent)) {
                sizeAccesses++;
                return;
            }
            unsafe = true;
            return;
        }
        else if (typescript_1.default.isTypeQueryNode(node) || typescript_1.default.isTypeAlias(node) || typescript_1.default.isInterfaceDeclaration(node)) {
            return;
        }
        else if (typescript_1.default.isPropertyAccessExpression(node)) {
            const expression = (0, traversal_1.skipDownwards)(node.expression);
            if (!typescript_1.default.isIdentifier(expression) || !isIdentifierSafeVarArgs(expression)) {
                node.forEachChild(visit);
                return;
            }
            if (typescript_1.default.isAssignmentTarget(node)) {
                unsafe = true;
                return;
            }
            const type = state.getType(node.name);
            const symbol = (0, types_1.getFirstDefinedSymbol)(state, type);
            if (!symbol || symbol.escapedName !== "size") {
                unsafe = true;
                return;
            }
            sizeAccesses++;
        }
        else if (typescript_1.default.isElementAccessExpression(node)) {
            const expression = (0, traversal_1.skipDownwards)(node.expression);
            if (!typescript_1.default.isIdentifier(expression) || !isIdentifierSafeVarArgs(expression)) {
                node.forEachChild(visit);
                return;
            }
            if (typescript_1.default.isAssignmentTarget(node)) {
                unsafe = true;
                return;
            }
            const type = state.getType(node.argumentExpression);
            const okay = type.flags & (typescript_1.TypeFlags.Number | typescript_1.TypeFlags.NumberLiteral) ||
                (type.isStringLiteral() && type.value === "size");
            if (!okay) {
                unsafe = true;
                return;
            }
        }
        else if (typescript_1.default.isFunctionLikeDeclaration(node)) {
            const varArgs = node.parameters.find(value => value.dotDotDotToken !== undefined);
            if (varArgs) {
                pushVarArgs(varArgs.name.getText());
            }
            else {
                pushNoVarArgs();
            }
            node.forEachChild(visit);
            popVarArgs();
        }
        else if (typescript_1.default.isTryStatement(node)) {
            tryDepth++;
            node.forEachChild(visit);
            tryDepth--;
        }
        else if (typescript_1.default.isArrayLiteralExpression(node)) {
            let seenSpread = false;
            for (const e of node.elements) {
                if (typescript_1.default.isSpreadElement(e)) {
                    const expression = (0, traversal_1.skipDownwards)(e.expression);
                    if (typescript_1.default.isIdentifier(expression) && isIdentifierVarArgs(expression)) {
                        if (!isSafe_modify())
                            return;
                        if (!seenSpread) {
                            seenSpread = true;
                        }
                        else {
                            sizeAccesses++;
                        }
                    }
                }
            }
        }
        else {
            node.forEachChild(visit);
        }
    }
    visit(body);
    if (unsafe)
        return;
    return {
        id: paramId,
        valueDeclaration: parameter.symbol.valueDeclaration,
        useLengthVar: sizeAccesses > 1,
    };
}
exports.varArgsLiteral = luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VarArgsLiteral, {});
exports.selectLengthCall = luau_ast_1.default.call(luau_ast_1.default.globals.select, [luau_ast_1.default.string("#"), exports.varArgsLiteral]);
const selectArg0 = luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.ParenthesizedExpression, {
    expression: exports.varArgsLiteral,
});
const oneLiteral = luau_ast_1.default.number(1);
function handleVarArgsParameterOptimization(statements, varArgs, paramId) {
    if (varArgs) {
        if (varArgs.useLengthVar) {
            varArgs.lengthId = luau_ast_1.default.tempId(`${varArgs.id.name}_length`);
            luau_ast_1.default.list.push(statements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VariableDeclaration, {
                left: varArgs.lengthId,
                right: exports.selectLengthCall,
            }));
        }
    }
    else {
        luau_ast_1.default.list.push(statements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VariableDeclaration, {
            left: paramId,
            right: luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Array, {
                members: luau_ast_1.default.list.make(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VarArgsLiteral, {})),
            }),
        }));
    }
}
function tryHandleVarArgsCallMacro(state, callExpr, macroSymbol) {
    var _a;
    const expr = callExpr.expression;
    if (!typescript_1.default.isPropertyAccessExpression(expr) && !typescript_1.default.isElementAccessExpression(expr))
        return;
    const varArgs = state.getOptimizableVarArgsData(expr.expression);
    if (!varArgs)
        return;
    if (macroSymbol.name === "size") {
        return (_a = varArgs.lengthId) !== null && _a !== void 0 ? _a : exports.selectLengthCall;
    }
}
function tryHandleVarArgsIndexableExpression(state, node, index) {
    const varArgs = state.getOptimizableVarArgsData(node.expression);
    if (!varArgs)
        return;
    const argExpr = node.argumentExpression;
    let argsIndex;
    if (typescript_1.default.isNumericLiteral(argExpr)) {
        const num = state.typeChecker.getTypeAtLocation(argExpr).value;
        if (num === 0)
            return selectArg0;
        argsIndex = luau_ast_1.default.number(num + 1);
    }
    else {
        argsIndex = (0, offset_1.offset)(index, 1);
    }
    return luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.ParenthesizedExpression, {
        expression: luau_ast_1.default.call(luau_ast_1.default.globals.select, [argsIndex, exports.varArgsLiteral]),
    });
}
function tryHandleVarArgsArraySpread(state, node) {
    const varArgs = state.getOptimizableVarArgsData(node.expression);
    return varArgs ? exports.varArgsLiteral : undefined;
}
function varArgsForOfGetFirstStatementValue(indexId) {
    return luau_ast_1.default.call(luau_ast_1.default.globals.select, [indexId, exports.varArgsLiteral]);
}
function transformVarArgsForOfResult(state, node, result) {
    var _a;
    const varArgs = state.getOptimizableVarArgsData(node.expression);
    if (!varArgs)
        return result;
    let lNode = result.head;
    let forNode;
    while (true) {
        if (lNode.value.kind === luau_ast_1.default.SyntaxKind.ForStatement) {
            forNode = lNode.value;
            break;
        }
        lNode = lNode.next;
    }
    const ids = forNode.ids;
    let indexId = ids.head.value;
    const valueId = ids.tail.value;
    if (indexId.name === "") {
        indexId = luau_ast_1.default.tempId("i");
    }
    const statements = forNode.statements;
    luau_ast_1.default.list.unshift(statements, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VariableDeclaration, {
        left: valueId,
        right: luau_ast_1.default.call(luau_ast_1.default.globals.select, [indexId, exports.varArgsLiteral]),
    }));
    Object.assign(lNode.value, luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.NumericForStatement, {
        id: indexId,
        start: oneLiteral,
        end: (_a = varArgs.lengthId) !== null && _a !== void 0 ? _a : exports.selectLengthCall,
        step: undefined,
        statements,
    }));
    return result;
}
//# sourceMappingURL=varArgsOptimization.js.map