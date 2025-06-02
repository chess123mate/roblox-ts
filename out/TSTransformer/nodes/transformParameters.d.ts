import luau from "@roblox-ts/luau-ast";
import { TransformState } from "..";
import { VarArgsData } from "../util/varArgsOptimization";
import ts from "typescript";
export type FunctionLikeWithBody = ts.FunctionLikeDeclarationBase & {
    body: NonNullable<ts.FunctionLikeDeclarationBase["body"]>;
};
export declare function transformParameters(state: TransformState, node: FunctionLikeWithBody): {
    parameters: luau.List<luau.AnyIdentifier>;
    statements: luau.List<luau.Statement<luau.SyntaxKind>>;
    hasDotDotDot: boolean;
    varArgsData: VarArgsData | undefined;
};
