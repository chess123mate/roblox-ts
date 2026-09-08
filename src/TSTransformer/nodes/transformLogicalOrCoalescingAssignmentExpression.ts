import luau from "@roblox-ts/luau-ast";
import { WritableExpression } from "@roblox-ts/luau-ast/out/LuauAST/bundle";
import { TransformState } from "TSTransformer/classes/TransformState";
import { transformExpression } from "TSTransformer/nodes/expressions/transformExpression";
import { transformWritableExpression } from "TSTransformer/nodes/transformWritable";
import { createTruthinessChecks } from "TSTransformer/util/createTruthinessChecks";
import { isBooleanLiteralType, isPossiblyType } from "TSTransformer/util/types";
import ts from "typescript";

/** Returns an expression if optimization occurred (in which case nothing further to be done) */
function optimizedExpression(
	state: TransformState,
	writable: WritableExpression,
	value: luau.Expression,
	operator: luau.BinaryOperator,
) {
	if (luau.isAnyIdentifier(writable)) {
		// `var ||= 3` --> `var = var or 3`, simplified assuming there are no truthiness checks
		state.prereq(
			luau.create(luau.SyntaxKind.Assignment, {
				left: writable,
				operator: "=",
				right: luau.create(luau.SyntaxKind.BinaryExpression, {
					left: writable,
					operator,
					right: value,
				}),
			}),
		);
		return writable;
	}
}

function transformCoalescingAssignmentExpression(
	state: TransformState,
	left: ts.LeftHandSideExpression,
	right: ts.Expression,
) {
	const writable = transformWritableExpression(state, left, true);
	const [value, valuePreqreqs] = state.capture(() => transformExpression(state, right));

	// Only consider optimization if left is a non-boolean variable
	if (ts.isIdentifier(left) && !isPossiblyType(state.getType(left), isBooleanLiteralType(state, false))) {
		const optimized = optimizedExpression(state, writable, value, "or");
		if (optimized) return optimized;
	}

	const ifStatements = luau.list.make<luau.Statement>();
	luau.list.pushList(ifStatements, valuePreqreqs);
	luau.list.push(
		ifStatements,
		luau.create(luau.SyntaxKind.Assignment, {
			left: writable,
			operator: "=",
			right: value,
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.IfStatement, {
			condition: luau.binary(writable, "==", luau.nil()),
			statements: ifStatements,
			elseBody: luau.list.make(),
		}),
	);

	return writable;
}

function transformLogicalAndAssignmentExpression(
	state: TransformState,
	left: ts.LeftHandSideExpression,
	right: ts.Expression,
) {
	const writable = transformWritableExpression(state, left, true);
	const [value, valuePreqreqs] = state.capture(() => transformExpression(state, right));

	const optimized = optimizedExpression(state, writable, value, "and");
	if (optimized) return optimized;
	const conditionId = state.pushToVar(writable, "condition");

	const ifStatements = luau.list.make<luau.Statement>();
	luau.list.pushList(ifStatements, valuePreqreqs);
	luau.list.push(
		ifStatements,
		luau.create(luau.SyntaxKind.Assignment, {
			left: conditionId,
			operator: "=",
			right: value,
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.IfStatement, {
			condition: createTruthinessChecks(state, writable, left),
			statements: ifStatements,
			elseBody: luau.list.make(),
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.Assignment, {
			left: writable,
			operator: "=",
			right: conditionId,
		}),
	);

	return writable;
}

function transformLogicalOrAssignmentExpression(
	state: TransformState,
	left: ts.LeftHandSideExpression,
	right: ts.Expression,
) {
	const writable = transformWritableExpression(state, left, true);
	const [value, valuePreqreqs] = state.capture(() => transformExpression(state, right));

	const optimized = optimizedExpression(state, writable, value, "or");
	if (optimized) return optimized;
	const conditionId = state.pushToVar(writable, "condition");

	const ifStatements = luau.list.make<luau.Statement>();
	luau.list.pushList(ifStatements, valuePreqreqs);
	luau.list.push(
		ifStatements,
		luau.create(luau.SyntaxKind.Assignment, {
			left: conditionId,
			operator: "=",
			right: value,
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.IfStatement, {
			condition: luau.unary("not", createTruthinessChecks(state, writable, left)),
			statements: ifStatements,
			elseBody: luau.list.make(),
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.Assignment, {
			left: writable,
			operator: "=",
			right: conditionId,
		}),
	);

	return writable;
}

export function transformLogicalOrCoalescingAssignmentExpression(
	state: TransformState,
	node: ts.AssignmentExpression<ts.Token<ts.LogicalOrCoalescingAssignmentOperator>>,
) {
	const operator = node.operatorToken.kind;
	if (operator === ts.SyntaxKind.QuestionQuestionEqualsToken) {
		return transformCoalescingAssignmentExpression(state, node.left, node.right);
	} else if (operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken) {
		return transformLogicalAndAssignmentExpression(state, node.left, node.right);
	} else {
		return transformLogicalOrAssignmentExpression(state, node.left, node.right);
	}
}

export function transformLogicalOrCoalescingAssignmentExpressionStatement(
	state: TransformState,
	node: ts.AssignmentExpression<ts.Token<ts.LogicalOrCoalescingAssignmentOperator>>,
): luau.List<luau.Statement> {
	return state.capturePrereqs(() => transformLogicalOrCoalescingAssignmentExpression(state, node));
}
