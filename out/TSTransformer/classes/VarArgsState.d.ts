import luau from "@roblox-ts/luau-ast";
import { List, ListNode, Node, SyntaxKind } from "@roblox-ts/luau-ast/out/LuauAST/bundle";
import ts from "typescript";
export declare class VarArgsState {
    private statements;
    private safe;
    private usesUnpack;
    private usesFirst;
    private usesLast;
    private usesLength;
    private lengthUseCount;
    private usages;
    name: string;
    private initialNode;
    constructor(statements: List<Node>);
    recordUnsafe(): void;
    recordSizeUsage(luaNode: luau.CallExpression): void;
    recordIndexUsage(luaNode: luau.ComputedIndexExpression): void;
    recordUnpackUsage(luaNode: luau.CallExpression): void;
    recordForOfUsage(expression: ts.Expression, luaNode: ListNode<luau.ForStatement>): void;
    endOfScope_runOptimizations(): void;
}
export type VarArgsUsage = {
    type: "size";
    node: Node<SyntaxKind.CallExpression>;
} | {
    type: "index";
    node: Node<SyntaxKind.ComputedIndexExpression>;
} | {
    type: "unpack";
    node: Node<SyntaxKind.CallExpression>;
} | {
    type: "forOf";
    node: ListNode<Node<SyntaxKind.ForStatement>>;
};
