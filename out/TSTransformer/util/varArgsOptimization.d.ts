import luau from "@roblox-ts/luau-ast";
import { AnyIdentifier } from "@roblox-ts/luau-ast/out/LuauAST/bundle";
import { TransformState } from "../classes/TransformState";
import ts, { Node } from "typescript";
export interface VarArgsData {
    valueDeclaration: Node;
    id: luau.AnyIdentifier;
    useLengthVar: boolean;
    lengthId?: luau.AnyIdentifier;
}
export declare function analyzeVarArgsOptimization(state: TransformState, body: NonNullable<ts.FunctionLikeDeclarationBase["body"]>, parameter: ts.ParameterDeclaration, paramId: AnyIdentifier): VarArgsData | undefined;
export declare const varArgsLiteral: luau.VarArgsLiteral;
export declare const selectLengthCall: luau.CallExpression;
export declare function handleVarArgsParameterOptimization(statements: luau.List<luau.Statement>, varArgs: VarArgsData | undefined, paramId: luau.AnyIdentifier): void;
export declare function tryHandleVarArgsCallMacro(state: TransformState, callExpr: ts.CallExpression, macroSymbol: ts.Symbol): luau.CallExpression | luau.AnyIdentifier | undefined;
export declare function tryHandleVarArgsIndexableExpression(state: TransformState, node: ts.ElementAccessExpression, index: luau.Expression): luau.ParenthesizedExpression | undefined;
export declare function tryHandleVarArgsArraySpread(state: TransformState, node: ts.SpreadElement): luau.VarArgsLiteral | undefined;
export declare function varArgsForOfGetFirstStatementValue(indexId: luau.AnyIdentifier): luau.CallExpression;
export declare function transformVarArgsForOfResult(state: TransformState, node: ts.ForOfStatement, result: luau.List<luau.Statement>): luau.List<luau.Statement<luau.SyntaxKind>>;
