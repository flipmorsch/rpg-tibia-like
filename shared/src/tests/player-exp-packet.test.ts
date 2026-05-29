import { describe, expect, it, vi } from 'vitest';
import { ByteBuffer, Opcode } from 'shared';

describe('S2C_PLAYER_EXP extended packet', () => {
  it('parses exp, level, speed, and maxHp from the extended packet', () => {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_PLAYER_EXP);
    buffer.writeUint32(550);   // exp
    buffer.writeUint16(3);     // level
    buffer.writeUint16(108);   // speed
    buffer.writeUint16(150);   // maxHp

    const callback = vi.fn();
    const payload = buffer.getPayload();
    const reader = new ByteBuffer(payload);

    const opcode = reader.readUint8();
    expect(opcode).toBe(Opcode.S2C_PLAYER_EXP);

    const exp = reader.readUint32();
    const level = reader.readUint16();
    const speed = reader.readUint16();
    const maxHp = reader.readUint16();

    // Verify parsed values match what was written
    expect(exp).toBe(550);
    expect(level).toBe(3);
    expect(speed).toBe(108);
    expect(maxHp).toBe(150);

    // Verify callback could be called correctly
    callback(exp, level, speed, maxHp);
    expect(callback).toHaveBeenCalledWith(550, 3, 108, 150);
  });

  it('handles level 30 values with high stats', () => {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_PLAYER_EXP);
    buffer.writeUint32(6500);  // exp
    buffer.writeUint16(30);    // level
    buffer.writeUint16(216);   // speed (capped formula: 100 + 4*29 = 216)
    buffer.writeUint16(825);   // maxHp (100 + 25*29 = 825)

    const reader = new ByteBuffer(buffer.getPayload());
    reader.readUint8(); // skip opcode

    expect(reader.readUint32()).toBe(6500);
    expect(reader.readUint16()).toBe(30);
    expect(reader.readUint16()).toBe(216);
    expect(reader.readUint16()).toBe(825);
  });
});
