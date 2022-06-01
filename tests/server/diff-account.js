import should from 'should';
import deepclone from 'lodash.clonedeep';

import diffAccounts from '../../server/lib/diff-accounts';

let A = {
    accessId: 0,
    label: 'Checking account',
    vendorAccountId: '1234abcd',
    iban: null,
    currency: null,
};

let copyA = deepclone(A);

let B = {
    accessId: 0,
    label: 'Savings account',
    vendorAccountId: '0147200001',
    iban: '1234 5678 9012 34',
    currency: 'dogecoin',
};

let copyB = deepclone(B);

// Same currency as B, to make sure it's not merged with B by default.
let C = {
    accessId: 0,
    label: 'Bury me with my money',
    vendorAccountId: 'theInternetz',
    currency: 'dogecoin',
};

let copyC = deepclone(C);

describe("diffing account when there's only one account", () => {
    it('should return an exact match for the same account', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A],
            [copyA]
        );

        perfectMatches.length.should.equal(1);

        let match = perfectMatches[0];
        match[0].should.equal(A);
        match[1].should.equal(copyA);

        providerOrphans.length.should.equal(0);
        knownOrphans.length.should.equal(0);
        duplicateCandidates.length.should.equal(0);
    });

    it("should insert a single provider's account", () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [],
            [A]
        );

        perfectMatches.length.should.equal(0);

        providerOrphans.length.should.equal(1);
        providerOrphans[0].should.equal(A);

        knownOrphans.length.should.equal(0);
        duplicateCandidates.length.should.equal(0);
    });

    it('should mark a known single account as orphan', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A],
            []
        );

        perfectMatches.length.should.equal(0);
        providerOrphans.length.should.equal(0);

        knownOrphans.length.should.equal(1);
        knownOrphans[0].should.equal(A);

        duplicateCandidates.length.should.equal(0);
    });

    it('should merge a single account when an iban has been added', () => {
        let changedA = {
            ...deepclone(A),
            iban: '1234 5678 9012 34',
        };

        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A],
            [changedA]
        );

        perfectMatches.length.should.equal(0);
        providerOrphans.length.should.equal(0);
        knownOrphans.length.should.equal(0);

        duplicateCandidates.length.should.equal(1);
        let pair = duplicateCandidates[0];
        pair[0].should.equal(A);
        pair[1].should.equal(changedA);
    });

    it('should merge a single account when the account number has been changed', () => {
        let changedA = {
            ...deepclone(A),
            vendorAccountId: 'lolololol',
        };
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A],
            [changedA]
        );

        perfectMatches.length.should.equal(0);
        providerOrphans.length.should.equal(0);
        knownOrphans.length.should.equal(0);

        duplicateCandidates.length.should.equal(1);
        let pair = duplicateCandidates[0];
        pair[0].should.equal(A);
        pair[1].should.equal(changedA);
    });
});

describe('diffing account when there are several accounts', () => {
    it('should find perfect matches in any order', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A, B, C],
            [copyB, copyC, copyA]
        );

        perfectMatches.length.should.equal(3);

        let match = perfectMatches[0];
        match[0].should.equal(A);
        match[1].should.equal(copyA);

        match = perfectMatches[1];
        match[0].should.equal(B);
        match[1].should.equal(copyB);

        match = perfectMatches[2];
        match[0].should.equal(C);
        match[1].should.equal(copyC);

        providerOrphans.length.should.equal(0);
        knownOrphans.length.should.equal(0);
        duplicateCandidates.length.should.equal(0);
    });

    it('should find kresus orphans', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A, B, C],
            [copyB, copyC]
        );

        perfectMatches.length.should.equal(2);

        let match = perfectMatches[0];
        match[0].should.equal(B);
        match[1].should.equal(copyB);

        match = perfectMatches[1];
        match[0].should.equal(C);
        match[1].should.equal(copyC);

        providerOrphans.length.should.equal(0);

        knownOrphans.length.should.equal(1);
        knownOrphans[0].should.equal(A);

        duplicateCandidates.length.should.equal(0);
    });

    it('should find provider orphans', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A, B],
            [A, copyB, C]
        );

        perfectMatches.length.should.equal(2);

        let match = perfectMatches[0];
        match[0].should.equal(A);
        match[1].should.equal(A);

        match = perfectMatches[1];
        match[0].should.equal(B);
        match[1].should.equal(copyB);

        knownOrphans.length.should.equal(0);

        providerOrphans.length.should.equal(1);
        providerOrphans[0].should.equal(C);

        duplicateCandidates.length.should.equal(0);
    });

    it('should provide meaningful merges', () => {
        let otherB = { ...deepclone(B), iban: null };
        let otherC = {
            ...deepclone(C),
            label: 'Comptes de Perrault',
            iban: '1234 5678 9012 34', // That's B's iban
        };

        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A, B, C],
            [otherB, otherC]
        );

        perfectMatches.length.should.equal(0);

        knownOrphans.length.should.equal(1);
        knownOrphans[0].should.equal(A);

        providerOrphans.length.should.equal(0);

        duplicateCandidates.length.should.equal(2);

        let pair = duplicateCandidates[0];
        pair[0].should.equal(B);
        pair[1].should.equal(otherB);

        pair = duplicateCandidates[1];
        pair[0].should.equal(C);
        pair[1].should.equal(otherC);
    });

    it('should not merge accounts that are too different', () => {
        let { perfectMatches, providerOrphans, knownOrphans, duplicateCandidates } = diffAccounts(
            [A, B],
            [C]
        );

        perfectMatches.length.should.equal(0);

        knownOrphans.length.should.equal(2);
        knownOrphans[0].should.equal(A);
        knownOrphans[1].should.equal(B);

        providerOrphans.length.should.equal(1);
        providerOrphans[0].should.equal(C);

        duplicateCandidates.length.should.equal(0);
    });
});
