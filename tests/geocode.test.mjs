import { describe, expect, it } from "vitest";

import { findAddresses } from "../scripts/functions";

describe('findAddresses', () => {
    it.each([
        [`[딘타이펑] 서울특별시 송파구 잠실동40-1 롯데마트월드점 6층
 
        ☎ 02-2143-1651
         `, '서울특별시 송파구 잠실동40-1 롯데마트월드점 6층'],
        [`[The Mask Ent.] 서울특별시 양천구 신월동 965-5번지
        `, '서울특별시 양천구 신월동 965-5번지'],
        ['[유가네 닭갈비 부산대 2호점] 부산 금정구 장전동 422-32번지', '부산 금정구 장전동 422-32번지'],
        ['[피자꾼] 서울특별시 노원구 상계동 720-7 주공6단지 마상가 1층', '서울특별시 노원구 상계동 720-7 주공6단지 마상가 1층'],
        ['주소> 강원 원주시 원문로 336\n', '강원 원주시 원문로 336'],
        ['주소> 서울 중구 충무로 2가 192-1 (인현시장 내)', '서울 중구 충무로 2가 192-1'],
        ['세종시 연기면 당산로 122-6 (건강원) \n', '세종시 연기면 당산로 122-6'],
        ['세종특별자치시 조치원읍 교리 24-3\n', '세종특별자치시 조치원읍 교리 24-3'],
        ['서울 중구 세종대로14길 29\n', '서울 중구 세종대로14길 29'],
    ])('should find addresses', (text, expected) => {
        const matches = findAddresses(text);

        expect(matches).toBeTruthy();
        expect(matches[0]).toBe(expected);
    });
});

