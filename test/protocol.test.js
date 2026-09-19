import test from 'node:test';import assert from 'node:assert/strict';
import {packet,parsePacket,parseStreamer,joinPacket} from '../api/protocol.js';
test('UTF-8 packet length and parsing',()=>{const p=packet(5,'\f대한민국\fviewer\f\f\f\f닉네임\f');assert.equal(parsePacket(p).parts[1],'대한민국');assert.equal(parsePacket(p.subarray(0,16)),null)});
test('join packet layout',()=>{const p=parsePacket(joinPacket('12345'));assert.equal(p.code,2);assert.equal(p.parts[1],'12345');assert.equal(p.parts.length,7)});
test('streamer input',()=>{assert.equal(parseStreamer('ecvhao'),'ecvhao');assert.equal(parseStreamer('https://play.sooplive.com/ecvhao/297126337'),'ecvhao');assert.throws(()=>parseStreamer('https://example.com/a'))});
