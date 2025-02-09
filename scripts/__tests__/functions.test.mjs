import { describe, expect, it } from "vitest";

import { findAddresses } from "../functions";

describe('findAddresses', () => {
    it.each([
        [`[딘타이펑] 서울특별시 송파구 잠실동40-1 롯데마트월드점 6층
 
        ☎ 02-2143-1651
         `, '서울특별시 송파구 잠실동40-1'],
        [`[The Mask Ent.] 서울특별시 양천구 신월동 965-5번지
        `, '서울특별시 양천구 신월동 965-5번지'],
        ['[유가네 닭갈비 부산대 2호점] 부산 금정구 장전동 422-32번지', '부산 금정구 장전동 422-32번지'],
        ['[피자꾼] 서울특별시 노원구 상계동 720-7 주공6단지 마상가 1층', '서울특별시 노원구 상계동 720-7'],
        ['주소> 강원 원주시 원문로 336\n', '강원 원주시 원문로 336'],
        ['주소> 서울 중구 충무로 2가 192-1 (인현시장 내)', '서울 중구 충무로 2가 192-1'],
        ['세종시 연기면 당산로 122-6 (건강원) \n', '세종시 연기면 당산로 122-6'],
        ['세종특별자치시 조치원읍 교리 24-3\n', '세종특별자치시 조치원읍 교리 24-3'],
        ['서울 중구 세종대로14길 29\n', '서울 중구 세종대로14길 29'],
        ['부산 북구 구포2동 1060-268', '부산 북구 구포2동 1060-268'],
        ['서울 성동구 성수1가 2동 13-441번지', '서울 성동구 성수1가 2동 13-441번지'],
        ['경기도 남양주시 홍유릉로 248번길 39 다남프라자', '경기도 남양주시 홍유릉로 248번길 39'],
        ['울산 중구 태화동126-1 (태화로237)', '울산 중구 태화동126-1'],
        ['강원도 양구군 양구읍 정림리', undefined],
        ['충청남도 서산시 해미면 읍성마을 4길 24', '충청남도 서산시 해미면 읍성마을 4길 24'],
        ['주소>  충남 서산시 부석면 천수만로 658-39 / (구) 부석면 창리 275-6', '충남 서산시 부석면 천수만로 658-39'],
        ['서울시 영등포구 선유로 11 KT&G 빌딩 5층', '서울시 영등포구 선유로 11'],
        ['서울 강북구 4.19로 69', '서울 강북구 4.19로 69'],
        ['(지번 : 경기도 성남시 분당구 서현동 335-2 1층', undefined],
        ['주소 : 경기 김포시 양촌읍 석모로 14-5 1', '경기 김포시 양촌읍 석모로 14-5'],
        ['경상남도 창원시 의창구 북면 외산리 산106-7', '경상남도 창원시 의창구 북면 외산리 산106-7'],
    ])('should find addresses', (text, expected) => {
        const matches = findAddresses(text);

        expect(matches).toBeTruthy();
        expect(matches[0]).toBe(expected);
    });
});

