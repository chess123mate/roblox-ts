import luau from "@roblox-ts/luau-ast";
import { TransformState } from "../..";
import ts from "typescript";
export declare function transformSpreadElement(state: TransformState, node: ts.SpreadElement): luau.Expression<luau.SyntaxKind>;
export declare function transformSpreadElementNoCheck(state: TransformState, node: ts.SpreadElement): luau.Expression<luau.SyntaxKind>;
