import { describe, it, expect } from 'vitest';
import { ByteBuffer } from '../protocol.js';

describe('ByteBuffer Serialization', () => {
  it('should read and write uint8 values correctly', () => {
    const bb = new ByteBuffer(10);
    bb.writeUint8(42);
    bb.writeUint8(255);
    
    expect(bb.writeOffset).toBe(2);
    
    expect(bb.readUint8()).toBe(42);
    expect(bb.readUint8()).toBe(255);
    expect(bb.readOffset).toBe(2);
  });

  it('should read and write uint16 values correctly', () => {
    const bb = new ByteBuffer(10);
    bb.writeUint16(12345);
    bb.writeUint16(0xFFFF);
    
    expect(bb.writeOffset).toBe(4);
    
    expect(bb.readUint16()).toBe(12345);
    expect(bb.readUint16()).toBe(0xFFFF);
    expect(bb.readOffset).toBe(4);
  });

  it('should read and write uint32 and float32 values correctly', () => {
    const bb = new ByteBuffer(16);
    bb.writeUint32(987654321);
    bb.writeFloat32(123.456);
    
    expect(bb.writeOffset).toBe(8);
    
    expect(bb.readUint32()).toBe(987654321);
    expect(Math.abs(bb.readFloat32() - 123.456)).toBeLessThan(0.001);
  });

  it('should read and write string values correctly', () => {
    const bb = new ByteBuffer(32);
    bb.writeString('Hello Tibado!');
    
    // length of string (13 bytes) + 2 bytes for the length uint16
    expect(bb.writeOffset).toBe(15);
    
    expect(bb.readString()).toBe('Hello Tibado!');
  });

  it('should auto-resize capacity when ensureCapacity is triggered', () => {
    const bb = new ByteBuffer(2);
    bb.writeUint8(1);
    bb.writeUint8(2);
    
    // writing third byte should resize the buffer
    bb.writeUint8(3);
    
    expect(bb.buffer.length).toBeGreaterThanOrEqual(3);
    expect(bb.readUint8()).toBe(1);
    expect(bb.readUint8()).toBe(2);
    expect(bb.readUint8()).toBe(3);
  });

  it('should throw out of bounds read errors', () => {
    const bb = new ByteBuffer(1);
    bb.writeUint8(1);
    
    expect(bb.readUint8()).toBe(1);
    expect(() => bb.readUint8()).toThrow('Out of bounds read: Uint8');
  });

  it('should reset offsets correctly', () => {
    const bb = new ByteBuffer(10);
    bb.writeUint8(100);
    bb.readUint8();
    
    bb.reset();
    expect(bb.writeOffset).toBe(0);
    expect(bb.readOffset).toBe(0);
  });

  it('should return correct payload slice', () => {
    const bb = new ByteBuffer(10);
    bb.writeUint8(5);
    bb.writeUint8(10);
    
    const payload = bb.getPayload();
    expect(payload.length).toBe(2);
    expect(payload[0]).toBe(5);
    expect(payload[1]).toBe(10);
  });
});
