export = () => {
	it("should allow ==", () => {
		expect(1 == 1).to.equal(true);
	});
	it("should allow !=", () => {
		expect(1 != (2 as number)).to.equal(true);
	});
	it("should have simple truthiness", () => {
		const n = 0;
		const m = 0 / 0;
		const s = "";
		if (n && m && s) {
			expect(true).to.equal(true);
		} else {
			expect(false).to.equal(true);
		}
	});
};
