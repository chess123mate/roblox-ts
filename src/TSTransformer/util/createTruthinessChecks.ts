import luau from "@roblox-ts/luau-ast";
import { TransformState } from "TSTransformer";
import ts from "typescript";

// Luau-style TS: assume truthiness was intended for Luau, so no truthiness checks required
export function willCreateTruthinessChecks(type: ts.Type) {
	return false;
	// return (
	// 	isPossiblyType(type, isNumberLiteralType(0)) ||
	// 	isPossiblyType(type, isNaNType) ||
	// 	isPossiblyType(type, isEmptyStringType)
	// );
}

export function createTruthinessChecks(state: TransformState, exp: luau.Expression, node: ts.Expression) {
	return exp;
	/*
	const type = state.getType(node);
	const isAssignableToZero = isPossiblyType(type, isNumberLiteralType(0));
	const isAssignableToNaN = isPossiblyType(type, isNaNType);
	const isAssignableToEmptyString = isPossiblyType(type, isEmptyStringType);


	if (isAssignableToZero || isAssignableToNaN || isAssignableToEmptyString) {
		exp = state.pushToVarIfComplex(exp, "value");
	}

	const checks = new Array<luau.Expression>();

	if (isAssignableToZero) {
		checks.push(luau.binary(exp, "~=", luau.number(0)));
	}

	// workaround for https://github.com/microsoft/TypeScript/issues/32778
	if (isAssignableToZero || isAssignableToNaN) {
		checks.push(luau.binary(exp, "==", exp));
	}

	if (isAssignableToEmptyString) {
		checks.push(luau.binary(exp, "~=", luau.string("")));
	}

	checks.push(exp);

	if (
		state.data.projectOptions.logTruthyChanges &&
		(isAssignableToZero || isAssignableToNaN || isAssignableToEmptyString)
	) {
		const checkStrs = new Array<string>();
		if (isAssignableToZero) checkStrs.push("0");
		if (isAssignableToZero || isAssignableToNaN) checkStrs.push("NaN");
		if (isAssignableToEmptyString) checkStrs.push('""');
		DiagnosticService.addDiagnostic(warnings.truthyChange(checkStrs.join(", "))(node));
	}

	return binaryExpressionChain(checks, "and");
	*/
}
