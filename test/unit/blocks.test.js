"use strict";

const { expect } = require("chai");
const { buildBlocks } = require("../../lib/blocks");

describe("buildBlocks", () => {
    it("merges directly adjacent registers into one block", () => {
        const defs = [
            { id: "a", address: 100, type: "u16" },
            { id: "b", address: 101, type: "u16" },
            { id: "c", address: 102, type: "u16" },
        ];
        const blocks = buildBlocks(defs);
        expect(blocks).to.have.lengthOf(1);
        expect(blocks[0]).to.include({ startAddress: 100, length: 3 });
        expect(blocks[0].defs).to.have.lengthOf(3);
    });

    it("merges registers separated by a small gap (within maxGap)", () => {
        const defs = [
            { id: "a", address: 100, type: "u16" },
            { id: "b", address: 103, type: "u16" },
        ];
        const blocks = buildBlocks(defs, { maxGap: 4 });
        expect(blocks).to.have.lengthOf(1);
        expect(blocks[0]).to.include({ startAddress: 100, length: 4 });
    });

    it("splits into separate blocks when the gap exceeds maxGap", () => {
        const defs = [
            { id: "a", address: 100, type: "u16" },
            { id: "b", address: 200, type: "u16" },
        ];
        const blocks = buildBlocks(defs, { maxGap: 4 });
        expect(blocks).to.have.lengthOf(2);
        expect(blocks[0].startAddress).to.equal(100);
        expect(blocks[1].startAddress).to.equal(200);
    });

    it("accounts for multi-word register types (u32) when computing block length", () => {
        const defs = [
            { id: "a", address: 100, type: "u16" },
            { id: "b", address: 101, type: "u32" }, // occupies 101-102
        ];
        const blocks = buildBlocks(defs);
        expect(blocks).to.have.lengthOf(1);
        expect(blocks[0].length).to.equal(3);
    });

    it("starts a new block when maxBlockLength would be exceeded", () => {
        const defs = [
            { id: "a", address: 100, type: "u16" },
            { id: "b", address: 101, type: "u16" },
        ];
        const blocks = buildBlocks(defs, { maxBlockLength: 1 });
        expect(blocks).to.have.lengthOf(2);
    });

    it("sorts input by address regardless of input order", () => {
        const defs = [
            { id: "b", address: 101, type: "u16" },
            { id: "a", address: 100, type: "u16" },
        ];
        const blocks = buildBlocks(defs);
        expect(blocks).to.have.lengthOf(1);
        expect(blocks[0].defs.map((d) => d.id)).to.deep.equal(["a", "b"]);
    });
});
