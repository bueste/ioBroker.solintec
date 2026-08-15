"use strict";

const { ModbusClient } = require("./modbusClient");

const DEFAULT_MAX_GAP = 4; // tolerate small gaps between registers in one block
const DEFAULT_MAX_BLOCK_LENGTH = 100; // stay well under typical Modbus TCP PDU limits

/**
 * Groups a list of register definitions into contiguous (or near-contiguous) Modbus
 * read blocks, so polling can read many registers with few requests instead of one
 * request per register.
 *
 * @param {Array<{address: number, type: string, length?: number}>} defs
 * @param {object} [opts]
 * @param {number} [opts.maxGap] maximum unused-register gap to still merge into one block
 * @param {number} [opts.maxBlockLength] maximum total register words per block
 * @returns {Array<{startAddress: number, length: number, defs: object[]}>}
 */
function buildBlocks(defs, opts = {}) {
    const maxGap = opts.maxGap ?? DEFAULT_MAX_GAP;
    const maxBlockLength = opts.maxBlockLength ?? DEFAULT_MAX_BLOCK_LENGTH;

    const sorted = [...defs].sort((a, b) => a.address - b.address);
    const blocks = [];

    for (const def of sorted) {
        const defLength = ModbusClient.registerLength(def);
        const defEnd = def.address + defLength;
        const last = blocks[blocks.length - 1];

        if (last) {
            const blockEnd = last.startAddress + last.length;
            const gap = def.address - blockEnd;
            const wouldBeLength = defEnd - last.startAddress;
            if (gap >= 0 && gap <= maxGap && wouldBeLength <= maxBlockLength) {
                last.length = wouldBeLength;
                last.defs.push(def);
                continue;
            }
        }

        blocks.push({
            startAddress: def.address,
            length: defLength,
            defs: [def],
        });
    }

    return blocks;
}

module.exports = { buildBlocks, DEFAULT_MAX_GAP, DEFAULT_MAX_BLOCK_LENGTH };
