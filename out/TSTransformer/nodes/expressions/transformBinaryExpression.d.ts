import { Expression } from "@roblox-ts/luau-ast/out/LuauAST/bundle";
import { TransformState } from "../..";
import ts from "typescript";
export declare function transformBinaryExpression(state: TransformState, node: ts.BinaryExpression): Expression;
