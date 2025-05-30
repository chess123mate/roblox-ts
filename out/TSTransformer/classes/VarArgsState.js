"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarArgsState = void 0;
const luau_ast_1 = __importDefault(require("@roblox-ts/luau-ast"));
const bundle_1 = require("@roblox-ts/luau-ast/out/LuauAST/bundle");
function remove(statements, node) {
    if (statements.head === node)
        statements.head = node.next;
    if (statements.tail === node)
        statements.tail = node.prev;
    if (node.prev)
        node.prev.next = node.next;
    if (node.next)
        node.next.prev = node.prev;
}
function insertAfter(statements, after, value) {
    const node = { value };
    if (statements.tail === after) {
        statements.tail = node;
    }
    else {
        after.next.prev = node;
        node.next = after.next;
    }
    node.prev = after;
    after.next = node;
    return node;
}
function insertBefore(statements, before, value) {
    const node = { value };
    if (statements.head === before) {
        statements.head = node;
    }
    else {
        before.prev.next = node;
        node.prev = before.prev;
    }
    node.next = before;
    before.prev = node;
    return node;
}
const varArgsLiteral = luau_ast_1.default.create(bundle_1.SyntaxKind.VarArgsLiteral, {});
const selectIdentifier = luau_ast_1.default.create(bundle_1.SyntaxKind.Identifier, { name: "select" });
const selectLengthCall = luau_ast_1.default.create(bundle_1.SyntaxKind.CallExpression, {
    expression: selectIdentifier,
    args: luau_ast_1.default.list.make(luau_ast_1.default.create(bundle_1.SyntaxKind.StringLiteral, { value: "#" }), varArgsLiteral),
});
const selectArg0 = luau_ast_1.default.create(bundle_1.SyntaxKind.ParenthesizedExpression, {
    expression: varArgsLiteral,
});
const iLiteral = luau_ast_1.default.create(bundle_1.SyntaxKind.Identifier, { name: "i" });
const oneLiteral = luau_ast_1.default.create(bundle_1.SyntaxKind.NumberLiteral, { value: "1" });
const varArgsAsTable = luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.Array, {
    members: luau_ast_1.default.list.make(luau_ast_1.default.create(luau_ast_1.default.SyntaxKind.VarArgsLiteral, {})),
});
class VarArgsState {
    constructor(statements) {
        this.statements = statements;
        this.safe = true;
        this.usesUnpack = false;
        this.usesFirst = false;
        this.usesLast = false;
        this.usesLength = false;
        this.lengthUseCount = 0;
        this.usages = [];
        this.initialNode = statements.tail;
        this.name = this.initialNode.value.left.name;
        console.log(`>>start<< ${this.name}`);
    }
    recordUnsafe() {
        console.log(`\trecordUnsafe ${this.name}`);
        this.safe = false;
    }
    recordSizeUsage(luaNode) {
        console.log(`\trecordSizeUsage ${this.name}`);
        this.usages.push({
            type: "size",
            node: luaNode,
        });
        this.lengthUseCount++;
    }
    recordIndexUsage(luaNode) {
        this.usages.push({
            type: "index",
            node: luaNode,
        });
    }
    recordUnpackUsage(luaNode) {
        this.usesUnpack = true;
        this.usages.push({
            type: "unpack",
            node: luaNode,
        });
    }
    recordForOfUsage(expression, luaNode) {
        console.log(`\trecordForOf ${this.name}`);
        this.usages.push({
            type: "forOf",
            node: luaNode,
        });
    }
    endOfScope_runOptimizations() {
        console.log(`endOfScope. safe? ${this.safe}`);
        if (!this.safe)
            return;
        if (this.usesUnpack && (this.usesFirst || this.usesLast || this.usesLength))
            return;
        if (this.lengthUseCount > 1) {
            this.usesLength = true;
        }
        let firstIdentifier;
        let lastIdentifier;
        let lengthIdentifier;
        {
            let curNode = this.initialNode;
            if (this.usesFirst) {
                firstIdentifier = luau_ast_1.default.tempId(`${this.name}_first`);
                curNode = insertAfter(this.statements, curNode, luau_ast_1.default.create(bundle_1.SyntaxKind.VariableDeclaration, {
                    left: firstIdentifier,
                    right: luau_ast_1.default.create(bundle_1.SyntaxKind.NumberLiteral, { value: "1" }),
                }));
            }
            if (this.usesLength) {
                lengthIdentifier = luau_ast_1.default.tempId(`${this.name}_length`);
                curNode = insertAfter(this.statements, curNode, luau_ast_1.default.create(bundle_1.SyntaxKind.VariableDeclaration, {
                    left: lengthIdentifier,
                    right: selectLengthCall,
                }));
            }
            if (this.usesLast) {
                lastIdentifier = luau_ast_1.default.tempId(`${this.name}_last`);
                curNode = insertAfter(this.statements, curNode, luau_ast_1.default.create(bundle_1.SyntaxKind.VariableDeclaration, {
                    left: lastIdentifier,
                    right: this.usesLength ? lengthIdentifier : selectLengthCall,
                }));
            }
        }
        remove(this.statements, this.initialNode);
        for (const usage of this.usages) {
            const type = usage.type;
            if (type === "size") {
                Object.assign(usage.node, this.usesLength ? lengthIdentifier : selectLengthCall);
            }
            else if (type === "index") {
                const indexNode = usage.node.index;
                if (indexNode.kind === bundle_1.SyntaxKind.NumberLiteral && indexNode.value === "1" && !this.usesFirst) {
                    Object.assign(usage.node, selectArg0);
                }
                else {
                    let expr = indexNode;
                    if (this.usesFirst) {
                        expr = luau_ast_1.default.create(bundle_1.SyntaxKind.BinaryExpression, {
                            left: expr,
                            operator: "+",
                            right: firstIdentifier,
                        });
                    }
                    let fullExpr = luau_ast_1.default.create(bundle_1.SyntaxKind.CallExpression, {
                        expression: selectIdentifier,
                        args: luau_ast_1.default.list.make(expr, varArgsLiteral),
                    });
                    if (this.usesLast) {
                        let varToUse;
                        if ((0, bundle_1.isAnyIdentifier)(expr)) {
                            varToUse = expr;
                        }
                        else {
                            varToUse = luau_ast_1.default.tempId();
                            throw Error("NOT IMPLEMENTABLE");
                        }
                        fullExpr = luau_ast_1.default.create(bundle_1.SyntaxKind.IfExpression, {
                            condition: luau_ast_1.default.create(bundle_1.SyntaxKind.BinaryExpression, {
                                left: varToUse,
                                operator: "<=",
                                right: lastIdentifier,
                            }),
                            expression: fullExpr,
                            alternative: luau_ast_1.default.nil(),
                        });
                    }
                    Object.assign(usage.node, fullExpr);
                }
            }
            else if (type === "unpack") {
                Object.assign(usage.node, varArgsLiteral);
            }
            else if (type === "forOf") {
                const ids = usage.node.value.ids;
                let id = ids.head.value;
                if (id.name === "_" || ((0, bundle_1.isTemporaryIdentifier)(id) && id.name === "")) {
                    id = iLiteral;
                }
                const start = this.usesFirst ? firstIdentifier : oneLiteral;
                const end = this.usesLast ? lastIdentifier : this.usesLength ? lengthIdentifier : selectLengthCall;
                const secondId = ids.head === ids.tail ? undefined : ids.tail.value;
                const statements = usage.node.value.statements;
                if (secondId) {
                    luau_ast_1.default.list.unshift(statements, luau_ast_1.default.create(bundle_1.SyntaxKind.VariableDeclaration, {
                        left: secondId,
                        right: luau_ast_1.default.call(selectIdentifier, [id, varArgsLiteral]),
                    }));
                }
                usage.node.value = luau_ast_1.default.create(bundle_1.SyntaxKind.NumericForStatement, {
                    id,
                    start,
                    end,
                    step: undefined,
                    statements,
                });
            }
            else {
                const _ = usage;
            }
        }
    }
}
exports.VarArgsState = VarArgsState;
//# sourceMappingURL=VarArgsState.js.map